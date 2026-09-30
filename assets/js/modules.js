const CrackItSOC = (() => {
  'use strict'; const { escapeHtml, formatDate, icons, icon } = CrackItUtils;
  async function render(container) {
    const incidents = [
      { id: 'INC-001', title: 'Suspicious Login Attempts', severity: 'high', status: 'investigating', date: new Date(Date.now()-3600000).toISOString(), analyst: 'Admin' },
      { id: 'INC-002', title: 'Malware Detected on Endpoint', severity: 'critical', status: 'triage', date: new Date(Date.now()-7200000).toISOString(), analyst: 'Admin' },
      { id: 'INC-003', title: 'Phishing Campaign Reported', severity: 'medium', status: 'closed', date: new Date(Date.now()-86400000).toISOString(), analyst: 'Admin' }
    ];
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>Security Operations Center</h1><p>Incident monitoring and response dashboard</p></div></div>
      <div class="dashboard-grid">
        <div class="col-span-3"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-red)">${incidents.length}</div><div style="font-size:12px;color:var(--text-muted)">Active Incidents</div></div></div></div>
        <div class="col-span-3"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-yellow)">${incidents.filter(i=>i.severity==='high').length}</div><div style="font-size:12px;color:var(--text-muted)">High Alerts</div></div></div></div>
        <div class="col-span-3"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-green)">${incidents.filter(i=>i.status==='closed').length}</div><div style="font-size:12px;color:var(--text-muted)">Resolved</div></div></div></div>
        <div class="col-span-3"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-blue)">12</div><div style="font-size:12px;color:var(--text-muted)">Total Alerts (24h)</div></div></div></div>
        <div class="col-span-12"><div class="card"><div class="card-header"><span class="card-title">Recent Incidents</span></div><div class="card-body" style="padding:0"><div class="table-container"><table class="table"><thead><tr><th>ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Analyst</th><th>Time</th></tr></thead><tbody>${incidents.map(i => `<tr><td style="font-family:monospace">${i.id}</td><td>${escapeHtml(i.title)}</td><td><span class="badge badge-${i.severity==='critical'?'red':i.severity==='high'?'yellow':'gray'}">${i.severity}</span></td><td><span class="badge badge-${i.status==='closed'?'green':'purple'}">${i.status}</span></td><td>${escapeHtml(i.analyst)}</td><td>${formatDate(i.date, true)}</td></tr>`).join('')}</tbody></table></div></div></div></div>
      </div>`;
    CrackItNavigation.updateBreadcrumbs('soc', 'SOC Dashboard');
  }
  return { render };
})();CrackItModules.CrackItSOC = CrackItSOC;

const CrackItThreats = (() => {
  'use strict'; const { escapeHtml, formatDate, icons, icon } = CrackItUtils;
  async function render(container) {
    const iocs = [
      { type: 'IP', value: '185.234.72.18', severity: 'high', source: 'AlienVault', date: new Date().toISOString() },
      { type: 'Domain', value: 'malicious-domain.xyz', severity: 'critical', source: 'VirusTotal', date: new Date().toISOString() },
      { type: 'Hash', value: 'a1b2c3d4e5f6...', severity: 'medium', source: 'Abuse.ch', date: new Date().toISOString() },
      { type: 'URL', value: 'http://phishing-site.com/login', severity: 'high', source: 'PhishTank', date: new Date().toISOString() }
    ];
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>Threat Intelligence</h1><p>IOC management and threat feed monitoring</p></div></div>
      <div class="dashboard-grid">
        <div class="col-span-12"><div class="card"><div class="card-header"><span class="card-title">Indicators of Compromise (${iocs.length})</span><button class="btn btn-primary btn-sm">${icon('plus')} Add IOC</button></div><div class="card-body" style="padding:0"><div class="table-container"><table class="table"><thead><tr><th>Type</th><th>Value</th><th>Severity</th><th>Source</th><th>Date</th></tr></thead><tbody>${iocs.map(i => `<tr><td><span class="badge badge-gray">${i.type}</span></td><td style="font-family:monospace">${escapeHtml(i.value)}</td><td><span class="badge badge-${i.severity==='critical'?'red':'yellow'}">${i.severity}</span></td><td>${escapeHtml(i.source)}</td><td>${formatDate(i.date, true)}</td></tr>`).join('')}</tbody></table></div></div></div></div>
      </div>`;
    CrackItNavigation.updateBreadcrumbs('threats', 'Threat Intelligence');
  }
  return { render };
})();CrackItModules.CrackItThreats = CrackItThreats;

