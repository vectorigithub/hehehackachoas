// log_reg.js — JeepneySafe Auth Logic
// Swap the API_BASE and endpoint paths once your backend is ready.

// ─────────────────────────────────────────────
// ██  CONFIG — swap these when backend is ready
// ─────────────────────────────────────────────
var API = {
  login:    'http://localhost/api/auth/login.php',    // POST { identifier, password }
  register: 'http://localhost/api/auth/register.php', // POST { fullname, email, password }
};
// Expected success responses:
//   login    → { success: true, user: { id, name, email, ... } }
//   register → { success: true, user: { id, name, email, ... } }
// Expected error responses:
//   → { success: false, message: "Human-readable error" }

// After login  → user goes here
var AFTER_LOGIN    = 'explore.html';
// After register → user goes here
var AFTER_REGISTER = 'survey.html';

// ─────────────────────────────────────────────
// ██  TABS
// ─────────────────────────────────────────────
var tabLogin     = document.getElementById('tab-login');
var tabRegister  = document.getElementById('tab-register');
var tabLoginLbl  = document.getElementById('tab-login-label');
var tabRegLbl    = document.getElementById('tab-register-label');
var loginForm    = document.getElementById('login-form');
var registerForm = document.getElementById('register-form');

function showTab(tab) {
  if (tab === 'login') {
    loginForm.style.display    = 'flex';
    registerForm.style.display = 'none';
    tabLoginLbl.classList.add('bg-primary', 'text-white');
    tabLoginLbl.classList.remove('text-slate-400');
    tabRegLbl.classList.remove('bg-primary', 'text-white');
    tabRegLbl.classList.add('text-slate-400');
    clearErrors();
  } else {
    loginForm.style.display    = 'none';
    registerForm.style.display = 'flex';
    tabRegLbl.classList.add('bg-primary', 'text-white');
    tabRegLbl.classList.remove('text-slate-400');
    tabLoginLbl.classList.remove('bg-primary', 'text-white');
    tabLoginLbl.classList.add('text-slate-400');
    clearErrors();
  }
}

tabLoginLbl.addEventListener('click', function () { showTab('login'); });
tabRegLbl.addEventListener('click',   function () { showTab('register'); });

// ─────────────────────────────────────────────
// ██  INLINE ERROR HELPERS
// ─────────────────────────────────────────────
function showError(formId, message) {
  clearErrors();
  var form = document.getElementById(formId);
  var el   = document.createElement('p');
  el.className  = 'error-msg text-red-400 text-xs font-medium text-center -mt-1 mb-1';
  el.textContent = message;
  // Insert before the submit button (last element)
  var btn = form.querySelector('button[type="submit"]');
  form.insertBefore(el, btn);
  // Also highlight the first input with an error border
  var inputs = form.querySelectorAll('input');
  inputs.forEach(function (inp) { inp.classList.add('border-red-500'); });
}

function showFieldError(inputId, message) {
  clearErrors();
  var input  = document.getElementById(inputId);
  var el     = document.createElement('p');
  el.className  = 'error-msg text-red-400 text-xs font-medium ml-1 -mt-1';
  el.textContent = message;
  input.classList.add('border-red-500', 'focus:border-red-500');
  // Insert error after the parent wrapper div
  input.closest('.flex.flex-col.gap-2').appendChild(el);
}

function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(function (el) { el.remove(); });
  document.querySelectorAll('input').forEach(function (inp) {
    inp.classList.remove('border-red-500', 'focus:border-red-500');
  });
}

// ─────────────────────────────────────────────
// ██  LOADING STATE ON BUTTON
// ─────────────────────────────────────────────
function setLoading(btn, loading) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span>';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.original;
  }
}

// ─────────────────────────────────────────────
// ██  PASSWORD VISIBILITY TOGGLE
// ─────────────────────────────────────────────
document.querySelectorAll('.toggle-password').forEach(function (icon) {
  icon.addEventListener('click', function () {
    var input = icon.previousElementSibling;
    if (input.type === 'password') {
      input.type    = 'text';
      icon.textContent = 'visibility_off';
    } else {
      input.type    = 'password';
      icon.textContent = 'visibility';
    }
  });
});

// ─────────────────────────────────────────────
// ██  LOGIN FORM
// ─────────────────────────────────────────────
loginForm.addEventListener('submit', function (e) {
  e.preventDefault();
  clearErrors();

  var identifier = document.getElementById('login-identifier').value.trim();
  var password   = document.getElementById('login-password').value;

  // Client-side validation
  if (!identifier) { showFieldError('login-identifier', 'Please enter your email or username.'); return; }
  if (!password)   { showFieldError('login-password',   'Please enter your password.');         return; }

  var btn = loginForm.querySelector('button[type="submit"]');
  setLoading(btn, true);

  fetch(API.login, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ identifier: identifier, password: password }),
  })
  .then(function (res) { return res.json(); })
  .then(function (data) {
    setLoading(btn, false);
    if (data.success) {
      // Save user session info
      sessionStorage.setItem('user', JSON.stringify(data.user));
      // Redirect to home
      window.location.href = AFTER_LOGIN;
    } else {
      showError('login-form', data.message || 'Invalid credentials. Please try again.');
    }
  })
  .catch(function (err) {
    setLoading(btn, false);
    showError('login-form', 'Could not connect to the server. Please try again.');
    console.error('Login error:', err);
  });
});

// ─────────────────────────────────────────────
// ██  REGISTER FORM
// ─────────────────────────────────────────────
registerForm.addEventListener('submit', function (e) {
  e.preventDefault();
  clearErrors();

  var fullname  = document.getElementById('reg-fullname').value.trim();
  var email     = document.getElementById('reg-email').value.trim();
  var password  = document.getElementById('reg-password').value;
  var confirm   = document.getElementById('reg-confirm-password').value;

  // Client-side validation
  if (!fullname) {
    showFieldError('reg-fullname', 'Please enter your full name.');
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError('reg-email', 'Please enter a valid email address.');
    return;
  }
  if (!password || password.length < 8) {
    showFieldError('reg-password', 'Password must be at least 8 characters.');
    return;
  }
  if (password !== confirm) {
    showFieldError('reg-confirm-password', 'Passwords do not match.');
    return;
  }

  var btn = registerForm.querySelector('button[type="submit"]');
  setLoading(btn, true);

  fetch(API.register, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fullname: fullname, email: email, password: password }),
  })
  .then(function (res) { return res.json(); })
  .then(function (data) {
    setLoading(btn, false);
    if (data.success) {
      // Save user session info
      sessionStorage.setItem('user', JSON.stringify(data.user));
      // New users go to survey first
      window.location.href = AFTER_REGISTER;
    } else {
      showError('register-form', data.message || 'Registration failed. Please try again.');
    }
  })
  .catch(function (err) {
    setLoading(btn, false);
    showError('register-form', 'Could not connect to the server. Please try again.');
    console.error('Register error:', err);
  });
});

// ─────────────────────────────────────────────
// ██  SOCIAL LOGIN (Google / Apple)
// ─────────────────────────────────────────────
document.querySelectorAll('.social-login-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var provider = btn.dataset.provider;
    // TODO: plug in your OAuth flow here
    alert('Social login with ' + provider + ' is not yet configured.');
  });
});
