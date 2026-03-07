"""
form_state.py
-------------
Bug Fix #3: Form clears after clicking "Find Safe Route".

Root cause: Standard HTML form POST causes a full page reload.
After render, fields are empty because the template doesn't echo back
the submitted values.

This file provides:
  1. extract_form_state(request) -> dict of last-submitted values
     to pass into render_template() so Jinja can repopulate the fields.
  2. get_form_repopulate_html_attrs(field, state) -> Jinja-friendly
     helper showing how to wire it in the template (returns attribute string).
  3. Docs on the AJAX alternative approach (no page reload at all).

Nothing runs on import.
"""

from flask import Request


def extract_form_state(request: Request) -> dict:
    """
    Pull submitted form values from a Flask POST request so they can be
    passed back into render_template() and re-displayed in the form.

    Args:
        request: Flask request object (must be POST)

    Returns:
        dict with keys: origin, destination, commuter_type
        Values default to empty string if not present.

    Usage in main.py home():
        state = extract_form_state(request)
        return render_template('index.html', ..., form_state=state)

    Usage in index.html:
        <input name="origin" value="{{ form_state.origin }}">
        <input name="destination" value="{{ form_state.destination }}">
        <select name="commuterType">
          <option value="car" {{ 'selected' if form_state.commuter_type == 'car' }}>Car</option>
          ...
        </select>
    """
    return {
        "origin":        request.form.get("origin", ""),
        "destination":   request.form.get("destination", ""),
        "commuter_type": request.form.get("commuterType", ""),
        # Coordinates if they were submitted via hidden fields (autocomplete fix)
        "origin_lat":    request.form.get("origin_lat", ""),
        "origin_lon":    request.form.get("origin_lon", ""),
        "dest_lat":      request.form.get("dest_lat", ""),
        "dest_lon":      request.form.get("dest_lon", ""),
    }


def get_empty_form_state() -> dict:
    """
    Returns a blank form state dict — use this on GET requests so the
    template always has a `form_state` variable available.

    Usage in main.py home():
        if request.method == 'GET':
            form_state = get_empty_form_state()
            return render_template('index.html', ..., form_state=form_state)
    """
    return {
        "origin":        "",
        "destination":   "",
        "commuter_type": "",
        "origin_lat":    "",
        "origin_lon":    "",
        "dest_lat":      "",
        "dest_lon":      "",
    }


def get_commuter_options(selected: str = "") -> list:
    """
    Returns the commuter type options list for building the <select> dropdown.
    Each item: {"value": str, "label": str, "selected": bool}

    Usage in index.html (Jinja):
        <select name="commuterType">
        {% for opt in commuter_options %}
          <option value="{{ opt.value }}" {{ 'selected' if opt.selected }}>
            {{ opt.label }}
          </option>
        {% endfor %}
        </select>

    Pass commuter_options=get_commuter_options(form_state.commuter_type)
    into render_template().
    """
    options = [
        ("commute",    "🚌 Commute (Jeepney / Bus / Tricycle)"),
        ("motorcycle", "🏍️ Motorcycle"),
        ("car",        "🚗 Private Car"),
        ("walk",       "🚶 Walk / Bicycle"),
        # Rail — kept separate since they need OSM routing
        ("lrt1",       "🚇 LRT-1 (Line 1)"),
        ("lrt2",       "🚇 LRT-2 (Line 2)"),
        ("mrt3",       "🚇 MRT-3 (Line 3)"),
        ("pnr",        "🚆 PNR"),
    ]

    sel = selected.lower().strip()
    return [
        {"value": v, "label": l, "selected": (v == sel)}
        for v, l in options
    ]


# ── AJAX alternative explanation ─────────────────────────────────────────────
AJAX_APPROACH_NOTES = """
Alternative approach (no page reload — cleaner UX):

Instead of the form doing a standard POST to '/', wire the submit button
to call /api/routes via fetch() and update the map + route panel in-place.

Pseudocode for index.html JS:

    document.getElementById('route-form').addEventListener('submit', async (e) => {
        e.preventDefault();   // <-- prevents page reload

        const payload = {
            origin:        document.getElementById('origin').value,
            destination:   document.getElementById('destination').value,
            commuterType:  document.getElementById('commuterType').value,
            originCoords:  { lat: ..., lon: ... },   // from hidden fields
            destCoords:    { lat: ..., lon: ... },
        };

        const res    = await fetch('/api/routes', {
            method:  'POST',
            headers: {'Content-Type': 'application/json'},
            body:    JSON.stringify(payload),
        });
        const data   = await res.json();
        // Re-render route panel without reloading page
        updateRoutePanel(data.routes);
    });

This pairs with autocomplete.py's hidden fields for lat/lon.
The /api/routes endpoint in main.py already supports this flow.
"""