const CrackItLabs = (() => {
  'use strict'; const { escapeHtml, icons, icon } = CrackItUtils;
  async function render(container) {
    const labs = [
      { name: 'Web Security Fundamentals', desc: 'Learn OWASP Top 10 basics', category: 'Web', difficulty: 'Beginner' },
      { name: 'SQL Injection Lab', desc: 'Practice SQL injection techniques', category: 'Web', difficulty: 'Intermediate' },
      { name: 'XSS Challenge', desc: 'Cross-site scripting exercises', category: 'Web', difficulty: 'Intermediate' },
      { name: 'Network Reconnaissance', desc: 'Nmap and enumeration practice', category: 'Network', difficulty: 'Beginner' },
      { name: 'Malware Analysis 101', desc: 'Static and dynamic analysis basics', category: 'Malware', difficulty: 'Advanced' }
    ];
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>Cybersecurity Labs</h1><p>Educational exercises for skill development</p></div></div>
      <div class="dashboard-grid">${labs.map(l => `
        <div class="col-span-4"><div class="card hover-lift"><div class="card-body" style="padding:20px"><div style="font-size:28px;margin-bottom:8px">${icon('flask')}</div><h3 style="margin:0 0 4px;font-size:15px">${escapeHtml(l.name)}</h3><p style="font-size:12px;color:var(--text-muted);margin:0 0 8px">${escapeHtml(l.desc)}</p><div style="display:flex;gap:6px"><span class="badge badge-gray">${l.category}</span><span class="badge badge-${l.difficulty==='Beginner'?'green':l.difficulty==='Intermediate'?'yellow':'red'}">${l.difficulty}</span></div></div></div></div>`).join('')}
      </div>`;
    CrackItNavigation.updateBreadcrumbs('labs', 'Labs');
  }
  return { render };
})();CrackItModules.CrackItLabs = CrackItLabs;

const CrackItKnowledgeCenter = (() => {
  'use strict'; const { escapeHtml, icons, icon } = CrackItUtils;
  async function render(container) {
    const guides = [
      { title: 'OWASP Top 10 2021', category: 'Web Security', pages: 24 },
      { title: 'MITRE ATT&CK Framework', category: 'Threat Intel', pages: 36 },
      { title: 'Secure Coding Best Practices', category: 'Development', pages: 18 },
      { title: 'Network Security Guide', category: 'Infrastructure', pages: 42 },
      { title: 'Cloud Security Checklist', category: 'Cloud', pages: 15 },
      { title: 'Incident Response Playbook', category: 'Operations', pages: 28 }
    ];
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>Knowledge Center</h1><p>Security guides, cheat sheets, and documentation</p></div></div>
      <div class="dashboard-grid">${guides.map(g => `
        <div class="col-span-4"><div class="card hover-lift"><div class="card-body" style="padding:16px"><div style="display:flex;align-items:center;gap:12px"><div style="font-size:24px">${icon('book')}</div><div><div style="font-weight:600;font-size:14px">${escapeHtml(g.title)}</div><div style="font-size:11px;color:var(--text-muted)">${escapeHtml(g.category)} · ${g.pages} pages</div></div></div></div></div></div>`).join('')}
      </div>`;
    CrackItNavigation.updateBreadcrumbs('knowledgecenter', 'Knowledge Center');
  }
  return { render };
})();CrackItModules.CrackItKnowledgeCenter = CrackItKnowledgeCenter;

