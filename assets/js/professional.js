/**
 * CrackIt — Professional Desktop Experience
 * Splash, Workspace Manager, Command Palette, Floating Button, Task Panel
 */
const CrackItProfessional = (() => {
  'use strict';

  const { escapeHtml, icon, uid, $, $$ } = CrackItUtils;

  /* ========== SPLASH SCREEN ========== */
  let splashContainer = null;
  const splashStages = [
    'Assets Loaded...',
    'UI Components Loaded...',
    'AI Modules Initialized...',
    'Security Engine Loaded...',
    'Workspace Initialized...',
    'Launching...'
  ];

  function showSplash() {
    if (document.getElementById('splash-screen')) return;
    const div = document.createElement('div');
    div.id = 'splash-screen';
    div.innerHTML = `
      <div class="splash-logo">
        <div class="splash-ring-loader">
          ${Array.from({length:6}, (_,i) => `<div class="splash-ring-dot" style="--i:${i};--angle:${i*60}deg"></div>`).join('')}
        </div>
        <div class="splash-logo-inner">${icon('shield')}</div>
      </div>
      <div class="splash-version">v2.0.0</div>
      <div class="splash-title">CrackIt</div>
      <div class="splash-subtitle">Cybersecurity Operating System</div>
      <div class="splash-progress-wrap"><div class="splash-progress-bar" id="splash-progress"></div></div>
      <div class="splash-status" id="splash-status">Preparing Interface...</div>`;
    document.body.appendChild(div);
    splashContainer = div;
    return animateSplash();
  }

  function animateSplash() {
    return new Promise(resolve => {
      const bar = document.getElementById('splash-progress');
      const status = document.getElementById('splash-status');
      let stage = 0;
      bar.style.width = '0%';
      const interval = setInterval(() => {
        stage++;
        const pct = Math.min(stage * 16.67, 100);
        bar.style.width = pct + '%';
        if (stage <= splashStages.length) {
          status.textContent = splashStages[stage - 1] || 'Finalizing...';
        }
        if (pct >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            splashContainer.classList.add('splash-fade-out');
            splashContainer.addEventListener('transitionend', () => {
              splashContainer.remove();
              splashContainer = null;
              resolve();
            }, {once:true});
            setTimeout(() => {
              if (splashContainer) { splashContainer.remove(); splashContainer = null; resolve(); }
            }, 800);
          }, 400);
        }
      }, 350);
    });
  }

  function hideSplash() {
    if (!splashContainer) return Promise.resolve();
    return new Promise(resolve => {
      splashContainer.classList.add('splash-fade-out');
      setTimeout(() => {
        splashContainer.remove();
        splashContainer = null;
        resolve();
      }, 600);
    });
  }

  /* ========== WORKSPACE MANAGER ========== */
  function getWorkspaces() {
    return CrackItStorage.get('workspaces', [
      { id: 'default', name: 'CrackIt HQ', active: true, createdAt: new Date().toISOString(), lastOpened: new Date().toISOString(), modules: [], pinned: true }
    ]);
  }

  function getCurrentWorkspace() {
    return getWorkspaces().find(w => w.active) || getWorkspaces()[0];
  }

  function switchWorkspace(id) {
    const workspaces = getWorkspaces();
    workspaces.forEach(w => w.active = w.id === id);
    if (workspaces.find(w => w.id === id)) {
      workspaces.find(w => w.id === id).lastOpened = new Date().toISOString();
    }
    CrackItStorage.set('workspaces', workspaces);
    renderWorkspaceSwitcher();
    CrackItUI.toast(`Switched to workspace`, 'info');
  }

  function createWorkspace(name) {
    const workspaces = getWorkspaces();
    workspaces.forEach(w => w.active = false);
    workspaces.push({ id: uid('ws'), name, active: true, createdAt: new Date().toISOString(), lastOpened: new Date().toISOString(), modules: [], pinned: false });
    CrackItStorage.set('workspaces', workspaces);
    renderWorkspaceSwitcher();
    CrackItUI.toast(`Workspace "${name}" created`, 'success');
    return workspaces[workspaces.length - 1];
  }

  function saveSnapshot() {
    const snapshots = CrackItStorage.get('workspace_snapshots', []);
    snapshots.push({ id: uid('snap'), name: `Snapshot ${snapshots.length + 1} - ${new Date().toLocaleDateString()}`, createdAt: new Date().toISOString(), size: `1KB`, description: 'Manual workspace snapshot.' });
    CrackItStorage.set('workspace_snapshots', snapshots);
    CrackItUI.toast('Workspace snapshot saved', 'success');
  }

  function renderWorkspaceSwitcher() {
    const container = document.getElementById('workspace-switcher-wrap');
    if (!container) return;
    const ws = getCurrentWorkspace();
    container.innerHTML = `
      <div class="workspace-switcher" id="workspace-switcher-btn">
        <span data-ws-name>${escapeHtml(ws.name)}</span>
        <span style="font-size:10px">${icon('chevronRight')}</span>
      </div>
      <div class="workspace-dropdown" id="workspace-dropdown">
        ${getWorkspaces().map(w => `<button class="workspace-dd-item ${w.active ? 'active' : ''}" data-wsid="${w.id}">${escapeHtml(w.name)}${w.active ? ' ✓' : ''}</button>`).join('')}
        <div style="border-top:1px solid var(--border);margin:4px 0"></div>
        <button class="workspace-dd-item" data-action="new-workspace">+ New Workspace</button>
        <button class="workspace-dd-item" data-action="manage-workspaces">Manage Workspaces</button>
      </div>`;
    container.querySelector('#workspace-switcher-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('workspace-dropdown')?.classList.toggle('open');
    });
    container.querySelectorAll('.workspace-dd-item[data-wsid]').forEach(b => b.addEventListener('click', () => {
      switchWorkspace(b.dataset.wsid);
      document.getElementById('workspace-dropdown')?.classList.remove('open');
    }));
    container.querySelector('[data-action="new-workspace"]')?.addEventListener('click', () => {
      const name = prompt('Workspace name:');
      if (name && name.trim()) { createWorkspace(name.trim()); document.getElementById('workspace-dropdown')?.classList.remove('open'); }
    });
    document.addEventListener('click', () => document.getElementById('workspace-dropdown')?.classList.remove('open'));
  }

  /* ========== FLOATING ACTION BUTTON ========== */
  let fabOpen = false;

  function initFloatingButton(container) {
    const fabContainer = document.createElement('div');
    fabContainer.className = 'floating-action';
    fabContainer.id = 'floating-action';
    fabContainer.innerHTML = `
      <button class="fab-btn" id="fab-btn" aria-label="Quick Actions">+</button>
      <div class="fab-menu" id="fab-menu">
        ${[
          { label: 'New Project', icon: 'projects', action: 'new-project' },
          { label: 'Quick Scan', icon: 'scan', action: 'quick-scan' },
          { label: 'AI Chat', icon: 'chat', action: 'ai-chat' },
          { label: 'Open Terminal', icon: 'terminal', action: 'terminal' },
          { label: 'Create Report', icon: 'reports', action: 'reports' },
          { label: 'Upload Files', icon: 'upload', action: 'upload' },
          { label: 'New Note', icon: 'notes', action: 'new-note' },
        ].map(item => `<button class="fab-menu-item" data-action="${item.action}"><span class="fab-icon">${icon(item.icon)}</span>${item.label}</button>`).join('')}
      </div>`;
    (container || document.body).appendChild(fabContainer);
    document.getElementById('fab-btn')?.addEventListener('click', () => {
      fabOpen = !fabOpen;
      document.getElementById('fab-btn')?.classList.toggle('open', fabOpen);
      document.getElementById('fab-menu')?.classList.toggle('open', fabOpen);
    });
    document.getElementById('fab-menu')?.addEventListener('click', (e) => {
      const item = e.target.closest('.fab-menu-item');
      if (item) {
        fabOpen = false;
        document.getElementById('fab-btn')?.classList.remove('open');
        document.getElementById('fab-menu')?.classList.remove('open');
        handleFabAction(item.dataset.action);
      }
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.floating-action')) {
        fabOpen = false;
        document.getElementById('fab-btn')?.classList.remove('open');
        document.getElementById('fab-menu')?.classList.remove('open');
      }
    });
  }

  function handleFabAction(action) {
    switch (action) {
      case 'new-project': CrackItRouter.navigate('projects'); break;
      case 'quick-scan': CrackItRouter.navigate('scanner'); break;
      case 'ai-chat': CrackItRouter.navigate('chat'); break;
      case 'terminal': CrackItRouter.navigate('terminal'); break;
      case 'reports': CrackItRouter.navigate('reports'); break;
      case 'upload': CrackItUI.toast('Upload dialog opened', 'info'); break;
      case 'new-note': CrackItUI.toast('Open File Manager to create notes', 'info'); break;
    }
  }

  /* ========== COMMAND PALETTE ========== */
  let cpOpen = false;

  function initCommandPalette() {
    if (document.getElementById('command-palette-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'command-palette-overlay';
    overlay.id = 'command-palette-overlay';
    overlay.innerHTML = `
      <div class="command-palette-box">
        <div class="command-palette-input-wrap">
          <span style="color:var(--text-muted);display:flex">${icon('search')}</span>
          <input type="text" class="command-palette-input" id="cp-input" placeholder="Search pages, projects, files, commands..." autocomplete="off" spellcheck="false">
          <span style="font-size:10px;color:var(--text-muted);background:var(--bg-elevated);padding:2px 6px;border-radius:4px">ESC</span>
        </div>
        <div class="command-palette-results" id="cp-results">
          <div class="command-palette-empty" id="cp-empty">Type to search...</div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const input = document.getElementById('cp-input');
    input?.addEventListener('input', () => searchCommandPalette());
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCommandPalette();
      if (e.key === 'Enter') {
        const highlighted = document.querySelector('.command-palette-result.highlighted');
        if (highlighted) { selectCommandPalette(highlighted); }
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const results = document.querySelectorAll('.command-palette-result');
        if (!results.length) return;
        const idx = Array.from(results).findIndex(r => r.classList.contains('highlighted'));
        const next = e.key === 'ArrowDown' ? (idx + 1) % results.length : (idx - 1 + results.length) % results.length;
        results.forEach(r => r.classList.remove('highlighted'));
        results[next].classList.add('highlighted');
        results[next].scrollIntoView({ block: 'nearest' });
      }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCommandPalette(); });
  }

  function openCommandPalette() {
    const overlay = document.getElementById('command-palette-overlay');
    if (!overlay) initCommandPalette();
    setTimeout(() => {
      document.getElementById('command-palette-overlay')?.classList.add('open');
      document.getElementById('cp-input')?.focus();
      document.getElementById('cp-input').value = '';
      searchCommandPalette();
    }, 10);
    cpOpen = true;
  }

  function closeCommandPalette() {
    document.getElementById('command-palette-overlay')?.classList.remove('open');
    cpOpen = false;
  }

  function searchCommandPalette() {
    const q = (document.getElementById('cp-input')?.value || '').toLowerCase().trim();
    const resultsEl = document.getElementById('cp-results');
    const emptyEl = document.getElementById('cp-empty');
    if (!resultsEl) return;

    const pages = CrackItRouter.pages || {};
    const pageEntries = Object.entries(pages).map(([key, val]) => ({ type: 'page', label: val.title, id: key, icon: 'dashboard' }));
    const projects = CrackItStorage.getCollection('projects').map(p => ({ type: 'project', label: p.name, id: p.id, icon: 'projects' }));
    const files = CrackItStorage.getCollection('files').slice(0, 20).map(f => ({ type: 'file', label: f.name, id: f.id, icon: 'file' }));
    const conversations = CrackItStorage.getCollection('conversations').map(c => ({ type: 'ai', label: c.title, id: c.id, icon: 'chat' }));
    const reports = CrackItStorage.getCollection('reports').map(r => ({ type: 'report', label: r.title, id: r.id, icon: 'reports' }));
    const settings = [
      { type: 'command', label: 'Toggle Sidebar', icon: 'menu', action: 'toggleSidebar' },
      { type: 'command', label: 'Toggle Right Panel', icon: 'sliders', action: 'togglePanel' },
      { type: 'command', label: 'Open Terminal', icon: 'terminal', action: 'gotoTerminal' },
      { type: 'command', label: 'Toggle Dark Mode', icon: 'moon', action: 'toggleTheme' },
      { type: 'command', label: 'Open Settings', icon: 'settings', action: 'gotoSettings' },
      { type: 'command', label: 'Save Snapshot', icon: 'camera', action: 'saveSnapshot' },
      { type: 'command', label: 'Fullscreen', icon: 'maximize', action: 'fullscreen' },
      { type: 'command', label: 'New Project', icon: 'plus', action: 'newProject' },
    ];

    let all = [...pageEntries, ...projects, ...files, ...conversations, ...reports, ...settings];
    if (q) {
      all = all.filter(r => r.label.toLowerCase().includes(q));
    } else {
      all = all.slice(0, 8);
    }

    if (!all.length) {
      resultsEl.innerHTML = '<div class="command-palette-empty">No results found</div>';
      return;
    }

    resultsEl.innerHTML = all.map(r => `<div class="command-palette-result" data-type="${r.type}" data-id="${r.id || ''}" data-action="${r.action || ''}"><span class="cp-icon">${icon(r.icon)}</span><span class="cp-label">${escapeHtml(r.label)}</span><span class="cp-badge">${r.type}</span></div>`).join('');
    resultsEl.querySelectorAll('.command-palette-result').forEach(el => el.addEventListener('click', () => selectCommandPalette(el)));
    const first = resultsEl.querySelector('.command-palette-result');
    if (first) first.classList.add('highlighted');
  }

  function selectCommandPalette(el) {
    const type = el.dataset.type;
    const id = el.dataset.id;
    const action = el.dataset.action;
    closeCommandPalette();
    if (type === 'page') CrackItRouter.navigate(id);
    else if (type === 'project') CrackItRouter.navigate('projects');
    else if (type === 'file') CrackItRouter.navigate('files');
    else if (type === 'ai') CrackItRouter.navigate('chat');
    else if (type === 'report') CrackItRouter.navigate('reports');
    else if (action === 'toggleSidebar') { const s = document.getElementById('sidebar'); s?.classList.toggle('collapsed'); }
    else if (action === 'togglePanel') { document.getElementById('right-panel')?.classList.toggle('collapsed'); }
    else if (action === 'gotoTerminal') CrackItRouter.navigate('terminal');
    else if (action === 'gotoSettings') CrackItRouter.navigate('settings');
    else if (action === 'saveSnapshot') saveSnapshot();
    else if (action === 'fullscreen') document.documentElement.requestFullscreen?.();
    else if (action === 'newProject') CrackItRouter.navigate('projects');
    else if (action === 'toggleTheme') CrackItUI.toast('Theme toggled', 'info');
  }

  /* ========== TASK PANEL ========== */
  function openTaskPanel() {
    let overlay = document.getElementById('tasks-slide-overlay');
    if (!overlay) createTaskPanel();
    document.getElementById('tasks-slide-overlay')?.classList.remove('open');
    document.getElementById('tasks-slide-panel')?.classList.remove('open');
    setTimeout(() => {
      document.getElementById('tasks-slide-overlay')?.classList.add('open');
      document.getElementById('tasks-slide-panel')?.classList.add('open');
    }, 10);
  }

  function closeTaskPanel() {
    document.getElementById('tasks-slide-overlay')?.classList.remove('open');
    document.getElementById('tasks-slide-panel')?.classList.remove('open');
  }

  function createTaskPanel() {
    const overlay = document.createElement('div'); overlay.className = 'slide-overlay'; overlay.id = 'tasks-slide-overlay';
    const panel = document.createElement('div'); panel.className = 'slide-panel'; panel.id = 'tasks-slide-panel';
    overlay.addEventListener('click', () => closeTaskPanel());
    panel.innerHTML = `
      <div class="slide-panel-header"><h2>${icon('tasks')} Tasks & Jobs</h2><div class="slide-panel-actions"><button class="btn btn-ghost btn-sm" id="tasks-expand">${icon('externalLink')}</button><button class="btn btn-ghost btn-icon" id="tasks-close">${icon('close')}</button></div></div>
      <div class="slide-panel-body" id="tasks-panel-body"></div>`;
    document.body.appendChild(overlay); document.body.appendChild(panel);
    document.getElementById('tasks-expand')?.addEventListener('click', () => { closeTaskPanel(); CrackItRouter.navigate('settings'); });
    document.getElementById('tasks-close')?.addEventListener('click', closeTaskPanel);
    renderTasks();
  }

  function renderTasks() {
    const body = document.getElementById('tasks-panel-body');
    if (!body) return;
    const tasks = CrackItStorage.getCollection('tasks').slice(0, 20);
    const running = tasks.filter(t => t.status === 'in-progress');
    const completed = tasks.filter(t => t.status === 'done');
    const pending = tasks.filter(t => t.status === 'todo');
    body.innerHTML = `
      ${running.length ? `<div class="slide-panel-section"><div class="slide-panel-section-title">Running (${running.length})</div>${running.map(t => `<div class="task-item"><div class="task-status" style="background:var(--accent-green)"></div><span class="task-label">${escapeHtml(t.title)}</span><span class="task-meta">${t.progress || 0}%</span></div>`).join('')}</div>` : ''}
      ${pending.length ? `<div class="slide-panel-section"><div class="slide-panel-section-title">Pending (${pending.length})</div>${pending.map(t => `<div class="task-item"><div class="task-status" style="background:var(--accent-yellow)"></div><span class="task-label">${escapeHtml(t.title)}</span><span class="task-meta">${t.priority || ''}</span></div>`).join('')}</div>` : ''}
      ${completed.length ? `<div class="slide-panel-section"><div class="slide-panel-section-title">Completed (${completed.length})</div>${completed.slice(0,5).map(t => `<div class="task-item"><div class="task-status" style="background:var(--accent-green)"></div><span class="task-label">${escapeHtml(t.title)}</span></div>`).join('')}</div>` : ''}
      ${!running.length && !pending.length && !completed.length ? '<div class="empty-state"><p>No tasks yet</p></div>' : ''}`;
  }

  /* ========== NOTIFICATION PANEL ========== */
  function openNotifSlide() {
    let overlay = document.getElementById('notif-slide-overlay');
    if (!overlay) createNotifSlide();
    document.getElementById('notif-slide-overlay')?.classList.remove('open');
    document.getElementById('notif-slide-panel')?.classList.remove('open');
    setTimeout(() => {
      document.getElementById('notif-slide-overlay')?.classList.add('open');
      document.getElementById('notif-slide-panel')?.classList.add('open');
    }, 10);
  }

  function closeNotifSlide() {
    document.getElementById('notif-slide-overlay')?.classList.remove('open');
    document.getElementById('notif-slide-panel')?.classList.remove('open');
  }

  function createNotifSlide() {
    const overlay = document.createElement('div'); overlay.className = 'slide-overlay'; overlay.id = 'notif-slide-overlay';
    const panel = document.createElement('div'); panel.className = 'slide-panel'; panel.id = 'notif-slide-panel';
    overlay.addEventListener('click', () => closeNotifSlide());
    panel.innerHTML = `
      <div class="slide-panel-header"><h2>${icon('bell')} Notifications</h2><div class="slide-panel-actions"><button class="btn btn-ghost btn-sm" id="notif-mark-read">Mark All Read</button><button class="btn btn-ghost btn-icon" id="notif-close-sm">${icon('close')}</button></div></div>
      <div class="slide-panel-body" id="notif-panel-body"></div>`;
    document.body.appendChild(overlay); document.body.appendChild(panel);
    document.getElementById('notif-mark-read')?.addEventListener('click', () => {
      const notifs = CrackItStorage.getCollection('notifications');
      notifs.forEach(n => n.read = true);
      CrackItStorage.setCollection('notifications', notifs);
      renderNotifications();
      CrackItUI.toast('All notifications marked as read', 'success');
    });
    document.getElementById('notif-close-sm')?.addEventListener('click', closeNotifSlide);
    renderNotifications();
  }

  function renderNotifications() {
    const body = document.getElementById('notif-panel-body');
    if (!body) return;
    const notifs = CrackItStorage.getCollection('notifications').slice(0, 50);
    const today = notifs.filter(n => new Date(n.timestamp) > new Date(Date.now() - 86400000));
    const yesterday = notifs.filter(n => new Date(n.timestamp) > new Date(Date.now() - 172800000) && new Date(n.timestamp) <= new Date(Date.now() - 86400000));
    const earlier = notifs.filter(n => new Date(n.timestamp) <= new Date(Date.now() - 172800000));
    const dotColors = { system: 'var(--accent-blue)', security: 'var(--accent-red)', projects: 'var(--accent-green)', ai: 'var(--accent-purple)', tasks: 'var(--accent-yellow)' };
    function renderGroup(title, items) {
      if (!items.length) return '';
      return `<div class="slide-panel-section"><div class="slide-panel-section-title">${title} (${items.length})</div>${items.map(n => `<div class="notif-item"><div class="notif-dot" style="background:${dotColors[n.type] || 'var(--text-muted)'}"></div><div class="notif-content"><div class="notif-title">${escapeHtml(n.title)}</div><div class="notif-desc">${escapeHtml(n.message || '')}</div><div class="notif-time">${CrackItUtils.formatDate(n.timestamp, true)}</div></div></div>`).join('')}</div>`;
    }
    body.innerHTML = renderGroup('Today', today) + renderGroup('Yesterday', yesterday) + renderGroup('Earlier', earlier) || '<div class="empty-state"><p>No notifications</p></div>';
  }

  /* ========== SHORTCUTS MANAGER ========== */
  function getAllShortcuts() {
    return [
      { keys: 'Ctrl+K', desc: 'Command Palette' },
      { keys: 'Ctrl+Shift+F', desc: 'Global Search' },
      { keys: 'Ctrl+B', desc: 'Toggle Sidebar' },
      { keys: 'Ctrl+J', desc: 'Toggle Right Panel' },
      { keys: 'Ctrl+`', desc: 'Open Terminal' },
      { keys: 'Ctrl+1-5', desc: 'Navigate Pages' },
      { keys: 'Ctrl+,', desc: 'Settings' },
      { keys: 'Ctrl+P', desc: 'Projects' },
      { keys: 'Ctrl+Shift+N', desc: 'New Client' },
      { keys: 'Ctrl+Shift+R', desc: 'Reports' },
      { keys: 'Ctrl+Shift+C', desc: 'AI Chat' },
      { keys: 'Ctrl+N', desc: 'New Project' },
      { keys: 'Ctrl+W', desc: 'Close Tab' },
      { keys: 'Ctrl+Tab', desc: 'Switch Tab' },
      { keys: 'F1', desc: 'Help' },
      { keys: 'F2', desc: 'Rename' },
      { keys: 'Escape', desc: 'Close Dialogs' },
      { keys: 'Ctrl+Shift+A', desc: 'AI Workspace' },
      { keys: 'Ctrl+S', desc: 'Save' },
      { keys: 'Ctrl+Z', desc: 'Undo' },
      { keys: 'Ctrl+D', desc: 'Duplicate' },
      { keys: 'Ctrl+F', desc: 'Search' },
      { keys: 'Ctrl+H', desc: 'Go to Dashboard' },
      { keys: 'Ctrl+Shift+Space', desc: 'Quick Create' },
    ];
  }

  function renderShortcutsTable() {
    const shortcuts = getAllShortcuts();
    return `<div class="shortcuts-grid">${shortcuts.map(s => `<div class="shortcut-row"><span>${escapeHtml(s.desc)}</span><kbd>${s.keys}</kbd></div>`).join('')}</div>`;
  }

  /* ========== PAGE LOADER ========== */
  function showPageLoader(container, text = 'Loading...') {
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = `
      <div class="page-loader-ring">
        ${Array.from({length:8}, (_,i) => `<div class="loader-dot" style="--i:${i};--angle:${i*45}deg"></div>`).join('')}
      </div>
      <div class="page-loader-text" style="margin-top:60px">${text}</div>`;
    container.appendChild(loader);
    return loader;
  }

  function hidePageLoader(loader) {
    if (loader) { loader.classList.add('page-loader-exit'); setTimeout(() => loader.remove(), 400); }
  }

  /* ========== AI FLOATING BUTTON ========== */
  function initAIFloatingButton() {
    if (document.getElementById('ai-float-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'ai-float-btn';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><circle cx="12" cy="10" r="1"/><circle cx="16" cy="10" r="1"/><circle cx="8" cy="10" r="1"/></svg>';
    btn.title = 'AI Assistant';
    btn.style.cssText = 'position:fixed;bottom:80px;right:20px;width:44px;height:44px;border-radius:50%;background:var(--gradient-accent);border:none;color:#fff;cursor:pointer;z-index:999;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(59,130,246,0.4);transition:transform 0.2s';
    btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.1)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
    btn.addEventListener('click', () => {
      let panel = document.getElementById('ai-slide-panel');
      if (!panel) createAISlidePanel();
      document.getElementById('ai-slide-overlay')?.classList.add('open');
      document.getElementById('ai-slide-panel')?.classList.add('open');
    });
    document.body.appendChild(btn);
  }

  function createAISlidePanel() {
    const overlay = document.createElement('div'); overlay.className = 'slide-overlay'; overlay.id = 'ai-slide-overlay';
    overlay.addEventListener('click', () => { document.getElementById('ai-slide-overlay')?.classList.remove('open'); document.getElementById('ai-slide-panel')?.classList.remove('open'); });
    const panel = document.createElement('div'); panel.className = 'slide-panel'; panel.id = 'ai-slide-panel';
    panel.style.width = '420px';
    panel.innerHTML = `
      <div class="slide-panel-header"><h2>${icon('chat')} AI Assistant</h2><div class="slide-panel-actions"><button class="btn btn-ghost btn-sm" data-action="export-chat">${icon('upload')} Export</button><button class="btn btn-ghost btn-icon" id="ai-slide-close">${icon('close')}</button></div></div>
      <div class="slide-panel-body" style="display:flex;flex-direction:column;height:100%">
        <div style="margin-bottom:12px">
          <select class="input" style="width:100%;font-size:12px;padding:8px;margin-bottom:8px">
            <option>CrackIt Intelligence</option>
            <option>Security Analyst</option>
            <option>Code Auditor</option>
            <option>Threat Researcher</option>
            <option>Bug Hunter</option>
            <option>Compliance Expert</option>
          </select>
          <textarea class="input" rows="3" placeholder="Ask AI anything about your security workspace..." style="width:100%;resize:none;font-size:12px;padding:10px;min-height:60px" id="ai-prompt-input"></textarea>
          <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
            ${['Analyze','Explain','Summarize','Review','Generate Report','Suggest Improvements'].map(a => `<button class="btn btn-sm btn-ghost ai-quick-btn" style="font-size:10px;padding:4px 10px">${a}</button>`).join('')}
          </div>
          <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
            <button class="btn btn-sm btn-secondary ai-attach-btn" data-action="attach-files">${icon('paperclip')} Files</button>
            <button class="btn btn-sm btn-secondary ai-attach-btn" data-action="attach-code">${icon('code')} Code</button>
            <button class="btn btn-sm btn-secondary ai-attach-btn" data-action="attach-logs">${icon('terminal')} Logs</button>
            <button class="btn btn-sm btn-secondary ai-attach-btn" data-action="attach-project">${icon('projects')} Project</button>
          </div>
        </div>
        <div style="flex:1;overflow-y:auto" id="ai-chat-messages">
          <div class="empty-state" style="padding:20px"><div class="empty-state-icon" style="font-size:24px">${icon('chat')}</div><p style="font-size:12px">Start a conversation with AI</p></div>
        </div>
        <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px">
          <button class="btn btn-primary" style="width:100%" id="ai-send-btn">${icon('send')} Send Message</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    document.getElementById('ai-slide-close')?.addEventListener('click', () => { document.getElementById('ai-slide-overlay')?.classList.remove('open'); document.getElementById('ai-slide-panel')?.classList.remove('open'); });
    document.getElementById('ai-send-btn')?.addEventListener('click', async () => {
      const input = document.getElementById('ai-prompt-input');
      if (input && input.value.trim()) {
        const msgs = document.getElementById('ai-chat-messages');
        const userMsg = input.value.trim();
        msgs.innerHTML = `<div class="chat-message user" style="margin-bottom:12px"><div class="chat-message-avatar" style="width:28px;height:28px;background:var(--gradient-accent);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px">U</div><div class="chat-message-content" style="padding:8px 12px;font-size:12px">${CrackItUtils.escapeHtml(userMsg)}</div></div>
          <div class="chat-message assistant" style="margin-bottom:12px"><div class="chat-message-avatar" style="width:28px;height:28px;background:var(--bg-elevated);color:var(--accent-cyan);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px">AI</div><div class="chat-message-content" style="padding:8px 12px;font-size:12px"><span class="typing-dots"><span></span><span></span><span></span></span></div></div>`;
        let response = 'AI service is not available. Please check the backend configuration.';
        if (CrackItAPI.isAuthenticated()) {
          try {
            const result = await CrackItAPI.ai.explain({ prompt: userMsg, context: userMsg });
            response = result.response || result.analysis || result.result || JSON.stringify(result);
          } catch (err) {
            response = 'AI service unavailable: ' + err.message;
          }
        } else {
          response = 'Sign in to use AI features.';
        }
        msgs.innerHTML = `<div class="chat-message user" style="margin-bottom:12px"><div class="chat-message-avatar" style="width:28px;height:28px;background:var(--gradient-accent);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px">U</div><div class="chat-message-content" style="padding:8px 12px;font-size:12px">${CrackItUtils.escapeHtml(userMsg)}</div></div>
            <div class="chat-message assistant" style="margin-bottom:12px"><div class="chat-message-avatar" style="width:28px;height:28px;background:var(--bg-elevated);color:var(--accent-cyan);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px">AI</div><div class="chat-message-content" style="padding:8px 12px;font-size:12px">${CrackItUtils.escapeHtml(response)}</div></div>`;
        input.value = '';
      }
    });
    document.querySelectorAll('.ai-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('ai-prompt-input');
        if (input) { input.value = btn.textContent.trim() + ' the current context'; input.focus(); }
      });
    });
  }

  /* ========== AI ASSISTANT PANEL ========== */
  function renderAIAssistant() {
    return `
      <div class="card ai-assistant-panel">
        <div class="card-header"><span class="card-title">${icon('chat')} AI Assistant</span></div>
        <div class="card-body">
          <div style="margin-bottom:12px">
            <select class="input" style="width:100%;font-size:12px;padding:6px 8px;margin-bottom:8px">
              <option>CrackIt Intelligence</option>
              <option>Security Analyst</option>
              <option>Code Auditor</option>
              <option>Threat Researcher</option>
            </select>
            <textarea class="input" rows="2" placeholder="Ask AI about this module..." style="width:100%;resize:none;font-size:12px;padding:8px;min-height:50px"></textarea>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
            ${['Analyze','Explain','Summarize','Review','Generate Report','Suggest Improvements'].map(a => `<button class="btn btn-sm btn-ghost" style="font-size:10px;padding:4px 8px">${a}</button>`).join('')}
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <div class="ai-assistant-quick" data-action="attach-files" style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:4px;cursor:pointer;font-size:11px;color:var(--text-muted)">${icon('paperclip')} Attach Files</div>
            <div class="ai-assistant-quick" data-action="attach-code" style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:4px;cursor:pointer;font-size:11px;color:var(--text-muted)">${icon('code')} Attach Code</div>
            <div class="ai-assistant-quick" data-action="attach-logs" style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:4px;cursor:pointer;font-size:11px;color:var(--text-muted)">${icon('terminal')} Attach Logs</div>
            <div class="ai-assistant-quick" data-action="attach-project" style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:4px;cursor:pointer;font-size:11px;color:var(--text-muted)">${icon('projects')} Attach Current Project</div>
          </div>
          <div style="margin-top:10px;border-top:1px solid var(--border);padding-top:8px">
            <div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:6px">Recent Chats</div>
            <div class="ai-assistant-quick" style="padding:5px 6px;font-size:11px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:6px"><span style="width:4px;height:4px;border-radius:50%;background:var(--accent-green);flex-shrink:0"></span> Security analysis of web app</div>
            <div class="ai-assistant-quick" style="padding:5px 6px;font-size:11px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:6px"><span style="width:4px;height:4px;border-radius:50%;background:var(--accent-green);flex-shrink:0"></span> API vulnerability review</div>
            <div class="ai-assistant-quick" style="padding:5px 6px;font-size:11px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:6px"><span style="width:4px;height:4px;border-radius:50%;background:var(--text-muted);flex-shrink:0"></span> Code audit results summary</div>
          </div>
        </div>
      </div>`;
  }

  /* ========== QUICK LAUNCHER ========== */
  let qlOpen = false;

  function initQuickLauncher() {
    if (document.getElementById('quick-launcher')) return;
    const el = document.createElement('div');
    el.id = 'quick-launcher';
    el.className = 'quick-launcher';
    el.innerHTML = `
      <div class="quick-launcher-header">
        <span style="display:flex">${icon('search')}</span>
        <input type="text" class="quick-launcher-input" id="ql-input" placeholder="Quick launch — type to search recent items..." autocomplete="off" spellcheck="false">
        <span style="font-size:10px;color:var(--text-muted)">Ctrl+Space</span>
      </div>
      <div class="quick-launcher-body" id="ql-body">
        <div class="ql-section"><div class="ql-section-title">Recent</div><div id="ql-recent"></div></div>
        <div class="ql-section"><div class="ql-section-title">Favorites</div><div id="ql-favorites"></div></div>
      </div>`;
    document.body.appendChild(el);
    document.getElementById('ql-input')?.addEventListener('input', () => searchQuickLauncher());
    document.getElementById('ql-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeQuickLauncher();
    });
    el.addEventListener('click', (e) => { if (e.target === el) closeQuickLauncher(); });
  }

  function openQuickLauncher() {
    initQuickLauncher();
    document.getElementById('quick-launcher')?.classList.add('open');
    document.getElementById('ql-input')?.focus();
    document.getElementById('ql-input').value = '';
    searchQuickLauncher();
    qlOpen = true;
  }

  function closeQuickLauncher() {
    document.getElementById('quick-launcher')?.classList.remove('open');
    qlOpen = false;
  }

  function searchQuickLauncher() {
    const q = (document.getElementById('ql-input')?.value || '').toLowerCase().trim();
    const recent = CrackItStorage.uiState.get().recentItems || [];
    renderQLSection('ql-recent', q ? recent.filter(r => r.title.toLowerCase().includes(q)) : recent.slice(0, 8), 'page');
    const favorites = CrackItStorage.get('favorites', []);
    renderQLSection('ql-favorites', q ? favorites.filter(f => f.title.toLowerCase().includes(q)) : favorites, 'favorite');
  }

  function renderQLSection(containerId, items, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!items.length) { container.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:8px">No items</div>'; return; }
    container.innerHTML = items.map(item => `
      <div class="ql-item" data-type="${type}" data-page="${item.page || ''}" data-title="${escapeHtml(item.title)}">
        <span style="display:flex;flex-shrink:0">${icon(item.icon || 'dashboard')}</span>
        <span style="font-size:12px">${escapeHtml(item.title)}</span>
        <span style="font-size:10px;color:var(--text-muted);margin-left:auto">${item.timestamp ? formatDate(item.timestamp, true) : ''}</span>
      </div>`).join('');
    container.querySelectorAll('.ql-item').forEach(el => {
      el.addEventListener('click', () => {
        const page = el.dataset.page;
        if (page) CrackItRouter.navigate(page);
        closeQuickLauncher();
      });
    });
  }

  /* ========== STICKY NOTES / SCRATCH PAD ========== */
  function initScratchPad() {
    if (document.getElementById('scratch-pad')) return;
    const pad = document.createElement('div');
    pad.id = 'scratch-pad';
    pad.style.cssText = 'display:none;position:fixed;bottom:44px;right:80px;width:280px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.3);z-index:999';
    pad.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--border)">
        <span style="font-size:11px;font-weight:600">${icon('edit')} Scratch Pad</span>
        <button class="btn btn-ghost btn-icon" id="scratch-close" style="width:24px;height:24px">${icon('close')}</button>
      </div>
      <textarea id="scratch-text" style="width:100%;min-height:150px;border:none;background:transparent;padding:12px;font-size:12px;resize:vertical;color:var(--text-primary);font-family:inherit" placeholder="Write anything... auto-saved"></textarea>
      <div style="padding:4px 12px;font-size:9px;color:var(--text-muted);border-top:1px solid var(--border)" id="scratch-status">Auto-saved</div>`;
    document.body.appendChild(pad);
    document.getElementById('scratch-close')?.addEventListener('click', () => { pad.style.display = 'none'; });
    const textarea = document.getElementById('scratch-text');
    textarea?.addEventListener('input', CrackItUtils.debounce(() => {
      CrackItStorage.set('scratch_pad', textarea.value);
      document.getElementById('scratch-status').textContent = 'Saved ' + new Date().toLocaleTimeString();
    }, 500));
    const saved = CrackItStorage.get('scratch_pad', '');
    if (textarea && saved) textarea.value = saved;
  }

  /* ========== INIT ========== */
  let initialized = false;

  function init() {
    if (initialized) return;
    initCommandPalette();
    initialized = true;
  }

  function start() {
    return showSplash();
  }

  return {
    init, start, hideSplash, openCommandPalette, closeCommandPalette,
    openTaskPanel, closeTaskPanel, openNotifSlide, closeNotifSlide,
    renderWorkspaceSwitcher, renderTasks, renderNotifications,
    saveSnapshot, createWorkspace, switchWorkspace, getWorkspaces, getCurrentWorkspace,
    renderShortcutsTable, getAllShortcuts,
    showPageLoader, hidePageLoader, initFloatingButton, initAIFloatingButton, renderAIAssistant,
    openQuickLauncher, closeQuickLauncher, initScratchPad,
    get isOpen() { return cpOpen; },
    get qlIsOpen() { return qlOpen; }
  };
})();
