import requests

BASE_URL = "http://localhost:3000"
API_PATH = "/api/gemini"
FULL_URL = BASE_URL + API_PATH
TIMEOUT = 30


def test_jwt_authentication_middleware_verification():
    headers_no_auth = {
        "Content-Type": "application/json"
    }
    headers_invalid_auth = {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid.token.value"
    }
    payload = {
        "action": "explain",
        "chapterTitle": "Linear Equations",
        "concepts": "two variables, substitution",
        "length": "STANDARD",
        "depth": "INTERMEDIATE"
    }

    # Request without Authorization header
    response_no_auth = None
    try:
        response_no_auth = requests.post(FULL_URL, json=payload, headers=headers_no_auth, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request without Authorization header raised an exception: {e}"

    assert response_no_auth is not None, "No response received for request without Authorization header."
    assert response_no_auth.status_code == 401, f"Expected 401 Unauthorized for missing token, got {response_no_auth.status_code}"
    json_no_auth = response_no_auth.json()
    assert "error" in json_no_auth and json_no_auth["error"] == "Unauthorized", f"Expected error 'Unauthorized', got {json_no_auth}"

    # Request with invalid Authorization token
    response_invalid_auth = None
    try:
        response_invalid_auth = requests.post(FULL_URL, json=payload, headers=headers_invalid_auth, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request with invalid Authorization token raised an exception: {e}"

    assert response_invalid_auth is not None, "No response received for request with invalid Authorization token."
    assert response_invalid_auth.status_code == 401, f"Expected 401 Unauthorized for invalid token, got {response_invalid_auth.status_code}"
    json_invalid_auth = response_invalid_auth.json()
    assert "error" in json_invalid_auth and json_invalid_auth["error"] == "Unauthorized", f"Expected error 'Unauthorized', got {json_invalid_auth}"


test_jwt_authentication_middleware_verification()