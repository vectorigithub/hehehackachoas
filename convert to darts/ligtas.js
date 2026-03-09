/**
 * ligtas.js  —  SINGLE JS FILE
 *
 * Load order in ligtas.html  (no defer on this file — theme runs before paint):
 *   <link rel="stylesheet" href="ligtas.css" />
 *   <script src="ligtas.js"></script>   ← this file, in <head>
 *
 * Sections:
 *   1.  Theme engine     — applyTheme / toggleTheme / initTheme / getTheme
 *   2.  Page navigation  — showPage / goProfile / goMap
 *   3.  Mock data        — MOCK_USER  (swap for real API fetch)
 *   4.  Toast helper     — showToast
 *   5.  Coming Soon      — showComingSoon / hideComingSoon
 *   6.  Trust Rank SVGs  — svgMap + getReputation
 *   7.  Map page logic   — setMode / toggleLigtas / toggleScoreExplain
 *                          toggleComm / toggleChip / selectRoute
 *                          mapNavBtn / openNotif / closeNotif / markRead / setNTab
 *   8.  Profile page     — renderProfile / toggleSwitch
 *   9.  DOM wiring       — DOMContentLoaded wires up all event listeners
 *  10.  Auto-init        — initTheme() runs immediately (before first paint)
 *
 * Exposes:  window.Design  (public API for backend integration)
 */

