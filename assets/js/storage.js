/**
 * CrackIt — Storage Service
 * LocalStorage wrapper with API-first data loading
 */

const CrackItStorage = (() => {
  'use strict';

  const PREFIX = 'crackit_';
  const { uid, clone } = CrackItUtils;

  /** Get item from localStorage */
  function get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /** Set item in localStorage */
  function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  /** Remove item */
  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  /** Session storage helpers */
  function getSession(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  function setSession(key, value) {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
  }

  /** UI State persistence */
  const uiState = {
    get: () => get('ui_state', {
      sidebarCollapsed: false,
      rightPanelCollapsed: false,
      rightPanelWidth: 320,
      activePage: 'dashboard',
      workspaceTabs: [{ id: 'tab_1', title: 'Dashboard', page: 'dashboard' }],
      activeTab: 'tab_1',
      recentItems: [],
      closedTabs: [],
      bookmarks: [],
      favorites: []
    }),
    save: (state) => set('ui_state', state),
    update: (partial) => {
      const current = uiState.get();
      const updated = { ...current, ...partial };
      uiState.save(updated);
      return updated;
    }
  };

  /** Settings persistence */
  const settings = {
    get: () => get('settings', {
      theme: 'dark',
      accentColor: 'blue',
      fontSize: 'medium',
      compactMode: false,
      animations: true,
      autoSave: true,
      notifications: true,
      soundEffects: false,
      aiModel: 'crackit-pro',
      workspaceName: 'CrackIt HQ',
      language: 'en'
    }),
    save: (s) => set('settings', s),
    update: (partial) => settings.save({ ...settings.get(), ...partial })
  };

  /** Quick note autosave */
  const quickNote = {
    get: () => get('quick_note', ''),
    save: (text) => set('quick_note', text)
  };

  /** Fallback mock data generators — used only when backend is unavailable */
  const generators = {
    commands: () => [
      { id: 'nav_dashboard', label: 'Go to Dashboard', icon: 'dashboard', action: 'navigate', target: 'dashboard', shortcut: 'Ctrl+1' },
      { id: 'nav_projects', label: 'Go to Projects', icon: 'projects', action: 'navigate', target: 'projects', shortcut: 'Ctrl+2' },
      { id: 'nav_chat', label: 'Open AI Chat', icon: 'chat', action: 'navigate', target: 'chat', shortcut: 'Ctrl+3' },
      { id: 'nav_notes', label: 'Open Notes', icon: 'notes', action: 'navigate', target: 'notes', shortcut: 'Ctrl+4' },
      { id: 'nav_files', label: 'Open Files', icon: 'files', action: 'navigate', target: 'files', shortcut: 'Ctrl+5' },
      { id: 'nav_terminal', label: 'Open Terminal', icon: 'terminal', action: 'navigate', target: 'terminal', shortcut: 'Ctrl+`' },
      { id: 'nav_settings', label: 'Open Settings', icon: 'settings', action: 'navigate', target: 'settings', shortcut: 'Ctrl+,' },
      { id: 'new_project', label: 'New Project', icon: 'plus', action: 'modal', target: 'new-project' },
      { id: 'toggle_sidebar', label: 'Toggle Sidebar', icon: 'menu', action: 'toggle', target: 'sidebar', shortcut: 'Ctrl+B' },
      { id: 'global_search', label: 'Global Search', icon: 'search', action: 'modal', target: 'search', shortcut: 'Ctrl+Shift+F' },
    ],
    notifications: () => [],
    projects: () => [],
    notes: () => [],
    files: () => [],
    reports: () => [],
    tasks: () => [],
    bookmarks: () => [
      { id: uid('bm'), title: 'CVE Database', url: '#cve-library', type: 'link' },
      { id: uid('bm'), title: 'Threat Intel Feed', url: '#threat-feed', type: 'link' },
    ],
    activity: () => [],
    conversations: () => [],
    workflows: () => [],
    clients: () => [],
    templates: () => [],
    findings: () => [],
  };

  /** Initialize data — tries API first, falls back to mock generators */
  async function initialize() {
    const apiAvailable = typeof CrackItAPI !== 'undefined' && CrackItAPI.isAuthenticated();

    if (apiAvailable) {
      await loadFromAPI();
    } else {
      await loadFallbackData();
    }
  }

  /** Load data from backend API */
  async function loadFromAPI() {
    try {
      const [apiProjects, apiNotifications, apiNotes, apiClients, apiFindings] = await Promise.allSettled([
        CrackItAPI.projects.list(),
        CrackItAPI.notifications.list(),
        CrackItAPI.notes.list(),
        CrackItAPI.clients.list(),
        CrackItAPI.findings.list(),
      ]);

      if (apiProjects.status === 'fulfilled') {
        set('projects', apiProjects.value.map(p => ({
          id: p.id, name: p.name, description: p.description,
          status: p.status, priority: p.priority, progress: p.progress,
          color: p.color, pinned: p.pinned, favorite: p.favorite, archived: p.archived,
          tags: p.tags || [], modules: p.modules || [],
          client: p.client, technologyStack: p.technology_stack,
          targetUrls: p.target_urls, repository: p.repository,
          programmingLanguage: p.programming_language, framework: p.framework,
          scope: p.scope, rulesOfEngagement: p.rules_of_engagement,
          objectives: p.objectives, testingWindow: p.testing_window,
          riskLevel: p.risk_level,
          createdAt: p.created_at, updatedAt: p.updated_at,
        })));
      }

      if (apiNotifications.status === 'fulfilled') {
        set('notifications', apiNotifications.value.map(n => ({
          id: n.id, title: n.title, text: n.message,
          type: n.notification_type, category: n.category,
          read: n.read, createdAt: n.created_at,
        })));
      }

      if (apiNotes.status === 'fulfilled') {
        set('notes', apiNotes.value.map(n => ({
          id: n.id, title: n.title, content: n.content,
          folder: n.folder, tags: n.tags || [], pinned: n.pinned, favorite: n.favorite,
          wordCount: n.word_count || "0", projectId: n.project_id,
          module: n.module,
          createdAt: n.created_at, updatedAt: n.updated_at,
        })));
      }

      if (apiClients.status === 'fulfilled') {
        set('clients', apiClients.value.map(c => ({
          id: c.id, name: c.name, company: c.company,
          email: c.email, phone: c.phone, industry: c.industry,
          website: c.website, address: c.address, contactPerson: c.contact_person,
          status: c.status, riskLevel: c.risk_level,
          ndaStatus: c.nda_status, contractStatus: c.contract_status,
          notes: c.notes, tags: c.tags || [],
          createdAt: c.created_at, updatedAt: c.updated_at,
        })));
      }

      if (apiFindings.status === 'fulfilled') {
        set('findings', apiFindings.value.map(f => ({
          id: f.id, title: f.title, description: f.description,
          severity: f.severity, status: f.status,
          cvssScore: f.cvss_score, cweId: f.cwe_id, owaspCategory: f.owasp_category,
          category: f.category, projectId: f.project_id, module: f.module,
          evidence: f.evidence, recommendation: f.recommendation,
          stepsToReproduce: f.steps_to_reproduce, impact: f.impact,
          references: f.references,
          createdAt: f.created_at, updatedAt: f.updated_at,
        })));
      }

      const commands = generators.commands();
      set('commands', commands);

      ['files', 'reports', 'tasks', 'workflows', 'templates', 'conversations', 'activity', 'bookmarks'].forEach(key => {
        if (!get(key)) set(key, generators[key] ? generators[key]() : []);
      });

      set('initialized', true);
    } catch (err) {
      console.warn('API load failed, using fallback data:', err);
      await loadFallbackData();
    }
  }

  /** Load fallback mock data when API is unavailable */
  async function loadFallbackData() {
    for (const key of Object.keys(generators)) {
      if (!get(key)) {
        set(key, generators[key]());
      }
    }
    set('initialized', true);
    set('initializedAt', new Date().toISOString());
  }

  /** Sync a single collection from API */
  async function syncCollection(key, apiPromise) {
    try {
      const data = await apiPromise;
      if (Array.isArray(data)) set(key, data);
      return data;
    } catch {
      return get(key, []);
    }
  }

  /** CRUD helpers for collections */
  function getCollection(key) {
    return get(key, []);
  }

  function setCollection(key, items) {
    set(key, items);
  }

  function addToCollection(key, item) {
    const collection = getCollection(key);
    collection.unshift(item);
    set(key, collection);
    return item;
  }

  function updateInCollection(key, id, updates) {
    const collection = getCollection(key);
    const index = collection.findIndex(item => item.id === id);
    if (index !== -1) {
      collection[index] = { ...collection[index], ...updates, updatedAt: new Date().toISOString() };
      set(key, collection);
      return collection[index];
    }
    return null;
  }

  function removeFromCollection(key, id) {
    const collection = getCollection(key).filter(item => item.id !== id);
    set(key, collection);
  }

  function findInCollection(key, id) {
    return getCollection(key).find(item => item.id === id);
  }

  /** Tag system helper */
  const tagSystem = {
    getAll: () => {
      const collections = ['projects', 'notes', 'files', 'reports', 'tasks', 'clients', 'findings'];
      const tags = new Set();
      collections.forEach(key => {
        const items = getCollection(key);
        items.forEach(item => {
          if (Array.isArray(item.tags)) {
            item.tags.forEach(t => tags.add(t));
          }
        });
      });
      return Array.from(tags).sort();
    },
    getByTag: (tag) => {
      const collections = ['projects', 'notes', 'files', 'reports', 'tasks', 'clients', 'findings'];
      const results = {};
      collections.forEach(key => {
        const items = getCollection(key).filter(item => Array.isArray(item.tags) && item.tags.includes(tag));
        if (items.length > 0) results[key] = items;
      });
      return results;
    },
    addTag: (collection, itemId, tag) => {
      const item = findInCollection(collection, itemId);
      if (!item) return false;
      if (!Array.isArray(item.tags)) item.tags = [];
      if (!item.tags.includes(tag)) {
        item.tags.push(tag);
        updateInCollection(collection, itemId, { tags: item.tags });
      }
      return true;
    }
  };

  /** Relationships helper */
  const relationships = {
    _rels: () => get('relationships', []),
    _save: (rels) => set('relationships', rels),
    getClientProjects: (clientId) => {
      const rels = relationships._rels().filter(r => r.type === 'client-project' && r.fromId === clientId);
      return rels.map(r => findInCollection('projects', r.toId)).filter(Boolean);
    },
    getProjectClient: (projectId) => {
      const rel = relationships._rels().find(r => r.type === 'client-project' && r.toId === projectId);
      return rel ? findInCollection('clients', rel.fromId) : null;
    },
    getProjectFindings: (projectId) => {
      return getCollection('findings').filter(f => f.projectId === projectId);
    },
    addRelationship: (type, fromId, toId) => {
      const rels = relationships._rels();
      rels.push({ type, fromId, toId, createdAt: new Date().toISOString() });
      relationships._save(rels);
      return true;
    }
  };

  return {
    get, set, remove, getSession, setSession,
    uiState, settings, quickNote,
    initialize, syncCollection, getCollection, setCollection, addToCollection,
    updateInCollection, removeFromCollection, findInCollection,
    generators, tagSystem, relationships
  };
})();
