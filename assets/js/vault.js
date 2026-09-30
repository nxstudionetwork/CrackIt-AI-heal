const CrackItVault = (() => {
  'use strict';

  const { escapeHtml, formatDate, uid, icon, formatSize } = CrackItUtils;
  const store = CrackItStorage;
  let activeSection = 'all';
  let searchQuery = '';
  let activeClientId = null;
  let activeClientTab = 'overview';

  const SECTIONS = [
    { id: 'all', label: 'All Items', icon: 'database' },
    { id: 'clients', label: 'Clients', icon: 'clients' },
    { id: 'projects', label: 'Archived Projects', icon: 'projects' },
    { id: 'reports', label: 'Reports', icon: 'reports' },
    { id: 'files', label: 'Files', icon: 'files' },
    { id: 'evidence', label: 'Evidence', icon: 'shield' },
    { id: 'templates', label: 'Templates', icon: 'template' },
    { id: 'chats', label: 'AI Chats', icon: 'chat' },
    { id: 'scripts', label: 'Scripts', icon: 'code' },
    { id: 'prompts', label: 'Prompt Library', icon: 'prompt' },
    { id: 'exports', label: 'Exports & Backups', icon: 'download' }
  ];

  const CLIENT_TABS = ['overview', 'projects', 'reports', 'findings', 'evidence', 'knowledge', 'notes', 'timeline', 'attachments'];

  async function render(container) {
    if (activeClientId) {
      return renderClientDetail(container);
    }

    const items = getVaultItems();
    const total = items.length;
    const sectionCounts = getSectionCounts();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content">
          <h1>Vault</h1>
          <p>${total} items \u00B7 Archive & Storage Center</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" data-action="archive-all">Archive Current</button>
          <button class="btn btn-secondary" data-action="export-all">Export All</button>
        </div>
      </div>

      <div class="filter-bar" style="overflow-x:auto;white-space:nowrap">
        <input type="text" class="input" placeholder="Search vault..." id="vault-search" style="max-width:280px">
        <div class="ml-auto flex gap-2">
          ${SECTIONS.map(s => `
            <button class="btn btn-ghost btn-sm vault-section-filter ${activeSection === s.id ? 'active' : ''}" data-section="${s.id}">
              ${icon(s.icon, 'icon-sm')} ${s.label}
              ${sectionCounts[s.id] ? `<span class="badge badge-gray ml-1">${sectionCounts[s.id]}</span>` : ''}
            </button>
          `).join('')}
        </div>
      </div>

      <div id="vault-grid" class="project-grid">
        ${items.length ? renderGrid(items) : renderEmptyState()}
      </div>`;

    bindEvents(container);
  }

  function getSectionCounts() {
    const counts = {};
    SECTIONS.forEach(s => counts[s.id] = 0);
    const items = gatherVaultData();
    items.forEach(i => {
      counts[i.section] = (counts[i.section] || 0) + 1;
      counts.all = (counts.all || 0) + 1;
    });
    return counts;
  }

  function gatherVaultData() {
    const items = [];
    const projects = store.getCollection('projects') || [];
    const reports = store.getCollection('reports') || [];
    const files = store.getCollection('files') || [];
    const findings = store.getCollection('findings') || [];
    const templates = store.getCollection('templates') || [];
    const conversations = store.getCollection('conversations') || [];
    const vaultItems = store.getCollection('vault_items') || [];
    const clients = store.getCollection('clients') || [];

    clients.forEach(c => {
      const projCount = store.relationships.getClientProjects(c.id).length;
      items.push({ id: c.id, section: 'clients', title: c.name, description: `${c.industry || ''} \u00B7 ${projCount} projects \u00B7 ${c.contactPerson || ''}`, icon: 'clients', updatedAt: c.updatedAt, source: c });
    });

    projects.filter(p => p.archived || p.status === 'completed').forEach(p => {
      items.push({ id: p.id, section: 'projects', title: p.name, description: p.description, icon: 'projects', updatedAt: p.updatedAt, source: p });
    });

    reports.forEach(r => {
      items.push({ id: r.id, section: 'reports', title: r.title, description: r.summary, icon: 'reports', updatedAt: r.updatedAt, source: r });
    });

    files.filter(f => f.type === 'py' || f.type === 'sh').forEach(f => {
      items.push({ id: f.id, section: 'scripts', title: f.name, description: `Script in ${f.folder}`, icon: 'code', updatedAt: f.modifiedAt, source: f });
    });

    files.filter(f => f.folder === 'Evidence').forEach(f => {
      items.push({ id: f.id, section: 'evidence', title: f.name, description: 'Evidence file', icon: 'shield', updatedAt: f.modifiedAt, source: f });
    });

    files.forEach(f => {
      items.push({ id: f.id, section: 'files', title: f.name, description: `${f.folder} / ${(f.size / 1024).toFixed(0)} KB`, icon: 'files', updatedAt: f.modifiedAt, source: f });
    });

    templates.forEach(t => {
      items.push({ id: t.id, section: 'templates', title: t.name, description: t.description, icon: 'template', updatedAt: t.createdAt, source: t });
    });

    conversations.forEach(c => {
      items.push({ id: c.id, section: 'chats', title: c.title, description: `${c.messages?.length || 0} messages`, icon: 'chat', updatedAt: c.createdAt, source: c });
    });

    vaultItems.forEach(v => {
      items.push({ id: v.id, section: v.type || 'exports', title: v.name || 'Export', description: v.description || 'Vault item', icon: v.type === 'backup' ? 'download' : 'file', updatedAt: v.createdAt, source: v });
    });

    return items;
  }

  function getVaultItems() {
    let items = gatherVaultData();

    if (activeSection !== 'all') {
      items = items.filter(i => i.section === activeSection);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q)
      );
    }

    return items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  function getSectionIcon(sectionId) {
    const s = SECTIONS.find(s => s.id === sectionId);
    return s ? s.icon : 'file';
  }

  function getSectionLabel(sectionId) {
    const s = SECTIONS.find(s => s.id === sectionId);
    return s ? s.label : sectionId;
  }

  function renderRiskBadge(level) {
    const map = { low: 'badge-gray', medium: 'badge-yellow', high: 'badge-orange', critical: 'badge-red' };
    return `<span class="badge ${map[level] || 'badge-gray'}">${escapeHtml(level || 'unknown')}</span>`;
  }

  function renderGrid(items) {
    return items.map(item => {
      const secIcon = getSectionIcon(item.section);
      const isClient = item.section === 'clients';
      return `
        <div class="card hover-lift vault-item ${isClient ? 'vault-client-card' : ''}" data-id="${escapeHtml(item.id)}" data-section="${item.section}" ${isClient ? `data-action="open-client" data-client-id="${escapeHtml(item.id)}"` : ''} style="${isClient ? 'cursor:pointer' : ''}">
          <div class="card-body">
            <div class="flex justify-between items-start mb-2">
              <div class="flex items-center gap-3">
                <div style="width:36px;height:36px;border-radius:var(--radius-md);background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;color:var(--accent-cyan)">
                  ${icon(secIcon)}
                </div>
                <div>
                  <h3 class="font-semibold text-sm">${escapeHtml(item.title.length > 40 ? item.title.slice(0, 40) + '...' : item.title)}</h3>
                  <span class="badge badge-cyan text-xs">${getSectionLabel(item.section)}</span>
                  ${isClient && item.source ? renderRiskBadge(item.source.riskLevel) : ''}
                </div>
              </div>
            </div>
            ${item.description ? `<p class="text-sm text-muted mb-2">${escapeHtml(item.description.length > 80 ? item.description.slice(0, 80) + '...' : item.description)}</p>` : ''}
            <div class="flex justify-between items-center text-xs text-muted">
              <span>Updated ${formatDate(item.updatedAt, true)}</span>
            </div>
            <div class="flex gap-2 mt-3">
              ${isClient ? `
                <button class="btn btn-ghost btn-sm" data-action="open-client" data-client-id="${escapeHtml(item.id)}">${icon('eye', 'icon-sm')} View</button>
              ` : `
                <button class="btn btn-ghost btn-sm" data-action="preview" data-section="${item.section}" data-id="${escapeHtml(item.id)}">Preview</button>
                <button class="btn btn-ghost btn-sm" data-action="restore" data-section="${item.section}" data-id="${escapeHtml(item.id)}">Restore</button>
              `}
              <button class="btn btn-ghost btn-sm text-red" data-action="delete-vault" data-id="${escapeHtml(item.id)}">Delete</button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function renderEmptyState() {
    return `
      <div class="col-span-12">
        <div class="empty-state">
          <div class="empty-state-icon">${CrackItUtils.icons.database}</div>
          <h3>Vault is empty</h3>
          <p>Archived projects, reports, files, and other artifacts will appear here.</p>
          <button class="btn btn-primary mt-4" data-action="archive-all">Archive Projects</button>
        </div>
      </div>`;
  }

  function bindEvents(container) {
    container.querySelector('#vault-search')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      refresh(container);
    });

    container.querySelectorAll('.vault-section-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.vault-section-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSection = btn.dataset.section;
        activeClientId = null;
        refresh(container);
      });
    });

    container.querySelector('[data-action="archive-all"]')?.addEventListener('click', () => {
      CrackItUI.toast('Archiving completed projects...', 'info');
      const projects = store.getCollection('projects');
      projects.forEach(p => {
        if (p.status === 'completed') {
          store.updateInCollection('projects', p.id, { archived: true });
        }
      });
      refresh(container);
    });

    container.querySelector('[data-action="export-all"]')?.addEventListener('click', () => {
      CrackItUI.toast('Exporting vault data... (simulated)', 'success');
      const data = JSON.stringify(gatherVaultData(), null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crackit-vault-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    container.querySelectorAll('[data-action="open-client"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.clientId || btn.closest('[data-client-id]')?.dataset.clientId;
        if (id) {
          activeClientId = id;
          activeClientTab = 'overview';
          render(container);
        }
      });
    });

    container.querySelectorAll('.vault-client-card').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const id = el.dataset.clientId || el.dataset.id;
        if (id) {
          activeClientId = id;
          activeClientTab = 'overview';
          render(container);
        }
      });
    });

    container.querySelectorAll('[data-action="preview"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        const id = btn.dataset.id;
        let item = null;
        if (section === 'projects') item = store.findInCollection('projects', id);
        else if (section === 'reports') item = store.findInCollection('reports', id);
        else if (section === 'files' || section === 'evidence' || section === 'scripts') item = store.findInCollection('files', id);
        else if (section === 'templates') item = store.findInCollection('templates', id);
        else if (section === 'chats') item = store.findInCollection('conversations', id);

        if (item) {
          CrackItUI.toast(`Viewing: ${item.title || item.name}`, 'info');
        }
      });
    });

    container.querySelectorAll('[data-action="restore"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        const id = btn.dataset.id;
        if (section === 'projects') {
          store.updateInCollection('projects', id, { archived: false });
          CrackItUI.toast('Project restored from archive', 'success');
        } else {
          CrackItUI.toast(`Item restored from ${section}`, 'success');
        }
        refresh(container);
      });
    });

    container.querySelectorAll('[data-action="delete-vault"]').forEach(btn => {
      btn.addEventListener('click', () => {
        CrackItUI.confirm('Permanently delete this vault item?', () => {
          CrackItUI.toast('Item removed from vault', 'info');
          refresh(container);
        });
      });
    });
  }

  function refresh(container) {
    render(container);
  }

  function renderClientDetail(container) {
    const client = store.findInCollection('clients', activeClientId);
    if (!client) {
      activeClientId = null;
      render(container);
      return;
    }

    const projects = store.relationships.getClientProjects(client.id);
    const projectIds = projects.map(p => p.id);
    const allReports = store.getCollection('reports').filter(r => projectIds.includes(r.projectId));
    const allFindings = store.getCollection('findings').filter(f => projectIds.includes(f.projectId));
    const allFiles = store.getCollection('files');
    const evidence = allFiles.filter(f => (f.folder === 'Evidence' || f.folder === 'evidence') && projectIds.includes(f.projectId));
    const knowledgeColl = store.getCollection('knowledge') || [];
    const knowledge = knowledgeColl.filter(k => projectIds.includes(k.projectId) || (k.tags || []).some(t => (client.tags || []).includes(t) || k.title?.toLowerCase().includes(client.name.toLowerCase())));
    const notes = store.getCollection('notes').filter(n => (n.tags || []).some(t => t === client.name.toLowerCase().replace(/\s+/g, '-') || (client.tags || []).includes(t)) || (n.folder && n.folder.toLowerCase() === client.name.toLowerCase()));
    const attachments = allFiles.filter(f => projectIds.includes(f.projectId) || (f.tags || []).some(t => (client.tags || []).includes(t)));

    const timeline = [];
    timeline.push({ date: client.createdAt, text: 'Client Created', type: 'client' });
    timeline.push({ date: client.updatedAt, text: 'Client Updated', type: 'client' });
    projects.forEach(p => timeline.push({ date: p.createdAt, text: `Project Created: ${p.name}`, type: 'project', ref: p.id }));
    projects.filter(p => p.updatedAt).forEach(p => timeline.push({ date: p.updatedAt, text: `Project Updated: ${p.name}`, type: 'project', ref: p.id }));
    allFindings.forEach(f => timeline.push({ date: f.createdAt, text: `Finding: ${f.title}`, type: 'finding', ref: f.id }));
    allReports.forEach(r => timeline.push({ date: r.createdAt, text: `Report: ${r.title}`, type: 'report', ref: r.id }));
    evidence.forEach(e => timeline.push({ date: e.modifiedAt || e.createdAt, text: `Evidence: ${e.name}`, type: 'evidence', ref: e.id }));
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content" style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-ghost btn-icon" data-action="back-to-vault" title="Back to vault">${CrackItUtils.icons.chevronLeft}</button>
          <div>
            <h1 style="margin:0;font-size:20px">${escapeHtml(client.name)}</h1>
            <p style="margin:2px 0 0;color:var(--text-muted);font-size:12px">${escapeHtml(client.industry || '\u2014')} ${renderRiskBadge(client.riskLevel)} <span class="badge badge-${client.status === 'active' ? 'green' : 'gray'}">${client.status || 'active'}</span></p>
          </div>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" data-action="edit-client-vault">${icon('edit', 'icon-sm')} Edit</button>
          <button class="btn btn-primary btn-sm" data-action="new-project-from-client-vault">${icon('plus', 'icon-sm')} New Project</button>
        </div>
      </div>

      <div class="project-detail-tabs" style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:0;overflow-x:auto">
        ${CLIENT_TABS.map(t => `
          <button class="btn btn-ghost btn-sm vault-client-tab ${activeClientTab === t ? 'active' : ''}" data-tab="${t}" style="padding:8px 16px;border-bottom:2px solid ${activeClientTab === t ? 'var(--accent-blue)' : 'transparent'};border-radius:0;text-transform:capitalize">${t}</button>
        `).join('')}
      </div>

      <div id="vault-client-detail-content">
        ${renderClientTabContent(activeClientTab, client, projects, allReports, allFindings, evidence, knowledge, notes, timeline, attachments, allFiles)}
      </div>`;

    bindClientDetailEvents(container, client);
  }

  function renderClientTabContent(tab, client, projects, reports, findings, evidence, knowledge, notes, timeline, attachments, allFiles) {
    const fns = {
      overview: () => renderOverviewTab(client),
      projects: () => renderProjectsTab(client, projects),
      reports: () => renderReportsTab(client, reports),
      findings: () => renderFindingsTab(client, findings),
      evidence: () => renderEvidenceTab(client, evidence),
      knowledge: () => renderKnowledgeTab(client, knowledge),
      notes: () => renderNotesTab(client, notes),
      timeline: () => renderTimelineTab(client, timeline),
      attachments: () => renderAttachmentsTab(client, attachments)
    };
    return (fns[tab] || fns.overview)();
  }

  function renderOverviewTab(c) {
    const addr = c.address || {};
    const techTags = (c.technologyStack || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ') || '\u2014';
    const domainTags = (c.domainNames || []).map(d => `<span class="tag tag-blue">${escapeHtml(d)}</span>`).join(' ') || '\u2014';
    const compTags = (c.complianceStandards || []).map(s => `<span class="tag tag-purple">${escapeHtml(s)}</span>`).join(' ') || '\u2014';
    const ndaClass = c.ndaStatus === 'signed' ? 'green' : (c.ndaStatus === 'pending' ? 'yellow' : 'gray');
    const contractClass = c.contractStatus === 'active' ? 'green' : (c.contractStatus === 'renewal' ? 'blue' : 'gray');

    return `
      <div class="dashboard-grid">
        <div class="col-span-6">
          <div class="card">
            <div class="card-header"><span class="card-title">${icon('info', 'icon-sm')} Basic Information</span></div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Client ID</label><div style="font-family:monospace;font-size:12px;margin-top:2px">${escapeHtml(c.id)}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Name</label><div style="font-weight:500;margin-top:2px">${escapeHtml(c.name)}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Company</label><div style="margin-top:2px">${escapeHtml(c.company || '\u2014')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Industry</label><div style="margin-top:2px">${escapeHtml(c.industry || '\u2014')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Status</label><div style="margin-top:2px"><span class="badge badge-${c.status === 'active' ? 'green' : 'gray'}">${c.status || 'active'}</span></div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Risk Level</label><div style="margin-top:2px">${renderRiskBadge(c.riskLevel)}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Created</label><div style="margin-top:2px">${formatDate(c.createdAt, true)}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Updated</label><div style="margin-top:2px">${formatDate(c.updatedAt, true)}</div></div>
              </div>
            </div>
          </div>

          <div class="card mt-3">
            <div class="card-header"><span class="card-title">${icon('user', 'icon-sm')} Primary Contact</span></div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Contact Person</label><div style="font-weight:500;margin-top:2px">${escapeHtml(c.contactPerson || '\u2014')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Email</label><div style="margin-top:2px">${c.contactEmail ? `<a href="mailto:${escapeHtml(c.contactEmail)}">${escapeHtml(c.contactEmail)}</a>` : '\u2014'}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Phone</label><div style="margin-top:2px">${escapeHtml(c.contactPhone || '\u2014')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Website</label><div style="margin-top:2px">${c.website ? `<a href="${escapeHtml(c.website)}" target="_blank">${escapeHtml(c.website)}</a>` : '\u2014'}</div></div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-6">
          <div class="card">
            <div class="card-header"><span class="card-title">${icon('map', 'icon-sm')} Address</span></div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Country</label><div style="margin-top:2px">${escapeHtml(addr.country || '\u2014')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">State</label><div style="margin-top:2px">${escapeHtml(addr.state || '\u2014')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">City</label><div style="margin-top:2px">${escapeHtml(addr.city || '\u2014')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Postal Code</label><div style="margin-top:2px">${escapeHtml(addr.zip || '\u2014')}</div></div>
                <div style="grid-column:1/-1"><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Full Address</label><div style="margin-top:2px">${escapeHtml(addr.fullAddress || '\u2014')}</div></div>
              </div>
            </div>
          </div>

          <div class="card mt-3">
            <div class="card-header"><span class="card-title">${icon('shield', 'icon-sm')} Security Information</span></div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Scope</label><div style="font-weight:500;margin-top:2px">${escapeHtml(c.securityScope || '\u2014')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">NDA</label><div style="margin-top:2px"><span class="badge badge-${ndaClass}">${escapeHtml(c.ndaStatus || '\u2014')}</span></div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Contract</label><div style="margin-top:2px"><span class="badge badge-${contractClass}">${escapeHtml(c.contractStatus || '\u2014')}</span></div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Testing Window</label><div style="margin-top:2px">${escapeHtml(c.allowedTestingWindow || '\u2014')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Emergency Contact</label><div style="margin-top:2px">${escapeHtml(c.emergencyContact || '\u2014')}</div></div>
              </div>
              ${compTags !== '\u2014' ? `<div style="margin-top:12px"><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:6px">Compliance Standards</label><div style="display:flex;gap:4px;flex-wrap:wrap">${compTags}</div></div>` : ''}
            </div>
          </div>

          <div class="card mt-3">
            <div class="card-header"><span class="card-title">${icon('briefcase', 'icon-sm')} Business Details</span></div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px">
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Hosting</label><div style="margin-top:2px">${escapeHtml(c.hostingProvider || '\u2014')}</div></div>
                <div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Cloud</label><div style="margin-top:2px">${escapeHtml(c.cloudProvider || '\u2014')}</div></div>
              </div>
              ${techTags !== '\u2014' ? `<div style="margin-bottom:12px"><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:6px">Technology Stack</label><div style="display:flex;gap:4px;flex-wrap:wrap">${techTags}</div></div>` : ''}
              ${domainTags !== '\u2014' ? `<div style="margin-bottom:12px"><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:6px">Domains</label><div style="display:flex;gap:4px;flex-wrap:wrap">${domainTags}</div></div>` : ''}
              ${c.businessDescription ? `<div><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:6px">Description</label><p style="margin:0;line-height:1.5">${escapeHtml(c.businessDescription)}</p></div>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderProjectsTab(client, projects) {
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">${icon('projects', 'icon-sm')} Linked Projects (${projects.length})</span><button class="btn btn-primary btn-sm" data-action="new-project-from-client-vault">${icon('plus', 'icon-sm')} New Project</button></div>
        <div class="card-body" style="padding:0">
          ${projects.length ? `<div class="table-container"><table class="table">
            <thead><tr><th>Name</th><th>Status</th><th>Priority</th><th>Progress</th><th>Updated</th><th></th></tr></thead>
            <tbody>${projects.map(p => `
              <tr>
                <td><div class="font-medium">${escapeHtml(p.name)}</div></td>
                <td><span class="badge badge-${p.status === 'active' ? 'green' : p.status === 'completed' ? 'blue' : 'gray'}">${p.status || ''}</span></td>
                <td><span class="badge badge-${p.priority === 'critical' ? 'red' : p.priority === 'high' ? 'yellow' : 'gray'}">${p.priority || ''}</span></td>
                <td><div class="progress" style="width:80px"><div class="progress-bar" style="width:${p.progress || 0}%"></div></div></td>
                <td class="text-muted">${formatDate(p.updatedAt, true)}</td>
                <td><button class="btn btn-ghost btn-sm" data-action="navigate-to-projects">${icon('eye', 'icon-sm')}</button></td>
              </tr>`).join('')}</tbody></table></div>`
          : `<div class="card-body"><div class="empty-state" style="padding:32px"><p>No projects linked to this client yet.</p></div></div>`}
        </div>
      </div>`;
  }

  function renderReportsTab(client, reports) {
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">${icon('reports', 'icon-sm')} Reports (${reports.length})</span></div>
        <div class="card-body" style="padding:0">
          ${reports.length ? `<div class="table-container"><table class="table">
            <thead><tr><th>Title</th><th>Severity</th><th>Status</th><th>Findings</th><th>Date</th></tr></thead>
            <tbody>${reports.map(r => `
              <tr>
                <td><div class="font-medium">${escapeHtml(r.title)}</div></td>
                <td>${renderRiskBadge(r.severity)}</td>
                <td><span class="badge badge-${r.status === 'published' ? 'green' : r.status === 'review' ? 'yellow' : 'gray'}">${r.status || ''}</span></td>
                <td>${r.findings || 0}</td>
                <td class="text-muted">${formatDate(r.createdAt, true)}</td>
              </tr>`).join('')}</tbody></table></div>`
          : `<div class="card-body"><div class="empty-state" style="padding:32px"><p>No reports for this client yet.</p></div></div>`}
        </div>
      </div>`;
  }

  function renderFindingsTab(client, findings) {
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">${icon('target', 'icon-sm')} Security Findings (${findings.length})</span></div>
        <div class="card-body" style="padding:0">
          ${findings.length ? `<div class="table-container"><table class="table">
            <thead><tr><th>Title</th><th>Severity</th><th>Status</th><th>CVSS</th><th>CVE</th><th>Date</th></tr></thead>
            <tbody>${findings.map(f => `
              <tr>
                <td><div class="font-medium">${escapeHtml(f.title)}</div></td>
                <td>${renderRiskBadge(f.severity)}</td>
                <td><span class="badge badge-${f.status === 'closed' ? 'green' : f.status === 'verified' ? 'blue' : f.status === 'in-progress' ? 'yellow' : 'gray'}">${f.status || ''}</span></td>
                <td>${f.cvss ? f.cvss.toFixed(1) : '\u2014'}</td>
                <td class="text-xs">${f.cve ? `<code>${escapeHtml(f.cve)}</code>` : '\u2014'}</td>
                <td class="text-muted">${formatDate(f.createdAt, true)}</td>
              </tr>`).join('')}</tbody></table></div>`
          : `<div class="card-body"><div class="empty-state" style="padding:32px"><p>No findings for this client yet.</p></div></div>`}
        </div>
      </div>`;
  }

  function renderEvidenceTab(client, evidence) {
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">${icon('shield', 'icon-sm')} Evidence (${evidence.length})</span></div>
        <div class="card-body" style="padding:0">
          ${evidence.length ? evidence.map(f => `
            <div class="list-item">
              <div class="list-item-icon" style="color:var(--accent-cyan)">${CrackItUtils.icons.shield}</div>
              <div class="list-item-content"><div class="list-item-title">${escapeHtml(f.name)}</div><div class="list-item-subtitle">${formatSize ? formatSize(f.size) : ((f.size / 1024).toFixed(0) + ' KB')} \u00B7 ${formatDate(f.modifiedAt || f.createdAt, true)}</div></div>
              <button class="btn btn-ghost btn-sm" data-action="preview-evidence" data-id="${escapeHtml(f.id)}">View</button>
            </div>`).join('')
          : `<div class="card-body"><div class="empty-state" style="padding:32px"><p>No evidence files collected.</p></div></div>`}
        </div>
      </div>`;
  }

  function renderKnowledgeTab(client, knowledge) {
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">${icon('knowledge', 'icon-sm')} Knowledge (${knowledge.length})</span></div>
        <div class="card-body" style="padding:0">
          ${knowledge.length ? knowledge.map(k => `
            <div class="list-item">
              <div class="list-item-icon" style="color:var(--accent-purple)">${CrackItUtils.icons.knowledge}</div>
              <div class="list-item-content"><div class="list-item-title">${escapeHtml(k.title || k.name || 'Knowledge Item')}</div><div class="list-item-subtitle">${formatDate(k.updatedAt || k.createdAt, true)}</div></div>
              <button class="btn btn-ghost btn-sm" data-action="navigate-to-knowledge">${icon('eye', 'icon-sm')}</button>
            </div>`).join('')
          : `<div class="card-body"><div class="empty-state" style="padding:32px"><p>No knowledge items related to this client.</p></div></div>`}
        </div>
      </div>`;
  }

  function renderNotesTab(client, notes) {
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">${icon('notes', 'icon-sm')} Internal Notes (${notes.length})</span></div>
        <div class="card-body" style="padding:0">
          ${notes.length ? notes.map(n => `
            <div class="list-item">
              <div class="list-item-icon" style="color:var(--accent-yellow)">${CrackItUtils.icons.notes}</div>
              <div class="list-item-content"><div class="list-item-title">${escapeHtml(n.title)}</div><div class="list-item-subtitle">${n.folder || ''} \u00B7 ${formatDate(n.updatedAt || n.createdAt, true)}</div></div>
              <button class="btn btn-ghost btn-sm" data-action="navigate-to-notes">${icon('eye', 'icon-sm')}</button>
            </div>`).join('')
          : `<div class="card-body"><div class="empty-state" style="padding:32px"><p>No notes for this client. Create notes with a tag matching the client name.</p></div></div>`}
        </div>
      </div>`;
  }

  function renderTimelineTab(client, timeline) {
    const typeColors = { client: 'var(--accent-blue)', project: 'var(--accent-green)', finding: 'var(--accent-red)', report: 'var(--accent-yellow)', evidence: 'var(--accent-cyan)' };
    const typeIcons = { client: 'star', project: 'projects', finding: 'target', report: 'reports', evidence: 'shield' };

    return `
      <div class="card">
        <div class="card-header"><span class="card-title">${icon('clock', 'icon-sm')} Activity Timeline (${timeline.length} events)</span></div>
        <div class="card-body" style="max-height:500px;overflow-y:auto">
          <div style="position:relative;padding-left:24px">
            <div style="position:absolute;left:8px;top:0;bottom:0;width:2px;background:var(--border)"></div>
            ${timeline.slice(0, 100).map(e => `
              <div style="position:relative;padding:0 0 16px 16px">
                <div style="position:absolute;left:-18px;top:2px;width:12px;height:12px;border-radius:50%;background:${typeColors[e.type] || 'var(--accent-blue)'};border:2px solid var(--bg-primary)"></div>
                <div style="font-size:11px;color:var(--text-muted)">${formatDate(e.date, true)}</div>
                <div style="font-size:13px;color:var(--text-primary);margin-top:2px;display:flex;align-items:center;gap:6px">
                  <span style="color:${typeColors[e.type] || 'var(--text-muted)'}">${CrackItUtils.icon(typeIcons[e.type] || 'info', 'icon-sm')}</span>
                  ${escapeHtml(e.text)}
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  function renderAttachmentsTab(client, attachments) {
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">${icon('files', 'icon-sm')} Attachments (${attachments.length})</span></div>
        <div class="card-body">
          ${attachments.length ? `<div class="project-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">${attachments.slice(0, 50).map(f => `
            <div class="card hover-lift" style="cursor:pointer">
              <div class="card-body">
                <div style="font-size:24px;margin-bottom:8px;color:var(--accent-cyan)">${CrackItUtils.icons.file}</div>
                <div style="font-size:13px;font-weight:500" class="truncate">${escapeHtml(f.name)}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${f.type || ''} \u00B7 ${formatSize ? formatSize(f.size) : ((f.size / 1024).toFixed(0) + ' KB')}</div>
                <div style="font-size:11px;color:var(--text-muted)">${f.folder || ''}</div>
              </div>
            </div>`).join('')}</div>`
          : '<div class="empty-state" style="padding:32px"><p>No attachments for this client.</p></div>'}
        </div>
      </div>`;
  }

  function bindClientDetailEvents(container, client) {
    container.querySelector('[data-action="back-to-vault"]')?.addEventListener('click', () => {
      activeClientId = null;
      activeClientTab = 'overview';
      render(container);
    });

    container.querySelectorAll('.vault-client-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeClientTab = btn.dataset.tab;
        renderClientDetail(container);
      });
    });

    container.querySelector('[data-action="edit-client-vault"]')?.addEventListener('click', () => {
      showClientForm(client.id, container);
    });

    container.querySelector('[data-action="new-project-from-client-vault"]')?.addEventListener('click', () => {
      const project = store.addToCollection('projects', {
        id: uid('proj'),
        name: 'Project for ' + client.name,
        description: 'Security project for ' + client.name,
        status: 'planning',
        priority: 'medium',
        progress: 0,
        tags: ['client', client.name.toLowerCase().replace(/\s+/g, '-')],
        color: '#3B82F6',
        pinned: false,
        members: ['Admin'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      store.relationships.addRelationship('client-project', client.id, project.id);
      CrackItUI.toast('Project created for ' + client.name, 'success');
      renderClientDetail(container);
    });

    container.querySelectorAll('[data-action="navigate-to-projects"]').forEach(btn => {
      btn.addEventListener('click', () => CrackItRouter.navigate('projects'));
    });

    container.querySelectorAll('[data-action="navigate-to-knowledge"]').forEach(btn => {
      btn.addEventListener('click', () => CrackItRouter.navigate('knowledge'));
    });

    container.querySelectorAll('[data-action="navigate-to-notes"]').forEach(btn => {
      btn.addEventListener('click', () => CrackItRouter.navigate('notes'));
    });

    container.querySelectorAll('[data-action="preview-evidence"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const file = store.findInCollection('files', btn.dataset.id);
        if (file) CrackItUI.toast('Evidence: ' + file.name, 'info');
      });
    });
  }

  function showClientForm(clientId, container) {
    const client = clientId ? store.findInCollection('clients', clientId) : null;
    const isEdit = !!client;
    const addr = (client && client.address) || {};
    const title = isEdit ? 'Edit Client: ' + client.name : 'New Client';

    const industries = ['Technology', 'Finance', 'Healthcare', 'Government', 'Energy', 'Education', 'Retail', 'Manufacturing'];
    const indOpts = industries.map(function(i) {
      return '<option value="' + i + '"' + ((client && client.industry === i) ? ' selected' : '') + '>' + i + '</option>';
    }).join('');

    const formContent = `
      <form id="vault-client-form" class="client-form">
        <div class="form-section"><h4>${icon('info')} Basic Information</h4>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Client Name *</label><input type="text" class="input" name="name" value="${escapeHtml(client ? (client.name || '') : '')}" required></div>
            <div class="form-group"><label class="form-label">Company</label><input type="text" class="input" name="company" value="${escapeHtml(client ? (client.company || '') : '')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Industry</label><select class="input select" name="industry"><option value="">Select Industry</option>${indOpts}</select></div>
            <div class="form-group"><label class="form-label">Website</label><input type="url" class="input" name="website" value="${escapeHtml(client ? (client.website || '') : '')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Email</label><input type="email" class="input" name="email" value="${escapeHtml(client ? (client.email || '') : '')}"></div>
            <div class="form-group"><label class="form-label">Phone</label><input type="text" class="input" name="phone" value="${escapeHtml(client ? (client.phone || '') : '')}"></div>
          </div>
        </div>
        <div class="form-section"><h4>${icon('map')} Address</h4>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Country</label><input type="text" class="input" name="country" value="${escapeHtml(addr.country || '')}"></div>
            <div class="form-group"><label class="form-label">State</label><input type="text" class="input" name="state" value="${escapeHtml(addr.state || '')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">City</label><input type="text" class="input" name="city" value="${escapeHtml(addr.city || '')}"></div>
            <div class="form-group"><label class="form-label">Postal Code</label><input type="text" class="input" name="zip" value="${escapeHtml(addr.zip || '')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Full Address</label><textarea class="input" name="fullAddress" rows="2">${escapeHtml(addr.fullAddress || '')}</textarea></div>
          </div>
        </div>
        <div class="form-section"><h4>${icon('user')} Primary Contact</h4>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Contact Person</label><input type="text" class="input" name="contactPerson" value="${escapeHtml(client ? (client.contactPerson || '') : '')}"></div>
            <div class="form-group"><label class="form-label">Contact Email</label><input type="email" class="input" name="contactEmail" value="${escapeHtml(client ? (client.contactEmail || '') : '')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Contact Phone</label><input type="text" class="input" name="contactPhone" value="${escapeHtml(client ? (client.contactPhone || '') : '')}"></div>
          </div>
        </div>
        <div class="form-section"><h4>${icon('briefcase')} Business Details</h4>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Hosting Provider</label><input type="text" class="input" name="hostingProvider" value="${escapeHtml(client ? (client.hostingProvider || '') : '')}"></div>
            <div class="form-group"><label class="form-label">Cloud Provider</label><input type="text" class="input" name="cloudProvider" value="${escapeHtml(client ? (client.cloudProvider || '') : '')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Technology Stack (comma separated)</label><input type="text" class="input" name="technologyStack" value="${escapeHtml(client ? (client.technologyStack || []).join(', ') : '')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Domain Names (comma separated)</label><input type="text" class="input" name="domainNames" value="${escapeHtml(client ? (client.domainNames || []).join(', ') : '')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Business Description</label><textarea class="input" name="businessDescription" rows="3">${escapeHtml(client ? (client.businessDescription || '') : '')}</textarea></div>
          </div>
        </div>
        <div class="form-section"><h4>${icon('shield')} Security Information</h4>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Security Scope</label><input type="text" class="input" name="securityScope" value="${escapeHtml(client ? (client.securityScope || '') : '')}"></div>
            <div class="form-group"><label class="form-label">Risk Level</label><select class="input select" name="riskLevel">
              <option value="low"${(client && client.riskLevel === 'low') ? ' selected' : ''}>Low</option>
              <option value="medium"${(client && client.riskLevel === 'medium') ? ' selected' : ''}>Medium</option>
              <option value="high"${(client && client.riskLevel === 'high') ? ' selected' : ''}>High</option>
              <option value="critical"${(client && client.riskLevel === 'critical') ? ' selected' : ''}>Critical</option>
            </select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">NDA Status</label><select class="input select" name="ndaStatus">
              <option value="signed"${(client && client.ndaStatus === 'signed') ? ' selected' : ''}>Signed</option>
              <option value="pending"${(client && client.ndaStatus === 'pending') ? ' selected' : ''}>Pending</option>
              <option value="expired"${(client && client.ndaStatus === 'expired') ? ' selected' : ''}>Expired</option>
            </select></div>
            <div class="form-group"><label class="form-label">Contract Status</label><select class="input select" name="contractStatus">
              <option value="active"${(client && client.contractStatus === 'active') ? ' selected' : ''}>Active</option>
              <option value="pending"${(client && client.contractStatus === 'pending') ? ' selected' : ''}>Pending</option>
              <option value="completed"${(client && client.contractStatus === 'completed') ? ' selected' : ''}>Completed</option>
              <option value="renewal"${(client && client.contractStatus === 'renewal') ? ' selected' : ''}>Renewal</option>
            </select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Compliance Standards (comma separated)</label><input type="text" class="input" name="complianceStandards" value="${escapeHtml(client ? (client.complianceStandards || []).join(', ') : '')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Allowed Testing Window</label><input type="text" class="input" name="allowedTestingWindow" value="${escapeHtml(client ? (client.allowedTestingWindow || '') : '')}"></div>
            <div class="form-group"><label class="form-label">Emergency Contact</label><input type="text" class="input" name="emergencyContact" value="${escapeHtml(client ? (client.emergencyContact || '') : '')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Status</label><select class="input select" name="status">
              <option value="active"${(!client || client.status === 'active') ? ' selected' : ''}>Active</option>
              <option value="archived"${(client && client.status === 'archived') ? ' selected' : ''}>Archived</option>
            </select></div>
          </div>
        </div>
      </form>`;

    const modalId = 'vault-client-form-modal';
    let modal = document.getElementById('modal-' + modalId);

    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'modal-' + modalId;
      modal.setAttribute('role', 'dialog');
      modal.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <h2 class="modal-title">${title}</h2>
            <button class="modal-close" aria-label="Close">${CrackItUtils.icons.close}</button>
          </div>
          <div class="modal-body" style="max-height:70vh;overflow-y:auto"></div>
          <div class="modal-footer">
            <button class="btn btn-secondary modal-close">Cancel</button>
            <button class="btn btn-primary" id="vault-client-form-save">${icon('save')} ${isEdit ? 'Update' : 'Create'} Client</button>
          </div>
        </div>`;
      document.body.appendChild(modal);

      modal.querySelector('.modal-close').addEventListener('click', function() { CrackItUI.closeModal(modalId); });
      modal.addEventListener('click', function(e) { if (e.target === modal) CrackItUI.closeModal(modalId); });
    }

    modal.querySelector('.modal-title').textContent = title;
    modal.querySelector('.modal-body').innerHTML = formContent;
    const saveBtn = modal.querySelector('#vault-client-form-save');
    saveBtn.innerHTML = icon('save') + ' ' + (isEdit ? 'Update' : 'Create') + ' Client';
    saveBtn.onclick = function() { saveClientForm(clientId, container, modal, modalId); };

    modal.classList.add('open');
  }

  function saveClientForm(clientId, container, modal, modalId) {
    const form = document.getElementById('vault-client-form');
    if (!form) return;

    const fd = new FormData(form);
    const data = {
      name: fd.get('name') || 'Unnamed Client',
      company: fd.get('company') || '',
      industry: fd.get('industry') || '',
      website: fd.get('website') || '',
      email: fd.get('email') || '',
      phone: fd.get('phone') || '',
      contactPerson: fd.get('contactPerson') || '',
      contactEmail: fd.get('contactEmail') || '',
      contactPhone: fd.get('contactPhone') || '',
      hostingProvider: fd.get('hostingProvider') || '',
      cloudProvider: fd.get('cloudProvider') || '',
      securityScope: fd.get('securityScope') || '',
      ndaStatus: fd.get('ndaStatus') || 'pending',
      contractStatus: fd.get('contractStatus') || 'pending',
      riskLevel: fd.get('riskLevel') || 'low',
      allowedTestingWindow: fd.get('allowedTestingWindow') || '',
      emergencyContact: fd.get('emergencyContact') || '',
      status: fd.get('status') || 'active',
      businessDescription: fd.get('businessDescription') || '',
      address: {
        country: fd.get('country') || '',
        state: fd.get('state') || '',
        city: fd.get('city') || '',
        zip: fd.get('zip') || '',
        fullAddress: fd.get('fullAddress') || ''
      },
      technologyStack: (fd.get('technologyStack') || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean),
      domainNames: (fd.get('domainNames') || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean),
      complianceStandards: (fd.get('complianceStandards') || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean)
    };

    if (clientId) {
      store.updateInCollection('clients', clientId, data);
      CrackItUI.toast('Client updated successfully', 'success');
    } else {
      data.id = uid('client');
      data.createdAt = new Date().toISOString();
      data.updatedAt = new Date().toISOString();
      data.tags = [];
      store.addToCollection('clients', data);
      CrackItUI.toast('Client created successfully', 'success');
    }

    CrackItUI.closeModal(modalId);
    render(container);
  }

  return { render };
})();

CrackItModules.CrackItVault = CrackItVault;
