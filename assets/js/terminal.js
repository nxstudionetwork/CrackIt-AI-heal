/**
 * CrackIt — Terminal Module
 * Real WebSocket terminal connected to backend
 */

const CrackItTerminal = (() => {
  'use strict';

  const commandHistory = [];
  let historyIndex = -1;
  const tabs = ['bash', 'logs', 'debug'];
  let activeTab = 'bash';
  let ws = null;
  let sessionId = null;
  let outputEl = null;

  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content"><h1>Terminal</h1><p>Integrated command line interface</p></div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" data-action="split">Split View</button>
          <button class="btn btn-ghost" data-action="clear-all">Clear All</button>
        </div>
      </div>

      <div class="terminal-container">
        <div class="terminal-tabs">
          ${tabs.map(t => `<button class="terminal-tab ${activeTab === t ? 'active' : ''}" data-tab="${t}">${t}</button>`).join('')}
          <button class="terminal-tab" data-action="new-tab">+</button>
        </div>
        <div class="terminal-body" id="terminal-output">
          <div class="terminal-line"><span class="terminal-output">CrackIt Terminal v2.0.0 — Connecting...</span></div>
        </div>
        <div class="terminal-body" style="border-top:1px solid var(--border);padding:8px 16px;min-height:auto">
          <div class="terminal-input-line">
            <span class="terminal-prompt">admin@crackit:~$</span>
            <input type="text" class="terminal-input" id="terminal-input" autocomplete="off" spellcheck="false" aria-label="Terminal input">
          </div>
        </div>
      </div>`;

    outputEl = container.querySelector('#terminal-output');
    bindEvents(container);
    await connectWebSocket();
  }

  async function connectWebSocket() {
    try {
      sessionId = 'session_' + Date.now();
      ws = CrackItAPI.terminal.connect(sessionId);

      ws.onopen = () => {
        appendOutput('Connected to CrackIt Terminal', 'success');
        const input = document.querySelector('#terminal-input');
        if (input) input.focus();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'output') {
            appendOutput(data.data || '(no output)');
          } else if (data.type === 'error') {
            appendOutput('Error: ' + data.data, 'error');
          }
        } catch {
          appendOutput(event.data);
        }
      };

      ws.onerror = () => {
        appendOutput('WebSocket error — falling back to local mode', 'warning');
        ws = null;
      };

      ws.onclose = () => {
        if (ws) appendOutput('Connection closed. Reconnect available.', 'warning');
        ws = null;
      };
    } catch {
      appendOutput('Could not connect to terminal backend. Commands run in local preview mode.', 'warning');
    }
  }

  function appendOutput(text, type = '') {
    if (!outputEl) outputEl = document.getElementById('terminal-output');
    if (!outputEl || !text) return;

    const line = document.createElement('div');
    line.className = 'terminal-line';
    const cls = type === 'error' ? 'color:var(--accent-red)' : type === 'success' ? 'color:var(--accent-green)' : type === 'warning' ? 'color:var(--accent-yellow)' : '';
    line.innerHTML = `<span class="terminal-output" style="${cls}">${CrackItUtils.escapeHtml(text).replace(/\n/g, '<br>')}</span>`;
    outputEl.appendChild(line);
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function bindEvents(container) {
    const input = container.querySelector('#terminal-input');

    input?.focus();
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = input.value.trim();
        if (!cmd) return;
        commandHistory.push(cmd);
        historyIndex = -1;

        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = `<span class="terminal-prompt">admin@crackit:~$</span> ${CrackItUtils.escapeHtml(cmd)}`;
        outputEl.appendChild(line);

        if (cmd.toLowerCase() === 'clear') {
          outputEl.innerHTML = '';
          input.value = '';
          return;
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(cmd);
        } else {
          appendOutput(`bash: ${cmd.split(' ')[0]}: command not connected (backend offline)`, 'warning');
        }
        input.value = '';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          input.value = commandHistory[commandHistory.length - 1 - historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) { historyIndex--; input.value = commandHistory[commandHistory.length - 1 - historyIndex]; }
        else { historyIndex = -1; input.value = ''; }
      } else if (e.key === 'Tab') {
        e.preventDefault();
      }
    });

    container.querySelectorAll('.terminal-tab[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        container.querySelectorAll('.terminal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === activeTab));
      });
    });

    container.querySelector('[data-action="new-tab"]')?.addEventListener('click', () => {
      CrackItUI.toast('New terminal tab created', 'success');
    });

    container.querySelector('[data-action="clear-all"]')?.addEventListener('click', () => {
      outputEl.innerHTML = '';
    });

    container.querySelector('[data-action="split"]')?.addEventListener('click', () => {
      CrackItUI.toast('Split view enabled', 'info');
    });
  }

  return { render };
})();

CrackItModules.CrackItTerminal = CrackItTerminal;

/**
 * CrackIt — Automation Module
 */
const CrackItAutomation = (() => {
  'use strict';

  const { escapeHtml, formatDate } = CrackItUtils;

  async function render(container) {
    const workflows = CrackItStorage.getCollection('workflows');

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content"><h1>Automation</h1><p>Workflow automation and orchestration</p></div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" data-action="templates">Templates</button>
          <button class="btn btn-primary" data-action="new-workflow">New Workflow</button>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" data-tab="workflows">Workflows</button>
        <button class="tab" data-tab="logs">Execution Logs</button>
        <button class="tab" data-tab="stats">Statistics</button>
      </div>

      <div id="automation-content">
        ${workflows.length ? `<div class="project-grid">
          ${workflows.map(w => `
            <div class="card workflow-card hover-lift">
              <div class="card-body">
                <div class="flex justify-between mb-3">
                  <div class="workflow-status">
                    <div class="workflow-status-dot ${w.status}"></div>
                    <span class="text-sm capitalize">${w.status}</span>
                  </div>
                </div>
                <h3 class="font-semibold mb-2">${escapeHtml(w.name)}</h3>
                <p class="text-sm text-muted mb-3">${escapeHtml(w.description)}</p>
                <div class="flex gap-4 text-xs text-muted mb-3">
                  <span>${w.triggers || 0} triggers</span>
                  <span>${w.actions || 0} actions</span>
                  <span>${w.executions || 0} runs</span>
                </div>
                <div class="progress mb-2"><div class="progress-bar success" style="width:${w.successRate || 0}%"></div></div>
                <div class="flex justify-between text-xs text-muted">
                  <span>${w.successRate || 0}% success rate</span>
                  <span>Last run: ${formatDate(w.lastRun, true)}</span>
                </div>
                <div class="flex gap-2 mt-3">
                  <button class="btn btn-primary btn-sm" data-action="run">Run Now</button>
                  <button class="btn btn-ghost btn-sm" data-action="edit">Edit</button>
                </div>
              </div>
            </div>`).join('')}
        </div>` : '<div class="empty-state" style="padding:40px"><p>No workflows configured yet</p><button class="btn btn-primary btn-sm mt-2" data-action="new-workflow">Create Workflow</button></div>'}
      </div>`;

    bindEvents(container);
  }

  function bindEvents(container) {
    container.querySelector('[data-action="new-workflow"]')?.addEventListener('click', () => {
      CrackItUI.toast('Workflow builder opened', 'info');
    });
    container.querySelector('[data-action="templates"]')?.addEventListener('click', () => {
      CrackItUI.toast('Automation templates loaded', 'info');
    });
    container.querySelectorAll('[data-action="run"]').forEach(btn => {
      btn.addEventListener('click', () => CrackItUI.toast('Workflow execution started', 'success'));
    });
  }

  return { render };
})();

CrackItModules.CrackItAutomation = CrackItAutomation;
