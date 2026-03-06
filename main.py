from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
from navigation import geocode_location, get_navigation_data
from branca.element import Element 
from folium import plugins
import requests
import folium

# ── Bug fixes from condemnation/ ─────────────────────────────────────────────
from condemnation.autocomplete import validate_suggest_response, get_suggest_js
from condemnation.form_state import extract_form_state, get_empty_form_state, get_commuter_options
from condemnation.features import (
    get_typhoon_signal, get_banner_html,
    is_nighttime, get_night_banner_html,
)

# ── NEW: Weather, NOAH, User Data ─────────────────────────────────────────────
from condemnation.weather import get_weather_risk, get_weather_banner_html, apply_weather_to_routes
from condemnation.noah import add_noah_flood_layer, get_flood_risk_at, get_flood_warning_html
from condemnation.user_data import (
    init_user_tables, get_user_settings, save_user_settings,
    save_route_history, get_route_history, clear_route_history,
    get_user_profile, save_user_profile, change_password,
    extract_settings_from_form, get_settings_page_html, get_history_page_html,
)

USE_MYSQL = False 

if USE_MYSQL:
    from db_opt import msql 
    chDB_perf = msql()
else:
    from db_opt import nsql
    chDB_perf = nsql()

chDB_perf.init_db()
init_user_tables(chDB_perf)  # NEW: creates user_settings, route_history, user_profile tables

app = Flask(__name__)
app.secret_key = 'saferoute_super_secret_key'

def get_base_map(center_lat=14.605, center_lon=120.985, zoom=13):
    m = folium.Map(location=[center_lat, center_lon], zoom_start=zoom, tiles="OpenStreetMap")
    
    # Folium Plugin: Live Tracking
    plugins.LocateControl(auto_start=False, strings={"title": "Use my current location"}).add_to(m)
    
    # Javascript for Click Listener (Communicates with Parent Window)
    click_js = """
    <script>
        var originMarker = null;
        var destMarker = null;
        var greenIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });
        var redIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        setTimeout(function() {
            var map_instance = window['{{MAP_ID}}'];
            if (map_instance) {
                map_instance.on('click', function(e) {
                    window.parent.postMessage({
                        type: 'map_click',
                        lat: e.latlng.lat,
                        lng: e.latlng.lng
                    }, '*');
                });

                window.addEventListener("message", function(event) {
                    if (event.data && event.data.type === 'draw_marker') {
                        var coords = [event.data.lat, event.data.lng];
                        if (event.data.kind === 'origin') {
                            if (originMarker) map_instance.removeLayer(originMarker);
                            originMarker = L.marker(coords, {icon: greenIcon, interactive: false}).addTo(map_instance);
                        } else if (event.data.kind === 'destination') {
                            if (destMarker) map_instance.removeLayer(destMarker);
                            destMarker = L.marker(coords, {icon: redIcon, interactive: false}).addTo(map_instance);
                        }
                    }
                });
            }
        }, 1000);
    </script>
    """.replace('{{MAP_ID}}', m.get_name())
    
    m.get_root().html.add_child(Element(click_js))
    return m


def _draw_train_route(route, m):
    """Draw track polyline + ordered station markers for a train route."""
    route_layer = folium.FeatureGroup(name=route['name'])

    # ── Track polyline ──
    for segment in route.get('coords', []):
        if len(segment) >= 2:
            folium.PolyLine(
                locations=segment,
                color="#8e44ad",
                weight=5,
                opacity=0.85,
                dash_array='10, 6',
                tooltip=route['name'],
            ).add_to(route_layer)

    # ── Station pins (ordered, from OSM relation) ──
    stations = route.get('stations', [])
    for idx, station in enumerate(stations):
        is_terminal = (idx == 0 or idx == len(stations) - 1)

        folium.CircleMarker(
            location=[station['lat'], station['lon']],
            radius=9 if is_terminal else 6,
            color="#8e44ad",
            weight=2,
            fill=True,
            fill_color="#ffffff",
            fill_opacity=1.0,
            tooltip=f"{'🔴 ' if is_terminal else ''}{station['name']}",
            popup=folium.Popup(
                f"<b>{station['name']}</b>"
                + ("<br><i>Terminal</i>" if is_terminal else ""),
                max_width=180,
            ),
        ).add_to(route_layer)

    route_layer.add_to(m)
    return route_layer


