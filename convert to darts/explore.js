/**Page-specific logic only. Extends window.Design (from shared.js).
 *
 * LOAD ORDER in explore.html:
 *   1. <link rel="stylesheet" href="main.css" />
 *   2. <script src="shared.js"></script>        ← sets window.Design
 *   3. <script src="explore.js" defer></script>  ← this file
 *
 * BACKEND INTEGRATION — search for  // ── BACKEND:
 *
 * EXPOSED ON window.Design:
 *   Design.setState(n)           — change UI state (1-4)
 *   Design.setDestination(str)   — populate input + show chips
 *   Design.searchRoutes()        — trigger route search
 *   Design.loadRoutes(routes)    — populate route cards from data array
 *   Design.map                   — Leaflet map instance
 *   Design.filters               — current filter state object
 *   Design.MOCK_ROUTES           — mock route data (replace with API)
 */


/*filter state */
var COMMUTER_OPTIONS = [
  { key: 'women',    label: 'Women',    icon: '<path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/><path d="M12 12v10M9 19h6"/>' },
  { key: 'lgbtq',   label: 'LGBTQ+',   icon: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8l4 4-4 4"/>' },
  { key: 'minor',   label: 'Minor',    icon: '<path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M6 21v-1a6 6 0 0 1 12 0v1"/>' },
  { key: 'student', label: 'Student',  icon: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>' },
  { key: 'elderly', label: 'Elderly',  icon: '<circle cx="12" cy="5" r="3"/><path d="M6 21v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/><path d="M10 14v3M14 14v3"/>' },
  { key: 'disabled',label: 'Disabled', icon: '<circle cx="12" cy="4" r="2"/><path d="M10 8h4l2 8H8l2-8z"/><path d="M8 20h8"/>' },
];

var TRANSPORT_OPTIONS = [
  { key: 'mrt',  label: 'MRT/LRT', icon: '<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 10h16"/><circle cx="9" cy="17" r="2"/><circle cx="15" cy="17" r="2"/><path d="M9 3v7M15 3v7"/>' },
  { key: 'bus',  label: 'Bus',     icon: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/><path d="M3 12h18M8 6V4M16 6V4"/>' },
  { key: 'jeep', label: 'Jeep',    icon: '<rect x="1" y="8" width="22" height="10" rx="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M1 11h22"/>' },
  { key: 'walk', label: 'Walk',    icon: '<circle cx="12" cy="4" r="2"/><path d="m9 20 1-5-2-3 3-3"/><path d="m6 9 6-2 5 3"/><path d="m15 20-1-5 2-3"/>' },
];

var _filters = {
  commuterType: null,
  transport:    [],
};

/* mock route data
This is the single source of truth for the suggested routes.
   The HTML route cards AND the details panel are both rendered
   from this data — nothing is hardcoded in the HTML.

   BACKEND: Replace with response from POST /api/routes/search
   Expected shape per route:
     id          string
     modes       string            — display label e.g. "Jeepney → Walk"
     minutes     number
     fare        number
     safetyScore number            — 0–100
     safetyNote  string            — "Why X% safe?" explanation
     steps       { icon, title, description }[]
     polyline    [lat, lng][]      — Leaflet coordinate pairs

   Call Design.loadRoutes(routes) after your fetch resolves.

   Safety color thresholds (mirrors getSafetyMeta):
     score >= 85  → green / teal  (safe)
     score >= 70  → yellow        (moderate)
     score <  70  → red           (danger) */
var MOCK_ROUTES = [
  {
    id: 'route_001',
    modes: 'Jeepney → Walk',
    minutes: 32,
    fare: 18,
    safetyScore: 92,
    safetyNote: 'Well-lit roads with active community monitoring. High foot traffic during daytime. No incidents reported in the past 30 days.',
    steps: [
      { iconPath: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', title: 'Walk to Commonwealth Ave', description: '5 min walk • 400m • Well-lit path' },
      { iconPath: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 12h18"/>', title: 'Take Jeepney to UP Diliman', description: '20 min ride • ₱ 13 • Commonwealth – Katipunan' },
      { iconPath: '<circle cx="12" cy="4" r="2"/><path d="m9 20 1-5-2-3 3-3"/><path d="m6 9 6-2 5 3"/><path d="m15 20-1-5 2-3"/>', title: 'Walk to destination', description: '7 min walk • 550m • Campus path with guards' },
    ],
    // Mock polyline: Quezon Ave → Commonwealth Ave → UP Diliman area
    polyline: [
      [14.6507, 121.0494],
      [14.6540, 121.0470],
      [14.6580, 121.0440],
      [14.6620, 121.0400],
      [14.6658, 121.0654],
      [14.6560, 121.0590],
      [14.6530, 121.0680],
    ],
  },
  {
    id: 'route_002',
    modes: 'Bus → Jeepney → Walk',
    minutes: 45,
    fare: 25,
    safetyScore: 78,
    safetyNote: 'Route passes through moderately busy areas. Some stretches have limited lighting at night. Exercise caution during off-peak hours.',
    steps: [
      { iconPath: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', title: 'Walk to EDSA bus stop', description: '3 min walk • 250m • Open sidewalk' },
      { iconPath: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/><path d="M3 12h18M8 6V4M16 6V4"/>', title: 'Take Bus along EDSA', description: '25 min ride • ₱ 15 • EDSA Southbound' },
      { iconPath: '<rect x="1" y="8" width="22" height="10" rx="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M1 11h22"/>', title: 'Transfer to Jeepney', description: '12 min ride • ₱ 10 • Commonwealth route' },
      { iconPath: '<circle cx="12" cy="4" r="2"/><path d="m9 20 1-5-2-3 3-3"/><path d="m6 9 6-2 5 3"/><path d="m15 20-1-5 2-3"/>', title: 'Walk to destination', description: '5 min walk • 400m' },
    ],
    polyline: [
      [14.6507, 121.0494],
      [14.6460, 121.0390],
      [14.6420, 121.0370],
      [14.6500, 121.0550],
      [14.6570, 121.0620],
      [14.6530, 121.0680],
    ],
  },
  {
    id: 'route_003',
    modes: 'Tricycle → Walk',
    minutes: 28,
    fare: 35,
    safetyScore: 89,
    safetyNote: 'Short route through residential streets with regular tricycle patrols. Well-known area with low crime rate.',
    steps: [
      { iconPath: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', title: 'Board tricycle near you', description: '1 min wait • Near current location' },
      { iconPath: '<path d="M17 8V5l-5-3-5 3v3"/><rect x="4" y="8" width="16" height="12" rx="2"/><circle cx="9" cy="20" r="2"/><circle cx="15" cy="20" r="2"/>', title: 'Tricycle to Katipunan Ave', description: '20 min ride • ₱ 35 • Residential shortcut' },
      { iconPath: '<circle cx="12" cy="4" r="2"/><path d="m9 20 1-5-2-3 3-3"/><path d="m6 9 6-2 5 3"/><path d="m15 20-1-5 2-3"/>', title: 'Walk to destination', description: '7 min walk • 550m • Quiet street' },
    ],
    polyline: [
      [14.6507, 121.0494],
      [14.6520, 121.0510],
      [14.6545, 121.0545],
      [14.6560, 121.0590],
      [14.6530, 121.0680],
    ],
  },
];

// Currently selected route (set when a card is clicked)
var _activeRoute = null;
// Leaflet layers currently drawn on the map
var _activePolyline = null;
var _activeMarkers  = [];   // start + end marker refs for cleanup


/*SAFETY META HELPER
   Returns color values and CSS class based on score. */
function getSafetyMeta(score) {
  if (score >= 85) return { cls: '',       hex: '#12d9c0', label: 'Safe',     bgHex: 'rgba(18,217,192,0.12)' };
  if (score >= 70) return { cls: 'medium', hex: '#d97706', label: 'Moderate', bgHex: 'rgba(250,204,21,0.12)' };
  return              { cls: 'low',    hex: '#fb7185', label: 'Caution',  bgHex: 'rgba(251,113,133,0.12)' };
}


/* MAP INITIALIZATION:
   Two tile layers — CartoDB Silver for light, CartoDB Voyager
   for dark (warm grey, readable labels for PH commuters).

   Design.switchMapTile('light'|'dark') — swap at any time.
   Called on init and on every 'themeChanged' window event
   dispatched by main.js applyTheme().
════════════════════════════════════════════════════════════════ */
var map        = null;
var _tileLayer = null;   // currently active tile layer

var TILE_LAYERS = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    options: {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    },
  },
  dark: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    options: {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    },
  },
};

/**
 * Swaps the active tile layer to match the given theme.
 * Exposed as Design.switchMapTile for use from any page.
 * @param {'light'|'dark'} theme
 */
function switchMapTile(theme) {
  if (!map) return;
  var def = TILE_LAYERS[theme] || TILE_LAYERS.light;
  if (_tileLayer) { map.removeLayer(_tileLayer); _tileLayer = null; }
  _tileLayer = L.tileLayer(def.url, def.options).addTo(map);
}
Design.switchMapTile = switchMapTile;

function initMap() {
  map = L.map('map', { zoomControl: false, attributionControl: true })
    .setView([14.6530, 121.0580], 14);

  // Load the correct tile for the current saved theme immediately
  switchMapTile(Design.getTheme());

  L.control.zoom({ position: 'bottomright' }).addTo(map);
  Design.map = map;

  // Re-fire whenever profile page (or anywhere) toggles the theme
  window.addEventListener('themeChanged', function () {
    switchMapTile(Design.getTheme());
  });

  // ── BACKEND: get user's real location
  // navigator.geolocation.getCurrentPosition(function(pos) {
  //   map.setView([pos.coords.latitude, pos.coords.longitude], 15);
  // });
}

/**
 * Draws a colored polyline on the map for the given route.
 * Clears the previous polyline first.
 * Color is derived from the route's safetyScore.
 *
 * @param {object} route — one item from MOCK_ROUTES / API response
 */
function drawRouteOnMap(route) {
  // Clear previous polyline + markers
  if (_activePolyline) { map.removeLayer(_activePolyline); _activePolyline = null; }
  _activeMarkers.forEach(function (m) { map.removeLayer(m); });
  _activeMarkers = [];

  if (!route || !route.polyline || !route.polyline.length) return;

  var meta = getSafetyMeta(route.safetyScore);

  // Draw the route line
  _activePolyline = L.polyline(route.polyline, {
    color: meta.hex, weight: 6, opacity: 0.88,
    lineJoin: 'round', lineCap: 'round',
  }).addTo(map);

  // ── User location marker — balloon pin, orange
  // Circle head + downward triangle tail = standard map pin shape.
  // Orange (#ff6b35) is unique — distinct from teal route lines and
  // any safety score color, immediately readable as "you are here".
  var userColor = '#a855f7';
  var userHtml =
    '<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3));">'
    // Circle head
    + '<div style="'
    +   'width:36px;height:36px;border-radius:50%;'
    +   'background:' + userColor + ';'
    +   'border:3px solid #fff;'
    +   'display:flex;align-items:center;justify-content:center;'
    + '">'
    // Person silhouette icon (head + shoulders)
    +   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
    +     '<circle cx="12" cy="7" r="4"/>'
    +     '<path d="M5.5 21a8.38 8.38 0 0 1 13 0"/>'
    +   '</svg>'
    + '</div>'
    // Tail — triangle pointing down
    + '<div style="'
    +   'width:0;height:0;'
    +   'border-left:7px solid transparent;'
    +   'border-right:7px solid transparent;'
    +   'border-top:10px solid ' + userColor + ';'
    +   'margin-top:-1px;'
    + '"></div>'
    + '</div>';

  var userIcon = L.divIcon({
    html:        userHtml,
    className:   '',
    iconSize:    [36, 48],
    iconAnchor:  [18, 48],   // tip of the tail anchors to the coordinate
    popupAnchor: [0, -52],
  });

  var startMarker = L.marker(route.polyline[0], { icon: userIcon })
    .addTo(map).bindPopup('<b>Your Location</b>');
  _activeMarkers.push(startMarker);

  // ── Destination marker — balloon pin, safety score color
  // Same balloon shape as user marker for visual consistency.
  // Color matches the route polyline so they feel connected.
  // Inside: shield icon to signal "safe destination".
  var destColor = meta.hex;
  var destHtml =
    '<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3));">'
    // Circle head
    + '<div style="'
    +   'width:36px;height:36px;border-radius:50%;'
    +   'background:' + destColor + ';'
    +   'border:3px solid rgba(255,255,255,0.6);'
    +   'display:flex;align-items:center;justify-content:center;'
    + '">'
    // Shield icon — signals safe destination
    +   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
    +     '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
    +   '</svg>'
    + '</div>'
    // Tail — triangle pointing down
    + '<div style="'
    +   'width:0;height:0;'
    +   'border-left:7px solid transparent;'
    +   'border-right:7px solid transparent;'
    +   'border-top:10px solid ' + destColor + ';'
    +   'margin-top:-1px;'
    + '"></div>'
    + '</div>';

  var destIcon = L.divIcon({
    html:        destHtml,
    className:   '',
    iconSize:    [36, 48],
    iconAnchor:  [18, 48],   // tip of the tail anchors to the coordinate
    popupAnchor: [0, -52],
  });

  var endCoord = route.polyline[route.polyline.length - 1];
  var endMarker = L.marker(endCoord, { icon: destIcon })
    .addTo(map).bindPopup('<b>Destination</b>');
  _activeMarkers.push(endMarker);

  // Fit map to route — leave bottom padding so panel doesn't cover the line
  map.fitBounds(_activePolyline.getBounds(), { paddingTopLeft: [40, 60], paddingBottomRight: [40, 220] });
}

/**
 * Clears the route line from the map.
 */
function clearRouteFromMap() {
  if (_activePolyline) { map.removeLayer(_activePolyline); _activePolyline = null; }
  _activeMarkers.forEach(function (m) { map.removeLayer(m); });
  _activeMarkers = [];
}


/*ROUTE CARD RENDERING
   Builds route cards from data. Called by Design.loadRoutes(). */
function renderRouteCards(routes) {
  var container = document.getElementById('route-cards-container');
  if (!container) return;
  container.innerHTML = '';

  routes.forEach(function (route) {
    var meta = getSafetyMeta(route.safetyScore);

    var card = document.createElement('div');
    card.className = 'route-card';
    card.dataset.routeId = route.id;

    // Transport icon — use first mode to pick icon path
    var iconPath = getTransportIconPath(route.modes);

    card.innerHTML =
      '<div class="route-card-header">'
      + '<div class="transport-icon" style="background:' + meta.bgHex + ';color:' + meta.hex + '">'
      +   '<svg class="icon-svg" width="26" height="26" viewBox="0 0 24 24">' + iconPath + '</svg>'
      + '</div>'
      + '<div class="route-card-info">'
      +   '<div class="route-modes">' + route.modes + '</div>'
      +   '<div class="route-meta">'
      +     '<span>⏱ ' + route.minutes + ' min</span>'
      +     '<span>₱ ' + route.fare + '</span>'
      +   '</div>'
      + '</div>'
      + '<div class="safety-score ' + meta.cls + '">' + route.safetyScore + '%</div>'
      + '</div>';

    card.addEventListener('click', function () {
      _activeRoute = route;
      drawRouteOnMap(route);
      renderDetailsPanel(route);
      Design.setState(3);
    });

    container.appendChild(card);
  });
}

/** Pick a transport SVG path based on the modes string */
function getTransportIconPath(modes) {
  var m = modes.toLowerCase();
  if (m.indexOf('mrt') !== -1 || m.indexOf('lrt') !== -1)
    return '<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 10h16"/><circle cx="9" cy="17" r="2"/><circle cx="15" cy="17" r="2"/>';
  if (m.indexOf('bus') !== -1)
    return '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/><path d="M3 12h18M8 6V4M16 6V4"/>';
  if (m.indexOf('jeep') !== -1)
    return '<rect x="1" y="8" width="22" height="10" rx="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M1 11h22"/>';
  if (m.indexOf('tricycle') !== -1)
    return '<path d="M17 8V5l-5-3-5 3v3"/><rect x="4" y="8" width="16" height="12" rx="2"/><circle cx="9" cy="20" r="2"/><circle cx="15" cy="20" r="2"/>';
  // Walk fallback
  return '<circle cx="12" cy="4" r="2"/><path d="m9 20 1-5-2-3 3-3"/><path d="m6 9 6-2 5 3"/><path d="m15 20-1-5 2-3"/>';
}


/* DETAILS PANEL RENDERING
   Fills the details panel from the selected route object. */
function renderDetailsPanel(route) {
  var meta = getSafetyMeta(route.safetyScore);

  // Safety explanation block
  var expTitle = document.getElementById('safety-exp-title');
  var expText  = document.getElementById('safety-exp-text');
  var expBlock = document.getElementById('safety-explanation');
  if (expTitle) expTitle.textContent = 'Why ' + route.safetyScore + '% ' + meta.label + '?';
  if (expText)  expText.textContent  = route.safetyNote;
  if (expBlock) {
    expBlock.style.background   = meta.bgHex;
    expBlock.style.borderColor  = meta.hex;
  }
  if (expTitle) expTitle.style.color = meta.hex;

  // Route steps
  var stepsList = document.getElementById('route-steps-list');
  if (stepsList) {
    stepsList.innerHTML = route.steps.map(function (step) {
      return '<div class="route-step">'
        + '<div class="step-icon" style="color:' + meta.hex + '">'
        +   '<svg class="icon-svg" width="18" height="18" viewBox="0 0 24 24">' + step.iconPath + '</svg>'
        + '</div>'
        + '<div class="step-content">'
        +   '<div class="step-title">' + step.title + '</div>'
        +   '<div class="step-description">' + step.description + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
  }
}


/* INIT FILTERS FROM USER SURVEY */
function initFiltersFromUser(user) {
  var validCommuter  = COMMUTER_OPTIONS.map(function (o) { return o.key; });
  var validTransport = TRANSPORT_OPTIONS.map(function (o) { return o.key; });
  var surveyCommuter = user && (user.commuterType || (user.role && user.role.toLowerCase()));

  _filters.commuterType = null;
  if (surveyCommuter) {
    var matched = validCommuter.find(function (k) {
      return surveyCommuter.toLowerCase().indexOf(k) !== -1;
    });
    if (matched) _filters.commuterType = matched;
  }

  var surveyTransport = user && user.preferences && user.preferences.transport;
  _filters.transport = [];
  if (Array.isArray(surveyTransport)) {
    surveyTransport.forEach(function (t) {
      if (validTransport.indexOf(t) !== -1) _filters.transport.push(t);
    });
  } else if (typeof surveyTransport === 'string' && validTransport.indexOf(surveyTransport) !== -1) {
    _filters.transport.push(surveyTransport);
  }

  console.log('[Explore] Filters from survey:', JSON.stringify(_filters));
}


/*CHIP RENDERING */
function renderChips() {
  var container = document.getElementById('filter-chips');
  if (!container) return;
  container.innerHTML = '';

  if (_filters.commuterType) {
    var co = COMMUTER_OPTIONS.find(function (o) { return o.key === _filters.commuterType; });
    if (co) {
      var chip = document.createElement('div');
      chip.className = 'chip chip-commuter';
      chip.innerHTML = '<svg class="icon-svg" width="14" height="14" viewBox="0 0 24 24">' + co.icon + '</svg>'
        + co.label
        + '<svg class="icon-svg chip-close" width="12" height="12" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      chip.addEventListener('click', function () {
        _filters.commuterType = null;
        renderChips();
      });
      container.appendChild(chip);
    }
  }

  _filters.transport.forEach(function (activeKey) {
    var to = TRANSPORT_OPTIONS.find(function (o) { return o.key === activeKey; });
    if (!to) return;
    var tchip = document.createElement('div');
    tchip.className = 'chip';
    tchip.innerHTML = '<svg class="icon-svg" width="14" height="14" viewBox="0 0 24 24">' + to.icon + '</svg>'
      + to.label
      + '<svg class="icon-svg chip-close" width="12" height="12" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    tchip.addEventListener('click', (function (key) {
      return function () {
        _filters.transport = _filters.transport.filter(function (k) { return k !== key; });
        renderChips();
      };
    }(activeKey)));
    container.appendChild(tchip);
  });
}


/*FILTER MODAL */
function buildFilterModal() {
  var existing = document.getElementById('filter-modal');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'filter-modal';
  overlay.className = 'filter-modal-overlay';

  overlay.innerHTML =
    '<div class="filter-modal">'
    + '<div class="filter-modal-handle"></div>'
    + '<div class="filter-modal-header">'
    +   '<span class="filter-modal-title">Filters</span>'
    +   '<button class="filter-modal-close" id="filter-modal-close" aria-label="Close">'
    +     '<svg class="icon-svg" width="18" height="18" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    +   '</button>'
    + '</div>'
    + '<div class="filter-section-label">COMMUTER TYPE <span class="filter-section-hint">Choose one</span></div>'
    + '<div class="filter-option-grid" id="fm-commuter">'
    + COMMUTER_OPTIONS.map(function (o) {
        var active = _filters.commuterType === o.key;
        return '<button class="filter-option' + (active ? ' active' : '') + '" data-key="' + o.key + '" data-group="commuter">'
          + '<svg class="icon-svg" width="18" height="18" viewBox="0 0 24 24">' + o.icon + '</svg>'
          + '<span>' + o.label + '</span>'
          + '</button>';
      }).join('')
    + '</div>'
    + '<div class="filter-section-label" style="margin-top:20px">TRANSPORT <span class="filter-section-hint">Choose any</span></div>'
    + '<div class="filter-option-grid" id="fm-transport">'
    + TRANSPORT_OPTIONS.map(function (o) {
        var active = _filters.transport.indexOf(o.key) !== -1;
        return '<button class="filter-option' + (active ? ' active' : '') + '" data-key="' + o.key + '" data-group="transport">'
          + '<svg class="icon-svg" width="18" height="18" viewBox="0 0 24 24">' + o.icon + '</svg>'
          + '<span>' + o.label + '</span>'
          + '</button>';
      }).join('')
    + '</div>'
    + '<button class="filter-apply-btn" id="filter-apply-btn">Apply Filters</button>'
    + '</div>';

  document.querySelector('.phone').appendChild(overlay);

  document.getElementById('filter-modal-close').addEventListener('click', closeFilterModal);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeFilterModal(); });

  overlay.querySelectorAll('.filter-option').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key   = this.dataset.key;
      var group = this.dataset.group;
      if (group === 'commuter') {
        var isSame = _filters.commuterType === key;
        overlay.querySelectorAll('[data-group="commuter"]').forEach(function (b) { b.classList.remove('active'); });
        _filters.commuterType = isSame ? null : key;
        if (!isSame) this.classList.add('active');
      } else {
        var idx = _filters.transport.indexOf(key);
        if (idx !== -1) { _filters.transport.splice(idx, 1); this.classList.remove('active'); }
        else            { _filters.transport.push(key);       this.classList.add('active'); }
      }
    });
  });

  document.getElementById('filter-apply-btn').addEventListener('click', function () {
    renderChips();
    closeFilterModal();
    var parts = [];
    if (_filters.commuterType) parts.push(_filters.commuterType);
    _filters.transport.forEach(function (t) { parts.push(t); });
    Design.showToast(parts.length ? 'Filters applied' : 'No filters active', 'teal');
    // ── BACKEND: PATCH /api/user/preferences { filters: _filters }
  });

  requestAnimationFrame(function () {
    requestAnimationFrame(function () { overlay.classList.add('open'); });
  });
}

