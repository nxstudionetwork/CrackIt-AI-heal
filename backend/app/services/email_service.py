import smtplib
import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

FRONTEND_URL = "http://localhost:5173"


def _is_smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def _build_message(to_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.EMAIL_FROM} <{settings.EMAIL_FROM}>"
    msg["To"] = to_email
    msg["Subject"] = subject

    if text_body:
        msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))
    return msg


def _send_smtp(to_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> bool:
    if not _is_smtp_configured():
        logger.warning("SMTP not configured — skipping email send to %s", to_email)
        return True

    msg = _build_message(to_email, subject, html_body, text_body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            if settings.SMTP_PORT == 587 or settings.SMTP_PORT == 465:
                server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Email sent to %s — subject: %s", to_email, subject)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)
        return False


async def send_email(to_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> bool:
    return await asyncio.to_thread(_send_smtp, to_email, subject, html_body, text_body)


async def send_verification_email(to_email: str, name: str, token: str) -> bool:
    verify_url = f"{FRONTEND_URL}/verify-email?token={token}"
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:40px 30px;text-align:center;">
<h1 style="color:#00d4ff;margin:0;font-size:28px;">CrackIt</h1>
<p style="color:#a0aec0;margin:8px 0 0;font-size:14px;">Cybersecurity Operating System</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<h2 style="color:#1a1a2e;margin:0 0 16px;">Verify Your Email</h2>
<p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">Hi {name},</p>
<p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">Thank you for registering with CrackIt. Please verify your email address by clicking the button below.</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
<td style="background:#00d4ff;border-radius:8px;"><a href="{verify_url}" style="display:inline-block;padding:14px 36px;color:#1a1a2e;text-decoration:none;font-weight:600;font-size:16px;">Verify Email Address</a></td>
</tr></table>
<p style="color:#718096;line-height:1.6;margin:24px 0 0;font-size:13px;">If the button doesn't work, copy and paste this link into your browser:<br><a href="{verify_url}" style="color:#00d4ff;">{verify_url}</a></p>
<p style="color:#a0aec0;font-size:12px;margin:32px 0 0;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
</td></tr>
<tr><td style="background:#f8f9fa;padding:20px 30px;text-align:center;">
<p style="color:#a0aec0;margin:0;font-size:12px;">&copy; 2024 CrackIt. All rights reserved.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>"""
    text = (
        f"Hi {name},\n\n"
        f"Thank you for registering with CrackIt. Please verify your email by visiting:\n{verify_url}\n\n"
        f"This link expires in 24 hours.\n"
        f"If you didn't create an account, you can safely ignore this email."
    )
    return await send_email(to_email, "Verify Your CrackIt Email", html, text)


async def send_welcome_email(to_email: str, name: str) -> bool:
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:40px 30px;text-align:center;">
<h1 style="color:#00d4ff;margin:0;font-size:28px;">CrackIt</h1>
<p style="color:#a0aec0;margin:8px 0 0;font-size:14px;">Cybersecurity Operating System</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<h2 style="color:#1a1a2e;margin:0 0 16px;">Welcome to CrackIt!</h2>
<p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">Hi {name},</p>
<p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">Your email has been verified and your account is now active. You're ready to explore CrackIt's cybersecurity tools and features.</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
<td style="background:#00d4ff;border-radius:8px;"><a href="{FRONTEND_URL}/dashboard" style="display:inline-block;padding:14px 36px;color:#1a1a2e;text-decoration:none;font-weight:600;font-size:16px;">Go to Dashboard</a></td>
</tr></table>
<p style="color:#718096;line-height:1.6;margin:24px 0 0;">Here are a few things you can do to get started:</p>
<ul style="color:#4a5568;line-height:1.8;padding-left:20px;">
<li>Create your first project</li>
<li>Run a security scan</li>
<li>Explore the AI assistant</li>
</ul>
</td></tr>
<tr><td style="background:#f8f9fa;padding:20px 30px;text-align:center;">
<p style="color:#a0aec0;margin:0;font-size:12px;">&copy; 2024 CrackIt. All rights reserved.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>"""
    text = (
        f"Hi {name},\n\n"
        f"Your email has been verified and your account is now active.\n"
        f"Visit {FRONTEND_URL}/dashboard to get started.\n\n"
        f"Here are a few things you can do:\n"
        f"- Create your first project\n"
        f"- Run a security scan\n"
        f"- Explore the AI assistant\n\n"
        f"The CrackIt Team"
    )
    return await send_email(to_email, "Welcome to CrackIt!", html, text)


async def send_password_reset_email(to_email: str, name: str, token: str) -> bool:
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:40px 30px;text-align:center;">
<h1 style="color:#00d4ff;margin:0;font-size:28px;">CrackIt</h1>
<p style="color:#a0aec0;margin:8px 0 0;font-size:14px;">Cybersecurity Operating System</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<h2 style="color:#1a1a2e;margin:0 0 16px;">Reset Your Password</h2>
<p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">Hi {name},</p>
<p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">We received a request to reset your password. Click the button below to choose a new password.</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
<td style="background:#e53e3e;border-radius:8px;"><a href="{reset_url}" style="display:inline-block;padding:14px 36px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">Reset Password</a></td>
</tr></table>
<p style="color:#718096;line-height:1.6;margin:24px 0 0;font-size:13px;">If the button doesn't work, copy and paste this link into your browser:<br><a href="{reset_url}" style="color:#e53e3e;">{reset_url}</a></p>
<p style="color:#a0aec0;font-size:12px;margin:32px 0 0;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
</td></tr>
<tr><td style="background:#f8f9fa;padding:20px 30px;text-align:center;">
<p style="color:#a0aec0;margin:0;font-size:12px;">&copy; 2024 CrackIt. All rights reserved.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>"""
    text = (
        f"Hi {name},\n\n"
        f"We received a request to reset your password. Visit the link below to choose a new password:\n{reset_url}\n\n"
        f"This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email."
    )
    return await send_email(to_email, "Reset Your CrackIt Password", html, text)


async def send_password_changed_email(to_email: str, name: str) -> bool:
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:40px 30px;text-align:center;">
<h1 style="color:#00d4ff;margin:0;font-size:28px;">CrackIt</h1>
<p style="color:#a0aec0;margin:8px 0 0;font-size:14px;">Cybersecurity Operating System</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<h2 style="color:#1a1a2e;margin:0 0 16px;">Password Changed</h2>
<p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">Hi {name},</p>
<p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">Your CrackIt account password has been successfully changed. If you did not make this change, please contact our support team immediately.</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
<td style="background:#38a169;border-radius:8px;"><a href="{FRONTEND_URL}/login" style="display:inline-block;padding:14px 36px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">Sign In</a></td>
</tr></table>
</td></tr>
<tr><td style="background:#f8f9fa;padding:20px 30px;text-align:center;">
<p style="color:#a0aec0;margin:0;font-size:12px;">&copy; 2024 CrackIt. All rights reserved.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>"""
    text = (
        f"Hi {name},\n\n"
        f"Your CrackIt account password has been successfully changed.\n"
        f"If you did not make this change, please contact our support team immediately.\n\n"
        f"The CrackIt Team"
    )
    return await send_email(to_email, "CrackIt — Password Changed", html, text)


async def send_new_login_email(to_email: str, name: str, ip_address: str, user_agent: str) -> bool:
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:40px 30px;text-align:center;">
<h1 style="color:#00d4ff;margin:0;font-size:28px;">CrackIt</h1>
<p style="color:#a0aec0;margin:8px 0 0;font-size:14px;">Cybersecurity Operating System</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<h2 style="color:#1a1a2e;margin:0 0 16px;">New Login Detected</h2>
<p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">Hi {name},</p>
<p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">We detected a new login to your CrackIt account.</p>
<table width="100%" cellpadding="12" cellspacing="0" style="background:#f8f9fa;border-radius:8px;margin:0 0 24px;">
<tr><td style="color:#4a5568;font-size:14px;"><strong>IP Address:</strong></td><td style="color:#1a1a2e;font-size:14px;">{ip_address}</td></tr>
<tr><td style="color:#4a5568;font-size:14px;"><strong>Device:</strong></td><td style="color:#1a1a2e;font-size:14px;word-break:break-all;">{user_agent}</td></tr>
</table>
<p style="color:#718096;line-height:1.6;margin:0 0 0;">If this was you, no action is needed. If you don't recognize this activity, please change your password immediately and contact support.</p>
</td></tr>
<tr><td style="background:#f8f9fa;padding:20px 30px;text-align:center;">
<p style="color:#a0aec0;margin:0;font-size:12px;">&copy; 2024 CrackIt. All rights reserved.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>"""
    text = (
        f"Hi {name},\n\n"
        f"We detected a new login to your CrackIt account.\n\n"
        f"IP Address: {ip_address}\n"
        f"Device: {user_agent}\n\n"
        f"If this was you, no action is needed.\n"
        f"If you don't recognize this activity, please change your password immediately."
    )
    return await send_email(to_email, "CrackIt — New Login Detected", html, text)
