/**
 * CrackIt — Knowledge Base Module
 */

const CrackItKnowledge = (() => {
  'use strict';

  const { escapeHtml, formatDate, markdownToHtml, icon, uid } = CrackItUtils;
  const CATEGORIES = ['Research', 'Operations', 'Templates', 'Reports', 'Personal'];
  let selectedPage = null;
  let filterCategory = '';

  async function render(container) {
    const pages = CrackItStorage.getCollection('notes')
      .map(n => ({ ...n, category: n.folder || 'Personal' }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content">
          <h1>Knowledge Base</h1>
          <p>${pages.length} articles · Cybersecurity knowledge management</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" data-action="refresh"><span class="icon">${CrackItUtils.icons.refresh}</span> Refresh</button>
          <button class="btn btn-primary" data-action="new-page"><span class="icon">${CrackItUtils.icons.plus}</span> New Page</button>
        </div>
      </div>

      <div class="filter-bar">
        <div class="input-group" style="position:relative;flex:1;max-width:360px">
          <span class="icon" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted)">${CrackItUtils.icons.search}</span>
          <input type="text" class="input" id="knowledge-search" placeholder="Search knowledge base..." style="padding-left:36px">
        </div>
        <div class="flex gap-2 flex-wrap">
          <button class="btn btn-ghost btn-sm category-filter ${!filterCategory ? 'active' : ''}" data-category="">All</button>
          ${CATEGORIES.map(c => `
            <button class="btn btn-ghost btn-sm category-filter ${filterCategory === c ? 'active' : ''}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>
          `).join('')}
        </div>
      </div>

      <div id="knowledge-grid" class="project-grid">
        ${renderGrid(pages, '')}
      </div>`;

    bindEvents(container, pages);
  }

  function renderGrid(pages, query) {
    const q = query.toLowerCase().trim();
    const filtered = pages.filter(p => {
      if (filterCategory && p.category !== filterCategory) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.tags.some(t => t.toLowerCase().includes(q)) && !(p.content || '').toLowerCase().includes(q)) return false;
      return true;
    });

    if (!filtered.length) {
      return `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">${CrackItUtils.icons.knowledge}</div>
          <h3>No knowledge pages found</h3>
          <p>${q ? 'No results match your search query.' : 'No pages in this category yet. Create a new knowledge page to get started.'}</p>
          <button class="btn btn-primary mt-4" data-action="new-page">Create New Page</button>
        </div>`;
    }

    return filtered.map(p => `
      <div class="card knowledge-card cursor-pointer" data-page-id="${escapeHtml(p.id)}">
        <div class="card-body">
          <div class="flex items-center gap-3 mb-3">
            <div class="list-item-icon">${CrackItUtils.icons.folder}</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold truncate">${escapeHtml(p.title)}</div>
              <div class="text-xs text-muted">${formatDate(p.updatedAt)}</div>
            </div>
          </div>
          <div class="flex gap-2 items-center mb-2">
            <span class="badge badge-blue">${escapeHtml(p.category)}</span>
            ${p.tags && p.tags.length ? `<span class="text-xs text-muted">${p.tags.length} tag${p.tags.length > 1 ? 's' : ''}</span>` : ''}
            <span class="text-xs text-muted ml-auto">${p.wordCount || 0} words</span>
          </div>
          ${p.tags && p.tags.length ? `
          <div class="flex gap-1 flex-wrap mb-3">
            ${p.tags.slice(0, 3).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
            ${p.tags.length > 3 ? `<span class="text-xs text-muted">+${p.tags.length - 3}</span>` : ''}
          </div>` : ''}
        </div>
        <div class="card-footer flex justify-between items-center">
          <span class="text-xs text-muted">Updated ${formatDate(p.updatedAt, true)}</span>
          <button class="btn btn-ghost btn-sm ai-ask-btn" data-page-id="${escapeHtml(p.id)}" title="Ask AI about this page">
            <span class="icon">${CrackItUtils.icons.ai}</span> Ask AI
          </button>
        </div>
      </div>
    `).join('');
  }

  let isEditing = false;

  function renderDetail(page) {
    if (isEditing) return renderEditor(page);
    return `
      <button class="btn btn-ghost btn-sm mb-4" data-action="back"><span class="icon">${CrackItUtils.icons.chevronLeft}</span> Back to Knowledge Base</button>
      <div class="card">
        <div class="card-header">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-blue">${escapeHtml(page.category)}</span>
              ${page.tags && page.tags.length ? page.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('') : ''}
            </div>
            <h2 class="text-xl font-semibold">${escapeHtml(page.title)}</h2>
            <div class="text-xs text-muted mt-1">
              ${page.wordCount || 0} words · Updated ${formatDate(page.updatedAt)} · Created ${formatDate(page.createdAt)}
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" data-action="ai-summary"><span class="icon">${CrackItUtils.icons.ai}</span> AI Summary</button>
            <button class="btn btn-ghost btn-sm" data-action="edit-page"><span class="icon">${CrackItUtils.icons.edit}</span> Edit</button>
            <button class="btn btn-ghost btn-sm" data-action="delete-page" style="color:#EF4444"><span class="icon">${CrackItUtils.icons.trash}</span></button>
          </div>
        </div>
        <div class="card-body note-content">
          ${markdownToHtml(page.content || '')}
        </div>
      </div>`;
  }

  function renderEditor(page) {
    return `
      <button class="btn btn-ghost btn-sm mb-4" data-action="back"><span class="icon">${CrackItUtils.icons.chevronLeft}</span> Back to Knowledge Base</button>
      <div class="card">
        <div class="card-header">
          <div class="flex-1">
            <input type="text" class="input mb-2" id="edit-title" value="${escapeHtml(page.title)}" style="font-size:18px;font-weight:600">
            <div class="flex gap-2 items-center">
              <select class="input select" id="edit-category" style="width:auto">${CATEGORIES.map(c => `<option value="${c}" ${c === page.category ? 'selected' : ''}>${c}</option>`).join('')}</select>
              ${page.tags && page.tags.length ? page.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('') : ''}
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" data-action="cancel-edit">Cancel</button>
            <button class="btn btn-primary btn-sm" data-action="save-edit">Save</button>
          </div>
        </div>
        <div class="card-body">
          <textarea class="form-control textarea-mono" id="edit-content" rows="20" style="font-size:14px;line-height:1.6">${escapeHtml(page.content || '')}</textarea>
        </div>
      </div>`;
  }

  function bindEvents(container, pages) {
    container.querySelector('#knowledge-search')?.addEventListener('input', (e) => {
      const grid = container.querySelector('#knowledge-grid');
      grid.innerHTML = renderGrid(pages, e.target.value);
      bindCardEvents(container, pages);
    });

    container.querySelectorAll('.category-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.category-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterCategory = btn.dataset.category;
        const searchVal = container.querySelector('#knowledge-search')?.value || '';
        const grid = container.querySelector('#knowledge-grid');
        grid.innerHTML = renderGrid(pages, searchVal);
        bindCardEvents(container, pages);
      });
    });

    container.querySelector('[data-action="new-page"]')?.addEventListener('click', () => {
      const page = CrackItStorage.addToCollection('notes', {
        id: uid('note'),
        title: 'New Knowledge Page',
        content: '# New Knowledge Page\n\nStart writing your knowledge article...',
        folder: filterCategory || 'Research',
        tags: [],
        pinned: false,
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount: 0
      });
      selectedPage = page;
      CrackItUI.toast('New knowledge page created', 'success');
      render(container);
    });

    container.querySelector('[data-action="refresh"]')?.addEventListener('click', () => {
      render(container);
      CrackItUI.toast('Knowledge base refreshed', 'info');
    });

    container.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      isEditing = false;
      selectedPage = null;
      render(container);
    });

    container.querySelector('[data-action="edit-page"]')?.addEventListener('click', () => {
      if (selectedPage) {
        isEditing = true;
        container.innerHTML = renderEditor(selectedPage);
        bindEvents(container, pages);
      }
    });

    container.querySelector('[data-action="cancel-edit"]')?.addEventListener('click', () => {
      isEditing = false;
      if (selectedPage) {
        container.innerHTML = renderDetail(selectedPage);
        bindEvents(container, pages);
      }
    });

    container.querySelector('[data-action="save-edit"]')?.addEventListener('click', () => {
      if (!selectedPage) return;
      const title = container.querySelector('#edit-title')?.value || selectedPage.title;
      const content = container.querySelector('#edit-content')?.value || selectedPage.content;
      const category = container.querySelector('#edit-category')?.value || selectedPage.category;
      CrackItStorage.updateInCollection('notes', selectedPage.id, {
        title, content, folder: category,
        wordCount: content.split(/\s+/).length,
        updatedAt: new Date().toISOString()
      });
      selectedPage = { ...selectedPage, title, content, folder: category, wordCount: content.split(/\s+/).length };
      isEditing = false;
      CrackItUI.toast('Knowledge page saved', 'success');
      container.innerHTML = renderDetail(selectedPage);
      bindEvents(container, pages);
    });

    container.querySelector('[data-action="delete-page"]')?.addEventListener('click', () => {
      if (!selectedPage) return;
      CrackItUI.confirm('Delete this knowledge page?', () => {
        CrackItStorage.removeFromCollection('notes', selectedPage.id);
        CrackItUI.toast('Page deleted', 'info');
        isEditing = false;
        selectedPage = null;
        render(container);
      });
    });

    bindCardEvents(container, pages);
  }

  function bindCardEvents(container, pages) {
    container.querySelectorAll('.knowledge-card').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.ai-ask-btn')) return;
        const page = pages.find(p => p.id === el.dataset.pageId);
        if (page) {
          selectedPage = page;
          container.innerHTML = renderDetail(page);
          bindEvents(container, pages);
        }
      });
    });

    container.querySelectorAll('.ai-ask-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const page = pages.find(p => p.id === btn.dataset.pageId);
        if (page) {
          CrackItUI.toast(`Asking AI about: ${page.title}`, 'info');
        }
      });
    });
  }

  return { render };
})();

CrackItModules.CrackItKnowledge = CrackItKnowledge;
