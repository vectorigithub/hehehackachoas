"""
autocomplete.py
---------------
Bug Fix #2: No suggestions when typing in location fields.

The /api/suggest endpoint already exists in main.py and works correctly.
The problem is the frontend (index.html) doesn't call it and render a dropdown.

This file provides:
  1. get_suggest_js() -> returns the JS snippet to inject into index.html
     (inline <script> tag content, no external dependencies)
  2. validate_suggest_response() -> utility to sanitise Nominatim results
     server-side before they're returned to the frontend.

Nothing runs on import. Call these functions explicitly.
"""


def validate_suggest_response(nominatim_results: list) -> list:
    """
    Sanitise raw Nominatim JSON results into a clean list for the frontend.

    Args:
        nominatim_results: raw list from Nominatim /search

    Returns:
        List of dicts: [{display_name, lat, lon, short_name}]
    """
    cleaned = []
    for item in nominatim_results:
        try:
            display = item.get("display_name", "")
            lat = float(item.get("lat", 0))
            lon = float(item.get("lon", 0))

            # Build a shorter label: first 2 comma-parts of display_name
            parts = [p.strip() for p in display.split(",")]
            short = ", ".join(parts[:2]) if len(parts) >= 2 else display

            cleaned.append({
                "display_name": display,
                "short_name": short,
                "lat": lat,
                "lon": lon,
            })
        except (ValueError, TypeError, AttributeError):
            continue
    return cleaned


def get_suggest_js() -> str:
    """
    Returns a self-contained JS snippet that:
      - Watches the #origin and #destination input fields
      - Debounces keyup (300ms) and calls /api/suggest?q=...
      - Renders a <ul> dropdown beneath each input
      - On selection: fills the input, stores lat/lon in hidden fields,
        and fires a 'draw_marker' postMessage to the map iframe

    Inject this inside a <script> tag at the bottom of index.html.
    Hidden inputs required in the form:
        <input type="hidden" id="origin_lat" name="origin_lat">
        <input type="hidden" id="origin_lon" name="origin_lon">
        <input type="hidden" id="dest_lat"   name="dest_lat">
        <input type="hidden" id="dest_lon"   name="dest_lon">
    """
    return r"""
// ── SafeRoute Autocomplete (Bug Fix #2) ─────────────────────────────────────

(function () {
    const SUGGEST_URL = '/api/suggest';
    const DEBOUNCE_MS = 300;

    function debounce(fn, ms) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    function removeDropdown(inputEl) {
        const existing = document.getElementById('ac-' + inputEl.id);
        if (existing) existing.remove();
    }

    function buildDropdown(inputEl, suggestions, latHiddenId, lonHiddenId, markerKind) {
        removeDropdown(inputEl);
        if (!suggestions.length) return;

        const ul = document.createElement('ul');
        ul.id = 'ac-' + inputEl.id;
        ul.style.cssText = [
            'position:absolute',
            'z-index:9999',
            'background:#fff',
            'border:1px solid #ccc',
            'border-radius:4px',
            'list-style:none',
            'margin:0',
            'padding:4px 0',
            'width:' + inputEl.offsetWidth + 'px',
            'max-height:220px',
            'overflow-y:auto',
            'box-shadow:0 4px 12px rgba(0,0,0,0.15)',
            'font-size:13px',
        ].join(';');

        // Position just below the input
        const rect = inputEl.getBoundingClientRect();
        ul.style.top  = (window.scrollY + rect.bottom) + 'px';
        ul.style.left = (window.scrollX + rect.left)   + 'px';

        suggestions.forEach(function (s) {
            const li = document.createElement('li');
            li.style.cssText = 'padding:8px 12px;cursor:pointer;color:#333;';
            li.textContent = s.short_name;
            li.title       = s.display_name;

            li.addEventListener('mouseenter', function () {
                li.style.background = '#f0f4ff';
            });
            li.addEventListener('mouseleave', function () {
                li.style.background = '';
            });

            li.addEventListener('mousedown', function (e) {
                // mousedown fires before blur so we can fill before dropdown closes
                e.preventDefault();
                inputEl.value = s.display_name;
                document.getElementById(latHiddenId).value = s.lat;
                document.getElementById(lonHiddenId).value = s.lon;
                removeDropdown(inputEl);

                // Tell the map iframe to draw a marker
                const mapFrame = document.querySelector('iframe');
                if (mapFrame) {
                    mapFrame.contentWindow.postMessage({
                        type: 'draw_marker',
                        kind: markerKind,
                        lat: parseFloat(s.lat),
                        lng: parseFloat(s.lon),
                    }, '*');
                }
            });

            ul.appendChild(li);
        });

        document.body.appendChild(ul);
    }

    function attachAutocomplete(inputId, latHiddenId, lonHiddenId, markerKind) {
        const inputEl = document.getElementById(inputId);
        if (!inputEl) return;

        const doSearch = debounce(async function () {
            const q = inputEl.value.trim();
            if (q.length < 3) { removeDropdown(inputEl); return; }

            try {
                const res  = await fetch(SUGGEST_URL + '?q=' + encodeURIComponent(q));
                const raw  = await res.json();

                // Clean up: deduplicate by display_name, take top 5
                const seen = new Set();
                const suggestions = [];
                for (const item of raw) {
                    if (!seen.has(item.display_name)) {
                        seen.add(item.display_name);
                        const parts = item.display_name.split(',');
                        suggestions.push({
                            display_name: item.display_name,
                            short_name: parts.slice(0, 2).join(',').trim(),
                            lat: item.lat,
                            lon: item.lon,
                        });
                        if (suggestions.length >= 5) break;
                    }
                }
                buildDropdown(inputEl, suggestions, latHiddenId, lonHiddenId, markerKind);
            } catch (err) {
                console.warn('[autocomplete] fetch failed:', err);
            }
        }, DEBOUNCE_MS);

        inputEl.addEventListener('keyup', doSearch);
        inputEl.addEventListener('focus', doSearch);
        inputEl.addEventListener('blur',  function () {
            // Small delay so mousedown on a suggestion can fire first
            setTimeout(() => removeDropdown(inputEl), 200);
        });
    }

    // Wire up both fields once DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        attachAutocomplete('origin',      'origin_lat', 'origin_lon', 'origin');
        attachAutocomplete('destination', 'dest_lat',   'dest_lon',   'destination');
    });
})();
"""


def get_hidden_fields_html() -> str:
    """
    Returns the HTML for the 4 hidden fields that must be added to the
    route search form in index.html so lat/lon values are submitted.

    Paste this inside the <form> tag alongside the visible inputs.
    """
    return (
        '<input type="hidden" id="origin_lat" name="origin_lat">\n'
        '<input type="hidden" id="origin_lon" name="origin_lon">\n'
        '<input type="hidden" id="dest_lat"   name="dest_lat">\n'
        '<input type="hidden" id="dest_lon"   name="dest_lon">\n'
    )