const CrackItDevSecOps = (() => {
  'use strict'; const { escapeHtml, icons, icon, formatDate } = CrackItUtils;
  async function render(container) {
    const pipelines = [
      { name: 'web-app-pipeline', status: 'success', branch: 'main', commit: '8a3f2b1', duration: '3m 12s' },
      { name: 'api-security-scan', status: 'running', branch: 'develop', commit: '7d9e4c2', duration: '1m 45s' },
      { name: 'dependency-audit', status: 'failed', branch: 'feature/auth', commit: '2b5f8e3', duration: '45s' }
    ];
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>DevSecOps</h1><p>CI/CD pipeline security and container scanning</p></div></div>
      <div class="dashboard-grid">
        <div class="col-span-12"><div class="card"><div class="card-header"><span class="card-title">Pipeline Status</span></div><div class="card-body" style="padding:0"><div class="table-container"><table class="table"><thead><tr><th>Pipeline</th><th>Status</th><th>Branch</th><th>Commit</th><th>Duration</th></tr></thead><tbody>${pipelines.map(p => `<tr><td style="font-family:monospace">${escapeHtml(p.name)}</td><td><span class="badge badge-${p.status==='success'?'green':p.status==='running'?'blue':'red'}">${p.status}</span></td><td>${escapeHtml(p.branch)}</td><td style="font-family:monospace">${p.commit}</td><td>${p.duration}</td></tr>`).join('')}</tbody></table></div></div></div></div>
      </div>`;
    CrackItNavigation.updateBreadcrumbs('devsecops', 'DevSecOps');
  }
  return { render };
})();CrackItModules.CrackItDevSecOps = CrackItDevSecOps;

const CrackItCVE = (() => {
  'use strict'; const { escapeHtml, icons, icon } = CrackItUtils;
  async function render(container) {
    const cves = [
      { id: 'CVE-2025-1044', score: 9.8, severity: 'critical', description: 'Remote code execution in web component', published: '2025-03-15' },
      { id: 'CVE-2025-1045', score: 7.5, severity: 'high', description: 'SQL injection in API endpoint', published: '2025-03-14' },
      { id: 'CVE-2025-1046', score: 5.4, severity: 'medium', description: 'Cross-site scripting vulnerability', published: '2025-03-13' },
      { id: 'CVE-2025-1047', score: 3.2, severity: 'low', description: 'Information disclosure via error messages', published: '2025-03-12' }
    ];
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>CVE Explorer</h1><p>Common Vulnerabilities and Exposures database</p></div></div>
      <div class="dashboard-grid">
        <div class="col-span-12"><div class="card"><div class="card-header"><span class="card-title">Vulnerabilities (${cves.length})</span><input type="text" class="input" placeholder="Search CVE..." style="width:200px;font-size:12px;padding:6px 10px"></div><div class="card-body" style="padding:0"><div class="table-container"><table class="table"><thead><tr><th>CVE ID</th><th>CVSS</th><th>Severity</th><th>Description</th><th>Published</th></tr></thead><tbody>${cves.map(c => `<tr><td style="font-family:monospace;color:var(--accent-blue)">${c.id}</td><td style="font-weight:600">${c.score}</td><td><span class="badge badge-${c.severity==='critical'?'red':c.severity==='high'?'yellow':'gray'}">${c.severity}</span></td><td>${escapeHtml(c.description)}</td><td>${c.published}</td></tr>`).join('')}</tbody></table></div></div></div></div>
      </div>`;
    CrackItNavigation.updateBreadcrumbs('cve', 'CVE Explorer');
  }
  return { render };
})();CrackItModules.CrackItCVE = CrackItCVE;