function closeFilterModal() {
  var overlay = document.getElementById('filter-modal');
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(function () { if (overlay) overlay.remove(); }, 300);
}


/*voiceeee */
var _recognition = null;
var _isListening = false;

function startVoiceInput() {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { Design.showToast('Voice not supported on this browser', 'red'); return; }
  if (_isListening) { stopVoiceInput(); return; }

  _recognition = new SpeechRecognition();
  _recognition.lang = 'en-PH';
  _recognition.continuous = false;
  _recognition.interimResults = false;
  _recognition.maxAlternatives = 1;

  _recognition.onstart  = function () { _isListening = true;  setVoiceBtnListening(true);  Design.showToast('Listening…', 'teal'); };
  _recognition.onresult = function (e) {
    var t = e.results[0][0].transcript;
    Design.setDestination(t);
    Design.showToast('Got: "' + t + '"', 'green');
    setTimeout(function () { Design.searchRoutes(); }, 400);
  };
  _recognition.onerror  = function (e) {
    _isListening = false; setVoiceBtnListening(false);
    if (e.error === 'not-allowed') Design.showToast('Microphone access denied', 'red');
    else if (e.error !== 'no-speech') Design.showToast('Voice error: ' + e.error, 'red');
  };
  _recognition.onend    = function () { _isListening = false; setVoiceBtnListening(false); };
  _recognition.start();
}

