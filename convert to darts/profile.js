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
  ['row-offline-maps', 'row-notifications', 'row-account-settings']
    .forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', Design.showComingSoon);
    });

  /*logout */
  var logoutRow = document.getElementById('row-logout');
  if (logoutRow) logoutRow.addEventListener('click', Design.logOut);

  /* load travel history with mock data
   * BACKEND: replace with fetch('/api/user/travel-history').then(...) */
  Design.loadTravelHistory(Design.MOCK_TRAVEL_HISTORY);

  /* travel history row — opens full-page panel */
  var thRow = document.getElementById('row-travel-history');
  if (thRow) thRow.addEventListener('click', Design.openTravelHistory);

  /* travel history panel — back button */
  var thBackBtn = document.getElementById('th-back-btn');
  if (thBackBtn) thBackBtn.addEventListener('click', Design.closeTravelHistory);

  /* detail sheet — back button + tap overlay to close */
  var sheetBackBtn = document.getElementById('sheet-back-btn');
  if (sheetBackBtn) sheetBackBtn.addEventListener('click', closeTravelDetail);
  var detailOverlay = document.getElementById('th-detail-overlay');
  if (detailOverlay) detailOverlay.addEventListener('click', function (e) {
    if (e.target === detailOverlay) closeTravelDetail();
  });

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