const CrackItCWE = (() => {
  'use strict'; const { escapeHtml, icons, icon } = CrackItUtils;
  async function render(container) {
    const cwes = [
      { id: 'CWE-79', name: 'Cross-site Scripting', severity: 'high', count: 1243 },
      { id: 'CWE-89', name: 'SQL Injection', severity: 'critical', count: 876 },
      { id: 'CWE-22', name: 'Path Traversal', severity: 'high', count: 654 },
      { id: 'CWE-352', name: 'CSRF', severity: 'medium', count: 432 }
    ];
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>CWE Explorer</h1><p>Common Weakness Enumeration reference</p></div></div>
      <div class="dashboard-grid">
        <div class="col-span-12"><div class="card"><div class="card-header"><span class="card-title">Weakness Catalog</span></div><div class="card-body" style="padding:0"><div class="table-container"><table class="table"><thead><tr><th>CWE ID</th><th>Name</th><th>Severity</th><th>Occurrences</th></tr></thead><tbody>${cwes.map(c => `<tr><td style="font-family:monospace;color:var(--accent-blue)">${c.id}</td><td>${escapeHtml(c.name)}</td><td><span class="badge badge-${c.severity==='critical'?'red':'yellow'}">${c.severity}</span></td><td>${c.count.toLocaleString()}</td></tr>`).join('')}</tbody></table></div></div></div></div>
      </div>`;
    CrackItNavigation.updateBreadcrumbs('cwe', 'CWE Explorer');
  }
  return { render };
})();CrackItModules.CrackItCWE = CrackItCWE;

const CrackItMITRE = (() => {
  'use strict'; const { escapeHtml, icons, icon } = CrackItUtils;
  async function render(container) {
    const tactics = [
      { id: 'TA0001', name: 'Initial Access', techniques: 9, desc: 'Techniques used to gain initial foothold' },
      { id: 'TA0002', name: 'Execution', techniques: 12, desc: 'Techniques that execute malicious code' },
      { id: 'TA0003', name: 'Persistence', techniques: 18, desc: 'Techniques to maintain access' },
      { id: 'TA0004', name: 'Privilege Escalation', techniques: 13, desc: 'Techniques to gain higher permissions' },
      { id: 'TA0005', name: 'Defense Evasion', techniques: 42, desc: 'Techniques to avoid detection' },
      { id: 'TA0006', name: 'Credential Access', techniques: 16, desc: 'Techniques to steal credentials' }
    ];
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>MITRE ATT&CK</h1><p>Adversarial tactics, techniques, and common knowledge</p></div></div>
      <div class="dashboard-grid">${tactics.map(t => `
        <div class="col-span-4"><div class="card hover-lift"><div class="card-body" style="padding:16px"><div style="font-size:11px;color:var(--text-muted);font-family:monospace">${t.id}</div><div style="font-weight:600;font-size:14px;margin:4px 0">${escapeHtml(t.name)}</div><div style="font-size:12px;color:var(--text-muted)">${escapeHtml(t.desc)}</div><div style="font-size:11px;color:var(--accent-blue);margin-top:8px">${t.techniques} techniques</div></div></div></div>`).join('')}
      </div>`;
    CrackItNavigation.updateBreadcrumbs('mitre', 'MITRE ATT&CK');
  }
  return { render };
})();CrackItModules.CrackItMITRE = CrackItMITRE;

const CrackItScanner = (() => {
  'use strict'; const { escapeHtml, icons, icon, formatDate } = CrackItUtils;
  let scans = [];
  async function render(container) {
    scans = [];
    if (CrackItAPI.isAuthenticated()) {
      try { scans = await CrackItAPI.scans.list(); } catch { /* offline */ }
    }
    const running = scans.filter(s => s.status === 'running' || s.status === 'queued');
    const completed = scans.filter(s => s.status === 'completed');
    const failed = scans.filter(s => s.status === 'failed');
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>Website Security Scanner</h1><p>Scan and analyze website security posture</p></div>
        <div class="page-header-actions"><input type="text" class="input" id="scanner-target" placeholder="https://example.com" style="width:300px"><button class="btn btn-primary" data-scan-type="quick">${icon('scan')} Quick Scan</button><button class="btn btn-secondary" data-scan-type="deep">${icon('layers')} Deep Scan</button></div></div>
      <div class="dashboard-grid">
        <div class="col-span-3"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-blue)">${scans.length}</div><div style="font-size:12px;color:var(--text-muted)">Total Scans</div></div></div></div>
        <div class="col-span-3"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-green)">${completed.length}</div><div style="font-size:12px;color:var(--text-muted)">Completed</div></div></div></div>
        <div class="col-span-3"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-yellow)">${running.length}</div><div style="font-size:12px;color:var(--text-muted)">Running</div></div></div></div>
        <div class="col-span-3"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-red)">${failed.length}</div><div style="font-size:12px;color:var(--text-muted)">Failed</div></div></div></div>
        <div class="col-span-12"><div class="card"><div class="card-header"><span class="card-title">Scan History</span></div><div class="card-body" style="padding:0"><div class="table-container"><table class="table"><thead><tr><th>Name</th><th>Type</th><th>Target</th><th>Status</th><th>Progress</th><th>Created</th></tr></thead><tbody>${scans.length ? scans.map(s => `<tr><td style="font-family:monospace">${escapeHtml(s.name || s.scan_type + ' scan')}</td><td><span class="badge badge-gray">${escapeHtml(s.scan_type)}</span></td><td style="font-family:monospace;font-size:12px">${escapeHtml(s.target || '—')}</td><td><span class="badge badge-${s.status==='completed'?'green':s.status==='running'||s.status==='queued'?'blue':'red'}">${s.status}</span></td><td>${s.progress || 0}%</td><td>${formatDate(s.created_at, true)}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No scans yet. Enter a target and click Quick Scan to start.</td></tr>'}</tbody></table></div></div></div></div>
      </div>`;
    container.querySelectorAll('[data-scan-type]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const target = container.querySelector('#scanner-target')?.value?.trim();
        if (!target) { CrackItUI.toast('Enter a target URL or domain', 'warning'); return; }
        if (!CrackItAPI.isAuthenticated()) { CrackItUI.toast('Sign in to run scans', 'warning'); return; }
        try {
          await CrackItAPI.scans.create({ scan_type: btn.dataset.scanType === 'deep' ? 'deep-scan' : 'quick-scan', target });
          CrackItUI.toast('Scan started', 'success');
          await render(container);
        } catch (err) { CrackItUI.toast('Failed to start scan: ' + err.message, 'error'); }
      });
    });
    CrackItNavigation.updateBreadcrumbs('scanner', 'Website Scanner');
  }
  return { render };
})();CrackItModules.CrackItScanner = CrackItScanner;