function stopVoiceInput() {
  if (_recognition) { _recognition.stop(); _recognition = null; }
  _isListening = false;
  setVoiceBtnListening(false);
}

function setVoiceBtnListening(on) {
  var btn = document.getElementById('voice-btn');
  if (!btn) return;
  btn.classList.toggle('listening', on);
  btn.setAttribute('aria-label', on ? 'Stop listening' : 'Voice input');
}


/*EXPLORE PAGE EXTENSIONS (on window.Design)*/

Design.filters    = _filters;
Design.MOCK_ROUTES = MOCK_ROUTES;

/**
 * Populates the route cards from a data array.
 * Call this after your search API resolves.
 *
 * BACKEND: fetch('/api/routes/search', { method:'POST', ... })
 *   .then(r => r.json())
 *   .then(function(routes) { Design.loadRoutes(routes); Design.setState(2); });
 *
 * @param {object[]} routes — array matching MOCK_ROUTES shape
 */
Design.loadRoutes = function (routes) {
  renderRouteCards(routes);
};

/**
 * Changes the UI state between 4 modes.
 * @param {number} state — 1: initial, 2: suggestions, 3: details, 4: active route
 */
Design.setState = function (state) {
  var suggestionPanel = document.getElementById('suggestion-panel');
  var detailsPanel    = document.getElementById('details-panel');
  var searchHeader    = document.getElementById('search-header');
  var routeHeader     = document.getElementById('route-header');
  var filterChips     = document.getElementById('filter-chips');

  // Reset all panels — hide via transform (details-panel stays display:flex always)
  suggestionPanel.classList.remove('show');
  detailsPanel.classList.remove('show');
  suggestionPanel.style.display = 'none';
  searchHeader.style.display    = 'flex';
  routeHeader.style.display     = 'none';
  if (filterChips) filterChips.style.display = 'flex';

  switch (state) {
    case 1:
      clearRouteFromMap();
      break;
    case 2:
      suggestionPanel.style.display = 'block';
      setTimeout(function () { suggestionPanel.classList.add('show'); }, 10);
      break;
    case 3:
      // details-panel is always display:flex — just slide it up
      setTimeout(function () { detailsPanel.classList.add('show'); }, 10);
      break;
    case 4:
      searchHeader.style.display = 'none';
      routeHeader.style.display  = 'flex';
      if (filterChips) filterChips.style.display = 'none';
      // header content filled by Design.startNavigation()
      break;
  }
};