(function (global) {
  'use strict';


  /* ══════════════════════════════════════════════════════════
     1. THEME ENGINE
     Mirrors color tokens in ligtas.css.
     applyTheme() sets data-theme on <html> AND injects every
     CSS var inline so both CSS and JS always agree.
  ══════════════════════════════════════════════════════════ */

  var THEMES = {
    light: {
      '--bg':           '#f0f4f8',
      '--bg2':          '#e4edf5',
      '--card':         '#ffffff',
      '--card2':        '#f5f8fb',
      '--header-blur':  'rgba(255,255,255,0.88)',
      '--border':       '#e0e8f0',
      '--border2':      '#c8d8e8',
      '--divider':      '#eef2f7',
      '--text':         '#0f1f35',
      '--text2':        '#7a94ad',
      '--text3':        '#a0b4c8',
      '--teal':         '#0d9e9e',
      '--teal-light':   '#0fb9b9',
      '--teal-dim':     'rgba(13,158,158,0.10)',
      '--teal-glow':    'rgba(13,158,158,0.30)',
      '--green':        '#34d399',
      '--green-dim':    'rgba(52,211,153,0.12)',
      '--red':          '#f43f5e',
      '--red-dim':      'rgba(244,63,94,0.10)',
      '--yellow':       '#facc15',
      '--yellow-dim':   'rgba(250,204,21,0.12)',
      '--blue':         '#3b9eff',
      '--blue-dim':     'rgba(59,158,255,0.12)',
      '--orange':       '#f97316',
      '--orange-dim':   'rgba(249,115,22,0.12)',
      '--icon-bg':      '#eef4fb',
      '--toggle-off':   '#d0dce8',
      '--map-img-filter':   'saturate(0.85) brightness(1.08)',
      '--search-glass':     'rgba(255,255,255,0.92)',
      '--modetoggle-glass': 'rgba(240,244,248,0.90)',
      '--legend-glass':     'rgba(240,244,248,0.92)',
      '--notif-sheet-bg':   '#f0f4f8',
      '--nav-glass':        'rgba(255,255,255,0.97)',
      '--panel-top-bg':     '#ffffff',
    },
    dark: {
      '--bg':           '#0b1120',
      '--bg2':          '#060d1a',
      '--card':         '#111c2e',
      '--card2':        '#162030',
      '--header-blur':  'rgba(11,17,32,0.88)',
      '--border':       '#1e3a5f',
      '--border2':      '#1a2d47',
      '--divider':      '#1a2d47',
      '--text':         '#e8f0f8',
      '--text2':        '#6b8aad',
      '--text3':        '#4a6080',
      '--teal':         '#12d9c0',
      '--teal-light':   '#1aefcf',
      '--teal-dim':     'rgba(18,217,192,0.10)',
      '--teal-glow':    'rgba(18,217,192,0.25)',
      '--green':        '#34d399',
      '--green-dim':    'rgba(52,211,153,0.12)',
      '--red':          '#fb7185',
      '--red-dim':      'rgba(251,113,133,0.12)',
      '--yellow':       '#fde047',
      '--yellow-dim':   'rgba(253,224,71,0.12)',
      '--blue':         '#60aeff',
      '--blue-dim':     'rgba(96,174,255,0.12)',
      '--orange':       '#fb923c',
      '--orange-dim':   'rgba(251,146,60,0.12)',
      '--icon-bg':      '#1a2d47',
      '--toggle-off':   '#2a3d56',
      '--map-img-filter':   'saturate(1.2) hue-rotate(320deg) brightness(0.85) sepia(0.4)',
      '--search-glass':     'rgba(10,14,26,0.88)',
      '--modetoggle-glass': 'rgba(7,30,36,0.85)',
      '--legend-glass':     'rgba(7,30,36,0.88)',
      '--notif-sheet-bg':   '#0d1220',
      '--nav-glass':        'rgba(7,30,36,0.97)',
      '--panel-top-bg':     '#111c2e',
    },
  };

  var THEME_KEY = 'ligtas_theme';

  /**
   * Applies a named theme to the whole app.
   * Sets data-theme on <html> + injects all CSS vars + persists.
   * @param {'light'|'dark'} name
   */
  function applyTheme(name) {
    var tokens = THEMES[name];
    if (!tokens) { console.warn('[Ligtas] Unknown theme:', name); return; }

    // 1. data-theme attribute drives [data-theme="..."] selectors in ligtas.css
    document.documentElement.setAttribute('data-theme', name);

    // 2. Inject every token as a CSS custom property on :root
    var root = document.documentElement;
    Object.keys(tokens).forEach(function (v) {
      root.style.setProperty(v, tokens[v]);
    });

    // 3. Persist across pages
    try { localStorage.setItem(THEME_KEY, name); } catch (e) {}

    // 4. Sync the Night Mode toggle on the profile page (if rendered)
    var nightToggle = document.getElementById('toggle-night');
    if (nightToggle) nightToggle.classList.toggle('on', name === 'dark');

    // 5. Notify any listeners (e.g. map tile swap)
    window.dispatchEvent(new Event('themeChanged'));
  }

  /**
   * Reads saved theme from localStorage and applies it.
   * Called immediately (before DOM) — prevents flash of wrong theme.
   * @returns {'light'|'dark'}
   */
  function initTheme() {
    var saved = 'light';
    try { saved = localStorage.getItem(THEME_KEY) || 'light'; } catch (e) {}
    applyTheme(saved);
    return saved;
  }

  /** Flips between light and dark. */
  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    showToast(next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled', 'teal');
    return next;
  }

  /** @returns {'light'|'dark'} */
  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }


  /* ══════════════════════════════════════════════════════════
     2. PAGE NAVIGATION
     Two pages live in the same HTML file (#pg-map, #pg-profile).
     .page is hidden by default; .page.active is shown.
  ══════════════════════════════════════════════════════════ */

  function showPage(id) {
    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.remove('active');
    });
    var pg = document.getElementById(id);
    if (pg) pg.classList.add('active');
  }

  function goProfile() {
    // Mark profile nav button active on map page
    document.querySelectorAll('.map-nav-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    var profileBtn = document.querySelector('.map-nav-btn[data-nav="profile"]');
    if (profileBtn) profileBtn.classList.add('active');
    showPage('pg-profile');
  }

  function goMap() {
    showPage('pg-map');
  }


  /* ══════════════════════════════════════════════════════════
     3. MOCK DATA
     BACKEND: Replace MOCK_USER with real fetch('/api/user/current')
     then call Design.setUser(realUser) after it resolves.
  ══════════════════════════════════════════════════════════ */

  var MOCK_USER = {
    id:        'usr_mateo_001',
    name:      'Mateo Santos',
    username:  '@mateosantos',
    role:      'Student Commuter',
    location:  'Quezon City',
    avatarUrl: 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png',
    stats: {
      trips:          246,
      reports:        12,
      upvotedReports: 55,   // drives trust rank tier
    },
    commuterType: 'student',
    preferences: {
      aiSafety:  true,
      nightMode: false,
      transport: ['jeep', 'walk'],
    },
  };

  var _user = MOCK_USER;

  /** Call after real API fetch resolves. @param {object} u */
  function setUser(u) { _user = Object.assign({}, _user, u); }

  /** @returns {object} current user */
  function getUser() { return _user; }


  /* ══════════════════════════════════════════════════════════
     4. TOAST HELPER
     Requires inside .phone:
       <div class="toast" id="ligtas-toast" role="status" aria-live="polite">
         <span class="toast-dot teal" id="toast-dot"></span>
         <span id="toast-msg">Saved</span>
       </div>
  ══════════════════════════════════════════════════════════ */

  var _toastTimer = null;

  /**
   * @param {string} message
   * @param {'teal'|'green'|'red'} type
   */
  function showToast(message, type) {
    var toast = document.getElementById('ligtas-toast');
    var dot   = document.getElementById('toast-dot');
    var msg   = document.getElementById('toast-msg');
    if (!toast) return;
    type = type || 'teal';
    dot.className   = 'toast-dot ' + type;
    msg.textContent = message;
    toast.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }


  /* ══════════════════════════════════════════════════════════
     5. COMING SOON OVERLAY
     Requires #coming-overlay in page HTML.
  ══════════════════════════════════════════════════════════ */

  function showComingSoon() {
    var el = document.getElementById('coming-overlay');
    if (el) el.classList.add('open');
  }

  function hideComingSoon() {
    var el = document.getElementById('coming-overlay');
    if (el) el.classList.remove('open');
  }


  /* ══════════════════════════════════════════════════════════
     6. TRUST RANK
     Tiers: Candle (0-9 upvotes) | Lantern (10-49) | Lighthouse (50+)
     SVG icons rendered inline on the profile stat box.
  ══════════════════════════════════════════════════════════ */

  var svgMap = {
    Candle:
      '<svg width="30" height="30" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">'
      + '<ellipse cx="32" cy="10" rx="4" ry="6" fill="#f0b429"/>'
      + '<ellipse cx="32" cy="12" rx="2.5" ry="3.5" fill="#e87e3e"/>'
      + '<rect x="26" y="18" width="12" height="28" rx="3" fill="#e8f4f5" stroke="#0d9e9e" stroke-width="2"/>'
      + '<line x1="32" y1="14" x2="32" y2="18" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>'
      + '<rect x="22" y="46" width="20" height="6" rx="3" fill="#0d9e9e" opacity="0.7"/>'
      + '</svg>',

    Lantern:
      '<svg width="30" height="30" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">'
      + '<path d="M22 16 L32 8 L42 16 Z" fill="#e05252"/>'
      + '<rect x="22" y="15" width="20" height="3" rx="1.5" fill="#c0342c"/>'
      + '<rect x="23" y="18" width="18" height="22" rx="3" fill="#fef9c3" stroke="#e87e3e" stroke-width="2"/>'
      + '<ellipse cx="32" cy="26" rx="4" ry="5" fill="#f0b429" opacity="0.85"/>'
      + '<ellipse cx="32" cy="28" rx="2.5" ry="3" fill="#e87e3e" opacity="0.7"/>'
      + '<rect x="22" y="40" width="20" height="4" rx="2" fill="#e87e3e"/>'
      + '<rect x="26" y="44" width="12" height="4" rx="2" fill="#666"/>'
      + '</svg>',

    Lighthouse:
      '<svg width="30" height="30" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">'
      + '<polygon points="2,22 18,26 18,30" fill="#f0b429" opacity="0.85"/>'
      + '<polygon points="62,22 46,26 46,30" fill="#f0b429" opacity="0.85"/>'
      + '<polygon points="32,4 44,16 20,16" fill="#e05252"/>'
      + '<rect x="26" y="16" width="12" height="8" rx="1" fill="#e8f4f5" stroke="#1a1a2e" stroke-width="1.5"/>'
      + '<rect x="28" y="17" width="8" height="6" rx="1" fill="#fef9c3"/>'
      + '<rect x="24" y="24" width="16" height="4" rx="1" fill="#e05252"/>'
      + '<path d="M25 28 L23 40 L41 40 L39 28 Z" fill="#e8f4f5" stroke="#1a1a2e" stroke-width="1.5"/>'
      + '<path d="M23 44 L21 56 L43 56 L41 44 Z" fill="#e8f4f5" stroke="#1a1a2e" stroke-width="1.5"/>'
      + '<rect x="18" y="56" width="28" height="4" rx="2" fill="#7ab3bb"/>'
      + '</svg>',
  };

  /**
   * Returns reputation tier object from upvote count.
   * BACKEND: upvotedReports = SELECT COUNT(*) FROM report_votes WHERE user_id=:id AND vote='up'
   * @param {number} upvotedReports
   * @returns {{ label, tier, color }}
   */
  function getReputation(upvotedReports) {
    if (upvotedReports >= 50) return { label: 'Lighthouse', tier: 3, color: '#facc15' };
    if (upvotedReports >= 10) return { label: 'Lantern',    tier: 2, color: '#3b9eff' };
    return                           { label: 'Candle',     tier: 1, color: '#34d399' };
  }


  /* ══════════════════════════════════════════════════════════
     7. MAP PAGE LOGIC
  ══════════════════════════════════════════════════════════ */

  var _currentMode = 'explore';

  /** Switches between Explore and Safety panels. */
  function setMode(mode) {
    _currentMode = mode;
    var exploreBtn   = document.getElementById('btn-explore');
    var safetyBtn    = document.getElementById('btn-safety');
    var explorePanel = document.getElementById('explore-panel');
    var safetyPanel  = document.getElementById('safety-panel');
    var legend       = document.getElementById('safety-legend');
    var routeSvg     = document.getElementById('route-svg');
    var floodMarker  = document.getElementById('flood-marker');

    if (mode === 'explore') {
      exploreBtn.classList.add('active');
      safetyBtn.classList.remove('active');
      explorePanel.classList.remove('hidden');
      safetyPanel.classList.add('hidden');
      if (legend)      legend.style.display = 'none';
      if (routeSvg)    routeSvg.style.opacity = '1';
      if (floodMarker) floodMarker.style.display = 'none';
    } else {
      safetyBtn.classList.add('active');
      exploreBtn.classList.remove('active');
      safetyPanel.classList.remove('hidden');
      explorePanel.classList.add('hidden');
      if (legend)      legend.style.display = 'block';
      if (routeSvg)    routeSvg.style.opacity = '0';
      if (floodMarker) floodMarker.style.display = 'flex';
    }
  }

  /** Toggles Ligtas Mode on/off (the ping-dot row in Safety panel). */
  function toggleLigtas() {
    var track   = document.getElementById('toggle-track');
    var row     = document.getElementById('ligtas-row');
    var pingDot = document.getElementById('ping-dot');
    var label   = document.getElementById('ligtas-label');
    var sub     = document.getElementById('ligtas-sub');
    if (!track) return;
    var isOn = !track.classList.contains('off');
    if (isOn) {
      track.classList.add('off');
      row.classList.add('off');
      pingDot.classList.add('off');
      label.textContent = 'Ligtas Mode Inactive';
      sub.textContent   = 'Not contributing safety data';
    } else {
      track.classList.remove('off');
      row.classList.remove('off');
      pingDot.classList.remove('off');
      label.textContent = 'Ligtas Mode Active';
      sub.textContent   = 'Contributing live safety data · Quezon City';
    }
  }

  /** Expands / collapses the Safety Score breakdown panel. */
  function toggleScoreExplain() {
    var panel   = document.getElementById('score-explain');
    var chevron = document.getElementById('score-chevron');
    if (!panel) return;
    var isOpen = panel.classList.contains('open');
    panel.classList.toggle('open');
    if (chevron) chevron.textContent = isOpen ? 'expand_more' : 'expand_less';
  }

  /** Commuter strip — single-select. */
  function toggleComm(el) {
    document.querySelectorAll('.comm-chip').forEach(function (c) {
      // strip all active-* classes
      c.className = 'comm-chip';
    });
    var color = el.dataset.color || 'teal';
    el.classList.add('active-' + color);
  }

  /** Transport / overlay chips — multi-toggle. */
  function toggleChip(el) {
    var color = el.dataset.color || 'teal';
    if (el.classList.contains('chip-inactive')) {
      el.classList.remove('chip-inactive');
      el.classList.add('chip-' + color);
    } else {
      el.classList.remove('chip-' + color);
      el.classList.add('chip-inactive');
    }
  }

  /** Route card — single-select. */
  function selectRoute(el) {
    document.querySelectorAll('.route-card').forEach(function (c) {
      c.classList.remove('selected');
    });
    el.classList.add('selected');
  }

  /** Map bottom nav tab switching. */
  function mapNavBtn(el) {
    document.querySelectorAll('.map-nav-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    el.classList.add('active');
  }

  /* Notifications */
  var _unreadCount = 3;

  function openNotif() {
    var backdrop = document.getElementById('notif-backdrop');
    var sheet    = document.getElementById('notif-sheet');
    if (backdrop) backdrop.classList.add('open');
    if (sheet)    sheet.classList.add('open');
  }

  function closeNotif() {
    var backdrop = document.getElementById('notif-backdrop');
    var sheet    = document.getElementById('notif-sheet');
    if (backdrop) backdrop.classList.remove('open');
    if (sheet)    sheet.classList.remove('open');
  }

  function markRead(item) {
    if (!item.classList.contains('unread')) return;
    item.classList.remove('unread');
    var dot = item.querySelector('.unread-dot');
    if (dot) { dot.style.opacity = '0'; setTimeout(function () { dot.remove(); }, 300); }
    item.style.borderLeftColor = 'transparent';
    _unreadCount = Math.max(0, _unreadCount - 1);
    if (_unreadCount === 0) {
      var nd = document.getElementById('notif-dot');
      if (nd) nd.style.opacity = '0';
    }
  }

  function setNTab(el) {
    document.querySelectorAll('.ntab').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
  }


  /* ══════════════════════════════════════════════════════════
     8. PROFILE PAGE LOGIC
  ══════════════════════════════════════════════════════════ */

  /**
   * Populates the profile page from a user object.
   * BACKEND: swap mock call for real fetch — see DOMContentLoaded below.
   * @param {object} user
   */
  function renderProfile(user) {
    var avatar = document.getElementById('main-avatar');
    if (avatar && user.avatarUrl) avatar.src = user.avatarUrl;

    var nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = user.name || '';

    var roleEl = document.getElementById('user-commuter-type');
    if (roleEl) roleEl.textContent = (user.role || 'Commuter') + ' · ' + (user.location || '');

    var tripsEl   = document.getElementById('stat-trips');
    var reportsEl = document.getElementById('stat-reports');
    if (tripsEl)   tripsEl.textContent   = user.stats && user.stats.trips   != null ? user.stats.trips   : '--';
    if (reportsEl) reportsEl.textContent = user.stats && user.stats.reports != null ? user.stats.reports : '--';

    // Trust rank
    var upvotes  = (user.stats && user.stats.upvotedReports) || 0;
    var rep      = getReputation(upvotes);
    var iconEl   = document.getElementById('trust-icon');
    var rankText = document.getElementById('trust-rank-text');
    if (iconEl)   iconEl.innerHTML      = svgMap[rep.label] || '';
    if (rankText) rankText.textContent  = rep.label;

    // Sync toggle states
    if (user.preferences) {
      var aiToggle = document.getElementById('toggle-ai');
      if (aiToggle) aiToggle.classList.toggle('on', !!user.preferences.aiSafety);
    }

    // Pre-fill edit modal
    var editName     = document.getElementById('edit-name');
    var editUsername = document.getElementById('edit-username');
    if (editName)     editName.value     = user.name     || '';
    if (editUsername) editUsername.value = user.username || '';
  }

  /**
   * Toggles a switch by element id, handling Night Mode side-effect.
   * @param {string} id
   * @returns {boolean} new state
   */
  function toggleSwitch(id) {
    var btn = document.getElementById(id);
    if (!btn) return false;
    var isOn = btn.classList.toggle('on');
    if (id === 'toggle-night') {
      applyTheme(isOn ? 'dark' : 'light');
    }
    return isOn;
  }


  /* ══════════════════════════════════════════════════════════
     9. DOM WIRING  — runs after DOM is ready
  ══════════════════════════════════════════════════════════ */

  document.addEventListener('DOMContentLoaded', function () {

    /* ── init map mode ── */
    setMode('explore');

    /* ── sync night toggle to saved theme ── */
    var nightToggle = document.getElementById('toggle-night');
    if (nightToggle) nightToggle.classList.toggle('on', getTheme() === 'dark');

    /* ── render profile data ──
       BACKEND: replace with:
         fetch('/api/user/current')
           .then(function(r) { return r.json(); })
           .then(function(user) { setUser(user); renderProfile(user); })
           .catch(function() { renderProfile(getUser()); });
    */
    renderProfile(getUser());

    /* ── AI Safety toggle ── */
    var toggleAi = document.getElementById('toggle-ai');
    if (toggleAi) {
      toggleAi.addEventListener('click', function () {
        var isOn = toggleSwitch('toggle-ai');
        // BACKEND: PATCH /api/user/current/preferences { aiSafety: isOn }
        showToast(isOn ? 'AI Safety enabled' : 'AI Safety disabled', 'teal');
      });
    }

    /* ── Night Mode toggle (profile page) ── */
    if (nightToggle) {
      nightToggle.addEventListener('click', function () {
        var isOn = toggleSwitch('toggle-night');
        // BACKEND: PATCH /api/user/current/preferences { nightMode: isOn }
        showToast(isOn ? 'Dark mode on' : 'Light mode on', 'teal');
      });
    }

    /* ── Coming Soon rows ── */
    ['row-offline-maps', 'row-travel-history', 'row-notifications', 'row-account-settings']
      .forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', showComingSoon);
      });

    /* ── Coming Soon dismiss ── */
    var dismissBtn = document.getElementById('coming-dismiss');
    var overlay    = document.getElementById('coming-overlay');
    if (dismissBtn) dismissBtn.addEventListener('click', hideComingSoon);
    if (overlay)    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hideComingSoon();
    });

    /* ── Log Out ── */
    var logoutRow = document.getElementById('row-logout');
    if (logoutRow) logoutRow.addEventListener('click', function () {
      // BACKEND: fetch('/api/auth/logout',{method:'POST'}).then(function(){window.location.href='/login.html';});
      showToast('Logged out', 'red');
    });

    /* ── Edit Profile modal ── */
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
      var u = getUser();
      var ni = document.getElementById('edit-name');
      var ui = document.getElementById('edit-username');
      if (ni) ni.value = u.name     || '';
      if (ui) ui.value = u.username || '';
      if (mainAvatar && modalAvatar) modalAvatar.src = mainAvatar.src;
      modal.classList.add('open');
    }

    function closeModal() { if (modal) modal.classList.remove('open'); }

    if (openBtn)  openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal)    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    /* avatar picker */
    if (avatarTrigger && avatarInput) {
      avatarTrigger.addEventListener('click', function () { avatarInput.click(); });
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

    /* save profile */
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var ni  = document.getElementById('edit-name');
        var sel = document.getElementById('edit-commuter');
        var name         = (ni  ? ni.value.trim()                            : '') || getUser().name;
        var commuterType = (sel ? sel.options[sel.selectedIndex].text + ' Commuter' : getUser().role);

        var nameEl = document.getElementById('user-name');
        var roleEl = document.getElementById('user-commuter-type');
        if (nameEl) nameEl.textContent = name;
        if (roleEl) roleEl.textContent = commuterType + ' · ' + (getUser().location || '');
        if (mainAvatar && modalAvatar) mainAvatar.src = modalAvatar.src;

        setUser({ name: name, role: commuterType });
        // BACKEND: PATCH /api/user/current { name, role }

        showToast('Profile saved!', 'green');
        saveBtn.textContent      = 'Saved ✓';
        saveBtn.style.background = 'var(--green)';
        setTimeout(function () {
          saveBtn.textContent      = 'Save Changes';
          saveBtn.style.background = '';
          closeModal();
        }, 1200);
      });
    }

    /* Escape closes modal */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

  }); // end DOMContentLoaded


  /* ══════════════════════════════════════════════════════════
     10. AUTO-INIT — runs immediately (file has no defer)
     Theme is applied before the first paint → no flash.
  ══════════════════════════════════════════════════════════ */
  initTheme();


  /* ══════════════════════════════════════════════════════════
     PUBLIC API  — window.Design
     Everything backend devs and page scripts need.
  ══════════════════════════════════════════════════════════ */
  var Design = {
    // Theme
    THEMES:       THEMES,
    applyTheme:   applyTheme,
    toggleTheme:  toggleTheme,
    initTheme:    initTheme,
    getTheme:     getTheme,

    // User data
    MOCK_USER:    MOCK_USER,
    setUser:      setUser,
    getUser:      getUser,

    // Reputation
    getReputation: getReputation,
    svgMap:        svgMap,

    // UI helpers
    showToast:      showToast,
    showComingSoon: showComingSoon,
    hideComingSoon: hideComingSoon,

    // Page nav
    showPage:   showPage,
    goProfile:  goProfile,
    goMap:      goMap,

    // Map page
    setMode:            setMode,
    toggleLigtas:       toggleLigtas,
    toggleScoreExplain: toggleScoreExplain,
    toggleComm:         toggleComm,
    toggleChip:         toggleChip,
    selectRoute:        selectRoute,
    mapNavBtn:          mapNavBtn,
    openNotif:          openNotif,
    closeNotif:         closeNotif,
    markRead:           markRead,
    setNTab:            setNTab,

    // Profile page
    renderProfile: renderProfile,
    toggleSwitch:  toggleSwitch,
  };

  global.Design = Design;

  // Expose map functions on window for inline onclick="" handlers
  global.setMode            = setMode;
  global.toggleLigtas       = toggleLigtas;
  global.toggleScoreExplain = toggleScoreExplain;
  global.toggleComm         = toggleComm;
  global.toggleChip         = toggleChip;
  global.selectRoute        = selectRoute;
  global.mapNavBtn          = mapNavBtn;
  global.openNotif          = openNotif;
  global.closeNotif         = closeNotif;
  global.markRead           = markRead;
  global.setNTab            = setNTab;
  global.goProfile          = goProfile;
  global.goMap              = goMap;