/* ════════════════════════════════════════════════════════════════
   MOCK TRAVEL HISTORY DATA
   ─────────────────────────────────────────────────────────────
   Shape per route:
     id          string
     origin      string
     destination string
     modes       string        — display label e.g. "LRT-2 + Walk"
     minutes     number
     fare        number        — in PHP
     safetyScore number        — 0–100
     safetyNote  string        — why this score
     date        string        — display string
     saved       boolean
     steps       { icon, name, desc }[]

   BACKEND: replace Design.MOCK_TRAVEL_HISTORY with:
     fetch('/api/user/travel-history')
       .then(function(r) { return r.json(); })
       .then(function(data) { Design.loadTravelHistory(data); });
════════════════════════════════════════════════════════════════ */
Design.MOCK_TRAVEL_HISTORY = {
  saved: [
    {
      id: 'sav_001',
      origin: 'Cubao',
      destination: 'UP Diliman',
      modes: 'Jeepney + Walk',
      minutes: 25,
      fare: 15,
      safetyScore: 92,
      safetyNote: 'Consistently safe corridor. High foot traffic throughout the day, well-lit streets, and no reported incidents in the past 60 days. Patrol presence near campus gates.',
      date: 'Daily route',
      saved: true,
      steps: [
        {
          icon: '<rect x="1" y="8" width="22" height="10" rx="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M1 11h22"/>',
          name: 'Jeepney — Commonwealth to Katipunan',
          desc: '18 min · ₱13 · Araneta – P. Tuazon – Katipunan Ave',
        },
        {
          icon: '<circle cx="12" cy="5" r="2"/><path d="M12 7v5"/><path d="M9 20l1-5H8l3-8"/><path d="M15 20l-1-5h2l-3-8"/>',
          name: 'Walk — Katipunan to UP Main Gate',
          desc: '7 min · 550 m · Well-lit campus road with roving guards',
        },
      ],
    },
    {
      id: 'sav_002',
      origin: 'Quezon Ave MRT',
      destination: 'Trinoma Mall',
      modes: 'MRT-3 + Walk',
      minutes: 18,
      fare: 28,
      safetyScore: 88,
      safetyNote: 'MRT-3 corridor is CCTV-monitored and has visible personnel. The walk from North Ave station to Trinoma is fully covered by the mall roof — safe even at night.',
      date: 'Weekend route',
      saved: true,
      steps: [
        {
          icon: '<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 10h16"/><circle cx="9" cy="17" r="2"/><circle cx="15" cy="17" r="2"/>',
          name: 'MRT-3 — Quezon Ave to North Ave',
          desc: '8 min · ₱28 · 2 stops, air-conditioned, CCTV throughout',
        },
        {
          icon: '<circle cx="12" cy="5" r="2"/><path d="M12 7v5"/><path d="M9 20l1-5H8l3-8"/><path d="M15 20l-1-5h2l-3-8"/>',
          name: 'Walk — North Ave Station to Trinoma',
          desc: '10 min · 800 m · Covered walkway, always busy',
        },
      ],
    },
  ],
  history: [
    {
      id: 'his_001',
      origin: 'Philcoa',
      destination: 'SM North EDSA',
      modes: 'Bus + Walk',
      minutes: 42,
      fare: 20,
      safetyScore: 76,
      safetyNote: 'Generally safe during daytime. Some stretches near the EDSA flyover have poor lighting at night. Recommend taking this route before 8 PM.',
      date: 'Mar 7, 2026 · 6:45 PM',
      saved: false,
      steps: [
        {
          icon: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/><path d="M3 12h18M8 6V4M16 6V4"/>',
          name: 'Bus — Philcoa to North Ave via EDSA',
          desc: '30 min · ₱20 · Aircon bus, busy but monitored',
        },
        {
          icon: '<circle cx="12" cy="5" r="2"/><path d="M12 7v5"/><path d="M9 20l1-5H8l3-8"/><path d="M15 20l-1-5h2l-3-8"/>',
          name: 'Walk — North Ave to SM North EDSA',
          desc: '12 min · 950 m · EDSA sidewalk, use footbridge',
        },
      ],
    },
    {
      id: 'his_002',
      origin: 'Cubao',
      destination: 'UP Diliman',
      modes: 'Jeepney + Walk',
      minutes: 25,
      fare: 15,
      safetyScore: 92,
      safetyNote: 'Consistently safe corridor. High foot traffic throughout the day, well-lit streets, no incidents in the past 60 days.',
      date: 'Mar 6, 2026 · 8:10 AM',
      saved: false,
      steps: [
        {
          icon: '<rect x="1" y="8" width="22" height="10" rx="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M1 11h22"/>',
          name: 'Jeepney — Commonwealth to Katipunan',
          desc: '18 min · ₱13 · Araneta – P. Tuazon – Katipunan Ave',
        },
        {
          icon: '<circle cx="12" cy="5" r="2"/><path d="M12 7v5"/><path d="M9 20l1-5H8l3-8"/><path d="M15 20l-1-5h2l-3-8"/>',
          name: 'Walk — Katipunan to UP Main Gate',
          desc: '7 min · 550 m · Campus road with guards',
        },
      ],
    },
    {
      id: 'his_003',
      origin: 'Monumento',
      destination: 'Cubao',
      modes: 'LRT-1 + Jeepney',
      minutes: 35,
      fare: 45,
      safetyScore: 85,
      safetyNote: 'LRT-1 is well-patrolled with uniform personnel on every platform. Jeepney transfer at Cubao is busy but safe during peak hours. Avoid late-night transfers.',
      date: 'Mar 5, 2026 · 7:30 PM',
      saved: false,
      steps: [
        {
          icon: '<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 10h16"/><circle cx="9" cy="17" r="2"/><circle cx="15" cy="17" r="2"/>',
          name: 'LRT-1 — Monumento to Roosevelt',
          desc: '20 min · ₱35 · 3 stops, CCTV-monitored platform',
        },
        {
          icon: '<rect x="1" y="8" width="22" height="10" rx="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M1 11h22"/>',
          name: 'Jeepney — Roosevelt to Cubao',
          desc: '15 min · ₱10 · EDSA route, busy daytime corridor',
        },
      ],
    },
    {
      id: 'his_004',
      origin: 'Novaliches',
      destination: 'Quezon City Hall',
      modes: 'UV Express + Walk',
      minutes: 50,
      fare: 55,
      safetyScore: 71,
      safetyNote: 'UV Express route is registered and has GPS tracking. The walking stretch near City Hall has mixed lighting. Generally safe but stay alert near the market area.',
      date: 'Mar 3, 2026 · 9:00 AM',
      saved: false,
      steps: [
        {
          icon: '<rect x="2" y="7" width="20" height="12" rx="2"/><path d="M16 3l4 4-4 4"/><path d="M8 3L4 7l4 4"/>',
          name: 'UV Express — Novaliches to Quezon Ave',
          desc: '38 min · ₱55 · Registered, GPS-tracked, A/C',
        },
        {
          icon: '<circle cx="12" cy="5" r="2"/><path d="M12 7v5"/><path d="M9 20l1-5H8l3-8"/><path d="M15 20l-1-5h2l-3-8"/>',
          name: 'Walk — Quezon Ave to City Hall',
          desc: '12 min · 900 m · Market area, stay on main road',
        },
      ],
    },
  ],
};


