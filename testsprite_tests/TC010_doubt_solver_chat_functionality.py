import requests

BASE_URL = "http://localhost:3000"
API_PATH = "/api/gemini"
FULL_URL = BASE_URL + API_PATH
TIMEOUT = 30

# Replace with a valid Supabase JWT token for testing
VALID_JWT = "your_valid_supabase_jwt_here"

def test_doubt_solver_chat_functionality():
    headers = {
        "Authorization": f"Bearer {VALID_JWT}",
        "Content-Type": "application/json"
    }

    # Test case 1: Non-empty history returns 200 with AI chat reply
    payload_non_empty_history = {
        "action": "doubt",
        "history": [
            {"role": "user", "content": "How do I solve quadratic equations?"}
        ],
        "context": "Class 9, chapter: Quadratic Equations"
    }
    response = requests.post(FULL_URL, headers=headers, json=payload_non_empty_history, timeout=TIMEOUT)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    json_resp = response.json()
    assert "text" in json_resp, "Response JSON missing 'text' field"
    assert isinstance(json_resp["text"], str) and len(json_resp["text"].strip()) > 0, "AI chat reply text is empty"

    # Test case 2: Empty history returns 400 error
    payload_empty_history = {
        "action": "doubt",
        "history": [],
        "context": "Class 9"
    }
    response_err = requests.post(FULL_URL, headers=headers, json=payload_empty_history, timeout=TIMEOUT)
    assert response_err.status_code == 400, f"Expected 400, got {response_err.status_code}"
    json_err = response_err.json()
    assert "error" in json_err, "Expected 'error' field in response"
    assert json_err["error"] == "No message to respond to.", f"Unexpected error message: {json_err['error']}"

test_doubt_solver_chat_functionality()