@app.route('/', methods=['GET', 'POST'])
def home():
    if 'user' not in session:
        return redirect(url_for('login'))
    
    routes_data = []
    m = get_base_map()
    form_state = get_empty_form_state()

    # NEW: load user settings so we can respect flood/weather toggle prefs
    user_settings = get_user_settings(chDB_perf, session['user'])

    # NEW: add NOAH flood layer to the base map (respects user setting)
    if user_settings.get('show_flood_overlay', True):
        add_noah_flood_layer(m)

    # NEW: defaults for banners in case it's a GET request
    weather_banner = ''
    flood_warning  = ''

    if request.method == 'POST':
        form_state = extract_form_state(request)
        origin_text = form_state['origin']
        dest_text = form_state['destination']
        commuter_type = form_state['commuter_type']

        orig_lon, orig_lat = geocode_location(origin_text)
        dest_lon, dest_lat = geocode_location(dest_text)

        if not orig_lon or not dest_lon:
            flash("Location not found. Please type a specific address.")
        else:
            # NEW: fetch weather at origin
            if user_settings.get('show_weather_banner', True):
                weather      = get_weather_risk(orig_lat, orig_lon)
                weather_banner = get_weather_banner_html(weather, commuter_type)
            else:
                weather = {'ok': False}

            # NEW: check flood risk at origin and destination
            flood_orig = get_flood_risk_at(orig_lat, orig_lon)
            flood_dest = get_flood_risk_at(dest_lat, dest_lon)
            # Only show flood warning if it's actually raining
            if weather.get('ok') and weather.get('risk_level') in ('rain', 'heavy_rain', 'storm', 'light_rain'):
                flood_warning = (
                    get_flood_warning_html(flood_orig, "your starting point") +
                    get_flood_warning_html(flood_dest, "your destination")
                )
            else:
                flood_warning = ''

            nav_response = get_navigation_data(
                orig_lon, orig_lat, dest_lon, dest_lat, commuter_type, []
            )
            
            if "error" in nav_response:
                flash(nav_response["error"])
            else:
                routes_data = nav_response.get("routes", [])

                # NEW: apply weather penalty to route safety scores
                if weather.get('ok'):
                    routes_data = apply_weather_to_routes(routes_data, weather, commuter_type)

                # NEW: save this search to history
                save_route_history(
                    chDB_perf, session['user'],
                    origin_text, dest_text, commuter_type, len(routes_data)
                )
                
                # Draw origin/destination markers
                if routes_data:
                    start_coord = [orig_lat, orig_lon]
                    end_coord   = [dest_lat, dest_lon]
                    marker_group = folium.FeatureGroup(name="Start & End Points")
                    folium.Marker(
                        start_coord, popup="Starting Point",
                        icon=folium.Icon(color="green", icon="play")
                    ).add_to(marker_group)
                    folium.Marker(
                        end_coord, popup="Destination",
                        icon=folium.Icon(color="red", icon="stop")
                    ).add_to(marker_group)
                    marker_group.add_to(m)
                    m.fit_bounds([start_coord, end_coord])

                # Draw routes
                for route in routes_data:
                    if route.get('type') == 'train':
                        _draw_train_route(route, m)
                    else:
                        route_layer = folium.FeatureGroup(name=route['name'])
                        folium.PolyLine(
                            locations=route['coords'],
                            color=route['color'],
                            weight=7 if route['id'] == 0 else 5,
                            opacity=0.9,
                            tooltip=f"{route['name']} ({route['time']})",
                        ).add_to(route_layer)
                        route_layer.add_to(m)

                if routes_data:
                    folium.LayerControl().add_to(m)

    map_html = m.get_root().render()
    typhoon        = get_typhoon_signal()
    typhoon_banner = get_banner_html(typhoon)
    commuter_type  = form_state.get('commuter_type', '')
    night_banner   = get_night_banner_html(commuter_type)
    return render_template(
        'index.html',
        user=session['user'],
        map_html=map_html,
        routes=routes_data,
        form_state=form_state,
        commuter_options=get_commuter_options(form_state['commuter_type']),
        suggest_js=get_suggest_js(),
        typhoon_banner=typhoon_banner,
        night_banner=night_banner,
        weather_banner=weather_banner,   # NEW
        flood_warning=flood_warning,     # NEW
    )


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        conn, c = chDB_perf.get_db_connection()
        chDB_perf.execute_query(c, "SELECT * FROM users WHERE username=?", (username,))
        if c.fetchone():
            flash("Username already exists.")
            c.close(); conn.close()
            return redirect(url_for('register'))
        hashed_pw = generate_password_hash(password)
        chDB_perf.execute_query(c, "INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_pw))
        conn.commit(); c.close(); conn.close()
        flash("Registration successful!"); return redirect(url_for('login'))
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        conn, c = chDB_perf.get_db_connection()
        chDB_perf.execute_query(c, "SELECT password FROM users WHERE username=?", (username,))
        user = c.fetchone()
        c.close(); conn.close()
        if user and check_password_hash(user[0], password):
            session['user'] = username
            return redirect(url_for('home'))
        else:
            flash("Invalid username or password.")
            return redirect(url_for('login'))
    return render_template('login.html')


@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))


