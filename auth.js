(function () {
  const AUTH_BASE = '/__meta/auth';

  const flags = window.__FLAGS || {};
  if (!flags.signInEnabled) {
    document
      .querySelectorAll('[data-feature="signin"]')
      .forEach((el) => el.remove());
  }

  const modal = document.getElementById('authModal');
  const forms = {
    signin: document.getElementById('signinForm'),
    signup: document.getElementById('signupForm'),
    recover: document.getElementById('recoverForm'),
    newPassword: document.getElementById('newPasswordForm'),
  };

  function showView(view) {
    Object.entries(forms).forEach(([name, form]) => {
      form.hidden = name !== view;
      const msg = form.querySelector('[data-msg]');
      if (msg) msg.textContent = '';
    });
    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }

  document.querySelectorAll('[data-auth-open]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showView(el.dataset.authOpen);
    });
  });

  document.querySelectorAll('[data-auth-close]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  function setMsg(form, text) {
    const msg = form.querySelector('[data-msg]');
    if (msg) msg.textContent = text;
  }

  function storeSession(tokens) {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }

  forms.signup.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const res = await fetch(`${AUTH_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      setMsg(form, 'Account created — check your inbox to confirm.');
    } else {
      setMsg(form, 'Sign up failed. Try a different email or password.');
    }
  });

  forms.signin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const res = await fetch(`${AUTH_BASE}/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const tokens = await res.json();
      storeSession(tokens);
      setMsg(form, 'Signed in.');
      setTimeout(closeModal, 800);
    } else {
      setMsg(form, 'Sign in failed. Check your credentials, or confirm your email first.');
    }
  });

  forms.recover.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    await fetch(`${AUTH_BASE}/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setMsg(form, 'If that email has an account, a reset link is on its way.');
  });

  let recoveryToken = null;

  forms.newPassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const password = form.password.value;
    const res = await fetch(`${AUTH_BASE}/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recoveryToken}`,
      },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setMsg(form, 'Password updated. You can sign in now.');
      setTimeout(() => showView('signin'), 1000);
    } else {
      setMsg(form, 'Could not update password. Request a new reset link.');
    }
  });

  function handleAuthFragment() {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');
    if (!accessToken) return;

    if (type === 'recovery') {
      recoveryToken = accessToken;
      showView('newPassword');
    } else if (type === 'signup') {
      storeSession({ access_token: accessToken, refresh_token: refreshToken });
    }

    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  handleAuthFragment();
})();
