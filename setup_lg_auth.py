#!/usr/bin/env python3
"""
LG ThinQ one-time authentication setup.
Requires only the Python standard library (no pip installs needed).

Run this once to get your refresh token, then add the output to appsettings.json.
"""
import base64, hashlib, json, os, secrets, sys, webbrowser
import urllib.parse, urllib.request

GATEWAY_URL = "https://route.lgthinq.com:46030/v1/service/application/gateway-uri"
FALLBACK_EU = {
    "thinq2Uri": "https://eu.api.s.lgsmarthome.com/",
    "empUri":    "https://eu.m.lgaccount.com/",
    "empSpxUri": "https://eu.m.lgaccount.com/emp/empSpx/",
}
CLIENT_ID   = "LGAO221A02"
COUNTRY     = "NL"
LANGUAGE    = "nl-NL"

OAUTH_LOGIN_HOST   = "us.m.lgaccount.com"
OAUTH_LOGIN_PATH   = "login/signIn"
OAUTH_REDIRECT_PATH = "login/iabClose"

GATEWAY_HEADERS = {
    "User-Agent":           "okhttp/3.14.9",
    "x-thinq-app-ver":      "3.6.1200",
    "x-thinq-app-type":     "NUTS",
    "x-thinq-app-level":    "PRD",
    "x-thinq-app-os":       "ANDROID",
    "x-thinq-app-logintype":"LGE",
    "x-service-phase":      "OP",
    "x-origin":             "APP-NS",
    "x-model-country":      COUNTRY,
    "x-country-code":       COUNTRY,
    "x-language-code":      LANGUAGE,
    "x-service-country":    COUNTRY,
    "x-service-language":   LANGUAGE,
    "x-client-id":          CLIENT_ID,
}

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def get_gateway():
    url = f"{GATEWAY_URL}?country={COUNTRY}&language={LANGUAGE}"
    req = urllib.request.Request(url, headers=GATEWAY_HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.load(r)
        res = data.get("result", data)
        gw = {
            "thinq2Uri": res["thinq2Uri"].rstrip("/") + "/",
            "empUri":    res["empUri"].rstrip("/")    + "/",
            "empSpxUri": res["empSpxUri"].rstrip("/") + "/",
        }
        print(f"✓ Gateway: {gw['empSpxUri']}")
        return gw
    except Exception as e:
        print(f"⚠  Gateway mislukt ({e}), EU-fallback gebruikt.")
        return FALLBACK_EU

def exchange_code(emp_uri, code, callback_url):
    body = urllib.parse.urlencode({
        "code":         code,
        "grant_type":   "authorization_code",
        "redirect_uri": callback_url,
        "client_id":    CLIENT_ID,
    }).encode()
    req = urllib.request.Request(
        f"{emp_uri}oauth/1.0/oauth2/token",
        data=body,
        method="POST",
        headers={
            "Content-Type":     "application/x-www-form-urlencoded",
            "User-Agent":       "okhttp/3.14.9",
            "x-country-code":   COUNTRY,
            "x-language-code":  LANGUAGE,
            "x-service-phase":  "OP",
            "x-origin":         "APP-NS",
        }
    )
    with urllib.request.urlopen(req) as r:
        return json.load(r)

def main():
    print("=" * 50)
    print("  LG ThinQ authenticatie setup")
    print("=" * 50)
    print()

    gw    = get_gateway()
    state = secrets.token_hex(10)

    # Redirect URL: registered iabClose URI on the same host as empSpxUri
    empspx_host  = urllib.parse.urlparse(gw["empSpxUri"]).netloc  # e.g. eu.m.lgaccount.com
    callback_url = f"https://{empspx_host}/{OAUTH_REDIRECT_PATH}"

    params = urllib.parse.urlencode({
        "country":               COUNTRY,
        "language":              LANGUAGE,
        "client_id":             CLIENT_ID,
        "svc_list":              "SVC202",
        "svc_integrated":        "Y",
        "show_thirdparty_login": "LGE,MYLG,GGL,AMZ,FBK,APPL",
        "division":              "ha",
        "callback_url":          callback_url,
        "oauth2State":           state,
        "show_select_country":   "N",
    })
    auth_url = f"https://{OAUTH_LOGIN_HOST}/{OAUTH_LOGIN_PATH}?{params}"

    print("Stap 1: LG-loginpagina openen in je browser...")
    print(f"        {auth_url}\n")
    webbrowser.open(auth_url)

    print("Stap 2: Log in bij LG (of via Google).")
    print()
    print("Stap 3: Na het inloggen wordt je doorgestuurd naar een pagina die er leeg uitziet.")
    print("        De URL in de adresbalk bevat de code. Kopieer die volledige URL.")
    print(f"        De URL begint met:  {callback_url}?code=...")
    print()

    raw = input("Plak hier de volledige URL: ").strip()

    parsed = urllib.parse.urlparse(raw)
    qs     = urllib.parse.parse_qs(parsed.query)
    code   = (qs.get("code")       or [""])[0]
    st     = (qs.get("oauth2State") or qs.get("state") or [""])[0]

    if not code:
        print("\n❌ Geen 'code' gevonden. Kopieer de volledige adresbalk-URL.")
        sys.exit(1)

    if st and st != state:
        print(f"⚠  State komt niet overeen. Doorgaan...")

    print("\nStap 4: Tokens ophalen...")
    try:
        tokens = exchange_code(gw["empUri"], code, callback_url)
    except Exception as e:
        print(f"\n❌ Token-uitwisseling mislukt: {e}")
        sys.exit(1)

    refresh = tokens.get("refresh_token", "")
    user_no = tokens.get("user_no", "")

    if not refresh:
        print("❌ Geen refresh_token ontvangen:", json.dumps(tokens, indent=2))
        sys.exit(1)

    config_block = {
        "LgThinQ": {
            "Country":      COUNTRY,
            "Language":     LANGUAGE,
            "RefreshToken": refresh,
            "UserNo":       user_no,
            "Thinq2Uri":    gw["thinq2Uri"],
            "LgeapiUrl":    gw["empUri"],
        }
    }

    out_file = os.path.join(os.path.dirname(__file__), "lg_tokens_setup.json")
    with open(out_file, "w") as f:
        json.dump(config_block, f, indent=2)

    print("\n✅ Gelukt!\n")
    print("Voeg dit toe aan HomeDashboard.Api/appsettings.json")
    print("(of appsettings.Development.json):\n")
    print(json.dumps(config_block, indent=2))
    print(f"\n(Ook opgeslagen in: {out_file})")

if __name__ == "__main__":
    main()
