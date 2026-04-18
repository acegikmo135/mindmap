import requests
import json

BASE_URL = "http://localhost:3000/api/gemini"
VALID_JWT = "valid_supabase_jwt_token_here"  # Replace with a valid Supabase JWT for execution
HEADERS = {
    "Authorization": f"Bearer {VALID_JWT}",
    "Content-Type": "application/json"
}
TIMEOUT = 30


def test_generate_mindmap_complexity_and_detail():
    # Test valid mind map generation request
    valid_payload = {
        "action": "generate-mindmap",
        "chapterTitle": "Newton's Laws",
        "complexity": "ADVANCED",
        "detail": "DETAILED"
    }

    try:
        response = requests.post(
            BASE_URL,
            headers=HEADERS,
            json=valid_payload,
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "text" in data, "Response JSON missing 'text' key"
        # Validate that the text is valid JSON representing mindmap
        mindmap_json = json.loads(data["text"])
        assert "rootTitle" in mindmap_json, "Mind map JSON missing 'rootTitle'"
        assert "nodes" in mindmap_json, "Mind map JSON missing 'nodes'"
        assert isinstance(mindmap_json["nodes"], list), "'nodes' is not a list"
        # Check node fields sample validation
        if mindmap_json["nodes"]:
            node = mindmap_json["nodes"][0]
            for key in ("id", "title", "description", "parentId", "type"):
                assert key in node, f"Mind map node missing '{key}'"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    except (ValueError, AssertionError) as e:
        assert False, f"Response validation failed: {e}"

    # Test invalid complexity value returns 400
    invalid_payload = {
        "action": "generate-mindmap",
        "chapterTitle": "Newton's Laws",
        "complexity": "UNKNOWN",
        "detail": "BRIEF"
    }
    try:
        response = requests.post(
            BASE_URL,
            headers=HEADERS,
            json=invalid_payload,
            timeout=TIMEOUT
        )
        assert response.status_code == 400, f"Expected 400 for invalid complexity, got {response.status_code}"
        data = response.json()
        assert "error" in data, "Error response missing 'error' key"
        assert data["error"].lower().find("complexity") != -1, "Error message does not mention complexity"

    except requests.RequestException as e:
        assert False, f"Request failed on invalid input: {e}"
    except (ValueError, AssertionError) as e:
        assert False, f"Invalid input response validation failed: {e}"


test_generate_mindmap_complexity_and_detail()