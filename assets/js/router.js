/**
 * CrackIt — Router
 * SPA page navigation with lazy loading
 */

/** Module registry — top-level const bindings are not on window */
const CrackItModules = {};

const CrackItRouter = (() => {
  'use strict';

  const { $ } = CrackItUtils;
  const pages = {
    dashboard: { title: 'Dashboard', module: 'CrackItDashboard' },
    projects: { title: 'Projects', module: 'CrackItProjects' },
    workspace: { title: 'Workspace', module: 'CrackItProjects' },
    chat: { title: 'AI Workspace', module: 'CrackItChat' },
    notes: { title: 'Notes', module: 'CrackItNotes' },
    files: { title: 'Files', module: 'CrackItFiles' },
    reports: { title: 'Reports', module: 'CrackItReports' },
    terminal: { title: 'Terminal', module: 'CrackItTerminal' },
    automation: { title: 'Automation', module: 'CrackItAutomation' },
    knowledge: { title: 'Knowledge Base', module: 'CrackItKnowledge' },
    vault: { title: 'Vault', module: 'CrackItVault' },
    clients: { title: 'Client Vault', module: 'CrackItClients' },
    settings: { title: 'Settings', module: 'CrackItSettings' },
    help: { title: 'Help', module: 'CrackItHelp' },
    utilities: { title: 'Utility Hub', module: 'CrackItUtilities' },
    soc: { title: 'SOC Dashboard', module: 'CrackItSOC' },
    threats: { title: 'Threat Intelligence', module: 'CrackItThreats' },
    labs: { title: 'Cybersecurity Labs', module: 'CrackItLabs' },
    knowledgecenter: { title: 'Knowledge Center', module: 'CrackItKnowledgeCenter' },
    devsecops: { title: 'DevSecOps', module: 'CrackItDevSecOps' },
    cve: { title: 'CVE Explorer', module: 'CrackItCVE' },
    cwe: { title: 'CWE Explorer', module: 'CrackItCWE' },
    mitre: { title: 'MITRE ATT&CK', module: 'CrackItMITRE' },
    scanner: { title: 'Website Scanner', module: 'CrackItScanner' },
    codescanner: { title: 'Code Scanner', module: 'CrackItCodeScanner' },
    apiscanner: { title: 'API Security', module: 'CrackItAPIScanner' },
    memai: { title: 'AI Memory', module: 'CrackItAIMemory' },
    agents: { title: 'AI Agents', module: 'CrackItAgents' },
    prompts: { title: 'Prompt Library', module: 'CrackItPrompts' },
    he: { title: 'HE — Hacking Environment', module: 'CrackItHE' }
  };

  let currentPage = 'dashboard';
  let container = null;

  function init() {
    container = $('#workspace-content');
    const state = CrackItStorage.uiState.get();
    currentPage = state.activePage || 'dashboard';
    navigate(currentPage, false);
  }

  async function navigate(page, updateState = true) {
    if (!pages[page]) {
      page = 'dashboard';
    }

    currentPage = page;
    const config = pages[page];

    if (updateState) {
      CrackItStorage.uiState.update({ activePage: page });
      CrackItNavigation.setActive(page);
      updateWorkspaceTab(page, config.title);
      addToRecent(page, config.title);
    }

    document.title = `${config.title} — CrackIt`;

    if (container) {
      CrackItUI.showPageSkeleton(container);

      await new Promise(r => setTimeout(r, 150));

      try {
        const pageModule = CrackItModules[config.module];
        if (pageModule && typeof pageModule.render === 'function') {
          container.innerHTML = '';
          container.classList.add('page-enter');
          await pageModule.render(container, page);
          setTimeout(() => container.classList.remove('page-enter'), 350);
        } else {
          container.innerHTML = renderFallback(page, config.title);
        }
      } catch (err) {
        container.innerHTML = `<div class="empty-state"><h3>Error loading page</h3><p>${err.message}</p></div>`;
      }
    }

    CrackItNavigation.updateBreadcrumbs(page, config.title);
    CrackItRightPanel?.update(page);
  }

  function renderFallback(page, title) {
    return `
      <div class="page-header">
        <div class="page-header-content">
          <h1>${title}</h1>
          <p>This module is ready for backend integration.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" data-action="create">Create New</button>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <div class="empty-state">
            <div class="empty-state-icon">${CrackItUtils.icons.shield}</div>
            <h3>${title}</h3>
            <p>The ${title} module provides professional cybersecurity workspace capabilities. Connect your backend to enable full functionality.</p>
            <button class="btn btn-secondary mt-4" data-action="learn-more">Learn More</button>
          </div>
        </div>
      </div>`;
  }

  function updateWorkspaceTab(page, title) {
    const state = CrackItStorage.uiState.get();
    const tabs = state.workspaceTabs || [];
    const activeTab = tabs.find(t => t.page === page);

    if (activeTab) {
      CrackItNavigation.renderTabs(tabs, activeTab.id);
      CrackItStorage.uiState.update({ activeTab: activeTab.id });
    } else {
      const newTab = { id: CrackItUtils.uid('tab'), title, page };
      tabs.push(newTab);
      CrackItStorage.uiState.update({ workspaceTabs: tabs, activeTab: newTab.id });
      CrackItNavigation.renderTabs(tabs, newTab.id);
    }
  }

  function addToRecent(page, title) {
    const state = CrackItStorage.uiState.get();
    let recent = state.recentItems || [];
    recent = recent.filter(r => r.page !== page);
    recent.unshift({ page, title, timestamp: new Date().toISOString() });
    recent = recent.slice(0, 20);
    CrackItStorage.uiState.update({ recentItems: recent });
  }

  function refresh() {
    navigate(currentPage, false);
  }

  function getCurrentPage() {
    return currentPage;
  }

  return { init, navigate, refresh, getCurrentPage, pages };
})();

