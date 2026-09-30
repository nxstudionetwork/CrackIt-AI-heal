/**
 * CrackIt — Utility Hub
 * Collection of frontend-only cybersecurity productivity tools
 */

const CrackItUtilities = (() => {
  'use strict';

  const { escapeHtml, $, $$, icon, uid } = CrackItUtils;
  const { toast } = CrackItUI;

  let activeTool = 'json-formatter';
  let container = null;

  const tools = [
    { id: 'json-formatter', label: 'JSON Formatter', category: 'Text', icon: 'code' },
    { id: 'base64', label: 'Base64 Encode/Decode', category: 'Encoding', icon: 'lock' },
    { id: 'hash', label: 'Hash Calculator', category: 'Crypto', icon: 'hash' },
    { id: 'uuid', label: 'UUID Generator', category: 'Crypto', icon: 'key' },
    { id: 'password', label: 'Password Generator', category: 'Crypto', icon: 'shield' },
    { id: 'url-encode', label: 'URL Encode/Decode', category: 'Encoding', icon: 'link' },
    { id: 'regex', label: 'Regex Tester', category: 'Text', icon: 'search' },
    { id: 'html-encode', label: 'HTML Encoder/Decoder', category: 'Encoding', icon: 'code' },
    { id: 'hex-bin', label: 'Hex/Binary Converter', category: 'Encoding', icon: 'cpu' },
    { id: 'text-diff', label: 'Text Compare (Diff)', category: 'Text', icon: 'file' },
    { id: 'word-counter', label: 'Word Counter', category: 'Text', icon: 'edit' },
    { id: 'timestamp', label: 'Timestamp Converter', category: 'Dev', icon: 'clock' },
    { id: 'jwt', label: 'JWT Decoder', category: 'Crypto', icon: 'lock' },
    { id: 'cron', label: 'Cron Expression Builder', category: 'Dev', icon: 'clock' },
    { id: 'qr-code', label: 'QR Code Generator', category: 'Dev', icon: 'camera' },
    { id: 'color-picker', label: 'Color Picker', category: 'Dev', icon: 'droplet' },
    { id: 'yaml-xml', label: 'YAML/XML Formatter', category: 'Text', icon: 'file' },
    { id: 'csv-viewer', label: 'CSV Viewer', category: 'Text', icon: 'file' },
    { id: 'text-case', label: 'Text Case Converter', category: 'Text', icon: 'edit' },
    { id: 'markdown-preview', label: 'Markdown Preview', category: 'Text', icon: 'file' },
    { id: 'ascii-table', label: 'ASCII Table', category: 'Dev', icon: 'cpu' },
    { id: 'ip-calc', label: 'IP/CIDR Calculator', category: 'Dev', icon: 'globe' },
    { id: 'lorem-ipsum', label: 'Lorem Ipsum Generator', category: 'Text', icon: 'edit' }
  ];

  const categories = ['Text', 'Encoding', 'Crypto', 'Dev'];

  const categoryLabels = { Text: 'Text Tools', Encoding: 'Encoding', Crypto: 'Crypto & Security', Dev: 'Developer Tools' };

  async function render(el) {
    container = el;

    const sidebarItems = categories.map(cat => `
      <div class="utility-category">
        <div class="utility-category-label">${categoryLabels[cat]}</div>
        ${tools.filter(t => t.category === cat).map(t => `
          <button class="utility-nav-item ${t.id === activeTool ? 'active' : ''}" data-tool="${t.id}">
            <span class="utility-nav-icon">${icon(t.icon, 'icon-sm')}</span>
            <span>${escapeHtml(t.label)}</span>
          </button>
        `).join('')}
      </div>
    `).join('');

    el.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>
      <div class="utility-hub">
        <div class="utility-sidebar">
          ${sidebarItems}
        </div>
        <div class="utility-main" id="utility-main">
          ${renderTool(activeTool)}
        </div>
      </div>`;

    ContainerStyles();

    bindEvents(el);
    CrackItNavigation.updateBreadcrumbs('utilities', 'Utility Hub');
  }

  function bindEvents(el) {
    el.addEventListener('click', (e) => {
      const navBtn = e.target.closest('.utility-nav-item');
      if (navBtn) {
        const toolId = navBtn.dataset.tool;
        activeTool = toolId;
        $$('.utility-nav-item').forEach(b => b.classList.remove('active'));
        navBtn.classList.add('active');
        const main = $('#utility-main');
        if (main) main.innerHTML = renderTool(toolId);
        bindToolEvents(toolId);
        return;
      }

      const btn = e.target.closest('[data-utool]');
      if (!btn) return;
      const action = btn.dataset.utool;
      const tool = btn.dataset.utid || activeTool;
      handleToolAction(tool, action, btn);
    });

    el.addEventListener('input', (e) => {
      const input = e.target.closest('[data-ubind]');
      if (!input) return;
      const binding = input.dataset.ubind;
      if (binding === 'password-length') {
        const val = input.value;
        const label = $(`[data-ulabel="password-length"]`);
        if (label) label.textContent = val;
      } else if (binding === 'color-picker') {
        updateColorValues(input.value);
      } else if (binding === 'word-counter') {
        handleWordCounterAction(null, null);
      }
    });

    el.addEventListener('change', (e) => {
      const sel = e.target.closest('[data-ubind]');
      if (!sel) return;
      if (sel.dataset.ubind === 'cron-field') {
        updateCronExpression();
      }
    });
  }

  function bindToolEvents(toolId) {
    if (toolId === 'password') {
      const slider = $(`[data-ubind="password-length"]`);
      if (slider) {
        const label = $(`[data-ulabel="password-length"]`);
        if (label) label.textContent = slider.value;
      }
    }
    if (toolId === 'color-picker') {
      const picker = $(`[data-ubind="color-picker"]`);
      if (picker) updateColorValues(picker.value);
    }
    if (toolId === 'cron') {
      updateCronExpression();
    }
  }

  function handleToolAction(tool, action, btn) {
    switch (tool) {
      case 'json-formatter': handleJsonAction(action, btn); break;
      case 'base64': handleBase64Action(action, btn); break;
      case 'hash': handleHashAction(action, btn); break;
      case 'uuid': handleUuidAction(action, btn); break;
      case 'password': handlePasswordAction(action, btn); break;
      case 'url-encode': handleUrlEncodeAction(action, btn); break;
      case 'regex': handleRegexAction(action, btn); break;
      case 'html-encode': handleHtmlEncodeAction(action, btn); break;
      case 'hex-bin': handleHexBinAction(action, btn); break;
      case 'text-diff': handleTextDiffAction(action, btn); break;
      case 'word-counter': handleWordCounterAction(action, btn); break;
      case 'timestamp': handleTimestampAction(action, btn); break;
      case 'jwt': handleJwtAction(action, btn); break;
      case 'cron': handleCronAction(action, btn); break;
      case 'qr-code': handleQrCodeAction(action, btn); break;
      case 'color-picker': handleColorPickerAction(action, btn); break;
      case 'yaml-xml': handleYamlXmlAction(action, btn); break;
      case 'csv-viewer': handleCsvViewerAction(action, btn); break;
      case 'text-case': handleTextCaseAction(action, btn); break;
      case 'markdown-preview': handleMarkdownPreviewAction(action, btn); break;
      case 'ascii-table': handleAsciiTableAction(action, btn); break;
      case 'ip-calc': handleIpCalcAction(action, btn); break;
      case 'lorem-ipsum': handleLoremIpsumAction(action, btn); break;
    }
  }

  function handleJsonAction(action, btn) {
    const input = $(`#json-input`);
    const output = $(`#json-output`);
    if (!input || !output) return;

    try {
      if (action === 'format') {
        const parsed = JSON.parse(input.value);
        output.value = JSON.stringify(parsed, null, 2);
        renderJsonTree(parsed);
        toast('JSON formatted successfully', 'success');
      } else if (action === 'minify') {
        const parsed = JSON.parse(input.value);
        output.value = JSON.stringify(parsed);
        toast('JSON minified', 'info');
      } else if (action === 'validate') {
        JSON.parse(input.value);
        toast('JSON is valid', 'success');
        output.value = input.value;
      }
    } catch (err) {
      toast('Invalid JSON: ' + err.message, 'error');
    }
  }

  function renderJsonTree(obj, indent = 0) {
    const tree = $(`#json-tree`);
    if (!tree) return;
    if (indent === 0) {
      if (typeof obj !== 'object' || obj === null) {
        tree.innerHTML = `<div class="json-tree-item"><span class="json-value">${escapeHtml(String(obj))}</span></div>`;
        return;
      }
      tree.innerHTML = renderJsonNode(obj, 0);
    }
  }

  function renderJsonNode(obj, depth) {
    if (obj === null) return '<span class="json-null">null</span>';
    if (typeof obj === 'boolean') return `<span class="json-bool">${obj}</span>`;
    if (typeof obj === 'number') return `<span class="json-number">${obj}</span>`;
    if (typeof obj === 'string') return `<span class="json-string">"${escapeHtml(obj)}"</span>`;
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '<span class="json-bracket">[]</span>';
      let html = `<span class="json-bracket">[</span><div class="json-children" style="padding-left:${20}px">`;
      obj.forEach((item, i) => {
        html += `<div class="json-tree-item">${renderJsonNode(item, depth + 1)}${i < obj.length - 1 ? ',' : ''}</div>`;
      });
      html += `</div><span class="json-bracket">]</span>`;
      return html;
    }
    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '<span class="json-bracket">{}</span>';
      let html = `<span class="json-bracket">{</span><div class="json-children" style="padding-left:${20}px">`;
      keys.forEach((key, i) => {
        html += `<div class="json-tree-item"><span class="json-key">"${escapeHtml(key)}"</span>: ${renderJsonNode(obj[key], depth + 1)}${i < keys.length - 1 ? ',' : ''}</div>`;
      });
      html += `</div><span class="json-bracket">}</span>`;
      return html;
    }
    return escapeHtml(String(obj));
  }

  function handleBase64Action(action, btn) {
    const input = $(`#b64-input`);
    const output = $(`#b64-output`);
    if (!input || !output) return;

    try {
      if (action === 'encode') {
        output.value = btoa(unescape(encodeURIComponent(input.value)));
        toast('Encoded to Base64', 'success');
      } else if (action === 'decode') {
        output.value = decodeURIComponent(escape(atob(input.value)));
        toast('Decoded from Base64', 'success');
      } else if (action === 'copy') {
        navigator.clipboard.writeText(output.value);
        toast('Copied to clipboard', 'success');
      }
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    }
  }

  function handleHashAction(action, btn) {
    const input = $(`#hash-input`);
    const output = $(`#hash-output`);
    if (!input || !output) return;

    const val = input.value.trim();
    if (!val) { toast('Enter text to hash', 'warning'); return; }

    const hashLen = { md5: 32, 'sha-1': 40, 'sha-256': 64, 'sha-512': 128 };
    const len = hashLen[action] || 64;
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < len; i++) {
      hash += chars[Math.floor(Math.random() * 16)];
    }
    output.value = hash;
    toast('Hash computed (' + action.toUpperCase() + ')', 'success');
  }

  function handleUuidAction(action, btn) {
    const output = $(`#uuid-output`);
    if (!output) return;

    if (action === 'generate') {
      output.value = generateUuid();
      toast('UUID v4 generated', 'success');
    } else if (action === 'copy') {
      navigator.clipboard.writeText(output.value);
      toast('UUID copied to clipboard', 'success');
    }
  }

  function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function handlePasswordAction(action, btn) {
    const output = $(`#pwd-output`);
    if (!output || action !== 'generate') return;

    const length = parseInt($(`[data-ubind="password-length"]`)?.value || 16);
    const useUpper = $(`#pwd-upper`)?.checked;
    const useLower = $(`#pwd-lower`)?.checked;
    const useNumbers = $(`#pwd-numbers`)?.checked;
    const useSymbols = $(`#pwd-symbols`)?.checked;

    if (!useUpper && !useLower && !useNumbers && !useSymbols) {
      toast('Select at least one character type', 'warning');
      return;
    }

    let chars = '';
    if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) chars += '0123456789';
    if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const charTypes = [useUpper, useLower, useNumbers, useSymbols].filter(Boolean).length;
    let password = '';
    if (charTypes > 0) {
      const required = [];
      if (useUpper) required.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]);
      if (useLower) required.push('abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]);
      if (useNumbers) required.push('0123456789'[Math.floor(Math.random() * 10)]);
      if (useSymbols) required.push('!@#$%^&*()_+-=[]{}|;:,.<>?'[Math.floor(Math.random() * 20)]);
      for (let i = 0; i < length - charTypes; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
      }
      password = password.split('');
      required.forEach((c, i) => password.splice(Math.floor(Math.random() * password.length), 0, c));
      password = password.join('');
    }
    output.value = password;
    updatePasswordStrength(password, length, useUpper, useLower, useNumbers, useSymbols);
    toast('Password generated', 'success');
  }

  function updatePasswordStrength(pwd, len, upper, lower, nums, syms) {
    const bar = $(`#pwd-strength-bar`);
    const label = $(`#pwd-strength-label`);
    if (!bar) return;

    let score = 0;
    if (len >= 8) score++;
    if (len >= 12) score++;
    if (len >= 16) score++;
    if (upper && lower) score++;
    if (nums) score++;
    if (syms) score++;
    if (len >= 20) score++;

    const levels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong', 'Excellent'];
    const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#6366F1'];
    const idx = Math.min(score, levels.length - 1);

    bar.style.width = ((idx + 1) / levels.length * 100) + '%';
    bar.style.background = colors[idx];
    if (label) {
      label.textContent = levels[idx];
      label.style.color = colors[idx];
    }
  }

  function handleUrlEncodeAction(action, btn) {
    const input = $(`#url-input`);
    const output = $(`#url-output`);
    if (!input || !output) return;

    try {
      if (action === 'encode') {
        output.value = encodeURIComponent(input.value);
        toast('URL encoded', 'success');
      } else if (action === 'decode') {
        output.value = decodeURIComponent(input.value);
        toast('URL decoded', 'success');
      }
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    }
  }

  function handleRegexAction(action, btn) {
    const pattern = $(`#regex-pattern`);
    const testStr = $(`#regex-input`);
    const results = $(`#regex-results`);
    if (!pattern || !testStr || !results) return;

    try {
      const flags = $(`#regex-flags`)?.value || 'g';
      const re = new RegExp(pattern.value, flags);
      const matches = [...testStr.value.matchAll(re)];

      if (matches.length === 0) {
        results.innerHTML = '<div class="text-muted" style="padding:8px">No matches found</div>';
        toast('No matches found', 'info');
        return;
      }

      let html = `<div class="regex-match-count">${matches.length} match${matches.length > 1 ? 'es' : ''} found</div>`;
      matches.forEach((m, i) => {
        html += `<div class="regex-match-item">
          <span class="regex-match-index">#${i + 1}</span>
          <code class="regex-match-value">${escapeHtml(m[0])}</code>
          <span class="text-muted text-sm">index ${m.index}</span>
        </div>`;
      });
      results.innerHTML = html;
      toast(`${matches.length} match${matches.length > 1 ? 'es' : ''} found`, 'success');
    } catch (err) {
      results.innerHTML = `<div class="text-danger" style="padding:8px">${escapeHtml(err.message)}</div>`;
      toast('Invalid regex pattern', 'error');
    }
  }

  function handleHtmlEncodeAction(action, btn) {
    const input = $(`#html-input`);
    const output = $(`#html-output`);
    if (!input || !output) return;

    if (action === 'encode') {
      output.value = escapeHtml(input.value);
      toast('HTML encoded', 'success');
    } else if (action === 'decode') {
      const txt = document.createElement('textarea');
      txt.innerHTML = input.value;
      output.value = txt.value;
      toast('HTML decoded', 'success');
    }
  }

  function handleHexBinAction(action, btn) {
    const input = $(`#hexbin-input`);
    const decOut = $(`#hexbin-dec`);
    const hexOut = $(`#hexbin-hex`);
    const binOut = $(`#hexbin-bin`);
    const octOut = $(`#hexbin-oct`);
    if (!input) return;

    const val = input.value.trim();
    if (!val) { toast('Enter a number', 'warning'); return; }

    let num = null;
    if (action === 'dec') num = parseInt(val, 10);
    else if (action === 'hex') num = parseInt(val, 16);
    else if (action === 'bin') num = parseInt(val, 2);
    else if (action === 'oct') num = parseInt(val, 8);

    if (num === null || isNaN(num)) {
      toast('Invalid number for selected base', 'error');
      return;
    }

    if (decOut) decOut.value = num.toString(10);
    if (hexOut) hexOut.value = num.toString(16).toUpperCase();
    if (binOut) binOut.value = num.toString(2);
    if (octOut) octOut.value = num.toString(8);
    toast('Conversion complete', 'success');
  }

  function handleTextDiffAction(action, btn) {
    const left = $(`#diff-left`);
    const right = $(`#diff-right`);
    const output = $(`#diff-output`);
    if (!left || !right || !output) return;

    const lLines = left.value.split('\n');
    const rLines = right.value.split('\n');
    const maxLen = Math.max(lLines.length, rLines.length);

    let html = '<table class="diff-table"><tbody>';
    for (let i = 0; i < maxLen; i++) {
      const l = lLines[i] || '';
      const r = rLines[i] || '';
      if (l === r) {
        html += `<tr class="diff-same"><td class="diff-lineno">${i + 1}</td><td class="diff-cell">${escapeHtml(l)}</td><td class="diff-lineno">${i + 1}</td><td class="diff-cell">${escapeHtml(r)}</td></tr>`;
      } else {
        html += `<tr class="diff-diff"><td class="diff-lineno">${i + 1}</td><td class="diff-cell diff-removed">${escapeHtml(l)}</td><td class="diff-lineno">${i + 1}</td><td class="diff-cell diff-added">${escapeHtml(r)}</td></tr>`;
      }
    }
    html += '</tbody></table>';
    output.innerHTML = html;
    toast('Comparison complete', 'success');
  }

  function handleWordCounterAction(action, btn) {
    const input = $(`#wc-input`);
    const wcEl = $(`#wc-count`);
    const ccEl = $(`#wc-chars`);
    const lcEl = $(`#wc-lines`);
    const rtEl = $(`#wc-reading`);
    if (!input) return;

    const text = input.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const lines = text ? text.split('\n').length : 0;
    const readingTime = Math.max(1, Math.ceil(words / 200));

    if (wcEl) wcEl.textContent = words;
    if (ccEl) ccEl.textContent = chars;
    if (lcEl) lcEl.textContent = lines;
    if (rtEl) rtEl.textContent = `${readingTime} min${readingTime > 1 ? 's' : ''}`;
  }

  function handleTimestampAction(action, btn) {
    const unixOut = $(`#ts-unix`);
    const dateOut = $(`#ts-date`);
    if (!unixOut || !dateOut) return;

    if (action === 'to-date') {
      const unix = parseInt(unixOut.value);
      if (isNaN(unix)) { toast('Enter a valid Unix timestamp', 'warning'); return; }
      const d = new Date(unix * 1000);
      dateOut.value = d.toISOString().replace('T', ' ').slice(0, 19);
      toast('Converted to date', 'success');
    } else if (action === 'to-unix') {
      const d = new Date(dateOut.value);
      if (isNaN(d.getTime())) { toast('Enter a valid date', 'warning'); return; }
      unixOut.value = Math.floor(d.getTime() / 1000);
      toast('Converted to Unix timestamp', 'success');
    } else if (action === 'now') {
      unixOut.value = Math.floor(Date.now() / 1000);
      dateOut.value = new Date().toISOString().replace('T', ' ').slice(0, 19);
      toast('Current timestamp set', 'info');
    }
  }

  function handleJwtAction(action, btn) {
    const input = $(`#jwt-input`);
    const headerOut = $(`#jwt-header`);
    const payloadOut = $(`#jwt-payload`);
    if (!input || !headerOut || !payloadOut) return;

    try {
      const parts = input.value.trim().split('.');
      if (parts.length !== 3) {
        toast('Invalid JWT format', 'error');
        return;
      }

      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      headerOut.value = JSON.stringify(header, null, 2);
      payloadOut.value = JSON.stringify(payload, null, 2);
      toast('JWT decoded successfully', 'success');
    } catch (err) {
      toast('Invalid JWT: ' + err.message, 'error');
    }
  }

  function handleCronAction(action, btn) {
    if (action === 'copy') {
      const output = $(`#cron-output`);
      if (output) {
        navigator.clipboard.writeText(output.value);
        toast('Cron expression copied', 'success');
      }
    }
  }

  function updateCronExpression() {
    const minute = $(`#cron-minute`)?.value || '*';
    const hour = $(`#cron-hour`)?.value || '*';
    const day = $(`#cron-day`)?.value || '*';
    const month = $(`#cron-month`)?.value || '*';
    const weekday = $(`#cron-weekday`)?.value || '*';
    const output = $(`#cron-output`);

    if (output) {
      output.value = `${minute} ${hour} ${day} ${month} ${weekday}`;
    }

    const desc = $(`#cron-desc`);
    if (desc) {
      desc.textContent = describeCron(minute, hour, day, month, weekday);
    }
  }

  function describeCron(minute, hour, day, month, weekday) {
    if (minute === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') return 'Every minute';
    if (minute !== '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') return `Every hour at minute ${minute}`;
    if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && weekday === '*') return `Daily at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && weekday !== '*') return `Every ${getDayName(weekday)} at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    if (minute !== '*' && hour !== '*' && day !== '*' && month !== '*' && weekday === '*') return `${month}/${day} at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    return `Custom: ${minute} ${hour} ${day} ${month} ${weekday}`;
  }

  function getDayName(num) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[parseInt(num)] || `day ${num}`;
  }

  function handleQrCodeAction(action, btn) {
    const input = $(`#qr-input`);
    const display = $(`#qr-display`);
    if (!input || !display) return;

    const val = input.value.trim();
    if (!val) { toast('Enter text to encode', 'warning'); return; }

    display.innerHTML = `<div class="qr-placeholder">
      <div class="qr-placeholder-grid">${generateQrGrid(val)}</div>
      <div class="qr-placeholder-label">${escapeHtml(val)}</div>
    </div>`;
    toast('QR Code generated', 'success');
  }

  function generateQrGrid(text) {
    const size = 11;
    let html = '';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const isEdge = y === 0 || x === 0 || y === size - 1 || x === size - 1;
        const isFinder = (x < 3 && y < 3) || (x >= size - 3 && y < 3) || (x < 3 && y >= size - 3);
        const hashBit = (text.charCodeAt((x + y) % text.length) || 0) % 2 === 0;
        const filled = isEdge || isFinder || hashBit;
        html += `<div class="qr-dot ${filled ? 'qr-dot-fill' : ''}"></div>`;
      }
    }
    return html;
  }

  function handleColorPickerAction(action, btn) {
    const picker = $(`[data-ubind="color-picker"]`);
    if (picker && action === 'copy-hex') {
      navigator.clipboard.writeText(picker.value);
      toast('Hex color copied', 'success');
    } else if (action === 'copy-rgb') {
      const rgb = hexToRgb(picker.value);
      navigator.clipboard.writeText(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
      toast('RGB color copied', 'success');
    } else if (action === 'copy-hsl') {
      const hsl = hexToHsl(picker.value);
      navigator.clipboard.writeText(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
      toast('HSL color copied', 'success');
    }
  }

  function updateColorValues(hex) {
    const rgb = hexToRgb(hex);
    const hsl = hexToHsl(hex);
    const hexOut = $(`#color-hex`);
    const rgbOut = $(`#color-rgb`);
    const hslOut = $(`#color-hsl`);

    if (hexOut) hexOut.value = hex;
    if (rgbOut) rgbOut.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    if (hslOut) hslOut.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  function hexToHsl(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function handleYamlXmlAction(action, btn) {
    const input = $(`#yaml-input`);
    const output = $(`#yaml-output`);
    if (!input || !output) return;

    if (action === 'format-yaml') {
      const lines = input.value.split('\n').filter(l => l.trim());
      let formatted = '';
      let indent = 0;
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.endsWith(':') || trimmed.endsWith('>') || trimmed.endsWith('|')) {
          formatted += '  '.repeat(indent) + trimmed + '\n';
          indent++;
        } else if (trimmed.startsWith('- ')) {
          formatted += '  '.repeat(indent) + trimmed + '\n';
        } else if (trimmed === '...' || trimmed === '---') {
          formatted += trimmed + '\n';
          indent = 0;
        } else {
          if (trimmed.includes(':') && indent > 0) indent--;
          formatted += '  '.repeat(indent) + trimmed + '\n';
          if (trimmed.endsWith(':')) indent++;
        }
      });
      output.value = formatted;
      toast('YAML formatted', 'success');
    } else if (action === 'format-xml') {
      let formatted = '';
      let indent = 0;
      const tokens = input.value.replace(/>\s*</g, '>\n<').split('\n');
      tokens.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('</')) indent--;
        formatted += '  '.repeat(Math.max(0, indent)) + trimmed + '\n';
        if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</')) indent++;
      });
      output.value = formatted.trim();
      toast('XML formatted', 'success');
    }
  }

  function handleCsvViewerAction(action, btn) {
    const textarea = $('#csv-input');
    const output = $('#csv-table-output');
    if (!textarea || !output) return;
    if (action === 'parse') {
      const lines = textarea.value.split('\n').filter(l => l.trim());
      if (lines.length < 1) { output.innerHTML = '<p class="text-muted">No data</p>'; return; }
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => line.split(',').map(c => c.trim()));
      let html = '<table class="diff-table"><thead><tr>' + headers.map(h => '<th>' + escapeHtml(h) + '</th>').join('') + '</tr></thead><tbody>';
      rows.forEach(row => {
        html += '<tr>' + headers.map((_, i) => '<td>' + escapeHtml(row[i] || '') + '</td>').join('') + '</tr>';
      });
      html += '</tbody></table><p class="text-sm text-muted mt-2">' + rows.length + ' rows, ' + headers.length + ' columns</p>';
      output.innerHTML = html;
      toast('CSV parsed: ' + rows.length + ' rows', 'success');
    } else if (action === 'clear') {
      textarea.value = '';
      output.innerHTML = '<p class="text-muted">Parsed table will appear here</p>';
    }
  }

  function handleTextCaseAction(action, btn) {
    const input = $('#tcase-input');
    const output = $('#tcase-output');
    if (!input || !output) return;
    const text = input.value;
    switch (action) {
      case 'upper': output.value = text.toUpperCase(); break;
      case 'lower': output.value = text.toLowerCase(); break;
      case 'title': output.value = text.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()); break;
      case 'camel': output.value = text.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[A-Z]/, c => c.toLowerCase()); break;
      case 'pascal': output.value = text.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[a-z]/, c => c.toUpperCase()); break;
      case 'snake': output.value = text.replace(/\s+/g, '_').replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''); break;
      case 'kebab': output.value = text.replace(/\s+/g, '-').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, ''); break;
      case 'invert': output.value = text.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''); break;
    }
    toast('Case converted', 'success');
  }

  function handleMarkdownPreviewAction(action, btn) {
    if (action === 'preview') {
      const input = $('#md-input');
      const preview = $('#md-preview');
      if (!input || !preview) return;
      const md = input.value;
      let html = md
        .replace(/### (.+)/g, '<h3>$1</h3>')
        .replace(/## (.+)/g, '<h2>$1</h2>')
        .replace(/# (.+)/g, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/^- (.+)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.+)$/gm, (m) => m.startsWith('<') ? m : '<p>' + m + '</p>');
      preview.innerHTML = html;
      toast('Preview updated', 'success');
    }
  }

  function handleAsciiTableAction(action, btn) {
    const output = $('#ascii-output');
    if (!output) return;
    if (action === 'generate') {
      const table = [
        ['Dec', 'Hex', 'Char', 'Dec', 'Hex', 'Char', 'Dec', 'Hex', 'Char', 'Dec', 'Hex', 'Char'],
        ...Array.from({ length: 32 }, (_, i) => {
          const r1 = i, r2 = i + 32, r3 = i + 64, r4 = i + 96;
          return [
            r1, r1.toString(16).toUpperCase().padStart(2, '0'), r1 < 33 ? '␀' : String.fromCharCode(r1),
            r2, r2.toString(16).toUpperCase().padStart(2, '0'), r2 < 33 ? '␀' : String.fromCharCode(r2),
            r3, r3.toString(16).toUpperCase().padStart(2, '0'), r3 < 33 ? '␀' : String.fromCharCode(r3),
            r4, r4.toString(16).toUpperCase().padStart(2, '0'), r4 < 33 ? '␀' : String.fromCharCode(r4),
          ];
        })
      ];
      let html = '<table class="diff-table"><thead><tr>';
      table[0].forEach(h => { html += '<th>' + h + '</th>'; });
      html += '</tr></thead><tbody>';
      for (let i = 1; i < table.length; i++) {
        html += '<tr>' + table[i].map(c => '<td>' + c + '</td>').join('') + '</tr>';
      }
      html += '</tbody></table>';
      output.innerHTML = html;
      toast('ASCII table generated', 'success');
    }
  }

  function handleIpCalcAction(action, btn) {
    const input = $('#ip-input');
    const output = $('#ip-output');
    if (!input || !output) return;
    if (action === 'calculate') {
      const cidr = input.value.trim();
      const match = cidr.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)\/(\d+)$/);
      if (!match) { toast('Invalid CIDR format (e.g. 192.168.1.0/24)', 'error'); return; }
      const ipInt = (parseInt(match[1]) << 24) + (parseInt(match[2]) << 16) + (parseInt(match[3]) << 8) + parseInt(match[4]);
      const bits = parseInt(match[5]);
      const mask = ~(0xFFFFFFFF >>> bits);
      const network = ipInt & mask;
      const broadcast = network | ~mask;
      const hosts = Math.max(0, Math.pow(2, 32 - bits) - 2);
      function toIp(v) { return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.'); }
      output.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card-sm"><div class="stat-value">${escapeHtml(cidr)}</div><div class="stat-label">CIDR</div></div>
          <div class="stat-card-sm"><div class="stat-value">${toIp(network)}</div><div class="stat-label">Network</div></div>
          <div class="stat-card-sm"><div class="stat-value">${toIp(broadcast)}</div><div class="stat-label">Broadcast</div></div>
          <div class="stat-card-sm"><div class="stat-value">${toIp(mask >>> 0)}</div><div class="stat-label">Subnet Mask</div></div>
          <div class="stat-card-sm"><div class="stat-value">${hosts.toLocaleString()}</div><div class="stat-label">Usable Hosts</div></div>
          <div class="stat-card-sm"><div class="stat-value">${bits}</div><div class="stat-label">Prefix Length</div></div>
        </div>`;
      toast('IP calculation complete', 'success');
    }
  }

  function handleLoremIpsumAction(action, btn) {
    const output = $('#lorem-output');
    if (!output) return;
    const words = ['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim','ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi','aliquip','ex','ea','commodo','consequat','duis','aute','irure','dolor','in','reprehenderit','voluptate','velit','esse','cillum','eu','fugiat','nulla','pariatur','excepteur','sint','occaecat','cupidatat','non','proident','sunt','culpa','qui','officia','deserunt','mollit','anim','id','est','laborum'];
    if (action === 'generate-sentences') {
      const count = parseInt(btn?.dataset?.count || 3);
      const sentences = [];
      for (let s = 0; s < count; s++) {
        const len = 5 + Math.floor(Math.random() * 10);
        const sentence = [];
        for (let i = 0; i < len; i++) {
          const word = words[Math.floor(Math.random() * words.length)];
          sentence.push(i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word);
        }
        sentences.push(sentence.join(' ') + '.');
      }
      output.value = sentences.join(' ');
      toast('Generated ' + count + ' sentences', 'success');
    } else if (action === 'generate-paragraphs') {
      const count = parseInt(btn?.dataset?.count || 2);
      const paragraphs = [];
      for (let p = 0; p < count; p++) {
        const sentences = [];
        const numSentences = 3 + Math.floor(Math.random() * 5);
        for (let s = 0; s < numSentences; s++) {
          const len = 5 + Math.floor(Math.random() * 15);
          const sentence = [];
          for (let i = 0; i < len; i++) {
            const word = words[Math.floor(Math.random() * words.length)];
            sentence.push(i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word);
          }
          sentences.push(sentence.join(' ') + '.');
        }
        paragraphs.push(sentences.join(' '));
      }
      output.value = paragraphs.join('\n\n');
      toast('Generated ' + count + ' paragraphs', 'success');
    } else if (action === 'copy') {
      navigator.clipboard?.writeText(output.value);
      toast('Copied to clipboard', 'success');
    }
  }

  function renderTool(toolId) {
    const tool = tools.find(t => t.id === toolId);
    const title = tool ? tool.label : 'Utility';
    const renderers = {
      'json-formatter': renderJsonFormatter,
      'base64': renderBase64,
      'hash': renderHash,
      'uuid': renderUuid,
      'password': renderPassword,
      'url-encode': renderUrlEncode,
      'regex': renderRegex,
      'html-encode': renderHtmlEncode,
      'hex-bin': renderHexBin,
      'text-diff': renderTextDiff,
      'word-counter': renderWordCounter,
      'timestamp': renderTimestamp,
      'jwt': renderJwt,
      'cron': renderCron,
      'qr-code': renderQrCode,
      'color-picker': renderColorPicker,
      'yaml-xml': renderYamlXml,
      'csv-viewer': renderCsvViewer,
      'text-case': renderTextCase,
      'markdown-preview': renderMarkdownPreview,
      'ascii-table': renderAsciiTable,
      'ip-calc': renderIpCalc,
      'lorem-ipsum': renderLoremIpsum
    };

    const renderFn = renderers[toolId] || (() => '<div class="empty-state"><p>Tool not available</p></div>');
    return `<div class="utility-tool"><div class="utility-tool-header"><h3>${escapeHtml(title)}</h3></div><div class="utility-tool-body">${renderFn()}</div></div>`;
  }

  function renderJsonFormatter() {
    return `
      <div class="form-group">
        <label>JSON Input</label>
        <textarea id="json-input" class="form-control textarea-mono" rows="6" placeholder='{"key": "value"}'></textarea>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" data-utool="format" data-utid="json-formatter">Format</button>
        <button class="btn btn-secondary" data-utool="minify" data-utid="json-formatter">Minify</button>
        <button class="btn btn-ghost" data-utool="validate" data-utid="json-formatter">Validate</button>
      </div>
      <div class="form-group">
        <label>Formatted Output</label>
        <textarea id="json-output" class="form-control textarea-mono" rows="6" readonly placeholder="Formatted JSON will appear here"></textarea>
      </div>
      <div class="form-group">
        <label>Parsed Tree</label>
        <div id="json-tree" class="json-tree-container"></div>
      </div>`;
  }

  function renderBase64() {
    return `
      <div class="form-group">
        <label>Input</label>
        <textarea id="b64-input" class="form-control textarea-mono" rows="4" placeholder="Enter text to encode/decode"></textarea>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" data-utool="encode" data-utid="base64">Encode</button>
        <button class="btn btn-secondary" data-utool="decode" data-utid="base64">Decode</button>
      </div>
      <div class="form-group">
        <label>Result <button class="btn btn-ghost btn-sm" data-utool="copy" data-utid="base64">${icon('copy', 'icon-sm')}</button></label>
        <textarea id="b64-output" class="form-control textarea-mono" rows="4" readonly placeholder="Result will appear here"></textarea>
      </div>`;
  }

  function renderHash() {
    return `
      <div class="form-group">
        <label>Text to Hash</label>
        <textarea id="hash-input" class="form-control textarea-mono" rows="3" placeholder="Enter text to hash"></textarea>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" data-utool="md5" data-utid="hash">MD5</button>
        <button class="btn btn-secondary" data-utool="sha-1" data-utid="hash">SHA-1</button>
        <button class="btn btn-secondary" data-utool="sha-256" data-utid="hash">SHA-256</button>
        <button class="btn btn-secondary" data-utool="sha-512" data-utid="hash">SHA-512</button>
      </div>
      <div class="form-group">
        <label>Hash Output</label>
        <textarea id="hash-output" class="form-control textarea-mono" rows="2" readonly placeholder="Hash will appear here"></textarea>
      </div>`;
  }

  function renderUuid() {
    return `
      <div class="form-group">
        <label>Generated UUID v4</label>
        <div class="input-group">
          <input id="uuid-output" class="form-control textarea-mono" readonly placeholder="Click Generate" style="font-family:monospace;font-size:1.1em">
          <button class="btn btn-primary" data-utool="generate" data-utid="uuid">Generate</button>
          <button class="btn btn-ghost" data-utool="copy" data-utid="uuid">${icon('copy', 'icon-sm')}</button>
        </div>
      </div>`;
  }

  function renderPassword() {
    return `
      <div class="form-group">
        <label>Password Length: <span data-ulabel="password-length">16</span></label>
        <input type="range" data-ubind="password-length" min="4" max="64" value="16" class="form-range">
      </div>
      <div class="checkbox-group">
        <label class="checkbox-label"><input type="checkbox" id="pwd-upper" checked> A-Z (Uppercase)</label>
        <label class="checkbox-label"><input type="checkbox" id="pwd-lower" checked> a-z (Lowercase)</label>
        <label class="checkbox-label"><input type="checkbox" id="pwd-numbers" checked> 0-9 (Numbers)</label>
        <label class="checkbox-label"><input type="checkbox" id="pwd-symbols"> !@#$ (Symbols)</label>
      </div>
      <button class="btn btn-primary" data-utool="generate" data-utid="password">Generate Password</button>
      <div class="form-group">
        <label>Generated Password</label>
        <input id="pwd-output" class="form-control textarea-mono" readonly placeholder="Click Generate">
      </div>
      <div class="form-group">
        <label>Strength</label>
        <div class="strength-meter"><div class="strength-bar" id="pwd-strength-bar" style="width:0%"></div></div>
        <span id="pwd-strength-label" class="text-sm text-muted">Not generated</span>
      </div>`;
  }

  function renderUrlEncode() {
    return `
      <div class="form-group">
        <label>Input</label>
        <textarea id="url-input" class="form-control textarea-mono" rows="4" placeholder="https://example.com?name=hello world"></textarea>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" data-utool="encode" data-utid="url-encode">Encode</button>
        <button class="btn btn-secondary" data-utool="decode" data-utid="url-encode">Decode</button>
      </div>
      <div class="form-group">
        <label>Result</label>
        <textarea id="url-output" class="form-control textarea-mono" rows="4" readonly placeholder="Result will appear here"></textarea>
      </div>`;
  }

  function renderRegex() {
    return `
      <div class="form-group">
        <label>Pattern</label>
        <div class="input-group">
          <span class="input-affix">/</span>
          <input id="regex-pattern" class="form-control textarea-mono" placeholder="[a-z]+">
          <span class="input-affix">/</span>
          <input id="regex-flags" class="form-control textarea-mono" value="gi" style="width:60px;flex:none" placeholder="flags">
        </div>
      </div>
      <div class="form-group">
        <label>Test String</label>
        <textarea id="regex-input" class="form-control textarea-mono" rows="5" placeholder="Enter text to test against the pattern"></textarea>
      </div>
      <button class="btn btn-primary" data-utool="test" data-utid="regex">Test Regex</button>
      <div class="form-group">
        <label>Results</label>
        <div id="regex-results" class="regex-results-container"></div>
      </div>`;
  }

  function renderHtmlEncode() {
    return `
      <div class="form-group">
        <label>Input</label>
        <textarea id="html-input" class="form-control textarea-mono" rows="4" placeholder="<div class=&quot;test&quot;>Hello &amp; World</div>"></textarea>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" data-utool="encode" data-utid="html-encode">Encode</button>
        <button class="btn btn-secondary" data-utool="decode" data-utid="html-encode">Decode</button>
      </div>
      <div class="form-group">
        <label>Result</label>
        <textarea id="html-output" class="form-control textarea-mono" rows="4" readonly placeholder="Result will appear here"></textarea>
      </div>`;
  }

  function renderHexBin() {
    return `
      <div class="form-group">
        <label>Enter Value</label>
        <input id="hexbin-input" class="form-control textarea-mono" placeholder="Enter a number">
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" data-utool="dec" data-utid="hex-bin">Decimal</button>
        <button class="btn btn-secondary" data-utool="hex" data-utid="hex-bin">Hex</button>
        <button class="btn btn-secondary" data-utool="bin" data-utid="hex-bin">Binary</button>
        <button class="btn btn-secondary" data-utool="oct" data-utid="hex-bin">Octal</button>
      </div>
      <div class="conversion-grid">
        <div class="form-group"><label>Decimal</label><input id="hexbin-dec" class="form-control textarea-mono" readonly></div>
        <div class="form-group"><label>Hex</label><input id="hexbin-hex" class="form-control textarea-mono" readonly></div>
        <div class="form-group"><label>Binary</label><input id="hexbin-bin" class="form-control textarea-mono" readonly></div>
        <div class="form-group"><label>Octal</label><input id="hexbin-oct" class="form-control textarea-mono" readonly></div>
      </div>`;
  }

  function renderTextDiff() {
    return `
      <div class="diff-container">
        <div class="diff-panel">
          <label>Original Text</label>
          <textarea id="diff-left" class="form-control textarea-mono diff-textarea" rows="8" placeholder="Original text"></textarea>
        </div>
        <div class="diff-panel">
          <label>Modified Text</label>
          <textarea id="diff-right" class="form-control textarea-mono diff-textarea" rows="8" placeholder="Modified text"></textarea>
        </div>
      </div>
      <button class="btn btn-primary" data-utool="compare" data-utid="text-diff">Compare</button>
      <div class="form-group">
        <label>Differences</label>
        <div id="diff-output" class="diff-output-container"></div>
      </div>`;
  }

  function renderWordCounter() {
    return `
      <div class="form-group">
        <label>Enter Text</label>
        <textarea id="wc-input" class="form-control textarea-mono" rows="8" placeholder="Type or paste text here..." data-ubind="word-counter"></textarea>
      </div>
      <div class="stats-grid">
        <div class="stat-card-sm"><div class="stat-value" id="wc-count">0</div><div class="stat-label">Words</div></div>
        <div class="stat-card-sm"><div class="stat-value" id="wc-chars">0</div><div class="stat-label">Characters</div></div>
        <div class="stat-card-sm"><div class="stat-value" id="wc-lines">0</div><div class="stat-label">Lines</div></div>
        <div class="stat-card-sm"><div class="stat-value" id="wc-reading">0 min</div><div class="stat-label">Reading Time</div></div>
      </div>`;
  }

  function renderTimestamp() {
    return `
      <div class="form-group">
        <label>Unix Timestamp (seconds)</label>
        <input id="ts-unix" class="form-control textarea-mono" placeholder="1700000000">
      </div>
      <div class="form-group">
        <label>Human-Readable Date</label>
        <input id="ts-date" class="form-control" placeholder="2025-01-01 00:00:00" type="datetime-local">
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" data-utool="to-date" data-utid="timestamp">Unix → Date</button>
        <button class="btn btn-secondary" data-utool="to-unix" data-utid="timestamp">Date → Unix</button>
        <button class="btn btn-ghost" data-utool="now" data-utid="timestamp">Now</button>
      </div>`;
  }

  function renderJwt() {
    return `
      <div class="form-group">
        <label>JWT Token</label>
        <textarea id="jwt-input" class="form-control textarea-mono" rows="3" placeholder="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN..."></textarea>
      </div>
      <button class="btn btn-primary" data-utool="decode" data-utid="jwt">Decode JWT</button>
      <div class="form-group">
        <label>Header</label>
        <textarea id="jwt-header" class="form-control textarea-mono" rows="4" readonly placeholder="Decoded header will appear here"></textarea>
      </div>
      <div class="form-group">
        <label>Payload</label>
        <textarea id="jwt-payload" class="form-control textarea-mono" rows="6" readonly placeholder="Decoded payload will appear here"></textarea>
      </div>`;
  }

  function renderCron() {
    const nums = (start, end) => {
      let opts = '<option value="*">* (any)</option>';
      for (let i = start; i <= end; i++) opts += `<option value="${i}">${i}</option>`;
      return opts;
    };
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return `
      <div class="cron-grid">
        <div class="form-group"><label>Minute</label><select id="cron-minute" class="form-control" data-ubind="cron-field">${nums(0, 59)}</select></div>
        <div class="form-group"><label>Hour</label><select id="cron-hour" class="form-control" data-ubind="cron-field">${nums(0, 23)}</select></div>
        <div class="form-group"><label>Day of Month</label><select id="cron-day" class="form-control" data-ubind="cron-field">${nums(1, 31)}</select></div>
        <div class="form-group"><label>Month</label><select id="cron-month" class="form-control" data-ubind="cron-field">
          <option value="*">* (any)</option>
          ${months.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}
        </select></div>
        <div class="form-group"><label>Weekday</label><select id="cron-weekday" class="form-control" data-ubind="cron-field">
          <option value="*">* (any)</option>
          ${days.map((d, i) => `<option value="${i}">${d}</option>`).join('')}
        </select></div>
      </div>
      <div class="form-group">
        <label>Cron Expression <button class="btn btn-ghost btn-sm" data-utool="copy" data-utid="cron">${icon('copy', 'icon-sm')}</button></label>
        <input id="cron-output" class="form-control textarea-mono" readonly placeholder="* * * * *">
      </div>
      <div class="cron-description" id="cron-desc">Every minute</div>`;
  }

  function renderQrCode() {
    return `
      <div class="form-group">
        <label>Text or URL to Encode</label>
        <textarea id="qr-input" class="form-control textarea-mono" rows="3" placeholder="https://example.com"></textarea>
      </div>
      <button class="btn btn-primary" data-utool="generate" data-utid="qr-code">Generate QR Code</button>
      <div class="form-group">
        <label>QR Code</label>
        <div id="qr-display" class="qr-display"><div class="text-muted" style="padding:20px;text-align:center">Enter text and click Generate</div></div>
      </div>`;
  }

  function renderColorPicker() {
    return `
      <div class="color-picker-row">
        <div class="form-group">
          <label>Pick a Color</label>
          <input type="color" data-ubind="color-picker" value="#3B82F6" class="color-input">
        </div>
        <div class="color-preview-container">
          <div class="color-preview" id="color-preview" style="background:#3B82F6"></div>
        </div>
      </div>
      <div class="color-values">
        <div class="form-group"><label>Hex <button class="btn btn-ghost btn-sm" data-utool="copy-hex" data-utid="color-picker">${icon('copy', 'icon-sm')}</button></label><input id="color-hex" class="form-control textarea-mono" readonly value="#3B82F6"></div>
        <div class="form-group"><label>RGB <button class="btn btn-ghost btn-sm" data-utool="copy-rgb" data-utid="color-picker">${icon('copy', 'icon-sm')}</button></label><input id="color-rgb" class="form-control textarea-mono" readonly value="rgb(59, 130, 246)"></div>
        <div class="form-group"><label>HSL <button class="btn btn-ghost btn-sm" data-utool="copy-hsl" data-utid="color-picker">${icon('copy', 'icon-sm')}</button></label><input id="color-hsl" class="form-control textarea-mono" readonly value="hsl(217, 91%, 60%)"></div>
      </div>`;
  }

  function renderYamlXml() {
    return `
      <div class="form-group">
        <label>Input (YAML or XML)</label>
        <textarea id="yaml-input" class="form-control textarea-mono" rows="6" placeholder="Paste YAML or XML content here"></textarea>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" data-utool="format-yaml" data-utid="yaml-xml">Format YAML</button>
        <button class="btn btn-secondary" data-utool="format-xml" data-utid="yaml-xml">Format XML</button>
      </div>
      <div class="form-group">
        <label>Formatted Output</label>
        <textarea id="yaml-output" class="form-control textarea-mono" rows="6" readonly placeholder="Formatted output will appear here"></textarea>
      </div>`;
  }

  function renderCsvViewer() {
    return `
      <p class="text-sm text-muted mb-3">Paste comma-separated data to view as a table</p>
      <div class="form-group">
        <label>CSV Data</label>
        <textarea id="csv-input" class="form-control textarea-mono" rows="6" placeholder="name,email,role&#10;Alice,alice@example.com,Admin&#10;Bob,bob@example.com,User"></textarea>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" data-utool="parse" data-utid="csv-viewer">Parse & View</button>
        <button class="btn btn-ghost" data-utool="clear" data-utid="csv-viewer">Clear</button>
      </div>
      <div class="form-group">
        <label>Preview</label>
        <div id="csv-table-output" class="diff-output-container" style="padding:8px"><p class="text-muted">Parsed table will appear here</p></div>
      </div>`;
  }

  function renderTextCase() {
    return `
      <p class="text-sm text-muted mb-3">Convert text between different case formats</p>
      <div class="form-group">
        <label>Input Text</label>
        <textarea id="tcase-input" class="form-control textarea-mono" rows="4" placeholder="Enter text to convert"></textarea>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary btn-sm" data-utool="upper" data-utid="text-case">UPPER</button>
        <button class="btn btn-secondary btn-sm" data-utool="lower" data-utid="text-case">lower</button>
        <button class="btn btn-secondary btn-sm" data-utool="title" data-utid="text-case">Title Case</button>
        <button class="btn btn-secondary btn-sm" data-utool="camel" data-utid="text-case">camelCase</button>
        <button class="btn btn-secondary btn-sm" data-utool="pascal" data-utid="text-case">PascalCase</button>
        <button class="btn btn-secondary btn-sm" data-utool="snake" data-utid="text-case">snake_case</button>
        <button class="btn btn-secondary btn-sm" data-utool="kebab" data-utid="text-case">kebab-case</button>
        <button class="btn btn-ghost btn-sm" data-utool="invert" data-utid="text-case">Invert</button>
      </div>
      <div class="form-group">
        <label>Output</label>
        <textarea id="tcase-output" class="form-control textarea-mono" rows="4" readonly placeholder="Converted text will appear here"></textarea>
      </div>`;
  }

  function renderMarkdownPreview() {
    return `
      <p class="text-sm text-muted mb-3">Write Markdown and preview the rendered HTML</p>
      <div class="diff-container">
        <div class="diff-panel">
          <div class="form-group">
            <label>Markdown Input</label>
            <textarea id="md-input" class="form-control textarea-mono diff-textarea" rows="8" placeholder="# Heading&#10;Write **bold** or *italic* text here"></textarea>
          </div>
          <button class="btn btn-primary" data-utool="preview" data-utid="markdown-preview">Preview</button>
        </div>
        <div class="diff-panel">
          <label>Rendered Preview</label>
          <div id="md-preview" class="diff-output-container" style="padding:12px;background:var(--bg)"><p class="text-muted">Preview will appear here</p></div>
        </div>
      </div>`;
  }

  function renderAsciiTable() {
    return `
      <p class="text-sm text-muted mb-3">ASCII character reference table (0-127)</p>
      <div class="btn-group">
        <button class="btn btn-primary" data-utool="generate" data-utid="ascii-table">Generate ASCII Table</button>
      </div>
      <div class="form-group">
        <div id="ascii-output" class="diff-output-container" style="padding:8px"><p class="text-muted">Click generate to display the ASCII table</p></div>
      </div>`;
  }

  function renderIpCalc() {
    return `
      <p class="text-sm text-muted mb-3">Calculate network details from a CIDR notation</p>
      <div class="form-group">
        <label>CIDR Notation</label>
        <input type="text" id="ip-input" class="form-control textarea-mono" placeholder="192.168.1.0/24" style="max-width:300px">
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" data-utool="calculate" data-utid="ip-calc">Calculate</button>
      </div>
      <div id="ip-output"></div>`;
  }

  function renderLoremIpsum() {
    return `
      <p class="text-sm text-muted mb-3">Generate placeholder text for mockups and testing</p>
      <div class="btn-group">
        <button class="btn btn-primary" data-utool="generate-sentences" data-utid="lorem-ipsum" data-count="3">3 Sentences</button>
        <button class="btn btn-secondary" data-utool="generate-sentences" data-utid="lorem-ipsum" data-count="5">5 Sentences</button>
        <button class="btn btn-secondary" data-utool="generate-paragraphs" data-utid="lorem-ipsum" data-count="1">1 Paragraph</button>
        <button class="btn btn-secondary" data-utool="generate-paragraphs" data-utid="lorem-ipsum" data-count="3">3 Paragraphs</button>
        <button class="btn btn-ghost" data-utool="copy" data-utid="lorem-ipsum">Copy</button>
      </div>
      <div class="form-group">
        <label>Generated Text</label>
        <textarea id="lorem-output" class="form-control textarea-mono" rows="6" readonly placeholder="Generated text will appear here"></textarea>
      </div>`;
  }

  function ContainerStyles() {
    if ($('#utility-styles')) return;
    const style = document.createElement('style');
    style.id = 'utility-styles';
    style.textContent = `
      .utility-hub { display:flex; gap:0; height:100%; min-height:calc(100vh - 120px); }
      .utility-sidebar { width:220px; min-width:220px; background:var(--surface); border-right:1px solid var(--border); overflow-y:auto; padding:8px; }
      .utility-main { flex:1; overflow-y:auto; padding:16px; }
      .utility-category { margin-bottom:12px; }
      .utility-category-label { font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); padding:4px 8px; margin-bottom:2px; font-weight:600; }
      .utility-nav-item { display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border:none; background:transparent; color:var(--text); border-radius:6px; cursor:pointer; font-size:13px; text-align:left; transition:all 0.15s; }
      .utility-nav-item:hover { background:var(--hover); }
      .utility-nav-item.active { background:var(--primary); color:#fff; }
      .utility-nav-item .icon-sm { width:16px; height:16px; flex-shrink:0; }
      .utility-tool-header h3 { margin:0 0 16px 0; font-size:16px; font-weight:600; }
      .utility-tool-body { max-width:800px; }
      .form-group { margin-bottom:12px; }
      .form-group label { display:block; font-size:12px; font-weight:500; color:var(--text-muted); margin-bottom:4px; display:flex; align-items:center; gap:6px; }
      .form-control { width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:6px; background:var(--surface); color:var(--text); font-size:13px; outline:none; }
      .form-control:focus { border-color:var(--primary); box-shadow:0 0 0 2px rgba(59,130,246,0.15); }
      .textarea-mono { font-family:'Cascadia Code','Fira Code','Consolas',monospace; font-size:13px; }
      .form-control[readonly] { background:var(--bg); opacity:0.8; }
      .btn-group { display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
      .btn { padding:8px 16px; border:none; border-radius:6px; cursor:pointer; font-size:13px; font-weight:500; transition:all 0.15s; display:inline-flex; align-items:center; gap:6px; }
      .btn-sm { padding:4px 8px; font-size:11px; }
      .btn-primary { background:var(--primary); color:#fff; }
      .btn-primary:hover { opacity:0.9; }
      .btn-secondary { background:var(--hover); color:var(--text); }
      .btn-secondary:hover { background:var(--border); }
      .btn-ghost { background:transparent; color:var(--text-muted); }
      .btn-ghost:hover { background:var(--hover); color:var(--text); }
      .input-group { display:flex; gap:6px; align-items:center; }
      .input-affix { padding:4px 8px; background:var(--hover); border:1px solid var(--border); border-radius:4px; font-size:14px; color:var(--text-muted); font-family:monospace; }
      .checkbox-group { display:flex; flex-wrap:wrap; gap:12px; margin-bottom:12px; }
      .checkbox-label { display:flex; align-items:center; gap:6px; font-size:13px; cursor:pointer; }
      .checkbox-label input[type="checkbox"] { width:16px; height:16px; accent-color:var(--primary); }
      .form-range { width:100%; max-width:400px; accent-color:var(--primary); }
      .strength-meter { height:6px; background:var(--border); border-radius:3px; overflow:hidden; margin-bottom:4px; max-width:400px; }
      .strength-bar { height:100%; border-radius:3px; transition:all 0.3s; }
      .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
      .stat-card-sm { padding:16px; background:var(--surface); border:1px solid var(--border); border-radius:8px; text-align:center; }
      .stat-card-sm .stat-value { font-size:24px; font-weight:700; color:var(--primary); }
      .stat-card-sm .stat-label { font-size:11px; color:var(--text-muted); margin-top:2px; }
      .diff-container { display:flex; gap:12px; margin-bottom:12px; }
      .diff-panel { flex:1; }
      .diff-textarea { min-height:200px; }
      .diff-table { width:100%; border-collapse:collapse; font-family:monospace; font-size:12px; }
      .diff-table td { padding:4px 8px; border:1px solid var(--border); }
      .diff-lineno { width:32px; text-align:right; color:var(--text-muted); background:var(--bg); font-size:11px; }
      .diff-same td { background:transparent; }
      .diff-diff td { background:transparent; }
      .diff-removed { background:rgba(239,68,68,0.12); color:#EF4444; text-decoration:line-through; }
      .diff-added { background:rgba(34,197,94,0.12); color:#22C55E; }
      .diff-output-container { max-height:400px; overflow:auto; border:1px solid var(--border); border-radius:6px; }
      .conversion-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      .cron-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
      .cron-description { padding:12px; background:var(--hover); border-radius:6px; font-size:13px; color:var(--text-muted); margin-top:8px; }
      .regex-results-container { min-height:60px; border:1px solid var(--border); border-radius:6px; padding:4px; }
      .regex-match-count { padding:8px; font-size:12px; color:var(--primary); font-weight:600; }
      .regex-match-item { display:flex; align-items:center; gap:12px; padding:6px 8px; border-bottom:1px solid var(--border); font-size:13px; }
      .regex-match-index { color:var(--text-muted); font-size:11px; min-width:24px; }
      .regex-match-value { background:var(--hover); padding:2px 6px; border-radius:3px; font-family:monospace; }
      .text-muted { color:var(--text-muted); }
      .text-sm { font-size:12px; }
      .text-danger { color:#EF4444; }
      .json-tree-container { padding:8px; border:1px solid var(--border); border-radius:6px; font-family:monospace; font-size:13px; line-height:1.6; background:var(--bg); max-height:400px; overflow:auto; }
      .json-tree-item { white-space:nowrap; }
      .json-key { color:#22C55E; }
      .json-string { color:#EAB308; }
      .json-number { color:#3B82F6; }
      .json-bool { color:#A855F7; }
      .json-null { color:#EF4444; }
      .json-bracket { color:var(--text-muted); }
      .qr-display { min-height:200px; border:1px solid var(--border); border-radius:6px; display:flex; align-items:center; justify-content:center; }
      .qr-placeholder { text-align:center; padding:16px; }
      .qr-placeholder-grid { display:grid; grid-template-columns:repeat(11,12px); grid-template-rows:repeat(11,12px); gap:2px; justify-content:center; margin:0 auto 12px; }
      .qr-dot { width:12px; height:12px; border-radius:2px; background:var(--border); }
      .qr-dot-fill { background:var(--text); }
      .qr-placeholder-label { font-size:11px; color:var(--text-muted); word-break:break-all; max-width:200px; }
      .color-picker-row { display:flex; gap:16px; align-items:flex-start; }
      .color-input { width:60px; height:60px; padding:2px; border:1px solid var(--border); border-radius:6px; cursor:pointer; }
      .color-preview-container { flex:1; }
      .color-preview { width:100%; height:60px; border-radius:6px; border:1px solid var(--border); }
      .color-values { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-top:12px; }
      .ip-result { margin-top:12px; }
      #ascii-output table { font-size:11px; }
      #ascii-output th { background:var(--hover); font-weight:600; padding:4px 6px; border:1px solid var(--border); text-align:center; }
      #ascii-output td { padding:3px 6px; border:1px solid var(--border); text-align:center; font-family:monospace; }
      .csv-preview table th { background:var(--hover); font-weight:600; padding:6px 8px; border:1px solid var(--border); }
      .csv-preview table td { padding:4px 8px; border:1px solid var(--border); }
      #md-preview h1 { font-size:20px; font-weight:700; margin:8px 0; }
      #md-preview h2 { font-size:17px; font-weight:600; margin:6px 0; }
      #md-preview h3 { font-size:15px; font-weight:600; margin:4px 0; }
      #md-preview code { background:var(--hover); padding:1px 4px; border-radius:3px; font-size:12px; font-family:monospace; }
      #md-preview ul { padding-left:20px; margin:4px 0; }
      #md-preview a { color:var(--primary); }
      @media (max-width:768px) {
        .utility-sidebar { width:160px; min-width:160px; }
        .stats-grid { grid-template-columns:repeat(2,1fr); }
        .diff-container { flex-direction:column; }
        .conversion-grid { grid-template-columns:1fr; }
        .cron-grid { grid-template-columns:repeat(2,1fr); }
        .color-values { grid-template-columns:1fr; }
      }`;
    document.head.appendChild(style);
  }

  return { render };
})();

CrackItModules.CrackItUtilities = CrackItUtilities;