const CrackItCodeScanner = (() => {
  'use strict'; const { escapeHtml, icons, icon } = CrackItUtils;
  async function render(container) {
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>Source Code Security Review</h1><p>Analyze source code for vulnerabilities</p></div>
        <div class="page-header-actions"><button class="btn btn-primary">${icon('upload')} Upload Code</button><button class="btn btn-secondary">${icon('code')} Paste Code</button></div></div>
      <div class="dashboard-grid">
        <div class="col-span-12"><div class="card"><div class="card-header"><span class="card-title">Analysis Results</span></div><div class="card-body"><div class="empty-state"><div class="empty-state-icon">${icon('code')}</div><h3>Ready to Scan</h3><p>Upload or paste source code to begin the security review</p></div></div></div></div>
      </div>`;
    CrackItNavigation.updateBreadcrumbs('codescanner', 'Code Scanner');
  }
  return { render };
})();CrackItModules.CrackItCodeScanner = CrackItCodeScanner;

const CrackItAPIScanner = (() => {
  'use strict'; const { escapeHtml, icons, icon } = CrackItUtils;
  async function render(container) {
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>API Security Scanner</h1><p>REST, GraphQL, and SOAP API security analysis</p></div>
        <div class="page-header-actions"><button class="btn btn-primary">${icon('plus')} New Scan</button></div></div>
      <div class="dashboard-grid">
        <div class="col-span-4"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-green)">3</div><div style="font-size:12px;color:var(--text-muted)">APIs Monitored</div></div></div></div>
        <div class="col-span-4"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-red)">7</div><div style="font-size:12px;color:var(--text-muted)">Vulnerabilities</div></div></div></div>
        <div class="col-span-4"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-blue)">85</div><div style="font-size:12px;color:var(--text-muted)">Security Score</div></div></div></div>
      </div>`;
    CrackItNavigation.updateBreadcrumbs('apiscanner', 'API Security');
  }
  return { render };
})();CrackItModules.CrackItAPIScanner = CrackItAPIScanner;

