import requests

token = "pk.eyJ1IjoidXByaS1ub2FoIiwiYSI6ImNsZTZyMGdjYzAybGMzbmwxMHA4MnE0enMifQ.tuOhBGsN-M7JCPaUqZ0Hng"
url = "https://api.mapbox.com/v4/upri-noah.ph_fh_100yr_tls,upri-noah.ph_fh_nodata1_tls/tilequery/120.9842,14.5995.json"
params = {"radius": 0, "limit": 20, "access_token": token}

try:
    r = requests.get(url, params=params, timeout=8)
    print("Status:", r.status_code)
    print("Response:", r.text[:500])
except Exception as e:
    print("Error:", e)
