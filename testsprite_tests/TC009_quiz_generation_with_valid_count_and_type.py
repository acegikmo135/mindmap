import requests
import json

BASE_URL = "http://localhost:3000/api/gemini"
TIMEOUT = 30

# Replace this with a valid Supabase JWT token for authentication
VALID_JWT = "REPLACE_WITH_VALID_SUPABASE_JWT_BEARER_TOKEN"

def test_quiz_generation_with_valid_count_and_type():
    headers = {
        "Authorization": f"Bearer {VALID_JWT}",
        "Content-Type": "application/json"
    }

    # Valid quizType and counts from 1 to 5 should return 200 and quiz questions JSON
    valid_quiz_type = "MCQ"
    chapter_title = "World War I"
    concepts = ["assassination of Franz Ferdinand", "trench warfare"]

    for count in range(1, 6):
        payload = {
            "action": "generate-quiz",
            "chapterTitle": chapter_title,
            "concepts": concepts,
            "quizType": valid_quiz_type,
            "count": count
        }

        resp = requests.post(BASE_URL, headers=headers, json=payload, timeout=TIMEOUT)
        try:
            assert resp.status_code == 200, f"Expected 200 for count={count}, got {resp.status_code}"
            data = resp.json()
            assert "text" in data, "Response JSON missing 'text' field"
            # The "text" field should be a JSON array of quiz questions (string)
            try:
                quiz_questions = json.loads(data["text"])
                assert isinstance(quiz_questions, list), "'text' field JSON is not a list"
                # Each item should be a dict (quiz question)
                for q in quiz_questions:
                    assert isinstance(q, dict), "Quiz question item is not a dict"
                    # Basic keys expected: type, question, answer etc — not specified precisely, so check keys loosely
                    assert "type" in q, "Quiz question missing 'type'"
                    assert "question" in q, "Quiz question missing 'question'"
                    assert "answer" in q, "Quiz question missing 'answer'"
            except (ValueError, AssertionError) as e:
                assert False, f"'text' field is not valid JSON quiz question array: {e}"
        except AssertionError:
            raise
        except Exception as e:
            raise AssertionError(f"Unexpected error for count={count}: {e}")

    # Invalid counts (e.g. 0 and 6) should return 400 with error about count range
    for invalid_count in [0, 6, 10]:
        payload = {
            "action": "generate-quiz",
            "chapterTitle": chapter_title,
            "concepts": concepts,
            "quizType": valid_quiz_type,
            "count": invalid_count
        }
        resp = requests.post(BASE_URL, headers=headers, json=payload, timeout=TIMEOUT)
        try:
            assert resp.status_code == 400, f"Expected 400 for invalid count={invalid_count}, got {resp.status_code}"
            data = resp.json()
            assert "error" in data, "400 response missing 'error' field"
            assert "count must be between 1 and 5" in data["error"], f"Unexpected error message: {data['error']}"
        except AssertionError:
            raise
        except Exception as e:
            raise AssertionError(f"Unexpected error for invalid count={invalid_count}: {e}")

    # Also test invalid quizType returns error (optional based on instructions, but testing input validation)
    invalid_quiz_type = "INVALID_TYPE"
    payload = {
        "action": "generate-quiz",
        "chapterTitle": chapter_title,
        "concepts": concepts,
        "quizType": invalid_quiz_type,
        "count": 3
    }
    resp = requests.post(BASE_URL, headers=headers, json=payload, timeout=TIMEOUT)
    # Spec does not specify error code for invalid quizType explicitly but input validation mentioned,
    # so we expect 400 error likely
    if resp.status_code != 200:
        data = resp.json()
        assert resp.status_code == 400, f"Expected 400 for invalid quizType, got {resp.status_code}"
        assert "error" in data, "400 response missing 'error' field for invalid quizType"

test_quiz_generation_with_valid_count_and_type()