/** Right Panel Manager */
const CrackItRightPanel = (() => {
  'use strict';

  const { escapeHtml, formatDate, icon } = CrackItUtils;

  function init() {
    const savedNote = CrackItStorage.quickNote.get();
    const noteEl = document.querySelector('#quick-note-input');
    if (noteEl && savedNote) noteEl.value = savedNote;

    noteEl?.addEventListener('input', CrackItUtils.debounce((e) => {
      CrackItStorage.quickNote.save(e.target.value);
      const status = document.querySelector('#quick-note-status');
      if (status) status.textContent = 'Saved ' + new Date().toLocaleTimeString();
    }, 500));

    document.querySelectorAll('.right-panel-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.right-panel-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const panel = tab.dataset.panel;
        document.querySelectorAll('.right-panel-section').forEach(s => {
          s.classList.toggle('hidden', s.dataset.panel !== panel);
        });
        if (panel === 'activity') renderActivity();
        if (panel === 'properties') renderProperties();
      });
    });

    document.querySelector('#quick-note-clear')?.addEventListener('click', () => {
      const input = document.querySelector('#quick-note-input');
      if (input) { input.value = ''; CrackItStorage.quickNote.save(''); }
      const status = document.querySelector('#quick-note-status');
      if (status) status.textContent = 'Cleared';
    });

    renderActivity();
    renderProperties();
  }

  function update(page) {
    renderActivity();
    renderProperties();
  }

  function renderActivity() {
    const container = document.querySelector('#right-panel-activity');
    if (!container) return;

    const activity = CrackItStorage.getCollection('activity').slice(0, 15);
    if (!activity.length) {
      container.innerHTML = '<div class="empty-state-sm" style="padding:16px"><p>No recent activity</p></div>';
      return;
    }

    container.innerHTML = activity.map(item => {
      const typeColors = { create: '#22C55E', update: '#3B82F6', delete: '#EF4444', login: '#A855F7', export: '#F59E0B', upload: '#06B6D4' };
      const dotColor = typeColors[item.type] || 'var(--text-muted)';
      return `
        <div class="activity-item" style="padding:8px 0">
          <div style="width:8px;height:8px;border-radius:50%;background:${dotColor};flex-shrink:0;margin-top:4px"></div>
          <div class="activity-content" style="min-width:0">
            <div class="activity-text" style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(item.action)}</div>
            <div class="activity-meta" style="font-size:10px;color:var(--text-muted);margin-top:1px">${item.detail ? escapeHtml(item.detail) : ''}</div>
            <div class="activity-time" style="font-size:10px;color:var(--text-muted);margin-top:1px">${formatDate(item.timestamp, true)}</div>
          </div>
        </div>`;
    }).join('');
  }

  function renderProperties() {
    const container = document.querySelector('#right-panel-meta');
    if (!container) return;

    const collections = ['projects', 'clients', 'findings', 'reports', 'notes', 'files', 'tasks', 'conversations'];
    const counts = {};
    collections.forEach(c => { counts[c] = CrackItStorage.getCollection(c).length; });
    const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);
    const settings = CrackItStorage.settings.get();
    const now = new Date();

    container.innerHTML = `
      <div class="right-panel-section-title" style="margin-top:4px">Data Overview</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:16px">
        ${Object.entries(counts).map(([key, val]) =>
          `<div style="background:var(--hover);border-radius:6px;padding:8px 10px">
            <div style="font-size:18px;font-weight:700;color:var(--primary)">${val}</div>
            <div style="font-size:10px;color:var(--text-muted);text-transform:capitalize">${key}</div>
          </div>`
        ).join('')}
      </div>
      <div class="right-panel-section-title">Session</div>
      <div class="meta-list" style="margin-bottom:12px">
        <div class="meta-item" style="font-size:11px"><span class="meta-label">User</span><span class="meta-value">Admin</span></div>
        <div class="meta-item" style="font-size:11px"><span class="meta-label">Workspace</span><span class="meta-value">${escapeHtml(settings.workspaceName || 'Default')}</span></div>
        <div class="meta-item" style="font-size:11px"><span class="meta-label">Theme</span><span class="meta-value">${settings.theme || 'dark'}</span></div>
        <div class="meta-item" style="font-size:11px"><span class="meta-label">Total Items</span><span class="meta-value">${totalItems.toLocaleString()}</span></div>
        <div class="meta-item" style="font-size:11px"><span class="meta-label">Time</span><span class="meta-value">${now.toLocaleTimeString()}</span></div>
        <div class="meta-item" style="font-size:11px"><span class="meta-label">Date</span><span class="meta-value">${now.toLocaleDateString()}</span></div>
      </div>`;

    const noteInput = document.querySelector('#quick-note-input');
    if (noteInput) {
      const savedVal = CrackItStorage.quickNote.get();
      if (savedVal) noteInput.value = savedVal;
    }
  }

  function toggle() {
    const panel = document.querySelector('#right-panel');
    panel?.classList.toggle('collapsed');
    const collapsed = panel?.classList.contains('collapsed');
    CrackItStorage.uiState.update({ rightPanelCollapsed: collapsed });
  }

  return { init, update, toggle };
})();