/**
 * Sets the destination input value.
 * @param {string} destination
 */
Design.setDestination = function (destination) {
  var input    = document.getElementById('destination-input');
  var clearBtn = document.getElementById('clear-btn');
  var backBtn  = document.getElementById('back-btn');
  var voiceBtn = document.getElementById('voice-btn');
  if (input)    input.value = destination;
  if (clearBtn) clearBtn.style.display = 'flex';
  if (backBtn)  backBtn.style.display  = 'flex';
  if (voiceBtn) voiceBtn.style.display = 'none';
};

/**
 * Triggers route search — loads mock data and moves to state 2.
 *
 * BACKEND: replace body with:
 *   fetch('/api/routes/search', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ destination: input.value, filters: Design.filters })
 *   })
 *   .then(r => r.json())
 *   .then(function(routes) { Design.loadRoutes(routes); Design.setState(2); });
 */
Design.searchRoutes = function () {
  var input = document.getElementById('destination-input');
  if (!input || !input.value.trim()) return;
  Design.showToast('Finding safe routes…', 'teal');
  Design.loadRoutes(MOCK_ROUTES);   // ── BACKEND: replace with real fetch above
  Design.setState(2);
};

/**
 * Starts navigation for the given route — transitions to state 4,
 * populates the header with route info, and shows the stop bar.
 *
 * MOCK: receives _activeRoute set when a card is clicked.
 *
 * BACKEND: call after POST /api/navigation/start resolves:
 *   fetch('/api/navigation/start', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ routeId: route.id, filters: Design.filters })
 *   })
 *   .then(r => r.json())
 *   .then(function(session) {
 *     Design.startNavigation({
 *       origin:      session.originLabel,   // e.g. 'Your Location'
 *       destination: session.destinationLabel,
 *       minutes:     session.estimatedMinutes,
 *     });
 *   });
 *
 * @param {object} navData
 *   @param {string} navData.origin       — start label
 *   @param {string} navData.destination  — end label
 *   @param {number} navData.minutes      — estimated travel time
 */