/* ════════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════════ */

/* Safety color meta — mirrors explore.js getSafetyMeta */
function travelSafetyMeta(score) {
  if (score >= 85) return { color: '#12d9c0', bg: 'rgba(18,217,192,0.10)', label: 'Safe' };
  if (score >= 70) return { color: '#d97706', bg: 'rgba(217,119,6,0.10)',  label: 'Moderate' };
  return              { color: '#fb7185', bg: 'rgba(251,113,133,0.10)', label: 'Caution' };
}

/* Build one route card element */
function buildTravelCard(route, isSaved) {
  var card = document.createElement('div');
  card.className = 'travel-card' + (isSaved ? '' : ' timeline-item');

  var iconCls = isSaved ? 'travel-card-icon saved' : 'travel-card-icon';
  var iconPath = isSaved
    ? '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'
    : '<polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4.5"/><polyline points="3 3 3.05 11 11 11"/>';

  card.innerHTML =
    '<div class="' + iconCls + '">'
    +   '<svg class="icon-svg" width="20" height="20" viewBox="0 0 24 24">' + iconPath + '</svg>'
    + '</div>'
    + '<div class="travel-card-body">'
    +   '<div class="travel-card-route">' + route.origin + ' → ' + route.destination + '</div>'
    +   '<div class="travel-card-meta">' + route.modes + ' · ' + route.date + '</div>'
    + '</div>'
    + '<svg class="icon-svg travel-card-arrow" width="14" height="14" viewBox="0 0 24 24">'
    +   '<polyline points="9 18 15 12 9 6"/>'
    + '</svg>';

  card.addEventListener('click', function () { Design.openTravelDetail(route); });
  return card;
}


/* ════════════════════════════════════════════════════════════════
   Design.loadTravelHistory(data)
   Renders saved routes + history timeline from data object.

   BACKEND: call after real fetch resolves:
     fetch('/api/user/travel-history')
       .then(function(r) { return r.json(); })
       .then(function(data) { Design.loadTravelHistory(data); });

   @param {{ saved: TravelRoute[], history: TravelRoute[] }} data
════════════════════════════════════════════════════════════════ */
Design.loadTravelHistory = function (data) {
  var savedEl   = document.getElementById('saved-routes-list');
  var historyEl = document.getElementById('history-list');
  if (!savedEl || !historyEl) return;

  savedEl.innerHTML   = '';
  historyEl.innerHTML = '';

  (data.saved   || []).forEach(function (r) { savedEl.appendChild(buildTravelCard(r, true));  });
  (data.history || []).forEach(function (r) { historyEl.appendChild(buildTravelCard(r, false)); });
};


