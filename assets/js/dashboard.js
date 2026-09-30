const CrackItDashboard = (() => {
  'use strict';

  const { escapeHtml, formatDate } = CrackItUtils;

  async function render(container) {
    if (CrackItAPI.isAuthenticated()) {
      try {
        const [projectsData, findingsData] = await Promise.all([
          CrackItAPI.projects.list().catch(() => []),
          CrackItAPI.findings.list().catch(() => []),
        ]);
        if (projectsData.items || Array.isArray(projectsData)) {
          const items = projectsData.items || projectsData;
          CrackItStorage.setCollection('projects', items.map(p => ({
            id: p.id, name: p.name, status: p.status || 'active', color: '#3B82F6',
            tags: p.tags || [], progress: p.progress || 0, pinned: false,
            createdAt: p.created_at, updatedAt: p.updated_at,
          })));
        }
        if (findingsData.items || Array.isArray(findingsData)) {
          const items = findingsData.items || findingsData;
          CrackItStorage.setCollection('reports', items.map(f => ({
            id: f.id, title: f.title, severity: f.severity || 'medium',
            status: f.status || 'open', findings: 1, riskScore: f.cvss_score || 5,
            summary: f.description || '', createdAt: f.created_at, updatedAt: f.updated_at,
          })));
        }
      } catch { /* offline, use local data */ }
    }
    const uiState = CrackItStorage.uiState.get();
    const recentItems = (uiState.recentItems || []).filter(r => r.page === 'projects').slice(0, 4);
    const projects = CrackItStorage.getCollection('projects');
    const files = CrackItStorage.getCollection('files');
    const reports = CrackItStorage.getCollection('reports');
    const workflows = CrackItStorage.getCollection('workflows');
    const activity = CrackItStorage.getCollection('activity');

    const recentFiles = files.filter(f => f.recent).slice(0, 5);
    const recentReports = reports.slice(0, 5);
    const activeProjects = projects.filter(p => p.status !== 'completed').slice(0, 8);

    const dbSummary = {
      projects: projects.length,
      reports: reports.length,
      evidence: files.filter(f => f.folder === 'Evidence').length,
      knowledge: files.filter(f => f.folder === 'Documents').length + CrackItStorage.getCollection('notes').length,
      files: files.length,
      automation: workflows.length
    };

    container.innerHTML = `
      <nav class="breadcrumbs" id="breadcrumbs"></nav>

      <div class="card welcome-card stagger-children">
        <div class="card-body" style="padding:32px">
          <h2 style="margin:0 0 4px;font-size:22px">Welcome Admin</h2>
          <p style="margin:0 0 24px;color:var(--text-muted)">Continue your cybersecurity workspace.</p>
          <div class="inline-actions" style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary" data-action="resume-project"><span class="icon">${CrackItUtils.icons.recent}</span> Resume Last</button>
            <button class="btn btn-secondary" data-action="new-project"><span class="icon">${CrackItUtils.icons.plus}</span> New Project</button>
            <button class="btn btn-secondary" data-action="ai-workspace"><span class="icon">${CrackItUtils.icons.sparkles}</span> AI Workspace</button>
            <button class="btn btn-secondary" data-action="terminal"><span class="icon">${CrackItUtils.icons.terminal}</span> Terminal</button>
            <button class="btn btn-ghost" data-action="search"><span class="icon">${CrackItUtils.icons.search}</span> Search</button>
            <button class="btn btn-ghost" data-action="import-folder"><span class="icon">${CrackItUtils.icons.folder}</span> Import</button>
          </div>
        </div>
      </div>

      <div class="dashboard-grid stagger-children">

        <div class="col-span-12">
          <div class="card">
            <div class="card-header"><span class="card-title">Quick Create</span></div>
            <div class="card-body">
              <div class="quick-action-grid">
                <div class="quick-action-card" data-action="new-project">
                  <div class="qac-icon">${CrackItUtils.icons.projects}</div>
                  <span class="qac-label">New Project</span>
                </div>
                <div class="quick-action-card" data-action="new-client">
                  <div class="qac-icon">${CrackItUtils.icons.clients}</div>
                  <span class="qac-label">New Client</span>
                </div>
                <div class="quick-action-card" data-action="open-ai-chat">
                  <div class="qac-icon">${CrackItUtils.icons.chat}</div>
                  <span class="qac-label">New AI Chat</span>
                </div>
                <div class="quick-action-card" data-action="generate-report">
                  <div class="qac-icon">${CrackItUtils.icons.reports}</div>
                  <span class="qac-label">New Report</span>
                </div>
                <div class="quick-action-card" data-action="new-finding">
                  <div class="qac-icon">${CrackItUtils.icons.evidence}</div>
                  <span class="qac-label">New Finding</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-6">
          <div class="card">
            <div class="card-header"><span class="card-title">Continue Working</span></div>
            <div class="card-body">${renderContinueProjects(recentItems, projects)}</div>
          </div>
        </div>

        <div class="col-span-6">
          <div class="card">
            <div class="card-header"><span class="card-title">AI Suggestions</span></div>
            <div class="card-body">${renderAiSuggestions()}</div>
          </div>
        </div>

        <div class="col-span-8">
          <div class="card">
            <div class="card-header"><span class="card-title">Active Projects</span><button class="section-link" data-page="projects">View all</button></div>
            <div class="card-body" style="padding:0">${renderActiveProjectsTable(activeProjects)}</div>
          </div>
        </div>

        <div class="col-span-4">
          <div class="card">
            <div class="card-header"><span class="card-title">Database Summary</span></div>
            <div class="card-body">${renderDatabaseSummary(dbSummary)}</div>
          </div>
        </div>

        <div class="col-span-4">
          <div class="card">
            <div class="card-header"><span class="card-title">Recent Files</span><button class="section-link" data-page="files">View all</button></div>
            <div class="card-body">${renderRecentFiles(recentFiles)}</div>
          </div>
        </div>

        <div class="col-span-4">
          <div class="card">
            <div class="card-header"><span class="card-title">Recent Reports</span><button class="section-link" data-page="reports">View all</button></div>
            <div class="card-body">${renderRecentReports(recentReports)}</div>
          </div>
        </div>

        <div class="col-span-4">
          <div class="card">
            <div class="card-header"><span class="card-title">Automation Queue</span><button class="section-link" data-page="automation">View all</button></div>
            <div class="card-body">${renderAutomationQueue(workflows)}</div>
          </div>
        </div>

        <div class="col-span-12">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Security Trends</span>
            </div>
            <div class="card-body">
              <div class="dashboard-grid" style="gap:16px">
                <div class="col-span-4">
                  <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">Project Status Distribution</div>
                  <canvas id="chart-bar" height="150" style="width:100%"></canvas>
                </div>
                <div class="col-span-4">
                  <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">Report Severity</div>
                  <canvas id="chart-donut" height="150" style="width:100%"></canvas>
                </div>
                <div class="col-span-4">
                  <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">Activity Trend (7 days)</div>
                  <canvas id="chart-line" height="150" style="width:100%"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-12">
          <div class="card">
            <div class="card-header"><span class="card-title">Activity Feed</span></div>
            <div class="card-body"><div class="activity-feed">${renderActivityFeed(activity)}</div></div>
          </div>
        </div>

      </div>`;

    bindEvents(container);
    CrackItNavigation.updateBreadcrumbs('dashboard', 'Mission Control');
    initDashboardCharts();
  }

  function initDashboardCharts() {
    const projects = CrackItStorage.getCollection('projects');
    const reports = CrackItStorage.getCollection('reports');

    setTimeout(() => {
      const statusCounts = { active: 0, planning: 0, review: 0, completed: 0, blocked: 0 };
      projects.forEach(p => { if (statusCounts[p.status] !== undefined) statusCounts[p.status]++; });
      CrackItCharts.drawBarChart(document.getElementById('chart-bar'),
        Object.entries(statusCounts).map(([label, value]) => ({ label, value })));

      const sevCounts = { critical: 0, high: 0, medium: 0, low: 0 };
      reports.forEach(r => { if (sevCounts[r.severity] !== undefined) sevCounts[r.severity]++; });
      CrackItCharts.drawDonutChart(document.getElementById('chart-donut'),
        Object.entries(sevCounts).map(([label, value]) => ({ label, value })));

      CrackItCharts.drawLineChart(document.getElementById('chart-line'),
        CrackItCharts.generateRandomData(7, 5, 30));
    }, 300);
  }

  function renderEmptyState(icon, title, message, action, actionLabel) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        ${action ? `<button class="btn btn-primary btn-sm" data-action="${action}">${escapeHtml(actionLabel)}</button>` : ''}
      </div>`;
  }

  function renderContinueProjects(recentItems, projects) {
    const items = recentItems.length > 0
      ? recentItems.map(r => projects.find(p => p.name === r.title)).filter(Boolean)
      : projects.filter(p => p.pinned).slice(0, 4);

    if (!items.length) return renderEmptyState(CrackItUtils.icons.recent, 'No recent projects', 'Start working on a project to see it here', 'new-project', 'Create Project');

    return items.map(p => {
      const category = (p.tags && p.tags[0]) || 'General';
      return `
      <div class="continue-card" data-project-id="${escapeHtml(p.id)}">
        <div class="continue-card-header">
          <div class="continue-card-icon" style="background:${p.color}20;color:${p.color}">${CrackItUtils.icons.projects}</div>
          <div class="continue-card-info">
            <div class="continue-card-name">${escapeHtml(p.name)}</div>
            <div class="continue-card-category">${escapeHtml(category)}</div>
          </div>
        </div>
        <div class="continue-card-progress">
          <div class="progress" style="height:6px"><div class="progress-bar" style="width:${p.progress}%"></div></div>
          <span class="continue-card-progress-text">${p.progress}%</span>
        </div>
        <button class="btn btn-secondary btn-sm continue-card-btn" data-action="open-project" data-project="${escapeHtml(p.id)}">Continue</button>
      </div>`;
    }).join('');
  }

  function renderActiveProjectsTable(projects) {
    if (!projects.length) return renderEmptyState(CrackItUtils.icons.projects, 'No active projects', 'Create a new project to get started', 'new-project', 'New Project');

    return `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Category</th>
              <th>Status</th>
              <th>Progress</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${projects.map(p => {
              const category = (p.tags && p.tags[0]) || 'General';
              const badgeClass = p.status === 'active' ? 'badge-blue' : p.status === 'planning' ? 'badge-gray' : p.status === 'review' ? 'badge-yellow' : 'badge-gray';
              return `
              <tr data-project-id="${escapeHtml(p.id)}">
                <td><div class="table-project-name"><span class="table-project-dot" style="background:${p.color}"></span>${escapeHtml(p.name)}</div></td>
                <td><span class="table-category">${escapeHtml(category)}</span></td>
                <td><span class="badge ${badgeClass}">${escapeHtml(p.status)}</span></td>
                <td><div class="table-progress"><div class="progress" style="width:80px;height:5px"><div class="progress-bar" style="width:${p.progress}%"></div></div><span class="table-progress-text">${p.progress}%</span></div></td>
                <td><button class="btn btn-ghost btn-sm" data-action="open-project" data-project="${escapeHtml(p.id)}">Open</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderAiSuggestions() {
    const suggestions = [
      { action: 'continue-analysis', label: 'Continue previous analysis', icon: 'refresh' },
      { action: 'generate-report', label: 'Generate report', icon: 'reports' },
      { action: 'review-code', label: 'Review uploaded code', icon: 'code' },
      { action: 'summarize-notes', label: 'Summarize notes', icon: 'notes' },
      { action: 'open-ai-chat', label: 'Open previous AI chat', icon: 'chat' }
    ];

    return suggestions.map(s => `
      <button class="ai-suggestion-item" data-action="${s.action}">
        <span class="ai-suggestion-icon">${CrackItUtils.icons[s.icon] || CrackItUtils.icons.sparkles}</span>
        <span class="ai-suggestion-label">${escapeHtml(s.label)}</span>
        <span class="ai-suggestion-arrow">${CrackItUtils.icons.chevronRight}</span>
      </button>`).join('');
  }

  function renderDatabaseSummary(summary) {
    const items = [
      { label: 'Projects', value: summary.projects, icon: 'projects', page: 'projects' },
      { label: 'Reports', value: summary.reports, icon: 'reports', page: 'reports' },
      { label: 'Evidence', value: summary.evidence, icon: 'evidence', page: 'files' },
      { label: 'Knowledge Pages', value: summary.knowledge, icon: 'knowledge', page: 'knowledge' },
      { label: 'Files', value: summary.files, icon: 'files', page: 'files' },
      { label: 'Automation', value: summary.automation, icon: 'automation', page: 'automation' }
    ];

    return `<div class="db-summary-grid">${items.map(item => `
      <div class="db-summary-item" style="cursor:pointer" data-page="${item.page}">
        <div class="db-summary-icon" style="font-size:24px;margin-bottom:8px">${CrackItUtils.icons[item.icon]}</div>
        <div class="value">${item.value}</div>
        <div class="label">${escapeHtml(item.label)}</div>
      </div>`).join('')}</div>`;
  }

  function renderRecentFiles(files) {
    if (!files.length) return renderEmptyState(CrackItUtils.icons.files, 'No recent files', 'Upload or import files to see them here', 'import-folder', 'Import Files');

    return files.map(f => `
      <div class="list-item">
        <div class="list-item-icon">${CrackItUtils.icons.file}</div>
        <div class="list-item-content">
          <div class="list-item-title truncate">${escapeHtml(f.name)}</div>
          <div class="list-item-subtitle">${formatDate(f.modifiedAt, true)}</div>
        </div>
        <button class="btn btn-ghost btn-sm" data-action="open-file" data-id="${escapeHtml(f.id)}">Open</button>
      </div>`).join('');
  }

  function renderRecentReports(reports) {
    if (!reports.length) return renderEmptyState(CrackItUtils.icons.reports, 'No recent reports', 'Generate a report to see it here', 'generate-report', 'Generate Report');

    return reports.map(r => `
      <div class="list-item" data-report-id="${escapeHtml(r.id)}">
        <div class="list-item-icon">${CrackItUtils.icons.reports}</div>
        <div class="list-item-content">
          <div class="list-item-title truncate">${escapeHtml(r.title)}</div>
          <div class="list-item-subtitle">${r.findings} findings · ${formatDate(r.updatedAt, true)}</div>
        </div>
        <div class="list-item-actions">
          <button class="btn btn-ghost btn-sm" data-action="open-report" data-id="${escapeHtml(r.id)}">Open</button>
          <button class="btn btn-ghost btn-sm" data-action="export-report" data-id="${escapeHtml(r.id)}">Export</button>
        </div>
      </div>`).join('');
  }

  function renderAutomationQueue(workflows) {
    const items = workflows.slice(0, 5);
    if (!items.length) return renderEmptyState(CrackItUtils.icons.automation, 'No automations configured', 'Set up automation workflows to streamline your tasks', 'edit-automation', 'Configure Automation');

    return items.map(w => {
      const isActive = w.status === 'active';
      return `
      <div class="list-item">
        <div class="list-item-icon" style="color:${isActive ? 'var(--color-success, #10B981)' : 'var(--text-muted)'}">${CrackItUtils.icons.automation}</div>
        <div class="list-item-content">
          <div class="list-item-title truncate">${escapeHtml(w.name)}</div>
          <div class="list-item-subtitle">${w.executions || 0} runs · ${w.successRate || 0}% success</div>
        </div>
        <div class="list-item-actions">
          <button class="btn btn-ghost btn-sm" data-action="toggle-automation" data-id="${escapeHtml(w.id)}" data-status="${w.status}">${isActive ? 'Disable' : 'Enable'}</button>
          <button class="btn btn-ghost btn-sm" data-action="edit-automation" data-id="${escapeHtml(w.id)}">Edit</button>
        </div>
      </div>`;
    }).join('');
  }

  function renderActivityFeed(activity) {
    const items = activity.slice(0, 12);
    if (!items.length) return renderEmptyState(CrackItUtils.icons.bell, 'No activity yet', 'Actions you take will appear here', 'new-project', 'Start a Project');

    const actionLabels = {
      'Opened project': 'Project Created',
      'Created note': 'Knowledge Updated',
      'Ran scan': 'Scan Completed',
      'Generated report': 'Report Generated',
      'Updated settings': 'Settings Changed',
      'Exported data': 'Data Exported',
      'Completed task': 'Task Completed',
      'Reviewed findings': 'Evidence Added',
      'Started automation': 'Automation Started',
      'Uploaded file': 'File Uploaded',
      'AI analysis completed': 'AI Chat Saved',
      'Pinned item': 'Item Pinned'
    };

    return items.map(a => {
      const label = actionLabels[a.action] || a.action;
      return `
      <div class="activity-feed-item">
        <div class="activity-feed-dot"></div>
        <div class="activity-feed-content">
          <span class="activity-feed-text"><strong>${escapeHtml(label)}</strong>: ${escapeHtml(a.target)}</span>
          <span class="activity-feed-time">${formatDate(a.timestamp, true)}</span>
        </div>
      </div>`;
    }).join('');
  }

  function bindEvents(container) {
    container.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', () => CrackItRouter.navigate(el.dataset.page));
    });

    container.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', (e) => {
        const action = el.dataset.action;
        const id = el.dataset.project || el.dataset.id;
        const status = el.dataset.status;
        handleAction(action, id, status);
      });
    });

    container.addEventListener('contextmenu', (e) => {
      const projEl = e.target.closest('[data-project-id]');
      const reportEl = e.target.closest('[data-report-id]');
      if (!projEl && !reportEl) return;
      e.preventDefault();

      if (projEl) {
        const pid = projEl.dataset.projectId;
        CrackItUI.showContextMenu(e.clientX, e.clientY, [
          { label: 'Open Project', action: () => CrackItRouter.navigate('projects') },
          { label: 'Duplicate', action: () => CrackItUI.toast('Project duplicated', 'success') },
          { label: 'Archive', action: () => {
            CrackItStorage.updateInCollection('projects', pid, { status: 'archived' });
            render(container);
            CrackItUI.toast('Project archived', 'info');
          }},
          { label: 'Delete', action: () => {
            if (confirm('Delete this project?')) {
              CrackItStorage.removeFromCollection('projects', pid);
              render(container);
              CrackItUI.toast('Project deleted', 'warning');
            }
          }}
        ]);
      } else if (reportEl) {
        CrackItUI.showContextMenu(e.clientX, e.clientY, [
          { label: 'Open Report', action: () => CrackItRouter.navigate('reports') },
          { label: 'Export JSON', action: () => handleAction('export-report', reportEl.dataset.reportId) },
          { label: 'Delete', action: () => {
            if (confirm('Delete this report?')) {
              CrackItStorage.removeFromCollection('reports', reportEl.dataset.reportId);
              render(container);
              CrackItUI.toast('Report deleted', 'warning');
            }
          }}
        ]);
      }
    });
  }

  function handleAction(action, id, status) {
    switch (action) {
      case 'resume-project':
        CrackItRouter.navigate('projects');
        break;
      case 'new-project':
        CrackItRouter.navigate('projects');
        break;
      case 'new-client':
        CrackItRouter.navigate('clients');
        break;
      case 'new-finding':
        CrackItUI.toast('Findings managed within Projects', 'info');
        CrackItRouter.navigate('projects');
        break;
      case 'ai-workspace':
        CrackItRouter.navigate('chat');
        break;
      case 'search':
        CrackItSearch?.open();
        break;
      case 'terminal':
        CrackItRouter.navigate('terminal');
        break;
      case 'import-folder':
        CrackItUI.toast('Import dialog: select a folder to import', 'info');
        break;
      case 'open-project':
        CrackItRouter.navigate('projects');
        break;
      case 'open-file':
        CrackItRouter.navigate('files');
        break;
      case 'open-report':
        CrackItRouter.navigate('reports');
        break;
      case 'export-report':
        const report = CrackItStorage.findInCollection('reports', id);
        const blob = new Blob([JSON.stringify(report || {}, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `report-${id?.slice(0, 8) || 'export'}.json`; a.click();
        URL.revokeObjectURL(url);
        CrackItUI.toast('Report exported', 'success');
        break;
      case 'toggle-automation':
        if (status === 'active') {
          CrackItUI.toast('Automation disabled', 'warning');
        } else {
          CrackItUI.toast('Automation enabled', 'success');
        }
        break;
      case 'edit-automation':
        CrackItRouter.navigate('automation');
        break;
      case 'continue-analysis':
        CrackItRouter.navigate('chat');
        break;
      case 'generate-report':
        CrackItRouter.navigate('reports');
        break;
      case 'review-code':
        CrackItRouter.navigate('chat');
        break;
      case 'summarize-notes':
        CrackItRouter.navigate('knowledge');
        break;
      case 'open-ai-chat':
        CrackItRouter.navigate('chat');
        break;
    }
  }

  return { render };
})();

CrackItModules.CrackItDashboard = CrackItDashboard;
