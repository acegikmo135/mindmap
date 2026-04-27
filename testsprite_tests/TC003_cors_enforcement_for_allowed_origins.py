import requests

BASE_URL = "http://localhost:3000"
API_PATH = "/api/gemini"
TIMEOUT = 30

# Replace this with a valid Supabase JWT token for authentication
VALID_SUPABASE_JWT = "<valid_supabase_jwt>"

# Example allowed origins for testing - adjust these as per environment setup
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://allowed-origin.example.com",
    "https://vercel-url.example.com",
    "https://vercel-branch-url.example.com"
]

# An origin that is not allowed
UNKNOWN_ORIGIN = "http://unknown-origin.example.com"


def test_cors_enforcement_for_allowed_origins():
    headers_common = {
        # Removed Authorization header for OPTIONS as per CORS preflight typical usage
    }

    # Test OPTIONS method with allowed origins - should succeed with CORS headers
    for origin in ALLOWED_ORIGINS:
        headers = {
            "Origin": origin,
            **headers_common
        }
        try:
            resp = requests.options(
                BASE_URL + API_PATH,
                headers=headers,
                timeout=TIMEOUT
            )
        except requests.RequestException as e:
            assert False, f"OPTIONS request to {API_PATH} failed for origin {origin}: {e}"
        # Should be 200 OK for allowed origin preflight
        assert resp.status_code == 200, f"Expected 200 for OPTIONS from allowed origin {origin}, got {resp.status_code}"
        # Normalize headers keys lowercased
        headers_lower = {k.lower(): v for k, v in resp.headers.items()}
        # Check for presence of Access-Control-Allow-Origin header in a case insensitive way
        assert any(h.startswith('access-control-allow-') for h in headers_lower.keys()), f"CORS headers missing for OPTIONS from origin {origin}"
        # The allowed origin should be echoed in the header if present
        allow_origin = headers_lower.get('access-control-allow-origin')
        if allow_origin is not None:
            assert allow_origin == origin or allow_origin == "*", f"Unexpected Access-Control-Allow-Origin header: {allow_origin}"

    # Test POST method with allowed origins - should succeed (200) and include CORS headers
    post_body = {
        "action": "explain",
        "chapterTitle": "Test Chapter",
        "concepts": "test concept",
        "length": "STANDARD",
        "depth": "BASIC"
    }
    for origin in ALLOWED_ORIGINS:
        headers = {
            "Authorization": f"Bearer {VALID_SUPABASE_JWT}",
            "Origin": origin,
            "Content-Type": "application/json"
        }
        try:
            resp = requests.post(
                BASE_URL + API_PATH,
                headers=headers,
                json=post_body,
                timeout=TIMEOUT
            )
        except requests.RequestException as e:
            assert False, f"POST request to {API_PATH} failed for allowed origin {origin}: {e}"
        # Expect 200 success for allowed origin
        assert resp.status_code == 200, f"Expected 200 for POST from allowed origin {origin}, got {resp.status_code}"
        # The Access-Control-Allow-Origin header should be present and equal to the origin
        allow_origin = resp.headers.get("access-control-allow-origin")
        assert allow_origin == origin or allow_origin == "*", f"Unexpected Access-Control-Allow-Origin header for POST from origin {origin}: {allow_origin}"
        # Response JSON must contain expected key `text` for explain action
        resp_json = resp.json()
        assert "text" in resp_json, f"Expected 'text' in response for POST from allowed origin {origin}"

    # Test POST method with unknown origin - should be 403 forbidden
    headers = {
        "Authorization": f"Bearer {VALID_SUPABASE_JWT}",
        "Origin": UNKNOWN_ORIGIN,
        "Content-Type": "application/json"
    }
    post_body_unknown = {
        "action": "explain",
        "chapterTitle": "Test Chapter",
        "concepts": "test concept",
        "length": "STANDARD",
        "depth": "BASIC"
    }
    try:
        resp_unknown = requests.post(
            BASE_URL + API_PATH,
            headers=headers,
            json=post_body_unknown,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"POST request to {API_PATH} failed for unknown origin {UNKNOWN_ORIGIN}: {e}"
    # Expect 403 Forbidden for unknown origin
    assert resp_unknown.status_code == 403, f"Expected 403 for POST from unknown origin, got {resp_unknown.status_code}"
    resp_json_unknown = resp_unknown.json()
    assert "error" in resp_json_unknown, "Expected 'error' key in 403 response"
    assert resp_json_unknown["error"].lower() == "origin not allowed", f"Unexpected error message for unknown origin: {resp_json_unknown['error']}"


test_cors_enforcement_for_allowed_origins()
