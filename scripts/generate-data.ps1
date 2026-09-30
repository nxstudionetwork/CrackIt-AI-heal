# Generate mock JSON data for CrackIt
$basePath = "C:\Users\AICOE 5\Downloads\CrackIt\assets\data"

function New-RandomDate($daysBack) {
    $offset = Get-Random -Minimum 0 -Maximum ($daysBack * 86400000)
    return (Get-Date).AddMilliseconds(-$offset).ToString("o")
}

# Projects (50)
$projectNames = @(
    "Operation Nightfall","Project Sentinel","Red Team Alpha","Blue Shield Initiative",
    "CVE Research 2025","Infrastructure Audit","Cloud Security Review","Pen Test Q2",
    "Threat Intel Pipeline","Zero Trust Migration","SOC Enhancement","Incident Response Plan",
    "Network Segmentation","API Security Assessment","Mobile App Pentest","IoT Security Scan",
    "Compliance Framework","Data Loss Prevention","Identity Management","Endpoint Hardening",
    "Supply Chain Audit","Ransomware Preparedness","Dark Web Monitoring","Phishing Simulation",
    "Vulnerability Remediation","Security Awareness","DevSecOps Integration","Container Security",
    "Kubernetes Hardening","AWS Security Review","Azure Posture Check","GCP Audit Trail",
    "SIEM Optimization","Log Analysis Pipeline","Forensics Toolkit","Malware Analysis Lab",
    "Reverse Engineering","Exploit Development","Bug Bounty Program","Red Team Infrastructure",
    "C2 Framework Setup","OSINT Collection","Social Engineering Test","Physical Security Audit",
    "Wireless Assessment","Web App Pentest","Database Security","Cryptography Review",
    "PKI Infrastructure","Certificate Management"
)
$statuses = @("active","planning","review","completed","on-hold")
$priorities = @("critical","high","medium","low")
$colors = @("#3B82F6","#8B5CF6","#06B6D4","#10B981","#F59E0B","#EF4444","#F97316")
$projects = @()
for ($i = 0; $i -lt $projectNames.Count; $i++) {
    $projects += @{
        id = "proj_$i"
        name = $projectNames[$i]
        description = "Comprehensive security assessment for $($projectNames[$i].ToLower())."
        status = $statuses[(Get-Random -Maximum $statuses.Count)]
        priority = $priorities[(Get-Random -Maximum $priorities.Count)]
        progress = Get-Random -Minimum 5 -Maximum 100
        tags = @("security","research")
        color = $colors[$i % $colors.Count]
        pinned = ($i -lt 8)
        members = @("Admin")
        createdAt = (New-RandomDate 90)
        updatedAt = (New-RandomDate 7)
    }
}
$projects | ConvertTo-Json -Depth 5 | Set-Content "$basePath\projects.json" -Encoding UTF8

Write-Host "Generated projects.json ($($projects.Count) items)"

# Tasks (120)
$taskTitles = @("Run vulnerability scan","Review scan results","Update firewall rules","Patch critical CVEs","Analyze malware sample")
$taskStatuses = @("pending","in-progress","completed","blocked")
$tasks = @()
for ($i = 0; $i -lt 120; $i++) {
    $tasks += @{
        id = "task_$i"
        title = "$($taskTitles[(Get-Random -Maximum $taskTitles.Count)]) #$i"
        status = $taskStatuses[(Get-Random -Maximum $taskStatuses.Count)]
        priority = $priorities[(Get-Random -Maximum $priorities.Count)]
        project = $projectNames[(Get-Random -Maximum $projectNames.Count)]
        assignee = "Admin"
        dueDate = (New-RandomDate -14)
        createdAt = (New-RandomDate 30)
    }
}
$tasks | ConvertTo-Json -Depth 5 | Set-Content "$basePath\tasks.json" -Encoding UTF8
Write-Host "Generated tasks.json ($($tasks.Count) items)"

# Files (120)
$extensions = @("pdf","docx","xlsx","png","json","xml","csv","txt","md","py","sh","pcap","log","zip")
$folders = @("Reports","Evidence","Scans","Scripts","Documents","Images","Logs","Exports","Templates","Archive")
$files = @()
$fi = 0
foreach ($folder in $folders) {
    for ($i = 0; $i -lt 12; $i++) {
        $ext = $extensions[(Get-Random -Maximum $extensions.Count)]
        $fname = "$($folder.ToLower())_$($i.ToString('000')).$ext"
        $files += @{
            id = "file_$fi"
            name = $fname
            folder = $folder
            type = $ext
            size = Get-Random -Minimum 1024 -Maximum 52428800
            favorite = (Get-Random -Maximum 100 -gt 85)
            recent = (Get-Random -Maximum 100 -gt 70)
            createdAt = (New-RandomDate 60)
            modifiedAt = (New-RandomDate 14)
            path = "/$folder/$fname"
        }
        $fi++
    }
}
$files | ConvertTo-Json -Depth 5 | Set-Content "$basePath\files.json" -Encoding UTF8
Write-Host "Generated files.json ($($files.Count) items)"

