/* ============================================================
   LIGTAS FRONTEND — FLASK INTEGRATION LAYER
   community.js  |  LigtasAPI + LigtasUI renderer
   See inline comments for Flask endpoint documentation.
============================================================ */

/* ============================================================
   LIGTAS FRONTEND — FLASK INTEGRATION LAYER
   ============================================================
   HOW TO USE WITH PYTHON FLASK
   ─────────────────────────────
   1. Serve this file as a Flask template (templates/community.html)
   2. Set window.LIGTAS_CONFIG.BASE_URL to your Flask server origin
      e.g. in your base.html: <script>window.LIGTAS_CONFIG = { BASE_URL: "http://localhost:5000" };<\/script>
   3. All API calls below hit Flask endpoints automatically.
   4. You can also call LigtasAPI methods directly from other JS modules.

   FLASK ENDPOINTS EXPECTED (copy these into your Flask app):
   ──────────────────────────────────────────────────────────
   GET  /api/reports?category=all&sort=recent        → { reports: [...] }
   GET  /api/notifications?user_id=<id>              → { notifications: [...], unread_count: n }
   GET  /api/news                                    → { news: [...] }
   GET  /api/forecast                                → { today: {...}, days: [...] }
   POST /api/reports/<report_id>/verify              → { verified: true, count: n }
   POST /api/reports/<report_id>/unverify            → { verified: false, count: n }
   POST /api/notifications/<notif_id>/read           → { ok: true }
   POST /api/notifications/read-all                  → { ok: true }
   POST /api/reports          body: FormData          → { report: {...} }  (new report)

   QUICK FLASK STARTER (app.py):
   ──────────────────────────────────────────────────────────
   from flask import Flask, jsonify, request
   from flask_cors import CORS
   app = Flask(__name__)
   CORS(app)

   @app.route('/api/reports')
   def get_reports():
       category = request.args.get('category', 'all')
       sort     = request.args.get('sort', 'recent')
       # query your DB here
       return jsonify({ "reports": [] })

   @app.route('/api/reports/<int:report_id>/verify', methods=['POST'])
   def verify_report(report_id):
       # toggle verify in DB, return new count
       return jsonify({ "verified": True, "count": 125 })

   @app.route('/api/notifications')
   def get_notifications():
       user_id = request.args.get('user_id', 1)
       return jsonify({ "notifications": [], "unread_count": 0 })

   @app.route('/api/notifications/<int:notif_id>/read', methods=['POST'])
   def mark_notif_read(notif_id):
       return jsonify({ "ok": True })

   @app.route('/api/forecast')
   def get_forecast():
       return jsonify({ "today": {}, "days": [] })
   ============================================================ */

  /* ── CONFIG ─────────────────────────────────────────────── */
  window.LIGTAS_CONFIG = window.LIGTAS_CONFIG || {
    BASE_URL: 'http://localhost:5000',   // ← change to your Flask server
    USER_ID:  1,                          // ← set after login
    AUTH_TOKEN: null,                     // ← set after login (JWT or session cookie)
    POLL_INTERVAL_MS: 30000,              // how often to poll for new notifications
  };

  /* ── LOW-LEVEL FETCH HELPER ─────────────────────────────── */
  /**
   * LigtasAPI._fetch(path, options)
   * Wraps fetch with base URL, auth headers, and JSON parsing.
   * Returns { data, ok, status } — never throws; errors go to console.
   */
  const LigtasAPI = {
    _fetch: async function(path, opts = {}) {
      const cfg = window.LIGTAS_CONFIG;
      const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
      if (cfg.AUTH_TOKEN) headers['Authorization'] = `Bearer ${cfg.AUTH_TOKEN}`;
      try {
        const res = await fetch(`${cfg.BASE_URL}${path}`, { ...opts, headers });
        const data = res.ok ? await res.json() : null;
        return { data, ok: res.ok, status: res.status };
      } catch (err) {
        console.warn(`[LigtasAPI] ${path} failed:`, err.message);
        return { data: null, ok: false, status: 0 };
      }
    },

    /* ── REPORTS ───────────────────────────────────────────── */

    /**
     * LigtasAPI.fetchReports(category, sort)
     * GET /api/reports?category=<category>&sort=<sort>
     * Returns array of report objects from Flask.
     * Calls renderReports() automatically if data is returned.
     *
     * @param {string} category  - 'all' | 'flood' | 'typhoon' | 'fire' | 'quake' | 'slide' | 'crime'
     * @param {string} sort      - 'recent' | 'popular' | 'verified'
     */
    fetchReports: async function(category = 'all', sort = 'recent') {
      const { data } = await this._fetch(`/api/reports?category=${category}&sort=${sort}`);
      if (data && data.reports) {
        LigtasUI.renderReports(data.reports);
      }
      return data;
    },

    /**
     * LigtasAPI.verifyReport(reportId, currentlyVerified)
     * POST /api/reports/<reportId>/verify  OR  /api/reports/<reportId>/unverify
     * Toggles the user's verification on a report.
     * Updates the UI count and progress bar automatically.
     *
     * @param {number|string} reportId       - report identifier
     * @param {boolean}       currentlyVerified
     */
    verifyReport: async function(reportId, currentlyVerified) {
      const action = currentlyVerified ? 'unverify' : 'verify';
      const { data, ok } = await this._fetch(`/api/reports/${reportId}/${action}`, { method: 'POST' });
      if (!ok) console.warn('[LigtasAPI] verifyReport failed for', reportId);
      return data; // { verified: bool, count: n }
    },

    /**
     * LigtasAPI.submitReport(formData)
     * POST /api/reports  (multipart FormData — supports photo upload)
     * Submits a new community report.
     *
     * @param {FormData} formData - fields: category, description, lat, lng, photo (optional)
     */
    submitReport: async function(formData) {
      const cfg = window.LIGTAS_CONFIG;
      const headers = {};
      if (cfg.AUTH_TOKEN) headers['Authorization'] = `Bearer ${cfg.AUTH_TOKEN}`;
      try {
        const res = await fetch(`${cfg.BASE_URL}/api/reports`, { method: 'POST', headers, body: formData });
        const data = res.ok ? await res.json() : null;
        if (data && data.report) LigtasUI.prependReport(data.report);
        return { data, ok: res.ok };
      } catch (err) {
        console.warn('[LigtasAPI] submitReport failed:', err.message);
        return { data: null, ok: false };
      }
    },

    /* ── NOTIFICATIONS ─────────────────────────────────────── */

    /**
     * LigtasAPI.fetchNotifications()
     * GET /api/notifications?user_id=<USER_ID>
     * Loads notifications and updates the sheet + bell badge.
     */
    fetchNotifications: async function() {
      const { data } = await this._fetch(`/api/notifications?user_id=${window.LIGTAS_CONFIG.USER_ID}`);
      if (data) {
        if (data.notifications) LigtasUI.renderNotifications(data.notifications);
        if (typeof data.unread_count === 'number') LigtasUI.setUnreadBadge(data.unread_count);
      }
      return data;
    },

    /**
     * LigtasAPI.markNotifRead(notifId)
     * POST /api/notifications/<notifId>/read
     * Marks one notification as read on the server.
     *
     * @param {number|string} notifId
     */
    markNotifRead: async function(notifId) {
      await this._fetch(`/api/notifications/${notifId}/read`, { method: 'POST' });
    },

    /**
     * LigtasAPI.markAllNotifsRead()
     * POST /api/notifications/read-all
     */
    markAllNotifsRead: async function() {
      await this._fetch('/api/notifications/read-all', { method: 'POST' });
    },

    /* ── NEWS ──────────────────────────────────────────────── */

    /**
     * LigtasAPI.fetchNews()
     * GET /api/news
     * Loads official news items and re-renders the news strip.
     */
    fetchNews: async function() {
      const { data } = await this._fetch('/api/news');
      if (data && data.news) LigtasUI.renderNews(data.news);
      return data;
    },

    /* ── FORECAST ──────────────────────────────────────────── */

    /**
     * LigtasAPI.fetchForecast()
     * GET /api/forecast
     * Updates the weather hero and 5-day strip.
     */
    fetchForecast: async function() {
      const { data } = await this._fetch('/api/forecast');
      if (data) LigtasUI.renderForecast(data);
      return data;
    },

    /* ── POLLING ───────────────────────────────────────────── */

    /**
     * LigtasAPI.startPolling()
     * Polls for new notifications every POLL_INTERVAL_MS.
     * Call once after login.
     */
    _pollTimer: null,
    startPolling: function() {
      if (this._pollTimer) return;
      this._pollTimer = setInterval(() => this.fetchNotifications(), window.LIGTAS_CONFIG.POLL_INTERVAL_MS);
      console.log('[LigtasAPI] Polling started every', window.LIGTAS_CONFIG.POLL_INTERVAL_MS, 'ms');
    },
    stopPolling: function() {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    },

    /* ── AUTH HELPERS ──────────────────────────────────────── */

    /**
     * LigtasAPI.setAuth(userId, token)
     * Call this after your login flow to inject credentials.
     * All subsequent API calls will include the token.
     *
     * @param {number} userId
     * @param {string} token  - JWT or session token from Flask /auth/login
     */
    setAuth: function(userId, token) {
      window.LIGTAS_CONFIG.USER_ID   = userId;
      window.LIGTAS_CONFIG.AUTH_TOKEN = token;
      console.log('[LigtasAPI] Auth set for user', userId);
    },
  };

  /* ── UI RENDERER LAYER ──────────────────────────────────────
     These functions consume the data returned by LigtasAPI
     and update the DOM. Called automatically by fetchXxx().
     You can also call them directly to inject mock/test data.
  ─────────────────────────────────────────────────────────── */
  const LigtasUI = {

    /* ── REPORTS ── */
    /**
     * LigtasUI.renderReports(reports)
     * Replaces the report list with data from Flask.
     *
     * Expected shape of each report object:
     * {
     *   id:          number,
     *   author_name: string,
     *   author_initials: string,
     *   author_color: string,   // CSS gradient string
     *   time_ago:    string,    // e.g. "5 mins ago"
     *   location:    string,
     *   category:    string,    // 'flood'|'typhoon'|'fire'|'quake'|'slide'|'crime'
     *   severity:    string,    // 'critical'|'high'|'moderate'|'info'
     *   badge_label: string,
     *   body:        string,
     *   image_url:   string|null,
     *   gps_verified: bool,
     *   verify_count: number,
     *   verify_max:   number,
     *   user_verified: bool,
     *   comment_count: number,
     * }
     */
    renderReports: function(reports) {
      const container = document.getElementById('reports-list');
      if (!container) return;
      container.innerHTML = '';
      reports.forEach(r => container.appendChild(this._buildReportCard(r)));
    },

    /**
     * LigtasUI.prependReport(report)
     * Inserts a single new report at the top (after a new submission).
     */
    prependReport: function(report) {
      const container = document.getElementById('reports-list');
      if (!container) return;
      const card = this._buildReportCard(report);
      card.style.animation = 'fadeUp 0.4s ease both';
      container.prepend(card);
    },

    _buildReportCard: function(r) {
      const sevClass = { critical: 'sev-critical', high: 'sev-high', moderate: 'sev-moderate', info: 'sev-info' }[r.severity] || 'sev-moderate';
      const pct = Math.min(100, Math.round((r.verify_count / (r.verify_max || 150)) * 100));
      const barColor = pct >= 80 ? 'linear-gradient(90deg,var(--teal),var(--green))' : 'linear-gradient(90deg,var(--yellow),#e8a000)';
      const countColor = pct >= 80 ? 'var(--teal)' : 'var(--yellow)';
      const verifiedLabel = r.user_verified ? 'Verified' : 'Verify';
      const activeClass = r.user_verified ? 'active' : '';

      const div = document.createElement('div');
      div.className = 'report-card';
      div.dataset.reportId = r.id;
      div.innerHTML = `
        <div class="report-hdr">
          <div class="reporter">
            <div class="av" style="background:${r.author_color || 'linear-gradient(135deg,#3b9ed4,#1a6fa0)'}">${r.author_initials || '?'}</div>
            <div>
              <div class="rep-name">${_esc(r.author_name)}</div>
              <div class="rep-meta">${_esc(r.time_ago)} · ${_esc(r.location)}</div>
            </div>
          </div>
          <span class="sev-badge ${sevClass}">${_esc(r.badge_label)}</span>
        </div>
        <div class="rep-body">${_esc(r.body)}</div>
        ${r.image_url ? `
        <div class="rep-img">
          <img src="${_esc(r.image_url)}" style="width:100%;height:100%;object-fit:cover;" alt="Report photo"/>
          ${r.gps_verified ? `<div class="gps-tag"><span class="msi">location_on</span> GPS Verified</div>` : ''}
        </div>` : ''}
        <div class="verify-wrap">
          <div class="verify-label">
            <span>Community verification</span>
            <span id="vc-${r.id}" style="color:${countColor}">${r.verify_count} / ${r.verify_max || 150} needed</span>
          </div>
          <div class="verify-bar"><div class="verify-fill" id="vb-${r.id}" style="width:${pct}%;background:${barColor}"></div></div>
        </div>
        <div class="rep-actions">
          <div class="rep-action-group">
            <button class="act-btn ${activeClass}" id="vbtn-${r.id}"
              onclick="LigtasUI.handleVerify(this, ${r.id}, ${r.verify_count}, ${r.verify_max || 150})">
              <span class="msi">thumb_up</span>
              <span class="vcount">${verifiedLabel} (${r.verify_count})</span>
            </button>
            <button class="act-btn">
              <span class="msi">chat_bubble</span> ${r.comment_count || 0}
            </button>
          </div>
          <button class="act-btn"><span class="msi">share</span></button>
        </div>`;
      return div;
    },

    /**
     * LigtasUI.handleVerify(btn, reportId, currentCount, max)
     * Called on verify button click — updates UI immediately (optimistic),
     * then syncs with Flask in the background.
     */
    handleVerify: async function(btn, reportId, currentCount, max) {
      const wasActive = btn.classList.contains('active');
      // Optimistic UI update
      btn.classList.toggle('active');
      const newCount = wasActive ? currentCount - 1 : currentCount + 1;
      const countSpan = btn.querySelector('.vcount');
      const label = countSpan.textContent.includes('Helpful') ? 'Helpful' : 'Verify';
      countSpan.textContent = `${label} (${newCount})`;

      const vcEl = document.getElementById(`vc-${reportId}`);
      const vbEl = document.getElementById(`vb-${reportId}`);
      if (vcEl) vcEl.textContent = `${newCount} / ${max} needed`;
      if (vbEl) vbEl.style.width = Math.min(100, Math.round(newCount / max * 100)) + '%';

      if (!wasActive) {
        const f = document.createElement('span');
        f.className = 'float-label'; f.textContent = '+1';
        btn.appendChild(f); setTimeout(() => f.remove(), 700);
      }

      // Sync with Flask
      const result = await LigtasAPI.verifyReport(reportId, wasActive);
      // If server returns a different count, reconcile
      if (result && typeof result.count === 'number' && result.count !== newCount) {
        countSpan.textContent = `${label} (${result.count})`;
        if (vcEl) vcEl.textContent = `${result.count} / ${max} needed`;
        if (vbEl) vbEl.style.width = Math.min(100, Math.round(result.count / max * 100)) + '%';
      }
    },

    /* ── NOTIFICATIONS ── */
    /**
     * LigtasUI.renderNotifications(notifications)
     * Replaces the notification list content from Flask data.
     *
     * Expected shape of each notification object:
     * {
     *   id:       number,
     *   type:     string,   // 'flood'|'typhoon'|'fire'|'verify'|'forecast'|'crime'
     *   title:    string,
     *   body:     string,
     *   time_ago: string,
     *   source:   string|null,
     *   unread:   bool,
     *   action_label: string|null,
     *   action_url:   string|null,
     *   avatar_text:  string,
     *   avatar_color: string,
     * }
     */
    renderNotifications: function(notifications) {
      const list = document.getElementById('notif-list');
      if (!list) return;

      // Group by time period
      const today = [], yesterday = [], older = [];
      notifications.forEach(n => {
        const d = n.time_period || 'today';
        if (d === 'today') today.push(n);
        else if (d === 'yesterday') yesterday.push(n);
        else older.push(n);
      });

      list.innerHTML = '';
      if (today.length)     { list.appendChild(_notifGroup('Today'));     today.forEach(n => list.appendChild(this._buildNotifItem(n))); }
      if (yesterday.length) { list.appendChild(_notifGroup('Yesterday')); yesterday.forEach(n => list.appendChild(this._buildNotifItem(n))); }
      if (older.length)     { list.appendChild(_notifGroup('Earlier'));   older.forEach(n => list.appendChild(this._buildNotifItem(n))); }
      list.insertAdjacentHTML('beforeend', '<div style="height:20px"></div>');
    },

    _buildNotifItem: function(n) {
      const badgeClass = { flood:'nb-flood', typhoon:'nb-typhoon', fire:'nb-fire', verify:'nb-verify', forecast:'nb-forecast', crime:'nb-crime' }[n.type] || 'nb-verify';
      const badgeIcon  = { flood:'💧', typhoon:'🌪', fire:'🔥', verify:'✓', forecast:'🌤', crime:'🚨' }[n.type] || '●';

      const div = document.createElement('div');
      div.className = `notif-item${n.unread ? ' unread' : ''}`;
      div.dataset.notifId = n.id;
      div.onclick = () => this.handleMarkRead(div, n.id);
      div.innerHTML = `
        <div class="nav-wrap">
          <div class="nav-av" style="background:${n.avatar_color || '#1ec8c8'}">${_esc(n.avatar_text || '?')}</div>
          <div class="nav-badge ${badgeClass}">${badgeIcon}</div>
        </div>
        <div class="notif-content">
          <div class="notif-text">${n.body}</div>
          <div class="notif-time">${_esc(n.time_ago)}${n.source ? ' · ' + _esc(n.source) : ''}</div>
          ${n.action_label ? `<div class="notif-act"><span class="msi">open_in_new</span> ${_esc(n.action_label)}</div>` : ''}
        </div>
        ${n.unread ? '<div class="unread-dot"></div>' : ''}`;
      return div;
    },

    /**
     * LigtasUI.handleMarkRead(itemEl, notifId)
     * Marks item read in UI + tells Flask.
     */
    handleMarkRead: async function(item, notifId) {
      if (!item.classList.contains('unread')) return;
      item.classList.remove('unread');
      const dot = item.querySelector('.unread-dot');
      if (dot) { dot.style.opacity = '0'; setTimeout(() => dot.remove(), 300); }
      item.style.borderLeftColor = 'transparent';
      _unreadCount = Math.max(0, _unreadCount - 1);
      this.setUnreadBadge(_unreadCount);
      await LigtasAPI.markNotifRead(notifId);
    },

    /**
     * LigtasUI.setUnreadBadge(count)
     * Updates the red dot on the bell icon.
     * @param {number} count
     */
    setUnreadBadge: function(count) {
      _unreadCount = count;
      const dot = document.getElementById('notif-dot');
      if (!dot) return;
      dot.classList.toggle('hidden', count === 0);
      dot.title = count > 0 ? `${count} unread` : '';
    },

    /* ── NEWS ── */
    /**
     * LigtasUI.renderNews(news)
     * Replaces the Official News strip.
     *
     * Expected shape of each news object:
     * { id, source, source_type: 'official'|'gov'|'alert', title, time_ago }
     */
    renderNews: function(news) {
      const container = document.getElementById('news-items');
      if (!container) return;
      container.innerHTML = '';
      news.forEach(n => {
        const typeClass = { official: 'ns-official', gov: 'ns-gov', alert: 'ns-alert' }[n.source_type] || 'ns-official';
        const div = document.createElement('div');
        div.className = 'news-item';
        div.innerHTML = `
          <span class="news-source-tag ${typeClass}">${_esc(n.source)}</span>
          <div class="news-title">${_esc(n.title)}</div>
          <div class="news-time">${_esc(n.time_ago)}</div>`;
        container.appendChild(div);
      });
    },

    /* ── FORECAST ── */
    /**
     * LigtasUI.renderForecast(data)
     * Updates the weather hero card and 5-day strip.
     *
     * Expected shape:
     * {
     *   today: { condition, temp_c, feels_like_c, warning },
     *   days: [{ label, icon, temp_c, risk: 'HIGH'|'MED'|'LOW'|'SAFE' }, ...]
     * }
     */
    renderForecast: function(data) {
      if (data.today) {
        const t = data.today;
        const titleEl = document.getElementById('weather-title');
        const subEl   = document.getElementById('weather-sub');
        const tempEl  = document.getElementById('weather-temp');
        const feelEl  = document.getElementById('weather-feels');
        if (titleEl) titleEl.textContent = t.condition || 'Heavy Rain';
        if (subEl)   subEl.textContent   = t.warning   || 'Flood Warning Active';
        if (tempEl)  tempEl.textContent  = (t.temp_c ?? 24) + '°C';
        if (feelEl)  feelEl.textContent  = 'Feels like ' + (t.feels_like_c ?? 26) + '°';
      }
      if (data.days) {
        const strip = document.getElementById('forecast-strip');
        if (!strip) return;
        const riskClass = { HIGH: 'risk-h', MED: 'risk-m', LOW: 'risk-l', SAFE: 'risk-l' };
        strip.innerHTML = data.days.map((d, i) => `
          <div class="fc-day${i === 0 ? ' active' : ''}" onclick="LigtasUI.selectForecastDay(this)">
            <div class="fc-day-name">${_esc(d.label)}</div>
            <div class="fc-icon">${d.icon || '🌤️'}</div>
            <div class="fc-temp">${d.temp_c ?? '--'}°</div>
            <div class="fc-risk ${riskClass[d.risk] || 'risk-l'}">${_esc(d.risk)}</div>
          </div>`).join('');
      }
    },

    /* ── LOCAL UI HELPERS ── */
    selectForecastDay: function(el) {
      document.querySelectorAll('.fc-day').forEach(d => d.classList.remove('active'));
      el.classList.add('active');
    },
  };

  /* ── PRIVATE STATE & SMALL HELPERS ──────────────────────── */
  let _unreadCount = 3; // updated by LigtasUI.setUnreadBadge

  function _esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _notifGroup(label) {
    const d = document.createElement('div');
    d.className = 'notif-group';
    d.textContent = label;
    return d;
  }

  /* ── EXPOSE GLOBALS ─────────────────────────────────────────
     window.LigtasAPI  — for Flask/backend integration
     window.LigtasUI   — for rendering & DOM control
  ─────────────────────────────────────────────────────────── */
  window.LigtasAPI = LigtasAPI;
  window.LigtasUI  = LigtasUI;

  /* ── EXISTING UI EVENT HANDLERS (unchanged behaviour) ──── */

  function openNotif() {
    document.getElementById('notif-backdrop').classList.add('open');
    document.getElementById('notif-sheet').classList.add('open');
  }
  function closeNotif() {
    document.getElementById('notif-backdrop').classList.remove('open');
    document.getElementById('notif-sheet').classList.remove('open');
  }
  function markRead(item) {
    const id = item.dataset.notifId || 0;
    LigtasUI.handleMarkRead(item, id);
  }
  function setNTab(el) {
    document.querySelectorAll('.ntab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }
  function setCat(el) {
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    const cat = el.textContent.trim().toLowerCase();
    LigtasAPI.fetchReports(cat === 'all' ? 'all' : cat, 'recent');
  }
  function selectDay(el) { LigtasUI.selectForecastDay(el); }

  // Legacy inline verify handler for the static cards that are already in the HTML
  function toggleVerify(btn, countId, barId, base, max) {
    LigtasUI.handleVerify(btn, countId || btn.id, base, max);
  }

  /* ── INIT ON PAGE LOAD ─────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    /*
      Uncomment below when Flask is running to load live data:

      LigtasAPI.fetchForecast();
      LigtasAPI.fetchNews();
      LigtasAPI.fetchReports();
      LigtasAPI.fetchNotifications();
      LigtasAPI.startPolling();
    */
    console.log('[Ligtas] Frontend ready. LigtasAPI and LigtasUI are available on window.');
    console.log('[Ligtas] Set window.LIGTAS_CONFIG.BASE_URL to your Flask server to connect.');
  });
