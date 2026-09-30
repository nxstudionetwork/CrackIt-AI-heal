const CrackItProjects = (() => {
  'use strict';

  const { escapeHtml, formatDate, uid, icons, icon, debounce } = CrackItUtils;

  const PROJECT_MODULES = [
    { id: 'web-vuln', name: 'Web Vulnerability Assessment', icon: 'globe', description: 'Automated and manual web application security testing including OWASP Top 10 coverage.' },
    { id: 'api-sec', name: 'API Security Assessment', icon: 'link', description: 'REST, GraphQL, and SOAP API security testing with authentication and injection analysis.' },
    { id: 'mobile-sec', name: 'Mobile Application Security', icon: 'smartphone', description: 'iOS and Android application security assessment including static and dynamic analysis.' },
    { id: 'desktop-sec', name: 'Desktop Application Security', icon: 'monitor', description: 'Desktop application binary and runtime security assessment.' },
    { id: 'src-review', name: 'Source Code Review', icon: 'code', description: 'Manual and automated source code audit for security vulnerabilities.' },
    { id: 'secure-code', name: 'Secure Code Review', icon: 'code', description: 'Security-focused code review with SAST integration and best practices.' },
    { id: 'bug-hunt', name: 'Bug Hunting', icon: 'target', description: 'Proactive vulnerability discovery and responsible disclosure workflow.' },
    { id: 'malware', name: 'Malware Analysis', icon: 'zap', description: 'Static and dynamic malware sample analysis with IOC extraction.' },
    { id: 're-eng', name: 'Reverse Engineering', icon: 'toolbox', description: 'Binary, firmware, and software reverse engineering.' },
    { id: 'binary', name: 'Binary Analysis', icon: 'cpu', description: 'Deep binary inspection for vulnerabilities and backdoors.' },
    { id: 'threat-hunt', name: 'Threat Hunting', icon: 'crosshair', description: 'Proactive threat hunting across networks, endpoints, and logs.' },
    { id: 'forensics', name: 'Digital Forensics', icon: 'disc', description: 'Digital forensic investigation and evidence collection and analysis.' },
    { id: 'ir', name: 'Incident Response', icon: 'shield', description: 'Incident response lifecycle management from detection to recovery.' },
    { id: 'network-sec', name: 'Network Security Assessment', icon: 'wifi', description: 'Internal and external network penetration testing.' },
    { id: 'wireless', name: 'Wireless Security', icon: 'radio', description: 'Wi-Fi, Bluetooth, and wireless protocol security assessment.' },
    { id: 'cloud-sec', name: 'Cloud Security Assessment', icon: 'cloud', description: 'AWS, Azure, and GCP cloud infrastructure security review.' },
    { id: 'container', name: 'Container Security', icon: 'layers', description: 'Docker and container orchestration security assessment.' },
    { id: 'k8s', name: 'Kubernetes Security', icon: 'server', description: 'Kubernetes cluster security hardening and assessment.' },
    { id: 'ad', name: 'Active Directory Assessment', icon: 'users', description: 'Active Directory security review including privilege escalation paths.' },
    { id: 'iam', name: 'Identity & Access Management', icon: 'lock', description: 'IAM policy review, SSO testing, and privilege audit.' },
    { id: 'osint', name: 'OSINT Investigation', icon: 'search', description: 'Open source intelligence gathering and analysis.' },
    { id: 'threat-intel', name: 'Threat Intelligence', icon: 'map', description: 'Threat intelligence collection, analysis, and dissemination.' },
    { id: 'log-analysis', name: 'Log Analysis', icon: 'file', description: 'Security log analysis and pattern detection.' },
    { id: 'research', name: 'Security Research', icon: 'book', description: 'Security research and proof of concept development.' },
    { id: 'exploit', name: 'Exploit Research', icon: 'flask', description: 'Exploit development and vulnerability research.' },
    { id: 'red-team', name: 'Red Team Assessment', icon: 'flag', description: 'Adversarial simulation and red team operations.' },
    { id: 'blue-team', name: 'Blue Team Operations', icon: 'shield', description: 'Defensive security operations and monitoring.' },
    { id: 'purple', name: 'Purple Team Exercise', icon: 'users', description: 'Collaborative red-blue team exercise and gap analysis.' },
    { id: 'vuln-mgmt', name: 'Vulnerability Management', icon: 'barChart', description: 'Vulnerability tracking, prioritization, and remediation.' },
    { id: 'risk', name: 'Risk Assessment', icon: 'triangle', description: 'Comprehensive risk assessment and treatment planning.' },
    { id: 'compliance', name: 'Compliance Audit', icon: 'check', description: 'Regulatory compliance auditing and gap analysis.' },
    { id: 'docs', name: 'Security Documentation', icon: 'file', description: 'Security policy, procedure, and report documentation.' },
    { id: 'ai-sec', name: 'AI Security Assessment', icon: 'cpu', description: 'AI/ML model security testing and adversarial robustness evaluation.' },
    { id: 'prompt-inject', name: 'Prompt Injection Testing', icon: 'terminal', description: 'LLM prompt injection and jailbreak testing.' },
    { id: 'model-review', name: 'Model Security Review', icon: 'eye', description: 'AI model architecture review and security audit.' },
    { id: 'custom', name: 'Custom Module', icon: 'plus', description: 'Custom security assessment module with flexible configuration.' }
  ];

  const DEFAULT_FOLDERS = ['Findings', 'Evidence', 'Screenshots', 'Reports', 'Requests', 'Payloads', 'Notes', 'AI Conversations', 'Knowledge', 'Exports'];

  const DEFAULT_TASKS = {
    'web-vuln': ['Reconnaissance & Discovery', 'Automated Scanning', 'Manual Verification', 'Authentication Testing', 'Authorization Testing', 'Input Validation Testing', 'Session Management Review', 'API Endpoint Testing', 'Report Generation'],
    'api-sec': ['API Endpoint Discovery', 'Authentication Testing', 'Authorization Testing', 'Injection Testing', 'Rate Limit Testing', 'Mass Assignment Testing', 'Business Logic Review'],
    'mobile-sec': ['Static Code Analysis', 'Dynamic Runtime Analysis', 'Network Traffic Interception', 'Storage Analysis', 'API Integration Review', 'Permission Analysis', 'Binary Analysis'],
    'desktop-sec': ['Binary Analysis', 'Memory Analysis', 'File System Review', 'Network Communication Review', 'Registry/Config Analysis'],
    'src-review': ['Architecture Review', 'Automated SAST Scanning', 'Manual Code Review', 'Dependency Analysis', 'Secret Detection', 'Logic Flow Review'],
    'secure-code': ['Threat Modeling', 'Secure Code Review', 'SAST Integration', 'Best Practice Validation', 'Remediation Verification'],
    'bug-hunt': ['Target Reconnaissance', 'Attack Surface Mapping', 'Vulnerability Discovery', 'Proof of Concept', 'Responsible Disclosure'],
    'malware': ['Static Analysis', 'Dynamic Analysis', 'Network Behavior Analysis', 'IOC Extraction', 'YARA Rule Creation'],
    're-eng': ['Binary Analysis', 'Disassembly', 'Decompilation', 'Protocol Analysis', 'Anti-Analysis Bypass'],
    'binary': ['File Format Analysis', 'Memory Inspection', 'Vulnerability Identification', 'Exploit Development'],
    'threat-hunt': ['Hypothesis Generation', 'Data Collection', 'Threat Detection', 'Investigation', 'Remediation'],
    'forensics': ['Evidence Acquisition', 'Disk Analysis', 'Memory Analysis', 'Timeline Analysis', 'Artifact Analysis'],
    'ir': ['Detection & Analysis', 'Containment', 'Eradication', 'Recovery', 'Post-Incident Review'],
    'network-sec': ['Network Discovery', 'Port Scanning', 'Service Enumeration', 'Vulnerability Scanning', 'Exploitation', 'Post-Exploitation'],
    'wireless': ['Wireless Survey', 'Deauthentication Testing', 'WPA/WPA2 Cracking', 'Bluetooth Analysis', 'RF Analysis'],
    'cloud-sec': ['Asset Discovery', 'IAM Review', 'Storage Audit', 'Network Security Review', 'Compliance Check'],
    'container': ['Image Analysis', 'Dockerfile Review', 'Runtime Security', 'Registry Audit', 'Network Policy Review'],
    'k8s': ['Cluster Enumeration', 'RBAC Review', 'Pod Security Review', 'Network Policy Analysis', 'Secret Management Review'],
    'ad': ['Domain Enumeration', 'Privilege Escalation Paths', 'Kerberos Attacks', 'ACL Abuse', 'Trust Relationship Review'],
    'iam': ['User Access Review', 'Role Analysis', 'MFA Assessment', 'SSO Configuration Review', 'Privilege Audit'],
    'osint': ['Passive Reconnaissance', 'Social Media Analysis', 'Dark Web Search', 'Data Correlation', 'Report Generation'],
    'threat-intel': ['Source Collection', 'IOC Processing', 'Threat Analysis', 'Intel Dissemination', 'Feed Management'],
    'log-analysis': ['Log Collection Setup', 'Pattern Detection', 'Anomaly Identification', 'Correlation Analysis', 'Alert Tuning'],
    'research': ['Literature Review', 'Hypothesis Testing', 'Proof of Concept', 'Documentation', 'Tool Development'],
    'exploit': ['Vulnerability Analysis', 'Exploit Development', 'Testing & Validation', 'Metasploit Module Creation'],
    'red-team': ['Reconnaissance', 'Initial Access', 'Persistence', 'Privilege Escalation', 'Lateral Movement', 'Exfiltration'],
    'blue-team': ['Monitor Tuning', 'Detection Rule Creation', 'Incident Triage', 'Threat Analysis', 'SOAR Automation'],
    'purple': ['Attack Simulation', 'Detection Validation', 'Gap Analysis', 'Process Improvement', 'Knowledge Transfer'],
    'vuln-mgmt': ['Asset Discovery', 'Vulnerability Scanning', 'Risk Prioritization', 'Remediation Tracking', 'Reporting'],
    'risk': ['Asset Identification', 'Threat Assessment', 'Vulnerability Analysis', 'Risk Calculation', 'Treatment Planning'],
    'compliance': ['Framework Selection', 'Control Mapping', 'Evidence Collection', 'Gap Analysis', 'Remediation Planning'],
    'docs': ['Policy Review', 'Procedure Documentation', 'Standard Creation', 'Guideline Development', 'Template Design'],
    'ai-sec': ['Model Discovery', 'Adversarial Testing', 'Data Poisoning Assessment', 'Model Extraction Testing', 'Fairness Analysis'],
    'prompt-inject': ['Prompt Analysis', 'Injection Testing', 'Jailbreak Testing', 'Output Validation', 'Guardrail Assessment'],
    'model-review': ['Architecture Review', 'Training Data Audit', 'Model Behavior Testing', 'Security Control Review'],
    'custom': ['Define Scope', 'Execute Assessment', 'Analyze Findings', 'Generate Report', 'Review & Deliver']
  };

  const MODULE_ICONS = {
    'web-vuln': 'globe', 'api-sec': 'link', 'mobile-sec': 'smartphone', 'desktop-sec': 'monitor',
    'src-review': 'code', 'secure-code': 'code', 'bug-hunt': 'target', 'malware': 'zap',
    're-eng': 'toolbox', 'binary': 'cpu', 'threat-hunt': 'crosshair', 'forensics': 'disc',
    'ir': 'shield', 'network-sec': 'wifi', 'wireless': 'radio', 'cloud-sec': 'cloud',
    'container': 'layers', 'k8s': 'server', 'ad': 'users', 'iam': 'lock',
    'osint': 'search', 'threat-intel': 'map', 'log-analysis': 'file', 'research': 'book',
    'exploit': 'flask', 'red-team': 'flag', 'blue-team': 'shield', 'purple': 'users',
    'vuln-mgmt': 'barChart', 'risk': 'triangle', 'compliance': 'check', 'docs': 'file',
    'ai-sec': 'cpu', 'prompt-inject': 'terminal', 'model-review': 'eye', 'custom': 'plus'
  };

  const SEVERITY_COLORS = { critical: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#6B7280', info: '#10B981' };

  let viewMode = 'grid';
  let filterStatus = 'all';
  let sortBy = 'updated';
  let activeProjectId = null;
  let activeDetailTab = 'overview';
  let activeFileFolder = null;
  let fileViewMode = 'grid';
  let fileSortBy = 'name';
  let fileSearchQuery = '';

  async function render(container, page) {
    if (page === 'workspace') {
      return renderWorkspace(container);
    }
    const projects = getFilteredProjects();
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content">
          <h1>${icon('projects')} Projects</h1>
          <p>${CrackItStorage.getCollection('projects').length} projects · Manage your security initiatives</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" data-action="import">${icon('download')} Import</button>
          <button class="btn btn-primary" data-action="new-project">${icon('plus')} New Project</button>
        </div>
      </div>
      <div class="filter-bar">
        <input type="text" class="input" placeholder="Search projects..." id="project-search" style="max-width:280px">
        <select class="input select" id="project-filter" style="max-width:160px">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="planning">Planning</option>
          <option value="review">Review</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </select>
        <select class="input select" id="project-sort" style="max-width:160px">
          <option value="updated">Last Updated</option>
          <option value="name">Name</option>
          <option value="priority">Priority</option>
          <option value="progress">Progress</option>
        </select>
        <div class="view-toggle ml-auto">
          <button class="view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}" data-view="grid">${icons.grid}</button>
          <button class="view-toggle-btn ${viewMode === 'list' ? 'active' : ''}" data-view="list">${icons.list}</button>
        </div>
      </div>
      <div id="projects-container">
        ${viewMode === 'grid' ? renderGrid(projects) : renderList(projects)}
      </div>`;
    bindEvents(container);
  }

  function getFilteredProjects() {
    let projects = [...CrackItStorage.getCollection('projects')];
    const search = document.getElementById('project-search')?.value?.toLowerCase();
    if (filterStatus !== 'all') {
      projects = projects.filter(p => p.status === filterStatus);
    }
    if (search) {
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(search) ||
        (p.description || '').toLowerCase().includes(search)
      );
    }
    projects.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'priority') {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] || 4) - (order[b.priority] || 4);
      }
      if (sortBy === 'progress') return b.progress - a.progress;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
    return projects;
  }

  async function apiCreateProject(data) {
    if (CrackItAPI.isAuthenticated()) {
      try {
        const result = await CrackItAPI.projects.create(data);
        const normalized = { ...result, technologyStack: result.technology_stack, targetUrls: result.target_urls, programmingLanguage: result.programming_language, rulesOfEngagement: result.rules_of_engagement, testingWindow: result.testing_window, riskLevel: result.risk_level, createdAt: result.created_at, updatedAt: result.updated_at };
        CrackItStorage.addToCollection('projects', normalized);
        return normalized;
      } catch (e) { console.warn('API project create failed:', e); }
    }
    return null;
  }

  async function apiUpdateProject(id, data) {
    const snakeData = {};
    if (data.name !== undefined) snakeData.name = data.name;
    if (data.description !== undefined) snakeData.description = data.description;
    if (data.status !== undefined) snakeData.status = data.status;
    if (data.priority !== undefined) snakeData.priority = data.priority;
    if (data.progress !== undefined) snakeData.progress = data.progress;
    if (data.color !== undefined) snakeData.color = data.color;
    if (data.pinned !== undefined) snakeData.pinned = data.pinned;
    if (data.favorite !== undefined) snakeData.favorite = data.favorite;
    if (data.archived !== undefined) snakeData.archived = data.archived;
    if (data.tags !== undefined) snakeData.tags = data.tags;
    if (data.modules !== undefined) snakeData.modules = data.modules;
    if (data.client !== undefined) snakeData.client = data.client;
    if (data.technologyStack !== undefined) snakeData.technology_stack = data.technologyStack;
    if (data.targetUrls !== undefined) snakeData.target_urls = data.targetUrls;
    if (data.repository !== undefined) snakeData.repository = data.repository;
    if (data.programmingLanguage !== undefined) snakeData.programming_language = data.programmingLanguage;
    if (data.framework !== undefined) snakeData.framework = data.framework;
    if (data.scope !== undefined) snakeData.scope = data.scope;
    if (data.rulesOfEngagement !== undefined) snakeData.rules_of_engagement = data.rulesOfEngagement;
    if (data.objectives !== undefined) snakeData.objectives = data.objectives;
    if (data.testingWindow !== undefined) snakeData.testing_window = data.testingWindow;
    if (CrackItAPI.isAuthenticated()) {
      try {
        const result = await CrackItAPI.projects.update(id, snakeData);
        const normalized = { ...result, technologyStack: result.technology_stack, targetUrls: result.target_urls, programmingLanguage: result.programming_language, rulesOfEngagement: result.rules_of_engagement, testingWindow: result.testing_window, riskLevel: result.risk_level, createdAt: result.created_at, updatedAt: result.updated_at };
        CrackItStorage.updateInCollection('projects', id, normalized);
        return normalized;
      } catch (e) { console.warn('API project update failed:', e); }
    }
    CrackItStorage.updateInCollection('projects', id, data);
    return null;
  }

  async function apiDeleteProject(id) {
    if (CrackItAPI.isAuthenticated()) {
      try { await CrackItAPI.projects.delete(id); } catch (e) { console.warn('API project delete failed:', e); }
    }
    CrackItStorage.removeFromCollection('projects', id);
  }

  async function apiDuplicateProject(id) {
    if (CrackItAPI.isAuthenticated()) {
      try {
        const result = await fetch(`${CrackItAPI.BASE_URL}/api/v1/projects/${id}/duplicate`, { method: 'POST', headers: { 'Authorization': `Bearer ${CrackItAPI.accessToken}`, 'Content-Type': 'application/json' } });
        if (result.ok) {
          const data = await result.json();
          const normalized = { ...data, technologyStack: data.technology_stack, targetUrls: data.target_urls, programmingLanguage: data.programming_language, rulesOfEngagement: data.rules_of_engagement, testingWindow: data.testing_window, riskLevel: data.risk_level, createdAt: data.created_at, updatedAt: data.updated_at };
          CrackItStorage.addToCollection('projects', normalized);
          return normalized;
        }
      } catch (e) { console.warn('API project duplicate failed:', e); }
    }
    return null;
  }

  function renderGrid(projects) {
    return `<div class="project-grid">${projects.map(p => `
      <div class="card project-card hover-lift" data-context="project" data-id="${p.id}" draggable="true">
        <div class="card-body">
          <div class="project-card-header">
            <div class="project-card-icon" style="background:${p.color}20;color:${p.color}">${icons.projects}</div>
            ${p.pinned ? '<span class="badge badge-purple">Pinned</span>' : ''}
          </div>
          <div class="project-card-title">${escapeHtml(p.name)}</div>
          <div class="project-card-desc">${escapeHtml(p.description)}</div>
          <div class="project-card-tags">${(p.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
          <div class="progress mb-2"><div class="progress-bar" style="width:${p.progress}%"></div></div>
          <div class="project-card-meta">
            <span class="badge badge-${p.status === 'active' ? 'green' : 'gray'}">${p.status}</span>
            <span>${formatDate(p.updatedAt, true)}</span>
          </div>
        </div>
      </div>`).join('')}</div>`;
  }

  function renderList(projects) {
    return `<div class="table-container"><table class="table">
      <thead><tr><th><input type="checkbox" class="table-checkbox"></th><th>Project</th><th>Status</th><th>Priority</th><th>Progress</th><th>Updated</th><th></th></tr></thead>
      <tbody>${projects.map(p => `
        <tr data-context="project" data-id="${p.id}">
          <td><input type="checkbox" class="table-checkbox"></td>
          <td><div class="font-medium">${escapeHtml(p.name)}</div><div class="text-xs text-muted">${(p.tags || []).join(', ')}</div></td>
          <td><span class="badge badge-${p.status === 'active' ? 'green' : 'gray'}">${p.status}</span></td>
          <td><span class="badge badge-${p.priority === 'critical' ? 'red' : p.priority === 'high' ? 'yellow' : 'gray'}">${p.priority}</span></td>
          <td><div class="progress" style="width:80px"><div class="progress-bar" style="width:${p.progress}%"></div></div></td>
          <td class="text-muted">${formatDate(p.updatedAt, true)}</td>
          <td><button class="btn btn-ghost btn-icon">${icons.menu}</button></td>
        </tr>`).join('')}</tbody></table></div>`;
  }

  function renderWorkspace(container) {
    const tasks = CrackItStorage.getCollection('tasks').slice(0, 20);
    const columns = {
      'pending': tasks.filter(t => t.status === 'pending'),
      'in-progress': tasks.filter(t => t.status === 'in-progress'),
      'completed': tasks.filter(t => t.status === 'completed'),
      'blocked': tasks.filter(t => t.status === 'blocked')
    };
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content"><h1>${icon('workspace')} Workspace</h1><p>Kanban board for task management</p></div>
        <div class="page-header-actions"><button class="btn btn-primary" data-action="new-task">${icon('plus')} Add Task</button></div>
      </div>
      <div class="kanban-board">
        ${Object.entries(columns).map(([status, items]) => `
          <div class="kanban-column" data-status="${status}">
            <div class="kanban-column-header">
              <span>${status.replace('-', ' ')}</span>
              <span class="badge badge-gray">${items.length}</span>
            </div>
            ${items.slice(0, 8).map(t => `
              <div class="kanban-card" draggable="true" data-id="${t.id}">
                <div class="font-medium text-sm mb-2">${escapeHtml(t.title)}</div>
                <div class="flex gap-2"><span class="badge badge-${t.priority === 'critical' ? 'red' : 'gray'}">${t.priority}</span></div>
              </div>`).join('')}
          </div>`).join('')}
      </div>`;
    bindDragDrop(container);
    container.querySelector('[data-action="new-task"]')?.addEventListener('click', () => {
      CrackItUI.toast('New task created', 'success');
    });
  }

  function bindEvents(container) {
    container.querySelector('#project-search')?.addEventListener('input', debounce(() => {
      const projects = getFilteredProjects();
      container.querySelector('#projects-container').innerHTML =
        viewMode === 'grid' ? renderGrid(projects) : renderList(projects);
    }, 300));

    container.querySelector('#project-filter')?.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      const projects = getFilteredProjects();
      container.querySelector('#projects-container').innerHTML =
        viewMode === 'grid' ? renderGrid(projects) : renderList(projects);
    });

    container.querySelector('#project-sort')?.addEventListener('change', (e) => {
      sortBy = e.target.value;
      const projects = getFilteredProjects();
      container.querySelector('#projects-container').innerHTML =
        viewMode === 'grid' ? renderGrid(projects) : renderList(projects);
    });

    container.querySelectorAll('.project-card, .project-grid .card, .table tbody tr').forEach(el => {
      el.addEventListener('dblclick', () => {
        const id = el.dataset.id;
        if (id) { activeProjectId = id; activeDetailTab = 'overview'; renderProjectDetail(container); }
      });
    });

    container.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        container.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.view === viewMode));
        const projects = getFilteredProjects();
        container.querySelector('#projects-container').innerHTML =
          viewMode === 'grid' ? renderGrid(projects) : renderList(projects);
      });
    });

    container.querySelector('[data-action="new-project"]')?.addEventListener('click', () => {
      showModulePicker(container);
    });

    container.querySelector('[data-action="import"]')?.addEventListener('click', () => {
      CrackItUI.toast('Import dialog opened', 'info');
    });

    container.addEventListener('contextmenu', (e) => {
      const card = e.target.closest('[data-context="project"], .project-card, .card.project-card');
      if (!card) return;
      e.preventDefault();
      const pid = card.dataset.id;
      if (!pid) return;
      const project = CrackItStorage.findInCollection('projects', pid);
      if (!project) return;
      const isArchived = project.status === 'archived';
      CrackItUI.showContextMenu(e.clientX, e.clientY, [
        { label: 'Open', icon: 'externalLink', handler: () => { activeProjectId = pid; activeDetailTab = 'overview'; renderProjectDetail(container); } },
        { label: isArchived ? 'Restore' : 'Archive', icon: isArchived ? 'refresh' : 'archive', handler: async () => {
          await apiUpdateProject(pid, { status: isArchived ? 'active' : 'archived', archived: !isArchived });
          CrackItUI.toast(isArchived ? 'Project restored' : 'Project archived', 'success');
          render(container);
        }},
        { label: 'Duplicate', icon: 'copy', handler: async () => {
          const dup = await apiDuplicateProject(pid);
          if (dup) {
            CrackItUI.toast('Project duplicated', 'success');
            render(container);
          } else {
            const localDup = { ...project, id: CrackItUtils.uid('proj'), name: project.name + ' (Copy)', status: 'planning', progress: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            CrackItStorage.addToCollection('projects', localDup);
            CrackItUI.toast('Project duplicated', 'success');
            render(container);
          }
        }},
        { label: project.pinned ? 'Unpin' : 'Pin', icon: 'pin', handler: async () => {
          await apiUpdateProject(pid, { pinned: !project.pinned });
          CrackItUI.toast(project.pinned ? 'Project unpinned' : 'Project pinned', 'success');
        }},
        { label: project.favorite ? 'Unfavorite' : 'Favorite', icon: 'star', handler: async () => {
          await apiUpdateProject(pid, { favorite: !project.favorite });
          CrackItUI.toast(project.favorite ? 'Removed from favorites' : 'Added to favorites', 'success');
        }},
        { label: 'Clone', icon: 'copy', handler: async () => {
          const clone = await apiDuplicateProject(pid);
          if (clone) {
            CrackItUI.toast('Project cloned', 'success');
            render(container);
          } else {
            const localClone = { ...project, id: CrackItUtils.uid('proj'), name: project.name + ' (Clone)', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            CrackItStorage.addToCollection('projects', localClone);
            CrackItUI.toast('Project cloned', 'success');
            render(container);
          }
        }},
        { label: 'Export JSON', icon: 'download', handler: () => {
          const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = `${project.name}.json`; a.click();
          URL.revokeObjectURL(url);
          CrackItUI.toast('Project exported', 'success');
        }},
        { divider: true },
        { label: 'Delete', icon: 'trash', danger: true, handler: () => {
          if (confirm('Delete this project permanently?')) {
            apiDeleteProject(pid);
            CrackItUI.toast('Project deleted', 'warning');
            render(container);
          }
        }},
      ]);
    });

    bindDragDrop(container);
  }

  function showModulePicker(container) {
    const selectedModules = new Set();
    const pickerId = 'module-picker';

    function renderPicker() {
      const content = `
        <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:14px;font-weight:500"><span id="module-count">${selectedModules.size}</span> module(s) selected</span>
          <span style="font-size:12px;color:var(--text-muted)">Click to toggle modules</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;max-height:420px;overflow-y:auto;padding:4px">
          ${PROJECT_MODULES.map(m => {
            const sel = selectedModules.has(m.id) ? 'true' : 'false';
            return `
              <div class="card module-option ${selectedModules.has(m.id) ? 'module-selected' : ''}" data-mod-id="${m.id}" style="cursor:pointer;padding:14px;border:2px solid ${selectedModules.has(m.id) ? 'var(--accent-blue)' : 'var(--border)'};transition:all 0.2s">
                <div style="font-size:28px;margin-bottom:8px;color:${selectedModules.has(m.id) ? 'var(--accent-blue)' : 'var(--text-muted)'}">${icon(MODULE_ICONS[m.id] || 'shield')}</div>
                <div style="font-size:13px;font-weight:600;margin-bottom:4px">${escapeHtml(m.name)}</div>
                <div style="font-size:11px;color:var(--text-muted);line-height:1.4">${escapeHtml(m.description)}</div>
                ${selectedModules.has(m.id) ? '<div style="margin-top:8px"><span class="badge badge-blue">Selected</span></div>' : ''}
              </div>`;
          }).join('')}
        </div>`;

      const overlay = document.querySelector(`#modal-${pickerId}`);
      if (!overlay) return;
      const bodyEl = overlay.querySelector('.modal-body');
      if (bodyEl) bodyEl.innerHTML = content;

      overlay.querySelectorAll('.module-option').forEach(card => {
        card.addEventListener('click', () => {
          const modId = card.dataset.modId;
          if (selectedModules.has(modId)) {
            selectedModules.delete(modId);
            card.classList.remove('module-selected');
            card.style.borderColor = 'var(--border)';
            const iconEl = card.querySelector('.icon');
            if (iconEl) iconEl.style.color = 'var(--text-muted)';
            const badge = card.querySelector('.badge');
            if (badge) badge.remove();
          } else {
            selectedModules.add(modId);
            card.classList.add('module-selected');
            card.style.borderColor = 'var(--accent-blue)';
            const iconEl = card.querySelector('.icon');
            if (iconEl) iconEl.style.color = 'var(--accent-blue)';
            if (!card.querySelector('.badge')) {
              const div = card.querySelector('div:last-child') || card;
              const b = document.createElement('div');
              b.style.marginTop = '8px';
              b.innerHTML = '<span class="badge badge-blue">Selected</span>';
              div.after(b);
            }
          }
          const countEl = document.getElementById('module-count');
          if (countEl) countEl.textContent = selectedModules.size;
        });
      });
    }

    CrackItUI.openModal(pickerId, {
      title: 'New Project — Select Modules',
      content: '',
      footer: `
        <button class="btn btn-secondary modal-close">Cancel</button>
        <button class="btn btn-ghost" id="module-skip">Blank Project</button>
        <button class="btn btn-primary" id="module-create">Create Project</button>`
    });

    renderPicker();

    const overlay = document.querySelector(`#modal-${pickerId}`);
    if (!overlay) return;

    overlay.querySelector('#module-skip')?.addEventListener('click', () => {
      CrackItUI.closeModal(pickerId);
      createProjectWithModules([], container);
    });

    overlay.querySelector('#module-create')?.addEventListener('click', () => {
      if (selectedModules.size === 0) {
        CrackItUI.toast('Select at least one module or use Blank Project', 'warning');
        return;
      }
      CrackItUI.closeModal(pickerId);
      createProjectWithModules([...selectedModules], container);
    });
  }

  async function createProjectWithModules(moduleIds, container) {
    const now = new Date().toISOString();
    const projectId = uid('proj');
    const moduleNames = moduleIds.map(id => PROJECT_MODULES.find(m => m.id === id)).filter(Boolean);
    const projectName = moduleNames.length ? moduleNames.map(m => m.name.split(' ').slice(0, 2).join(' ')).join(' + ') + ' Assessment' : 'New Project';

    const projectData = {
      name: projectName,
      description: moduleNames.length ? `Security assessment project covering ${moduleNames.map(m => m.name).join(', ')}.` : 'Project description...',
      status: 'planning',
      priority: 'medium',
      progress: 0,
      tags: moduleIds.map(id => id),
      color: '#3B82F6',
      pinned: false,
      modules: moduleIds,
      client: '',
      technologyStack: '',
      targetUrls: '',
      repository: '',
      programmingLanguage: '',
      framework: '',
      scope: '',
      rulesOfEngagement: '',
      objectives: '',
      testingWindow: ''
    };

    const apiProject = await apiCreateProject(projectData);
    const project = apiProject || CrackItStorage.addToCollection('projects', { id: projectId, ...projectData, members: ['Admin'], template: moduleNames.length ? 'Module-based' : 'Custom', createdAt: now, updatedAt: now });

    moduleIds.forEach(modId => {
      const mod = PROJECT_MODULES.find(m => m.id === modId);
      if (!mod) return;
      DEFAULT_FOLDERS.forEach(folder => {
        CrackItStorage.addToCollection('files', {
          id: uid('file'),
          name: `New ${folder.toLowerCase().replace(/\s+/g, '-')}`,
          folder: `${mod.name}/${folder}`,
          type: 'md',
          size: 0,
          projectId: projectId,
          favorite: false,
          createdAt: now,
          modifiedAt: now,
          path: `/projects/${projectId}/${mod.name}/${folder}/`
        });
      });

      const tasks = DEFAULT_TASKS[modId] || ['Reconnaissance', 'Assessment', 'Analysis', 'Reporting'];
      tasks.forEach(task => {
        CrackItStorage.addToCollection('tasks', {
          id: uid('task'),
          title: `[${mod.name}] ${task}`,
          status: 'pending',
          priority: 'medium',
          project: projectId,
          projectId: projectId,
          module: modId,
          assignee: 'Admin',
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
          createdAt: now
        });
      });

      CrackItStorage.addToCollection('reports', {
        id: uid('report'),
        title: `${mod.name} Assessment Report`,
        summary: `Security assessment report for ${mod.name}.`,
        severity: 'medium',
        status: 'draft',
        findings: 0,
        riskScore: 0,
        projectId: projectId,
        module: modId,
        author: 'Admin',
        createdAt: now,
        updatedAt: now,
        tags: [modId]
      });

      CrackItStorage.addToCollection('conversations', {
        id: uid('conv'),
        title: `${mod.name} — AI Assistant`,
        module: modId,
        projectId: projectId,
        messages: [
          { role: 'assistant', content: `Welcome to the AI assistant for ${mod.name}. How can I help with your assessment?`, timestamp: now }
        ],
        pinned: false,
        createdAt: now
      });

      CrackItStorage.addToCollection('notes', {
        id: uid('note'),
        title: `${mod.name} — Knowledge Base`,
        content: `# ${mod.name}\n\n## Overview\n\n## Methodology\n\n## Key Findings\n\n## References\n`,
        folder: `${mod.name}/Knowledge`,
        module: modId,
        projectId: projectId,
        tags: [modId, 'knowledge', 'template'],
        pinned: false,
        favorite: false,
        createdAt: now,
        updatedAt: now,
        wordCount: 50
      });

      CrackItStorage.addToCollection('findings', {
        id: uid('find'),
        title: `Placeholder Finding — ${mod.name}`,
        severity: 'info',
        category: mod.name,
        description: 'This is a placeholder finding. Update with actual findings from your assessment.',
        evidence: '',
        recommendation: '',
        status: 'open',
        projectId: projectId,
        module: modId,
        createdAt: now
      });
    });

    CrackItUI.toast(`Project "${project.name}" created with ${moduleIds.length} module(s)`, 'success');
    render(container);
  }

  function closeProjectDetail() {
    activeProjectId = null;
    activeDetailTab = 'overview';
    activeFileFolder = null;
    fileSearchQuery = '';
    const container = document.getElementById('workspace-content');
    if (container) render(container);
  }

  function renderProjectDetail(container) {
    const project = CrackItStorage.findInCollection('projects', activeProjectId);
    if (!project) { activeProjectId = null; render(container); return; }

    const files = CrackItStorage.getCollection('files').filter(f => f.projectId === project.id);
    const tasks = CrackItStorage.getCollection('tasks').filter(t => t.projectId === project.id || t.project === project.id);
    const reports = CrackItStorage.getCollection('reports').filter(r => r.projectId === project.id);
    const conversations = CrackItStorage.getCollection('conversations').filter(c => c.projectId === project.id);
    const findings = CrackItStorage.getCollection('findings').filter(f => f.projectId === project.id);
    const notes = CrackItStorage.getCollection('notes').filter(n => n.projectId === project.id);
    const folders = [...new Set(files.map(f => f.folder))];
    const moduleList = (project.modules || []).map(id => PROJECT_MODULES.find(m => m.id === id)).filter(Boolean);

    const tabs = ['overview', 'modules', 'tasks', 'ai', 'assets', 'findings', 'evidence', 'scope', 'checklists', 'reports', 'timeline', 'automation', 'settings'];

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content" style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-ghost btn-icon" data-action="back-to-projects" title="Back to projects">${icons.chevronLeft}</button>
          <div>
            <h1 style="margin:0;font-size:20px">${escapeHtml(project.name)}</h1>
            <p style="margin:2px 0 0;color:var(--text-muted);font-size:12px">${project.description}</p>
          </div>
        </div>
        <div class="page-header-actions">
          <span class="badge badge-${project.status === 'active' ? 'green' : 'gray'}" style="margin-right:8px">${project.status}</span>
          <span class="badge badge-${project.priority === 'critical' ? 'red' : project.priority === 'high' ? 'yellow' : 'gray'}" style="margin-right:8px">${project.priority}</span>
          <button class="btn btn-secondary btn-sm" data-action="edit-project">${icon('edit')} Edit</button>
          <button class="btn btn-ghost btn-sm" data-action="archive-project">${icon('archive')} Archive</button>
          <button class="btn btn-ghost btn-sm text-red" data-action="delete-project">${icon('trash')} Delete</button>
        </div>
      </div>

      <div class="project-detail-tabs" style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:0;overflow-x:auto">
        ${tabs.map(t => `
          <button class="btn btn-ghost btn-sm project-tab ${activeDetailTab === t ? 'active' : ''}" data-tab="${t}" style="padding:8px 16px;border-bottom:2px solid ${activeDetailTab === t ? 'var(--accent-blue)' : 'transparent'};border-radius:0;text-transform:capitalize">${t}</button>
        `).join('')}
      </div>

      <div id="project-detail-content">
        ${renderDetailTab(activeDetailTab, project, files, tasks, reports, conversations, folders, findings, notes, moduleList)}
      </div>`;

    bindDetailEvents(container, project);
  }

  function renderDetailTab(tab, project, files, tasks, reports, conversations, folders, findings, notes, moduleList) {
    const fns = {
      overview: () => renderDetailOverview(project, files, reports, conversations, findings, notes, moduleList),
      modules: () => renderDetailModules(project, moduleList, tasks, findings),
      tasks: () => renderDetailTasks(project, tasks),
      ai: () => renderDetailAI(project, conversations),
      assets: () => renderDetailAssets(project),
      findings: () => renderDetailFindings(project, findings),
      evidence: () => renderDetailEvidence(project, findings, files),
      scope: () => renderDetailScope(project),
      checklists: () => renderDetailChecklists(project, moduleList),
      reports: () => renderDetailReports(project, reports),
      timeline: () => renderDetailTimeline(project, files, tasks, conversations),
      automation: () => renderDetailAutomation(project),
      settings: () => renderDetailSettings(project)
    };
    return (fns[tab] || fns.overview)();
  }

  function renderDetailOverview(project, files, reports, conversations, findings, notes, moduleList) {
    const relReports = reports.slice(0, 3);
    const relFiles = files.slice(0, 5);
    const relChats = conversations.filter(c => c.title?.toLowerCase().includes(project.name.toLowerCase())).slice(0, 3);

    return `
      <div class="dashboard-grid">
        <div class="col-span-8">
          <div class="card">
            <div class="card-header"><span class="card-title">General</span></div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Project Name</label><div style="color:var(--text-primary);font-weight:500;margin-top:2px">${escapeHtml(project.name)}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Client</label><div style="color:var(--text-primary);font-weight:500;margin-top:2px">${escapeHtml(project.client || '—')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Status</label><div style="color:var(--text-primary);font-weight:500;margin-top:2px"><span class="badge badge-${project.status === 'active' ? 'green' : 'gray'}">${project.status}</span></div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Priority</label><div style="color:var(--text-primary);font-weight:500;margin-top:2px"><span class="badge badge-${project.priority === 'critical' ? 'red' : project.priority === 'high' ? 'yellow' : 'gray'}">${project.priority}</span></div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Progress</label><div class="progress" style="width:120px;margin-top:2px"><div class="progress-bar" style="width:${project.progress}%"></div></div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Risk Level</label><div style="color:var(--text-primary);font-weight:500;margin-top:2px">${project.riskLevel || 'Not assessed'}</div></div>
              </div>
              ${project.description ? `<div style="margin-top:16px"><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Description</label><p style="color:var(--text-secondary);margin:4px 0 0">${escapeHtml(project.description)}</p></div>` : ''}
            </div>
          </div>

          <div class="card mt-4">
            <div class="card-header"><span class="card-title">Technical</span></div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Technology Stack</label><div style="color:var(--text-primary);margin-top:2px">${escapeHtml(project.technologyStack || '—')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Target URLs</label><div style="color:var(--text-primary);margin-top:2px">${escapeHtml(project.targetUrls || '—')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Repository</label><div style="color:var(--text-primary);margin-top:2px">${escapeHtml(project.repository || '—')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Language</label><div style="color:var(--text-primary);margin-top:2px">${escapeHtml(project.programmingLanguage || '—')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Framework</label><div style="color:var(--text-primary);margin-top:2px">${escapeHtml(project.framework || '—')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Category</label><div style="color:var(--text-primary);margin-top:2px">${project.category || project.template || 'General'}</div></div>
              </div>
            </div>
          </div>

          <div class="card mt-4">
            <div class="card-header"><span class="card-title">Security</span></div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Scope</label><div style="color:var(--text-primary);margin-top:2px">${escapeHtml(project.scope || '—')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Rules of Engagement</label><div style="color:var(--text-primary);margin-top:2px">${escapeHtml(project.rulesOfEngagement || '—')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Objectives</label><div style="color:var(--text-primary);margin-top:2px">${escapeHtml(project.objectives || '—')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Testing Window</label><div style="color:var(--text-primary);margin-top:2px">${escapeHtml(project.testingWindow || '—')}</div></div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-4">
          <div class="card">
            <div class="card-header"><span class="card-title">Relationships</span></div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:12px">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
                  <span style="font-size:13px">${icon('reports')} Reports</span>
                  <span style="font-weight:600">${reports.length}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
                  <span style="font-size:13px">${icon('target')} Findings</span>
                  <span style="font-weight:600">${findings.length}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
                  <span style="font-size:13px">${icon('shield')} Evidence</span>
                  <span style="font-weight:600">${files.filter(f => f.folder?.includes('Evidence')).length}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
                  <span style="font-size:13px">${icon('files')} Files</span>
                  <span style="font-weight:600">${files.length}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
                  <span style="font-size:13px">${icon('chat')} AI Chats</span>
                  <span style="font-weight:600">${conversations.length}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
                  <span style="font-size:13px">${icon('book')} Knowledge</span>
                  <span style="font-weight:600">${notes.length}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0">
                  <span style="font-size:13px">${icon('automation')} Automations</span>
                  <span style="font-weight:600">${CrackItStorage.getCollection('workflows').filter(w => w.projectId === project.id).length}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-4">
            <div class="card-header"><span class="card-title">Modules</span></div>
            <div class="card-body">
              ${moduleList.length ? moduleList.map(m => `
                <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
                  <span style="color:var(--accent-blue)">${icon(MODULE_ICONS[m.id] || 'shield')}</span>
                  <span style="font-size:13px;flex:1">${escapeHtml(m.name)}</span>
                </div>`).join('') : '<div style="font-size:13px;color:var(--text-muted);padding:8px 0">No modules configured</div>'}
            </div>
          </div>

          <div class="card mt-4">
            <div class="card-header"><span class="card-title">Quick Info</span></div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:8px">
                <div><span style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Created</span><div style="font-size:13px;margin-top:2px">${formatDate(project.createdAt, true)}</div></div>
                <div><span style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Modified</span><div style="font-size:13px;margin-top:2px">${formatDate(project.updatedAt, true)}</div></div>
                <div><span style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Template</span><div style="font-size:13px;margin-top:2px">${project.template || 'Custom'}</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderDetailModules(project, moduleList, tasks, findings) {
    const modTasks = {};
    const modFindings = {};
    (project.modules || []).forEach(modId => {
      modTasks[modId] = tasks.filter(t => t.module === modId || (t.title && t.title.includes(PROJECT_MODULES.find(m => m.id === modId)?.name || '')));
      modFindings[modId] = findings.filter(f => f.module === modId);
    });

    return `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Enabled Modules (${moduleList.length})</span>
          <button class="btn btn-primary btn-sm" data-action="add-module">${icon('plus')} Add Module</button>
        </div>
        <div class="card-body">
          ${moduleList.length ? `
            <div class="dashboard-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
              ${moduleList.map(m => {
                const mTasks = modTasks[m.id] || [];
                const mFindings = modFindings[m.id] || [];
                const completed = mTasks.filter(t => t.status === 'completed').length;
                const progress = mTasks.length ? Math.round((completed / mTasks.length) * 100) : 0;
                return `
                  <div class="card" style="border:1px solid var(--border)">
                    <div class="card-body">
                      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                        <div style="font-size:28px;color:var(--accent-blue)">${icon(MODULE_ICONS[m.id] || 'shield')}</div>
                        <div style="flex:1">
                          <div style="font-weight:600;font-size:14px">${escapeHtml(m.name)}</div>
                          <div style="font-size:11px;color:var(--text-muted)">${m.description.split('.').slice(0,1).join('.')}</div>
                        </div>
                      </div>
                      <div class="flex gap-2" style="margin-bottom:10px;flex-wrap:wrap">
                        <span class="badge badge-gray">${mTasks.length} tasks</span>
                        <span class="badge badge-${mFindings.some(f => f.severity === 'critical' || f.severity === 'high') ? 'red' : 'gray'}">${mFindings.length} findings</span>
                        <span class="badge badge-blue">${progress}% done</span>
                      </div>
                      <div class="progress mb-2" style="height:4px"><div class="progress-bar" style="width:${progress}%"></div></div>
                      <div style="display:flex;gap:6px;margin-top:10px">
                        <button class="btn btn-primary btn-sm flex-1" data-action="open-module" data-mod-id="${m.id}">${icon('eye')} Open</button>
                        <button class="btn btn-ghost btn-sm" data-action="configure-module" data-mod-id="${m.id}">${icon('settings')}</button>
                        <button class="btn btn-ghost btn-sm text-red" data-action="remove-module" data-mod-id="${m.id}">${icon('trash')}</button>
                      </div>
                    </div>
                  </div>`;
              }).join('')}
            </div>
            <div style="margin-top:16px;text-align:center">
              <button class="btn btn-secondary" data-action="add-module">${icon('plus')} Add Module to Project</button>
            </div>` : '<div class="empty-state" style="padding:32px"><p>No modules configured for this project</p><button class="btn btn-primary btn-sm mt-2" data-action="add-module">Add Module</button></div>'}
        </div>
      </div>`;
  }

  function renderDetailTasks(project, tasks) {
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">Tasks (${tasks.length})</span><button class="btn btn-primary btn-sm" data-action="add-task">${icon('plus')} Add Task</button></div>
        <div class="card-body" style="padding:0">
          ${tasks.length ? `<div class="table-container"><table class="table">
            <thead><tr><th>Task</th><th>Module</th><th>Status</th><th>Priority</th><th>Due</th><th></th></tr></thead>
            <tbody>${tasks.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(t => {
              const modName = t.module ? (PROJECT_MODULES.find(m => m.id === t.module)?.name || '') : '';
              return `<tr>
                <td>${escapeHtml(t.title)}</td>
                <td>${modName ? `<span class="badge badge-gray">${escapeHtml(modName)}</span>` : '—'}</td>
                <td><span class="badge badge-${t.status === 'completed' ? 'green' : t.status === 'in-progress' ? 'blue' : 'gray'}">${t.status}</span></td>
                <td><span class="badge badge-${t.priority === 'critical' ? 'red' : t.priority === 'high' ? 'yellow' : 'gray'}">${t.priority}</span></td>
                <td class="text-muted">${t.dueDate ? formatDate(t.dueDate, true) : '—'}</td>
                <td><button class="btn btn-ghost btn-icon btn-sm" data-action="toggle-task" data-id="${escapeHtml(t.id)}">${icons.check}</button></td>
              </tr>`;
            }).join('')}</tbody></table></div>`
            : '<div class="empty-state" style="padding:32px"><p>No tasks yet</p><button class="btn btn-primary btn-sm mt-2" data-action="add-task">Add First Task</button></div>'}
        </div>
      </div>`;
  }

  function renderDetailAI(project, conversations) {
    const relChats = conversations.filter(c => c.title?.toLowerCase().includes(project.name.toLowerCase()) || c.projectId === project.id);
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">AI Workspace (${relChats.length})</span><button class="btn btn-primary btn-sm" data-action="open-ai">${icon('plus')} New Chat</button></div>
        <div class="card-body">
          <p style="color:var(--text-muted);margin:0 0 16px">Use AI to analyze project findings, generate reports, review code, and more.</p>
          ${relChats.length ? relChats.map(c => `
            <div class="list-item" style="cursor:pointer" data-action="open-chat" data-id="${escapeHtml(c.id)}">
              <div class="list-item-icon">${icons.chat}</div>
              <div class="list-item-content"><div class="list-item-title">${escapeHtml(c.title)}</div><div class="list-item-subtitle">${c.messages?.length || 0} messages</div></div>
            </div>`).join('') : '<div class="empty-state" style="padding:16px"><p>No AI conversations yet</p></div>'}
        </div>
      </div>`;
  }

  function renderDetailFiles(project, files, folders) {
    const currentFolder = activeFileFolder;
    const allFolderFiles = currentFolder ? files.filter(f => f.folder === currentFolder) : [];
    const subfolders = currentFolder ? [] : folders;

    let displayFiles = [...allFolderFiles];
    if (fileSearchQuery) {
      const q = fileSearchQuery.toLowerCase();
      displayFiles = displayFiles.filter(f => f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q));
    }
    if (fileSortBy === 'name') {
      displayFiles.sort((a, b) => a.name.localeCompare(b.name));
    } else if (fileSortBy === 'size') {
      displayFiles.sort((a, b) => (a.size || 0) - (b.size || 0));
    } else if (fileSortBy === 'date') {
      displayFiles.sort((a, b) => new Date(b.modifiedAt || b.createdAt) - new Date(a.modifiedAt || a.createdAt));
    }

    return `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Files ${currentFolder ? `— ${escapeHtml(currentFolder)}` : ''}</span>
          <div style="display:flex;gap:8px;align-items:center">
            ${currentFolder ? `<button class="btn btn-ghost btn-sm" data-action="back-folders">${icons.chevronLeft} All Folders</button>` : ''}
            <button class="btn btn-ghost btn-sm" data-action="add-folder">${icon('folder')} Add Folder</button>
            <button class="btn btn-primary btn-sm" data-action="upload-file">${icon('upload')} Upload</button>
          </div>
        </div>
        ${!currentFolder ? `<div class="card-body">
          ${subfolders.length ? `
            <div class="project-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
              ${subfolders.map(f => {
                const count = files.filter(fi => fi.folder === f).length;
                const desc = f.includes('/') ? `Module: ${f.split('/')[0]}` : 'General project folder';
                return `
                  <div class="card hover-lift" data-action="open-folder" data-folder="${escapeHtml(f)}" style="cursor:pointer;padding:20px;text-align:center">
                    <div style="font-size:32px;margin-bottom:8px;color:var(--accent-cyan)">${icons.folder}</div>
                    <div style="font-size:13px;font-weight:500" class="truncate">${escapeHtml(f)}</div>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${count} files</div>
                    <div style="font-size:10px;color:var(--text-muted);margin-top:2px" class="truncate">${escapeHtml(desc)}</div>
                  </div>`;
              }).join('')}
            </div>` : '<div class="empty-state" style="padding:32px"><p>No folders yet</p></div>'}
        </div>` : `
        <div style="padding:12px 16px;display:flex;gap:8px;align-items:center;border-bottom:1px solid var(--border)">
          <input type="text" class="input" placeholder="Search files..." id="file-search-input" value="${escapeHtml(fileSearchQuery)}" style="max-width:240px">
          <select class="input select" id="file-sort-select" style="max-width:140px">
            <option value="name" ${fileSortBy === 'name' ? 'selected' : ''}>Sort by Name</option>
            <option value="size" ${fileSortBy === 'size' ? 'selected' : ''}>Sort by Size</option>
            <option value="date" ${fileSortBy === 'date' ? 'selected' : ''}>Sort by Date</option>
          </select>
          <div class="view-toggle ml-auto">
            <button class="view-toggle-btn ${fileViewMode === 'grid' ? 'active' : ''}" data-file-view="grid">${icons.grid}</button>
            <button class="view-toggle-btn ${fileViewMode === 'list' ? 'active' : ''}" data-file-view="list">${icons.list}</button>
          </div>
        </div>
        <div class="card-body">
          ${displayFiles.length ? (fileViewMode === 'grid' ? `
            <div class="project-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
              ${displayFiles.map(f => `
                <div class="card hover-lift" data-context="file" data-id="${escapeHtml(f.id)}" style="cursor:pointer">
                  <div class="card-body">
                    <div style="font-size:24px;margin-bottom:8px;color:var(--accent-cyan)">${icons.file}</div>
                    <div style="font-size:13px;font-weight:500" class="truncate">${escapeHtml(f.name)}</div>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${f.type} · ${CrackItUtils.formatSize ? CrackItUtils.formatSize(f.size) : ((f.size / 1024).toFixed(0) + ' KB')}</div>
                    <div style="font-size:10px;color:var(--text-muted)">${formatDate(f.modifiedAt || f.createdAt, true)}</div>
                    <div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap">
                      <button class="btn btn-ghost btn-sm" data-action="preview-file" data-id="${escapeHtml(f.id)}">${icon('eye')}</button>
                      <button class="btn btn-ghost btn-sm" data-action="rename-file" data-id="${escapeHtml(f.id)}">${icon('edit')}</button>
                      <button class="btn btn-ghost btn-sm" data-action="delete-file" data-id="${escapeHtml(f.id)}">${icon('trash')}</button>
                      <button class="btn btn-ghost btn-sm" data-action="download-file" data-id="${escapeHtml(f.id)}">${icon('download')}</button>
                      <button class="btn btn-ghost btn-sm ${f.favorite ? 'text-yellow' : ''}" data-action="favorite-file" data-id="${escapeHtml(f.id)}">${icon(f.favorite ? 'star' : 'star')}</button>
                    </div>
                  </div>
                </div>`).join('')}
            </div>` : `
            <div class="table-container"><table class="table">
              <thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Modified</th><th>Actions</th></tr></thead>
              <tbody>${displayFiles.map(f => `
                <tr data-context="file" data-id="${escapeHtml(f.id)}">
                  <td><div class="font-medium">${escapeHtml(f.name)}</div></td>
                  <td><span class="badge badge-gray">${f.type}</span></td>
                  <td>${CrackItUtils.formatSize ? CrackItUtils.formatSize(f.size) : ((f.size / 1024).toFixed(0) + ' KB')}</td>
                  <td class="text-muted">${formatDate(f.modifiedAt || f.createdAt, true)}</td>
                  <td>
                    <div style="display:flex;gap:4px">
                      <button class="btn btn-ghost btn-sm" data-action="preview-file" data-id="${escapeHtml(f.id)}" title="Preview">${icon('eye')}</button>
                      <button class="btn btn-ghost btn-sm" data-action="rename-file" data-id="${escapeHtml(f.id)}" title="Rename">${icon('edit')}</button>
                      <button class="btn btn-ghost btn-sm" data-action="delete-file" data-id="${escapeHtml(f.id)}" title="Delete">${icon('trash')}</button>
                      <button class="btn btn-ghost btn-sm" data-action="download-file" data-id="${escapeHtml(f.id)}" title="Download">${icon('download')}</button>
                      <button class="btn btn-ghost btn-sm ${f.favorite ? 'text-yellow' : ''}" data-action="favorite-file" data-id="${escapeHtml(f.id)}" title="Favorite">${icon(f.favorite ? 'star' : 'star')}</button>
                    </div>
                  </td>
                </tr>`).join('')}</tbody></table></div>`)
          : '<div class="empty-state" style="padding:32px"><p>No files in this folder</p></div>'}
        </div>`}
      </div>`;
  }

  function renderDetailFindings(project, findings) {
    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    const sorted = findings.sort((a,b) => (sevOrder[a.severity]||99)-(sevOrder[b.severity]||99));
    const selected = window._activeFindingId || null;

    return `
      <div class="dashboard-grid">
        <div class="col-span-${selected ? '7' : '12'}">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Findings (${findings.length})</span>
              <div style="display:flex;gap:8px">
                <input type="text" class="input" id="findings-search" placeholder="Search findings..." style="width:200px;font-size:12px;padding:6px 10px">
                <button class="btn btn-primary btn-sm" data-action="add-finding">${icon('plus')} Add Finding</button>
              </div>
            </div>
            <div class="card-body" style="padding:0">
              ${sorted.length ? `<div class="table-container"><table class="table">
                <thead><tr><th>ID</th><th>Title</th><th>Severity</th><th>CVSS</th><th>Category</th><th>Status</th><th></th></tr></thead>
                <tbody>${sorted.map(f => {
                  const sevColor = SEVERITY_COLORS[f.severity] || '#6B7280';
                  const isActive = f.id === selected;
                  return `<tr style="cursor:pointer;${isActive ? 'background:var(--accent-blue)10' : ''}" data-action="select-finding" data-id="${escapeHtml(f.id)}">
                    <td style="font-family:monospace;font-size:11px">${escapeHtml(f.id.slice(0, 8))}</td>
                    <td><div class="font-medium">${escapeHtml(f.title)}</div></td>
                    <td><span class="badge" style="background:${sevColor}20;color:${sevColor};border:1px solid ${sevColor}40">${f.severity}</span></td>
                    <td style="font-size:12px">${f.cvssScore || '—'}</td>
                    <td><span class="badge badge-gray">${escapeHtml(f.category || 'General')}</span></td>
                    <td><span class="badge badge-${f.status === 'open' ? 'red' : f.status === 'in-progress' ? 'yellow' : f.status === 'verified' ? 'green' : 'gray'}">${f.status}</span></td>
                    <td><button class="btn btn-ghost btn-icon btn-sm" data-action="toggle-finding-status" data-id="${escapeHtml(f.id)}" title="Toggle Status">${icons.chevronRight}</button></td>
                  </tr>`;
                }).join('')}</tbody></table></div>`
                : '<div class="empty-state" style="padding:32px"><p>No findings yet</p><button class="btn btn-primary btn-sm mt-2" data-action="add-finding">Add First Finding</button></div>'}
            </div>
          </div>
        </div>
        ${selected ? renderFindingDetail(CrackItStorage.findInCollection('findings', selected)) : ''}
      </div>`;
  }

  function renderFindingDetail(finding) {
    if (!finding) return '';
    return `
      <div class="col-span-5">
        <div class="card">
          <div class="card-header">
            <span class="card-title">${escapeHtml(finding.title)}</span>
            <button class="btn btn-ghost btn-icon btn-sm" data-action="close-finding-detail" title="Close">${icons.x}</button>
          </div>
          <div class="card-body" style="font-size:13px;line-height:1.6">
            <div class="detail-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
              <div><label>Severity</label><div><span class="badge" style="background:${(SEVERITY_COLORS[finding.severity]||'#6B7280')}20;color:${SEVERITY_COLORS[finding.severity]||'#6B7280'}">${finding.severity}</span></div></div>
              <div><label>CVSS</label><div>${finding.cvssScore || '—'}</div></div>
              <div><label>Category</label><div>${finding.category || 'General'}</div></div>
              <div><label>Status</label><div><span class="badge badge-${finding.status === 'open' ? 'red' : finding.status === 'in-progress' ? 'yellow' : finding.status === 'verified' ? 'green' : 'gray'}">${finding.status}</span></div></div>
              <div><label>CWE</label><div>${finding.cweId || '—'}</div></div>
              <div><label>OWASP</label><div>${finding.owaspCategory || '—'}</div></div>
            </div>
            <div style="margin-bottom:12px"><label>Description</label><p style="margin:4px 0;color:var(--text-secondary)">${escapeHtml(finding.description || 'No description')}</p></div>
            <div style="margin-bottom:12px"><label>Steps to Reproduce</label><p style="margin:4px 0;color:var(--text-secondary);white-space:pre-wrap">${escapeHtml(finding.stepsToReproduce || '—')}</p></div>
            <div style="margin-bottom:12px"><label>Impact</label><p style="margin:4px 0;color:var(--text-secondary)">${escapeHtml(finding.impact || '—')}</p></div>
            <div style="margin-bottom:12px"><label>Recommendation</label><p style="margin:4px 0;color:var(--text-secondary)">${escapeHtml(finding.recommendation || '—')}</p></div>
            <div style="margin-bottom:12px"><label>References</label><p style="margin:4px 0;color:var(--accent-blue);word-break:break-all">${escapeHtml(finding.references || '—')}</p></div>
            <div style="display:flex;gap:8px;margin-top:16px">
              <button class="btn btn-secondary btn-sm" data-action="edit-finding" data-id="${escapeHtml(finding.id)}">${icon('edit')} Edit</button>
              <button class="btn btn-ghost btn-sm" data-action="delete-finding" data-id="${escapeHtml(finding.id)}">${icon('trash')} Delete</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderDetailKnowledge(project, notes) {
    const relNotes = notes.filter(n => n.folder?.includes('Knowledge') || n.tags?.includes('knowledge'));
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">Knowledge (${relNotes.length})</span></div>
        <div class="card-body">
          ${relNotes.length ? relNotes.map(n => `
            <div class="list-item">
              <div class="list-item-icon">${icons.book}</div>
              <div class="list-item-content"><div class="list-item-title">${escapeHtml(n.title)}</div><div class="list-item-subtitle">${n.wordCount || 0} words · ${formatDate(n.updatedAt, true)}</div></div>
              <button class="btn btn-ghost btn-sm" data-action="open-note" data-id="${escapeHtml(n.id)}">Open</button>
            </div>`).join('')
          : '<div class="empty-state" style="padding:16px"><p>No knowledge articles yet</p></div>'}
        </div>
      </div>`;
  }

  function renderDetailAssets(project) {
    const assets = CrackItStorage.getCollection('assets').filter(a => a.projectId === project.id);
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">Assets (${assets.length})</span><button class="btn btn-primary btn-sm" data-action="add-asset">${icon('plus')} Add Asset</button></div>
        <div class="card-body" style="padding:0">
          ${assets.length ? `<div class="table-container"><table class="table">
            <thead><tr><th>Type</th><th>Value</th><th>Category</th><th>Status</th><th>Notes</th><th></th></tr></thead>
            <tbody>${assets.map(a => `
              <tr>
                <td><span class="badge badge-gray">${escapeHtml(a.type)}</span></td>
                <td><div class="font-medium" style="font-family:monospace">${escapeHtml(a.value)}</div></td>
                <td>${escapeHtml(a.category || '—')}</td>
                <td><span class="badge badge-${a.status === 'active' ? 'green' : a.status === 'deprecated' ? 'yellow' : 'gray'}">${a.status || 'active'}</span></td>
                <td style="font-size:12px;color:var(--text-muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(a.notes || '')}</td>
                <td><button class="btn btn-ghost btn-icon btn-sm" data-action="delete-asset" data-id="${escapeHtml(a.id)}" title="Remove">${icons.x}</button></td>
              </tr>`).join('')}</tbody></table></div>`
            : '<div class="empty-state" style="padding:32px"><p>No assets defined for this project</p><button class="btn btn-primary btn-sm mt-2" data-action="add-asset">Add Asset</button></div>'}
        </div>
      </div>
      <div class="card mt-4">
        <div class="card-header"><span class="card-title">Asset Summary</span></div>
        <div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px">
          ${['Domain','Subdomain','URL','IP','Repository','Application','Server','Mobile App','Cloud Resource'].map(type => `
            <div style="text-align:center;padding:12px;background:var(--surface-2);border-radius:8px">
              <div style="font-size:24px;font-weight:700;color:var(--accent-blue)">${assets.filter(a => a.type === type).length}</div>
              <div style="font-size:11px;color:var(--text-muted)">${type}s</div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function renderDetailScope(project) {
    const scope = CrackItStorage.getCollection('scopes').find(s => s.projectId === project.id) || {};
    return `
      <div class="dashboard-grid">
        <div class="col-span-6">
          <div class="card">
            <div class="card-header"><span class="card-title">In Scope</span><button class="btn btn-secondary btn-sm" data-action="edit-scope">${icon('edit')} Edit</button></div>
            <div class="card-body">
              ${scope.inScope?.length ? scope.inScope.map(s => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0"><span style="color:var(--accent-green)">${icons.check}</span><span>${escapeHtml(s)}</span></div>`).join('')
                : '<p class="text-sm text-muted">No in-scope items defined</p>'}
            </div>
          </div>
        </div>
        <div class="col-span-6">
          <div class="card">
            <div class="card-header"><span class="card-title">Out of Scope</span></div>
            <div class="card-body">
              ${scope.outScope?.length ? scope.outScope.map(s => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0"><span style="color:var(--accent-red)">${icons.x}</span><span>${escapeHtml(s)}</span></div>`).join('')
                : '<p class="text-sm text-muted">No out-of-scope items defined</p>'}
            </div>
          </div>
        </div>
        <div class="col-span-12">
          <div class="card">
            <div class="card-header"><span class="card-title">Testing Rules & Restrictions</span></div>
            <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div><label>Testing Hours</label><div class="font-medium">${scope.testingHours || 'Not specified'}</div></div>
              <div><label>Allowed Methods</label><div class="font-medium">${scope.allowedMethods || 'All standard methods'}</div></div>
              <div><label>Emergency Contacts</label><div class="font-medium">${scope.emergencyContacts || 'Not specified'}</div></div>
              <div><label>Authorization Date</label><div class="font-medium">${scope.authorizationDate ? formatDate(scope.authorizationDate) : 'Not specified'}</div></div>
              <div><label>Credentials Provided</label><div class="font-medium">${scope.credentialsProvided ? 'Yes' : 'No'}</div></div>
              <div><label>Status</label><div class="font-medium"><span class="badge badge-${scope.status === 'approved' ? 'green' : scope.status === 'pending' ? 'yellow' : 'gray'}">${scope.status || 'Draft'}</span></div></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderDetailChecklists(project, moduleList) {
    const allChecklists = CrackItStorage.getCollection('checklists').filter(c => c.projectId === project.id);
    const selectedModule = window._activeChecklistModule || 'all';
    const filtered = selectedModule === 'all' ? allChecklists : allChecklists.filter(c => c.moduleId === selectedModule);

    return `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Checklists (${allChecklists.filter(c => c.completed).length}/${allChecklists.length} completed)</span>
          <div style="display:flex;gap:8px;align-items:center">
            <select class="input select" id="checklist-module-filter" style="width:160px;font-size:12px;padding:4px 8px">
              <option value="all">All Modules</option>
              ${moduleList.map(m => `<option value="${escapeHtml(m.id)}" ${selectedModule === m.id ? 'selected' : ''}>${escapeHtml(m.name)}</option>`).join('')}
            </select>
            <button class="btn btn-primary btn-sm" data-action="add-checklist">${icon('plus')} Add Checklist</button>
          </div>
        </div>
        <div class="card-body">
          <div class="progress" style="height:6px;margin-bottom:16px"><div class="progress-bar" style="width:${allChecklists.length ? Math.round(allChecklists.filter(c => c.completed).length / allChecklists.length * 100) : 0}%"></div></div>
          ${filtered.length ? filtered.map(c => `
            <div class="list-item" style="${c.completed ? 'opacity:0.6' : ''}">
              <div class="list-item-icon" style="cursor:pointer" data-action="toggle-checklist" data-id="${escapeHtml(c.id)}">${c.completed ? icons.checkCircle : icons.circle}</div>
              <div class="list-item-content">
                <div class="list-item-title" style="${c.completed ? 'text-decoration:line-through' : ''}">${escapeHtml(c.title)}</div>
                <div class="list-item-subtitle">${escapeHtml(c.moduleName || 'General')} ${c.completed ? '· Completed' : ''}</div>
              </div>
              <button class="btn btn-ghost btn-icon btn-sm" data-action="delete-checklist" data-id="${escapeHtml(c.id)}">${icons.trash}</button>
            </div>`).join('')
            : '<div class="empty-state" style="padding:32px"><p>No checklists yet</p><button class="btn btn-primary btn-sm mt-2" data-action="add-checklist">Create Checklist</button></div>'}
        </div>
      </div>`;
  }

  function renderDetailEvidence(project, findings, files) {
    const evidence = files.filter(f => f.folder?.includes('Evidence'));
    const evFromFindings = findings.filter(f => f.evidence).map(f => ({
      id: f.id, name: f.evidence.length > 60 ? f.evidence.slice(0,60)+'...' : f.evidence,
      source: 'Finding: '+f.title, findingId: f.id
    }));

    return `
      <div class="card">
        <div class="card-header"><span class="card-title">Evidence Library (${evidence.length + evFromFindings.length})</span><button class="btn btn-primary btn-sm" data-action="add-evidence">${icon('plus')} Add Evidence</button></div>
        <div class="card-body">
          ${(evidence.length || evFromFindings.length) ? [...evidence.map(f => ({
            id: f.id, name: f.name, source: 'File', date: f.modifiedAt,
            icon: icons.shield, action: 'preview-file', actionId: f.id, findingId: null
          })), ...evFromFindings.map(f => ({
            id: f.id, name: f.name, source: f.source, date: null,
            icon: icons.shield, action: 'select-finding', actionId: f.findingId, findingId: f.findingId
          }))].map(item => `
            <div class="list-item" style="cursor:pointer" data-action="${item.action}" data-id="${escapeHtml(item.actionId)}">
              <div class="list-item-icon">${item.icon}</div>
              <div class="list-item-content"><div class="list-item-title">${escapeHtml(item.name)}</div><div class="list-item-subtitle">${escapeHtml(item.source)}${item.date ? ' · '+formatDate(item.date, true) : ''}</div></div>
              <span style="font-size:10px;color:var(--text-muted)">${escapeHtml(item.findingId ? 'Linked to finding' : 'Attached file')}</span>
            </div>`).join('')
          : '<div class="empty-state" style="padding:32px"><p>No evidence collected yet</p><button class="btn btn-primary btn-sm mt-2" data-action="add-evidence">Add Evidence</button></div>'}
        </div>
      </div>`;
  }

  function renderDetailReports(project, reports) {
    const relReports = reports.filter(r => r.projectId === project.id || !r.projectId);
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">Reports (${relReports.length})</span><button class="btn btn-primary btn-sm" data-action="generate-report">${icon('plus')} Generate Report</button></div>
        <div class="card-body">
          ${relReports.length ? relReports.map(r => `
            <div class="list-item">
              <div class="list-item-icon">${icons.reports}</div>
              <div class="list-item-content"><div class="list-item-title">${escapeHtml(r.title)}</div><div class="list-item-subtitle">${r.severity} · ${r.findings} findings</div></div>
              <button class="btn btn-ghost btn-sm" data-action="open-report" data-id="${escapeHtml(r.id)}">Open</button>
            </div>`).join('')
          : '<div class="empty-state" style="padding:32px"><p>No reports generated yet</p></div>'}
        </div>
      </div>`;
  }

  function renderDetailTimeline(project, files, tasks, conversations) {
    const events = [];
    events.push({ date: project.createdAt, text: 'Project Created', icon: 'projects', type: 'info' });
    tasks.forEach(t => events.push({ date: t.createdAt, text: `Task Added: ${t.title}`, icon: 'check', type: 'task' }));
    files.forEach(f => events.push({ date: f.createdAt, text: `File Created: ${f.name}`, icon: 'file', type: 'file' }));
    conversations.forEach(c => events.push({ date: c.createdAt, text: `AI Chat: ${c.title}`, icon: 'chat', type: 'chat' }));
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
      <div class="card">
        <div class="card-header"><span class="card-title">Timeline (${events.length} events)</span></div>
        <div class="card-body" style="max-height:400px;overflow-y:auto">
          <div style="position:relative;padding-left:24px">
            <div style="position:absolute;left:8px;top:0;bottom:0;width:2px;background:var(--border)"></div>
            ${events.slice(0, 50).map(e => `
              <div style="position:relative;padding:0 0 16px 16px">
                <div style="position:absolute;left:-18px;top:2px;width:12px;height:12px;border-radius:50%;background:${e.type === 'task' ? 'var(--accent-green)' : e.type === 'file' ? 'var(--accent-cyan)' : e.type === 'chat' ? 'var(--accent-purple)' : 'var(--accent-blue)'};border:2px solid var(--bg-primary)"></div>
                <div style="font-size:11px;color:var(--text-muted)">${formatDate(e.date, true)}</div>
                <div style="font-size:13px;color:var(--text-primary);margin-top:2px">${escapeHtml(e.text)}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  function renderDetailAutomation(project) {
    const workflows = CrackItStorage.getCollection('workflows').filter(w => w.projectId === project.id || !w.projectId).slice(0, 5);
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">Automation</span><button class="btn btn-primary btn-sm" data-action="new-automation">${icon('plus')} New Automation</button></div>
        <div class="card-body">
          ${workflows.length ? workflows.map(w => `
            <div class="list-item">
              <div class="list-item-icon" style="color:${w.status === 'active' ? 'var(--accent-green)' : 'var(--text-muted)'}">${icons.automation}</div>
              <div class="list-item-content"><div class="list-item-title">${escapeHtml(w.name)}</div><div class="list-item-subtitle">${w.executions || 0} runs · ${w.successRate || 0}% success</div></div>
              <button class="btn btn-ghost btn-sm" data-action="toggle-automation" data-id="${escapeHtml(w.id)}">${w.status === 'active' ? 'Disable' : 'Enable'}</button>
            </div>`).join('')
          : '<div class="empty-state" style="padding:32px"><p>No automation workflows configured</p></div>'}
        </div>
      </div>`;
  }

  function renderDetailSettings(project) {
    return `
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-info"><h4>Project Name</h4><p>Change the project name</p></div>
          <input type="text" class="input" id="edit-project-name" value="${escapeHtml(project.name)}" style="width:240px">
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Description</h4><p>Project description</p></div>
          <textarea class="input textarea" id="edit-project-desc" style="width:240px;min-height:60px">${escapeHtml(project.description)}</textarea>
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Client</h4><p>Client name or organization</p></div>
          <input type="text" class="input" id="edit-project-client" value="${escapeHtml(project.client || '')}" style="width:240px">
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Technology Stack</h4><p>Comma-separated technologies</p></div>
          <input type="text" class="input" id="edit-project-tech" value="${escapeHtml(project.technologyStack || '')}" style="width:240px">
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Target URLs</h4><p>Target URLs or IP ranges</p></div>
          <input type="text" class="input" id="edit-project-urls" value="${escapeHtml(project.targetUrls || '')}" style="width:240px">
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Repository</h4><p>Source code repository URL</p></div>
          <input type="text" class="input" id="edit-project-repo" value="${escapeHtml(project.repository || '')}" style="width:240px">
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Programming Language</h4></div>
          <input type="text" class="input" id="edit-project-lang" value="${escapeHtml(project.programmingLanguage || '')}" style="width:240px">
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Framework</h4></div>
          <input type="text" class="input" id="edit-project-framework" value="${escapeHtml(project.framework || '')}" style="width:240px">
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Scope</h4><p>Assessment scope description</p></div>
          <textarea class="input textarea" id="edit-project-scope" style="width:240px;min-height:60px">${escapeHtml(project.scope || '')}</textarea>
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Rules of Engagement</h4></div>
          <textarea class="input textarea" id="edit-project-rules" style="width:240px;min-height:60px">${escapeHtml(project.rulesOfEngagement || '')}</textarea>
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Objectives</h4></div>
          <textarea class="input textarea" id="edit-project-objectives" style="width:240px;min-height:60px">${escapeHtml(project.objectives || '')}</textarea>
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Testing Window</h4></div>
          <input type="text" class="input" id="edit-project-window" value="${escapeHtml(project.testingWindow || '')}" style="width:240px">
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Status</h4><p>Current project status</p></div>
          <select class="input select" id="edit-project-status" style="width:160px">
            ${['planning', 'active', 'review', 'completed', 'on-hold'].map(s => `<option value="${s}" ${project.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Priority</h4><p>Project priority level</p></div>
          <select class="input select" id="edit-project-priority" style="width:160px">
            ${['low', 'medium', 'high', 'critical'].map(p => `<option value="${p}" ${project.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Tags</h4><p>Comma-separated tags</p></div>
          <input type="text" class="input" id="edit-project-tags" value="${(project.tags || []).join(', ')}" style="width:240px">
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><h4>Progress</h4><p>Progress percentage</p></div>
          <input type="number" class="input" id="edit-project-progress" value="${project.progress}" min="0" max="100" style="width:100px">
        </div>
        <div style="margin-top:16px">
          <button class="btn btn-primary" data-action="save-project-settings">${icon('save')} Save Changes</button>
        </div>
      </div>`;
  }

  function bindDetailEvents(container, project) {
    container.querySelector('[data-action="back-to-projects"]')?.addEventListener('click', closeProjectDetail);

    container.querySelectorAll('.project-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeDetailTab = btn.dataset.tab;
        activeFileFolder = null;
        renderProjectDetail(container);
      });
    });

    container.querySelectorAll('[data-action="delete-project"]').forEach(btn => {
      btn.addEventListener('click', () => {
        CrackItUI.confirm('Delete this project permanently?', async () => {
          await apiDeleteProject(project.id);
          CrackItUI.toast('Project deleted', 'info');
          closeProjectDetail();
        });
      });
    });

    container.querySelectorAll('[data-action="archive-project"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await apiUpdateProject(project.id, { archived: true, status: 'completed' });
        CrackItUI.toast('Project archived', 'success');
        closeProjectDetail();
      });
    });

    container.querySelectorAll('[data-action="edit-project"]').forEach(btn => {
      btn.addEventListener('click', () => { activeDetailTab = 'settings'; renderProjectDetail(container); });
    });

    container.querySelectorAll('[data-action="save-project-settings"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = container.querySelector('#edit-project-name')?.value.trim();
        const description = container.querySelector('#edit-project-desc')?.value.trim();
        const client = container.querySelector('#edit-project-client')?.value.trim();
        const technologyStack = container.querySelector('#edit-project-tech')?.value.trim();
        const targetUrls = container.querySelector('#edit-project-urls')?.value.trim();
        const repository = container.querySelector('#edit-project-repo')?.value.trim();
        const programmingLanguage = container.querySelector('#edit-project-lang')?.value.trim();
        const framework = container.querySelector('#edit-project-framework')?.value.trim();
        const scope = container.querySelector('#edit-project-scope')?.value.trim();
        const rulesOfEngagement = container.querySelector('#edit-project-rules')?.value.trim();
        const objectives = container.querySelector('#edit-project-objectives')?.value.trim();
        const testingWindow = container.querySelector('#edit-project-window')?.value.trim();
        const status = container.querySelector('#edit-project-status')?.value;
        const priority = container.querySelector('#edit-project-priority')?.value;
        const tags = (container.querySelector('#edit-project-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean);
        const progress = parseInt(container.querySelector('#edit-project-progress')?.value) || 0;

        if (!name) { CrackItUI.toast('Name is required', 'warning'); return; }

        await apiUpdateProject(project.id, {
          name, description, client, technologyStack, targetUrls, repository,
          programmingLanguage, framework, scope, rulesOfEngagement, objectives,
          testingWindow, status, priority, tags, progress
        });
        CrackItUI.toast('Project updated', 'success');
        renderProjectDetail(container);
      });
    });

    container.querySelectorAll('[data-action="open-folder"]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFileFolder = btn.dataset.folder;
        fileSearchQuery = '';
        renderProjectDetail(container);
      });
    });

    container.querySelectorAll('[data-action="back-folders"]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFileFolder = null;
        fileSearchQuery = '';
        renderProjectDetail(container);
      });
    });

    container.querySelector('[data-action="add-folder"]')?.addEventListener('click', () => {
      CrackItUI.openModal('add-folder', {
        title: 'Add Folder',
        content: '<input type="text" class="input" id="add-folder-input" placeholder="Folder name..." style="width:100%">',
        footer: '<button class="btn btn-secondary modal-close">Cancel</button><button class="btn btn-primary" id="add-folder-save">Create</button>'
      });
      document.querySelector('#add-folder-save')?.addEventListener('click', () => {
        const name = document.querySelector('#add-folder-input')?.value.trim();
        if (name) {
          CrackItStorage.addToCollection('files', {
            id: uid('file'),
            name: `Welcome to ${name}`,
            folder: name,
            type: 'md',
            size: 0,
            projectId: project.id,
            favorite: false,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            path: `/projects/${project.id}/${name}/`
          });
          CrackItUI.closeModal('add-folder');
          CrackItUI.toast('Folder created', 'success');
          renderProjectDetail(container);
        }
      });
    });

    container.querySelectorAll('[data-action="add-task"]').forEach(btn => {
      btn.addEventListener('click', () => {
        CrackItStorage.addToCollection('tasks', {
          id: uid('task'), title: 'New Task', status: 'pending', priority: 'medium',
          project: project.id, projectId: project.id, assignee: 'Admin', createdAt: new Date().toISOString()
        });
        CrackItUI.toast('Task added', 'success');
        renderProjectDetail(container);
      });
    });

    container.querySelectorAll('[data-action="toggle-task"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const task = CrackItStorage.findInCollection('tasks', btn.dataset.id);
        if (task) {
          const newStatus = task.status === 'completed' ? 'pending' : 'completed';
          CrackItStorage.updateInCollection('tasks', task.id, { status: newStatus });
          CrackItUI.toast(`Task ${newStatus === 'completed' ? 'completed' : 'reopened'}`, 'info');
          renderProjectDetail(container);
        }
      });
    });

    container.querySelectorAll('[data-action="open-ai"]').forEach(btn => {
      btn.addEventListener('click', () => CrackItRouter.navigate('chat'));
    });

    container.querySelectorAll('[data-action="open-chat"]').forEach(btn => {
      btn.addEventListener('click', () => CrackItRouter.navigate('chat'));
    });

    container.querySelectorAll('[data-action="add-evidence"]').forEach(btn => {
      btn.addEventListener('click', () => {
        CrackItStorage.addToCollection('files', {
          id: uid('file'), name: 'New Evidence', folder: 'Evidence', type: 'md', size: 0,
          projectId: project.id, createdAt: new Date().toISOString(), modifiedAt: new Date().toISOString(),
          path: `/projects/${project.id}/Evidence/`
        });
        CrackItUI.toast('Evidence item added', 'success');
        renderProjectDetail(container);
      });
    });

    container.querySelectorAll('[data-action="generate-report"]').forEach(btn => {
      btn.addEventListener('click', () => CrackItRouter.navigate('reports'));
    });

    container.querySelectorAll('[data-action="open-report"]').forEach(btn => {
      btn.addEventListener('click', () => CrackItRouter.navigate('reports'));
    });

    container.querySelectorAll('[data-action="new-automation"]').forEach(btn => {
      btn.addEventListener('click', () => CrackItRouter.navigate('automation'));
    });

    container.querySelectorAll('[data-action="toggle-automation"]').forEach(btn => {
      btn.addEventListener('click', () => {
        CrackItUI.toast('Automation toggled', 'info');
      });
    });

    container.querySelectorAll('[data-action="preview-file"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const file = CrackItStorage.findInCollection('files', btn.dataset.id);
        if (file) CrackItUI.toast(`Preview: ${file.name}`, 'info');
      });
    });

    container.querySelectorAll('[data-action="rename-file"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const file = CrackItStorage.findInCollection('files', btn.dataset.id);
        if (file) {
          CrackItUI.openModal('rename-file', {
            title: 'Rename File',
            content: `<input type="text" class="input" id="rename-file-input" value="${escapeHtml(file.name)}" style="width:100%">`,
            footer: '<button class="btn btn-secondary modal-close">Cancel</button><button class="btn btn-primary" id="rename-file-save">Save</button>'
          });
          document.querySelector('#rename-file-save')?.addEventListener('click', () => {
            const newName = document.querySelector('#rename-file-input')?.value.trim();
            if (newName) {
              CrackItStorage.updateInCollection('files', file.id, { name: newName });
              CrackItUI.closeModal('rename-file');
              CrackItUI.toast('File renamed', 'success');
              renderProjectDetail(container);
            }
          });
        }
      });
    });

    container.querySelectorAll('[data-action="delete-file"]').forEach(btn => {
      btn.addEventListener('click', () => {
        CrackItUI.confirm('Delete this file?', () => {
          CrackItStorage.removeFromCollection('files', btn.dataset.id);
          CrackItUI.toast('File deleted', 'info');
          renderProjectDetail(container);
        });
      });
    });

    container.querySelectorAll('[data-action="download-file"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const file = CrackItStorage.findInCollection('files', btn.dataset.id);
        if (file) CrackItUI.toast(`Downloading: ${file.name}`, 'info');
      });
    });

    container.querySelectorAll('[data-action="favorite-file"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const file = CrackItStorage.findInCollection('files', btn.dataset.id);
        if (file) {
          CrackItStorage.updateInCollection('files', file.id, { favorite: !file.favorite });
          CrackItUI.toast(file.favorite ? 'Removed from favorites' : 'Added to favorites', 'success');
          renderProjectDetail(container);
        }
      });
    });

    container.querySelectorAll('[data-action="upload-file"]').forEach(btn => {
      btn.addEventListener('click', () => {
        CrackItStorage.addToCollection('files', {
          id: uid('file'), name: 'New File', folder: activeFileFolder || 'Files', type: 'md', size: 1024,
          projectId: project.id, createdAt: new Date().toISOString(), modifiedAt: new Date().toISOString(),
          path: `/projects/${project.id}/${activeFileFolder || 'Files'}/`
        });
        CrackItUI.toast('File uploaded', 'success');
        renderProjectDetail(container);
      });
    });

    container.querySelector('#file-search-input')?.addEventListener('input', debounce((e) => {
      fileSearchQuery = e.target.value;
      renderProjectDetail(container);
    }, 300));

    container.querySelector('#file-sort-select')?.addEventListener('change', (e) => {
      fileSortBy = e.target.value;
      renderProjectDetail(container);
    });

    container.querySelectorAll('[data-file-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        fileViewMode = btn.dataset.fileView;
        container.querySelectorAll('[data-file-view]').forEach(b => b.classList.toggle('active', b.dataset.fileView === fileViewMode));
        renderProjectDetail(container);
      });
    });

    container.querySelectorAll('[data-action="add-module"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const currentModules = new Set(project.modules || []);
        const modPickerId = 'add-module-picker';

        function renderModuleList() {
          const available = PROJECT_MODULES.filter(m => !currentModules.has(m.id));
          const content = `
            <div style="margin-bottom:12px">
              <span style="font-size:14px;font-weight:500">${available.length} module(s) available</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;max-height:400px;overflow-y:auto;padding:4px">
              ${available.map(m => `
                <div class="card module-option" data-add-mod-id="${m.id}" style="cursor:pointer;padding:14px;border:2px solid var(--border);transition:all 0.2s">
                  <div style="font-size:28px;margin-bottom:8px;color:var(--text-muted)">${icon(MODULE_ICONS[m.id] || 'shield')}</div>
                  <div style="font-size:13px;font-weight:600;margin-bottom:4px">${escapeHtml(m.name)}</div>
                  <div style="font-size:11px;color:var(--text-muted);line-height:1.4">${escapeHtml(m.description)}</div>
                </div>`).join('')}
            </div>`;

          const overlay = document.querySelector(`#modal-${modPickerId}`);
          if (!overlay) return;
          const bodyEl = overlay.querySelector('.modal-body');
          if (bodyEl) bodyEl.innerHTML = content;

          overlay.querySelectorAll('.module-option').forEach(card => {
            card.addEventListener('click', () => {
              const modId = card.dataset.addModId;
              if (!modId) return;
              const mod = PROJECT_MODULES.find(m => m.id === modId);
              if (!mod) return;

              currentModules.add(modId);
              const now = new Date().toISOString();

              DEFAULT_FOLDERS.forEach(folder => {
                CrackItStorage.addToCollection('files', {
                  id: uid('file'), name: `New ${folder.toLowerCase().replace(/\s+/g, '-')}`,
                  folder: `${mod.name}/${folder}`, type: 'md', size: 0,
                  projectId: project.id, favorite: false,
                  createdAt: now, modifiedAt: now,
                  path: `/projects/${project.id}/${mod.name}/${folder}/`
                });
              });

              const tasks = DEFAULT_TASKS[modId] || ['Reconnaissance', 'Assessment', 'Analysis', 'Reporting'];
              tasks.forEach(task => {
                CrackItStorage.addToCollection('tasks', {
                  id: uid('task'), title: `[${mod.name}] ${task}`, status: 'pending', priority: 'medium',
                  project: project.id, projectId: project.id, module: modId,
                  assignee: 'Admin', dueDate: new Date(Date.now() + 14 * 86400000).toISOString(), createdAt: now
                });
              });

              CrackItStorage.addToCollection('reports', {
                id: uid('report'), title: `${mod.name} Assessment Report`, summary: `Security assessment report for ${mod.name}.`,
                severity: 'medium', status: 'draft', findings: 0, riskScore: 0,
                projectId: project.id, module: modId, author: 'Admin', createdAt: now, updatedAt: now, tags: [modId]
              });

              CrackItStorage.addToCollection('conversations', {
                id: uid('conv'), title: `${mod.name} — AI Assistant`, module: modId, projectId: project.id,
                messages: [{ role: 'assistant', content: `Welcome to the AI assistant for ${mod.name}. How can I help with your assessment?`, timestamp: now }],
                pinned: false, createdAt: now
              });

              CrackItStorage.addToCollection('notes', {
                id: uid('note'), title: `${mod.name} — Knowledge Base`,
                content: `# ${mod.name}\n\n## Overview\n\n## Methodology\n\n## Key Findings\n\n## References\n`,
                folder: `${mod.name}/Knowledge`, module: modId, projectId: project.id,
                tags: [modId, 'knowledge', 'template'], pinned: false, favorite: false, createdAt: now, updatedAt: now, wordCount: 50
              });

              CrackItStorage.addToCollection('findings', {
                id: uid('find'), title: `Placeholder Finding — ${mod.name}`, severity: 'info', category: mod.name,
                description: 'This is a placeholder finding. Update with actual findings from your assessment.',
                evidence: '', recommendation: '', status: 'open', projectId: project.id, module: modId, createdAt: now
              });

              const updatedMods = [...currentModules];
              await apiUpdateProject(project.id, { modules: updatedMods });

              CrackItUI.closeModal(modPickerId);
              CrackItUI.toast(`Module "${mod.name}" added to project`, 'success');
              renderProjectDetail(container);
            });
          });
        }

        CrackItUI.openModal(modPickerId, {
          title: 'Add Module to Project',
          content: '',
          footer: '<button class="btn btn-secondary modal-close">Cancel</button>'
        });

        renderModuleList();
      });
    });

    container.querySelectorAll('[data-action="open-module"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modId = btn.dataset.modId;
        const mod = PROJECT_MODULES.find(m => m.id === modId);
        if (mod) CrackItUI.toast(`Opening module: ${mod.name}`, 'info');
      });
    });

    container.querySelectorAll('[data-action="configure-module"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modId = btn.dataset.modId;
        const mod = PROJECT_MODULES.find(m => m.id === modId);
        if (mod) CrackItUI.toast(`Configure: ${mod.name}`, 'info');
      });
    });

    container.querySelectorAll('[data-action="remove-module"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modId = btn.dataset.modId;
        const mod = PROJECT_MODULES.find(m => m.id === modId);
        if (!mod) return;
        CrackItUI.confirm(`Remove module "${mod.name}" from project? Related data will be kept.`, async () => {
          const current = (project.modules || []).filter(id => id !== modId);
          await apiUpdateProject(project.id, { modules: current });
          CrackItUI.toast(`Module "${mod.name}" removed`, 'info');
          renderProjectDetail(container);
        });
      });
    });

    container.querySelectorAll('[data-action="select-finding"]').forEach(btn => {
      btn.addEventListener('click', () => {
        window._activeFindingId = btn.dataset.id;
        renderProjectDetail(container);
      });
    });
    container.querySelectorAll('[data-action="close-finding-detail"]').forEach(btn => {
      btn.addEventListener('click', () => {
        window._activeFindingId = null;
        renderProjectDetail(container);
      });
    });
    container.querySelectorAll('[data-action="delete-finding"]').forEach(btn => {
      btn.addEventListener('click', () => {
        CrackItUI.confirm('Delete this finding?', async () => {
          if (CrackItAPI.isAuthenticated()) {
            try { await CrackItAPI.findings.delete(btn.dataset.id); } catch (e) { console.warn('API finding delete failed:', e); }
          }
          CrackItStorage.removeFromCollection('findings', btn.dataset.id);
          window._activeFindingId = null;
          CrackItUI.toast('Finding deleted', 'info');
          renderProjectDetail(container);
        });
      });
    });
    container.querySelectorAll('[data-action="edit-finding"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const f = CrackItStorage.findInCollection('findings', btn.dataset.id);
        if (!f) return;
        CrackItUI.openModal('edit-finding', {
          title: 'Edit Finding',
          content: `
            <div style="display:flex;flex-direction:column;gap:12px">
              <div><label>Title</label><input type="text" class="input" id="ef-title" value="${escapeHtml(f.title)}" style="width:100%">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
                <div><label>Severity</label><select class="input select" id="ef-severity" style="width:100%">${['info','low','medium','high','critical'].map(s => `<option value="${s}"${f.severity===s?' selected':''}>${s}</option>`).join('')}</select></div>
                <div><label>CVSS</label><input type="text" class="input" id="ef-cvss" value="${f.cvssScore || ''}" style="width:100%" placeholder="0.0-10.0"></div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div><label>Category</label><input type="text" class="input" id="ef-category" value="${escapeHtml(f.category || '')}" style="width:100%"></div>
                <div><label>Status</label><select class="input select" id="ef-status" style="width:100%">${['open','in-progress','verified','closed'].map(s => `<option value="${s}"${f.status===s?' selected':''}>${s}</option>`).join('')}</select></div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div><label>CWE ID</label><input type="text" class="input" id="ef-cwe" value="${f.cweId || ''}" style="width:100%" placeholder="CWE-79"></div>
                <div><label>OWASP</label><input type="text" class="input" id="ef-owasp" value="${f.owaspCategory || ''}" style="width:100%" placeholder="A1:2021 - Broken Access Control"></div>
              </div>
              <div><label>Description</label><textarea class="input textarea" id="ef-description" style="width:100%;min-height:60px">${escapeHtml(f.description || '')}</textarea></div>
              <div><label>Steps to Reproduce</label><textarea class="input textarea" id="ef-steps" style="width:100%;min-height:60px">${escapeHtml(f.stepsToReproduce || '')}</textarea></div>
              <div><label>Impact</label><textarea class="input textarea" id="ef-impact" style="width:100%;min-height:60px">${escapeHtml(f.impact || '')}</textarea></div>
              <div><label>Recommendation</label><textarea class="input textarea" id="ef-rec" style="width:100%;min-height:60px">${escapeHtml(f.recommendation || '')}</textarea></div>
              <div><label>References</label><textarea class="input textarea" id="ef-refs" style="width:100%;min-height:40px">${escapeHtml(f.references || '')}</textarea></div>
            </div>`,
          footer: '<button class="btn btn-secondary modal-close">Cancel</button><button class="btn btn-primary" id="save-ef">Save Changes</button>'
        });
        document.querySelector('#save-ef')?.addEventListener('click', async () => {
          const updates = {
            title: document.querySelector('#ef-title')?.value?.trim() || f.title,
            severity: document.querySelector('#ef-severity')?.value || f.severity,
            cvssScore: document.querySelector('#ef-cvss')?.value || '',
            category: document.querySelector('#ef-category')?.value || '',
            status: document.querySelector('#ef-status')?.value || f.status,
            cweId: document.querySelector('#ef-cwe')?.value || '',
            owaspCategory: document.querySelector('#ef-owasp')?.value || '',
            description: document.querySelector('#ef-description')?.value || '',
            stepsToReproduce: document.querySelector('#ef-steps')?.value || '',
            impact: document.querySelector('#ef-impact')?.value || '',
            recommendation: document.querySelector('#ef-rec')?.value || '',
            references: document.querySelector('#ef-refs')?.value || ''
          };
          if (CrackItAPI.isAuthenticated()) {
            try {
              const snakeData = { title: updates.title, severity: updates.severity, cvss_score: updates.cvssScore, category: updates.category, status: updates.status, cwe_id: updates.cweId, owasp_category: updates.owaspCategory, description: updates.description, steps_to_reproduce: updates.stepsToReproduce, impact: updates.impact, recommendation: updates.recommendation, references: updates.references };
              await CrackItAPI.findings.update(f.id, snakeData);
            } catch (e) { console.warn('API finding update failed:', e); }
          }
          CrackItStorage.updateInCollection('findings', f.id, updates);
          CrackItUI.closeModal('edit-finding');
          CrackItUI.toast('Finding updated', 'success');
          renderProjectDetail(container);
        });
      });
    });
    container.querySelectorAll('[data-action="add-finding"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const moduleOptions = (project.modules || []).map(id => {
          const m = PROJECT_MODULES.find(mod => mod.id === id);
          return m ? `<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)}</option>` : '';
        }).join('');

        CrackItUI.openModal('add-finding', {
          title: 'Add New Finding',
          content: `
            <div style="display:flex;flex-direction:column;gap:12px">
              <div><label>Title *</label><input type="text" class="input" id="finding-title" placeholder="Finding title..." style="width:100%"></div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div><label>Severity</label>
                  <select class="input select" id="finding-severity" style="width:100%">
                    <option value="info">Info</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div><label>CVSS Score</label><input type="number" class="input" id="finding-cvss" placeholder="0.0-10.0" step="0.1" min="0" max="10" style="width:100%"></div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div><label>CWE ID</label><input type="text" class="input" id="finding-cwe" placeholder="CWE-79" style="width:100%"></div>
                <div><label>OWASP Category</label><input type="text" class="input" id="finding-owasp" placeholder="A1:2021 - Broken Access Control" style="width:100%"></div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div><label>Category</label>
                  <select class="input select" id="finding-category" style="width:100%">
                    <option value="General">General</option>
                    <option value="Web">Web</option>
                    <option value="API">API</option>
                    <option value="Network">Network</option>
                    <option value="Cloud">Cloud</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Code Review">Code Review</option>
                    <option value="Infrastructure">Infrastructure</option>
                  </select>
                </div>
                <div><label>Module</label>
                  <select class="input select" id="finding-module" style="width:100%">
                    <option value="">— None —</option>
                    ${moduleOptions}
                  </select>
                </div>
              </div>
              <div><label>Description</label><textarea class="input textarea" id="finding-desc" placeholder="Describe the finding..." style="width:100%;min-height:60px"></textarea></div>
              <div><label>Steps to Reproduce</label><textarea class="input textarea" id="finding-steps" placeholder="Steps to reproduce..." style="width:100%;min-height:60px"></textarea></div>
              <div><label>Impact</label><textarea class="input textarea" id="finding-impact" placeholder="Business/security impact..." style="width:100%;min-height:60px"></textarea></div>
              <div><label>Recommendation</label><textarea class="input textarea" id="finding-recommendation" placeholder="Remediation recommendation..." style="width:100%;min-height:60px"></textarea></div>
              <div><label>References</label><textarea class="input textarea" id="finding-refs" placeholder="URLs or reference IDs..." style="width:100%;min-height:40px"></textarea></div>
              <div><label>Evidence</label><textarea class="input textarea" id="finding-evidence" placeholder="Evidence text or file references..." style="width:100%;min-height:60px"></textarea></div>
            </div>`,
          footer: '<button class="btn btn-secondary modal-close">Cancel</button><button class="btn btn-primary" id="finding-save">Add Finding</button>'
        });

        document.querySelector('#finding-save')?.addEventListener('click', async () => {
          const title = document.querySelector('#finding-title')?.value.trim();
          if (!title) { CrackItUI.toast('Finding title is required', 'warning'); return; }
          const now = new Date().toISOString();
          const findingData = {
            id: uid('find'), title, projectId: project.id,
            severity: document.querySelector('#finding-severity')?.value || 'info',
            cvssScore: document.querySelector('#finding-cvss')?.value || '',
            category: document.querySelector('#finding-category')?.value || 'General',
            cweId: document.querySelector('#finding-cwe')?.value || '',
            owaspCategory: document.querySelector('#finding-owasp')?.value || '',
            description: document.querySelector('#finding-desc')?.value?.trim() || '',
            stepsToReproduce: document.querySelector('#finding-steps')?.value?.trim() || '',
            impact: document.querySelector('#finding-impact')?.value?.trim() || '',
            recommendation: document.querySelector('#finding-recommendation')?.value?.trim() || '',
            references: document.querySelector('#finding-refs')?.value?.trim() || '',
            evidence: document.querySelector('#finding-evidence')?.value?.trim() || '',
            module: document.querySelector('#finding-module')?.value || '',
            relatedFiles: [], relatedChats: [], relatedReports: [],
            status: 'open', createdAt: now, updatedAt: now
          };
          if (CrackItAPI.isAuthenticated()) {
            try {
              const snakeData = { title: findingData.title, project_id: findingData.projectId, severity: findingData.severity, cvss_score: findingData.cvssScore, category: findingData.category, cwe_id: findingData.cweId, owasp_category: findingData.owaspCategory, description: findingData.description, steps_to_reproduce: findingData.stepsToReproduce, impact: findingData.impact, recommendation: findingData.recommendation, references: findingData.references, evidence: findingData.evidence, module: findingData.module, status: findingData.status };
              const result = await CrackItAPI.findings.create(snakeData);
              findingData.id = result.id;
            } catch (e) { console.warn('API finding create failed:', e); }
          }
          CrackItStorage.addToCollection('findings', findingData);
          CrackItUI.closeModal('add-finding');
          CrackItUI.toast('Finding added', 'success');
          renderProjectDetail(container);
        });
      });
    });

    container.querySelectorAll('[data-action="toggle-finding-status"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const finding = CrackItStorage.findInCollection('findings', btn.dataset.id);
        if (finding) {
          const flow = { 'open': 'in-progress', 'in-progress': 'verified', 'verified': 'closed', 'closed': 'open' };
          const newStatus = flow[finding.status] || 'open';
          if (CrackItAPI.isAuthenticated()) {
            try { await CrackItAPI.findings.update(finding.id, { status: newStatus }); } catch (e) { console.warn('API finding update failed:', e); }
          }
          CrackItStorage.updateInCollection('findings', finding.id, { status: newStatus });
          CrackItUI.toast(`Finding status changed to ${newStatus}`, 'info');
          renderProjectDetail(container);
        }
      });
    });

    container.querySelectorAll('[data-action="add-asset"]').forEach(btn => {
      btn.addEventListener('click', () => {
        CrackItUI.openModal('add-asset', {
          title: 'Add Asset',
          content: `
            <div style="display:flex;flex-direction:column;gap:12px">
              <div><label>Type</label>
                <select class="input select" id="asset-type" style="width:100%">
                  <option value="Domain">Domain</option>
                  <option value="Subdomain">Subdomain</option>
                  <option value="URL">URL</option>
                  <option value="IP">IP Address</option>
                  <option value="Repository">Repository</option>
                  <option value="Application">Application</option>
                  <option value="Server">Server</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Cloud Resource">Cloud Resource</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div><label>Value</label><input type="text" class="input" id="asset-value" placeholder="example.com, 10.0.0.1, etc." style="width:100%"></div>
              <div><label>Category</label><input type="text" class="input" id="asset-category" placeholder="Production, Staging, etc." style="width:100%"></div>
              <div><label>Status</label>
                <select class="input select" id="asset-status" style="width:100%">
                  <option value="active">Active</option>
                  <option value="deprecated">Deprecated</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div><label>Notes</label><textarea class="input textarea" id="asset-notes" placeholder="Any additional notes..." style="width:100%;min-height:60px"></textarea></div>
            </div>`,
          footer: '<button class="btn btn-secondary modal-close">Cancel</button><button class="btn btn-primary" id="save-asset">Add Asset</button>'
        });
        document.querySelector('#save-asset')?.addEventListener('click', () => {
          const value = document.querySelector('#asset-value')?.value.trim();
          if (!value) { CrackItUI.toast('Asset value is required', 'warning'); return; }
          CrackItStorage.addToCollection('assets', {
            id: uid('asset'), projectId: project.id,
            type: document.querySelector('#asset-type')?.value || 'Other',
            value,
            category: document.querySelector('#asset-category')?.value || '',
            status: document.querySelector('#asset-status')?.value || 'active',
            notes: document.querySelector('#asset-notes')?.value?.trim() || '',
            createdAt: new Date().toISOString()
          });
          CrackItUI.closeModal('add-asset');
          CrackItUI.toast('Asset added', 'success');
          renderProjectDetail(container);
        });
      });
    });
    container.querySelectorAll('[data-action="delete-asset"]').forEach(btn => {
      btn.addEventListener('click', () => {
        CrackItStorage.removeFromCollection('assets', btn.dataset.id);
        CrackItUI.toast('Asset removed', 'info');
        renderProjectDetail(container);
      });
    });

    container.querySelectorAll('[data-action="edit-scope"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const scope = CrackItStorage.getCollection('scopes').find(s => s.projectId === project.id) || {};
        CrackItUI.openModal('edit-scope', {
          title: 'Edit Scope',
          content: `
            <div style="display:flex;flex-direction:column;gap:12px">
              <div><label>In Scope (one per line)</label><textarea class="input textarea" id="scope-in" style="width:100%;min-height:80px">${(scope.inScope || []).join('\\n')}</textarea></div>
              <div><label>Out of Scope (one per line)</label><textarea class="input textarea" id="scope-out" style="width:100%;min-height:80px">${(scope.outScope || []).join('\\n')}</textarea></div>
              <div><label>Testing Hours</label><input type="text" class="input" id="scope-hours" value="${scope.testingHours || ''}" style="width:100%" placeholder="e.g. 09:00-18:00 EST, Mon-Fri"></div>
              <div><label>Allowed Methods</label><input type="text" class="input" id="scope-methods" value="${scope.allowedMethods || ''}" style="width:100%" placeholder="e.g. Authenticated scanning only"></div>
              <div><label>Emergency Contacts</label><input type="text" class="input" id="scope-contacts" value="${scope.emergencyContacts || ''}" style="width:100%" placeholder="Name, phone, email"></div>
              <div><label>Credentials Provided</label>
                <select class="input select" id="scope-creds" style="width:100%">
                  <option value="yes" ${scope.credentialsProvided ? 'selected' : ''}>Yes</option>
                  <option value="no" ${!scope.credentialsProvided ? 'selected' : ''}>No</option>
                </select>
              </div>
              <div><label>Status</label>
                <select class="input select" id="scope-status" style="width:100%">
                  <option value="draft" ${scope.status === 'draft' ? 'selected' : ''}>Draft</option>
                  <option value="pending" ${scope.status === 'pending' ? 'selected' : ''}>Pending Approval</option>
                  <option value="approved" ${scope.status === 'approved' ? 'selected' : ''}>Approved</option>
                </select>
              </div>
            </div>`,
          footer: '<button class="btn btn-secondary modal-close">Cancel</button><button class="btn btn-primary" id="save-scope">Save Scope</button>'
        });
        document.querySelector('#save-scope')?.addEventListener('click', () => {
          const inScope = document.querySelector('#scope-in')?.value.split('\\n').map(s => s.trim()).filter(Boolean) || [];
          const outScope = document.querySelector('#scope-out')?.value.split('\\n').map(s => s.trim()).filter(Boolean) || [];
          if (scope.id) {
            CrackItStorage.updateInCollection('scopes', scope.id, {
              inScope, outScope,
              testingHours: document.querySelector('#scope-hours')?.value || '',
              allowedMethods: document.querySelector('#scope-methods')?.value || '',
              emergencyContacts: document.querySelector('#scope-contacts')?.value || '',
              credentialsProvided: document.querySelector('#scope-creds')?.value === 'yes',
              status: document.querySelector('#scope-status')?.value || 'draft'
            });
          } else {
            CrackItStorage.addToCollection('scopes', {
              id: uid('scope'), projectId: project.id, inScope, outScope,
              testingHours: document.querySelector('#scope-hours')?.value || '',
              allowedMethods: document.querySelector('#scope-methods')?.value || '',
              emergencyContacts: document.querySelector('#scope-contacts')?.value || '',
              credentialsProvided: document.querySelector('#scope-creds')?.value === 'yes',
              status: document.querySelector('#scope-status')?.value || 'draft',
              authorizationDate: new Date().toISOString(),
              createdAt: new Date().toISOString()
            });
          }
          CrackItUI.closeModal('edit-scope');
          CrackItUI.toast('Scope saved', 'success');
          renderProjectDetail(container);
        });
      });
    });

    container.querySelector('#checklist-module-filter')?.addEventListener('change', (e) => {
      window._activeChecklistModule = e.target.value;
      renderProjectDetail(container);
    });
    container.querySelectorAll('[data-action="add-checklist"]').forEach(btn => {
      btn.addEventListener('click', () => {
        CrackItUI.openModal('add-checklist', {
          title: 'Add Checklist Item',
          content: '<div style="display:flex;flex-direction:column;gap:12px"><div><label>Title</label><input type="text" class="input" id="checklist-title" placeholder="Checklist item..." style="width:100%"></div><div><label>Module</label><select class="input select" id="checklist-module" style="width:100%"><option value="">General</option>'+moduleList.map(m => '<option value="'+escapeHtml(m.id)+'">'+escapeHtml(m.name)+'</option>').join('')+'</select></div></div>',
          footer: '<button class="btn btn-secondary modal-close">Cancel</button><button class="btn btn-primary" id="save-checklist">Add Item</button>'
        });
        document.querySelector('#save-checklist')?.addEventListener('click', () => {
          const title = document.querySelector('#checklist-title')?.value.trim();
          if (!title) { CrackItUI.toast('Title is required', 'warning'); return; }
          const modId = document.querySelector('#checklist-module')?.value || '';
          const modName = modId ? (PROJECT_MODULES.find(m => m.id === modId)?.name || '') : 'General';
          CrackItStorage.addToCollection('checklists', {
            id: uid('check'), projectId: project.id, title,
            moduleId: modId, moduleName: modName,
            completed: false, createdAt: new Date().toISOString()
          });
          CrackItUI.closeModal('add-checklist');
          CrackItUI.toast('Checklist item added', 'success');
          renderProjectDetail(container);
        });
      });
    });
    container.querySelectorAll('[data-action="toggle-checklist"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = CrackItStorage.findInCollection('checklists', btn.dataset.id);
        if (item) {
          CrackItStorage.updateInCollection('checklists', item.id, { completed: !item.completed });
          renderProjectDetail(container);
        }
      });
    });
    container.querySelectorAll('[data-action="delete-checklist"]').forEach(btn => {
      btn.addEventListener('click', () => {
        CrackItStorage.removeFromCollection('checklists', btn.dataset.id);
        CrackItUI.toast('Checklist item removed', 'info');
        renderProjectDetail(container);
      });
    });
  }

  function bindDragDrop(container) {
    container.querySelectorAll('[draggable="true"]').forEach(el => {
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', el.dataset.id);
        el.classList.add('drag-ghost');
      });
      el.addEventListener('dragend', () => el.classList.remove('drag-ghost'));
    });

    container.querySelectorAll('.kanban-column').forEach(col => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drag-over'); });
      col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        CrackItUI.toast(`Task moved to ${col.dataset.status}`, 'success');
      });
    });
  }

  return { render };
})();

CrackItModules.CrackItProjects = CrackItProjects;