# Notes (50)
$noteTitles = @(
    "Recon Methodology Notes","CVE-2025-1234 Analysis","Network Topology Map",
    "Exploit Development Log","OSINT Collection Guide","Incident Response Playbook",
    "Threat Actor Profile TTPs","Vulnerability Assessment Template","Security Architecture Review",
    "Penetration Test Checklist","Forensics Investigation Steps","Malware Sample Analysis"
)
$noteFolders = @("Research","Operations","Templates","Reports","Personal")
$notes = @()
for ($i = 0; $i -lt 50; $i++) {
    $title = if ($i -lt $noteTitles.Count) { $noteTitles[$i] } else { "Security Note #$i" }
    $notes += @{
        id = "note_$i"
        title = $title
        content = "# $title`n`nDetailed notes and findings."
        folder = $noteFolders[(Get-Random -Maximum $noteFolders.Count)]
        tags = @("security")
        pinned = ($i -lt 5)
        favorite = ($i -lt 10)
        createdAt = (New-RandomDate 60)
        updatedAt = (New-RandomDate 14)
        wordCount = (Get-Random -Minimum 200 -Maximum 2000)
    }
}
$notes | ConvertTo-Json -Depth 5 | Set-Content "$basePath\notes.json" -Encoding UTF8
Write-Host "Generated notes.json ($($notes.Count) items)"

# Reports (30)
$reportTitles = @(
    "Executive Security Assessment","Penetration Test Report Q1","Vulnerability Scan Summary",
    "Compliance Audit Findings","Incident Response Report","Threat Intelligence Brief",
    "Network Security Review","Application Security Assessment","Cloud Infrastructure Audit",
    "Red Team Exercise Report"
)
$severities = @("critical","high","medium","low","info")
$reports = @()
for ($i = 0; $i -lt 30; $i++) {
    $title = if ($i -lt $reportTitles.Count) { $reportTitles[$i] } else { "Security Report #$i" }
    $reports += @{
        id = "report_$i"
        title = $title
        summary = "Comprehensive analysis and findings for $($title.ToLower())."
        severity = $severities[(Get-Random -Maximum $severities.Count)]
        status = @("draft","review","published","archived")[(Get-Random -Maximum 4)]
        findings = (Get-Random -Minimum 3 -Maximum 45)
        riskScore = (Get-Random -Minimum 1 -Maximum 100)
        author = "Admin"
        createdAt = (New-RandomDate 90)
        updatedAt = (New-RandomDate 7)
        tags = @("security")
    }
}
$reports | ConvertTo-Json -Depth 5 | Set-Content "$basePath\reports.json" -Encoding UTF8
Write-Host "Generated reports.json ($($reports.Count) items)"

# Notifications (10)
$notifs = @()
$notifMsgs = @(
    @{title="Scan Completed";text="Vulnerability scan finished successfully."},
    @{title="Critical Finding";text="New critical vulnerability detected."},
    @{title="Report Generated";text="Q1 assessment report ready for review."},
    @{title="Task Assigned";text="New task: Review firewall configuration."},
    @{title="Backup Complete";text="Daily backup completed successfully."},
    @{title="Update Available";text="CrackIt v2.1.0 available."},
    @{title="Threat Detected";text="Suspicious activity on endpoint WS-042."},
    @{title="Compliance Alert";text="PCI-DSS review due in 7 days."},
    @{title="AI Analysis Ready";text="AI log analysis results available."},
    @{title="Export Complete";text="Evidence package exported."}
)
$types = @("info","success","warning","error")
$cats = @("system","security","tasks","updates")
for ($i = 0; $i -lt $notifMsgs.Count; $i++) {
    $notifs += @{
        id = "notif_$i"
        title = $notifMsgs[$i].title
        text = $notifMsgs[$i].text
        type = $types[(Get-Random -Maximum $types.Count)]
        read = ($i -gt 5)
        category = $cats[(Get-Random -Maximum $cats.Count)]
        createdAt = (New-RandomDate 7)
    }
}
$notifs | ConvertTo-Json -Depth 5 | Set-Content "$basePath\notifications.json" -Encoding UTF8
Write-Host "Generated notifications.json"

Write-Host "All data files generated successfully!"