# ── NEW: Settings route ───────────────────────────────────────────────────────

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    if 'user' not in session:
        return redirect(url_for('login'))
    flash_msg = ''
    if request.method == 'POST':
        # Handle profile sub-form (display name + email)
        if 'display_name' in request.form:
            save_user_profile(
                chDB_perf, session['user'],
                request.form.get('display_name', ''),
                request.form.get('email', ''),
            )
        # Handle general settings form
        if 'default_commuter_type' in request.form:
            s = extract_settings_from_form(request.form)
            save_user_settings(chDB_perf, session['user'], s)
        flash_msg = 'Settings saved.'
    user_settings = get_user_settings(chDB_perf, session['user'])
    profile       = get_user_profile(chDB_perf, session['user'])
    return get_settings_page_html(user_settings, profile, flash_msg)


# ── NEW: History routes ───────────────────────────────────────────────────────

@app.route('/history')
def history():
    if 'user' not in session:
        return redirect(url_for('login'))
    hist = get_route_history(chDB_perf, session['user'])
    return get_history_page_html(hist, session['user'])


@app.route('/history/clear', methods=['POST'])
def history_clear():
    if 'user' not in session:
        return redirect(url_for('login'))
    clear_route_history(chDB_perf, session['user'])
    hist = get_route_history(chDB_perf, session['user'])
    return get_history_page_html(hist, session['user'], flash_message='History cleared.')


# ── NEW: Password change route ────────────────────────────────────────────────

@app.route('/account/password', methods=['POST'])
def change_password_route():
    if 'user' not in session:
        return redirect(url_for('login'))
    result = change_password(
        chDB_perf, session['user'],
        request.form.get('old_password', ''),
        request.form.get('new_password', ''),
    )
    user_settings = get_user_settings(chDB_perf, session['user'])
    profile       = get_user_profile(chDB_perf, session['user'])
    return get_settings_page_html(user_settings, profile, result['message'])


@app.route('/api/suggest', methods=['GET'])
def suggest_location():
    query = request.args.get('q', '')
    if len(query) < 3:
        return jsonify([])
    url = (
        f"https://nominatim.openstreetmap.org/search"
        f"?q={query}&format=json&addressdetails=1&limit=5&countrycodes=ph"
    )
    headers = {'User-Agent': 'SafeRoute-Flask-App/1.0'}
    try:
        response = requests.get(url, headers=headers)
        cleaned = validate_suggest_response(response.json())
        return jsonify(cleaned)
    except Exception:
        return jsonify([])


@app.route('/api/reverse', methods=['GET'])
def reverse_geocode_api():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
    headers = {'User-Agent': 'SafeRoute-Flask-App/1.0'}
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        return jsonify({"address": data.get("display_name", f"{lat}, {lon}")})
    except Exception:
        return jsonify({"address": f"{lat}, {lon}"})


@app.route('/api/routes', methods=['POST'])
def get_routes():
    data = request.json
    origin_text    = data.get('origin')
    dest_text      = data.get('destination')
    commuter_type  = data.get('commuterType')
    orig_coords    = data.get('originCoords')
    dest_coords    = data.get('destCoords')

    if orig_coords:
        orig_lon, orig_lat = float(orig_coords['lon']), float(orig_coords['lat'])
    else:
        orig_lon, orig_lat = geocode_location(origin_text)
    
    if dest_coords:
        dest_lon, dest_lat = float(dest_coords['lon']), float(dest_coords['lat'])
    else:
        dest_lon, dest_lat = geocode_location(dest_text)

    if not orig_lon or not dest_lon:
        return jsonify({"error": "Location not found."}), 400

    nav_response = get_navigation_data(
        orig_lon, orig_lat, dest_lon, dest_lat, commuter_type, []
    )
    if "error" in nav_response:
        return jsonify({"error": nav_response["error"]}), 400

    return jsonify(nav_response)


if __name__ == '__main__':
    app.run(debug=True)