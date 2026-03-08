/**Page-specific logic only. Extends window.Design (from main.js).
 *
 * LOAD ORDER in profile.html:
 *   1. <link rel="stylesheet" href="main.css" />
 *   2. <script src="main.js"></script>       ← sets window.Design
 *   3. <script src="profile.js" defer></script> ← this file (runs after DOM)
 *
 * BACKEND INTEGRATION
 *   Search for  // ── BACKEND:  to find every swap point.
 *
 * EXPOSED ON window.Design (for backend devs):
 *   Design.renderProfile(user)   — populate page from user object
 *   Design.toggleSwitch(id)      — toggle a switch by element id
 *   Design.logOut()              — redirect
 */

/* TRUST RANK SVG ICONS
   Keys must match the label returned by Design.getReputation():
     'Candle' | 'Lantern' | 'Lighthouse' */
var svgMap = {
  Candle: '<svg width="30" height="30" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">'
    + '<ellipse cx="32" cy="10" rx="4" ry="6" fill="#f0b429"/>'
    + '<ellipse cx="32" cy="12" rx="2.5" ry="3.5" fill="#e87e3e"/>'
    + '<rect x="26" y="18" width="12" height="28" rx="3" fill="#e8f4f5" stroke="#0d9e9e" stroke-width="2"/>'
    + '<path d="M26 32 Q24 36 26 40 L26 46 Q24 48 26 50 L38 50 Q40 48 38 46 L38 40 Q40 36 38 32 Z" fill="#0d9e9e" opacity="0.15"/>'
    + '<line x1="32" y1="14" x2="32" y2="18" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>'
    + '<rect x="22" y="46" width="20" height="6" rx="3" fill="#0d9e9e" opacity="0.7"/>'
    + '</svg>',

  Lantern: '<svg width="30" height="30" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">'
    + '<path d="M32 4 Q32 2 34 2 Q36 2 36 4 Q36 6 32 8" stroke="#666" stroke-width="2" fill="none" stroke-linecap="round"/>'
    + '<path d="M22 16 L32 8 L42 16 Z" fill="#e05252"/>'
    + '<rect x="22" y="15" width="20" height="3" rx="1.5" fill="#c0342c"/>'
    + '<rect x="23" y="18" width="18" height="22" rx="3" fill="#fef9c3" stroke="#e87e3e" stroke-width="2"/>'
    + '<line x1="32" y1="18" x2="32" y2="40" stroke="#e87e3e" stroke-width="1.5"/>'
    + '<line x1="23" y1="29" x2="41" y2="29" stroke="#e87e3e" stroke-width="1.5"/>'
    + '<ellipse cx="32" cy="26" rx="4" ry="5" fill="#f0b429" opacity="0.85"/>'
    + '<ellipse cx="32" cy="28" rx="2.5" ry="3" fill="#e87e3e" opacity="0.7"/>'
    + '<rect x="22" y="40" width="20" height="4" rx="2" fill="#e87e3e"/>'
    + '<path d="M23 20 Q16 25 23 34" stroke="#888" stroke-width="2" fill="none" stroke-linecap="round"/>'
    + '<path d="M41 20 Q48 25 41 34" stroke="#888" stroke-width="2" fill="none" stroke-linecap="round"/>'
    + '<rect x="26" y="44" width="12" height="4" rx="2" fill="#666"/>'
    + '</svg>',

  Lighthouse: '<svg width="30" height="30" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">'
    + '<polygon points="2,22 18,26 18,30" fill="#f0b429" opacity="0.85"/>'
    + '<polygon points="62,22 46,26 46,30" fill="#f0b429" opacity="0.85"/>'
    + '<polygon points="32,4 44,16 20,16" fill="#e05252"/>'
    + '<rect x="26" y="16" width="12" height="8" rx="1" fill="#e8f4f5" stroke="#1a1a2e" stroke-width="1.5"/>'
    + '<rect x="28" y="17" width="8" height="6" rx="1" fill="#fef9c3"/>'
    + '<rect x="24" y="24" width="16" height="4" rx="1" fill="#e05252" stroke="#1a1a2e" stroke-width="1"/>'
    + '<path d="M25 28 L23 40 L41 40 L39 28 Z" fill="#e8f4f5" stroke="#1a1a2e" stroke-width="1.5"/>'
    + '<path d="M29 30 Q32 27 35 30 L35 37 L29 37 Z" fill="#fef9c3" stroke="#1a1a2e" stroke-width="1"/>'
    + '<rect x="22" y="40" width="20" height="4" rx="1" fill="#e05252" stroke="#1a1a2e" stroke-width="1"/>'
    + '<path d="M23 44 L21 56 L43 56 L41 44 Z" fill="#e8f4f5" stroke="#1a1a2e" stroke-width="1.5"/>'
    + '<path d="M28 46 Q32 43 36 46 L36 53 L28 53 Z" fill="#fef9c3" stroke="#1a1a2e" stroke-width="1"/>'
    + '<rect x="18" y="56" width="28" height="4" rx="2" fill="#7ab3bb"/>'
    + '</svg>',
};


