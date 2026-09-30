const CrackItNotifications = (() => {
  'use strict';

  const { escapeHtml, formatDate, $ } = CrackItUtils;
  let apiNotifications = null;

  async function init() {
    await syncFromAPI();
    updateBadge();
    renderPanel();

    $('#notification-mark-read')?.addEventListener('click', markAllRead);
    $('#notification-clear')?.addEventListener('click', clearAll);
    $('#notification-archive-all')?.addEventListener('click', archiveAll);

    document.querySelectorAll('.notif-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderPanel(tab.dataset.category || 'all');
      });
    });
  }

  async function syncFromAPI() {
    if (CrackItAPI.isAuthenticated()) {
      try {
        const data = await CrackItAPI.notifications.list();
        apiNotifications = data.map(n => ({
          id: n.id,
          title: n.title,
          text: n.message || n.text || '',
          type: n.type || 'info',
          category: n.category || 'system',
          read: n.is_read || n.read || false,
          createdAt: n.created_at || n.createdAt,
          timestamp: n.created_at || n.createdAt,
        }));
        CrackItStorage.set('notifications', apiNotifications);
        return;
      } catch { /* offline fallback */ }
    }
    apiNotifications = null;
  }

  function getNotifications() {
    if (apiNotifications) return apiNotifications;
    return CrackItStorage.getCollection('notifications');
  }

  async function updateBadge() {
    if (CrackItAPI.isAuthenticated()) {
      try {
        const data = await CrackItAPI.notifications.unreadCount();
        const unread = data.count || 0;
        const badge = $('#notification-badge');
        if (badge) {
          badge.textContent = unread;
          badge.style.display = unread > 0 ? 'flex' : 'none';
        }
        document.querySelectorAll('[data-notification-count]').forEach(el => {
          el.textContent = unread;
        });
        return;
      } catch { /* fallback to local count */ }
    }
    const unread = getNotifications().filter(n => !n.read).length;
    const badge = $('#notification-badge');
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'flex' : 'none';
    }
    document.querySelectorAll('[data-notification-count]').forEach(el => {
      el.textContent = unread;
    });
  }

  function togglePanel() {
    const panel = $('#notification-panel');
    panel?.classList.toggle('open');
    if (panel?.classList.contains('open')) {
      syncFromAPI().then(() => { renderPanel(); updateBadge(); });
    }
  }

  function closePanel() {
    $('#notification-panel')?.classList.remove('open');
  }

  function renderPanel(category = 'all') {
    const container = $('#notification-list');
    if (!container) return;

    let notifications = getNotifications();
    if (category !== 'all') {
      notifications = notifications.filter(n => n.category === category);
    }

    const active = document.querySelector('.notif-tab.active');
    const activeCat = active ? active.dataset.category : 'all';
    if (activeCat !== category) return;

    const countEl = $('#notif-count');
    if (countEl) countEl.textContent = notifications.length;

    if (!notifications.length) {
      container.innerHTML = '<div class="empty-state" style="padding:32px;flex:1"><div class="empty-state-icon" style="margin-bottom:8px;opacity:0.3">' + CrackItUtils.icons.bellOff + '</div><p>No notifications</p></div>';
      return;
    }

    const typeIcons = { success: 'checkCircle', error: 'xOctagon', warning: 'alertTriangle', info: 'info' };

    container.innerHTML = notifications.map(n => {
      const iconName = typeIcons[n.type] || 'info';
      const iconSvg = CrackItUtils.icons[iconName] || CrackItUtils.icons.info;
      return `
        <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
          ${n.read ? '' : '<div class="notif-unread-dot"></div>'}
          <div class="notif-item-icon ${n.type}">${iconSvg}</div>
          <div class="notif-item-body">
            <div class="notif-item-title">${escapeHtml(n.title)}</div>
            <div class="notif-item-text">${escapeHtml(n.text)}</div>
            <div class="notif-item-time">${formatDate(n.createdAt || n.timestamp, true)}</div>
          </div>
          <div class="notif-item-actions">
            ${n.read ? '' : '<button class="notif-action-sm" data-mark="${n.id}" title="Mark read"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg></button>'}
            <button class="notif-action-sm" data-archive="${n.id}" title="Archive"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8"/><path d="M10 12h4"/></svg></button>
          </div>
        </div>`;
    }).join('');

    container.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.notif-action-sm')) return;
        markRead(item.dataset.id);
      });
    });

    container.querySelectorAll('[data-mark]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        markRead(btn.dataset.mark);
      });
    });

    container.querySelectorAll('[data-archive]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        archiveNotification(btn.dataset.archive);
      });
    });
  }

  function archiveNotification(id) {
    CrackItStorage.removeFromCollection('notifications', id);
    if (apiNotifications) apiNotifications = apiNotifications.filter(n => n.id !== id);
    updateBadge();
    renderPanel(document.querySelector('.notif-tab.active')?.dataset.category || 'all');
    CrackItUI.toast('Notification archived', 'info');
  }

  function markRead(id) {
    CrackItStorage.updateInCollection('notifications', id, { read: true });
    if (apiNotifications) {
      const n = apiNotifications.find(n => n.id === id);
      if (n) n.read = true;
    }
    updateBadge();
    renderPanel();
  }

  async function markAllRead() {
    if (CrackItAPI.isAuthenticated()) {
      try { await CrackItAPI.notifications.markAllRead(); } catch { /* local fallback */ }
    }
    const notifications = getNotifications().map(n => ({ ...n, read: true }));
    CrackItStorage.set('notifications', notifications);
    if (apiNotifications) apiNotifications = notifications;
    updateBadge();
    renderPanel();
    CrackItUI.toast('All notifications marked as read', 'success');
  }

  function archiveAll() {
    const remaining = getNotifications().map(n => ({ ...n, archived: true }));
    CrackItStorage.set('notifications', remaining);
    if (apiNotifications) apiNotifications = remaining;
    updateBadge();
    renderPanel();
    CrackItUI.toast('All notifications archived', 'info');
  }

  function clearAll() {
    CrackItStorage.set('notifications', []);
    apiNotifications = [];
    updateBadge();
    renderPanel();
    CrackItUI.toast('Notifications cleared', 'info');
  }

  function add(title, text, type = 'info', category = 'system') {
    const notif = {
      id: CrackItUtils.uid('notif'),
      title, text, type, category,
      read: false,
      createdAt: new Date().toISOString()
    };
    CrackItStorage.addToCollection('notifications', notif);
    if (apiNotifications) apiNotifications.unshift(notif);
    updateBadge();
  }

  return { init, togglePanel, closePanel, updateBadge, add, markAllRead, syncFromAPI };
})();

CrackItModules.CrackItNotifications = CrackItNotifications;
