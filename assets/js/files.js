/**
 * CrackIt — Files Module
 */

const CrackItFiles = (() => {
  'use strict';

  const { escapeHtml, formatDate, formatSize, icon, icons } = CrackItUtils;
  let currentFolder = 'All';
  let viewMode = 'grid';
  let selectedFileId = null;

  async function render(container) {
    const files = getFilteredFiles();
    const allFolders = ['All', ...new Set(CrackItStorage.getCollection('files').filter(f => f.folder).map(f => f.folder))];

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content"><h1>Files</h1><p>${CrackItStorage.getCollection('files').length} files · File manager</p></div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" data-action="upload">${icon('plus')} Upload</button>
          <button class="btn btn-primary" data-action="new-folder">${icon('folder')} New Folder</button>
        </div>
      </div>

      <div class="filter-bar">
        <input type="text" class="input" placeholder="Search files by name, type, or folder..." id="file-search" style="max-width:400px">
        <div class="view-toggle ml-auto">
          <button class="view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}" data-view="grid" title="Grid view">${icon('grid')}</button>
          <button class="view-toggle-btn ${viewMode === 'list' ? 'active' : ''}" data-view="list" title="List view">${icon('list')}</button>
        </div>
      </div>

      <div class="file-explorer" style="gap:0">
        <div class="file-tree scrollbar-thin" style="width:200px;min-width:200px;border-right:1px solid var(--border);padding:8px">
          ${allFolders.map(f => `
            <div class="file-tree-item ${currentFolder === f ? 'active' : ''}" data-folder="${f}" style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:13px;transition:all 0.15s">
              <span style="opacity:0.6">${f === 'All' ? icon('folder') : icon('folder')}</span>
              <span>${escapeHtml(f)}</span>
              <span class="text-xs text-muted ml-auto">${f === 'All' ? CrackItStorage.getCollection('files').length : CrackItStorage.getCollection('files').filter(x => x.folder === f).length}</span>
            </div>`).join('')}
          <div style="border-top:1px solid var(--border);margin:8px 0;padding-top:8px">
            <div class="file-tree-item" data-folder="favorites" style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:13px">${icon('star')} <span>Favorites</span></div>
            <div class="file-tree-item" data-folder="recent" style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:13px">${icon('refresh')} <span>Recent</span></div>
            <div class="file-tree-item" data-folder="trash" style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:13px">${icon('trash')} <span>Trash</span></div>
          </div>
        </div>
        <div class="file-main" style="flex:1;padding:12px">
          <div id="file-content">${viewMode === 'grid' ? renderGrid(files) : renderList(files)}</div>
        </div>
      </div>`;

    bindEvents(container);
  }

  function getFilteredFiles() {
    let files = CrackItStorage.getCollection('files');
    if (currentFolder === 'favorites') files = files.filter(f => f.favorite);
    else if (currentFolder === 'recent') files = files.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt)).slice(0, 20);
    else if (currentFolder === 'trash') return [];
    else if (currentFolder !== 'All') files = files.filter(f => f.folder === currentFolder);

    const search = document.getElementById('file-search')?.value?.toLowerCase();
    if (search) files = files.filter(f => f.name.toLowerCase().includes(search) || (f.type || '').toLowerCase().includes(search));
    return files;
  }

  const fileIcons = {
    pdf: '📄', docx: '📝', xlsx: '📊', png: '🖼️', jpg: '🖼️', gif: '🖼️', svg: '🖼️',
    json: '{ }', xml: '📋', csv: '📊', txt: '📃', md: '📝',
    py: '🐍', js: '🟨', ts: '🟦', sh: '⚡', bat: '🪟', ps1: '🪟',
    pcap: '📡', log: '📜', zip: '📦', tar: '📦', gz: '📦', rar: '📦'
  };

  function renderGrid(files) {
    if (!files.length) return '<div class="empty-state" style="padding:48px 0"><p>No files in this location</p></div>';
    return `<div class="file-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px">${files.map(f => {
      const isSelected = selectedFileId === f.id;
      return `
      <div class="card hover-lift ${isSelected ? 'ring-2 ring-blue-500' : ''}" data-context="file" data-file-id="${escapeHtml(f.id)}" data-path="${escapeHtml(f.path)}" draggable="true" style="cursor:pointer">
        <div class="card-body" style="padding:16px;text-align:center">
          <div style="font-size:36px;margin-bottom:8px;line-height:1">${fileIcons[f.type] || '📄'}</div>
          <div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:4px">${formatSize(f.size)}</div>
          ${f.favorite ? '<span style="position:absolute;top:6px;right:8px;font-size:12px">⭐</span>' : ''}
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  function renderList(files) {
    if (!files.length) return '<div class="empty-state" style="padding:48px 0"><p>No files</p></div>';
    return `<div class="table-improved"><table>
      <thead><tr><th style="width:30px"></th><th>Name</th><th>Size</th><th>Modified</th><th>Type</th><th style="width:80px">Actions</th></tr></thead>
      <tbody>${files.map(f => {
        const isSelected = selectedFileId === f.id;
        return `
        <tr data-context="file" data-file-id="${escapeHtml(f.id)}" data-path="${escapeHtml(f.path)}" style="cursor:pointer" class="${isSelected ? 'selected' : ''}">
          <td style="font-size:18px;text-align:center">${fileIcons[f.type] || '📄'}</td>
          <td><span style="font-weight:500">${escapeHtml(f.name)}</span></td>
          <td class="text-muted">${formatSize(f.size)}</td>
          <td class="text-muted">${formatDate(f.modifiedAt, true)}</td>
          <td><span class="badge badge-gray" style="font-size:10px">${f.type}</span></td>
          <td>
            <button class="btn btn-ghost btn-sm" data-action="preview-file" data-id="${escapeHtml(f.id)}" title="Preview">${icon('search')}</button>
            <button class="btn btn-ghost btn-sm" data-action="rename-file" data-id="${escapeHtml(f.id)}" title="Rename">${icon('edit')}</button>
            <button class="btn btn-ghost btn-sm" data-action="delete-file" data-id="${escapeHtml(f.id)}" title="Delete" style="color:#EF4444">${icon('trash')}</button>
          </td>
        </tr>`;
      }).join('')}</tbody></table></div>`;
  }

  function bindEvents(container) {
    container.querySelectorAll('.file-tree-item').forEach(el => {
      el.addEventListener('click', () => {
        currentFolder = el.dataset.folder;
        selectedFileId = null;
        render(container);
      });
    });

    container.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        const files = getFilteredFiles();
        const content = container.querySelector('#file-content');
        if (content) content.innerHTML = viewMode === 'grid' ? renderGrid(files) : renderList(files);
      });
    });

    container.querySelector('[data-action="upload"]')?.addEventListener('click', () => {
      const fileSelector = document.createElement('input');
      fileSelector.type = 'file';
      fileSelector.multiple = true;
      fileSelector.addEventListener('change', (e) => {
        const count = e.target.files?.length || 0;
        if (count > 0) {
          CrackItUI.toast(count + ' file(s) added to queue', 'success');
          CrackItNotifications.add('Upload Complete', count + ' files uploaded successfully', 'success');
        }
      });
      fileSelector.click();
    });

    container.querySelector('[data-action="new-folder"]')?.addEventListener('click', () => {
      CrackItUI.toast('New folder created', 'success');
    });

    container.querySelector('#file-search')?.addEventListener('input', CrackItUtils.debounce(() => {
      const files = getFilteredFiles();
      const content = container.querySelector('#file-content');
      if (content) content.innerHTML = viewMode === 'grid' ? renderGrid(files) : renderList(files);
    }, 300));

    container.querySelectorAll('[data-context="file"]').forEach(el => {
      el.addEventListener('click', () => {
        const fid = el.dataset.fileId;
        if (fid) {
          selectedFileId = selectedFileId === fid ? null : fid;
          const files = getFilteredFiles();
          const content = container.querySelector('#file-content');
          if (content) content.innerHTML = viewMode === 'grid' ? renderGrid(files) : renderList(files);
        }
      });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const fid = el.dataset.fileId;
        const file = CrackItStorage.getCollection('files').find(f => f.id === fid);
        if (!file) return;
        selectedFileId = fid;
        CrackItUI.showContextMenu(e.clientX, e.clientY, [
          { label: 'Preview', icon: 'search', action: () => { CrackItUI.toast('Previewing: ' + file.name, 'info'); }},
          { label: 'Rename', icon: 'edit', action: () => { handleRename(file); }},
          { label: 'Download', icon: 'download', action: () => { CrackItUI.toast('Downloading: ' + file.name, 'info'); }},
          { label: 'Favorite', icon: 'star', action: () => { toggleFavorite(file); }},
          { label: 'Delete', icon: 'trash', action: () => { handleDelete(file); }, danger: true }
        ]);
      });
    });

    container.querySelectorAll('[data-action="preview-file"]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation();
        const file = CrackItStorage.getCollection('files').find(f => f.id === btn.dataset.id);
        if (file) CrackItUI.toast('Previewing: ' + file.name, 'info');
      });
    });

    container.querySelectorAll('[data-action="rename-file"]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation();
        const file = CrackItStorage.getCollection('files').find(f => f.id === btn.dataset.id);
        if (file) handleRename(file);
      });
    });

    container.querySelectorAll('[data-action="delete-file"]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation();
        const file = CrackItStorage.getCollection('files').find(f => f.id === btn.dataset.id);
        if (file) handleDelete(file);
      });
    });

    container.querySelectorAll('[draggable="true"]').forEach(el => {
      el.addEventListener('dragstart', () => el.classList.add('drag-ghost'));
      el.addEventListener('dragend', () => el.classList.remove('drag-ghost'));
    });
  }

  function handleRename(file) {
    CrackItUI.openModal('confirm', {
      title: 'Rename File',
      content: '<input type="text" class="input" id="rename-input" value="' + escapeHtml(file.name) + '" style="width:100%">'
    });
    setTimeout(() => {
      const input = document.querySelector('#rename-input');
      if (input) {
        input.focus();
        input.select();
        input.addEventListener('change', async () => {
          if (input.value.trim()) {
            if (CrackItAPI.isAuthenticated()) {
              try { await CrackItAPI.files.update(file.id, { name: input.value.trim() }); } catch (e) { console.warn('API file update failed:', e); }
            }
            CrackItStorage.updateInCollection('files', file.id, { name: input.value.trim() });
            CrackItUI.closeModal('confirm');
            CrackItUI.toast('File renamed', 'success');
          }
        });
      }
    }, 100);
  }

  async function handleDelete(file) {
    CrackItUI.confirm('Delete "' + file.name + '"?', async () => {
      if (CrackItAPI.isAuthenticated()) {
        try { await CrackItAPI.files.delete(file.id); } catch (e) { console.warn('API file delete failed:', e); }
      }
      CrackItStorage.removeFromCollection('files', file.id);
      selectedFileId = null;
      render(document.querySelector('#workspace-content'));
      CrackItUI.toast('File deleted', 'info');
    });
  }

  async function toggleFavorite(file) {
    if (CrackItAPI.isAuthenticated()) {
      try { await CrackItAPI.files.update(file.id, { is_favorite: !file.favorite }); } catch (e) { console.warn('API file update failed:', e); }
    }
    CrackItStorage.updateInCollection('files', file.id, { favorite: !file.favorite });
    render(document.querySelector('#workspace-content'));
    CrackItUI.toast(file.favorite ? 'Removed from favorites' : 'Added to favorites', 'success');
  }

  return { render };
})();

CrackItModules.CrackItFiles = CrackItFiles;
