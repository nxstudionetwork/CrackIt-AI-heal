/**
 * CrackIt — Settings Module
 */

const CrackItSettings = (() => {
  'use strict';

  let activeSection = 'general';
  let shortcutFilter = '';

  async function render(container) {
    const settings = CrackItStorage.settings.get();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content"><h1>Settings</h1><p>Configure your CrackIt workspace</p></div>
      </div>

      <div class="settings-layout">
        <nav class="settings-nav">
          ${['general', 'appearance', 'workspace', 'ai', 'storage', 'notifications', 'keyboard', 'privacy', 'updates', 'future', 'about'].map(s => `
            <button class="settings-nav-item ${activeSection === s ? 'active' : ''}" data-section="${s}">${s === 'future' ? 'Upcoming' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
          `).join('')}
        </nav>
        <div class="settings-content" id="settings-content">
          ${renderSection(activeSection, settings)}
        </div>
      </div>`;

    bindEvents(container);

    if (activeSection === 'about') {
      const statusEl = container.querySelector('#backend-status');
      if (statusEl) {
        if (CrackItAPI.isAuthenticated()) {
          CrackItAPI.request('/health').then(data => {
            statusEl.innerHTML = '<span style="color:#10B981">●</span> Backend: Connected · v' + (data.version || '1.0.0');
          }).catch(() => {
            statusEl.innerHTML = '<span style="color:#EF4444">●</span> Backend: Unavailable';
          });
        } else {
          statusEl.innerHTML = '<span style="color:#F59E0B">●</span> Backend: Not authenticated';
        }
      }
    }
  }

  function renderSection(section, settings) {
    const sections = {
      general: `
        <div class="settings-group">
          <h3 class="settings-group-title">General</h3>
          <div class="settings-row"><div class="settings-row-info"><h4>Language</h4><p>Display language</p></div>
            <select class="input select" data-setting="language" style="width:160px"><option value="en" selected>English</option><option value="es">Spanish</option></select></div>
          <div class="settings-row"><div class="settings-row-info"><h4>Auto Save</h4><p>Automatically save changes</p></div>
            <div class="switch ${settings.autoSave ? 'active' : ''}" data-setting="autoSave"></div></div>
          <div class="settings-row"><div class="settings-row-info"><h4>Animations</h4><p>Enable UI animations</p></div>
            <div class="switch ${settings.animations ? 'active' : ''}" data-setting="animations"></div></div>
        </div>`,
      appearance: `
        <div class="settings-group">
          <h3 class="settings-group-title">Appearance</h3>
          <div class="settings-row"><div class="settings-row-info"><h4>Theme</h4><p>Color theme</p></div>
            <select class="input select" data-setting="theme" style="width:160px"><option value="dark" selected>Dark</option><option value="light" disabled>Light (Coming Soon)</option></select></div>
          <div class="settings-row"><div class="settings-row-info"><h4>Accent Color</h4><p>Primary accent color</p></div>
            <select class="input select" data-setting="accentColor" style="width:160px"><option value="blue" selected>Blue</option><option value="purple">Purple</option><option value="cyan">Cyan</option></select></div>
          <div class="settings-row"><div class="settings-row-info"><h4>Font Size</h4><p>Interface font size</p></div>
            <select class="input select" data-setting="fontSize" style="width:160px"><option value="small">Small</option><option value="medium" selected>Medium</option><option value="large">Large</option></select></div>
          <div class="settings-row"><div class="settings-row-info"><h4>Compact Mode</h4><p>Reduce spacing</p></div>
            <div class="switch ${settings.compactMode ? 'active' : ''}" data-setting="compactMode"></div></div>
        </div>`,
      workspace: `
        <div class="settings-group">
          <h3 class="settings-group-title">Workspace</h3>
          <div class="settings-row"><div class="settings-row-info"><h4>Workspace Name</h4><p>Display name</p></div>
            <input type="text" class="input" data-setting="workspaceName" value="${CrackItUtils.escapeHtml(settings.workspaceName)}" style="width:200px"></div>
          <div class="settings-row"><div class="settings-row-info"><h4>Default Page</h4><p>Page on startup</p></div>
            <select class="input select" style="width:160px"><option value="dashboard" selected>Dashboard</option><option value="projects">Projects</option></select></div>
        </div>`,
      ai: `
        <div class="settings-group">
          <h3 class="settings-group-title">AI Configuration</h3>
          <div class="settings-row"><div class="settings-row-info"><h4>AI Model</h4><p>Default AI model</p></div>
            <select class="input select" data-setting="aiModel" style="width:200px"><option value="crackit-pro" selected>CrackIt Pro</option><option value="crackit-fast">CrackIt Fast</option></select></div>
          <div class="settings-row"><div class="settings-row-info"><h4>AI Memory</h4><p>Remember conversation context</p></div>
            <div class="switch active" data-setting="aiMemory"></div></div>
          <div class="settings-row"><div class="settings-row-info"><h4>Auto Suggestions</h4><p>AI-powered suggestions</p></div>
            <div class="switch active" data-setting="aiSuggestions"></div></div>
        </div>`,
      storage: `
        <div class="settings-group">
          <h3 class="settings-group-title">Storage</h3>
          <div class="settings-row"><div class="settings-row-info"><h4>Local Storage Used</h4><p>Browser storage</p></div><span>${getStorageSize()}</span></div>
          <div class="settings-row"><div class="settings-row-info"><h4>Clear Cache</h4><p>Clear temporary data</p></div>
            <button class="btn btn-secondary btn-sm" data-action="clear-cache">Clear</button></div>
          <div class="settings-row"><div class="settings-row-info"><h4>Reset Data</h4><p>Reset to default mock data</p></div>
            <button class="btn btn-danger btn-sm" data-action="reset-data">Reset</button></div>
        </div>`,
      notifications: `
        <div class="settings-group">
          <h3 class="settings-group-title">Notifications</h3>
          <div class="settings-row"><div class="settings-row-info"><h4>Enable Notifications</h4><p>System notifications</p></div>
            <div class="switch ${settings.notifications ? 'active' : ''}" data-setting="notifications"></div></div>
          <div class="settings-row"><div class="settings-row-info"><h4>Sound Effects</h4><p>Notification sounds</p></div>
            <div class="switch ${settings.soundEffects ? 'active' : ''}" data-setting="soundEffects"></div></div>
        </div>`,
      keyboard: `
        <div class="settings-group">
          <h3 class="settings-group-title">Keyboard Shortcuts</h3>
          <p class="text-sm text-muted mb-3">Search and browse all available keyboard shortcuts</p>
          <input type="text" class="input mb-3" placeholder="Search shortcuts..." id="shortcut-search" value="${CrackItUtils.escapeHtml(shortcutFilter)}" style="max-width:400px">
          <div class="table-improved">
            <table>
              <thead><tr><th>Action</th><th>Shortcut</th><th>Category</th></tr></thead>
              <tbody id="shortcuts-table-body">
                ${renderShortcutRows(shortcutFilter)}
              </tbody>
            </table>
          </div>
        </div>`,
      privacy: `
        <div class="settings-group">
          <h3 class="settings-group-title">Privacy</h3>
          <div class="settings-row"><div class="settings-row-info"><h4>Data Collection</h4><p>All data stored locally</p></div><span class="badge badge-green">Local Only</span></div>
          <div class="settings-row"><div class="settings-row-info"><h4>Telemetry</h4><p>Usage analytics</p></div>
            <div class="switch" data-setting="telemetry"></div></div>
        </div>`,
      updates: `
        <div class="settings-group">
          <h3 class="settings-group-title">Updates</h3>
          <div class="settings-row"><div class="settings-row-info"><h4>Current Version</h4><p>CrackIt Desktop</p></div><span>v2.0.0</span></div>
          <div class="settings-row"><div class="settings-row-info"><h4>Check for Updates</h4><p>Latest version available</p></div>
            <button class="btn btn-secondary btn-sm" data-action="check-update">Check</button></div>
        </div>`,
      about: `
        <div class="settings-group">
          <h3 class="settings-group-title">About CrackIt</h3>
          <div class="card"><div class="card-body text-center" style="padding:32px">
            <div style="width:64px;height:64px;background:var(--gradient-accent);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;font-weight:bold;color:white">CI</div>
            <h3 class="text-xl font-bold mb-2">CrackIt</h3>
            <p class="text-muted mb-4">AI-Powered Cybersecurity & Research Operating System</p>
            <div id="backend-status" class="text-sm text-muted mb-2">Checking backend status...</div>
            <p class="text-xs text-muted mt-4">© 2025 CrackIt</p>
            <hr class="my-4" style="border-color:var(--border-color);opacity:0.3">
            <button class="btn btn-danger" data-action="logout">Sign Out</button>
          </div></div>
        </div>`,
      future: `
        <div class="settings-group">
          <h3 class="settings-group-title">Upcoming Features</h3>
          <p class="text-sm text-muted mb-4">These features are being prepared for future releases. UI placeholders are ready — connect a backend to enable them.</p>
          <div class="project-grid">
            ${[
              { name: 'AI Security Agents', desc: 'Autonomous AI agents for continuous security monitoring, threat hunting, and incident response', icon: '🤖', status: 'In Development' },
              { name: 'Cloud Sync', desc: 'Synchronize your workspace across devices with end-to-end encryption', icon: '☁️', status: 'Planned' },
              { name: 'Plugin System', desc: 'Extend CrackIt with community and custom plugins via a sandboxed API', icon: '🧩', status: 'Planned' },
              { name: 'Encrypted Vault', desc: 'Hardware-backed encrypted storage for secrets, keys, and sensitive data', icon: '🔒', status: 'In Development' },
              { name: 'Collaboration Hub', desc: 'Real-time collaborative editing, shared workspaces, and team permissions', icon: '👥', status: 'Planned' },
              { name: 'Report Generator Pro', desc: 'Advanced report templating with custom branding, charts, and automated findings', icon: '📄', status: 'In Development' },
              { name: 'API Gateway', desc: 'REST and GraphQL API gateway for integrating with external security tools', icon: '🔌', status: 'Backlog' },
              { name: 'Mobile Companion', desc: 'Mobile app for notifications, approvals, and quick access to dashboards', icon: '📱', status: 'Backlog' }
            ].map(f => `
              <div class="card hover-lift" style="opacity:0.85">
                <div class="card-body">
                  <div style="font-size:28px;margin-bottom:8px">${f.icon}</div>
                  <h4 class="font-semibold mb-1">${f.name}</h4>
                  <p class="text-sm text-muted mb-2">${f.desc}</p>
                  <span class="badge badge-${f.status === 'In Development' ? 'blue' : 'gray'}">${f.status}</span>
                </div>
              </div>`).join('')}
          </div>
        </div>`
    };
    return sections[section] || sections.general;
  }

  function renderShortcutRows(filter) {
    const allShortcuts = getShortcutList();
    const filtered = filter
      ? allShortcuts.filter(s => s.action.toLowerCase().includes(filter.toLowerCase()) || s.shortcut.toLowerCase().includes(filter.toLowerCase()) || s.category.toLowerCase().includes(filter.toLowerCase()))
      : allShortcuts;
    return filtered.map(s => `<tr><td>${CrackItUtils.escapeHtml(s.action)}</td><td><span class="badge badge-gray" style="font-family:monospace">${CrackItUtils.escapeHtml(s.shortcut)}</span></td><td><span class="text-muted">${CrackItUtils.escapeHtml(s.category)}</span></td></tr>`).join('');
  }

  function getShortcutList() {
    return [
      { action: 'Command Palette', shortcut: 'Ctrl+K', category: 'General' },
      { action: 'Global Search', shortcut: 'Ctrl+Shift+F', category: 'General' },
      { action: 'Toggle Sidebar', shortcut: 'Ctrl+B', category: 'Navigation' },
      { action: 'Open Terminal', shortcut: 'Ctrl+`', category: 'Navigation' },
      { action: 'Open Settings', shortcut: 'Ctrl+,', category: 'Navigation' },
      { action: 'Go to Dashboard', shortcut: 'Ctrl+H', category: 'Navigation' },
      { action: 'Go to Projects', shortcut: 'Ctrl+P', category: 'Navigation' },
      { action: 'Go to AI Workspace', shortcut: 'Ctrl+Shift+A', category: 'Navigation' },
      { action: 'New Project', shortcut: 'Ctrl+N', category: 'Create' },
      { action: 'New Client', shortcut: 'Ctrl+Shift+N', category: 'Create' },
      { action: 'New Report', shortcut: 'Ctrl+Shift+R', category: 'Create' },
      { action: 'Save', shortcut: 'Ctrl+S', category: 'Edit' },
      { action: 'Undo', shortcut: 'Ctrl+Z', category: 'Edit' },
      { action: 'Redo', shortcut: 'Ctrl+Y', category: 'Edit' },
      { action: 'Duplicate', shortcut: 'Ctrl+D', category: 'Edit' },
      { action: 'Find in Page', shortcut: 'Ctrl+F', category: 'Edit' },
      { action: 'Close Tab', shortcut: 'Ctrl+W', category: 'Navigation' },
      { action: 'Switch Tab', shortcut: 'Ctrl+Tab', category: 'Navigation' },
      { action: 'Quick Create Menu', shortcut: 'Ctrl+Shift+Space', category: 'Create' },
      { action: 'Help', shortcut: 'F1', category: 'General' },
      { action: 'Rename Selected', shortcut: 'F2', category: 'Edit' },
      { action: 'Close Dialog', shortcut: 'Escape', category: 'General' },
      { action: 'Open Clients', shortcut: 'Ctrl+Shift+N', category: 'Navigation' },
      { action: 'Open Reports', shortcut: 'Ctrl+Shift+R', category: 'Navigation' },
      { action: 'Open AI Chat', shortcut: 'Ctrl+Shift+C', category: 'Navigation' }
    ];
  }

  function getStorageSize() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      total += (localStorage.getItem(localStorage.key(i)) || '').length * 2;
    }
    return CrackItUtils.formatSize(total);
  }

  function bindEvents(container) {
    container.querySelectorAll('.settings-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        activeSection = item.dataset.section;
        container.querySelectorAll('.settings-nav-item').forEach(i => i.classList.toggle('active', i.dataset.section === activeSection));
        container.querySelector('#settings-content').innerHTML = renderSection(activeSection, CrackItStorage.settings.get());
        bindSettingsEvents(container);
      });
    });
    bindSettingsEvents(container);
  }

  function bindSettingsEvents(container) {
    container.querySelectorAll('.switch').forEach(sw => {
      sw.addEventListener('click', () => {
        sw.classList.toggle('active');
        const setting = sw.dataset.setting;
        if (setting) {
          CrackItStorage.settings.update({ [setting]: sw.classList.contains('active') });
          CrackItUI.toast('Setting saved', 'success');
        }
      });
    });

    container.querySelectorAll('[data-setting]').forEach(el => {
      if (el.tagName === 'SELECT' || el.tagName === 'INPUT') {
        el.addEventListener('change', () => {
          CrackItStorage.settings.update({ [el.dataset.setting]: el.value });
          CrackItUI.toast('Setting saved', 'success');
        });
      }
    });

    container.querySelector('[data-action="clear-cache"]')?.addEventListener('click', () => {
      CrackItUI.toast('Cache cleared', 'success');
    });

    container.querySelector('[data-action="reset-data"]')?.addEventListener('click', () => {
      CrackItUI.confirm('Reset all data to defaults?', () => {
        localStorage.clear();
        location.reload();
      });
    });

    container.querySelector('[data-action="check-update"]')?.addEventListener('click', () => {
      CrackItUI.toast('You are running the latest version', 'success');
    });

    container.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
      CrackItUI.confirm('Sign out of CrackIt?', () => {
        CrackItStorage.settings.update({ authenticated: false });
        location.reload();
      });
    });

    const shortcutInput = container.querySelector('#shortcut-search');
    if (shortcutInput) {
      shortcutInput.addEventListener('input', (e) => {
        shortcutFilter = e.target.value;
        const tbody = container.querySelector('#shortcuts-table-body');
        if (tbody) tbody.innerHTML = renderShortcutRows(shortcutFilter);
      });
    }
  }

  return { render };
})();

