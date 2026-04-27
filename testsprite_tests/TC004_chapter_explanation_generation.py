import requests
import re

BASE_URL = "http://localhost:3000"
API_PATH = "/api/gemini"
FULL_URL = BASE_URL + API_PATH
TIMEOUT = 30

# Replace with a valid Supabase JWT token for testing
VALID_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ValidTokenPlaceholder"
# Replace with an invalid token for negative test if needed
INVALID_JWT = "Invalid.JWT.Token"


def test_chapter_explanation_generation():
    headers = {
        "Authorization": f"Bearer {VALID_JWT}",
        "Content-Type": "application/json",
    }

    # Test case 1: Valid request with all required fields
    valid_payload = {
        "action": "explain",
        "chapterTitle": "Linear Equations",
        "concepts": "two variables, substitution",
        "length": "STANDARD",
        "depth": "INTERMEDIATE"
    }

    resp = requests.post(FULL_URL, json=valid_payload, headers=headers, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Expected status 200, got {resp.status_code}"
    data = resp.json()
    assert "text" in data, "Response missing 'text' field"
    explanation_text = data["text"]
    assert isinstance(explanation_text, str) and len(explanation_text) > 0, "'text' field must be non-empty string"

    # Check that the explanation likely contains markdown and LaTeX math support.
    # Look for markdown headers, bullet points or LaTeX delimiters like $...$ or $$...$$
    # This check is heuristic.
    markdown_patterns = [r"#{1,6} ", r"\* ", r"\$\$?.+?\$\$?"]
    assert any(re.search(pattern, explanation_text, re.DOTALL) for pattern in markdown_patterns), \
        "Explanation text does not appear to contain markdown or LaTeX math"

    # Test case 2: Missing 'action' field in payload
    payload_missing_action = {
        "chapterTitle": "Linear Equations",
        "concepts": "two variables, substitution",
        "length": "STANDARD",
        "depth": "INTERMEDIATE"
    }

    resp2 = requests.post(FULL_URL, json=payload_missing_action, headers=headers, timeout=TIMEOUT)
    assert resp2.status_code == 400, f"Expected status 400 for missing action, got {resp2.status_code}"
    data2 = resp2.json()
    assert "error" in data2, "Error response should contain 'error' field"
    assert data2["error"].lower() == "missing action", f"Expected error message 'Missing action', got '{data2['error']}'"


test_chapter_explanation_generation()