/*PROFILE PAGE EXTENSIONS
   Attached to window.Design so backend devs can call them directly. */

/**
 * Populates the profile page from a user object.
 *
 * BACKEND: Swap the mock call at the bottom of this file for:
 *   fetch('/api/user/current')
 *     .then(function(r) { return r.json(); })
 *     .then(function(user) {
 *       Design.setUser(user);
 *       Design.renderProfile(user);
 *     });
 *
 * @param {object} user — shape: see Design.MOCK_USER in shared.js
 */
Design.renderProfile = function (user) {
  var avatar = document.getElementById('main-avatar');
  if (avatar && user.avatarUrl) avatar.src = user.avatarUrl;

  var nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.textContent = user.name || '';

  var roleEl = document.getElementById('user-commuter-type');
  if (roleEl) roleEl.textContent = user.role || 'Commuter';

  var tripsEl   = document.getElementById('stat-trips');
  var reportsEl = document.getElementById('stat-reports');
  if (tripsEl)   tripsEl.textContent   = (user.stats && user.stats.trips   != null) ? user.stats.trips   : '--';
  if (reportsEl) reportsEl.textContent = (user.stats && user.stats.reports != null) ? user.stats.reports : '--';

  // Trust rank
  var upvotes   = (user.stats && user.stats.upvotedReports) || 0;
  var rep       = Design.getReputation(upvotes);
  var iconEl    = document.getElementById('trust-icon');
  var rankLabel = document.getElementById('trust-rank-text');
  if (iconEl)    iconEl.innerHTML    = svgMap[rep.label] || '';
  if (rankLabel) rankLabel.textContent = rep.label;

  // Sync toggle states from user preferences
  if (user.preferences) {
    var aiToggle = document.getElementById('toggle-ai');
    if (aiToggle) aiToggle.classList.toggle('on', !!user.preferences.aiSafety);
    // night-mode toggle is synced from localStorage by shared.js _onDOMReady
  }

  // Pre-fill edit modal fields
  var editName     = document.getElementById('edit-name');
  var editUsername = document.getElementById('edit-username');
  if (editName)     editName.value     = user.name     || '';
  if (editUsername) editUsername.value = user.username  || '';
};


/**
 * Toggles a switch on/off and handles side effects.
 * @param {string} id — element id of the toggle button
 * @returns {boolean} — new state (true = on)
 */
Design.toggleSwitch = function (id) {
  var btn = document.getElementById(id);
  if (!btn) return false;
  var isOn = btn.classList.toggle('on');
  if (id === 'toggle-night') {
    Design.applyTheme(isOn ? 'dark' : 'light');
  }
  return isOn;
};


/**
 * Logs the user out.
 *
 * BACKEND: Replace body with:
 *   fetch('/api/auth/logout', { method: 'POST' })
 *     .then(function() { window.location.href = '/login.html'; });
 */
Design.logOut = function () {
  fetch('/api/auth/logout', { method: 'POST' })
    .then(function () { window.location.href = '/login.html'; });
};


