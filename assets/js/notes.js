/**
 * CrackIt — Notes Module
 */

const CrackItNotes = (() => {
  'use strict';

  const { escapeHtml, formatDate, markdownToHtml, icon, icons } = CrackItUtils;
  let selectedNote = null;

  async function render(container) {
    const notes = getSortedNotes();
    const folders = [...new Set(notes.map(n => n.folder))];
    if (!selectedNote && notes.length) selectedNote = notes[0];

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content"><h1>Notes</h1><p>${notes.length} notes · ${notes.filter(n => n.pinned).length} pinned</p></div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" data-action="template">${icon('extensions')} Templates</button>
          <button class="btn btn-primary" data-action="new-note">${icon('plus')} New Note</button>
        </div>
      </div>

      <div class="flex gap-4" style="height:calc(100vh - 220px)">
        <div class="card" style="width:280px;flex-shrink:0;display:flex;flex-direction:column">
          <div class="card-header" style="padding:8px">
            <input type="text" class="input" placeholder="Search notes..." id="note-search" style="font-size:13px">
          </div>
          <div class="overflow-y-auto flex-1 scrollbar-thin">
            ${folders.map(f => `
              <div class="text-xs text-muted uppercase px-3 pt-3 pb-1" style="font-weight:600;letter-spacing:0.05em">${escapeHtml(f)}</div>
              ${notes.filter(n => n.folder === f).map(n => `
                <div class="list-item ${selectedNote?.id === n.id ? 'active' : ''}" data-note-id="${n.id}" style="padding:8px 14px;cursor:pointer;border-left:3px solid ${n.id === selectedNote?.id ? 'var(--primary)' : 'transparent'};transition:all 0.15s">
                  <div class="list-item-content">
                    <div class="list-item-title" style="font-size:13px;font-weight:500;display:flex;align-items:center;gap:4px">
                      ${n.pinned ? '<span style="font-size:11px">📌</span>' : ''}
                      ${escapeHtml(n.title)}
                    </div>
                    <div class="list-item-subtitle" style="font-size:10px;color:var(--text-muted);margin-top:2px">
                      ${formatDate(n.updatedAt, true)} · ${n.wordCount || 0} words
                    </div>
                  </div>
                </div>`).join('')}`).join('')}
            ${!notes.length ? '<div class="empty-state-sm" style="padding:32px"><p>No notes yet</p></div>' : ''}
          </div>
        </div>

        <div class="note-editor flex-1" id="note-editor">
          ${selectedNote ? renderEditor(selectedNote) : '<div class="empty-state" style="height:100%;display:flex;align-items:center;justify-content:center"><p>Select or create a note</p></div>'}
        </div>
      </div>`;

    bindEvents(container, notes);
  }

  function getSortedNotes() {
    const notes = CrackItStorage.getCollection('notes');
    return notes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }

  function renderEditor(note) {
    return `
      <div class="card" style="height:100%;display:flex;flex-direction:column">
        <div class="card-header" style="padding:8px 12px;flex-wrap:wrap">
          <div class="note-toolbar" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;width:100%">
            <button class="note-toolbar-btn" data-format="bold" title="Bold (Ctrl+B)" style="font-weight:700">B</button>
            <button class="note-toolbar-btn" data-format="italic" title="Italic (Ctrl+I)" style="font-style:italic">I</button>
            <button class="note-toolbar-btn" data-format="heading" title="Heading">H</button>
            <span style="width:1px;height:20px;background:var(--border);margin:0 4px"></span>
            <button class="note-toolbar-btn" data-format="code" title="Code">&lt;/&gt;</button>
            <button class="note-toolbar-btn" data-format="ul" title="Bullet List">≡</button>
            <button class="note-toolbar-btn" data-format="ol" title="Numbered List">#</button>
            <button class="note-toolbar-btn" data-format="link" title="Link">🔗</button>
            <span style="flex:1"></span>
            <button class="btn btn-ghost btn-sm ${note.favorite ? 'text-warning' : ''}" data-action="favorite-note" title="Favorite">${icon('star')}</button>
            <button class="btn btn-ghost btn-sm ${note.pinned ? 'text-primary' : ''}" data-action="pin-note" title="Pin">📌</button>
            <button class="btn btn-ghost btn-sm" data-action="ai-summary" title="AI Summary">${icon('chat')}</button>
            <button class="btn btn-ghost btn-sm" data-action="export-note" title="Export">${icon('download')}</button>
            <button class="btn btn-ghost btn-sm" data-action="delete-note" title="Delete" style="color:#EF4444">${icon('trash')}</button>
          </div>
        </div>
        <div class="card-body" style="flex:1;display:flex;flex-direction:column;padding:0">
          <input type="text" class="input" id="note-title-input" value="${escapeHtml(note.title)}" style="border:none;border-radius:0;font-size:18px;font-weight:600;padding:12px 16px;background:transparent" placeholder="Note title...">
          <div class="note-content" contenteditable="true" id="note-content-area" style="flex:1;padding:12px 16px;font-size:14px;line-height:1.7;overflow-y:auto;outline:none">
            ${markdownToHtml(note.content)}
          </div>
        </div>
        <div class="card-footer" style="padding:6px 16px;display:flex;justify-content:space-between;align-items:center">
          <span class="text-xs text-muted"><span id="note-wordcount">${note.wordCount || 0}</span> words</span>
          <span class="text-xs text-muted" id="note-save-status">Saved</span>
        </div>
      </div>`;
  }

  function bindEvents(container, notes) {
    container.querySelectorAll('[data-note-id]').forEach(el => {
      el.addEventListener('click', () => {
        selectedNote = notes.find(n => n.id === el.dataset.noteId) || CrackItStorage.getCollection('notes').find(n => n.id === el.dataset.noteId);
        if (selectedNote) {
          container.querySelector('#note-editor').innerHTML = renderEditor(selectedNote);
          bindEditorEvents(container);
          container.querySelectorAll('[data-note-id]').forEach(item => {
            item.classList.toggle('active', item.dataset.noteId === selectedNote.id);
          });
        }
      });
    });

    container.querySelector('[data-action="new-note"]')?.addEventListener('click', async () => {
      const noteData = {
        id: CrackItUtils.uid('note'),
        title: 'Untitled Note',
        content: '# Untitled Note\n\nStart writing...',
        folder: 'Personal',
        tags: [],
        pinned: false,
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount: 0
      };
      if (CrackItAPI.isAuthenticated()) {
        try {
          const result = await CrackItAPI.notes.create({ title: noteData.title, content: noteData.content, folder: noteData.folder, tags: noteData.tags, word_count: String(noteData.wordCount) });
          noteData.id = result.id;
        } catch (e) { console.warn('API note create failed:', e); }
      }
      const note = CrackItStorage.addToCollection('notes', noteData);
      selectedNote = note;
      CrackItUI.toast('New note created', 'success');
      render(container);
    });

    container.querySelector('[data-action="template"]')?.addEventListener('click', () => {
      CrackItUI.toast('Template gallery opened', 'info');
    });

    container.querySelector('#note-search')?.addEventListener('input', CrackItUtils.debounce((e) => {
      const query = e.target.value.toLowerCase();
      container.querySelectorAll('[data-note-id]').forEach(el => {
        const title = el.querySelector('.list-item-title')?.textContent.toLowerCase() || '';
        el.style.display = title.includes(query) ? '' : 'none';
      });
    }, 200));

    bindEditorEvents(container);
  }

  function bindEditorEvents(container) {
    const contentArea = container.querySelector('#note-content-area');
    const titleInput = container.querySelector('#note-title-input');

    const saveNote = CrackItUtils.debounce(async () => {
      if (!selectedNote) return;
      const content = contentArea?.innerText || '';
      const title = titleInput?.value || selectedNote.title;
      const wordCount = content.split(/\s+/).filter(w => w).length;
      if (CrackItAPI.isAuthenticated()) {
        try { await CrackItAPI.notes.update(selectedNote.id, { title, content, word_count: String(wordCount) }); } catch (e) { console.warn('API note update failed:', e); }
      }
      CrackItStorage.updateInCollection('notes', selectedNote.id, {
        content, title, wordCount, updatedAt: new Date().toISOString()
      });
      const status = container.querySelector('#note-save-status');
      if (status) status.textContent = 'Saved ' + new Date().toLocaleTimeString();
      const wc = container.querySelector('#note-wordcount');
      if (wc) wc.textContent = wordCount;
      selectedNote = { ...selectedNote, content, title, wordCount };
    }, 800);

    contentArea?.addEventListener('input', saveNote);
    titleInput?.addEventListener('input', saveNote);

    container.querySelector('[data-action="ai-summary"]')?.addEventListener('click', () => {
      CrackItUI.toast('AI summary generated: ' + (selectedNote?.title || ''), 'success');
    });

    container.querySelector('[data-action="export-note"]')?.addEventListener('click', () => {
      if (selectedNote) {
        const blob = new Blob([selectedNote.content || ''], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = (selectedNote.title || 'note') + '.md';
        a.click(); URL.revokeObjectURL(url);
        CrackItUI.toast('Note exported as Markdown', 'success');
      }
    });

    container.querySelector('[data-action="favorite-note"]')?.addEventListener('click', async () => {
      if (!selectedNote) return;
      const fav = !selectedNote.favorite;
      if (CrackItAPI.isAuthenticated()) {
        try { await CrackItAPI.notes.update(selectedNote.id, { favorite: fav }); } catch (e) { console.warn('API note update failed:', e); }
      }
      CrackItStorage.updateInCollection('notes', selectedNote.id, { favorite: fav });
      selectedNote.favorite = fav;
      container.querySelector('[data-action="favorite-note"]')?.classList.toggle('text-warning', fav);
      CrackItUI.toast(fav ? 'Added to favorites' : 'Removed from favorites', 'success');
    });

    container.querySelector('[data-action="pin-note"]')?.addEventListener('click', async () => {
      if (!selectedNote) return;
      const pinned = !selectedNote.pinned;
      if (CrackItAPI.isAuthenticated()) {
        try { await CrackItAPI.notes.update(selectedNote.id, { pinned }); } catch (e) { console.warn('API note update failed:', e); }
      }
      CrackItStorage.updateInCollection('notes', selectedNote.id, { pinned });
      selectedNote.pinned = pinned;
      container.querySelector('[data-action="pin-note"]')?.classList.toggle('text-primary', pinned);
      CrackItUI.toast(pinned ? 'Note pinned' : 'Note unpinned', 'success');
    });

    container.querySelector('[data-action="delete-note"]')?.addEventListener('click', () => {
      if (!selectedNote) return;
      CrackItUI.confirm('Delete "' + selectedNote.title + '"?', async () => {
        if (CrackItAPI.isAuthenticated()) {
          try { await CrackItAPI.notes.delete(selectedNote.id); } catch (e) { console.warn('API note delete failed:', e); }
        }
        CrackItStorage.removeFromCollection('notes', selectedNote.id);
        selectedNote = null;
        render(container);
        CrackItUI.toast('Note deleted', 'info');
      });
    });

    container.querySelectorAll('.note-toolbar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fmt = btn.dataset.format;
        const cmds = { bold: 'bold', italic: 'italic', heading: 'formatBlock', code: 'insertHTML', ul: 'insertUnorderedList', ol: 'insertOrderedList', link: 'createLink' };
        const cmd = cmds[fmt];
        if (cmd) {
          if (fmt === 'heading') document.execCommand(cmd, false, '<h3>');
          else if (fmt === 'code') document.execCommand(cmd, false, '<code></code>');
          else if (fmt === 'link') {
            const url = prompt('Enter URL:', 'https://');
            if (url) document.execCommand(cmd, false, url);
          } else document.execCommand(cmd, false, null);
          contentArea?.focus();
        }
      });
    });

    container.querySelectorAll('[data-note-id]').forEach(el => {
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const note = notes.find(n => n.id === el.dataset.noteId);
        if (!note) return;
        CrackItUI.showContextMenu(e.clientX, e.clientY, [
          { label: note.pinned ? 'Unpin' : 'Pin', action: async () => {
            if (CrackItAPI.isAuthenticated()) {
              try { await CrackItAPI.notes.update(note.id, { pinned: !note.pinned }); } catch (e) { console.warn('API note update failed:', e); }
            }
            CrackItStorage.updateInCollection('notes', note.id, { pinned: !note.pinned });
            render(container);
          }},
          { label: note.favorite ? 'Unfavorite' : 'Favorite', action: async () => {
            if (CrackItAPI.isAuthenticated()) {
              try { await CrackItAPI.notes.update(note.id, { favorite: !note.favorite }); } catch (e) { console.warn('API note update failed:', e); }
            }
            CrackItStorage.updateInCollection('notes', note.id, { favorite: !note.favorite });
            render(container);
          }},
          { label: 'Delete', action: () => {
            CrackItUI.confirm('Delete "' + note.title + '"?', async () => {
              if (CrackItAPI.isAuthenticated()) {
                try { await CrackItAPI.notes.delete(note.id); } catch (e) { console.warn('API note delete failed:', e); }
              }
              CrackItStorage.removeFromCollection('notes', note.id);
              if (selectedNote?.id === note.id) selectedNote = null;
              render(container);
              CrackItUI.toast('Note deleted', 'info');
            });
          }, danger: true }
        ]);
      });
    });
  }

  return { render };
})();

CrackItModules.CrackItNotes = CrackItNotes;
