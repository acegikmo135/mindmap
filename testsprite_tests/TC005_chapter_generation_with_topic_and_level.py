import requests
import os

def test_chapter_generation_with_topic_and_level():
    base_url = "http://localhost:3000/api/gemini"
    timeout = 30

    # Use a valid Supabase JWT Bearer token from environment variable or replace with valid token string
    token = os.getenv("SUPABASE_JWT_TOKEN", "your_valid_jwt_token_here")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Test data for successful generation with valid topic and level
    valid_payload = {
        "action": "generate-chapter",
        "topic": "Photosynthesis",
        "level": "Class 8"
    }

    # Test data for error case: missing topic
    missing_topic_payload = {
        "action": "generate-chapter",
        "level": "Class 8"
    }

    # 1. Test valid request returns 200 with JSON chapter object
    try:
        response = requests.post(base_url, json=valid_payload, headers=headers, timeout=timeout)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        response_json = response.json()
        assert "text" in response_json, "'text' key missing in response JSON"
        chapter_text = response_json["text"]
        # The text should be a JSON string representing chapter object - try to parse it
        import json
        chapter_obj = json.loads(chapter_text)
        assert isinstance(chapter_obj, dict), "Chapter object is not a dictionary"
        # Validate expected chapter fields according to PRD
        required_fields = ["title", "subject", "concepts"]
        for field in required_fields:
            assert field in chapter_obj, f"Field '{field}' missing in chapter object"
        assert isinstance(chapter_obj["concepts"], list), "'concepts' should be a list"
        assert 5 <= len(chapter_obj["concepts"]) <= 8, "Concepts count should be between 5 and 8"
        for concept in chapter_obj["concepts"]:
            assert "title" in concept, "Each concept must have 'title'"
            assert "estimatedMinutes" in concept, "Each concept must have 'estimatedMinutes'"
            assert "prerequisites" in concept, "Each concept must have 'prerequisites'"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    except ValueError as e:
        assert False, f"Response JSON parsing failed: {e}"

    # 2. Test missing topic returns 400 error
    try:
        response_missing_topic = requests.post(base_url, json=missing_topic_payload, headers=headers, timeout=timeout)
        assert response_missing_topic.status_code == 400, f"Expected 400, got {response_missing_topic.status_code}"
        resp_json = response_missing_topic.json()
        assert "error" in resp_json, "'error' key missing in response"
        assert resp_json["error"].lower() == "missing topic", f"Unexpected error message: {resp_json['error']}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_chapter_generation_with_topic_and_level()