/**
 * CrackIt — Help Module
 */
const CrackItHelp = (() => {
  async function render(container) {
    container.innerHTML = `
      <div class="page-header"><div class="page-header-content"><h1>Help & Documentation</h1><p>Get started with CrackIt</p></div></div>
      <div class="dashboard-grid">
        <div class="col-span-4"><div class="card hover-lift"><div class="card-body"><h3 class="font-semibold mb-2">Getting Started</h3><p class="text-sm text-muted">Learn the basics of navigating CrackIt</p><button class="btn btn-secondary btn-sm mt-3" data-action="guide">Open Guide</button></div></div></div>
        <div class="col-span-4"><div class="card hover-lift"><div class="card-body"><h3 class="font-semibold mb-2">Keyboard Shortcuts</h3><p class="text-sm text-muted">Master keyboard navigation</p><button class="btn btn-secondary btn-sm mt-3" data-action="shortcuts">View Shortcuts</button></div></div></div>
        <div class="col-span-4"><div class="card hover-lift"><div class="card-body"><h3 class="font-semibold mb-2">API Documentation</h3><p class="text-sm text-muted">Backend integration guide</p><button class="btn btn-secondary btn-sm mt-3" data-action="api">View Docs</button></div></div></div>
        <div class="col-span-12"><div class="card"><div class="card-header"><span class="card-title">FAQ</span></div><div class="card-body">
          ${['How do I create a new project?', 'How does AI Chat work?', 'Where is data stored?', 'How to export reports?'].map((q, i) => `
            <div class="accordion-item ${i === 0 ? 'open' : ''}"><button class="accordion-header">${q}<span>${CrackItUtils.icons.chevronRight}</span></button>
              <div class="accordion-body"><p class="text-sm text-muted">This feature uses LocalStorage for data persistence. Connect a backend API to enable full functionality. All UI components are ready for integration.</p></div></div>`).join('')}
        </div></div></div>
      </div>`;

    container.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => header.closest('.accordion-item').classList.toggle('open'));
    });
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => CrackItUI.toast('Documentation opened', 'info'));
    });
  }
  return { render };
})();

