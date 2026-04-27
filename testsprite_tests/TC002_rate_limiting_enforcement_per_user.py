import requests
import time

BASE_URL = "http://localhost:3000/api/gemini"
TIMEOUT = 30

# TODO: Replace this with a valid Supabase JWT token for testing
VALID_SUPABASE_JWT = "your_valid_supabase_jwt_here"

HEADERS = {
    "Authorization": f"Bearer {VALID_SUPABASE_JWT}",
    "Content-Type": "application/json",
}


def test_rate_limiting_enforcement_per_user():
    """
    Test that the in-memory rate limiter allows up to 20 POST /api/gemini requests per
    60-second window per authenticated user returning 200, and the 21st request
    returns 429 Too Many Requests error.
    """
    action_payload = {
        "action": "explain",
        "chapterTitle": "Linear Equations",
        "concepts": "two variables, substitution",
        "length": "STANDARD",
        "depth": "INTERMEDIATE",
    }

    success_count = 0
    error_429_received = False

    try:
        for i in range(1, 22):  # 21 requests, last should be 429
            response = requests.post(
                BASE_URL, headers=HEADERS, json=action_payload, timeout=TIMEOUT
            )
            if i <= 20:
                # Expect HTTP 200 success
                assert response.status_code == 200, (
                    f"Request {i}: Expected status 200, got {response.status_code}. "
                    f"Response: {response.text}"
                )
                # Basic check for JSON 'text' field in body
                json_resp = response.json()
                assert "text" in json_resp and isinstance(json_resp["text"], str) and len(json_resp["text"]) > 0, (
                    f"Request {i}: Response JSON missing or invalid 'text' field."
                )
                success_count += 1
            else:
                # 21st request should be blocked with 429
                assert response.status_code == 429, (
                    f"Request {i}: Expected status 429, got {response.status_code}. "
                    f"Response: {response.text}"
                )
                json_resp = response.json()
                assert "error" in json_resp and (
                    "Too many requests" in json_resp["error"] or "too many requests" in json_resp["error"]
                ), "Expected error message about too many requests."
                error_429_received = True

    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

    assert success_count == 20, f"Expected 20 successful requests, got {success_count}."
    assert error_429_received, "Did not receive 429 Too Many Requests on 21st request."


test_rate_limiting_enforcement_per_user()
