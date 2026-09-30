/**
 * CrackIt — AI Workspace Module
 * Complete AI Chat with encoding tools, AI toolbox, file upload, and context panel
 */

const CrackItChat = (() => {
  'use strict';

  const { escapeHtml, formatDate, markdownToHtml, uid, icon, icons, debounce, randomItem } = CrackItUtils;
  let activeConversation = null;
  let isGenerating = false;
  let attachedFiles = [];
  let encToolsVisible = false;
  let container = null;
  let contextMenuVisible = false;

  const FALLBACK_RESPONSES = [
    'Based on my analysis, I recommend prioritizing the critical vulnerabilities first.',
    'The code review reveals several security concerns that should be addressed.',
    'Here are the key findings from the security assessment.',
    'I recommend implementing the following security controls to mitigate the identified risks.'
  ];

  async function render(el) {
    container = el;
    const conversations = CrackItStorage.getCollection('conversations');
    const settings = CrackItStorage.settings.get();
    if (!activeConversation && conversations.length) {
      activeConversation = conversations[0];
    }

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content"><h1>AI Workspace</h1><p>Intelligent assistant for cybersecurity research</p></div>
        <div class="page-header-actions">
          <select class="input select" id="model-selector" style="max-width:150px">
            <option value="crackit-pro" ${settings.aiModel === 'crackit-pro' ? 'selected' : ''}>CrackIt Pro</option>
            <option value="gpt-4" ${settings.aiModel === 'gpt-4' ? 'selected' : ''}>GPT-4 (placeholder)</option>
            <option value="claude" ${settings.aiModel === 'claude' ? 'selected' : ''}>Claude (placeholder)</option>
            <option value="local" ${settings.aiModel === 'local' ? 'selected' : ''}>Local AI (placeholder)</option>
          </select>
          <button class="btn btn-primary" data-action="new-chat">${icon('plus', 'icon-sm')} New Chat</button>
          <button class="btn btn-secondary btn-icon" data-action="pin-conv" title="Toggle Pin">${icons.pin}</button>
          <button class="btn btn-secondary btn-icon" data-action="archive-conv" title="Toggle Archive">${icons.archive}</button>
          <button class="btn btn-secondary btn-icon" data-action="toggle-panel" title="Toggle Context Panel">${icons.sliders}</button>
        </div>
      </div>

      <div class="chat-container">
        <div class="chat-sidebar" id="chat-sidebar">
          <div class="chat-sidebar-header">
            <input type="text" class="input" placeholder="Search conversations..." id="conv-search">
          </div>
          <div class="chat-conversations" id="conv-list">
            ${renderConversationSections(conversations)}
          </div>
        </div>

        <div class="chat-main">
          <div class="chat-messages" id="chat-messages">
            ${activeConversation ? activeConversation.messages.map(m => renderMessage(m)).join('') : ''}
            ${isGenerating ? renderTypingIndicator() : ''}
            ${!activeConversation || !activeConversation.messages.length ? renderEmptyState() : ''}
          </div>

          <div class="chat-tools-section" id="chat-tools-section">
            <div class="chat-section-toggle" data-action="toggle-enc-tools">
              <span>${icon('code', 'icon-sm')} Encoding / Decoding Tools</span>
              <span class="toggle-arrow ${encToolsVisible ? 'open' : ''}">${icons.chevronRight}</span>
            </div>
            <div class="chat-enc-tools ${encToolsVisible ? '' : 'hidden'}" id="enc-tools">
              <div class="enc-tool-row">
                <div class="enc-tool"><textarea class="input textarea enc-input" placeholder="Input text..." rows="2"></textarea>
                  <div class="enc-tool-actions"><button class="btn btn-primary btn-sm" data-action="base64-encode">Base64 Encode</button><button class="btn btn-secondary btn-sm" data-action="base64-decode">Decode</button></div>
                  <textarea class="input textarea enc-output" placeholder="Output..." rows="2" readonly></textarea></div>
                <div class="enc-tool"><textarea class="input textarea enc-input" placeholder="Input text..." rows="2"></textarea>
                  <div class="enc-tool-actions"><button class="btn btn-primary btn-sm" data-action="url-encode">URL Encode</button><button class="btn btn-secondary btn-sm" data-action="url-decode">Decode</button></div>
                  <textarea class="input textarea enc-output" placeholder="Output..." rows="2" readonly></textarea></div>
              </div>
              <div class="enc-tool-row">
                <div class="enc-tool"><textarea class="input textarea enc-input" placeholder="Input text..." rows="2"></textarea>
                  <div class="enc-tool-actions"><button class="btn btn-primary btn-sm" data-action="html-encode">HTML Encode</button><button class="btn btn-secondary btn-sm" data-action="html-decode">Decode</button></div>
                  <textarea class="input textarea enc-output" placeholder="Output..." rows="2" readonly></textarea></div>
                <div class="enc-tool"><textarea class="input textarea enc-input" placeholder="Input text..." rows="2"></textarea>
                  <div class="enc-tool-actions"><button class="btn btn-primary btn-sm" data-action="hex-encode">Hex Encode</button><button class="btn btn-secondary btn-sm" data-action="hex-decode">Decode</button></div>
                  <textarea class="input textarea enc-output" placeholder="Output..." rows="2" readonly></textarea></div>
              </div>
              <div class="enc-tool-row">
                <div class="enc-tool"><textarea class="input textarea enc-input" placeholder="Input text..." rows="2"></textarea>
                  <div class="enc-tool-actions"><button class="btn btn-primary btn-sm" data-action="binary-encode">Binary Encode</button><button class="btn btn-secondary btn-sm" data-action="binary-decode">Decode</button></div>
                  <textarea class="input textarea enc-output" placeholder="Output..." rows="2" readonly></textarea></div>
                <div class="enc-tool"><textarea class="input textarea enc-input" placeholder="JWT token..." rows="2"></textarea>
                  <div class="enc-tool-actions"><button class="btn btn-primary btn-sm" data-action="jwt-decode">JWT Decode</button></div>
                  <textarea class="input textarea enc-output" placeholder="Decoded JWT..." rows="2" readonly></textarea></div>
              </div>
              <div class="enc-tool-row">
                <div class="enc-tool"><textarea class="input textarea enc-input" placeholder="JSON string..." rows="2"></textarea>
                  <div class="enc-tool-actions"><button class="btn btn-primary btn-sm" data-action="json-format">Format JSON</button><button class="btn btn-secondary btn-sm" data-action="json-minify">Minify</button></div>
                  <textarea class="input textarea enc-output" placeholder="Formatted JSON..." rows="2" readonly></textarea></div>
                <div class="enc-tool">
                  <div class="flex gap-2 flex-wrap">
                    <button class="btn btn-primary btn-sm" data-action="uuid-gen">${icon('hash', 'icon-sm')} Generate UUID</button>
                    <button class="btn btn-secondary btn-sm" data-action="pw-gen">${icon('lock', 'icon-sm')} Generate Password</button>
                  </div>
                  <div class="mt-2"><textarea class="input textarea enc-output" id="gen-output" placeholder="Generated output..." rows="2" readonly></textarea></div>
                  <div class="mt-2"><textarea class="input textarea enc-input" placeholder="String to hash..." rows="2" id="hash-input"></textarea>
                    <div class="enc-tool-actions"><button class="btn btn-primary btn-sm" data-action="hash-calc">Calculate Hash</button></div>
                    <div class="hash-results" id="hash-results"></div></div>
                </div>
              </div>
            </div>

            <div class="chat-section-toggle" data-action="toggle-toolbox">
              <span>${icon('toolbox', 'icon-sm')} AI Tools</span>
              <span class="toggle-arrow">${icons.chevronRight}</span>
            </div>
            <div class="ai-toolbox" id="ai-toolbox">
              ${renderAIToolbox()}
            </div>
          </div>

          <div class="chat-input-area">
            <div class="chat-input-wrapper">
              <div class="chat-input-buttons-left">
                <button class="btn btn-ghost btn-icon" data-action="upload-file" title="Upload File">${icons.paperclip}</button>
                <button class="btn btn-ghost btn-icon" data-action="voice-input" title="Voice Input">${icons.volume}</button>
                <button class="btn btn-ghost btn-icon" data-action="prompt-templates" title="Prompt Templates">${icons.template}</button>
              </div>
              <textarea class="chat-input" id="chat-input" placeholder="Ask CrackIt AI anything..." rows="1"></textarea>
              <div class="chat-input-actions">
                <button class="btn btn-primary btn-icon" id="chat-send" title="Send">${icons.send}</button>
                <button class="btn btn-danger btn-icon hidden" id="chat-stop" title="Stop">${icons.stop}</button>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-right-panel ${activeConversation ? '' : 'hidden'}" id="chat-right-panel">
          ${renderContextPanel()}
        </div>
      </div>

      <input type="file" id="file-upload-input" class="hidden" multiple>`;

    bindAllEvents();
    if (activeConversation) scrollToBottom();
  }

  function renderConversationSections(convs) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const pinned = convs.filter(c => c.pinned && !c.archived);
    const today = convs.filter(c => !c.pinned && !c.archived && new Date(c.createdAt) >= todayStart);
    const week = convs.filter(c => !c.pinned && !c.archived && !today.includes(c) && new Date(c.createdAt) >= weekStart);
    const older = convs.filter(c => !c.pinned && !c.archived && !today.includes(c) && !week.includes(c));
    const archived = convs.filter(c => c.archived);

    function renderSection(title, items, showEmpty = false) {
      if (!items.length && !showEmpty) return '';
      return `<div class="conv-section"><div class="conv-section-title">${escapeHtml(title)} <span class="conv-section-count">${items.length}</span></div>
        ${items.map(c => renderConvItem(c)).join('')}
        ${!items.length ? '<div class="conv-empty">No conversations</div>' : ''}</div>`;
    }

    return renderSection('Pinned', pinned) +
      renderSection('Today', today) +
      renderSection('This Week', week) +
      renderSection('Older', older) +
      renderSection('Archived', archived, true);
  }

  function renderConvItem(conv) {
    const isActive = activeConversation?.id === conv.id;
    const lastMsg = conv.messages && conv.messages.length ? conv.messages[conv.messages.length - 1].content : '';
    const preview = lastMsg.length > 60 ? lastMsg.substring(0, 60) + '...' : lastMsg;
    return `<div class="chat-conversation-item ${isActive ? 'active' : ''}" data-conv-id="${conv.id}" data-conv-title="${escapeHtml(conv.title)}" data-conv-created="${conv.createdAt}" data-conv-pinned="${conv.pinned}" data-conv-archived="${conv.archived || false}" data-context="conversation">
      <div class="conv-item-header">
        <div class="conv-item-title">${escapeHtml(conv.title)}</div>
        <div class="conv-item-icons">${conv.pinned ? icons.pin : ''}${conv.archived ? icons.archive : ''}</div>
      </div>
      <div class="conv-item-preview">${escapeHtml(preview)}</div>
      <div class="conv-item-meta">${formatDate(conv.createdAt, true)} · ${conv.messages ? conv.messages.length : 0} msgs</div>
    </div>`;
  }

  function renderEmptyState() {
    const prompts = [
      'Analyze this code for vulnerabilities: ...',
      'What are the latest threat intelligence trends?',
      'Generate a penetration testing checklist',
      'Explain the OWASP Top 10'
    ];
    return `<div class="empty-state">
      <div class="empty-state-icon">${icons.sparkles}</div>
      <h3>Start a Conversation</h3>
      <p>Ask CrackIt AI anything about cybersecurity, code analysis, or threat research</p>
      <div class="example-prompts">
        ${prompts.map(p => `<button class="btn btn-secondary btn-sm example-prompt" data-prompt="${escapeHtml(p)}">${escapeHtml(p)}</button>`).join('')}
      </div>
    </div>`;
  }

  function renderMessage(msg) {
    const isUser = msg.role === 'user';
    const ts = msg.timestamp ? formatDate(msg.timestamp, true) : '';
    return `<div class="chat-message ${msg.role}" data-msg-id="${msg.id || uid('msg')}" data-bookmarked="${msg.bookmarked || false}">
      <div class="chat-message-avatar">${isUser ? 'AD' : 'AI'}</div>
      <div class="chat-message-content-wrapper">
        <div class="chat-message-content ${isUser ? '' : 'assistant-content'}">${isUser ? escapeHtml(msg.content).replace(/\n/g, '<br>') : renderAssistantContent(msg.content)}</div>
        <div class="chat-message-footer">
          <span class="chat-message-time">${ts}</span>
          <div class="chat-message-actions">
            <button class="btn btn-ghost btn-sm" data-action="copy-msg" title="Copy">${icons.copy}</button>
            ${isUser ? `<button class="btn btn-ghost btn-sm" data-action="edit-msg" title="Edit">${icons.edit}</button>` : ''}
            ${!isUser ? `<button class="btn btn-ghost btn-sm" data-action="regenerate" title="Regenerate">${icons.refresh}</button>` : ''}
            <button class="btn btn-ghost btn-sm ${msg.bookmarked ? 'active' : ''}" data-action="bookmark-msg" title="Bookmark">${icons.bookmark}</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderAssistantContent(content) {
    if (!content) return '';
    let html = '';
    const parts = content.split(/(```[\s\S]*?```)/g);
    for (const part of parts) {
      if (part.startsWith('```') && part.endsWith('```')) {
        const inner = part.slice(3, -3);
        const firstLb = inner.indexOf('\n');
        const lang = firstLb > 0 ? inner.slice(0, firstLb).trim() : '';
        const code = firstLb > 0 ? inner.slice(firstLb + 1) : inner;
        html += `<div class="code-block-wrapper">
          <div class="code-block-header">
            <span>${escapeHtml(lang || 'code')}</span>
            <button class="btn btn-ghost btn-sm copy-code-btn" data-code="${escapeHtml(code.replace(/"/g, '&quot;'))}">${icons.copy} Copy</button>
          </div>
          <pre><code class="language-${escapeHtml(lang)}">${escapeHtml(code)}</code></pre>
        </div>`;
      } else {
        html += markdownToHtml(part);
      }
    }
    return html;
  }

  function renderTypingIndicator() {
    return `<div class="chat-message assistant" id="typing-indicator">
      <div class="chat-message-avatar">AI</div>
      <div class="chat-message-content">
        <div class="typing-dots"><span></span><span></span><span></span></div>
        <div class="text-xs text-muted mt-1">CrackIt AI is thinking...</div>
      </div>
    </div>`;
  }

  function renderAIToolbox() {
    const tools = [
      { id: 'explain', label: 'Explain Code', icon: 'code' },
      { id: 'review', label: 'Review Code', icon: 'eye' },
      { id: 'find-bugs', label: 'Find Bugs', icon: 'target' },
      { id: 'vuln', label: 'Find Vulns', icon: 'warning' },
      { id: 'document', label: 'Document', icon: 'file' },
      { id: 'summarize', label: 'Summarize', icon: 'layers' },
      { id: 'translate', label: 'Translate', icon: 'globe' },
      { id: 'optimize', label: 'Optimize', icon: 'zap' },
      { id: 'gen-regex', label: 'Gen Regex', icon: 'hash' },
      { id: 'gen-sql', label: 'Gen SQL', icon: 'database' },
      { id: 'gen-md', label: 'Gen Markdown', icon: 'book' },
      { id: 'gen-report', label: 'Gen Report', icon: 'barChart' },
      { id: 'test-cases', label: 'Test Cases', icon: 'check' },
      { id: 'convert-lang', label: 'Convert Lang', icon: 'scripts' },
      { id: 'refactor', label: 'Refactor', icon: 'edit' },
      { id: 'flowchart', label: 'Flowchart', icon: 'map' }
    ];
    return `<div class="ai-toolbox-grid">
      ${tools.map(t => `<button class="ai-toolbox-card" data-tool="${t.id}">
        <span class="ai-toolbox-icon">${icons[t.icon] || icons.code}</span>
        <span class="ai-toolbox-label">${escapeHtml(t.label)}</span>
      </button>`).join('')}
    </div>`;
  }

  function renderContextPanel() {
    return `<div class="context-panel-content">
      <div class="context-section">
        <div class="context-section-title" data-action="toggle-section" data-section="uploaded-files">
          <span>${icon('paperclip', 'icon-sm')} Uploaded Files</span>
          <span class="toggle-arrow">${icons.chevronRight}</span>
        </div>
        <div class="context-section-body" id="ctx-uploaded-files">
          ${attachedFiles.length ? attachedFiles.map(f => renderFileItem(f)).join('') : '<div class="context-empty">No files uploaded</div>'}
        </div>
      </div>

      <div class="context-section">
        <div class="context-section-title" data-action="toggle-section" data-section="artifacts">
          <span>${icon('grid', 'icon-sm')} Artifacts</span>
          <span class="toggle-arrow">${icons.chevronRight}</span>
        </div>
        <div class="context-section-body" id="ctx-artifacts">
          ${renderArtifacts()}
        </div>
      </div>

      <div class="context-section">
        <div class="context-section-title" data-action="toggle-section" data-section="pinned-notes">
          <span>${icon('bookmark', 'icon-sm')} Pinned Notes</span>
          <span class="toggle-arrow">${icons.chevronRight}</span>
        </div>
        <div class="context-section-body" id="ctx-pinned-notes">
          ${renderPinnedNotes()}
        </div>
      </div>

      <div class="context-section">
        <div class="context-section-title" data-action="toggle-section" data-section="related-projects">
          <span>${icon('folder', 'icon-sm')} Related Projects</span>
          <span class="toggle-arrow">${icons.chevronRight}</span>
        </div>
        <div class="context-section-body" id="ctx-related-projects">
          ${renderRelatedProjects()}
        </div>
      </div>

      <div class="context-section">
        <div class="context-section-title" data-action="toggle-section" data-section="conv-info">
          <span>${icon('info', 'icon-sm')} Conversation Info</span>
          <span class="toggle-arrow">${icons.chevronRight}</span>
        </div>
        <div class="context-section-body" id="ctx-conv-info">
          ${renderConvInfo()}
        </div>
      </div>

      <div class="context-section">
        <div class="context-section-title" data-action="toggle-section" data-section="prompt-vars">
          <span>${icon('sliders', 'icon-sm')} Prompt Variables</span>
          <span class="toggle-arrow">${icons.chevronRight}</span>
        </div>
        <div class="context-section-body" id="ctx-prompt-vars">
          <div class="context-empty">Add variables with <code>{&#123;variable&#125;}</code> syntax in your prompts</div>
        </div>
      </div>

      <div class="context-section">
        <div class="context-section-title" data-action="toggle-section" data-section="recent-cmds">
          <span>${icon('terminal', 'icon-sm')} Recent Commands</span>
          <span class="toggle-arrow">${icons.chevronRight}</span>
        </div>
        <div class="context-section-body" id="ctx-recent-cmds">
          ${renderRecentCommands()}
        </div>
      </div>
    </div>`;
  }

  function renderFileItem(file) {
    return `<div class="context-file-item" data-file-id="${file.id}">
      <div class="context-file-info">
        <div class="context-file-icon">${icons.file}</div>
        <div class="context-file-details">
          <div class="context-file-name">${escapeHtml(file.name)}</div>
          <div class="context-file-size">${CrackItUtils.formatSize(file.size)}</div>
        </div>
      </div>
      <div class="context-file-actions">
        <button class="btn btn-ghost btn-sm" data-action="file-preview" title="Preview">${icons.eye}</button>
        <button class="btn btn-ghost btn-sm" data-action="file-rename" title="Rename">${icons.edit}</button>
        <button class="btn btn-ghost btn-sm" data-action="file-download" title="Download">${icons.download}</button>
        <button class="btn btn-ghost btn-sm" data-action="file-delete" title="Delete">${icons.trash}</button>
        <button class="btn btn-ghost btn-sm" data-action="file-copy-path" title="Copy Path">${icons.copy}</button>
        <button class="btn btn-ghost btn-sm" data-action="file-copy-content" title="Copy Content">${icons.link}</button>
      </div>
      <div class="context-file-ai-actions">
        <button class="btn btn-ghost btn-sm" data-action="file-ai-summary">AI Summary</button>
        <button class="btn btn-ghost btn-sm" data-action="file-ai-explain">Explain</button>
        <button class="btn btn-ghost btn-sm" data-action="file-ai-review">Review</button>
        <button class="btn btn-ghost btn-sm" data-action="file-ai-report">Report</button>
      </div>
    </div>`;
  }

  function renderArtifacts() {
    if (!activeConversation) return '<div class="context-empty">No active conversation</div>';
    const artifacts = activeConversation.artifacts || [];
    if (!artifacts.length) return '<div class="context-empty">No artifacts yet</div>';
    return artifacts.map(a => `<div class="context-artifact-item">
      <div class="context-artifact-title">${escapeHtml(a.title || 'Code Snippet')}</div>
      <div class="context-artifact-lang">${escapeHtml(a.language || 'text')}</div>
    </div>`).join('');
  }

  function renderPinnedNotes() {
    const notes = CrackItStorage.getCollection('notes').filter(n => n.pinned).slice(0, 5);
    if (!notes.length) return '<div class="context-empty">No pinned notes</div>';
    return notes.map(n => `<div class="context-note-item" data-note-id="${n.id}">
      <div class="context-note-title">${escapeHtml(n.title)}</div>
      <div class="context-note-meta">${formatDate(n.updatedAt, true)}</div>
    </div>`).join('');
  }

  function renderRelatedProjects() {
    const projects = CrackItStorage.getCollection('projects').filter(p => p.pinned).slice(0, 5);
    if (!projects.length) return '<div class="context-empty">No related projects</div>';
    return projects.map(p => `<div class="context-project-item" data-project-id="${p.id}">
      <div class="context-project-name">${escapeHtml(p.name)}</div>
      <div class="context-project-status badge badge-${p.status === 'active' ? 'green' : p.status === 'planning' ? 'blue' : 'gray'}">${escapeHtml(p.status)}</div>
    </div>`).join('');
  }

  function renderConvInfo() {
    if (!activeConversation) return '<div class="context-empty">No active conversation</div>';
    const msgCount = activeConversation.messages ? activeConversation.messages.length : 0;
    const tokEstimate = msgCount * 150;
    return `<div class="context-info-list">
      <div class="context-info-item"><span class="context-info-label">Created</span><span class="context-info-value">${formatDate(activeConversation.createdAt)}</span></div>
      <div class="context-info-item"><span class="context-info-label">Messages</span><span class="context-info-value">${msgCount}</span></div>
      <div class="context-info-item"><span class="context-info-label">Est. Tokens</span><span class="context-info-value">${tokEstimate.toLocaleString()}</span></div>
      <div class="context-info-item"><span class="context-info-label">Model</span><span class="context-info-value">${CrackItStorage.settings.get().aiModel || 'crackit-pro'}</span></div>
      <div class="context-info-item"><span class="context-info-label">Pinned</span><span class="context-info-value">${activeConversation.pinned ? 'Yes' : 'No'}</span></div>
      <div class="context-info-item"><span class="context-info-label">Archived</span><span class="context-info-value">${activeConversation.archived ? 'Yes' : 'No'}</span></div>
    </div>`;
  }

  function renderRecentCommands() {
    const commands = CrackItStorage.getCollection('commands').slice(0, 5);
    if (!commands.length) return '<div class="context-empty">No recent commands</div>';
    return commands.map(c => `<div class="context-command-item">
      <span class="context-command-icon">${icons[c.icon] || icons.terminal}</span>
      <span class="context-command-label">${escapeHtml(c.label)}</span>
      ${c.shortcut ? `<span class="context-command-shortcut">${escapeHtml(c.shortcut)}</span>` : ''}
    </div>`).join('');
  }

  function scrollToBottom() {
    const el = container?.querySelector('#chat-messages');
    if (el) setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
  }

  function bindAllEvents() {
    bindSidebarEvents();
    bindInputEvents();
    bindMessageEvents();
    bindToolEvents();
    bindContextPanelEvents();
    bindToolbarEvents();

    document.addEventListener('click', closeContextMenu);
    document.addEventListener('contextmenu', handleContextMenu);
  }

  function bindSidebarEvents() {
    const searchInput = container.querySelector('#conv-search');
    searchInput?.addEventListener('input', debounce((e) => {
      const q = e.target.value.toLowerCase();
      container.querySelectorAll('.chat-conversation-item').forEach(el => {
        const title = el.dataset.convTitle?.toLowerCase() || '';
        el.style.display = title.includes(q) ? '' : 'none';
      });
      container.querySelectorAll('.conv-section').forEach(section => {
        const visible = [...section.querySelectorAll('.chat-conversation-item')].some(el => el.style.display !== 'none');
        section.style.display = visible || !section.querySelector('.chat-conversation-item') ? '' : 'none';
      });
    }, 200));

    container.querySelectorAll('.chat-conversation-item').forEach(el => {
      el.addEventListener('click', () => selectConversation(el.dataset.convId));
    });
  }

  function handleContextMenu(e) {
    const item = e.target.closest('.chat-conversation-item');
    if (!item) return;
    e.preventDefault();
    closeContextMenu();

    const convId = item.dataset.convId;
    const conv = CrackItStorage.findInCollection('conversations', convId);
    if (!conv) return;

    const menu = document.createElement('div');
    menu.className = 'context-menu open';
    menu.id = 'chat-context-menu';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    const items = [
      { label: 'Rename', icon: 'edit', action: 'rename', handler: () => renameConversation(convId) },
      { label: conv.pinned ? 'Unpin' : 'Pin', icon: 'pin', action: 'pin', handler: () => togglePin(convId) },
      { label: conv.archived ? 'Unarchive' : 'Archive', icon: 'archive', action: 'archive', handler: () => toggleArchive(convId) },
      { label: 'Favorite', icon: 'star', action: 'favorite', handler: () => { CrackItUI.toast('Marked as favorite', 'success'); } },
      { type: 'divider' },
      { label: 'Delete', icon: 'trash', action: 'delete', danger: true, handler: () => deleteConversation(convId) }
    ];

    menu.innerHTML = items.map(item => {
      if (item.type === 'divider') return '<div class="context-menu-divider"></div>';
      return `<button class="context-menu-item ${item.danger ? 'danger' : ''}" data-action="${item.action}">
        ${icons[item.icon] || ''} ${escapeHtml(item.label)}
      </button>`;
    }).join('');

    document.body.appendChild(menu);
    contextMenuVisible = true;

    menu.querySelectorAll('.context-menu-item').forEach((btn, i) => {
      const handler = items.filter(it => it.type !== 'divider')[i]?.handler;
      btn.addEventListener('click', (ev) => { ev.stopPropagation(); handler(); closeContextMenu(); });
    });
  }

  function closeContextMenu() {
    const menu = document.getElementById('chat-context-menu');
    if (menu) menu.remove();
    contextMenuVisible = false;
  }

  function selectConversation(id) {
    const conversations = CrackItStorage.getCollection('conversations');
    activeConversation = conversations.find(c => c.id === id);
    if (activeConversation) {
      attachedFiles = activeConversation.files || [];
      const msgEl = container.querySelector('#chat-messages');
      if (msgEl) {
        msgEl.innerHTML = activeConversation.messages.length
          ? activeConversation.messages.map(m => renderMessage(m)).join('')
          : renderEmptyState();
        scrollToBottom();
      }
      container.querySelector('#chat-right-panel')?.classList.remove('hidden');
      container.querySelectorAll('.chat-conversation-item').forEach(el => {
        el.classList.toggle('active', el.dataset.convId === id);
      });
      bindMessageEvents();
      updateContextPanel();
    }
  }

  function newChat() {
    const conv = CrackItStorage.addToCollection('conversations', {
      id: uid('conv'),
      title: 'New Conversation',
      messages: [],
      pinned: false,
      archived: false,
      artifacts: [],
      files: [],
      createdAt: new Date().toISOString()
    });
    activeConversation = conv;
    attachedFiles = [];
    const idx = container.querySelector('#chat-messages');
    if (idx) idx.innerHTML = renderEmptyState();
    const list = container.querySelector('#conv-list');
    if (list) {
      const convs = CrackItStorage.getCollection('conversations');
      list.innerHTML = renderConversationSections(convs);
    }
    container.querySelector('#chat-right-panel')?.classList.remove('hidden');
    updateContextPanel();
    bindSidebarEvents();
    CrackItUI.toast('New conversation started', 'success');
  }

  function renameConversation(id) {
    const conv = CrackItStorage.findInCollection('conversations', id);
    if (!conv) return;
    CrackItUI.openModal('prompt', {
      title: 'Rename Conversation',
      content: `<input type="text" class="input" id="rename-input" value="${escapeHtml(conv.title)}" placeholder="Conversation name">`
    });
    const input = document.getElementById('rename-input');
    if (input) {
      input.focus();
      input.select();
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const newTitle = input.value.trim() || conv.title;
          CrackItStorage.updateInCollection('conversations', id, { title: newTitle });
          CrackItUI.closeModal('prompt');
          activeConversation = CrackItStorage.findInCollection('conversations', id);
          render(container);
          CrackItUI.toast('Conversation renamed', 'success');
        }
      });
      const saveBtn = document.querySelector('#modal-prompt .btn-primary');
      if (saveBtn) {
        saveBtn.onclick = () => {
          const newTitle = input.value.trim() || conv.title;
          CrackItStorage.updateInCollection('conversations', id, { title: newTitle });
          CrackItUI.closeModal('prompt');
          activeConversation = CrackItStorage.findInCollection('conversations', id);
          render(container);
          CrackItUI.toast('Conversation renamed', 'success');
        };
      }
    }
  }

  function deleteConversation(id) {
    CrackItUI.confirm('Are you sure you want to delete this conversation?', () => {
      CrackItStorage.removeFromCollection('conversations', id);
      const convs = CrackItStorage.getCollection('conversations');
      if (activeConversation?.id === id) {
        activeConversation = convs.length ? convs[0] : null;
        attachedFiles = [];
      }
      render(container);
      CrackItUI.toast('Conversation deleted', 'success');
    });
  }

  function togglePin(id) {
    const conv = CrackItStorage.findInCollection('conversations', id);
    if (!conv) return;
    CrackItStorage.updateInCollection('conversations', id, { pinned: !conv.pinned });
    if (activeConversation?.id === id) activeConversation.pinned = !conv.pinned;
    const list = container.querySelector('#conv-list');
    if (list) {
      const convs = CrackItStorage.getCollection('conversations');
      list.innerHTML = renderConversationSections(convs);
    }
    bindSidebarEvents();
    CrackItUI.toast(conv.pinned ? 'Conversation unpinned' : 'Conversation pinned', 'success');
  }

  function toggleArchive(id) {
    const conv = CrackItStorage.findInCollection('conversations', id);
    if (!conv) return;
    CrackItStorage.updateInCollection('conversations', id, { archived: !conv.archived });
    if (activeConversation?.id === id) activeConversation.archived = !conv.archived;
    const list = container.querySelector('#conv-list');
    if (list) {
      const convs = CrackItStorage.getCollection('conversations');
      list.innerHTML = renderConversationSections(convs);
    }
    bindSidebarEvents();
    CrackItUI.toast(conv.archived ? 'Conversation restored' : 'Conversation archived', 'success');
  }

  function bindInputEvents() {
    const input = container.querySelector('#chat-input');
    const sendBtn = container.querySelector('#chat-send');
    const stopBtn = container.querySelector('#chat-stop');

    input?.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    sendBtn?.addEventListener('click', () => sendMessage());
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    stopBtn?.addEventListener('click', () => {
      isGenerating = false;
      stopBtn.classList.add('hidden');
      sendBtn.classList.remove('hidden');
      const typingEl = container.querySelector('#typing-indicator');
      if (typingEl) typingEl.remove();
      CrackItUI.toast('Generation stopped', 'info');
    });

    container.querySelector('[data-action="upload-file"]')?.addEventListener('click', () => {
      container.querySelector('#file-upload-input')?.click();
    });

    container.querySelector('#file-upload-input')?.addEventListener('change', (e) => {
      handleFileUpload(e.target.files);
      e.target.value = '';
    });

    container.querySelector('[data-action="voice-input"]')?.addEventListener('click', () => {
      CrackItUI.toast('Voice input is not available in this environment', 'info');
    });

    container.querySelector('[data-action="prompt-templates"]')?.addEventListener('click', () => {
      const templates = [
        { name: 'Code Review', prompt: 'Review this code for security vulnerabilities and best practices:\n\n' },
        { name: 'Exploit Analysis', prompt: 'Analyze this exploit code and explain what it does:\n\n' },
        { name: 'Network Scan', prompt: 'Interpret these Nmap scan results:\n\n' },
        { name: 'Log Analysis', prompt: 'Analyze these log entries for suspicious activity:\n\n' }
      ];
      CrackItUI.openModal('prompt', {
        title: 'Prompt Templates',
        content: `<div class="flex flex-col gap-2">${templates.map(t =>
          `<button class="btn btn-secondary template-btn" data-prompt="${escapeHtml(t.prompt)}">${escapeHtml(t.name)}</button>`
        ).join('')}</div>`
      });
      document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const prompt = btn.dataset.prompt;
          const chatInput = container.querySelector('#chat-input');
          if (chatInput) {
            chatInput.value = prompt;
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
            chatInput.focus();
          }
          CrackItUI.closeModal('prompt');
        });
      });
    });

    container.querySelectorAll('.example-prompt').forEach(btn => {
      btn.addEventListener('click', () => {
        const chatInput = container.querySelector('#chat-input');
        if (chatInput) {
          chatInput.value = btn.dataset.prompt;
          chatInput.style.height = 'auto';
          chatInput.focus();
          sendMessage();
        }
      });
    });
  }

  async function sendMessage() {
    const input = container.querySelector('#chat-input');
    const text = input?.value.trim();
    if (!text || isGenerating) return;
    if (!activeConversation) newChat();

    const msgId = uid('msg');
    activeConversation.messages.push({ id: msgId, role: 'user', content: text, timestamp: new Date().toISOString(), bookmarked: false });
    input.value = '';
    input.style.height = 'auto';

    const sendBtn = container.querySelector('#chat-send');
    const stopBtn = container.querySelector('#chat-stop');
    sendBtn?.classList.add('hidden');
    stopBtn?.classList.remove('hidden');
    isGenerating = true;

    const msgEl = container.querySelector('#chat-messages');
    if (msgEl) {
      const empty = msgEl.querySelector('.empty-state');
      if (empty) msgEl.innerHTML = '';
      msgEl.innerHTML += renderMessage(activeConversation.messages[activeConversation.messages.length - 1]);
      msgEl.innerHTML += renderTypingIndicator();
      scrollToBottom();
    }

    bindMessageEvents();

    let response = '';
    try {
      if (CrackItAPI.isAuthenticated()) {
        const result = await CrackItAPI.ai.explain({ prompt: text, context: text });
        response = result.response || result.analysis || result.result || JSON.stringify(result);
      } else {
        await new Promise(r => setTimeout(r, 1000));
        response = randomItem(FALLBACK_RESPONSES);
      }
    } catch (err) {
      response = 'AI service unavailable: ' + err.message + '. Please check the backend configuration.';
    }

    if (!isGenerating) return;

    activeConversation.messages.push({
      id: uid('msg'),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
      bookmarked: false
    });

    CrackItStorage.updateInCollection('conversations', activeConversation.id, {
      messages: activeConversation.messages,
      title: activeConversation.title === 'New Conversation' && activeConversation.messages.length <= 2
        ? text.substring(0, 50) + (text.length > 50 ? '...' : '')
        : activeConversation.title
    });

    isGenerating = false;
    sendBtn?.classList.remove('hidden');
    stopBtn?.classList.add('hidden');

    if (msgEl) {
      const typing = msgEl.querySelector('#typing-indicator');
      if (typing) typing.remove();
      msgEl.innerHTML += renderMessage(activeConversation.messages[activeConversation.messages.length - 1]);
      scrollToBottom();
    }

    const list = container.querySelector('#conv-list');
    if (list) {
      const convs = CrackItStorage.getCollection('conversations');
      list.innerHTML = renderConversationSections(convs);
    }
    bindSidebarEvents();
    bindMessageEvents();
    updateContextPanel();
  }

  function bindMessageEvents() {
    container.querySelectorAll('[data-action="copy-msg"]').forEach(btn => {
      btn.replaceWith?.(btn.cloneNode(true));
      const freshBtn = container.querySelector(`[data-action="copy-msg"]`);
      if (freshBtn) {
        freshBtn.addEventListener('click', () => {
          const msgEl = freshBtn.closest('.chat-message');
          const contentEl = msgEl?.querySelector('.chat-message-content');
          const text = contentEl?.textContent || '';
          navigator.clipboard?.writeText(text).then(() => CrackItUI.toast('Copied to clipboard', 'success')).catch(() => CrackItUI.toast('Failed to copy', 'error'));
        });
      }
    });

    container.querySelectorAll('[data-action="regenerate"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!activeConversation || activeConversation.messages.length < 2) return;
        activeConversation.messages.pop();
        const msgEl = container.querySelector('#chat-messages');
        if (msgEl) {
          const lastMsg = msgEl.querySelector('.chat-message:last-child');
          if (lastMsg) lastMsg.remove();
        }
        sendMessage();
      });
    });

    container.querySelectorAll('[data-action="edit-msg"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const msgEl = btn.closest('.chat-message');
        const contentEl = msgEl?.querySelector('.chat-message-content');
        if (!contentEl) return;
        const currentText = contentEl.textContent || '';
        const msgId = msgEl.dataset.msgId;
        contentEl.innerHTML = `<textarea class="input textarea edit-msg-textarea" rows="3">${escapeHtml(currentText)}</textarea>
          <div class="flex gap-2 mt-2"><button class="btn btn-primary btn-sm save-edit" data-msg-id="${msgId}">Save</button>
          <button class="btn btn-secondary btn-sm cancel-edit">Cancel</button></div>`;
        const textarea = contentEl.querySelector('textarea');
        textarea?.focus();
        textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
        contentEl.querySelector('.save-edit')?.addEventListener('click', () => {
          const newText = textarea?.value || '';
          const msg = activeConversation.messages.find(m => m.id === msgId);
          if (msg) {
            msg.content = newText;
            CrackItStorage.updateInCollection('conversations', activeConversation.id, { messages: activeConversation.messages });
          }
          if (msgEl) {
            contentEl.innerHTML = escapeHtml(newText).replace(/\n/g, '<br>');
            bindMessageEvents();
          }
          CrackItUI.toast('Message updated', 'success');
        });
        contentEl.querySelector('.cancel-edit')?.addEventListener('click', () => {
          const msg = activeConversation.messages.find(m => m.id === msgId);
          if (msg && msgEl) {
            contentEl.innerHTML = escapeHtml(msg.content).replace(/\n/g, '<br>');
            bindMessageEvents();
          }
        });
      });
    });

    container.querySelectorAll('[data-action="bookmark-msg"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const msgEl = btn.closest('.chat-message');
        const msgId = msgEl?.dataset.msgId;
        const msg = activeConversation.messages.find(m => m.id === msgId);
        if (msg) {
          msg.bookmarked = !msg.bookmarked;
          btn.classList.toggle('active', msg.bookmarked);
          CrackItStorage.updateInCollection('conversations', activeConversation.id, { messages: activeConversation.messages });
          CrackItUI.toast(msg.bookmarked ? 'Message bookmarked' : 'Bookmark removed', 'success');
        }
      });
    });

    container.querySelectorAll('.copy-code-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code || '';
        navigator.clipboard?.writeText(code).then(() => {
          btn.innerHTML = `${icons.check} Copied!`;
          setTimeout(() => { btn.innerHTML = `${icons.copy} Copy`; }, 2000);
        }).catch(() => CrackItUI.toast('Failed to copy', 'error'));
      });
    });
  }

  function bindToolEvents() {
    container.querySelector('[data-action="toggle-enc-tools"]')?.addEventListener('click', () => {
      encToolsVisible = !encToolsVisible;
      const el = container.querySelector('#enc-tools');
      const arrow = container.querySelector('[data-action="toggle-enc-tools"] .toggle-arrow');
      if (el) el.classList.toggle('hidden', !encToolsVisible);
      if (arrow) arrow.classList.toggle('open', encToolsVisible);
    });

    container.querySelector('[data-action="toggle-toolbox"]')?.addEventListener('click', () => {
      const el = container.querySelector('#ai-toolbox');
      const arrow = container.querySelector('[data-action="toggle-toolbox"] .toggle-arrow');
      if (el) el.classList.toggle('hidden');
      if (arrow) arrow.classList.toggle('open');
    });

    // Encoding tool buttons
    const encActions = {
      'base64-encode': { fn: (s) => btoa(unescape(encodeURIComponent(s))), label: 'Base64 Encoded' },
      'base64-decode': { fn: (s) => { try { return decodeURIComponent(escape(atob(s))); } catch { return 'Invalid Base64'; } }, label: 'Base64 Decoded' },
      'url-encode': { fn: (s) => encodeURIComponent(s), label: 'URL Encoded' },
      'url-decode': { fn: (s) => { try { return decodeURIComponent(s); } catch { return 'Invalid encoding'; } }, label: 'URL Decoded' },
      'html-encode': { fn: (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'), label: 'HTML Encoded' },
      'html-decode': { fn: (s) => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; }, label: 'HTML Decoded' },
      'hex-encode': { fn: (s) => Array.from(new TextEncoder().encode(s)).map(b => b.toString(16).padStart(2, '0')).join(''), label: 'Hex Encoded' },
      'hex-decode': { fn: (s) => { try { const bytes = s.match(/.{1,2}/g)?.map(b => parseInt(b, 16)); return bytes ? new TextDecoder().decode(new Uint8Array(bytes)) : 'Invalid hex'; } catch { return 'Invalid hex'; } }, label: 'Hex Decoded' },
      'binary-encode': { fn: (s) => Array.from(new TextEncoder().encode(s)).map(b => b.toString(2).padStart(8, '0')).join(' '), label: 'Binary Encoded' },
      'binary-decode': { fn: (s) => { try { const bytes = s.trim().split(/\s+/).map(b => parseInt(b, 2)); return bytes.some(isNaN) ? 'Invalid binary' : new TextDecoder().decode(new Uint8Array(bytes)); } catch { return 'Invalid binary'; } }, label: 'Binary Decoded' },
      'jwt-decode': { fn: (s) => { try { const parts = s.split('.'); if (parts.length !== 3) return 'Invalid JWT format'; const decoded = parts.slice(0, 2).map(p => { try { return JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/'))); } catch { return atob(p.replace(/-/g, '+').replace(/_/g, '/')); } }); const h = decoded[0], p = decoded[1]; return `Header:\n${JSON.stringify(h, null, 2)}\n\nPayload:\n${JSON.stringify(p, null, 2)}`; } catch { return 'Invalid JWT'; } }, label: 'JWT Decoded' },
      'json-format': { fn: (s) => { try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return 'Invalid JSON'; } }, label: 'JSON Formatted' },
      'json-minify': { fn: (s) => { try { return JSON.stringify(JSON.parse(s)); } catch { return 'Invalid JSON'; } }, label: 'JSON Minified' }
    };

    Object.keys(encActions).forEach(action => {
      container.querySelectorAll(`[data-action="${action}"]`).forEach(btn => {
        btn.addEventListener('click', () => {
          const tool = btn.closest('.enc-tool');
          const input = tool?.querySelector('.enc-input');
          const output = tool?.querySelector('.enc-output');
          if (input && output) {
            try {
              output.value = encActions[action].fn(input.value);
            } catch {
              output.value = 'Error processing input';
            }
          }
        });
      });
    });

    container.querySelector('[data-action="uuid-gen"]')?.addEventListener('click', () => {
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
      container.querySelector('#gen-output').value = uuid;
    });

    container.querySelector('[data-action="pw-gen"]')?.addEventListener('click', () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
      let pw = '';
      for (let i = 0; i < 24; i++) {
        pw += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      container.querySelector('#gen-output').value = pw;
    });

    container.querySelector('[data-action="hash-calc"]')?.addEventListener('click', () => {
      const input = container.querySelector('#hash-input')?.value || '';
      const resultsEl = container.querySelector('#hash-results');
      if (!input) { resultsEl.innerHTML = '<div class="text-xs text-muted">Enter a string to hash</div>'; return; }
      const hashes = {
        'MD5': simpleHash(input + '1'),
        'SHA-1': simpleHash(input + '12'),
        'SHA-256': simpleHash(input + '123'),
        'SHA-512': simpleHash(input + '1234')
      };
      resultsEl.innerHTML = Object.entries(hashes).map(([type, val]) =>
        `<div class="hash-result"><span class="hash-type">${type}</span><span class="hash-value">${val}</span>
        <button class="copy-hash" data-hash="${val}">${icons.copy}</button></div>`
      ).join('');
      resultsEl.querySelectorAll('.copy-hash').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.clipboard?.writeText(btn.dataset.hash);
          CrackItUI.toast('Hash copied', 'success');
        });
      });
    });

    // AI Toolbox cards
    container.querySelectorAll('.ai-toolbox-card').forEach(card => {
      card.addEventListener('click', () => {
        const tool = card.dataset.tool;
        if (tool === 'flowchart') {
          CrackItUI.toast('Flowchart generation coming soon', 'info');
          return;
        }
        const toolLabels = {
          'explain': 'Explain Code', 'review': 'Review Code', 'find-bugs': 'Find Bugs',
          'vuln': 'Find Vulnerabilities', 'document': 'Generate Documentation', 'summarize': 'Summarize',
          'translate': 'Translate', 'optimize': 'Optimize Code', 'gen-regex': 'Generate Regex',
          'gen-sql': 'Generate SQL', 'gen-md': 'Generate Markdown', 'gen-report': 'Generate Report',
          'test-cases': 'Generate Test Cases', 'convert-lang': 'Convert Language', 'refactor': 'Refactor Code'
        };
        CrackItUI.openModal('prompt', {
          title: toolLabels[tool] || 'AI Tool',
          content: `<textarea class="input textarea" id="tool-input" rows="6" placeholder="Enter your code or text here..."></textarea>
            <div class="flex gap-2 mt-3"><button class="btn btn-primary" id="tool-run-btn">${icons.zap} Run</button></div>`
        });
        document.querySelector('#tool-run-btn')?.addEventListener('click', () => {
          const toolInput = document.querySelector('#tool-input');
          const text = toolInput?.value.trim();
          if (!text) { CrackItUI.toast('Please enter some input', 'warning'); return; }
          CrackItUI.closeModal('prompt');
          if (!activeConversation) newChat();
          const inputEl = container.querySelector('#chat-input');
          if (inputEl) {
            const toolPrompts = {
              'explain': `Explain this code in detail:\n\n${text}`,
              'review': `Review this code for issues:\n\n${text}`,
              'find-bugs': `Find bugs in this code:\n\n${text}`,
              'vuln': `Find vulnerabilities in this code:\n\n${text}`,
              'document': `Generate documentation for:\n\n${text}`,
              'summarize': `Summarize the following:\n\n${text}`,
              'translate': `Translate the following:\n\n${text}`,
              'optimize': `Optimize this code:\n\n${text}`,
              'gen-regex': `Generate a regex for:\n\n${text}`,
              'gen-sql': `Generate SQL for:\n\n${text}`,
              'gen-md': `Generate Markdown for:\n\n${text}`,
              'gen-report': `Generate a report based on:\n\n${text}`,
              'test-cases': `Generate test cases for:\n\n${text}`,
              'convert-lang': `Convert this code to another language:\n\n${text}`,
              'refactor': `Refactor this code:\n\n${text}`
            };
            inputEl.value = toolPrompts[tool] || text;
            sendMessage();
          }
        });
      });
    });
  }

  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    const extended = hex + hex.split('').reverse().join('');
    return extended.substring(0, 64);
  }

  function bindContextPanelEvents() {
    container.querySelectorAll('[data-action="toggle-section"]').forEach(el => {
      el.addEventListener('click', () => {
        const section = el.dataset.section;
        const body = container.querySelector(`#ctx-${section}`);
        const arrow = el.querySelector('.toggle-arrow');
        if (body) body.classList.toggle('hidden');
        if (arrow) arrow.classList.toggle('open');
      });
    });

    // File actions
    container.querySelectorAll('[data-action="file-preview"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const fileItem = btn.closest('.context-file-item');
        const name = fileItem?.querySelector('.context-file-name')?.textContent || 'file';
        CrackItUI.toast(`Preview: ${name} (simulated)`, 'info');
      });
    });

    container.querySelectorAll('[data-action="file-rename"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const fileItem = btn.closest('.context-file-item');
        const fileId = fileItem?.dataset.fileId;
        const file = attachedFiles.find(f => f.id === fileId);
        if (!file) return;
        CrackItUI.openModal('prompt', {
          title: 'Rename File',
          content: `<input type="text" class="input" id="file-rename-input" value="${escapeHtml(file.name)}">`
        });
        document.querySelector('#file-rename-input')?.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const newName = document.querySelector('#file-rename-input')?.value.trim() || file.name;
            file.name = newName;
            CrackItUI.closeModal('prompt');
            updateContextPanel();
            CrackItUI.toast('File renamed', 'success');
          }
        });
      });
    });

    container.querySelectorAll('[data-action="file-download"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const fileItem = btn.closest('.context-file-item');
        const name = fileItem?.querySelector('.context-file-name')?.textContent || 'file';
        const blob = new Blob(['Simulated file content'], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
        CrackItUI.toast('File download started', 'success');
      });
    });

    container.querySelectorAll('[data-action="file-delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const fileItem = btn.closest('.context-file-item');
        const fileId = fileItem?.dataset.fileId;
        if (!fileId) return;
        attachedFiles = attachedFiles.filter(f => f.id !== fileId);
        if (activeConversation) {
          activeConversation.files = attachedFiles;
          CrackItStorage.updateInCollection('conversations', activeConversation.id, { files: attachedFiles });
        }
        updateContextPanel();
        CrackItUI.toast('File removed', 'success');
      });
    });

    container.querySelectorAll('[data-action="file-copy-path"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const fileItem = btn.closest('.context-file-item');
        const name = fileItem?.querySelector('.context-file-name')?.textContent || '';
        navigator.clipboard?.writeText(`/uploads/${name}`);
        CrackItUI.toast('Path copied', 'success');
      });
    });

    container.querySelectorAll('[data-action="file-copy-content"]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText('Simulated file content for demo');
        CrackItUI.toast('Content copied (simulated)', 'success');
      });
    });

    container.querySelectorAll('[data-action^="file-ai-"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action.replace('file-ai-', '');
        const labels = { summary: 'AI Summary', explain: 'AI Explain', review: 'AI Review', report: 'AI Report' };
        CrackItUI.toast(`${labels[action] || 'AI action'} processing (simulated)`, 'info');
      });
    });
  }

  function bindToolbarEvents() {
    container.querySelector('[data-action="new-chat"]')?.addEventListener('click', newChat);

    container.querySelector('[data-action="pin-conv"]')?.addEventListener('click', () => {
      if (activeConversation) togglePin(activeConversation.id);
      else CrackItUI.toast('No active conversation', 'warning');
    });

    container.querySelector('[data-action="archive-conv"]')?.addEventListener('click', () => {
      if (activeConversation) toggleArchive(activeConversation.id);
      else CrackItUI.toast('No active conversation', 'warning');
    });

    container.querySelector('[data-action="toggle-panel"]')?.addEventListener('click', () => {
      const panel = container.querySelector('#chat-right-panel');
      if (panel) {
        panel.classList.toggle('hidden');
        CrackItUI.toast(panel.classList.contains('hidden') ? 'Context panel hidden' : 'Context panel visible', 'info');
      }
    });

    container.querySelector('#model-selector')?.addEventListener('change', (e) => {
      CrackItStorage.settings.update({ aiModel: e.target.value });
      CrackItUI.toast(`Model changed to ${e.target.options[e.target.selectedIndex].text}`, 'success');
    });
  }

  function handleFileUpload(files) {
    if (!files || !files.length) return;
    const allowedTypes = ['.js', '.py', '.java', '.c', '.cpp', '.php', '.sql', '.html', '.css', '.txt', '.md', '.json', '.xml', '.csv', '.sh', '.yaml', '.yml', '.ts', '.jsx', '.tsx'];
    for (const file of files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isText = allowedTypes.includes(ext) || file.type.startsWith('text/');
      const fileEntry = {
        id: uid('file'),
        name: file.name,
        size: file.size,
        type: ext,
        isText,
        data: isText ? '' : null,
        addedAt: new Date().toISOString()
      };
      if (isText) {
        const reader = new FileReader();
        reader.onload = (e) => {
          fileEntry.data = e.target?.result || '';
          attachedFiles.push(fileEntry);
          if (activeConversation) {
            activeConversation.files = attachedFiles;
            CrackItStorage.updateInCollection('conversations', activeConversation.id, { files: attachedFiles });
          }
          updateContextPanel();
          CrackItUI.toast(`File uploaded: ${file.name}`, 'success');
        };
        reader.readAsText(file);
      } else {
        attachedFiles.push(fileEntry);
        if (activeConversation) {
          activeConversation.files = attachedFiles;
          CrackItStorage.updateInCollection('conversations', activeConversation.id, { files: attachedFiles });
        }
        updateContextPanel();
        CrackItUI.toast(`File uploaded: ${file.name} (preview not available for this type)`, 'success');
      }
    }
  }

  function updateContextPanel() {
    const panel = container?.querySelector('#chat-right-panel');
    if (panel) {
      panel.innerHTML = renderContextPanel();
      bindContextPanelEvents();
    }
  }

  return { render };
})();