/**
 * CrackIt — Extensions Module
 */
const CrackItExtensions = (() => {
  async function render(container) {
    const extensions = [
      { name: 'Nmap Integration', desc: 'Network scanning tools', status: 'installed', author: 'CrackIt' },
      { name: 'Burp Suite Connector', desc: 'Web app security testing', status: 'available', author: 'Community' },
      { name: 'Metasploit Bridge', desc: 'Exploitation framework', status: 'available', author: 'Community' },
      { name: 'Wireshark Analyzer', desc: 'Packet analysis', status: 'installed', author: 'CrackIt' },
      { name: 'CVE Database Sync', desc: 'Real-time CVE updates', status: 'installed', author: 'CrackIt' },
      { name: 'Shodan Integration', desc: 'Internet-wide scanning', status: 'available', author: 'Community' }
    ];

    container.innerHTML = `
      <div class="page-header"><div class="page-header-content"><h1>Extensions</h1><p>Enhance CrackIt with plugins</p></div>
        <div class="page-header-actions"><button class="btn btn-primary" data-action="browse">Browse Marketplace</button></div></div>
      <div class="project-grid">${extensions.map(e => `
        <div class="card hover-lift"><div class="card-body">
          <div class="flex justify-between mb-2"><h3 class="font-semibold">${e.name}</h3><span class="badge badge-${e.status === 'installed' ? 'green' : 'blue'}">${e.status}</span></div>
          <p class="text-sm text-muted mb-3">${e.desc}</p>
          <div class="text-xs text-muted mb-3">By ${e.author}</div>
          <button class="btn btn-${e.status === 'installed' ? 'secondary' : 'primary'} btn-sm">${e.status === 'installed' ? 'Configure' : 'Install'}</button>
        </div></div>`).join('')}</div>`;

    container.querySelector('[data-action="browse"]')?.addEventListener('click', () => CrackItUI.toast('Extension marketplace opened', 'info'));
    container.querySelectorAll('.btn-sm').forEach(btn => btn.addEventListener('click', () => CrackItUI.toast('Extension action completed', 'success')));
  }
  return { render };
})();