const CrackItAIMemory = (() => {
  'use strict'; const { escapeHtml, icons, icon, formatDate } = CrackItUtils;
  async function render(container) {
    const memories = [
      { title: 'Project Web App Context', preview: 'React frontend with Node.js backend, JWT auth, PostgreSQL', pinned: true, date: new Date().toISOString() },
      { title: 'Security Preferences', preview: 'Focus on OWASP Top 10, prefer automated scanning tools', pinned: true, date: new Date().toISOString() },
      { title: 'API Documentation Learned', preview: 'REST API endpoints for user management reviewed', pinned: false, date: new Date(Date.now()-86400000).toISOString() }
    ];
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>AI Memory</h1><p>Saved contexts, preferences, and learned information</p></div><button class="btn btn-primary">${icon('plus')} New Memory</button></div>
      <div class="dashboard-grid">${memories.map(m => `
        <div class="col-span-4"><div class="card"><div class="card-body" style="padding:16px"><div style="display:flex;justify-content:space-between;align-items:start"><div style="font-weight:600;font-size:14px">${escapeHtml(m.title)}</div>${m.pinned ? '<span style="color:var(--accent-yellow)">'+icon('pin')+'</span>' : ''}</div><p style="font-size:12px;color:var(--text-muted);margin:8px 0">${escapeHtml(m.preview)}</p><div style="font-size:11px;color:var(--text-muted)">${formatDate(m.date, true)}</div></div></div></div>`).join('')}
      </div>`;
    CrackItNavigation.updateBreadcrumbs('memai', 'AI Memory');
  }
  return { render };
})();CrackItModules.CrackItAIMemory = CrackItAIMemory;

const CrackItAgents = (() => {
  'use strict'; const { escapeHtml, icons, icon } = CrackItUtils;
  async function render(container) {
    const agents = [
      { name: 'Security Analyst', status: 'active', tasks: 3, desc: 'Monitors and analyzes security alerts' },
      { name: 'Code Reviewer', status: 'active', tasks: 5, desc: 'Reviews source code for vulnerabilities' },
      { name: 'Bug Hunter', status: 'idle', tasks: 0, desc: 'Identifies and categorizes software bugs' },
      { name: 'Recon Specialist', status: 'active', tasks: 2, desc: 'Performs reconnaissance and enumeration' }
    ];
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>AI Agents</h1><p>Automated security agents for continuous monitoring</p></div></div>
      <div class="dashboard-grid">${agents.map(a => `
        <div class="col-span-3"><div class="card"><div class="card-body" style="padding:16px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><div style="width:8px;height:8px;border-radius:50%;background:${a.status==='active'?'var(--accent-green)':'var(--text-muted)'}"></div><div style="font-weight:600;font-size:14px">${escapeHtml(a.name)}</div></div><p style="font-size:12px;color:var(--text-muted);margin:0 0 8px">${escapeHtml(a.desc)}</p><div style="font-size:11px;color:var(--text-muted)">${a.tasks} active tasks</div></div></div></div>`).join('')}
      </div>`;
    CrackItNavigation.updateBreadcrumbs('agents', 'AI Agents');
  }
  return { render };
})();CrackItModules.CrackItAgents = CrackItAgents;

const CrackItPrompts = (() => {
  'use strict'; const { escapeHtml, icons, icon } = CrackItUtils;
  async function render(container) {
    const categories = ['Web Security', 'API Security', 'Code Review', 'Malware Analysis', 'OSINT', 'Reports', 'Automation'];
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>Prompt Library</h1><p>Categorized AI prompts for security tasks</p></div></div>
      <div class="dashboard-grid">
        <div class="col-span-12"><div class="card"><div class="card-header"><span class="card-title">Categories</span></div><div class="card-body"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">${categories.map(c => `<div class="card hover-lift" style="padding:16px;cursor:pointer;border:1px solid var(--border)"><div style="font-weight:600;font-size:14px">${escapeHtml(c)}</div><div style="font-size:11px;color:var(--text-muted);margin-top:4px">Prompts</div></div>`).join('')}</div></div></div></div>
      </div>`;
    CrackItNavigation.updateBreadcrumbs('prompts', 'Prompt Library');
  }
  return { render };
})();CrackItModules.CrackItPrompts = CrackItPrompts;