/* ══════════════════════════════════════════════════════════
   SWIPE PANEL — drag the panel down to expand map
══════════════════════════════════════════════════════════ */
(function() {
  var handleWrap    = document.querySelector('.panel-handle-wrap');
  var commuterStrip = document.querySelector('.commuter-strip');
  var mapArea       = document.querySelector('.map-area');
  var isExpanded    = false;
  var startY        = 0;
  var normalHeight  = '260px';
  var expandedHeight= '420px';

  function expandMap() {
    isExpanded = true;
    mapArea.style.transition          = 'height 0.35s cubic-bezier(0.4,0,0.2,1)';
    mapArea.style.height              = expandedHeight;
    commuterStrip.style.transition    = 'opacity 0.2s, max-height 0.35s, padding 0.35s';
    commuterStrip.style.opacity       = '0';
    commuterStrip.style.maxHeight     = '0';
    commuterStrip.style.padding       = '0 14px';
    commuterStrip.style.pointerEvents = 'none';
  }

  function collapseMap() {
    isExpanded = false;
    mapArea.style.transition          = 'height 0.35s cubic-bezier(0.4,0,0.2,1)';
    mapArea.style.height              = normalHeight;
    commuterStrip.style.transition    = 'opacity 0.25s 0.15s, max-height 0.35s, padding 0.35s';
    commuterStrip.style.opacity       = '1';
    commuterStrip.style.maxHeight     = '60px';
    commuterStrip.style.padding       = '12px 14px';
    commuterStrip.style.pointerEvents = 'auto';
  }

  if (!handleWrap) return;

  // Make handle area bigger and more obvious
  handleWrap.style.cursor  = 'grab';
  handleWrap.style.padding = '16px 0';

  // Touch (mobile)
  handleWrap.addEventListener('touchstart', function(e) {
    startY = e.touches[0].clientY;
  }, { passive: true });

  handleWrap.addEventListener('touchend', function(e) {
    var endY  = e.changedTouches[0].clientY;
    var delta = endY - startY;
    if (delta > 20 && !isExpanded) expandMap();
    else if (delta < -20 && isExpanded) collapseMap();
    else if (Math.abs(delta) < 10) {
      // treat as tap
      if (isExpanded) collapseMap(); else expandMap();
    }
  }, { passive: true });

  // Mouse (desktop/preview)
  handleWrap.addEventListener('mousedown', function(e) {
    startY = e.clientY;
    handleWrap.style.cursor = 'grabbing';
  });

  window.addEventListener('mouseup', function(e) {
    if (startY === 0) return;
    var delta = e.clientY - startY;
    handleWrap.style.cursor = 'grab';
    if (delta > 20 && !isExpanded) expandMap();
    else if (delta < -20 && isExpanded) collapseMap();
    else if (Math.abs(delta) < 10) {
      if (isExpanded) collapseMap(); else expandMap();
    }
    startY = 0;
  });
}());

}(window));
