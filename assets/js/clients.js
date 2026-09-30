/**
 * CrackIt — Clients Module (Client Vault)
 */

const CrackItClients = (() => {
  'use strict';

  const { escapeHtml, formatDate, uid, icon } = CrackItUtils;
  const store = CrackItStorage;

  let currentView = 'list';
  let selectedClientId = null;
  let filterText = '';

  function render(container) {
    if (currentView === 'detail' && selectedClientId) {
      renderDetail(container, selectedClientId);
    } else {
      renderList(container);
    }
  }

  function renderList(container) {
    const clients = getFilteredClients();
    const total = store.getCollection('clients').length;
    const active = store.getCollection('clients').filter(c => c.status !== 'archived').length;

    container.innerHTML = [
      '<div class="page-header">',
        '<div class="page-header-content">',
          '<h1>', icon('clients'), ' Client Vault</h1>',
          '<p>', total, ' clients · ', active, ' active · Manage your cybersecurity clients</p>',
        '</div>',
        '<div class="page-header-actions">',
          '<button class="btn btn-primary" data-action="new-client">', icon('plus'), ' New Client</button>',
        '</div>',
      '</div>',
      '<div class="filter-bar">',
        '<input type="text" class="input" placeholder="Search by name, company, contact..." id="client-search" value="', escapeHtml(filterText), '" style="max-width:360px">',
        '<div class="view-toggle ml-auto">',
          '<span class="text-sm text-muted mr-2">', total, ' total</span>',
        '</div>',
      '</div>',
      '<div id="clients-list">',
        clients.length ? renderClientsTable(clients) : renderEmptyState(),
      '</div>'
    ].join('');

    bindListEvents(container);
  }

  function renderEmptyState() {
    return [
      '<div class="card">',
        '<div class="card-body" style="text-align:center;padding:60px 20px">',
          '<div style="font-size:48px;opacity:0.3;margin-bottom:16px">', icon('clients'), '</div>',
          '<h3>No Clients Found</h3>',
          '<p class="text-muted">', filterText ? 'No clients match your search criteria.' : 'Start by adding your first cybersecurity client.', '</p>',
          '<button class="btn btn-primary mt-4" data-action="new-client">', icon('plus'), ' Add Client</button>',
        '</div>',
      '</div>'
    ].join('');
  }

  function renderClientsTable(clients) {
    var rows = clients.map(function(c) {
      var projs = store.relationships.getClientProjects(c.id);
      var statusBadge = c.status === 'active' ? 'green' : 'gray';
      var archiveTitle = c.status === 'archived' ? 'Restore' : 'Archive';
      var archiveIcon = c.status === 'archived' ? icon('refresh') : icon('archive');
      return [
        '<tr data-client-id="', c.id, '" class="hover-lift" style="cursor:pointer">',
          '<td>',
            '<div class="font-medium">', escapeHtml(c.name), '</div>',
            '<div class="text-xs text-muted">ID: ', c.id.slice(0, 12), '</div>',
          '</td>',
          '<td>', escapeHtml(c.company || c.name), '</td>',
          '<td><span class="badge badge-gray">', escapeHtml(c.industry || '\u2014'), '</span></td>',
          '<td>', renderRiskBadge(c.riskLevel), '</td>',
          '<td><span class="badge badge-', statusBadge, '">', c.status || 'active', '</span></td>',
          '<td><span class="badge badge-blue">', projs.length, '</span></td>',
          '<td class="text-right">',
            '<button class="btn btn-ghost btn-icon" data-action="view-client" title="Open">', icon('eye'), '</button>',
            '<button class="btn btn-ghost btn-icon" data-action="edit-client" title="Edit">', icon('edit'), '</button>',
            '<button class="btn btn-ghost btn-icon" data-action="archive-client" title="', archiveTitle, '">', archiveIcon, '</button>',
          '</td>',
        '</tr>'
      ].join('');
    }).join('');

    return [
      '<div class="table-container">',
        '<table class="table">',
          '<thead><tr>',
            '<th>Name</th><th>Company</th><th>Industry</th><th>Risk Level</th><th>Status</th><th>Projects</th><th class="text-right">Actions</th>',
          '</tr></thead>',
          '<tbody>', rows, '</tbody>',
        '</table>',
      '</div>'
    ].join('');
  }

  function renderRiskBadge(level) {
    var map = { low: 'badge-gray', medium: 'badge-yellow', high: 'badge-orange', critical: 'badge-red' };
    return '<span class="badge ' + (map[level] || 'badge-gray') + '">' + escapeHtml(level || 'unknown') + '</span>';
  }

  function getFilteredClients() {
    var clients = store.getCollection('clients').slice();
    var searchEl = document.getElementById('client-search');
    var search = (searchEl ? searchEl.value : filterText).toLowerCase();
    filterText = search;

    if (search) {
      clients = clients.filter(function(c) {
        return (c.name && c.name.toLowerCase().includes(search)) ||
               (c.company && c.company.toLowerCase().includes(search)) ||
               (c.contactPerson && c.contactPerson.toLowerCase().includes(search)) ||
               (c.email && c.email.toLowerCase().includes(search)) ||
               (c.contactEmail && c.contactEmail.toLowerCase().includes(search));
      });
    }

    clients.sort(function(a, b) {
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
    return clients;
  }

  function bindListEvents(container) {
    var searchEl = container.querySelector('#client-search');
    if (searchEl) {
      searchEl.addEventListener('input', function(e) {
        filterText = e.target.value;
        render(container);
      });
    }

    var newBtn = container.querySelector('[data-action="new-client"]');
    if (newBtn) {
      newBtn.addEventListener('click', function() {
        showClientForm(null, container);
      });
    }

    container.querySelectorAll('[data-action="view-client"]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var row = e.target.closest('tr');
        if (row) openClientDetail(row.dataset.clientId, container);
      });
    });

    container.querySelectorAll('[data-action="edit-client"]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var row = e.target.closest('tr');
        if (row) showClientForm(row.dataset.clientId, container);
      });
    });

    container.querySelectorAll('[data-action="archive-client"]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var row = e.target.closest('tr');
        if (row) toggleArchive(row.dataset.clientId, container);
      });
    });

    container.querySelectorAll('tr[data-client-id]').forEach(function(row) {
      row.addEventListener('dblclick', function() {
        openClientDetail(row.dataset.clientId, container);
      });
    });
  }

  async function toggleArchive(clientId, container) {
    var client = store.findInCollection('clients', clientId);
    if (!client) return;
    var newStatus = client.status === 'archived' ? 'active' : 'archived';
    if (CrackItAPI.isAuthenticated()) {
      try { await CrackItAPI.clients.update(clientId, { status: newStatus }); } catch (e) { console.warn('API client update failed:', e); }
    }
    store.updateInCollection('clients', clientId, { status: newStatus });
    CrackItUI.toast('Client ' + (newStatus === 'archived' ? 'archived' : 'restored') + ' successfully', 'success');
    render(container);
  }

  function openClientDetail(clientId, container) {
    selectedClientId = clientId;
    currentView = 'detail';
    render(container);
  }

  function renderDetail(container, clientId) {
    var client = store.findInCollection('clients', clientId);
    if (!client) {
      currentView = 'list';
      selectedClientId = null;
      render(container);
      return;
    }

    var projects = store.relationships.getClientProjects(clientId);
    var activeProjects = projects.filter(function(p) { return p.status === 'active'; });
    var completedProjects = projects.filter(function(p) { return p.status === 'completed'; });
    var projectIds = projects.map(function(p) { return p.id; });
    var allReports = store.getCollection('reports').filter(function(r) { return projectIds.indexOf(r.projectId) !== -1; });
    var allFindings = store.getCollection('findings').filter(function(f) { return projectIds.indexOf(f.projectId) !== -1; });
    var allFiles = store.getCollection('files').filter(function(f) { return projectIds.indexOf(f.projectId) !== -1; });
    var allNotes = store.getCollection('notes').filter(function(n) { return projectIds.indexOf(n.projectId) !== -1; });
    var allConversations = store.getCollection('conversations').filter(function(cv) { return projectIds.indexOf(cv.projectId) !== -1; });
    var allKnowledge = store.getCollection('knowledge').filter(function(k) { return projectIds.indexOf(k.projectId) !== -1; });

    container.innerHTML = [
      '<div class="page-header">',
        '<div class="page-header-content">',
          '<button class="btn btn-ghost mb-2" data-action="back-to-list">', icon('chevronLeft'), ' Back to Clients</button>',
          '<h1>', escapeHtml(client.name), '</h1>',
          '<p>', escapeHtml(client.industry || '\u2014'), ' ', renderRiskBadge(client.riskLevel), ' Client ID: ', client.id.slice(0, 16), '</p>',
        '</div>',
        '<div class="page-header-actions">',
          '<button class="btn btn-secondary" data-action="edit-client-detail">', icon('edit'), ' Edit</button>',
          '<button class="btn btn-primary" data-action="new-project-from-client">', icon('plus'), ' New Project</button>',
        '</div>',
      '</div>',
      '<div class="tabs" id="client-tabs">',
        '<button class="tab active" data-tab="basic">Basic Info</button>',
        '<button class="tab" data-tab="address">Address</button>',
        '<button class="tab" data-tab="contact">Contact</button>',
        '<button class="tab" data-tab="business">Business</button>',
        '<button class="tab" data-tab="security">Security</button>',
        '<button class="tab" data-tab="projects-tab">Projects (', projects.length, ')</button>',
      '</div>',
      '<div class="client-detail-content">',
        renderBasicTab(client),
        renderAddressTab(client),
        renderContactTab(client),
        renderBusinessTab(client),
        renderSecurityTab(client),
        renderProjectsTab(client, projects, activeProjects, completedProjects, allReports, allFindings, allFiles, allNotes, allConversations, allKnowledge),
      '</div>'
    ].join('');

    bindDetailEvents(container, client);
  }

  function renderBasicTab(c) {
    return [
      '<div class="tab-panel active" data-panel="basic">',
        '<div class="card"><div class="card-body">',
          '<h3 class="card-title mb-4">', icon('info'), ' Basic Information</h3>',
          '<div class="detail-grid">',
            '<div class="detail-field"><label>Client ID</label><span class="detail-value code">', escapeHtml(c.id), '</span></div>',
            '<div class="detail-field"><label>Name</label><span class="detail-value">', escapeHtml(c.name), '</span></div>',
            '<div class="detail-field"><label>Company</label><span class="detail-value">', escapeHtml(c.company || '\u2014'), '</span></div>',
            '<div class="detail-field"><label>Industry</label><span class="detail-value">', escapeHtml(c.industry || '\u2014'), '</span></div>',
            '<div class="detail-field"><label>Website</label><span class="detail-value">', c.website ? '<a href="' + escapeHtml(c.website) + '" target="_blank">' + escapeHtml(c.website) + '</a>' : '\u2014', '</span></div>',
            '<div class="detail-field"><label>Email</label><span class="detail-value">', c.email ? '<a href="mailto:' + escapeHtml(c.email) + '">' + escapeHtml(c.email) + '</a>' : '\u2014', '</span></div>',
            '<div class="detail-field"><label>Phone</label><span class="detail-value">', escapeHtml(c.phone || '\u2014'), '</span></div>',
            '<div class="detail-field"><label>Alt Phone</label><span class="detail-value">', escapeHtml(c.altPhone || c.contactPhone || '\u2014'), '</span></div>',
          '</div>',
        '</div></div>',
      '</div>'
    ].join('');
  }

  function renderAddressTab(c) {
    var addr = c.address || {};
    return [
      '<div class="tab-panel" data-panel="address">',
        '<div class="card"><div class="card-body">',
          '<h3 class="card-title mb-4">', icon('map'), ' Address</h3>',
          '<div class="detail-grid">',
            '<div class="detail-field"><label>Country</label><span class="detail-value">', escapeHtml(addr.country || '\u2014'), '</span></div>',
            '<div class="detail-field"><label>State</label><span class="detail-value">', escapeHtml(addr.state || '\u2014'), '</span></div>',
            '<div class="detail-field"><label>City</label><span class="detail-value">', escapeHtml(addr.city || '\u2014'), '</span></div>',
            '<div class="detail-field"><label>Postal Code</label><span class="detail-value">', escapeHtml(addr.zip || addr.postalCode || '\u2014'), '</span></div>',
            '<div class="detail-field detail-field--full"><label>Full Address</label><span class="detail-value">', escapeHtml(addr.fullAddress || '\u2014'), '</span></div>',
          '</div>',
        '</div></div>',
      '</div>'
    ].join('');
  }

  function renderContactTab(c) {
    return [
      '<div class="tab-panel" data-panel="contact">',
        '<div class="card"><div class="card-body">',
          '<h3 class="card-title mb-4">', icon('user'), ' Primary Contact</h3>',
          '<div class="detail-grid">',
            '<div class="detail-field"><label>Contact Person</label><span class="detail-value">', escapeHtml(c.contactPerson || '\u2014'), '</span></div>',
            '<div class="detail-field"><label>Designation</label><span class="detail-value">', escapeHtml(c.contactDesignation || c.designation || '\u2014'), '</span></div>',
            '<div class="detail-field"><label>Department</label><span class="detail-value">', escapeHtml(c.contactDepartment || c.department || '\u2014'), '</span></div>',
            '<div class="detail-field"><label>Email</label><span class="detail-value">', c.contactEmail ? '<a href="mailto:' + escapeHtml(c.contactEmail) + '">' + escapeHtml(c.contactEmail) + '</a>' : '\u2014', '</span></div>',
            '<div class="detail-field"><label>Phone</label><span class="detail-value">', escapeHtml(c.contactPhone || '\u2014'), '</span></div>',
          '</div>',
        '</div></div>',
      '</div>'
    ].join('');
  }

  function renderBusinessTab(c) {
    var techTags = (c.technologyStack || []).map(function(t) { return '<span class="tag">' + escapeHtml(t) + '</span>'; }).join(' ') || '\u2014';
    var domainTags = (c.domainNames || []).map(function(d) { return '<span class="tag tag-blue">' + escapeHtml(d) + '</span>'; }).join(' ') || '\u2014';
    return [
      '<div class="tab-panel" data-panel="business">',
        '<div class="card"><div class="card-body">',
          '<h3 class="card-title mb-4">', icon('briefcase'), ' Business Details</h3>',
          '<div class="detail-grid">',
            '<div class="detail-field detail-field--full"><label>Technology Stack</label><span class="detail-value">', techTags, '</span></div>',
            '<div class="detail-field"><label>Hosting Provider</label><span class="detail-value">', escapeHtml(c.hostingProvider || '\u2014'), '</span></div>',
            '<div class="detail-field"><label>Cloud Provider</label><span class="detail-value">', escapeHtml(c.cloudProvider || '\u2014'), '</span></div>',
            '<div class="detail-field detail-field--full"><label>Domain Names</label><span class="detail-value">', domainTags, '</span></div>',
            '<div class="detail-field detail-field--full"><label>Business Description</label><span class="detail-value">', escapeHtml(c.businessDescription || '\u2014'), '</span></div>',
          '</div>',
        '</div></div>',
      '</div>'
    ].join('');
  }

  function renderSecurityTab(c) {
    var compTags = (c.complianceStandards || []).map(function(s) { return '<span class="tag tag-purple">' + escapeHtml(s) + '</span>'; }).join(' ') || '\u2014';
    var ndaClass = c.ndaStatus === 'signed' ? 'green' : (c.ndaStatus === 'pending' ? 'yellow' : 'gray');
    var contractClass = c.contractStatus === 'active' ? 'green' : (c.contractStatus === 'renewal' ? 'blue' : 'gray');
    return [
      '<div class="tab-panel" data-panel="security">',
        '<div class="card"><div class="card-body">',
          '<h3 class="card-title mb-4">', icon('shield'), ' Security Information</h3>',
          '<div class="detail-grid">',
            '<div class="detail-field detail-field--full"><label>Security Scope</label><span class="detail-value">', escapeHtml(c.securityScope || '\u2014'), '</span></div>',
            '<div class="detail-field"><label>NDA Status</label><span class="detail-value"><span class="badge badge-', ndaClass, '">', escapeHtml(c.ndaStatus || '\u2014'), '</span></span></div>',
            '<div class="detail-field"><label>Contract Status</label><span class="detail-value"><span class="badge badge-', contractClass, '">', escapeHtml(c.contractStatus || '\u2014'), '</span></span></div>',
            '<div class="detail-field"><label>Risk Level</label><span class="detail-value">', renderRiskBadge(c.riskLevel), '</span></div>',
            '<div class="detail-field detail-field--full"><label>Compliance Standards</label><span class="detail-value">', compTags, '</span></div>',
            '<div class="detail-field"><label>Testing Window</label><span class="detail-value">', escapeHtml(c.allowedTestingWindow || '\u2014'), '</span></div>',
            '<div class="detail-field"><label>Emergency Contact</label><span class="detail-value">', escapeHtml(c.emergencyContact || '\u2014'), '</span></div>',
          '</div>',
        '</div></div>',
      '</div>'
    ].join('');
  }

  function renderProjectsTab(c, projects, activeProjects, completedProjects, allReports, allFindings, allFiles, allNotes, allConversations, allKnowledge) {
    var projectCards = projects.map(function(p) {
      var pClass = p.status === 'active' ? 'green' : (p.status === 'completed' ? 'blue' : 'gray');
      return [
        '<div class="card card-sm hover-lift" data-navigate="project-detail" data-project-id="', p.id, '" style="cursor:pointer;margin-bottom:8px">',
          '<div class="card-body" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px">',
            '<div>',
              '<div class="font-medium">', escapeHtml(p.name), '</div>',
              '<div class="text-xs text-muted">', p.status || '', ' \u00B7 ', p.priority || '', '</div>',
            '</div>',
            '<span class="badge badge-', pClass, '">', p.status || '', '</span>',
          '</div>',
        '</div>'
      ].join('');
    }).join('');

    return [
      '<div class="tab-panel" data-panel="projects-tab">',
        '<div class="card"><div class="card-body">',
          '<h3 class="card-title mb-4">', icon('projects'), ' Project Integration</h3>',
          '<div class="project-stats-grid">',
            '<div class="stat-card" data-navigate="projects" data-filter="active"><div class="stat-value">', activeProjects.length, '</div><div class="stat-label">Active Projects</div></div>',
            '<div class="stat-card" data-navigate="projects" data-filter="completed"><div class="stat-value">', completedProjects.length, '</div><div class="stat-label">Completed Projects</div></div>',
            '<div class="stat-card" data-navigate="reports"><div class="stat-value">', allReports.length, '</div><div class="stat-label">Reports</div></div>',
            '<div class="stat-card" data-navigate="findings"><div class="stat-value">', allFindings.length, '</div><div class="stat-label">Findings</div></div>',
            '<div class="stat-card" data-navigate="files"><div class="stat-value">', allFiles.length, '</div><div class="stat-label">Files</div></div>',
            '<div class="stat-card" data-navigate="notes"><div class="stat-value">', allNotes.length, '</div><div class="stat-label">Notes</div></div>',
            '<div class="stat-card" data-navigate="chat"><div class="stat-value">', (allConversations || []).length, '</div><div class="stat-label">AI Conversations</div></div>',
            '<div class="stat-card" data-navigate="knowledge"><div class="stat-value">', (allKnowledge || []).length, '</div><div class="stat-label">Knowledge Pages</div></div>',
          '</div>',
          projects.length ? '<h4 class="mt-4 mb-3">Linked Projects</h4><div class="linked-projects">' + projectCards + '</div>' : '<p class="text-muted mt-3">No projects linked to this client yet.</p>',
        '</div></div>',
      '</div>'
    ].join('');
  }

  function bindDetailEvents(container, client) {
    var backBtn = container.querySelector('[data-action="back-to-list"]');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        currentView = 'list';
        selectedClientId = null;
        render(container);
      });
    }

    var editBtn = container.querySelector('[data-action="edit-client-detail"]');
    if (editBtn) {
      editBtn.addEventListener('click', function() {
        showClientForm(client.id, container);
      });
    }

    var newProjBtn = container.querySelector('[data-action="new-project-from-client"]');
    if (newProjBtn) {
      newProjBtn.addEventListener('click', function() {
        var project = store.addToCollection('projects', {
          id: uid('proj'),
          name: 'Project for ' + client.name,
          description: 'Security project for ' + client.name,
          status: 'planning',
          priority: 'medium',
          progress: 0,
          tags: ['client'],
          color: '#3B82F6',
          pinned: false,
          members: ['Admin'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        store.relationships.addRelationship('client-project', client.id, project.id);
        CrackItUI.toast('Project created for ' + client.name, 'success');
        render(container);
      });
    }

    container.querySelectorAll('.tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        container.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
        container.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
        tab.classList.add('active');
        var panel = container.querySelector('.tab-panel[data-panel="' + tab.dataset.tab + '"]');
        if (panel) panel.classList.add('active');
      });
    });

    container.querySelectorAll('[data-navigate]').forEach(function(el) {
      el.addEventListener('click', function() {
        var page = el.dataset.navigate;
        if (page === 'project-detail' && el.dataset.projectId) {
          CrackItRouter.navigate('projects');
        } else if (CrackItRouter.pages[page]) {
          CrackItRouter.navigate(page);
        }
      });
    });
  }

  function showClientForm(clientId, container) {
    var client = clientId ? store.findInCollection('clients', clientId) : null;
    var isEdit = !!client;
    var addr = (client && client.address) || {};
    var title = isEdit ? 'Edit Client: ' + client.name : 'New Client';

    var industries = ['Technology', 'Finance', 'Healthcare', 'Government', 'Energy', 'Education', 'Retail', 'Manufacturing'];
    var indOpts = industries.map(function(i) {
      return '<option value="' + i + '"' + ((client && client.industry === i) ? ' selected' : '') + '>' + i + '</option>';
    }).join('');

    var formContent = [
      '<form id="client-form" class="client-form">',
        '<div class="form-section"><h4>', icon('info'), ' Basic Information</h4>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Client Name *</label><input type="text" class="input" name="name" value="', escapeHtml(client ? (client.name || '') : ''), '" required></div>',
            '<div class="form-group"><label class="form-label">Company</label><input type="text" class="input" name="company" value="', escapeHtml(client ? (client.company || '') : ''), '"></div>',
          '</div>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Industry</label><select class="input select" name="industry"><option value="">Select Industry</option>', indOpts, '</select></div>',
            '<div class="form-group"><label class="form-label">Website</label><input type="url" class="input" name="website" value="', escapeHtml(client ? (client.website || '') : ''), '"></div>',
          '</div>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Email</label><input type="email" class="input" name="email" value="', escapeHtml(client ? (client.email || '') : ''), '"></div>',
            '<div class="form-group"><label class="form-label">Phone</label><input type="text" class="input" name="phone" value="', escapeHtml(client ? (client.phone || '') : ''), '"></div>',
          '</div>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Alt Phone</label><input type="text" class="input" name="altPhone" value="', escapeHtml(client ? (client.altPhone || '') : ''), '"></div>',
          '</div>',
        '</div>',
        '<div class="form-section"><h4>', icon('map'), ' Address</h4>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Country</label><input type="text" class="input" name="country" value="', escapeHtml(addr.country || ''), '"></div>',
            '<div class="form-group"><label class="form-label">State</label><input type="text" class="input" name="state" value="', escapeHtml(addr.state || ''), '"></div>',
          '</div>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">City</label><input type="text" class="input" name="city" value="', escapeHtml(addr.city || ''), '"></div>',
            '<div class="form-group"><label class="form-label">Postal Code</label><input type="text" class="input" name="zip" value="', escapeHtml(addr.zip || addr.postalCode || ''), '"></div>',
          '</div>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Full Address</label><textarea class="input" name="fullAddress" rows="2">', escapeHtml(addr.fullAddress || ''), '</textarea></div>',
          '</div>',
        '</div>',
        '<div class="form-section"><h4>', icon('user'), ' Primary Contact</h4>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Contact Person</label><input type="text" class="input" name="contactPerson" value="', escapeHtml(client ? (client.contactPerson || '') : ''), '"></div>',
            '<div class="form-group"><label class="form-label">Designation</label><input type="text" class="input" name="contactDesignation" value="', escapeHtml(client ? (client.contactDesignation || client.designation || '') : ''), '"></div>',
          '</div>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Department</label><input type="text" class="input" name="contactDepartment" value="', escapeHtml(client ? (client.contactDepartment || client.department || '') : ''), '"></div>',
            '<div class="form-group"><label class="form-label">Contact Email</label><input type="email" class="input" name="contactEmail" value="', escapeHtml(client ? (client.contactEmail || '') : ''), '"></div>',
          '</div>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Contact Phone</label><input type="text" class="input" name="contactPhone" value="', escapeHtml(client ? (client.contactPhone || '') : ''), '"></div>',
          '</div>',
        '</div>',
        '<div class="form-section"><h4>', icon('briefcase'), ' Business Details</h4>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Hosting Provider</label><input type="text" class="input" name="hostingProvider" value="', escapeHtml(client ? (client.hostingProvider || '') : ''), '"></div>',
            '<div class="form-group"><label class="form-label">Cloud Provider</label><input type="text" class="input" name="cloudProvider" value="', escapeHtml(client ? (client.cloudProvider || '') : ''), '"></div>',
          '</div>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Technology Stack (comma separated)</label><input type="text" class="input" name="technologyStack" value="', escapeHtml(client ? (client.technologyStack || []).join(', ') : ''), '" placeholder="React, Node.js, PostgreSQL..."></div>',
          '</div>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Domain Names (comma separated)</label><input type="text" class="input" name="domainNames" value="', escapeHtml(client ? (client.domainNames || []).join(', ') : ''), '" placeholder="example.com, example.net..."></div>',
          '</div>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Business Description</label><textarea class="input" name="businessDescription" rows="3">', escapeHtml(client ? (client.businessDescription || '') : ''), '</textarea></div>',
          '</div>',
        '</div>',
        '<div class="form-section"><h4>', icon('shield'), ' Security Information</h4>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Security Scope</label><input type="text" class="input" name="securityScope" value="', escapeHtml(client ? (client.securityScope || '') : ''), '"></div>',
            '<div class="form-group"><label class="form-label">Risk Level</label><select class="input select" name="riskLevel">',
              '<option value="low"' + ((client && client.riskLevel === 'low') ? ' selected' : '') + '>Low</option>',
              '<option value="medium"' + ((client && client.riskLevel === 'medium') ? ' selected' : '') + '>Medium</option>',
              '<option value="high"' + ((client && client.riskLevel === 'high') ? ' selected' : '') + '>High</option>',
              '<option value="critical"' + ((client && client.riskLevel === 'critical') ? ' selected' : '') + '>Critical</option>',
            '</select></div>',
          '</div>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">NDA Status</label><select class="input select" name="ndaStatus">',
              '<option value="signed"' + ((client && client.ndaStatus === 'signed') ? ' selected' : '') + '>Signed</option>',
              '<option value="pending"' + ((client && client.ndaStatus === 'pending') ? ' selected' : '') + '>Pending</option>',
              '<option value="expired"' + ((client && client.ndaStatus === 'expired') ? ' selected' : '') + '>Expired</option>',
            '</select></div>',
            '<div class="form-group"><label class="form-label">Contract Status</label><select class="input select" name="contractStatus">',
              '<option value="active"' + ((client && client.contractStatus === 'active') ? ' selected' : '') + '>Active</option>',
              '<option value="pending"' + ((client && client.contractStatus === 'pending') ? ' selected' : '') + '>Pending</option>',
              '<option value="completed"' + ((client && client.contractStatus === 'completed') ? ' selected' : '') + '>Completed</option>',
              '<option value="renewal"' + ((client && client.contractStatus === 'renewal') ? ' selected' : '') + '>Renewal</option>',
            '</select></div>',
          '</div>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Compliance Standards (comma separated)</label><input type="text" class="input" name="complianceStandards" value="', escapeHtml(client ? (client.complianceStandards || []).join(', ') : ''), '" placeholder="PCI-DSS, SOC2, ISO 27001..."></div>',
          '</div>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Allowed Testing Window</label><input type="text" class="input" name="allowedTestingWindow" value="', escapeHtml(client ? (client.allowedTestingWindow || '') : ''), '" placeholder="24/7, Business Hours..."></div>',
            '<div class="form-group"><label class="form-label">Emergency Contact</label><input type="text" class="input" name="emergencyContact" value="', escapeHtml(client ? (client.emergencyContact || '') : ''), '"></div>',
          '</div>',
          '<div class="form-row">',
            '<div class="form-group"><label class="form-label">Status</label><select class="input select" name="status">',
              '<option value="active"' + ((!client || client.status === 'active') ? ' selected' : '') + '>Active</option>',
              '<option value="archived"' + ((client && client.status === 'archived') ? ' selected' : '') + '>Archived</option>',
            '</select></div>',
          '</div>',
        '</div>',
      '</form>'
    ].join('');

    var modalId = 'client-form-modal';
    var modal = document.getElementById('modal-' + modalId);

    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'modal-' + modalId;
      modal.setAttribute('role', 'dialog');
      modal.innerHTML = [
        '<div class="modal-dialog modal-lg">',
          '<div class="modal-header">',
            '<h2 class="modal-title">', title, '</h2>',
            '<button class="modal-close" aria-label="Close">', CrackItUtils.icons.close, '</button>',
          '</div>',
          '<div class="modal-body" style="max-height:70vh;overflow-y:auto"></div>',
          '<div class="modal-footer">',
            '<button class="btn btn-secondary modal-close">Cancel</button>',
            '<button class="btn btn-primary" id="client-form-save">', icon('save'), ' ', isEdit ? 'Update' : 'Create', ' Client</button>',
          '</div>',
        '</div>'
      ].join('');
      document.body.appendChild(modal);

      modal.querySelector('.modal-close').addEventListener('click', function() { CrackItUI.closeModal(modalId); });
      modal.addEventListener('click', function(e) { if (e.target === modal) CrackItUI.closeModal(modalId); });
    }

    modal.querySelector('.modal-title').textContent = title;
    modal.querySelector('.modal-body').innerHTML = formContent;
    var saveBtn = modal.querySelector('#client-form-save');
    saveBtn.innerHTML = icon('save') + ' ' + (isEdit ? 'Update' : 'Create') + ' Client';
    saveBtn.onclick = function() { saveClientForm(clientId, container, modal, modalId); };

    modal.classList.add('open');
  }

  async function saveClientForm(clientId, container, modal, modalId) {
    var form = document.getElementById('client-form');
    if (!form) return;

    var fd = new FormData(form);
    var data = {
      name: fd.get('name') || 'Unnamed Client',
      company: fd.get('company') || '',
      industry: fd.get('industry') || '',
      website: fd.get('website') || '',
      email: fd.get('email') || '',
      phone: fd.get('phone') || '',
      contactPerson: fd.get('contactPerson') || '',
      ndaStatus: fd.get('ndaStatus') || 'pending',
      contractStatus: fd.get('contractStatus') || 'pending',
      riskLevel: fd.get('riskLevel') || 'low',
      status: fd.get('status') || 'active',
      notes: fd.get('businessDescription') || '',
    };

    if (clientId) {
      if (CrackItAPI.isAuthenticated()) {
        try { await CrackItAPI.clients.update(clientId, data); } catch (e) { console.warn('API client update failed:', e); }
      }
      store.updateInCollection('clients', clientId, data);
      CrackItUI.toast('Client updated successfully', 'success');
    } else {
      if (CrackItAPI.isAuthenticated()) {
        try {
          const result = await CrackItAPI.clients.create(data);
          data.id = result.id;
          data.createdAt = result.created_at;
          data.updatedAt = result.updated_at;
        } catch (e) { console.warn('API client create failed:', e); }
      }
      if (!data.id) {
        data.id = uid('client');
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();
        data.tags = [];
      }
      store.addToCollection('clients', data);
      CrackItUI.toast('Client created successfully', 'success');
    }

    CrackItUI.closeModal(modalId);
    render(container);
  }

  return { render };
})();

CrackItModules.CrackItClients = CrackItClients;
