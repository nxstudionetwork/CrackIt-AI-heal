"""Scan Engine — Real background scan execution."""
import asyncio
import logging
from datetime import datetime, timezone
from uuid import UUID
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.findings import Scan, Finding

logger = logging.getLogger(__name__)

class ScanEngine:
    """Executes security scans using subprocess."""

    SCAN_TYPES = {
        "quick-scan": {"description": "Quick security check", "timeout": 120},
        "deep-scan": {"description": "Deep security analysis", "timeout": 600},
        "header-scan": {"description": "HTTP header security check", "timeout": 60},
        "ssl-scan": {"description": "SSL/TLS configuration check", "timeout": 120},
        "port-scan": {"description": "Port scanning", "timeout": 300},
    }

    @staticmethod
    async def execute_scan(scan_id: UUID, db_factory):
        async with db_factory() as db:
            result = await db.execute(select(Scan).where(Scan.id == scan_id))
            scan = result.scalar_one_or_none()
            if not scan:
                return

            scan.status = "running"
            scan.started_at = datetime.now(timezone.utc)
            await db.commit()

            try:
                target = scan.target or ""
                scan_type = scan.scan_type or "quick-scan"

                findings = []

                if scan_type in ("quick-scan", "header-scan"):
                    findings.extend(await ScanEngine._check_headers(target))

                if scan_type in ("quick-scan", "ssl-scan"):
                    findings.extend(await ScanEngine._check_ssl(target))

                if scan_type == "deep-scan":
                    findings.extend(await ScanEngine._check_headers(target))
                    findings.extend(await ScanEngine._check_ssl(target))
                    findings.extend(await ScanEngine._check_paths(target))

                if scan_type == "port-scan":
                    findings.extend(await ScanEngine._check_common_ports(target))

                for f_data in findings:
                    finding = Finding(
                        project_id=scan.project_id,
                        scan_id=scan_id,
                        title=f_data["title"],
                        description=f_data.get("description", ""),
                        severity=f_data["severity"],
                        status="open",
                        category=f_data.get("category", "scan"),
                        affected_resource=target,
                        evidence=f_data.get("evidence", ""),
                        analyzer=scan_type,
                    )
                    db.add(finding)

                scan.status = "completed"
                scan.progress = 100
                scan.completed_at = datetime.now(timezone.utc)
                scan.result_summary = {"findings_count": len(findings), "scan_type": scan_type, "target": target}
                await db.commit()

            except Exception as e:
                scan.status = "failed"
                scan.error_message = str(e)
                scan.completed_at = datetime.now(timezone.utc)
                await db.commit()
                logger.error(f"Scan {scan_id} failed: {e}")

    @staticmethod
    async def _check_headers(target: str) -> List[Dict]:
        import httpx
        findings = []
        try:
            url = target if target.startswith("http") else f"https://{target}"
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(url)
                headers = response.headers

                security_headers = {
                    "strict-transport-security": ("HSTS Header Missing", "high", "Add Strict-Transport-Security header"),
                    "x-content-type-options": ("X-Content-Type-Options Missing", "medium", "Add X-Content-Type-Options: nosniff"),
                    "x-frame-options": ("X-Frame-Options Missing", "medium", "Add X-Frame-Options: DENY or SAMEORIGIN"),
                    "content-security-policy": ("Content-Security-Policy Missing", "high", "Implement a Content-Security-Policy"),
                    "x-xss-protection": ("X-XSS-Protection Missing", "low", "Add X-XSS-Protection header"),
                    "referrer-policy": ("Referrer-Policy Missing", "low", "Add Referrer-Policy header"),
                    "permissions-policy": ("Permissions-Policy Missing", "low", "Add Permissions-Policy header"),
                }

                for header, (title, severity, remediation) in security_headers.items():
                    if header not in headers:
                        findings.append({
                            "title": title,
                            "description": f"The HTTP header '{header}' is not set on {url}.",
                            "severity": severity,
                            "category": "security-headers",
                            "evidence": f"Response headers: {dict(headers)}",
                            "remediation": remediation,
                        })

                if "server" in headers:
                    findings.append({
                        "title": "Server Header Disclosure",
                        "description": f"The server header reveals: {headers['server']}",
                        "severity": "low",
                        "category": "information-disclosure",
                        "evidence": f"Server: {headers['server']}",
                        "remediation": "Remove or obscure the Server header",
                    })
        except Exception as e:
            findings.append({
                "title": "Connection Failed",
                "description": f"Could not connect to {target}: {str(e)}",
                "severity": "info",
                "category": "connectivity",
            })
        return findings

    @staticmethod
    async def _check_ssl(target: str) -> List[Dict]:
        import ssl
        import socket
        findings = []
        try:
            hostname = target.replace("https://", "").replace("http://", "").split("/")[0].split(":")[0]
            context = ssl.create_default_context()
            with socket.create_connection((hostname, 443), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    version = ssock.version()

                    from datetime import datetime as dt
                    not_after = dt.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
                    days_left = (not_after - dt.utcnow()).days
                    if days_left < 30:
                        findings.append({
                            "title": "SSL Certificate Expiring Soon",
                            "description": f"Certificate expires in {days_left} days",
                            "severity": "high" if days_left < 7 else "medium",
                            "category": "ssl-tls",
                            "evidence": f"Expires: {cert['notAfter']}",
                            "remediation": "Renew the SSL certificate",
                        })

                    if version and ("TLSv1.0" in version or "TLSv1.1" in version):
                        findings.append({
                            "title": "Deprecated TLS Version",
                            "description": f"Server supports {version}",
                            "severity": "high",
                            "category": "ssl-tls",
                            "remediation": "Disable TLSv1.0 and TLSv1.1, use TLSv1.2+",
                        })
        except ssl.SSLCertVerificationError as e:
            findings.append({
                "title": "SSL Certificate Verification Failed",
                "description": str(e),
                "severity": "critical",
                "category": "ssl-tls",
                "remediation": "Fix SSL certificate configuration",
            })
        except Exception:
            pass
        return findings

    @staticmethod
    async def _check_paths(target: str) -> List[Dict]:
        import httpx
        findings = []
        url = target if target.startswith("http") else f"https://{target}"
        sensitive_paths = ["/.env", "/.git/config", "/robots.txt", "/sitemap.xml", "/wp-admin/", "/phpmyadmin/"]

        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as client:
                for path in sensitive_paths:
                    try:
                        resp = await client.get(f"{url.rstrip('/')}{path}")
                        if resp.status_code == 200 and path == "/.env":
                            findings.append({
                                "title": ".env File Accessible",
                                "description": f"The .env file is publicly accessible at {url}{path}",
                                "severity": "critical",
                                "category": "sensitive-data",
                                "evidence": f"HTTP {resp.status_code}",
                                "remediation": "Block public access to .env files",
                            })
                        elif resp.status_code == 200 and path == "/.git/config":
                            findings.append({
                                "title": ".git Directory Accessible",
                                "description": "The .git directory is publicly accessible",
                                "severity": "critical",
                                "category": "sensitive-data",
                                "remediation": "Block public access to .git directories",
                            })
                    except Exception:
                        continue
        except Exception:
            pass
        return findings

    @staticmethod
    async def _check_common_ports(target: str) -> List[Dict]:
        import socket
        findings = []
        hostname = target.replace("https://", "").replace("http://", "").split("/")[0].split(":")[0]
        common_ports = {22: "SSH", 80: "HTTP", 443: "HTTPS", 3306: "MySQL", 5432: "PostgreSQL", 6379: "Redis", 8080: "HTTP-Alt", 27017: "MongoDB"}

        for port, service in common_ports.items():
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex((hostname, port))
                if result == 0:
                    if service in ("MySQL", "PostgreSQL", "Redis", "MongoDB"):
                        findings.append({
                            "title": f"{service} Port Open ({port})",
                            "description": f"Port {port} ({service}) is accessible from the internet",
                            "severity": "high",
                            "category": "network",
                            "evidence": f"Port {port} is open",
                            "remediation": f"Restrict access to port {port} via firewall",
                        })
                sock.close()
            except Exception:
                continue
        return findings


async def start_scan(scan_id: UUID, db_factory):
    asyncio.create_task(ScanEngine.execute_scan(scan_id, db_factory))
