/**Exposes: window.Design
 *
 * WHAT LIVES HERE
 *   1. Color palette tokens (mirrors main.css)
 *   2. Dark mode — persists across ALL pages via localStorage
 *   3. Bottom nav rendering + active-tab management
 *   4. Toast notification helper
 *   5. Reputation tier logic
 *   6. Mock data (replace with real API calls — marked BACKEND:)
 *   7. Coming Soon popup
 *   8. Time helpers
 *
 * LOAD ORDER ON EVERY PAGE
 *   <link rel="stylesheet" href="main.css" />   ← 1. styles
 *   <script src="main.js"></script>            ← 2. this file (in <head>, no defer)
 *   <script src="[page].js" defer></script>      ← 3. page logic
 *
 * BACKEND INTEGRATION
 *   Search for  // ── BACKEND:  to find every swap point.
 */

(function (global) {
  'use strict';

  /*color tokens:
  Mirrors :root / [data-theme="dark"] in main.css.
     applyTheme() injects these as CSS vars so JS can drive
     dark-mode switches without a page reload.*/
  var THEMES = {
    light: {
      '--bg':           '#f0f4f8',
      '--card':         '#ffffff',
      '--card2':        '#f5f8fb',
      '--header-blur':  'rgba(255,255,255,0.85)',
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
      '--icon-bg':      '#eef4fb',
      '--toggle-off':   '#d0dce8',
    },
    dark: {
      '--bg':           '#0b1120',
      '--card':         '#111c2e',
      '--card2':        '#162030',
      '--header-blur':  'rgba(11,17,32,0.85)',
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
      '--icon-bg':      '#1a2d47',
      '--toggle-off':   '#2a3d56',
    },
  };


  /*theme consistent
  localStorage key: 'ligtas_theme'  →  'light' | 'dark'
     main.js loads in <head> (no defer) so the theme is applied
     before the first paint — no flash of wrong theme. */
  var THEME_KEY = 'ligtas_theme';

  /**
   * Applies a theme to the entire page.
   * Sets data-theme on <html> and injects every CSS var.
   * @param {'light'|'dark'} themeName
   */
  function applyTheme(themeName) {
    var t = THEMES[themeName];
    if (!t) { console.warn('[Design] Unknown theme:', themeName); return; }

    // 1. data-theme attribute drives CSS selectors in main.css
    document.documentElement.setAttribute('data-theme', themeName);

    // 2. Inject every token as a CSS custom property
    var root = document.documentElement;
    Object.keys(t).forEach(function (cssVar) {
      root.style.setProperty(cssVar, t[cssVar]);
    });

    // 3. Persist so all pages open in the same theme
    try { localStorage.setItem(THEME_KEY, themeName); } catch (e) {}

    // 4. Notify map tile switcher (and any other listeners)
    window.dispatchEvent(new Event('themeChanged'));
  }

  /**
   * Reads saved theme and applies it. Falls back to 'light'.
   * Called automatically on script load.
   * @returns {'light'|'dark'}
   */
  function initTheme() {
    var saved = 'light';
    try { saved = localStorage.getItem(THEME_KEY) || 'light'; } catch (e) {}
    applyTheme(saved);
    return saved;
  }

  /** Flips between light and dark. @returns {'light'|'dark'} */
  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    if (typeof Design !== 'undefined' && Design.showToast) {
      Design.showToast(next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled', 'teal');
    }
    return next;
  }

  /** Returns the current theme name. @returns {'light'|'dark'} */
  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }


  /* nav:
  BACKEND: Update `route` values to match your real URL paths.*/
  var NAV_ITEMS = [
    {
      id:    'home',
      label: 'HOME',
      route: '../../../stitch2/explore_mode_map_1/explore.html',        // ── BACKEND: update to your home route
      icon:  '<polygon points="3 11 12 2 21 11 21 22 15 22 15 15 9 15 9 22 3 22"/>',
    },
    {
      id:    'ligtas',
      label: 'LIGTAS',
      route: '.html',       // ── BACKEND: update to your safe-route page
      icon:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    },
    {
      id:    'community',
      label: 'COMMUNITY',
      route: '.html',    // ── BACKEND: update to your community page
      icon:  '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    },
    {
      id:    'profile',
      label: 'PROFILE',
      route: '../../../stitch3/user_profile_and_settings/profile.html',      // ── BACKEND: update to your profile page
      icon:  '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    },
  ];

  var Nav = {
    /**
     * Renders the bottom nav into #bottom-nav.
     * @param {string} activeId — 'home' | 'ligtas' | 'community' | 'profile'
     *
     * Usage on every page:
     *   Design.Nav.render('profile');
     */
    render: function (activeId) {
      var el = document.getElementById('bottom-nav');
      if (!el) return;
      el.innerHTML = NAV_ITEMS.map(function (item) {
        return '<button class="nav-btn' + (item.id === activeId ? ' active' : '') + '"'
          + ' aria-label="' + item.label + '"'
          + ' onclick="window.location.href=\'' + item.route + '\'">'
          + '<svg class="icon-svg" width="20" height="20" viewBox="0 0 24 24">' + item.icon + '</svg>'
          + '<span class="nav-label">' + item.label + '</span>'
          + '</button>';
      }).join('');
    },

    /** Updates active state without re-rendering. */
    setActive: function (activeId) {
      document.querySelectorAll('.nav-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('aria-label') === activeId.toUpperCase());
      });
    },
  };


  /* trust rank:
  BACKEND: Compute upvotedReports server-side:
       SELECT COUNT(*) FROM report_votes WHERE user_id = :id AND vote = 'up'
     Pass the result into Design.getReputation(n).*/
  function getReputation(upvotedReports) {
    if (upvotedReports >= 50) return {
      label: 'Lighthouse', tier: 3, minUpvotes: 50, color: '#facc15',
      icon: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>',
    };
    if (upvotedReports >= 10) return {
      label: 'Lantern', tier: 2, minUpvotes: 10, color: '#3b9eff',
      icon: '<path d="M9 2h6l1 7H8L9 2z"/><path d="M8 9c0 0-2 2-2 5s2 6 2 6h8s2-3 2-6-2-5-2-5"/><line x1="10" y1="20" x2="10" y2="22"/><line x1="14" y1="20" x2="14" y2="22"/>',
    };
    return {
      label: 'Candle', tier: 1, minUpvotes: 0, color: '#34d399',
      icon: '<line x1="12" y1="2" x2="12" y2="6"/><path d="M12 8a4 4 0 0 1 4 4c0 4-4 8-4 8s-4-4-4-8a4 4 0 0 1 4-4z"/>',
    };
  }


  /* stats:
   BACKEND: Expose these fields on GET /api/user/:id*/
  var STATS_SCHEMA = {
    trips:          { type: 'number', description: 'Total safe routes taken' },
    reports:        { type: 'number', description: 'Total hazard reports submitted' },
    upvotedReports: { type: 'number', description: 'Total upvotes received — drives reputation tier' },
  };


  /*mock data
  BACKEND: Replace with real API responses.
     Call Design.setUser(realUser) after your fetch resolves.*/

  // mock user
  // BACKEND: GET /api/user/current
  // Content:
  //   id, name, username, role, location, avatarUrl
  //   stats: { trips, reports, upvotedReports }
  //   preferences: { aiSafety, nightMode }
  var MOCK_USER = {
    id:        'usr_mateo_001',
    name:      'Mateo Santos',
    username:  '@mateosantos',
    role:      'Verified Commuter',
    avatarUrl: 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png',
    stats: {
      trips:          246,
      reports:        12,
      upvotedReports: 55,
    },

    // survey
    // BACKEND: populated from GET /api/user/current after onboarding survey
    // commuterType — answer to "Who are you?" (one of: women, lgbtq, minor,
    //                student, elderly, disabled — or null if none apply)
    commuterType: 'student',

    preferences: {
      aiSafety:  true,
      nightMode: false,

      // BACKEND: array from survey, e.g. ['mrt', 'jeep'] or ['walk']
      transport: ['jeep', 'walk'],
    },
  };

  //mock feed 
  // BACKEND: GET /api/feed?limit=20
  var MOCK_FEED = [
    {
      id: 'feed_001', type: 'report',
      author: { name: 'Ana Reyes', avatarUrl: 'https://i.pravatar.cc/200?img=5', reputation: 'Lantern' },
      content: 'Flooded underpass near Tandang Sora. Depth around knee-level. Avoid C5 northbound.',
      location: 'Tandang Sora, QC',
      timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
      upvotes: 24, tags: ['flood', 'road'],
    },
    {
      id: 'feed_002', type: 'alert',
      author: { name: 'Rico Bautista', avatarUrl: 'https://i.pravatar.cc/200?img=8', reputation: 'Lighthouse' },
      content: 'Snatching incident reported near Commonwealth MRT station exit. Stay alert.',
      location: 'Commonwealth Ave, QC',
      timestamp: new Date(Date.now() - 38 * 60000).toISOString(),
      upvotes: 41, tags: ['crime', 'mrt'],
    },
    {
      id: 'feed_003', type: 'tip',
      author: { name: 'Leni Cruz', avatarUrl: 'https://i.pravatar.cc/200?img=9', reputation: 'Candle' },
      content: 'Alternative route: Cut through Batasan Hills via Constitution Hills road. Clear and well-lit.',
      location: 'Batasan Hills, QC',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      upvotes: 8, tags: ['route', 'safe'],
    },
  ];

  //mock alerts
  // BACKEND: GET /api/alerts/active
  var MOCK_ALERTS = [
    {
      id: 'alert_001', severity: 'high',
      title: 'Flash Flood Warning',
      description: 'PAGASA has issued a flash flood warning for low-lying areas in QC.',
      area: 'Quezon City',
      issuedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      id: 'alert_002', severity: 'medium',
      title: 'Road Closure',
      description: 'EDSA-Quezon Ave intersection closed for emergency repairs until 22:00.',
      area: 'EDSA, QC',
      issuedAt: new Date(Date.now() - 90 * 60000).toISOString(),
    },
  ];

  // Mutable user ref — updated by setUser() after real API fetch
  var _user = MOCK_USER;

  /**
   * Updates the global user object.
   * Call after your fetch('/api/user/current') resolves.
   * @param {object} userObj
   */
  function setUser(userObj) {
    _user = Object.assign({}, _user, userObj);
  }

  /** Returns the current user object. */
  function getUser() { return _user; }


  /* toast notification:
  equires in page HTML (inside .phone):
       <div class="toast" id="ligtas-toast" role="status" aria-live="polite">
         <span class="toast-dot teal" id="toast-dot"></span>
         <span id="toast-msg">Saved</span>
       </div>

     Usage: Design.showToast('Settings saved', 'teal')
     type:  'teal' | 'green' | 'red'*/
  var _toastTimer = null;

  function showToast(message, type) {
    var toast = document.getElementById('ligtas-toast');
    var dot   = document.getElementById('toast-dot');
    var msg   = document.getElementById('toast-msg');
    if (!toast) { console.warn('[Design] No #ligtas-toast element found.'); return; }
    type = type || 'teal';
    dot.className   = 'toast-dot ' + type;
    msg.textContent = message;
    toast.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }


  /* comingsoon popup:
  Requires #coming-overlay in the page.
     Usage: Design.showComingSoon()*/
  function showComingSoon() {
    var el = document.getElementById('coming-overlay');
    if (el) el.classList.add('open');
  }
  function hideComingSoon() {
    var el = document.getElementById('coming-overlay');
    if (el) el.classList.remove('open');
  }
  function initComingSoon() {
    var dismissBtn = document.getElementById('coming-dismiss');
    var overlay    = document.getElementById('coming-overlay');
    if (dismissBtn) dismissBtn.addEventListener('click', hideComingSoon);
    if (overlay)    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hideComingSoon();
    });
  }


  /* time*/
  function timeAgo(isoString) {
    var diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
    if (diff < 60)    return diff + 's ago';
    if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }


  /*auto-init:
  Runs immediately (main.js has no defer).
     Applies saved theme before first paint → no flash.*/

  // Apply theme immediately — main.js loads in <head> before body renders
  initTheme();

  // Wire DOM-dependent things after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initComingSoon();
      // Sync night-mode toggle on any page that has one
      var nightToggle = document.getElementById('toggle-night');
      if (nightToggle) nightToggle.classList.toggle('on', getTheme() === 'dark');
    });
  } else {
    // DOMContentLoaded already fired (shouldn't happen since we're in <head>)
    initComingSoon();
  }


  /* public api:
   Everything exposed for pages and backend integration. */
  var Design = {
    // Tokens & config
    THEMES:       THEMES,
    NAV_ITEMS:    NAV_ITEMS,
    STATS_SCHEMA: STATS_SCHEMA,

    // Mock data (swap via setUser after real fetch)
    MOCK_USER:    MOCK_USER,
    MOCK_FEED:    MOCK_FEED,
    MOCK_ALERTS:  MOCK_ALERTS,

    // User management
    setUser:      setUser,
    getUser:      getUser,

    // Theme
    applyTheme:   applyTheme,
    toggleTheme:  toggleTheme,
    initTheme:    initTheme,
    getTheme:     getTheme,

    // Reputation / Trust Rank
    getReputation: getReputation,

    // Navigation
    Nav:           Nav,

    // UI helpers
    showToast:      showToast,
    showComingSoon: showComingSoon,
    hideComingSoon: hideComingSoon,
    initComingSoon: initComingSoon,

    // Utilities
    timeAgo: timeAgo,
  };

  // Expose globally — page scripts and backend devs use window.Design
  global.Design = Design;

}(window));