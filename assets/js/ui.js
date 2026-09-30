/**
 * CrackIt — UI Service
 * Toast notifications, modals, context menus, skeletons
 */

const CrackItUI = (() => {
  'use strict';

  const { escapeHtml, createElement, $, icon } = CrackItUtils;
  let toastContainer = null;
  let contextMenuEl = null;
  let activeModal = null;

  /** Initialize UI containers */
  function init() {
    toastContainer = $('#toast-container');
    contextMenuEl = $('#context-menu');

    document.addEventListener('click', () => closeContextMenu());
    document.addEventListener('contextmenu', handleGlobalContextMenu);
    document.addEventListener('keydown', handleEscapeKey);

    document.querySelectorAll('.modal-overlay .modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.modal-overlay')?.classList.remove('open');
        activeModal = null;
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('open');
          activeModal = null;
        }
      });
    });
  }

  /** Toast notifications */
  function toast(message, type = 'info', duration = 4000) {
    if (!toastContainer) return;

    const icons = { success: 'success', error: 'error', warning: 'warning', info: 'info' };
    const toastEl = createElement('div', {
      className: `toast toast-${type}`,
      innerHTML: `
        <span class="toast-icon">${CrackItUtils.icons[icons[type]] || CrackItUtils.icons.info}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close" aria-label="Close">${CrackItUtils.icons.close}</button>
      `
    });

    toastEl.querySelector('.toast-close').addEventListener('click', () => removeToast(toastEl));
    toastContainer.appendChild(toastEl);

    if (duration > 0) {
      setTimeout(() => removeToast(toastEl), duration);
    }

    return toastEl;
  }

  function removeToast(el) {
    if (!el || !el.parentNode) return;
    el.classList.add('removing');
    setTimeout(() => el.remove(), 250);
  }

  /** Modal system */
  function openModal(id, options = {}) {
    const overlay = $(`#modal-${id}`);
    if (!overlay) {
      toast(`Modal "${id}" not found`, 'warning');
      return;
    }

    if (options.title) {
      const titleEl = overlay.querySelector('.modal-title');
      if (titleEl) titleEl.textContent = options.title;
    }

    if (options.content) {
      const bodyEl = overlay.querySelector('.modal-body');
      if (bodyEl) bodyEl.innerHTML = options.content;
    }

    overlay.classList.add('open');
    activeModal = overlay;

    const input = overlay.querySelector('input, textarea');
    if (input) setTimeout(() => input.focus(), 100);

    overlay.querySelector('.modal-close')?.addEventListener('click', () => closeModal(id));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(id);
    });
  }

  function closeModal(id) {
    const overlay = id ? $(`#modal-${id}`) : activeModal;
    if (overlay) {
      overlay.classList.remove('open');
      activeModal = null;
    }
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    activeModal = null;
  }

  /** Context menu */
  function showContextMenu(x, y, items) {
    if (!contextMenuEl) return;

    contextMenuEl.innerHTML = items.map(item => {
      if (item.divider) return '<div class="context-menu-divider"></div>';
      return `<button class="context-menu-item ${item.danger ? 'danger' : ''}" data-action="${item.action || ''}">${item.icon ? CrackItUtils.icons[item.icon] || '' : ''}${escapeHtml(item.label)}</button>`;
    }).join('');

    contextMenuEl.style.left = `${x}px`;
    contextMenuEl.style.top = `${y}px`;
    contextMenuEl.classList.add('open');

    contextMenuEl.querySelectorAll('.context-menu-item').forEach((btn, i) => {
      const item = items.filter(it => !it.divider)[i];
      if (item?.handler) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          item.handler();
          closeContextMenu();
        });
      }
    });
  }

  function closeContextMenu() {
    contextMenuEl?.classList.remove('open');
  }

  function handleGlobalContextMenu(e) {
    const ctxEl = e.target.closest('[data-context]');
    if (ctxEl) {
      e.preventDefault();
      const items = getContextMenuItems(ctxEl.dataset.context, ctxEl);
      if (items.length) showContextMenu(e.clientX, e.clientY, items);
      return;
    }

    const typeMap = [
      ['data-project-id', 'project'],
      ['data-file-id', 'file'],
      ['data-note-id', 'note'],
      ['data-finding-id', 'finding'],
      ['data-conv-id', 'conversation'],
      ['data-report-id', 'report']
    ];
    for (const [attr, type] of typeMap) {
      const el = e.target.closest(`[${attr}]`);
      if (el) {
        e.preventDefault();
        const items = getContextMenuItems(type, el);
        if (items.length) showContextMenu(e.clientX, e.clientY, items);
        return;
      }
    }
  }

  function getContextMenuItems(type, target) {
    const pid = target?.dataset?.projectId;
    const fid = target?.dataset?.fileId || target?.dataset?.id;
    const nid = target?.dataset?.noteId;
    const findingId = target?.dataset?.findingId;
    const cid = target?.dataset?.convId;
    const assetId = target?.dataset?.assetId;
    const reportId = target?.dataset?.reportId;

    const menus = {
      project: [
        { label: 'Open', icon: 'folder', handler: () => { CrackItRouter.navigate('projects'); } },
        { label: 'Duplicate', icon: 'copy', handler: () => { toast('Project duplicated', 'success'); } },
        { label: 'Rename', icon: 'edit', handler: () => { const name = prompt('New name:'); if (name && pid) { CrackItStorage.updateInCollection('projects', pid, { name }); toast('Project renamed', 'success'); } } },
        { divider: true },
        { label: 'Archive', icon: 'archive', handler: () => { if (pid) { CrackItStorage.updateInCollection('projects', pid, { status: 'archived' }); toast('Project archived', 'info'); } } },
        { label: 'Favorite', icon: 'star', handler: () => { if (pid) { const p = CrackItStorage.findInCollection('projects', pid); if (p) { CrackItStorage.updateInCollection('projects', pid, { pinned: !p.pinned }); toast(p.pinned ? 'Unfavorited' : 'Favorited', 'success'); } } } },
        { label: 'Properties', icon: 'info', handler: () => { toast('Project properties', 'info'); } },
        { divider: true },
        { label: 'Delete', icon: 'trash', danger: true, handler: () => { if (pid && confirm('Delete this project?')) { CrackItStorage.removeFromCollection('projects', pid); toast('Project deleted', 'warning'); } } }
      ],
      file: [
        { label: 'Open', icon: 'file', handler: () => { toast('Opening file...', 'info'); } },
        { label: 'Preview', icon: 'search', handler: () => { toast('Previewing file...', 'info'); } },
        { label: 'Download', icon: 'download', handler: () => { toast('Download started', 'success'); } },
        { label: 'Rename', icon: 'edit', handler: () => { const name = prompt('New filename:'); if (name && fid) { CrackItStorage.updateInCollection('files', fid, { name }); toast('File renamed', 'success'); } } },
        { label: 'Copy Path', icon: 'copy', handler: () => { navigator.clipboard?.writeText(target.dataset.path || ''); toast('Path copied', 'success'); } },
        { label: 'Favorite', icon: 'star', handler: () => { if (fid) { const f = CrackItStorage.findInCollection('files', fid); if (f) { CrackItStorage.updateInCollection('files', fid, { favorite: !f.favorite }); toast(f.favorite ? 'Unfavorited' : 'Favorited', 'success'); } } } },
        { divider: true },
        { label: 'Move', icon: 'folder', handler: () => { const folder = prompt('Move to folder:'); if (folder && fid) { CrackItStorage.updateInCollection('files', fid, { folder }); toast('File moved', 'success'); } } },
        { divider: true },
        { label: 'Delete', icon: 'trash', danger: true, handler: () => { if (fid && confirm('Delete this file?')) { CrackItStorage.removeFromCollection('files', fid); toast('File deleted', 'warning'); } } }
      ],
      note: [
        { label: 'Open', icon: 'notes', handler: () => { CrackItRouter.navigate('notes'); } },
        { label: 'Duplicate', icon: 'copy', handler: () => { toast('Note duplicated', 'success'); } },
        { label: 'Rename', icon: 'edit', handler: () => { const name = prompt('New title:'); if (name && nid) { CrackItStorage.updateInCollection('notes', nid, { title: name }); toast('Note renamed', 'success'); } } },
        { label: 'Export', icon: 'download', handler: () => { toast('Exporting note...', 'info'); } },
        { label: 'Favorite', icon: 'star', handler: () => { if (nid) { const n = CrackItStorage.findInCollection('notes', nid); if (n) { CrackItStorage.updateInCollection('notes', nid, { favorite: !n.favorite }); toast(n.favorite ? 'Unfavorited' : 'Favorited', 'success'); } } } },
        { divider: true },
        { label: 'Delete', icon: 'trash', danger: true, handler: () => { if (nid && confirm('Delete this note?')) { CrackItStorage.removeFromCollection('notes', nid); toast('Note deleted', 'warning'); } } }
      ],
      finding: [
        { label: 'Open Detail', icon: 'search', handler: () => { if (findingId) { window._activeFindingId = findingId; toast('Finding detail opened', 'info'); } } },
        { label: 'Edit', icon: 'edit', handler: () => { toast('Edit finding', 'info'); } },
        { label: 'Duplicate', icon: 'copy', handler: () => { toast('Finding duplicated', 'success'); } },
        { divider: true },
        { label: 'Delete', icon: 'trash', danger: true, handler: () => { if (findingId && confirm('Delete this finding?')) { CrackItStorage.removeFromCollection('findings', findingId); toast('Finding deleted', 'warning'); } } }
      ],
      conversation: [
        { label: 'Open', icon: 'chat', handler: () => { CrackItRouter.navigate('chat'); } },
        { label: 'Rename', icon: 'edit', handler: () => { const name = prompt('New title:'); if (name && cid) { CrackItStorage.updateInCollection('conversations', cid, { title: name }); toast('Conversation renamed', 'success'); } } },
        { label: 'Export', icon: 'download', handler: () => { toast('Exporting conversation...', 'info'); } },
        { divider: true },
        { label: 'Delete', icon: 'trash', danger: true, handler: () => { if (cid && confirm('Delete this conversation?')) { CrackItStorage.removeFromCollection('conversations', cid); toast('Conversation deleted', 'warning'); } } }
      ],
      default: [
        { label: 'Refresh', icon: 'refresh', handler: () => { CrackItRouter.refresh(); toast('Page refreshed', 'info'); } },
        { label: 'Properties', icon: 'info', handler: () => { toast('Properties', 'info'); } },
        { label: 'Copy', icon: 'copy', handler: () => { toast('Copied to clipboard', 'success'); } }
      ]
    };
    return menus[type] || menus.default;
  }

  function handleEscapeKey(e) {
    if (e.key === 'Escape') {
      closeAllModals();
      closeContextMenu();
      CrackItSearch?.close();
      CrackItNotifications?.closePanel();
    }
  }

  /** Loading skeleton */
  const loadMessages = [
    'Loading Dashboard...', 'Loading Workspace...', 'Preparing Security Modules...',
    'Loading AI Context...', 'Synchronizing Components...', 'Finalizing Interface...',
    'Initializing Modules...', 'Loading Data...', 'Preparing Views...'
  ];

  function showPageSkeleton(container) {
    const msg = loadMessages[Math.floor(Math.random() * loadMessages.length)];
    container.innerHTML = `
      <div class="page-loading" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px">
        <div class="page-loader-ring" style="width:48px;height:48px;position:relative;margin-bottom:24px">
          ${Array.from({length:8}, (_,i) => `<div class="loader-dot" style="--i:${i};--angle:${i*45}deg;width:6px;height:6px;background:var(--accent-blue);border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(${i*45}deg) translateY(-18px);animation:loaderSpin 1.2s linear infinite;animation-delay:${i*0.15}s"></div>`).join('')}
        </div>
        <div class="page-loading-text" style="font-size:13px;color:var(--text-muted);animation:pulse 1.5s ease-in-out infinite">${msg}</div>
        <div style="margin-top:16px;width:120px;height:3px;background:var(--border);border-radius:2px;overflow:hidden"><div style="height:100%;width:30%;background:var(--accent-blue);border-radius:2px;animation:loaderBar 1.5s ease-in-out infinite"></div></div>
      </div>`;
  }

  /** Confirm dialog */
  function confirm(message, onConfirm) {
    openModal('confirm', {
      title: 'Confirm Action',
      content: `<p>${escapeHtml(message)}</p>`
    });

    const overlay = $('#modal-confirm');
    const confirmBtn = overlay?.querySelector('[data-confirm]');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        onConfirm?.();
        closeModal('confirm');
      };
    }
  }

  /** Ripple effect on buttons */
  function initRipples() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn, .sidebar-item, .topbar-btn');
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const ripple = createElement('span', {
        className: 'ripple',
        style: `left:${e.clientX - rect.left}px;top:${e.clientY - rect.top}px;width:20px;height:20px;margin-left:-10px;margin-top:-10px`
      });

      btn.classList.add('ripple-container');
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  /** Update clock in topbar and statusbar */
  function startClock() {
    function update() {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const clockEl = document.getElementById('stb-clock');
      if (clockEl) clockEl.textContent = time;
      document.querySelectorAll('[data-clock]').forEach(el => el.textContent = time);
    }
    update();
    setInterval(update, 1000);
  }

  function startMetrics() {
    let storagePct = 42;
    let networkPct = 94;
    function update() {
      const cpu = Math.floor(15 + Math.random() * 35);
      const ram = Math.floor(40 + Math.random() * 30);
      storagePct = Math.min(99, Math.max(20, storagePct + Math.floor(Math.random() * 3) - 1));
      networkPct = Math.min(99, Math.max(70, networkPct + Math.floor(Math.random() * 5) - 2));

      document.querySelectorAll('[data-cpu]').forEach(el => {
        el.textContent = `${cpu}%`;
      });
      document.querySelectorAll('[data-cpu-bar]').forEach(el => {
        el.style.width = `${cpu}%`;
        el.className = 'stb-fill' + (cpu > 80 ? ' danger' : cpu > 60 ? ' warning' : '');
      });

      document.querySelectorAll('[data-ram]').forEach(el => {
        el.textContent = `${ram}%`;
      });
      document.querySelectorAll('[data-ram-bar]').forEach(el => {
        el.style.width = `${ram}%`;
        el.className = 'stb-fill' + (ram > 80 ? ' danger' : ram > 60 ? ' warning' : '');
      });

      const stMetric = document.querySelectorAll('.stb-metric');
      if (stMetric.length >= 3) {
        const storageEl = stMetric[2].querySelector(':scope > :last-child');
        const storageBar = stMetric[2].querySelector('.stb-fill');
        if (storageEl) storageEl.textContent = `${storagePct}%`;
        if (storageBar) {
          storageBar.style.width = `${storagePct}%`;
          storageBar.className = 'stb-fill' + (storagePct > 80 ? ' danger' : storagePct > 60 ? ' warning' : '');
        }
      }
      if (stMetric.length >= 4) {
        const netEl = stMetric[3].querySelector(':scope > :last-child');
        if (netEl) netEl.textContent = `${networkPct}%`;
      }
    }
    update();
    setInterval(update, 3000);
  }

  return {
    init, toast, openModal, closeModal, closeAllModals,
    showContextMenu, closeContextMenu, showPageSkeleton,
    confirm, initRipples, startClock, startMetrics
  };
})();