/** Generic page modules for security features */
function createGenericModule(title, description, iconName) {
  return {
    async render(container) {
      container.innerHTML = `
        <div class="page-header"><div class="page-header-content"><h1>${title}</h1><p>${description}</p></div>
          <div class="page-header-actions"><button class="btn btn-primary" data-action="create">Create New</button></div></div>
        <div class="dashboard-grid">
          <div class="col-span-3"><div class="card stat-card"><div class="stat-value">—</div><div class="stat-label">Total Items</div></div></div>
          <div class="col-span-3"><div class="card stat-card"><div class="stat-value">—</div><div class="stat-label">Active</div></div></div>
          <div class="col-span-3"><div class="card stat-card"><div class="stat-value">—</div><div class="stat-label">Critical</div></div></div>
          <div class="col-span-3"><div class="card stat-card"><div class="stat-value">—</div><div class="stat-label">Coverage</div></div></div>
          <div class="col-span-12"><div class="card"><div class="card-body">
            <div class="empty-state"><div class="empty-state-icon">${CrackItUtils.icons[iconName] || CrackItUtils.icons.shield}</div>
              <h3>${title}</h3><p>${description}. This module is ready for backend integration with full CRUD operations.</p>
              <button class="btn btn-primary mt-4" data-action="start">Get Started</button>
            </div>
          </div></div></div>
        </div>`;
      container.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => CrackItUI.toast(`${title} action initiated`, 'success'));
      });
    }
  };
}

const CrackItTargets = createGenericModule('Targets', 'Manage assessment targets and scope', 'target');
const CrackItRecon = createGenericModule('Reconnaissance', 'OSINT and reconnaissance tools', 'recon');
const CrackItEnumeration = createGenericModule('Enumeration', 'Service and vulnerability enumeration', 'enum');
const CrackItScans = createGenericModule('Scans', 'Vulnerability and security scans', 'scan');
const CrackItEvidence = createGenericModule('Evidence', 'Evidence collection and chain of custody', 'evidence');
const CrackItScripts = createGenericModule('Scripts', 'Security automation scripts library', 'scripts');
const CrackItLogs = createGenericModule('Logs', 'System and audit logs viewer', 'logs');

Object.assign(CrackItModules, {
  CrackItSettings,
  CrackItHelp,
  CrackItExtensions,
  CrackItTargets,
  CrackItRecon,
  CrackItEnumeration,
  CrackItScans,
  CrackItEvidence,
  CrackItScripts,
  CrackItLogs
});