/* ════════════════════════════════════════════════════════════════
   Design.openTravelDetail(route)
   Opens the detail bottom sheet for a route object.
   Called on card click.

   BACKEND: optionally fetch fresh detail before opening:
     fetch('/api/user/travel-history/' + route.id)
       .then(function(r) { return r.json(); })
       .then(function(detail) { Design.openTravelDetail(detail); });

   @param {TravelRoute} route
════════════════════════════════════════════════════════════════ */
Design.openTravelDetail = function (route) {
  var meta = travelSafetyMeta(route.safetyScore);

  // Header
  var titleEl = document.getElementById('sheet-title');
  if (titleEl) titleEl.textContent = route.origin + ' → ' + route.destination;

  // Primary info
  var routeTitle = document.getElementById('sheet-route-title');
  var modeText   = document.getElementById('sheet-mode-text');
  if (routeTitle) routeTitle.textContent = route.origin + ' → ' + route.destination;
  if (modeText)   modeText.textContent   = 'via ' + route.modes;

  // Quick glance
  var fareEl = document.getElementById('sheet-fare');
  var timeEl = document.getElementById('sheet-time');
  var dateEl = document.getElementById('sheet-date');
  if (fareEl) fareEl.textContent = '₱' + route.fare;
  if (timeEl) timeEl.textContent = route.minutes + ' min';
  if (dateEl) dateEl.textContent = route.date;

  // Safety deep-dive
  var safetyEl = document.getElementById('sheet-safety');
  var scoreEl  = document.getElementById('sheet-safety-score');
  var badgeEl  = document.getElementById('sheet-safety-badge');
  var noteEl   = document.getElementById('sheet-safety-text');
  if (safetyEl) { safetyEl.style.background = meta.bg; safetyEl.style.borderColor = meta.color; }
  if (scoreEl)  { scoreEl.textContent = route.safetyScore + '%'; scoreEl.style.color = meta.color; }
  if (badgeEl)  { badgeEl.textContent = meta.label; badgeEl.style.color = meta.color; }
  if (noteEl)     noteEl.textContent = route.safetyNote;

  // Map area tint
  var mapArea = document.getElementById('sheet-map-area');
  if (mapArea) mapArea.style.background = meta.bg;
  mapArea.innerHTML = '<img src="https://static-maps.yandex.ru/1.x/?lang=en-US&ll=121.058,14.653&z=14&l=map&size=390,130" style="width:100%;height:100%;object-fit:cover;opacity:0.85;" /><div class="sheet-map-gradient"></div>';

  // Steps breakdown
  var stepsList = document.getElementById('sheet-steps-list');
  if (stepsList) {
    stepsList.innerHTML = (route.steps || []).map(function (step) {
      return '<div class="sheet-step">'
        + '<div class="sheet-step-dot">'
        +   '<svg class="icon-svg" width="14" height="14" viewBox="0 0 24 24">' + step.icon + '</svg>'
        + '</div>'
        + '<div>'
        +   '<div class="sheet-step-name">' + step.name + '</div>'
        +   '<div class="sheet-step-desc">' + step.desc + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  // Open the detail overlay (inside th-page)
  var overlay = document.getElementById('th-detail-overlay');
  var sheet   = document.getElementById('th-detail-sheet');
  var body    = sheet && sheet.querySelector('.sheet-body');
  if (overlay) overlay.classList.add('open');
  if (body)    body.scrollTop = 0;

  // Swipe-down to close (init once)
  if (sheet && !sheet._swipeReady) {
    sheet._swipeReady = true;
    var startY = 0;
    sheet.addEventListener('touchstart', function (e) {
      startY = e.touches[0].clientY;
    }, { passive: true });
    sheet.addEventListener('touchend', function (e) {
      if (e.changedTouches[0].clientY - startY > 80) closeTravelDetail();
    }, { passive: true });
  }
};

function closeTravelDetail() {
  var overlay = document.getElementById('th-detail-overlay');
  if (overlay) overlay.classList.remove('open');
}

/* Design.openTravelHistory() / Design.closeTravelHistory()
   Slides the full-page travel history panel in/out.
   Called by row-travel-history click in DOMContentLoaded. */
Design.openTravelHistory = function () {
  var page = document.getElementById('th-page');
  if (page) page.classList.add('open');
};

Design.closeTravelHistory = function () {
  var page = document.getElementById('th-page');
  if (page) page.classList.remove('open');
  // Also close detail sheet if open
  closeTravelDetail();
};