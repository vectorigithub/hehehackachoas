"""
routing_profiles.py
--------------------
Routing via OpenRouteService (ORS) API.
Free tier: 2,000 requests/day — no self-hosting needed.

Get a free API key at: https://openrouteservice.org/dev/#/signup
Add to your .env file: ORS_API_KEY=your_key_here

ORS profiles used:
  - driving-car      -> car, tricycle, jeepney, bus, commute
  - cycling-regular  -> bike, bicycle
  - cycling-mountain -> motorcycle (avoids motorways)
  - foot-walking     -> walk

Nothing runs on import.
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

_ORS_BASE = "https://api.openrouteservice.org/v2/directions"
_ORS_KEY  = os.getenv("ORS_API_KEY", "")

# ── Commuter type -> ORS profile ─────────────────────────────────────────────

_PROFILE_MAP = {
    "walk":       "foot-walking",
    "walking":    "foot-walking",
    "bike":       "cycling-regular",
    "bicycle":    "cycling-regular",
    "motorcycle": "cycling-mountain",
    "motorbike":  "cycling-mountain",
    "car":        "driving-car",
    "automobile": "driving-car",
    "commute":    "driving-car",
    "tricycle":   "driving-car",
    "jeepney":    "driving-car",
    "bus":        "driving-car",
    "puj":        "driving-car",
}

# ── Display colors per commuter type ─────────────────────────────────────────

_COLOR_MAP = {
    "walk":       ["#27ae60", "#2ecc71", "#1abc9c"],
    "walking":    ["#27ae60", "#2ecc71", "#1abc9c"],
    "bike":       ["#f39c12", "#e67e22", "#d35400"],
    "bicycle":    ["#f39c12", "#e67e22", "#d35400"],
    "motorcycle": ["#8e44ad", "#9b59b6", "#6c3483"],
    "motorbike":  ["#8e44ad", "#9b59b6", "#6c3483"],
    "car":        ["#2980b9", "#3498db", "#1a6ea8"],
    "automobile": ["#2980b9", "#3498db", "#1a6ea8"],
    "tricycle":   ["#c0392b", "#e74c3c", "#a93226"],
    "jeepney":    ["#16a085", "#1abc9c", "#0e7a63"],
    "bus":        ["#2c3e50", "#34495e", "#1a252f"],
    "commute":    ["#16a085", "#1abc9c", "#0e7a63"],
}

_DEFAULT_COLORS = ["#3498db", "#f1c40f", "#2ecc71"]

# Road features to avoid per commuter type
# ORS supports: highways, tollways, ferries, tunnels, fords
_AVOID_MAP = {
    "commute":  ["highways", "tollways"],
    "tricycle": ["highways", "tollways"],
    "jeepney":  ["highways", "tollways"],
    "bus":      ["tollways"],          # buses can use some highways
    "puj":      ["highways", "tollways"],
    "motorcycle": ["highways", "tollways"],
    "motorbike":  ["highways", "tollways"],
}


def normalise_type(commuter_type: str) -> str:
    return commuter_type.lower().strip()


def get_ors_profile(commuter_type: str) -> str:
    return _PROFILE_MAP.get(normalise_type(commuter_type), "driving-car")


def get_route_colors(commuter_type: str) -> list:
    return _COLOR_MAP.get(normalise_type(commuter_type), _DEFAULT_COLORS)


def is_train_type(commuter_type: str) -> bool:
    key = normalise_type(commuter_type)
    return any(k in key for k in ["train", "lrt", "mrt", "pnr", "rail", "line"])


def _decode_polyline(encoded: str) -> list:
    """
    Decodes an ORS encoded polyline string into [[lat, lon], ...].
    ORS uses standard Google polyline encoding at precision 5.
    """
    coords = []
    index  = 0
    lat    = 0
    lng    = 0

    while index < len(encoded):
        result = 0
        shift  = 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift  += 5
            if b < 0x20:
                break
        lat += (~(result >> 1) if (result & 1) else (result >> 1))

        result = 0
        shift  = 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift  += 5
            if b < 0x20:
                break
        lng += (~(result >> 1) if (result & 1) else (result >> 1))

        coords.append([lat / 1e5, lng / 1e5])

    return coords


def fetch_ors_routes(orig_lon, orig_lat, dest_lon, dest_lat, commuter_type: str) -> dict:
    """
    Call ORS Directions API and return up to 3 route alternatives.

    Returns:
        {"routes": [{coords, duration, distance}, ...]}
        or {"error": "message"}
    """
    if not _ORS_KEY:
        return {"error": "ORS_API_KEY not set in .env file. Get a free key at openrouteservice.org"}

    profile = get_ors_profile(commuter_type)
    url     = f"{_ORS_BASE}/{profile}"

    body = {
        "coordinates": [
            [orig_lon, orig_lat],
            [dest_lon, dest_lat],
        ],
        "alternative_routes": {
            "target_count": 3,
            "weight_factor": 1.6,
            "share_factor":  0.6,
        },
        "geometry":     True,
        "instructions": False,
        "units":        "km",
    }

    # Block highways/tollways for commute types that can't use NLEX/SLEX
    avoid = _AVOID_MAP.get(normalise_type(commuter_type))
    if avoid:
        body["options"] = {"avoid_features": avoid}
        print(f"[ors] Avoiding: {avoid}")

    headers = {
        "Authorization": _ORS_KEY,
        "Content-Type":  "application/json",
        "User-Agent":    "SafeRoute/1.0",
    }

    try:
        print(f"[ors] profile={profile} | {orig_lon},{orig_lat} -> {dest_lon},{dest_lat}")
        resp = requests.post(url, json=body, headers=headers, timeout=15)
        print(f"[ors] HTTP {resp.status_code}")

        if resp.status_code == 401:
            return {"error": "ORS API key is invalid or expired. Check your .env file."}
        if resp.status_code == 403:
            return {"error": "ORS daily quota exceeded (2,000 req/day on free tier)."}
        if resp.status_code == 404:
            return {"error": f"ORS could not find a route for '{profile}'."}

        data = resp.json()
        ors_routes = data.get("routes")
        if not ors_routes:
            msg = data.get("error", {}).get("message", "No route found.")
            return {"error": f"ORS: {msg}"}

        print(f"[ors] Got {len(ors_routes)} route(s)")

        results = []
        for r in ors_routes[:3]:
            geom = r.get("geometry", "")
            if isinstance(geom, str) and geom:
                coords = _decode_polyline(geom)
            elif isinstance(geom, dict):
                coords = [[pt[1], pt[0]] for pt in geom.get("coordinates", [])]
            else:
                coords = []

            summary  = r.get("summary", {})
            duration = summary.get("duration", 0)
            distance = summary.get("distance", 0)

            results.append({
                "coords":   coords,
                "duration": duration,
                "distance": distance,
            })

        return {"routes": results}

    except requests.exceptions.Timeout:
        return {"error": "ORS routing timed out. Try again."}
    except requests.exceptions.ConnectionError as e:
        print(f"[ors] Connection error: {e}")
        return {"error": "Could not reach OpenRouteService. Check your internet connection."}
    except Exception as e:
        print(f"[ors] Unexpected error: {e}")
        return {"error": f"Routing error: {str(e)}"}