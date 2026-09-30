/**
 * CrackIt — Enterprise Mock Data Generator
 * Generates thousands of realistic records for all modules
 */
const CrackItMockData = (() => {
  'use strict';

  const { uid, randomItem, randomInt, randomDate, formatDate } = CrackItUtils;

  const firstNames = ['Alex','Jordan','Morgan','Riley','Casey','Avery','Quinn','Taylor','Sam','Drew','Blake','Hayden','Reese','Sydney','Dakota','Skyler','Cameron','Logan','Parker','Emerson','Harper','Finley','Rowan','Sage','Phoenix','River','Wren','Dylan','Aria','Zion'];
  const lastNames = ['Chen','Patel','Kim','Singh','Garcia','Brown','Wilson','Smith','Lee','Johnson','Martinez','Anderson','Taylor','Thomas','Jackson','White','Harris','Thompson','Robinson','Clark','Lewis','Walker','Hall','Allen','Young','King','Wright','Lopez','Hill','Scott'];
  const domains = ['acmecorp.com','shieldtech.io','cyberguard.net','pentestlabs.com','securecloud.io','defenseworks.com','blackhatlabs.net','redteam.io','blueforsys.com','zerosectech.com','quantumsec.net','phoenixdefense.com','aurorasec.io','nightwatch.io','cypherlabs.com'];
  const projectTypes = ['Web App','Mobile App','API','Network','Cloud','Infrastructure','IoT','Compliance','Red Team','Blue Team','Code Review','Container','Database','Social Engineering','Physical'];
  const findingTitles = ['SQL Injection','XSS Reflected','XSS Stored','CSRF','Path Traversal','RCE','SSRF','IDOR','Broken Authentication','Sensitive Data Exposure','Missing Rate Limiting','Weak Password Policy','Insecure Direct Object Reference','Security Misconfiguration','XML External Entity','Deserialization Attack','Command Injection','File Inclusion','Open Redirect','Server Side Template Injection','LDAP Injection','NoSQL Injection','HTTP Request Smuggling','Cache Poisoning','Web Cache Deception','Clickjacking','Insecure CORS','Missing CSP Header','HSTS Missing','Information Disclosure','Debug Endpoint Exposed','Default Credentials','Hardcoded Secret','Insecure Storage','Weak Encryption','Padding Oracle Attack','Race Condition','Privilege Escalation','Denial of Service','Resource Exhaustion'];
  const categories = ['Web','Mobile','API','Network','Cloud','Infrastructure','Code','Config','Identity','Data','Compliance','Supply Chain'];
  const severities = ['critical','high','medium','low','info'];
  const statuses = ['open','in-progress','verified','closed'];
  const reportTypes = ['Executive Summary','Technical Report','Security Assessment','Code Review','Risk Assessment','Incident Report','Compliance Report','Management Summary','Vulnerability Report','Penetration Test Report'];
  const osList = ['Windows 11','Windows Server 2022','Ubuntu 22.04','Ubuntu 24.04','Debian 12','RHEL 9','CentOS 9','macOS Sonoma','macOS Sequoia','Kali Linux','Parrot OS','Alpine Linux','FreeBSD','OpenBSD'];
  const apps = ['nginx 1.26','Apache 2.4','Tomcat 10','Node.js 22','Python 3.12','Django 5.0','Flask 3.0','Rails 7.2','Spring Boot 3.3','Express 4.19','Next.js 14','Nuxt 3','Vue 3','React 18','Angular 17','MySQL 8.4','PostgreSQL 16','MongoDB 7','Redis 7.2','Elasticsearch 8'];
  const tools = ['Nmap','Burp Suite','Metasploit','Wireshark','Nessus','Nikto','SQLMap','OpenVAS','Acunetix','OWASP ZAP','Curl','Hydra','John','HashCat','Gobuster','Dirb','FFUF','Subfinder','Amass','Netcat'];
  const iocTypes = ['IP','Domain','URL','Hash MD5','Hash SHA1','Hash SHA256','Email','File Name','Registry Key','Mutex'];
  const iocValues = ['185.234.72.18','malicious-domain.xyz','phishing-site.com/login','a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4','phish@evil.com','evil.exe','HKLM\\Software\\Malware','Global\\EvilMutex','http://c2-server.net/payload','192.168.1.105','10.0.0.45','172.16.0.88','evil-payload.dll','suspicious-file.js','data-stealer.exe','ransomware-sample.bin'];
  const logLevels = ['ERROR','WARN','INFO','DEBUG'];
  const logMessages = ['Authentication failed','Connection timeout','Permission denied','Access granted','File not found','Buffer overflow detected','SSL handshake failed','DNS resolution error','Memory allocation failed','Process terminated unexpectedly','Unauthorized access attempt','Malicious payload detected','Suspicious network activity','Firewall rule triggered','Intrusion detected','Brute force attempt blocked','Phishing link clicked','Malware signature matched','Data exfiltration attempt','Privilege escalation detected'];

  const serviceNames = ['HTTP','HTTPS','SSH','FTP','SMTP','DNS','DHCP','LDAP','RDP','MySQL','PostgreSQL','MongoDB','Redis','Elasticsearch','Kibana','Grafana','Prometheus','Docker','Kubernetes','Jenkins','GitLab','Nginx','Apache','Tomcat','RabbitMQ','Kafka','Consul','Vault','Nomad','Traefik'];
  const mitreTactics = ['Initial Access','Execution','Persistence','Privilege Escalation','Defense Evasion','Credential Access','Discovery','Lateral Movement','Collection','Command and Control','Exfiltration','Impact'];
  const mitreTechniques = ['T1190','T1203','T1078','T1098','T1134','T1055','T1036','T1070','T1555','T1087','T1083','T1570','T1119','T1071','T1041','T1485','T1490','T1059','T1518','T1003'];
  const cveYears = ['2024','2025','2026'];
  const cweIds = ['CWE-79','CWE-89','CWE-22','CWE-352','CWE-611','CWE-918','CWE-862','CWE-863','CWE-200','CWE-287','CWE-798','CWE-502','CWE-20','CWE-116','CWE-276','CWE-77','CWE-434','CWE-94','CWE-295','CWE-829'];
  const complianceFrameworks = ['SOC 2','ISO 27001','PCI DSS','HIPAA','GDPR','NIST','OWASP ASVS','CIS Benchmarks','FedRAMP','PSD2'];

  function randomEmail() { return (randomItem(firstNames) + '.' + randomItem(lastNames) + '@' + randomItem(domains)).toLowerCase(); }
  function randomTitle() { return randomItem(findingTitles) + ' - ' + randomItem(domains); }

  // Return count of generated records
  let generatedCounts = {};

  function generate() {
    const settings = CrackItStorage.settings.get();
    if (settings.mockDataGenerated) return;
    _generateAll();
    CrackItStorage.settings.update({ mockDataGenerated: true });
  }

  function _generateAll() {
    ['projects', 'clients', 'findings', 'reports', 'conversations', 'notifications', 'tasks', 'files', 'logs', 'terminal_history', 'activity', 'workspace_snapshots', 'workspace_templates'].forEach(key => {
      if (!CrackItStorage.get(key) || CrackItStorage.get(key).length === 0) {
        CrackItStorage.set(key, []);
      }
    });
  }

  function generateProjects(count) {
    const existing = CrackItStorage.getCollection('projects');
    if (existing.length > 5) return;
    const projects = [];
    for (let i = 0; i < count; i++) {
      const date = randomDate(-90, 0);
      projects.push({
        id: uid('proj'), name: `${randomItem(firstNames)}-${randomItem(projectTypes)}-${i+1}`,
        description: `Security assessment for ${randomItem(domains)} covering ${randomItem(projectTypes)} infrastructure. ${i % 3 === 0 ? 'Full scope penetration test with code review.' : i % 3 === 1 ? 'Targeted vulnerability assessment and compliance audit.' : 'Comprehensive security evaluation including application and network testing.'}`,
        client: randomEmail(), modules: randomModules(), status: randomItem(['active','active','active','active','archived','completed','paused']),
        type: randomItem(projectTypes), urgency: randomItem(['low','medium','high']),
        createdAt: date, updatedAt: randomDate(-30, 0, date),
        tags: [randomItem(projectTypes), randomItem(categories), randomItem(complianceFrameworks)],
        findingsCount: randomInt(5, 40), progress: randomInt(10, 100)
      });
    }
    existing.push(...projects);
    CrackItStorage.setCollection('projects', existing);
    generatedCounts.projects = projects.length;
  }

  function randomModules() {
    const all = ['web','mobile','api','network','cloud','code-review','red-team','blue-team','compliance','container','social-engineering','wireless','physical','iot'];
    const count = randomInt(3, 7);
    const selected = [];
    for (let i = 0; i < count; i++) {
      const m = randomItem(all);
      if (!selected.includes(m)) selected.push(m);
    }
    return selected;
  }

  function generateClients(count) {
    const existing = CrackItStorage.getCollection('clients');
    if (existing.length > 2) return;
    for (let i = 0; i < count; i++) {
      existing.push({
        id: uid('client'), name: randomItem(domains).replace('.',' ').toUpperCase(),
        contact: randomEmail(), email: randomEmail(), phone: `+1-${randomInt(200,999)}-${randomInt(100,999)}-${randomInt(1000,9999)}`,
        industry: randomItem(['Technology','Finance','Healthcare','Government','Education','E-commerce','Manufacturing','Energy']),
        risk: randomItem(['low','medium','high','critical']), status: randomItem(['active','active','active','inactive']),
        projects: randomInt(1, 8), createdAt: randomDate(-180, 0)
      });
    }
    CrackItStorage.setCollection('clients', existing);
    generatedCounts.clients = count;
  }

  function generateFindings(count) {
    const existing = CrackItStorage.getCollection('findings');
    if (existing.length > 10) return;
    const projects = CrackItStorage.getCollection('projects');
    for (let i = 0; i < count; i++) {
      const date = randomDate(-60, 0);
      const sev = randomItem(severities);
      const project = randomItem(projects) || { id: 'default', name: 'Sample Project' };
      existing.push({
        id: uid('find'), projectId: project.id, projectName: project.name,
        title: randomTitle(), severity: sev, cvssScore: sev === 'critical' ? parseFloat((9.0 + Math.random()).toFixed(1)) : sev === 'high' ? parseFloat((7.0 + Math.random()*2).toFixed(1)) : sev === 'medium' ? parseFloat((4.0 + Math.random()*3).toFixed(1)) : parseFloat((0.1 + Math.random()*4).toFixed(1)),
        category: randomItem(categories), cweId: randomItem(cweIds),
        owaspCategory: randomItem(['A01:2021','A02:2021','A03:2021','A04:2021','A05:2021','A06:2021','A07:2021','A08:2021']),
        description: `A ${sev} severity ${randomItem(findingTitles)} was identified during security assessment. This issue affects the ${randomItem(projectTypes)} component and may allow attackers to ${randomItem(['bypass authentication','access sensitive data','execute arbitrary code','escalate privileges','perform denial of service'])}.`,
        stepsToReproduce: `1. Navigate to affected endpoint\n2. Send crafted ${randomItem(['HTTP request','payload','parameter','header'])}\n3. Observe ${randomItem(['unexpected behavior','error response','data exposure','code execution'])}\n4. Confirm vulnerability`,
        impact: `Successful exploitation could lead to ${randomItem(['data breach','system compromise','unauthorized access','service disruption','financial loss'])}, impacting confidentiality, integrity, and availability of affected systems.`,
        recommendation: `Implement proper ${randomItem(['input validation','output encoding','access controls','encryption','rate limiting'])}. Follow OWASP guidelines for secure coding. Conduct thorough testing before deployment.`,
        references: `https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-${randomItem(cveYears)}-${randomInt(1000,9999)}`,
        evidence: `Evidence collected from ${randomItem(tools)} scan on ${formatDate(date)}`, module: randomItem(['web','api','network','cloud','code','config']),
        status: randomItem(statuses), relatedFiles: [], relatedChats: [], relatedReports: [],
        createdAt: date, updatedAt: randomDate(-15, 0, date), analyst: randomItem(firstNames) + ' ' + randomItem(lastNames)
      });
    }
    CrackItStorage.setCollection('findings', existing);
    generatedCounts.findings = count;
  }

  function generateReports(count) {
    const existing = CrackItStorage.getCollection('reports');
    if (existing.length > 5) return;
    const projects = CrackItStorage.getCollection('projects');
    for (let i = 0; i < count; i++) {
      const sev = randomItem(severities);
      const project = randomItem(projects) || { id: 'default', name: 'Sample' };
      existing.push({
        id: uid('rpt'), projectId: project.id, projectName: project.name,
        title: `${randomItem(reportTypes)} - ${project.name}`,
        type: randomItem(reportTypes), severity: sev, status: randomItem(['draft','review','final','published']),
        findingsCount: randomInt(3, 25), criticalCount: randomInt(0, 5), highCount: randomInt(1, 10),
        mediumCount: randomInt(2, 15), lowCount: randomInt(1, 8),
        author: randomItem(firstNames) + ' ' + randomItem(lastNames), pages: randomInt(12, 80),
        createdAt: randomDate(-90, 0), updatedAt: randomDate(-30, 0),
        score: randomInt(45, 98), tags: [randomItem(complianceFrameworks), randomItem(categories)]
      });
    }
    CrackItStorage.setCollection('reports', existing);
    generatedCounts.reports = count;
  }

  function generateConversations(count) {
    const existing = CrackItStorage.getCollection('conversations');
    if (existing.length > 5) return;
    for (let i = 0; i < count; i++) {
      const msgs = randomInt(3, 20);
      existing.push({
        id: uid('conv'), title: `${randomItem(['Security Analysis of','Review of','Investigation into','Threat Assessment for','Compliance Check of'])} ${randomItem(domains)}`,
        model: randomItem(['CrackIt Intelligence','Security Analyst','Code Auditor','Threat Researcher']),
        messages: Array.from({length: msgs}, (_,j) => ({
          id: uid('msg'), role: j % 2 === 0 ? 'user' : 'assistant',
          content: j % 2 === 0 ? `Analyze the security of ${randomItem(domains)} for ${randomItem(projectTypes)} vulnerabilities` : `Found ${randomInt(2,15)} potential issues. Key findings include ${randomItem(findingTitles).toLowerCase()} and ${randomItem(findingTitles).toLowerCase()}.`,
          timestamp: randomDate(-7, 0)
        })),
        pinned: Math.random() > 0.8, favorite: Math.random() > 0.85,
        tokens: randomInt(500, 5000), createdAt: randomDate(-30, 0)
      });
    }
    CrackItStorage.setCollection('conversations', existing);
    generatedCounts.conversations = count;
  }

  function generateNotifications(count) {
    const existing = CrackItStorage.getCollection('notifications');
    if (existing.length > 5) return;
    const types = ['system','security','projects','ai','tasks'];
    for (let i = 0; i < count; i++) {
      existing.push({
        id: uid('notif'), type: randomItem(types),
        title: randomItem(['New Finding Identified','Scan Complete','Report Generated','Alert Triggered','System Update Available','Task Assigned','Project Updated','Threat Detected','AI Analysis Complete','Compliance Check Passed']),
        message: randomItem(logMessages), read: Math.random() > 0.4,
        pinned: Math.random() > 0.9, timestamp: randomDate(-14, 0)
      });
    }
    CrackItStorage.setCollection('notifications', existing);
    generatedCounts.notifications = count;
  }

  function generateTasks(count) {
    const existing = CrackItStorage.getCollection('tasks');
    if (existing.length > 5) return;
    const taskNames = ['Review scan results','Update risk register','Verify findings','Patch critical vulnerability','Complete report draft','Client meeting prep','Update documentation','Run dependency scan','Code review session','Deploy security update','Audit access controls','Test backup recovery','Update incident response plan','Security awareness training','Infrastructure assessment'];
    for (let i = 0; i < count; i++) {
      existing.push({
        id: uid('task'), title: randomItem(taskNames) + ' - ' + randomItem(domains),
        status: randomItem(['todo','in-progress','review','done','cancelled']),
        priority: randomItem(['low','medium','high','critical']),
        assignee: randomItem(firstNames) + ' ' + randomItem(lastNames),
        project: randomItem(domains), dueDate: randomDate(-5, 14),
        createdAt: randomDate(-30, 0), progress: randomInt(0, 100)
      });
    }
    CrackItStorage.setCollection('tasks', existing);
    generatedCounts.tasks = count;
  }

  function generateFiles(count) {
    const existing = CrackItStorage.getCollection('files');
    if (existing.length > 10) return;
    const extMap = { 'js': 'JavaScript','py': 'Python','java': 'Java','cpp': 'C++','html': 'HTML','css': 'CSS','json': 'JSON','xml': 'XML','yaml': 'YAML','md': 'Markdown','txt': 'Text','log': 'Log','pdf': 'PDF','png': 'Image','jpg': 'Image','zip': 'Archive','tar': 'Archive','gz': 'Archive','exe': 'Binary','dll': 'Binary' };
    const exts = Object.keys(extMap);
    for (let i = 0; i < count; i++) {
      const ext = randomItem(exts);
      existing.push({
        id: uid('file'), name: `${randomItem(['scan','report','config','backup','notes','analysis','data','export','log','key','env','cert','payload','script','module'])}_${i}.${ext}`,
        type: extMap[ext], path: `/projects/${randomItem(domains)}/${randomItem(['src','docs','config','reports','logs','data'])}/`,
        size: randomInt(100, 10485760), ext: ext,
        project: randomItem(domains), createdAt: randomDate(-90, 0),
        modifiedAt: randomDate(-30, 0), content: `Mock ${extMap[ext]} file content for ${randomItem(domains)}`
      });
    }
    CrackItStorage.setCollection('files', existing);
    generatedCounts.files = count;
  }

  function generateLogs(count) {
    let logs = CrackItStorage.get('logs', []);
    if (logs.length > 100) return;
    for (let i = 0; i < count; i++) {
      const date = randomDate(-14, 0);
      logs.push({
        id: uid('log'), timestamp: date, level: randomItem(logLevels),
        source: randomItem(serviceNames), host: `host-${randomInt(1,50)}`,
        message: randomItem(logMessages) + ' on ' + randomItem(serviceNames) + ' from ' + randomInt(192,223) + '.' + randomInt(0,255) + '.' + randomInt(0,255) + '.' + randomInt(1,254),
        processId: randomInt(1000, 99999), threadId: randomInt(1, 200),
        user: randomItem(firstNames).toLowerCase()
      });
    }
    logs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    CrackItStorage.set('logs', logs);
    generatedCounts.logs = count;
  }

  function generateTerminalHistory(count) {
    let history = CrackItStorage.get('terminal_history', []);
    if (history.length > 50) return;
    const cmds = ['nmap -sV -p- target.com','curl -I https://example.com','gobuster dir -u https://target.com -w wordlist.txt','sqlmap -u "https://target.com/page?id=1"','python3 exploit.py','ping -c 4 8.8.8.8','ssh admin@target.com','docker ps -a','kubectl get pods --all-namespaces','git log --oneline -20','dig example.com ANY','whois example.com','nikto -h https://example.com','wget https://example.com/payload','zip -r backup.zip ./data','tar -czf archive.tar.gz ./src','echo "test" > output.txt','cat /etc/passwd','ls -la','ps aux | grep nginx','netstat -tulpn','tcpdump -i eth0 port 80','hydra -l admin -P passwords.txt ssh://target.com','john --format=raw-sha256 hash.txt'];
    for (let i = 0; i < count; i++) {
      history.push({
        id: uid('term'), command: randomItem(cmds), output: `[${randomItem(serviceNames)}] Command executed at ${randomDate(-7, 0).toISOString()}\n> ${randomItem(logMessages)}`,
        timestamp: randomDate(-14, 0), duration: randomInt(0.1, 30).toFixed(1) + 's',
        exitCode: Math.random() > 0.8 ? randomInt(1, 255) : 0,
        directory: randomItem(['/home/admin','/var/log','/etc/nginx','/opt/tools','/data/scans','/projects'])
      });
    }
    CrackItStorage.set('terminal_history', history);
    generatedCounts.terminal = count;
  }

  function generateActivity(count) {
    let activity = CrackItStorage.getCollection('activity');
    if (activity.length > 100) return;
    const actions = ['Project created','Finding added','Report generated','Chat started','File uploaded','Scan completed','Task updated','Settings changed','Client added','Vulnerability confirmed','Remediation verified','Security review completed','Compliance check passed','Backup created','Snapshot restored'];
    for (let i = 0; i < count; i++) {
      activity.push({
        id: uid('act'), action: randomItem(actions),
        detail: randomItem(domains) + ' - ' + randomItem(projectTypes),
        type: randomItem(['create','update','delete','export','upload','scan','security','system']),
        timestamp: randomDate(-30, 0).toISOString(), user: randomItem(firstNames) + ' ' + randomItem(lastNames)
      });
    }
    activity.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    CrackItStorage.setCollection('activity', activity);
    generatedCounts.activity = count;
  }

  function generateWorkspaceSnapshots(count) {
    let snapshots = CrackItStorage.get('workspace_snapshots', []);
    for (let i = 0; i < count; i++) {
      snapshots.push({
        id: uid('snap'), name: `Snapshot ${i+1} - ${randomDate(-30, 0).toLocaleDateString()}`,
        createdAt: randomDate(-30, 0).toISOString(), size: randomInt(1, 50) + 'KB',
        description: `Workspace snapshot capturing ${randomItem(['active projects','current findings','open reports','chat history'])}.`
      });
    }
    CrackItStorage.set('workspace_snapshots', snapshots);
  }

  function generateTemplates(count) {
    let templates = CrackItStorage.get('workspace_templates', []);
    const templateNames = ['Web App Security Assessment','API Penetration Test','Cloud Security Review','Mobile App Audit','Network Penetration Test','Red Team Engagement','Compliance Assessment','Full Scope Security Audit'];
    for (let i = 0; i < count && i < templateNames.length; i++) {
      templates.push({
        id: uid('tpl'), name: templateNames[i],
        description: `Template for ${templateNames[i].toLowerCase()} engagements. Includes predefined modules, checklists, and report templates.`,
        modules: ['web','api','code-review','network'].slice(0, randomInt(2, 5)),
        category: randomItem(['Web','API','Cloud','Mobile','Network','Compliance']),
        createdAt: randomDate(-180, 0).toISOString()
      });
    }
    CrackItStorage.set('workspace_templates', templates);
  }

  function getCounts() { return generatedCounts; }

  return { generate, generateProjects, generateFindings, generateReports, generateNotifications, generateTasks, generateFiles, generateLogs, generateConversations, getCounts };
})();
