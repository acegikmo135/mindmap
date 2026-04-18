import requests
import json

BASE_URL = "http://localhost:3000"
API_PATH = "/api/gemini"
FULL_URL = BASE_URL + API_PATH
TIMEOUT = 30

# Replace this with a valid Supabase JWT for testing
VALID_JWT = "your_valid_supabase_jwt_token_here"

HEADERS = {
    "Authorization": f"Bearer {VALID_JWT}",
    "Content-Type": "application/json"
}

def test_flashcard_generation_with_concepts():
    """
    Confirm that POST /api/gemini with action 'generate-flashcards' and at least one concept 
    returns a 200 response with exactly 5 flashcards in JSON,
    and empty concepts array returns 400 error.
    """
    # Test payload with at least one concept
    payload_with_concepts = {
        "action": "generate-flashcards",
        "chapterTitle": "Fractions",
        "concepts": ["adding fractions", "simplifying"]
    }
    
    # Test payload with empty concepts array
    payload_empty_concepts = {
        "action": "generate-flashcards",
        "chapterTitle": "Fractions",
        "concepts": []
    }
    
    # 1) Test success case with concepts
    try:
        response = requests.post(
            FULL_URL,
            headers=HEADERS,
            json=payload_with_concepts,
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Expected 200 but got {response.status_code}"
        response_json = response.json()
        assert "text" in response_json, "'text' field missing in response JSON"
        try:
            flashcards = json.loads(response_json["text"])
        except Exception as e:
            raise AssertionError(f"Response text is not valid JSON: {e}")
        assert isinstance(flashcards, list), "Flashcards response is not a list"
        assert len(flashcards) == 5, f"Expected exactly 5 flashcards but got {len(flashcards)}"
        for card in flashcards:
            assert isinstance(card, dict), "Each flashcard should be a dictionary"
            assert "front" in card and "back" in card, "Flashcard missing 'front' or 'back' keys"
            assert isinstance(card["front"], str), "'front' of flashcard is not a string"
            assert isinstance(card["back"], str), "'back' of flashcard is not a string"
    except requests.RequestException as e:
        raise AssertionError(f"HTTP request failed during success case: {e}")
    
    # 2) Test error case with empty concepts array
    try:
        response = requests.post(
            FULL_URL,
            headers=HEADERS,
            json=payload_empty_concepts,
            timeout=TIMEOUT
        )
        assert response.status_code == 400, f"Expected 400 but got {response.status_code}"
        response_json = response.json()
        assert "error" in response_json, "'error' key missing in 400 response"
        assert response_json["error"].lower() == "at least one concept is required", \
            f"Unexpected error message: {response_json['error']}"
    except requests.RequestException as e:
        raise AssertionError(f"HTTP request failed during error case: {e}")

test_flashcard_generation_with_concepts()