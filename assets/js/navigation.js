/**
 * CrackIt — Navigation
 * Sidebar, tabs, breadcrumbs, keyboard shortcuts
 */

const CrackItNavigation = (() => {
  'use strict';

  const { $, $$, icon } = CrackItUtils;

  function getSidebarTree() {
    const soloItem = _('Dashboard', 'dashboard', 'dashboard');
    const expanded = CrackItStorage.get('sidebar_expanded', 'dash');

    function _(label, iconName, badge) {
      const iconHtml = `<span class="sbar-icon">${CrackItUtils.icon(iconName || 'chevronRight')}</span>`;
      return `<div class="sbar-item" data-page="dashboard" data-icon="${iconName}" data-tooltip="${label}">
        ${iconHtml}
        <span class="sbar-label">${label}</span>
        ${badge ? `<span class="sbar-badge">${badge}</span>` : ''}
      </div>`;
    }

    const projs = CrackItStorage.getCollection('projects');
    const activeN = projs.filter(p => p.status !== 'archived' && p.status !== 'completed').length;
    const chatN = CrackItStorage.getCollection('conversations').length;

    const sections = {
      proj: { label: 'Projects', icon: 'projects', children: [
        { id: 'projects', label: 'Active', icon: 'projects', badge: String(activeN) },
        { id: 'workspace', label: 'Workspace', icon: 'workspace' },
        { id: 'projects', label: 'Archived', icon: 'archive' },
        { id: 'projects', label: 'Templates', icon: 'template' },
        { id: 'projects', label: 'Import', icon: 'download' },
        { id: 'projects', label: 'Export', icon: 'upload' },
      ]},
      ai: { label: 'AI', icon: 'chat', children: [
        { id: 'chat', label: 'Chat', icon: 'chat', badge: String(chatN) },
        { id: 'memai', label: 'Memory', icon: 'database' },
        { id: 'agents', label: 'Agents', icon: 'cpu' },
        { id: 'prompts', label: 'Prompt Library', icon: 'book' },
        { id: 'chat', label: 'Research', icon: 'search' },
        { id: 'chat', label: 'Workflows', icon: 'automation' },
      ]},
      sec: { label: 'Cyber Security', icon: 'shield', children: [
        { id: 'soc', label: 'Dashboard', icon: 'monitor' },
        { id: 'soc', label: 'Monitoring', icon: 'radio' },
        { id: 'scanner', label: 'Vulnerability Scanner', icon: 'scan' },
        { id: 'scanner', label: 'Website Security', icon: 'globe' },
        { id: 'apiscanner', label: 'API Security', icon: 'lock' },
        { id: 'codescanner', label: 'Code Security', icon: 'code' },
        { id: 'threats', label: 'Threat Intelligence', icon: 'globe' },
        { id: 'soc', label: 'Incident Response', icon: 'target' },
        { id: 'soc', label: 'Digital Forensics', icon: 'search' },
        { id: 'reports', label: 'Reports', icon: 'reports' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
      ]},
      tool: { label: 'Tools', icon: 'toolbox', children: [
        { id: 'terminal', label: 'Terminal', icon: 'terminal' },
        { id: 'files', label: 'File Manager', icon: 'files' },
        { id: 'notes', label: 'Notes', icon: 'notes' },
        { id: 'utilities', label: 'Utilities', icon: 'toolbox' },
      ]},
      repo: { label: 'Reports', icon: 'reports', children: [
        { id: 'reports', label: 'Report Center', icon: 'reports' },
        { id: 'automation', label: 'Automation', icon: 'automation' },
        { id: 'knowledge', label: 'Knowledge Base', icon: 'knowledge' },
      ]},
      admn: { label: 'Management', icon: 'settings', children: [
        { id: 'vault', label: 'Vault', icon: 'vault' },
        { id: 'clients', label: 'Clients', icon: 'clients' },
        { id: 'knowledgecenter', label: 'Knowledge Center', icon: 'book' },
        { id: 'devsecops', label: 'DevSecOps', icon: 'layers' },
        { id: 'labs', label: 'Labs', icon: 'flask' },
      ]},
      he: { label: 'HE — Hacking Environment', icon: 'shield', children: [
        { id: 'he', label: 'HE Dashboard', icon: 'dashboard' },
        { id: 'he', label: 'Web App Security', icon: 'globe' },
        { id: 'he', label: 'API Security', icon: 'lock' },
        { id: 'he', label: 'Mobile Security', icon: 'smartphone' },
        { id: 'he', label: 'Desktop Security', icon: 'monitor' },
        { id: 'he', label: 'Code Review', icon: 'code' },
        { id: 'he', label: 'Network Assessment', icon: 'radio' },
        { id: 'he', label: 'Wireless Review', icon: 'wifi' },
        { id: 'he', label: 'Cloud Security', icon: 'cloud' },
        { id: 'he', label: 'Container Security', icon: 'layers' },
      ]},
      sys: { label: 'System', icon: 'cpu', children: [
        { id: 'settings', label: 'Settings', icon: 'settings' },
        { id: 'help', label: 'Help', icon: 'help' },
      ]},
    };

    let html = `<div class="sbar-main">${soloItem}</div>`;
    for (const [id, sec] of Object.entries(sections)) {
      const isOpen = expanded === id;
      html += `<div class="sbar-section">
        <button class="sbar-toggle" data-section="${id}" data-tooltip="${sec.label}">
          <span class="sbar-arrow">${CrackItUtils.icons.chevronRight}</span>
          <span class="sbar-icon">${CrackItUtils.icon(sec.icon)}</span>
          <span class="sbar-label">${sec.label}</span>
          <span class="sbar-arrow-hint">></span>
        </button>
        <div class="sbar-children" style="display:${isOpen ? 'block' : 'none'}">
          ${sec.children.map(c => `<button class="sbar-child" data-page="${c.id}" data-tooltip="${c.label}">
            <span class="sbar-child-icon">${CrackItUtils.icon(c.icon)}</span>
            <span class="sbar-child-label">${c.label}</span>
            ${c.badge ? `<span class="sbar-badge">${c.badge}</span>` : ''}
          </button>`).join('')}
        </div>
      </div>`;
    }
    return html;
  }

  function renderSidebar() {
    const nav = $('#sidebar-nav');
    if (!nav) return;
    const expanded = CrackItStorage.get('sidebar_expanded', 'dash');
    nav.innerHTML = `<div class="sidebar-tree">${getSidebarTree()}</div>`;
    nav.querySelectorAll('.sbar-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.section;
        const current = CrackItStorage.get('sidebar_expanded', 'dash');
        CrackItStorage.set('sidebar_expanded', current === id ? null : id);
        renderSidebar();
      });
    });
    nav.querySelectorAll('.sbar-child, .sbar-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) CrackItRouter.navigate(page);
      });
    });
    const isCollapsed = document.getElementById('sidebar')?.classList.contains('collapsed');
    if (isCollapsed) {
      nav.querySelectorAll('.sbar-toggle').forEach(b => b.style.justifyContent = 'center');
    }
    updateFooterCounts();
  }

  function init() {
    renderSidebar();
    restoreUIState();
    bindEvents();
    renderTabs(CrackItStorage.uiState.get().workspaceTabs, CrackItStorage.uiState.get().activeTab);
  }

  function bindEvents() {
    $('#sidebar-nav')?.addEventListener('click', (e) => {
      const toggle = e.target.closest('.sidebar-tree-toggle');
      if (toggle) {
        e.stopPropagation();
        const key = toggle.dataset.tree;
        const expanded = CrackItStorage.get('sidebar_expanded', {});
        expanded[key] = expanded[key] === false ? true : false;
        CrackItStorage.set('sidebar_expanded', expanded);
        renderSidebar();
        return;
      }
      const item = e.target.closest('.sidebar-item');
      if (item) CrackItRouter.navigate(item.dataset.page);
    });

    $('#sidebar-toggle')?.addEventListener('click', toggleSidebar);
    $('#topbar-logo')?.addEventListener('click', () => CrackItRouter.navigate('dashboard'));

    $('#workspace-tabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.workspace-tab');
      const closeBtn = e.target.closest('.workspace-tab-close');

      if (closeBtn && tab) {
        closeTab(tab.dataset.tabId);
        e.stopPropagation();
        return;
      }

      if (tab) {
        const state = CrackItStorage.uiState.get();
        const tabData = state.workspaceTabs.find(t => t.id === tab.dataset.tabId);
        if (tabData) CrackItRouter.navigate(tabData.page);
      }
    });

    $('#workspace-tab-add')?.addEventListener('click', () => {
      CrackItRouter.navigate('dashboard');
    });

    document.querySelectorAll('.window-control').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.window;
        if (action === 'close') CrackItUI.toast('Window controls are simulated in web mode', 'info');
        else if (action === 'minimize') CrackItUI.toast('Minimized', 'info');
        else if (action === 'maximize') document.documentElement.requestFullscreen?.();
      });
    });

    $('#right-panel-toggle')?.addEventListener('click', () => CrackItRightPanel.toggle());
  }

  function toggleSidebar() {
    const sidebar = $('#sidebar');
    sidebar?.classList.toggle('collapsed');
    CrackItStorage.uiState.update({ sidebarCollapsed: sidebar?.classList.contains('collapsed') });
  }

  function setActive(page) {
    $$('.sbar-item, .sbar-child').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
  }

  function renderTabs(tabs, activeId) {
    const container = $('#workspace-tabs');
    if (!container) return;

    const tabsHtml = tabs.map(tab => `
      <button class="workspace-tab ${tab.id === activeId ? 'active' : ''}" data-tab-id="${tab.id}" data-page="${tab.page}">
        <span class="truncate">${CrackItUtils.escapeHtml(tab.title)}</span>
        <span class="workspace-tab-close" aria-label="Close tab">${CrackItUtils.icons.close}</span>
      </button>
    `).join('');

    const addBtn = container.querySelector('.workspace-tab-add');
    container.innerHTML = tabsHtml;
    if (addBtn) container.appendChild(addBtn);
    else {
      const btn = document.createElement('button');
      btn.className = 'workspace-tab-add';
      btn.id = 'workspace-tab-add';
      btn.innerHTML = CrackItUtils.icons.plus;
      btn.setAttribute('aria-label', 'New tab');
      container.appendChild(btn);
      btn.addEventListener('click', () => CrackItRouter.navigate('dashboard'));
    }
  }

  function closeTab(tabId) {
    const state = CrackItStorage.uiState.get();
    let tabs = state.workspaceTabs || [];
    const closedTab = tabs.find(t => t.id === tabId);

    if (tabs.length <= 1) {
      CrackItUI.toast('Cannot close the last tab', 'warning');
      return;
    }

    tabs = tabs.filter(t => t.id !== tabId);
    const closedTabs = [...(state.closedTabs || []), closedTab].slice(-10);

    let activeTab = state.activeTab;
    if (activeTab === tabId) {
      activeTab = tabs[tabs.length - 1].id;
      CrackItRouter.navigate(tabs[tabs.length - 1].page);
    }

    CrackItStorage.uiState.update({ workspaceTabs: tabs, activeTab, closedTabs });
    renderTabs(tabs, activeTab);
    CrackItUI.toast(`Closed "${closedTab.title}"`, 'info');
  }

  function updateBreadcrumbs(page, title) {
    const container = $('#breadcrumbs');
    if (!container) return;

    container.innerHTML = `
      <div class="breadcrumb-item"><button data-page="dashboard">CrackIt</button></div>
      <span class="breadcrumb-separator">${CrackItUtils.icons.chevronRight}</span>
      <div class="breadcrumb-item active">${CrackItUtils.escapeHtml(title)}</div>`;

    container.querySelector('button')?.addEventListener('click', () => CrackItRouter.navigate('dashboard'));
  }

  function updateFooterCounts() {
    const projCount = document.getElementById('sidebar-proj-count');
    const secScore = document.getElementById('sidebar-sec-score');
    if (projCount) {
      const count = CrackItStorage.getCollection('projects').length;
      projCount.textContent = count + ' project' + (count !== 1 ? 's' : '');
    }
    if (secScore) {
      const findings = CrackItStorage.getCollection('findings');
      const critical = findings.filter(f => f.severity === 'critical').length;
      secScore.textContent = critical > 0 ? critical + ' critical' : 'Secure';
      secScore.style.color = critical > 0 ? 'var(--accent-red)' : 'var(--accent-green)';
    }
  }

  function restoreUIState() {
    const state = CrackItStorage.uiState.get();
    if (state.sidebarCollapsed) $('#sidebar')?.classList.add('collapsed');
    if (state.rightPanelCollapsed) $('#right-panel')?.classList.add('collapsed');
    setActive(state.activePage || 'dashboard');
  }

  return { init, renderSidebar, setActive, renderTabs, toggleSidebar, updateBreadcrumbs, updateFooterCounts };
})();