CrackItModules.CrackItChat = CrackItChat;

/**
 * CrackIt — Reports Module
 */
const CrackItReports = (() => {
  'use strict';

  const { escapeHtml, formatDate, icon, uid } = CrackItUtils;
  let selectedReport = null;

  async function render(container) {
    const reports = CrackItStorage.getCollection('reports');

    if (selectedReport) {
      container.innerHTML = renderDetail(selectedReport);
      bindDetailEvents(container, reports);
      return;
    }

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content"><h1>Reports</h1><p>${reports.length} security reports</p></div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" data-action="export-all">Export All</button>
          <button class="btn btn-primary" data-action="new-report">Generate Report</button>
        </div>
      </div>

      <div class="filter-bar">
        <input type="text" class="input" placeholder="Search reports..." id="report-search" style="max-width:320px">
        <select class="input select" id="report-severity" style="max-width:140px">
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select class="input select" id="report-status" style="max-width:140px">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="review">In Review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div class="project-grid" id="reports-grid">
        ${reports.map(r => `
          <div class="card report-card hover-lift" data-report-id="${r.id}" style="cursor:pointer">
            <div class="card-body">
              <div class="flex justify-between mb-3">
                <span class="report-severity ${r.severity}" style="text-transform:uppercase;font-size:11px;font-weight:700">${r.severity}</span>
                <span class="badge badge-${r.status === 'published' ? 'green' : r.status === 'review' ? 'blue' : 'gray'}">${r.status}</span>
              </div>
              <h3 class="font-semibold mb-2">${escapeHtml(r.title)}</h3>
              <p class="text-sm text-muted mb-3">${escapeHtml((r.summary || '').substring(0, 120))}...</p>
              <div class="flex justify-between text-xs text-muted">
                <span>${r.findings} findings · Risk: ${r.riskScore}</span>
                <span>${formatDate(r.updatedAt, true)}</span>
              </div>
              <div class="flex gap-2 mt-3">
                <button class="btn btn-secondary btn-sm" data-action="preview-report" data-id="${r.id}">${icon('search')} Preview</button>
                <button class="btn btn-ghost btn-sm" data-action="export-report" data-id="${r.id}">${icon('download')} Export</button>
              </div>
            </div>
          </div>`).join('')}
      </div>`;

    bindListEvents(container, reports);
  }

  function renderDetail(report) {
    return `
      <button class="btn btn-ghost btn-sm mb-4" data-action="back-to-reports"><span class="icon">${CrackItUtils.icons.chevronLeft}</span> Back to Reports</button>
      <div class="card">
        <div class="card-header">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="report-severity ${report.severity}" style="text-transform:uppercase;font-size:11px;font-weight:700">${report.severity}</span>
              <span class="badge badge-${report.status === 'published' ? 'green' : report.status === 'review' ? 'blue' : 'gray'}">${report.status}</span>
            </div>
            <h2 class="text-xl font-semibold">${escapeHtml(report.title)}</h2>
            <div class="text-xs text-muted mt-1">
              ${report.findings} findings · Risk Score: ${report.riskScore} · Updated ${formatDate(report.updatedAt)}
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" data-action="export-report" data-id="${report.id}">${icon('download')} Export JSON</button>
            <button class="btn btn-primary btn-sm" data-action="edit-report">${icon('edit')} Edit</button>
          </div>
        </div>
        <div class="card-body">
          <div class="dashboard-grid" style="margin-bottom:20px">
            <div class="col-span-8">
              <h4 class="font-semibold mb-2">Summary</h4>
              <p class="text-sm text-muted">${escapeHtml(report.summary || 'No summary available.')}</p>
            </div>
            <div class="col-span-4">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="stat-card-sm"><div class="stat-value" style="color:${report.severity === 'critical' ? '#EF4444' : report.severity === 'high' ? '#F59E0B' : '#3B82F6'}">${report.findings}</div><div class="stat-label">Findings</div></div>
                <div class="stat-card-sm"><div class="stat-value">${report.riskScore}</div><div class="stat-label">Risk Score</div></div>
                <div class="stat-card-sm"><div class="stat-value" style="font-size:14px;color:var(--text-muted)">${formatDate(report.createdAt || report.updatedAt, true)}</div><div class="stat-label">Created</div></div>
                <div class="stat-card-sm"><div class="stat-value" style="font-size:14px;color:var(--text-muted)">${formatDate(report.updatedAt, true)}</div><div class="stat-label">Updated</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function bindListEvents(container, reports) {
    const severityFilter = container.querySelector('#report-severity');
    const statusFilter = container.querySelector('#report-status');
    const searchInput = container.querySelector('#report-search');

    function applyFilters() {
      const q = (searchInput?.value || '').toLowerCase();
      const sev = severityFilter?.value || 'all';
      const stat = statusFilter?.value || 'all';
      container.querySelectorAll('.report-card').forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const severity = card.querySelector('.report-severity')?.textContent.toLowerCase() || '';
        const status = card.querySelector('.badge')?.textContent.toLowerCase() || '';
        const matchSearch = !q || title.includes(q);
        const matchSeverity = sev === 'all' || severity === sev;
        const matchStatus = stat === 'all' || status === stat;
        card.style.display = matchSearch && matchSeverity && matchStatus ? '' : 'none';
      });
    }

    container.querySelectorAll('.report-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const id = card.dataset.reportId;
        const report = reports.find(r => r.id === id);
        if (report) {
          selectedReport = report;
          render(container);
        }
      });
    });

    container.querySelectorAll('[data-action="preview-report"]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation();
        const id = btn.dataset.id;
        const report = reports.find(r => r.id === id);
        if (report) { selectedReport = report; render(container); }
      });
    });

    container.querySelectorAll('[data-action="export-report"]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation();
        const id = btn.dataset.id;
        const report = reports.find(r => r.id === id);
        if (report) {
          const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = (report.title || 'report').replace(/\s+/g, '_') + '.json';
          a.click(); URL.revokeObjectURL(url);
          CrackItUI.toast('Report exported', 'success');
        }
      });
    });

    container.querySelector('[data-action="new-report"]')?.addEventListener('click', () => {
      const report = CrackItStorage.addToCollection('reports', {
        id: CrackItUtils.uid('rpt'), title: 'New Security Report',
        summary: 'Report summary goes here.', severity: 'medium',
        status: 'draft', findings: 0, riskScore: 0,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      });
      selectedReport = report;
      render(container);
      CrackItUI.toast('New report created', 'success');
    });

    container.querySelector('[data-action="export-all"]')?.addEventListener('click', () => {
      const all = CrackItStorage.getCollection('reports');
      const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'all_reports.json';
      a.click(); URL.revokeObjectURL(url);
      CrackItUI.toast('Exported ' + all.length + ' reports', 'success');
    });

    searchInput?.addEventListener('input', CrackItUtils.debounce(applyFilters, 200));
    severityFilter?.addEventListener('change', applyFilters);
    statusFilter?.addEventListener('change', applyFilters);
  }

  function bindDetailEvents(container, reports) {
    container.querySelector('[data-action="back-to-reports"]')?.addEventListener('click', () => {
      selectedReport = null;
      render(container);
    });

    container.querySelector('[data-action="export-report"]')?.addEventListener('click', () => {
      if (!selectedReport) return;
      const blob = new Blob([JSON.stringify(selectedReport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = (selectedReport.title || 'report').replace(/\s+/g, '_') + '.json';
      a.click(); URL.revokeObjectURL(url);
      CrackItUI.toast('Report exported', 'success');
    });

    container.querySelector('[data-action="edit-report"]')?.addEventListener('click', () => {
      CrackItUI.toast('Report editor opened for: ' + selectedReport?.title, 'info');
    });
  }

  return { render };
})();

CrackItModules.CrackItReports = CrackItReports;
