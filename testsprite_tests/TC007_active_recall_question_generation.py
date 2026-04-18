import requests

BASE_URL = "http://localhost:3000/api/gemini"
TIMEOUT = 30

# Replace this with a valid Supabase JWT token for authentication
VALID_JWT = "your_valid_supabase_jwt_here"

def test_active_recall_question_generation():
    headers = {
        "Authorization": f"Bearer {VALID_JWT}",
        "Content-Type": "application/json"
    }

    # Test with valid conceptTitle and context
    valid_payload = {
        "action": "generate-question",
        "conceptTitle": "Conservation of Energy",
        "context": "chapter summary"
    }
    try:
        response = requests.post(BASE_URL, json=valid_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        json_data = response.json()
        assert "text" in json_data, "Response JSON missing 'text' field"
        assert isinstance(json_data["text"], str), "The 'text' field is not a string"
        assert len(json_data["text"].strip()) > 0, "The 'text' field is empty"
    except requests.RequestException as e:
        assert False, f"Request error occurred: {e}"

    # Test with missing conceptTitle (empty string)
    invalid_payload = {
        "action": "generate-question",
        "conceptTitle": "",
        "context": "chapter summary"
    }
    try:
        response = requests.post(BASE_URL, json=invalid_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 400, f"Expected 400 Bad Request for missing conceptTitle, got {response.status_code}"
        json_data = response.json()
        assert "error" in json_data, "Error response missing 'error' field"
        # Use case-insensitive comparison with expected error message
        assert json_data["error"].lower() == "missing concepttitle", f"Unexpected error message: {json_data['error']}"
    except requests.RequestException as e:
        assert False, f"Request error occurred: {e}"

test_active_recall_question_generation()