const CrackItHE = (() => {
  'use strict'; const { escapeHtml, formatDate, icons, icon } = CrackItUtils;
  const workspaces = [
    { id: 'web', label: 'Web App Security', icon: 'globe', desc: 'Web application penetration testing and vulnerability assessment' },
    { id: 'api', label: 'API Security', icon: 'lock', desc: 'REST, GraphQL, and SOAP API security testing' },
    { id: 'mobile', label: 'Mobile Security', icon: 'smartphone', desc: 'iOS and Android application security review' },
    { id: 'desktop', label: 'Desktop Security', icon: 'monitor', desc: 'Desktop software security assessment' },
    { id: 'codereview', label: 'Code Review', icon: 'code', desc: 'Source code security audit and analysis' },
    { id: 'network', label: 'Network Assessment', icon: 'radio', desc: 'Network infrastructure penetration testing' },
    { id: 'wireless', label: 'Wireless Review', icon: 'wifi', desc: 'Wireless network security evaluation' },
    { id: 'cloud', label: 'Cloud Security', icon: 'cloud', desc: 'Cloud infrastructure security review' },
    { id: 'container', label: 'Container Security', icon: 'layers', desc: 'Container and Kubernetes security assessment' }
  ];
  let activeTab = 'dashboard';
  let heEnvironments = [];

  async function render(container) {
    await loadEnvironments();
    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="page-header"><div class="page-header-content"><h1>HE — Hacking Environment</h1><p>Authorized security assessment workspace (${heEnvironments.filter(e => e.status === 'running').length} active)</p></div>
        <div class="page-header-actions"><button class="btn btn-primary" data-he-action="new-assessment">${icon('plus')} New Assessment</button><button class="btn btn-secondary" data-he-action="export">${icon('upload')} Export Report</button></div></div>
      <div class="he-tabs" style="display:flex;gap:4px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px">
        <button class="he-tab ${activeTab === 'dashboard' ? 'active' : ''}" data-he-tab="dashboard">${icon('dashboard')} Dashboard</button>
        ${workspaces.map(w => `<button class="he-tab ${activeTab === w.id ? 'active' : ''}" data-he-tab="${w.id}">${icon(w.icon)} ${w.label}</button>`).join('')}
      </div>
      <div id="he-content"></div>`;
    container.querySelectorAll('.he-tab').forEach(tab => {
      tab.addEventListener('click', () => { activeTab = tab.dataset.heTab; renderContent(container); });
    });
    container.querySelector('[data-he-action="new-assessment"]')?.addEventListener('click', () => showNewAssessmentDialog(container));
    renderContent(container);
    CrackItNavigation.updateBreadcrumbs('he', 'HE — Hacking Environment');
  }

  async function loadEnvironments() {
    if (CrackItAPI.isAuthenticated()) {
      try {
        const data = await CrackItAPI.he.list();
        heEnvironments = data.map(e => ({
          id: e.id, target: e.target || e.name, type: e.env_type,
          status: e.status, severity: 'medium',
          findings: 0, critical: 0, high: 0,
          started: e.started_at, scope: e.description || 'Authorized scope',
          authorization_confirmed: e.authorization_confirmed,
        }));
        return;
      } catch { /* use fallback */ }
    }
    heEnvironments = CrackItStorage.get('he_assessments', []);
  }

  function renderContent(container) {
    const content = container.querySelector('#he-content');
    if (!content) return;
    if (activeTab === 'dashboard') renderDashboard(content);
    else renderWorkspace(content, workspaces.find(w => w.id === activeTab));
  }

  function renderDashboard(container) {
    const active = heEnvironments.filter(a => a.status === 'in-progress' || a.status === 'running').length;
    const totalFindings = heEnvironments.reduce((s, a) => s + (a.findings || 0), 0);
    const totalCritical = heEnvironments.reduce((s, a) => s + (a.critical || 0), 0);
    container.innerHTML = `
      <div class="dashboard-grid" style="margin-bottom:16px">
        <div class="col-span-3"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-blue)">${heEnvironments.length}</div><div style="font-size:12px;color:var(--text-muted)">Total Environments</div></div></div></div>
        <div class="col-span-3"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-green)">${active}</div><div style="font-size:12px;color:var(--text-muted)">Running</div></div></div></div>
        <div class="col-span-3"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-red)">${totalCritical}</div><div style="font-size:12px;color:var(--text-muted)">Critical Findings</div></div></div></div>
        <div class="col-span-3"><div class="card"><div class="card-body" style="text-align:center;padding:20px"><div style="font-size:32px;font-weight:700;color:var(--accent-yellow)">${totalFindings}</div><div style="font-size:12px;color:var(--text-muted)">Total Findings</div></div></div></div>
      </div>
      <div class="card" style="margin-bottom:16px"><div class="card-header"><span class="card-title">${icon('target')} Authorized Targets</span><span class="badge badge-green">${heEnvironments.length} targets</span></div>
        <div class="card-body" style="padding:0"><div class="table-container"><table class="table"><thead><tr><th>Target</th><th>Type</th><th>Status</th><th>Findings</th><th>Scope</th><th>Actions</th></tr></thead><tbody>${heEnvironments.length ? heEnvironments.map(a => `<tr><td style="font-family:monospace;font-size:12px">${escapeHtml(a.target)}</td><td><span class="badge badge-gray">${a.type}</span></td><td><span class="badge badge-${a.status==='in-progress'||a.status==='running'?'blue':a.status==='completed'?'green':'yellow'}">${a.status}</span></td><td>${a.findings || 0}</td><td style="font-size:12px">${escapeHtml(a.scope || '')}</td><td><button class="btn btn-ghost btn-sm" data-action="he-open">${icon('externalLink')}</button></td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No environments yet. Click "New Assessment" to create one.</td></tr>'}</tbody></table></div></div></div>
      <div class="dashboard-grid">
        ${workspaces.slice(0, 6).map(w => `
          <div class="col-span-4"><div class="card hover-lift" data-he-tab="${w.id}" style="cursor:pointer"><div class="card-body" style="padding:16px;display:flex;align-items:center;gap:12px"><div style="font-size:24px;flex-shrink:0">${icon(w.icon)}</div><div><div style="font-weight:600;font-size:14px">${escapeHtml(w.label)}</div><div style="font-size:11px;color:var(--text-muted)">${escapeHtml(w.desc)}</div></div></div></div></div>
        `).join('')}
      </div>`;
    container.querySelectorAll('[data-he-tab]').forEach(el => {
      el.addEventListener('click', () => { activeTab = el.dataset.heTab; renderContent(container.closest('#workspace-content') || container); });
    });
  }

  function renderWorkspace(container, ws) {
    container.innerHTML = `
      <div class="dashboard-grid">
        <div class="col-span-8">
          <div class="card" style="margin-bottom:16px"><div class="card-header"><span class="card-title">${icon(ws.icon)} ${escapeHtml(ws.label)}</span></div>
            <div class="card-body"><div class="dashboard-grid">
              <div class="col-span-6"><div class="he-metric"><span class="he-metric-label">Objective</span><span class="he-metric-value">Identify and exploit vulnerabilities in ${ws.label.toLowerCase()} infrastructure</span></div></div>
              <div class="col-span-6"><div class="he-metric"><span class="he-metric-label">Scope</span><span class="he-metric-value">Authorized testing environment</span></div></div>
            </div></div></div>
          <div class="card"><div class="card-header"><span class="card-title">${icon('findings')} Findings</span></div>
            <div class="card-body"><div class="empty-state" style="padding:20px"><p style="font-size:13px;color:var(--text-muted)">Findings will appear here when an environment is active and scans are run.</p></div></div></div>
        </div>
        <div class="col-span-4">
          <div class="card" style="margin-bottom:16px"><div class="card-header"><span class="card-title">${icon('shield')} Risk Summary</span></div><div class="card-body"><div style="display:flex;flex-direction:column;gap:8px">
            ${[{label:'Critical',color:'var(--accent-red)',val:0},{label:'High',color:'var(--accent-orange)',val:0},{label:'Medium',color:'var(--accent-yellow)',val:0},{label:'Low',color:'var(--accent-green)',val:0}].map(r => `
              <div style="display:flex;align-items:center;gap:8px"><div style="width:10px;height:10px;border-radius:2px;background:${r.color}"></div><span style="font-size:12px;flex:1">${r.label}</span><span style="font-size:13px;font-weight:600">${r.val}</span></div>
            `).join('')}
          </div></div></div>
          <div class="card"><div class="card-header"><span class="card-title">${icon('chat')} AI Assistant</span></div><div class="card-body"><div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-sm btn-secondary" style="justify-content:flex-start" data-he-ai="analyze">${icon('scan')} Analyze findings</button>
            <button class="btn btn-sm btn-secondary" style="justify-content:flex-start" data-he-ai="report">${icon('reports')} Generate report</button>
          </div></div></div>
        </div>
      </div>`;
  }

  async function showNewAssessmentDialog(container) {
    if (!CrackItAPI.isAuthenticated()) {
      CrackItUI.toast('Sign in to create HE environments', 'warning');
      return;
    }
    const target = prompt('Enter authorized target (domain, IP, or URL):');
    if (!target) return;
    const envType = prompt('Environment type (web, api, network, mobile, cloud, container):') || 'web';
    const confirmed = confirm(`I confirm that I have authorization to test: ${target}`);
    if (!confirmed) return;

    try {
      await CrackItAPI.he.create({
        name: `${envType} assessment — ${target}`,
        description: `Security assessment of ${target}`,
        env_type: envType,
        target: target,
        authorization_confirmed: true,
        authorization_notes: 'User confirmed authorization',
      });
      CrackItUI.toast('Environment created', 'success');
      await render(container);
    } catch (err) {
      CrackItUI.toast('Failed to create environment: ' + err.message, 'error');
    }
  }

  return { render };
})();CrackItModules.CrackItHE = CrackItHE;


