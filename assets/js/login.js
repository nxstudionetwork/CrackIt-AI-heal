const CrackItLogin = (() => {
  'use strict';

  const { icon } = CrackItUtils;
  let step = 'email';
  let loginEmail = '';

  async function render() {
    const body = document.body;
    body.classList.add('login-active');

    const overlay = document.createElement('div');
    overlay.className = 'login-overlay';
    overlay.id = 'login-overlay';
    overlay.innerHTML = renderLogin();
    body.appendChild(overlay);

    createParticles(overlay);
    bindEvents(overlay);
  }

  function renderLogin() {
    const lastEmail = CrackItStorage.get('last_login_email', '');
    return `
      <div class="login-bg-grid"></div>
      <div class="login-bg-particles" id="login-particles"></div>
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="login-logo">${icon('shield')}</div>
            <h1 class="login-title">CrackIt</h1>
            <p class="login-subtitle">AI-Powered Cybersecurity OS</p>
          </div>
          <div class="login-body" id="login-body">
            ${step === 'email' ? renderEmailStep(lastEmail) : renderPasswordStep()}
          </div>
          <div class="login-options">
            <div class="login-option-row">
              <label class="login-checkbox"><input type="checkbox" id="login-remember" checked><span>Remember me</span></label>
              <button class="login-link" id="login-register" type="button">Create account</button>
            </div>
          </div>
          <div class="login-footer">
            <span class="login-version">v2.0.0</span>
            <span class="login-footer-text">Secured by CrackIt Security Engine</span>
          </div>
        </div>
        <div class="login-welcome">
          <div class="login-welcome-icon">${icon('shield')}</div>
          <h2>Welcome to CrackIt</h2>
          <p>Your AI-powered workspace for cybersecurity research, penetration testing, and threat analysis. Sign in to access your projects, tools, and AI assistants.</p>
        </div>
      </div>`;
  }

  function renderEmailStep(preEmail = '') {
    return `
      <div class="login-step">
        <div class="login-field">
          <label class="login-label">Email</label>
          <div class="login-input-wrap">
            ${icon('mail', 'login-input-icon')}
            <input type="email" class="login-input" id="login-email" placeholder="admin@crackit.io" autocomplete="email" autofocus value="${CrackItUtils.escapeHtml(preEmail)}">
          </div>
        </div>
        <div class="login-field" id="login-name-field" style="display:none">
          <label class="login-label">Full Name</label>
          <div class="login-input-wrap">
            ${icon('user', 'login-input-icon')}
            <input type="text" class="login-input" id="login-fullname" placeholder="Your full name" autocomplete="name">
          </div>
        </div>
        <div class="login-field" id="login-username-field" style="display:none">
          <label class="login-label">Username</label>
          <div class="login-input-wrap">
            ${icon('user', 'login-input-icon')}
            <input type="text" class="login-input" id="login-username" placeholder="Choose a username" autocomplete="username">
          </div>
        </div>
        <button class="login-btn login-btn--primary" id="login-send-password">
          Continue
          <span class="login-btn-icon">${icon('arrowRight')}</span>
        </button>
        <div id="login-message" class="login-message"></div>
      </div>`;
  }

  function renderPasswordStep() {
    return `
      <div class="login-step">
        <div class="login-field">
          <label class="login-label">Password</label>
          <div class="login-input-wrap">
            ${icon('lock', 'login-input-icon')}
            <input type="password" class="login-input" id="login-password" placeholder="Enter your password" autocomplete="current-password" autofocus>
          </div>
        </div>
        <button class="login-btn login-btn--primary" id="login-submit">
          Sign In
          <span class="login-btn-icon">${icon('arrowRight')}</span>
        </button>
        <button class="login-btn login-btn--ghost" id="login-back">
          ${icon('arrowLeft')} Back
        </button>
        <div id="login-message" class="login-message"></div>
      </div>`;
  }

  function createParticles(overlay) {
    const container = overlay.querySelector('#login-particles');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
      const dot = document.createElement('div');
      dot.className = 'login-particle';
      dot.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-delay:${Math.random()*5}s;animation-duration:${3+Math.random()*4}s`;
      container.appendChild(dot);
    }
  }

  function bindEvents(overlay) {
    const sendBtn = overlay.querySelector('#login-send-password');
    const submitBtn = overlay.querySelector('#login-submit');
    const backBtn = overlay.querySelector('#login-back');
    const emailInput = overlay.querySelector('#login-email');
    const passInput = overlay.querySelector('#login-password');
    const registerBtn = overlay.querySelector('#login-register');

    document.addEventListener('keydown', loginKeyHandler);

    sendBtn?.addEventListener('click', () => handleContinue(overlay));
    emailInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleContinue(overlay); });
    submitBtn?.addEventListener('click', () => handleLogin(overlay));
    passInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(overlay); });
    backBtn?.addEventListener('click', () => {
      step = 'email';
      const body = overlay.querySelector('#login-body');
      if (body) { body.innerHTML = renderEmailStep(loginEmail); body.querySelector('#login-email')?.focus(); bindEvents(overlay); }
    });
    registerBtn?.addEventListener('click', () => handleRegister(overlay));
  }

  function loginKeyHandler(e) {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('login-overlay');
      if (overlay) showMessage(overlay, 'Please sign in to continue', 'info');
    }
  }

  async function handleContinue(overlay) {
    const email = overlay.querySelector('#login-email')?.value.trim();
    if (!email || !email.includes('@')) {
      showMessage(overlay, 'Please enter a valid email address', 'warning');
      return;
    }
    loginEmail = email;
    CrackItStorage.set('last_login_email', email);

    if (CrackItAPI.isAuthenticated()) {
      try {
        const user = await CrackItAPI.auth.me();
        showMessage(overlay, `Welcome back, ${user.username || user.email}`, 'success');
        setTimeout(() => completeLogin(overlay), 500);
        return;
      } catch { /* token expired, show password step */ }
    }

    step = 'password';
    const body = overlay.querySelector('#login-body');
    if (body) {
      setTimeout(() => {
        body.innerHTML = renderPasswordStep(); bindEvents(overlay);
        setTimeout(() => overlay.querySelector('#login-password')?.focus(), 100);
      }, 300);
    }
  }

  async function handleLogin(overlay) {
    const pass = overlay.querySelector('#login-password')?.value;
    if (!pass) { showMessage(overlay, 'Please enter your password', 'warning'); return; }

    const submitBtn = overlay.querySelector('#login-submit');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Signing in...'; }

    try {
      await CrackItAPI.auth.login({ email: loginEmail, password: pass });
      showMessage(overlay, 'Login successful', 'success');
      setTimeout(() => completeLogin(overlay), 500);
    } catch (err) {
      showMessage(overlay, err.message || 'Invalid credentials. Try again.', 'error');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = `Sign In <span class="login-btn-icon">${icon('arrowRight')}</span>`; }
    }
  }

  async function handleRegister(overlay) {
    const email = overlay.querySelector('#login-email')?.value.trim();
    if (!email || !email.includes('@')) {
      showMessage(overlay, 'Enter your email first, then click Create account', 'warning');
      return;
    }

    const nameField = overlay.querySelector('#login-name-field');
    const usernameField = overlay.querySelector('#login-username-field');

    if (nameField && nameField.style.display === 'none') {
      nameField.style.display = 'block';
      usernameField.style.display = 'block';
      const submitBtn = overlay.querySelector('#login-send-password');
      if (submitBtn) submitBtn.textContent = 'Create Account';
      showMessage(overlay, 'Fill in name and username, then create your account', 'info');
      return;
    }

    const fullname = overlay.querySelector('#login-fullname')?.value.trim();
    const username = overlay.querySelector('#login-username')?.value.trim();
    const password = prompt('Choose a password (min 6 characters):');

    if (!password || password.length < 6) {
      showMessage(overlay, 'Password must be at least 6 characters', 'warning');
      return;
    }
    if (!username) {
      showMessage(overlay, 'Please enter a username', 'warning');
      return;
    }

    try {
      await CrackItAPI.auth.register({ email, username, password, full_name: fullname || undefined });
      showMessage(overlay, 'Account created! Signing in...', 'success');
      await CrackItAPI.auth.login({ email, password });
      setTimeout(() => completeLogin(overlay), 500);
    } catch (err) {
      showMessage(overlay, err.message || 'Registration failed', 'error');
    }
  }

  function completeLogin(overlay) {
    overlay.classList.add('login-fade-out');
    setTimeout(() => {
      document.body.classList.remove('login-active');
      overlay.remove();
      document.removeEventListener('keydown', loginKeyHandler);
      CrackItRouter.navigate('dashboard');
    }, 500);
  }

  function showMessage(overlay, text, type) {
    const el = overlay.querySelector('#login-message');
    if (el) {
      el.textContent = text;
      el.className = 'login-message login-message--' + (type || 'info');
      el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
  }

  function checkAuth() {
    if (CrackItAPI.isAuthenticated()) return true;
    return false;
  }

  return { render, checkAuth };
})();

CrackItModules.CrackItLogin = CrackItLogin;
