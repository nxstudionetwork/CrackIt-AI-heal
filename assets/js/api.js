/**
 * CrackIt — API Client
 * Centralized HTTP client for backend communication
 * Replaces LocalStorage-based mock data with real API calls
 */

const CrackItAPI = (() => {
  'use strict';

  const BASE_URL = 'http://localhost:8000';
  const API_PREFIX = '/api/v1';
  let accessToken = null;
  let refreshToken = null;
  let refreshPromise = null;

  function getStoredTokens() {
    try {
      const stored = localStorage.getItem('crackit_tokens');
      if (stored) {
        const tokens = JSON.parse(stored);
        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token;
        return tokens;
      }
    } catch {}
    return null;
  }

  function storeTokens(access, refresh) {
    accessToken = access;
    refreshToken = refresh;
    localStorage.setItem('crackit_tokens', JSON.stringify({ access_token: access, refresh_token: refresh }));
  }

  function clearTokens() {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('crackit_tokens');
  }

  function isAuthenticated() {
    if (!accessToken) getStoredTokens();
    return !!accessToken;
  }

  async function refreshAccessToken() {
    if (refreshPromise) return refreshPromise;
    
    refreshPromise = (async () => {
      try {
        if (!refreshToken) {
          clearTokens();
          return null;
        }
        
        const response = await fetch(`${BASE_URL}${API_PREFIX}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        
        if (!response.ok) {
          clearTokens();
          return null;
        }
        
        const data = await response.json();
        storeTokens(data.access_token, data.refresh_token);
        return data.access_token;
      } catch {
        clearTokens();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
    
    return refreshPromise;
  }

  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${API_PREFIX}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    try {
      let response = await fetch(url, { ...options, headers });
      
      if (response.status === 401 && refreshToken) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, { ...options, headers });
        }
      }
      
      if (response.status === 401) {
        clearTokens();
        window.dispatchEvent(new CustomEvent('crackit:auth-expired'));
        throw new Error('Authentication expired');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed: ${response.status}`);
      }
      
      if (response.status === 204) return null;
      return await response.json();
    } catch (error) {
      if (error.message === 'Authentication expired') throw error;
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Auth API
  const auth = {
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: async (data) => {
      const result = await request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
      if (result.access_token) {
        storeTokens(result.access_token, result.refresh_token);
      }
      return result;
    },
    logout: () => { clearTokens(); return Promise.resolve(); },
    refresh: () => refreshAccessToken(),
    me: () => request('/auth/me'),
  };

  // Projects API
  const projects = {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/projects${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`/projects/${id}`),
    create: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  };

  // Files API
  const files = {
    list: (projectId) => request(`/files?project_id=${projectId}`),
    get: (id) => request(`/files/${id}`),
    create: (data) => request('/files', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/files/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/files/${id}`, { method: 'DELETE' }),
  };

  // Findings API
  const findings = {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/findings${qs ? '?' + qs : ''}`);
    },
    create: (data) => request('/findings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/findings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/findings/${id}`, { method: 'DELETE' }),
  };

  // Notifications API
  const notifications = {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/notifications${qs ? '?' + qs : ''}`);
    },
    unreadCount: () => request('/notifications/unread-count'),
    markAllRead: () => request('/notifications/mark-all-read', { method: 'POST' }),
  };

  // Scans API
  const scans = {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/scans${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`/scans/${id}`),
    create: (data) => request('/scans', { method: 'POST', body: JSON.stringify(data) }),
  };

  // HE API
  const he = {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/he${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`/he/${id}`),
    create: (data) => request('/he', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/he/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    start: (id) => request(`/he/${id}/start`, { method: 'POST' }),
    stop: (id) => request(`/he/${id}/stop`, { method: 'POST' }),
    delete: (id) => request(`/he/${id}`, { method: 'DELETE' }),
  };

  // Terminal
  const terminal = {
    listSessions: () => request('/terminal/sessions'),
    connect: (sessionId) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return new WebSocket(`${protocol}//localhost:8000/api/v1/terminal/ws/${sessionId}`);
    },
  };

  // AI API
  const ai = {
    health: () => request('/ai/health'),
    analyze: (data) => request('/ai/analyze', { method: 'POST', body: JSON.stringify(data) }),
    explain: (data) => request('/ai/explain', { method: 'POST', body: JSON.stringify(data) }),
    codeReview: (data) => request('/ai/code-review', { method: 'POST', body: JSON.stringify(data) }),
    generateReport: (data) => request('/ai/generate-report', { method: 'POST', body: JSON.stringify(data) }),
    suggestRemediation: (finding, code) => request(`/ai/suggest-remediation?finding_description=${encodeURIComponent(finding)}${code ? '&code_snippet=' + encodeURIComponent(code) : ''}`, { method: 'POST' }),
  };

  // Notes API
  const notes = {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/notes${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`/notes/${id}`),
    create: (data) => request('/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/notes/${id}`, { method: 'DELETE' }),
  };

  // Clients API
  const clients = {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/clients${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`/clients/${id}`),
    create: (data) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
  };

  // Audit API
  const audit = {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/audit${qs ? '?' + qs : ''}`);
    },
  };

  // Initialize tokens from storage
  getStoredTokens();

  return {
    auth, projects, files, findings, notifications, scans,
    he, terminal, ai, notes, clients, audit, request,
    isAuthenticated, clearTokens,
    get BASE_URL() { return BASE_URL; },
    get accessToken() { return accessToken; },
  };
})();