Design.startNavigation = function (navData) {
  Design.setState(4);

  var label    = document.getElementById('route-nav-label');
  var path     = document.getElementById('route-nav-path');
  var time     = document.getElementById('route-nav-time');
  var stopBar  = document.getElementById('route-stop-bar');

  if (label)   label.textContent = 'Taken Route';
  if (path)    path.textContent  = (navData.origin || 'Your Location') + ' → ' + (navData.destination || 'Destination');
  if (time)    time.textContent  = 'Est. ' + (navData.minutes || '—') + ' min';
  if (stopBar) stopBar.style.display = 'flex';
};

/**
 * Stops the active navigation session — returns to state 2,
 * hides the stop bar, and clears the route polyline.
 *
 * BACKEND: call before transitioning:
 *   fetch('/api/navigation/stop', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ routeId: _activeRoute && _activeRoute.id })
 *   }).then(function() { Design.stopNavigation(); });
 */
Design.stopNavigation = function () {
  var stopBar = document.getElementById('route-stop-bar');
  if (stopBar) stopBar.style.display = 'none';
  Design.setState(2);
  Design.showToast('Navigation stopped', 'red');
  // ── BACKEND: also call fetch above before invoking this
};


/*DOM WIRING*/
document.addEventListener('DOMContentLoaded', function () {

  if (!window.Design) {
    console.error('[Explore] window.Design not found — is shared.js loading?');
    return;
  }

  /*map*/
  try { initMap(); } catch (e) { console.error('[Explore] Map error:', e); }

  /* nav */
  Design.Nav.render('home');

  /* Initial state + survey filters
   * BACKEND: replace Design.getUser() with real fetch:
   *   fetch('/api/user/current').then(r=>r.json()).then(function(u){
   *     Design.setUser(u); initFiltersFromUser(u); renderChips();
   *   });
   */
  Design.setState(1);
  initFiltersFromUser(Design.getUser());
  renderChips();

  /*Pre-load route cards so state 2 is ready*/
  Design.loadRoutes(MOCK_ROUTES);

  /* Elements*/
  var destinationInput = document.getElementById('destination-input');
  var backBtn          = document.getElementById('back-btn');
  var clearBtn         = document.getElementById('clear-btn');
  var voiceBtn         = document.getElementById('voice-btn');
  var filterToggle     = document.getElementById('filter-toggle');
  var startRouteBtn    = document.getElementById('start-route-btn');
  var routeBackBtn     = document.getElementById('route-back-btn');
  var detailsBackBtn   = document.getElementById('details-back-btn');

  /*input*/
  if (destinationInput) {
    destinationInput.addEventListener('input', function () {
      var hasText = !!this.value.trim();
      if (clearBtn) clearBtn.style.display = hasText ? 'flex' : 'none';
      if (backBtn)  backBtn.style.display  = hasText ? 'flex' : 'none';
      if (voiceBtn) voiceBtn.style.display = hasText ? 'none' : 'flex';
    });
    destinationInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter' && this.value.trim()) { Design.searchRoutes(); this.blur(); }
    });
  }

  /* clear*/
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (destinationInput) destinationInput.value = '';
      clearBtn.style.display = 'none';
      if (backBtn)  backBtn.style.display  = 'none';
      if (voiceBtn) voiceBtn.style.display = 'flex';
      if (destinationInput) destinationInput.focus();
      Design.setState(1);
    });
  }

  /*back search bar */
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      Design.setState(1);
      if (destinationInput) destinationInput.value = '';
      clearBtn && (clearBtn.style.display = 'none');
      backBtn.style.display = 'none';
      if (voiceBtn) voiceBtn.style.display = 'flex';
      stopVoiceInput();
    });
  }

  /* voice*/
  if (voiceBtn) voiceBtn.addEventListener('click', startVoiceInput);

  /*filter tog*/
  if (filterToggle) filterToggle.addEventListener('click', buildFilterModal);

  /* details*/
  if (detailsBackBtn) {
    detailsBackBtn.addEventListener('click', function () {
      Design.setState(2);
    });
  }

  /*start route (s3 to s4) */
  if (startRouteBtn) {
    startRouteBtn.addEventListener('click', function () {
      var dest  = destinationInput ? destinationInput.value.trim() : 'Destination';
      var route = _activeRoute || {};
      // ── BACKEND: POST /api/navigation/start { routeId: route.id }
      // then call Design.startNavigation with the API response
      Design.startNavigation({
        origin:      'Your Location',
        destination: dest || route.modes || 'Destination',
        minutes:     route.minutes || '—',
      });
      Design.showToast('Navigation started', 'green');
    });
  }

  /*stop route (s4 to s2) */
  var stopRouteBtn = document.getElementById('stop-route-btn');
  if (stopRouteBtn) {
    stopRouteBtn.addEventListener('click', function () {
      // ── BACKEND: POST /api/navigation/stop { routeId: _activeRoute && _activeRoute.id }
      Design.stopNavigation();
    });
  }

});