/*DOM WIRING — runs after DOM is ready (profile.js has defer) */
document.addEventListener('DOMContentLoaded', function () {

  /*nav*/
  Design.Nav.render('profile');

  /*load profile data
   * BACKEND: replace with:
   *   fetch('/api/user/current')
   *     .then(function(r) { return r.json(); })
   *     .then(function(user) { Design.setUser(user); Design.renderProfile(user); })
   *     .catch(function() { Design.renderProfile(Design.MOCK_USER); });
   */
  Design.renderProfile(Design.getUser());

  /* ai safety toggle */
  var toggleAi = document.getElementById('toggle-ai');
  if (toggleAi) {
    toggleAi.addEventListener('click', function () {
      var isOn = Design.toggleSwitch('toggle-ai');
      // ── BACKEND: PATCH /api/user/current/preferences { aiSafety: isOn }
      console.log('[Profile] AI Safety:', isOn);
    });
  }

  /* dark mode toggle */
  var toggleNight = document.getElementById('toggle-night');
  if (toggleNight) {
    toggleNight.addEventListener('click', function () {
      var isOn = Design.toggleSwitch('toggle-night');
      // ── BACKEND: PATCH /api/user/current/preferences { nightMode: isOn }
      console.log('[Profile] Night Mode:', isOn);
    });
  }

  /*comingsoon*/
  ['row-offline-maps', 'row-travel-history', 'row-notifications', 'row-account-settings']
    .forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', Design.showComingSoon);
    });

  /*logout */
  var logoutRow = document.getElementById('row-logout');
  if (logoutRow) logoutRow.addEventListener('click', Design.logOut);

  /*edit pro modal */
  var modal         = document.getElementById('edit-modal');
  var openBtn       = document.getElementById('edit-profile-btn');
  var closeBtn      = document.getElementById('modal-close-btn');
  var saveBtn       = document.getElementById('save-profile-btn');
  var avatarTrigger = document.getElementById('modal-avatar-trigger');
  var avatarInput   = document.getElementById('avatar-file-input');
  var modalAvatar   = document.getElementById('modal-avatar-img');
  var mainAvatar    = document.getElementById('main-avatar');

  function openModal() {
    if (!modal) return;
    // Sync latest values into form
    var u = Design.getUser();
    var nameInput = document.getElementById('edit-name');
    var userInput = document.getElementById('edit-username');
    if (nameInput) nameInput.value = u.name     || '';
    if (userInput) userInput.value = u.username  || '';
    if (mainAvatar && modalAvatar) modalAvatar.src = mainAvatar.src;
    modal.classList.add('open');
  }

  function closeModal() {
    if (modal) modal.classList.remove('open');
  }

  if (openBtn)  openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal)    modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  // Avatar/Profile img picker
  if (avatarTrigger && avatarInput) {
    avatarTrigger.addEventListener('click',   function () { avatarInput.click(); });
    avatarTrigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') avatarInput.click();
    });
    avatarInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      var url = URL.createObjectURL(file);
      if (modalAvatar) modalAvatar.src = url;
      if (mainAvatar)  mainAvatar.src  = url;
    });
  }

  // Save profile
  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      var nameInput    = document.getElementById('edit-name');
      var sel          = document.getElementById('edit-commuter');
      var name         = (nameInput ? nameInput.value.trim() : '') || Design.getUser().name;
      var commuterType = sel ? sel.options[sel.selectedIndex].text + ' Commuter' : Design.getUser().role;

      // Update DOM
      var nameEl = document.getElementById('user-name');
      var roleEl = document.getElementById('user-commuter-type');
      if (nameEl) nameEl.textContent = name;
      if (roleEl) roleEl.textContent = commuterType;
      if (mainAvatar && modalAvatar) mainAvatar.src = modalAvatar.src;

      // Update Design user cache
      Design.setUser({ name: name, role: commuterType });

      // ── BACKEND: fetch('/api/user/current', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name: name, role: commuterType })
      // });

      Design.showToast('Profile saved!', 'green');
      saveBtn.textContent = 'Saved ✓';
      saveBtn.style.background = 'var(--green)';
      setTimeout(function () {
        saveBtn.textContent      = 'Save Changes';
        saveBtn.style.background = '';
        closeModal();
      }, 1200);
    });
  }

  // Close modal on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

});