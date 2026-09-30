/**
 * CrackIt — Main Application Entry Point
 */

const CrackItApp = (() => {
  'use strict';

  async function init() {
    try {
      await CrackItStorage.initialize();

      const authenticated = CrackItLogin.checkAuth();
      if (!authenticated) {
        CrackItUI.init();
        await CrackItLogin.render();
        return;
      }

      await CrackItProfessional.start();

      CrackItUI.init();
      CrackItUI.initRipples();
      CrackItUI.startClock();
      CrackItUI.startMetrics();

      CrackItNavigation.init();
      CrackItSearch.init();
      CrackItNotifications.init();
      CrackItRightPanel.init();

      CrackItRouter.init();
      CrackItProfessional.init();
      CrackItProfessional.initFloatingButton(document.getElementById('app'));
      CrackItProfessional.initAIFloatingButton();
      CrackItProfessional.initScratchPad();
      document.getElementById('scratch-pad-toggle')?.addEventListener('click', () => {
        const pad = document.getElementById('scratch-pad');
        if (pad) pad.style.display = pad.style.display === 'none' ? 'block' : 'none';
      });

      initResizeHandles();
      initGlobalActions();
      initKeyboardActions();

      window.addEventListener('crackit:auth-expired', () => {
        CrackItUI.toast('Session expired. Please sign in again.', 'warning');
        setTimeout(() => location.reload(), 1500);
      });

      CrackItNotifications.add('Welcome to CrackIt', 'Your cybersecurity workspace is ready.', 'success');
    } catch (err) {
      console.error('CrackIt initialization error:', err);
      document.body.innerHTML = `<div style="padding:40px;color:#EF4444;font-family:sans-serif"><h2>Failed to initialize CrackIt</h2><p>${err.message}</p></div>`;
    }
  }

  function initResizeHandles() {
    const leftHandle = document.querySelector('#resize-left');
    const rightHandle = document.querySelector('#resize-right');
    const sidebar = document.querySelector('#sidebar');
    const rightPanel = document.querySelector('#right-panel');

    setupResize(leftHandle, (dx) => {
      if (!sidebar) return;
      const current = sidebar.offsetWidth;
      const newWidth = CrackItUtils.clamp(current + dx, 64, 360);
      sidebar.style.width = `${newWidth}px`;
      document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
    });

    setupResize(rightHandle, (dx) => {
      if (!rightPanel) return;
      const current = rightPanel.offsetWidth;
      const newWidth = CrackItUtils.clamp(current - dx, 200, 480);
      rightPanel.style.width = `${newWidth}px`;
      document.documentElement.style.setProperty('--right-panel-width', `${newWidth}px`);
      CrackItStorage.uiState.update({ rightPanelWidth: newWidth });
    });
  }

  function setupResize(handle, onResize) {
    if (!handle) return;
    let startX = 0;

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startX = e.clientX;
      handle.classList.add('active');

      const onMouseMove = (e) => {
        const dx = e.clientX - startX;
        startX = e.clientX;
        onResize(dx);
      };

      const onMouseUp = () => {
        handle.classList.remove('active');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  function initGlobalActions() {
    document.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;

      const statusBarActions = {
        'dashboard': 'dashboard', 'projects': 'projects', 'terminal': 'terminal',
        'notifications': 'notifications', 'settings': 'settings', 'help': 'help',
        'learn-more': 'help'
      };

      if (action === 'notifications') {
        CrackItProfessional.openNotifSlide();
        return;
      }

      if (action === 'command') {
        CrackItProfessional.openCommandPalette();
        return;
      }

      if (action === 'tasks') {
        CrackItProfessional.openTaskPanel();
        return;
      }

      if (action === 'search') {
        CrackItSearch.open();
        return;
      }

      if (statusBarActions[action]) {
        CrackItRouter.navigate(statusBarActions[action]);
        return;
      }
    });
  }

  function initKeyboardActions() {
    document.addEventListener('keydown', (e) => {
      const isInput = e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA' || e.target?.tagName === 'SELECT';

      if (e.ctrlKey && e.key === ' ') {
        e.preventDefault();
        if (CrackItProfessional.qlIsOpen) CrackItProfessional.closeQuickLauncher();
        else CrackItProfessional.openQuickLauncher();
        return;
      }

      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (CrackItProfessional.isOpen) {
          CrackItProfessional.closeCommandPalette();
        } else {
          CrackItProfessional.openCommandPalette();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (CrackItProfessional.isOpen) { CrackItProfessional.closeCommandPalette(); return; }
        const openSlide = document.querySelector('.slide-overlay.open');
        if (openSlide) { openSlide.click(); return; }
        const searchOverlay = document.querySelector('.search-overlay.open');
        if (searchOverlay) { CrackItSearch.close(); return; }
        return;
      }

      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        document.getElementById('sidebar')?.classList.toggle('collapsed');
        return;
      }

      if (e.ctrlKey && e.key === 'j') {
        e.preventDefault();
        CrackItRightPanel.toggle();
        return;
      }

      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        CrackItRouter.navigate('terminal');
        return;
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        CrackItSearch.open();
        return;
      }

      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        CrackItRouter.navigate('settings');
        return;
      }

      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        CrackItRouter.navigate('projects');
        return;
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        CrackItRouter.navigate('clients');
        return;
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        CrackItRouter.navigate('reports');
        return;
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        CrackItRouter.navigate('chat');
        return;
      }

      if (e.ctrlKey && e.key === 'n' && !isInput) {
        e.preventDefault();
        CrackItUI.toast('Create a new project', 'info');
        CrackItRouter.navigate('projects');
        return;
      }

      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        CrackItRouter.navigate('dashboard');
        return;
      }

      if (e.ctrlKey && e.key === '1') { e.preventDefault(); CrackItRouter.navigate('dashboard'); return; }
      if (e.ctrlKey && e.key === '2') { e.preventDefault(); CrackItRouter.navigate('projects'); return; }
      if (e.ctrlKey && e.key === '3') { e.preventDefault(); CrackItRouter.navigate('chat'); return; }
      if (e.ctrlKey && e.key === '4') { e.preventDefault(); CrackItRouter.navigate('notes'); return; }
      if (e.ctrlKey && e.key === '5') { e.preventDefault(); CrackItRouter.navigate('files'); return; }

      if (e.ctrlKey && e.shiftKey && e.key === 'a') {
        e.preventDefault();
        CrackItRouter.navigate('chat');
        return;
      }

      if (e.ctrlKey && e.key === 's' && !isInput) {
        e.preventDefault();
        CrackItUI.toast('Changes saved', 'success');
        return;
      }

      if (e.ctrlKey && e.key === 'z' && !isInput) {
        e.preventDefault();
        CrackItUI.toast('Undo', 'info');
        return;
      }

      if (e.ctrlKey && e.key === 'y' && !isInput) {
        e.preventDefault();
        CrackItUI.toast('Redo', 'info');
        return;
      }

      if (e.ctrlKey && e.key === 'd' && !isInput) {
        e.preventDefault();
        CrackItUI.toast('Duplicate selected item', 'info');
        return;
      }

      if (e.ctrlKey && e.key === 'f' && !isInput) {
        e.preventDefault();
        CrackItSearch.open();
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        CrackItRouter.navigate('help');
        return;
      }

      if (e.key === 'F2' && !isInput) {
        e.preventDefault();
        CrackItUI.toast('Rename: select an item to rename', 'info');
        return;
      }

      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        const state = CrackItStorage.uiState.get();
        if (state.activeTab) {
          const tabs = state.workspaceTabs || [];
          const idx = tabs.findIndex(t => t.id === state.activeTab);
          if (idx >= 0) {
            tabs.splice(idx, 1);
            CrackItStorage.uiState.update({ workspaceTabs: tabs });
            if (tabs.length > 0) CrackItRouter.navigate(tabs[Math.min(idx, tabs.length - 1)].page);
          }
        }
        return;
      }

      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        const state = CrackItStorage.uiState.get();
        const tabs = state.workspaceTabs || [];
        if (tabs.length < 2) return;
        const idx = tabs.findIndex(t => t.id === state.activeTab);
        const next = e.shiftKey ? (idx - 1 + tabs.length) % tabs.length : (idx + 1) % tabs.length;
        CrackItRouter.navigate(tabs[next].page);
        return;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init };
})();
