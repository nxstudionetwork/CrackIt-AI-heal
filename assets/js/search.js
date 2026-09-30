/**
 * CrackIt — Universal Spotlight Search (Ctrl+K)
 * Merges search + command palette into a single unified dialog
 */

const CrackItSearch = (() => {
  'use strict';

  const { escapeHtml, debounce, $, $$, icons } = CrackItUtils;
  let searchOverlay = null;
  let activeIndex = 0;
  let currentResults = [];
  let currentFilter = 'all';
  let recentSearches = [];

  const ACTION_KEYWORDS = [
    { triggers: ['new project', 'create project'], label: 'New Project', icon: 'plus', action: 'create', type: 'action' },
    { triggers: ['new client', 'create client'], label: 'New Client', icon: 'plus', action: 'create', type: 'action' },
    { triggers: ['new report', 'create report'], label: 'New Report', icon: 'plus', action: 'create', type: 'action' },
    { triggers: ['open terminal', 'launch terminal'], label: 'Open Terminal', icon: 'terminal', action: 'navigate', target: 'terminal', type: 'action' },
    { triggers: ['new chat', 'ai chat', 'ai workspace', 'open ai'], label: 'Open AI Workspace', icon: 'chat', action: 'navigate', target: 'chat', type: 'action' },
  ];

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'projects', label: 'Projects' },
    { key: 'clients', label: 'Clients' },
    { key: 'files', label: 'Files' },
    { key: 'reports', label: 'Reports' },
    { key: 'knowledge', label: 'Knowledge' },
    { key: 'commands', label: 'Commands' },
  ];

  const CATEGORY_META = {
    projects: { label: 'Projects', icon: 'projects' },
    clients: { label: 'Clients', icon: 'folder' },
    files: { label: 'Files', icon: 'files' },
    reports: { label: 'Reports', icon: 'reports' },
    knowledge: { label: 'Knowledge', icon: 'knowledge' },
    conversations: { label: 'Conversations', icon: 'chat' },
    workflows: { label: 'Workflows', icon: 'automation' },
    commands: { label: 'Commands', icon: 'terminal' },
    templates: { label: 'Templates', icon: 'extensions' },
    notes: { label: 'Notes', icon: 'knowledge' },
    findings: { label: 'Findings', icon: 'target' },
    evidence: { label: 'Evidence', icon: 'files' },
    activity: { label: 'Activity', icon: 'clock' },
    actions: { label: 'Actions', icon: 'plus' },
    recent: { label: 'Recent', icon: 'clock' },
  };

  function init() {
    searchOverlay = $('#modal-search');
    if (!searchOverlay) return;

    enhanceOverlay();
    setupEventListeners();
    document.addEventListener('keydown', handleGlobalKeydown);
    recentSearches = CrackItStorage.get('recentSearches', []);
  }

  function enhanceOverlay() {
    const filtersContainer = searchOverlay.querySelector('.search-filters');
    if (filtersContainer) {
      filtersContainer.innerHTML = FILTERS.map(f =>
        `<button class="search-filter-chip${f.key === 'all' ? ' active' : ''}" data-filter="${f.key}">${f.label}</button>`
      ).join('');
    }

    const input = $('#search-input');
  }

  function setupEventListeners() {
    document.querySelector('[data-action="search"]')?.addEventListener('click', open);

    $('#search-input')?.addEventListener('input', debounce(handleSearch, 200));
    searchOverlay?.addEventListener('keydown', handleSearchKeydown);

    searchOverlay?.addEventListener('click', (e) => {
      if (e.target === searchOverlay) close();
    });

    searchOverlay?.querySelector('#search-close-btn')?.addEventListener('click', close);

    $$('.search-filter-chip', searchOverlay).forEach(chip => {
      chip.addEventListener('click', () => {
        $$('.search-filter-chip', searchOverlay).forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.dataset.filter;
        const input = $('#search-input');
        if (input && input.value.trim()) {
          handleSearch({ target: input });
        } else {
          renderView();
        }
      });
    });

    searchOverlay?.querySelector('.search-dialog')?.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  function handleGlobalKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      e.stopPropagation();
      if (searchOverlay?.classList.contains('open')) {
        close();
      } else {
        open();
      }
    }
  }

  function open() {
    searchOverlay?.classList.add('open');
    activeIndex = 0;
    currentFilter = 'all';
    const input = $('#search-input');
    if (input) { input.value = ''; input.focus(); }
    resetFilterChips();
    renderView();
  }

  function close() {
    searchOverlay?.classList.remove('open');
  }

  function resetFilterChips() {
    $$('.search-filter-chip', searchOverlay).forEach(c => {
      c.classList.toggle('active', c.dataset.filter === 'all');
    });
  }

  function renderView() {
    const input = $('#search-input');
    const query = input ? input.value.trim().toLowerCase() : '';
    if (!query) {
      renderRecentAndCommandsView();
    } else {
      handleSearch({ target: input });
    }
  }

  function renderRecentAndCommandsView() {
    const container = $('#search-results');
    if (!container) return;

    const groups = [];

    const recentItems = getRecentItems();
    if (recentItems.length) {
      groups.push({ key: 'recent', items: recentItems.slice(0, 5) });
    }

    if (recentSearches.length) {
      groups.push({
        key: 'actions',
        label: 'Recent Searches',
        items: recentSearches.slice(0, 5).map((s, i) => ({
          type: 'action', title: s, id: 'rs_' + i, icon: 'search',
          action: 'search', query: s
        }))
      });
    }

    const commands = CrackItStorage.getCollection('commands').slice(0, 6);
    if (commands.length) {
      groups.push({ key: 'commands', items: commands.map(c => ({
        type: 'command', title: c.label, subtitle: c.shortcut || '', id: c.id, command: c, icon: c.icon || 'terminal'
      }))});
    }

    renderGroupedResults(groups);
  }

  function getRecentItems() {
    const recent = CrackItStorage.uiState.get().recentItems || [];
    return recent.map(r => ({ ...r, type: 'recent', icon: 'clock' }));
  }

  function handleSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      renderRecentAndCommandsView();
      return;
    }

    saveRecentSearch(query);

    const actionResults = getActionResults(query);
    const grouped = {};

    const categorySearches = [
      { key: 'projects', filter: ['all', 'projects'], collection: 'projects',
        match: (item, q) => (item.name || '').toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q),
        map: item => ({ type: 'project', title: item.name, subtitle: item.status, id: item.id, page: 'projects', icon: 'projects' }) },
      { key: 'clients', filter: ['all', 'clients'], collection: 'clients',
        match: (item, q) => (item.name || '').toLowerCase().includes(q) || (item.industry || '').toLowerCase().includes(q) || (item.email || '').toLowerCase().includes(q) || (item.company || '').toLowerCase().includes(q) || (item.phone || '').toLowerCase().includes(q) || (item.address || '').toLowerCase().includes(q),
        map: item => ({ type: 'client', title: item.name, subtitle: item.industry || '', id: item.id, page: 'clients', icon: 'folder' }) },
      { key: 'files', filter: ['all', 'files'], collection: 'files',
        match: (item, q) => (item.name || '').toLowerCase().includes(q),
        map: item => ({ type: 'file', title: item.name, subtitle: item.folder, id: item.id, page: 'files', icon: 'files' }) },
      { key: 'reports', filter: ['all', 'reports'], collection: 'reports',
        match: (item, q) => (item.title || '').toLowerCase().includes(q) || (item.summary || '').toLowerCase().includes(q),
        map: item => ({ type: 'report', title: item.title, subtitle: item.severity, id: item.id, page: 'reports', icon: 'reports' }) },
      { key: 'knowledge', filter: ['all', 'knowledge'], collection: 'notes',
        match: (item, q) => (item.title || '').toLowerCase().includes(q) || (item.content || '').toLowerCase().includes(q),
        map: item => ({ type: 'knowledge', title: item.title, subtitle: item.folder, id: item.id, page: 'notes', icon: 'knowledge' }) },
      { key: 'conversations', filter: ['all'], collection: 'conversations',
        match: (item, q) => (item.title || '').toLowerCase().includes(q),
        map: item => ({ type: 'conversation', title: item.title, subtitle: item.messages?.length + ' messages' || '', id: item.id, page: 'chat', icon: 'chat' }) },
      { key: 'workflows', filter: ['all'], collection: 'workflows',
        match: (item, q) => (item.name || '').toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q),
        map: item => ({ type: 'workflow', title: item.name, subtitle: item.status, id: item.id, page: 'automation', icon: 'automation' }) },
      { key: 'templates', filter: ['all'], collection: 'templates',
        match: (item, q) => (item.name || '').toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q),
        map: item => ({ type: 'template', title: item.name, subtitle: item.category || '', id: item.id, icon: 'extensions' }) },
      { key: 'notes', filter: ['all', 'knowledge'], collection: 'notes',
        match: (item, q) => (item.title || '').toLowerCase().includes(q) || (item.content || '').toLowerCase().includes(q),
        map: item => ({ type: 'note', title: item.title, subtitle: item.folder || 'general', id: item.id, icon: 'knowledge' }) },
      { key: 'findings', filter: ['all'], collection: 'findings',
        match: (item, q) => (item.title || '').toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q) || (item.cve || '').toLowerCase().includes(q) || (item.recommendation || '').toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q),
        map: item => ({ type: 'finding', title: item.title, subtitle: item.severity + (item.cve ? ' \u00B7 ' + item.cve : ''), id: item.id, icon: 'target' }) },
      { key: 'commands', filter: ['all', 'commands'], collection: 'commands',
        match: (item, q) => (item.label || '').toLowerCase().includes(q),
        map: item => ({ type: 'command', title: item.label, subtitle: item.shortcut || '', id: item.id, command: item, icon: item.icon || 'terminal' }) },
      { key: 'evidence', filter: ['all'], collection: 'evidence',
        match: (item, q) => (item.title || '').toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q),
        map: item => ({ type: 'evidence', title: item.title, subtitle: item.type || 'evidence', id: item.id, page: 'vault', icon: 'files' }) },
      { key: 'activity', filter: ['all'], collection: 'activity',
        match: (item, q) => (item.action || '').toLowerCase().includes(q) || (item.detail || '').toLowerCase().includes(q),
        map: item => ({ type: 'activity', title: item.action, subtitle: new Date(item.timestamp).toLocaleDateString(), id: item.id, icon: 'clock' }) },
    ];

    categorySearches.forEach(cs => {
      if (!cs.filter.includes(currentFilter)) return;
      const items = CrackItStorage.getCollection(cs.collection)
        .filter(item => cs.match(item, query))
        .slice(0, 6)
        .map(cs.map);
      if (items.length) {
        grouped[cs.key] = items;
      }
    });

    if (actionResults.length) {
      grouped.actions = actionResults;
    }

    const groupArray = Object.entries(grouped).map(([key, items]) => ({ key, items }));
    renderGroupedResults(groupArray);
  }

  function getActionResults(query) {
    return ACTION_KEYWORDS
      .filter(ak => ak.triggers.some(t => t.includes(query)))
      .slice(0, 5)
      .map(ak => ({
        type: 'action', title: ak.label, subtitle: ak.triggers[0], icon: ak.icon,
        action: ak.action, target: ak.target || null
      }));
  }

  function saveRecentSearch(query) {
    if (!query || query.length < 2) return;
    recentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    CrackItStorage.set('recentSearches', recentSearches);
  }

  function renderGroupedResults(groups) {
    const container = $('#search-results');
    if (!container) return;

    currentResults = [];
    activeIndex = 0;

    if (!groups.length || groups.every(g => !g.items.length)) {
      container.innerHTML = '<div class="empty-state" style="padding:32px"><div class="empty-state-icon" style="margin-bottom:8px;opacity:0.4">' + icons.search + '</div><p>No results found</p></div>';
      return;
    }

    let globalIndex = 0;
    let html = '';

    groups.forEach(group => {
      if (!group.items || !group.items.length) return;

      const meta = CATEGORY_META[group.key] || { label: group.key, icon: 'search' };
      const iconSvg = icons[meta.icon] || icons.search;

      html += `<div class="search-group-label"><span class="search-group-icon">${iconSvg}</span><span>${meta.label}</span><span class="search-category-count">${group.items.length}</span></div>`;

      group.items.forEach(item => {
        const resultObj = { ...item, _group: group.key };
        currentResults.push(resultObj);

        const itemIcon = icons[item.icon] || icons.search;
        const shortcutHint = item.subtitle && (item.type === 'command') ? item.subtitle : '';

        html += `
          <div class="search-result-item ${globalIndex === 0 ? 'active' : ''}" data-index="${globalIndex}">
            <div class="search-result-icon">${itemIcon}</div>
            <div class="flex-1">
              <div class="search-result-title">${escapeHtml(item.title)}</div>
              <div class="search-result-type">${escapeHtml(item.subtitle || meta.label)}</div>
            </div>
            ${shortcutHint ? `<span class="search-shortcut">${escapeHtml(shortcutHint)}</span>` : ''}
          </div>`;
        globalIndex++;
      });
    });

    container.innerHTML = html;

    container.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index);
        selectSearchResult(idx);
      });
    });

    container.querySelectorAll('.command-group-label').forEach(el => {
      el.addEventListener('click', (e) => e.stopPropagation());
    });
  }

  function selectSearchResult(index) {
    const result = currentResults[index];
    if (!result) return;

    close();

    if (result.action === 'search' && result.query) {
      open();
      const input = $('#search-input');
      if (input) {
        input.value = result.query;
        handleSearch({ target: input });
      }
      return;
    }

    if (result.action === 'create') {
      const target = result.target || 'project';
      const targetField = target.charAt(0).toUpperCase() + target.slice(1);
      CrackItUI.toast(`Creating new ${target}...`, 'info', 2000);
      const modal = CrackItUI.openModal ? CrackItUI.openModal('confirm', {
        title: `New ${targetField}`,
        content: `<p>New ${target} creation form will appear here.</p>`
      }) : null;
      return;
    }

    if (result.action === 'navigate' && result.target) {
      CrackItRouter.navigate(result.target);
      CrackItUI.toast(`Opened ${result.title}`, 'success');
      return;
    }

    if (result.command) {
      executeCommand(result.command);
      return;
    }

    if (result.page) {
      CrackItRouter.navigate(result.page);
      CrackItUI.toast(`Opened ${result.title}`, 'success');
    }
  }

  function executeCommand(cmd) {
    if (!cmd) return;

    switch (cmd.action) {
      case 'navigate':
        CrackItRouter.navigate(cmd.target);
        break;
      case 'toggle':
        if (cmd.target === 'sidebar') CrackItNavigation.toggleSidebar();
        else if (cmd.target === 'rightPanel') CrackItRightPanel.toggle();
        break;
      case 'modal':
        if (cmd.target === 'search') open();
        else if (cmd.target === 'new-project') {
          CrackItUI.toast('New Project dialog coming soon', 'info');
        } else if (cmd.target === 'new-note') {
          CrackItUI.toast('New Note dialog coming soon', 'info');
        } else {
          CrackItUI.toast(`${cmd.label} \u2014 coming soon`, 'info');
        }
        break;
      case 'toast':
        CrackItUI.toast(cmd.target, 'success');
        break;
      case 'create':
        CrackItUI.toast(`Creating ${cmd.target || 'item'}...`, 'info', 2000);
        break;
      default:
        CrackItUI.toast(cmd.label || 'Action executed', 'info');
    }
  }

  function handleSearchKeydown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const items = $$('.search-result-item', searchOverlay);
      if (items.length && items[activeIndex]) {
        selectSearchResult(parseInt(items[activeIndex].dataset.index));
      }
    }
    else if (e.key === 'Escape') close();
  }

  function moveSelection(delta) {
    const items = $$('.search-result-item', searchOverlay);
    if (!items.length) return;

    items[activeIndex]?.classList.remove('active');
    activeIndex = (activeIndex + delta + items.length) % items.length;
    items[activeIndex]?.classList.add('active');
    items[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }

  return { init, open, close };
})();
