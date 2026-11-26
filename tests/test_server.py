
import json

import pytest
from fastapi.testclient import TestClient
from google.genai import types

import db


@pytest.fixture
def client(temp_db, monkeypatch):
    # Arrange: prevent the server from making real AI calls.
    import server

    def fake_chat(history, message):
        history.append(
            types.Content(
                role="user",
                parts=[types.Part(text=message)],
            )
        )
        history.append(
            types.Content(
                role="model",
                parts=[types.Part(text="Test response")],
            )
        )
        return "Test response"

    def fake_chat_stream(history, message):
        history.append(
            types.Content(
                role="user",
                parts=[types.Part(text=message)],
            )
        )
        history.append(
            types.Content(
                role="model",
                parts=[types.Part(text="Test response")],
            )
        )
        yield "Test response"

    monkeypatch.setattr(server, "chat", fake_chat)
    monkeypatch.setattr(server, "chat_stream", fake_chat_stream)

    return TestClient(server.app)


def test_get_favorite_detail(client):
    # Arrange
    recipe_json = """
    {
        "title": "Garlic Chicken",
        "servings": 2,
        "total_minutes": 30,
        "ingredients": ["Chicken", "Garlic"],
        "steps": [
            {"text": "Prepare the chicken"},
            {"text": "Cook with garlic"}
        ]
    }
    """
    db.save_favorite("Garlic Chicken", "Test recipe", recipe_json)

    favorite_id = db.list_favorites()[0][0]

    # Act
    response = client.get(f"/favorites/{favorite_id}")

    # Assert
    assert response.status_code == 200
    assert response.json()["id"] == favorite_id
    assert response.json()["title"] == "Garlic Chicken"
    assert len(response.json()["steps"]) == 2


def test_get_favorite_detail_returns_404_when_missing(client):
    # Arrange
    missing_favorite_id = 999

    # Act
    response = client.get(f"/favorites/{missing_favorite_id}")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Favorite not found"


def test_get_favorite_detail_returns_422_without_structured_data(client):
    # Arrange
    db.save_favorite("Old Recipe", "Old recipe text")
    favorite_id = db.list_favorites()[0][0]

    # Act
    response = client.get(f"/favorites/{favorite_id}")

    # Assert
    assert response.status_code == 422
    assert response.json()["detail"] == "Structured recipe data is unavailable"


def test_get_favorite_detail_returns_500_when_recipe_data_is_invalid(client):
    # Arrange
    db.save_favorite("Broken Recipe", "Test recipe", "{invalid json")
    favorite_id = db.list_favorites()[0][0]

    # Act
    response = client.get(f"/favorites/{favorite_id}")

    # Assert
    assert response.status_code == 500
    assert response.json()["detail"] == "Saved recipe data is invalid"


def test_save_recipe_from_chat(client, monkeypatch):
    # Arrange
    import server

    recipe_data = {
        "title": "Garlic Chicken",
        "servings": 2,
        "total_minutes": 30,
        "ingredients": ["2 chicken breasts", "2 cloves garlic"],
        "steps": [
            {
                "text": "Prepare the chicken",
                "timer_seconds": None,
                "timer_max_seconds": None,
                "image_url": None,
            },
            {
                "text": "Cook the chicken for 10 minutes",
                "timer_seconds": 600,
                "timer_max_seconds": 600,
                "image_url": None,
            },
        ],
    }

    fake_response = types.Content(
        role="model",
        parts=[types.Part(text=json.dumps(recipe_data))],
    )

    def fake_ask_model(history, system_prompt, tools=None):
        return fake_response

    monkeypatch.setattr(server, "ask_model", fake_ask_model)

    # Act
    response = client.post(
        "/favorites/from-recipe",
        json={"recipe_text": "Garlic chicken recipe"},
    )

    # Assert
    assert response.status_code == 200
    assert response.json() == {
        "saved": True,
        "title": "Garlic Chicken",
        "already_saved": False,
    }

    favorites = db.list_favorites()
    assert len(favorites) == 1

    favorite_id = favorites[0][0]
    saved_recipe = db.get_favorite_record(favorite_id)

    assert saved_recipe[1] == "Garlic Chicken"
    assert "Ingredients:" in saved_recipe[2]
    assert "2 chicken breasts" in saved_recipe[2]
    assert "600" in saved_recipe[3]


def test_save_recipe_from_chat_returns_502_when_conversion_is_invalid(
    client, monkeypatch
):
    # Arrange
    import server

    fake_response = types.Content(
        role="model",
        parts=[types.Part(text="This is not valid recipe JSON")],
    )

    def fake_ask_model(history, system_prompt, tools=None):
        return fake_response

    monkeypatch.setattr(server, "ask_model", fake_ask_model)

    # Act
    response = client.post(
        "/favorites/from-recipe",
        json={"recipe_text": "Garlic chicken recipe"},
    )

    # Assert
    assert response.status_code == 502
    assert response.json()["detail"] == (
        "Could not convert the recipe into valid structured data"
    )
    assert db.list_favorites() == []


def test_save_recipe_from_chat_rejects_empty_text(client, monkeypatch):
    # Arrange
    import server

    def fake_ask_model(history, system_prompt, tools=None):
        raise AssertionError("Gemini should not be called")

    monkeypatch.setattr(server, "ask_model", fake_ask_model)

    # Act
    response = client.post(
        "/favorites/from-recipe",
        json={"recipe_text": "   "},
    )

    # Assert
    assert response.status_code == 422
    assert response.json()["detail"] == "Recipe text cannot be empty"
    assert db.list_favorites() == []


def test_save_recipe_from_chat_does_not_duplicate_existing_favorite(
    client, monkeypatch
):
    # Arrange
    import server

    db.save_favorite(
        "Garlic Chicken",
        "Ingredients:\n- Chicken\n\nSteps:\n1. Cook chicken",
    )

    recipe_data = {
        "title": "Garlic Chicken",
        "servings": 2,
        "total_minutes": 30,
        "ingredients": ["2 chicken breasts", "2 cloves garlic"],
        "steps": [
            {
                "text": "Prepare the chicken",
                "timer_seconds": None,
                "timer_max_seconds": None,
                "image_url": None,
            },
            {
                "text": "Cook the chicken",
                "timer_seconds": 600,
                "timer_max_seconds": 600,
                "image_url": None,
            },
        ],
    }

    fake_response = types.Content(
        role="model",
        parts=[types.Part(text=json.dumps(recipe_data))],
    )

    def fake_ask_model(history, system_prompt, tools=None):
        return fake_response

    monkeypatch.setattr(server, "ask_model", fake_ask_model)

    # Act
    response = client.post(
        "/favorites/from-recipe",
        json={"recipe_text": "Garlic chicken recipe"},
    )

    # Assert
    assert response.status_code == 200
    assert response.json()["already_saved"] is True
    assert response.json()["title"] == "Garlic Chicken"
    assert len(db.list_favorites()) == 1


def test_chat_returns_response_and_saves_messages(client):
    # Arrange
    request_data = {"message": "What can I cook?"}

    # Act
    response = client.post("/chat", json=request_data)

    # Assert
    assert response.status_code == 200
    assert response.json()["reply"] == "Test response"
    assert response.json()["session_id"]

    saved_messages = db.load_messages(response.json()["session_id"])
    assert len(saved_messages) == 2


def test_chat_skips_malformed_saved_messages(client):
    # Arrange
    session_id = "malformed-chat-session"
    db.save_messages(session_id, ["{invalid json"])

    # Act
    response = client.post(
        "/chat",
        json={"message": "What can I cook?", "session_id": session_id},
    )

    # Assert
    assert response.status_code == 200
    assert response.json()["reply"] == "Test response"
    saved_messages = db.load_messages(session_id)
    assert len(saved_messages) == 3


def test_chat_stream_returns_response_and_saves_messages(client):
    # Arrange
    request_data = {"message": "What can I cook?"}

    # Act
    response = client.post("/chat/stream", json=request_data)

    # Assert
    assert response.status_code == 200
    assert response.text == "Test response"
    assert response.headers["X-Session-Id"]

    saved_messages = db.load_messages(response.headers["X-Session-Id"])
    assert len(saved_messages) == 2


def test_chat_stream_skips_malformed_saved_messages(client):
    # Arrange
    session_id = "malformed-stream-session"
    db.save_messages(session_id, ["{invalid json"])

    # Act
    response = client.post(
        "/chat/stream",
        json={"message": "What can I cook?", "session_id": session_id},
    )

    # Assert
    assert response.status_code == 200
    assert response.text == "Test response"

    saved_messages = db.load_messages(session_id)
    assert len(saved_messages) == 3


def test_chat_returns_502_when_ai_service_fails(client, monkeypatch):
    # Arrange
    import server

    def fake_chat(history, message):
        raise RuntimeError("Gemini unavailable")

    monkeypatch.setattr(server, "chat", fake_chat)

    # Act
    response = client.post(
        "/chat",
        json={"message": "What can I cook?"},
    )

    # Assert
    assert response.status_code == 502
    assert response.json()["detail"] == (
        "The chef assistant is temporarily unavailable. Please try again."
    )

def test_chat_removes_partial_history_when_ai_service_fails(
    client, monkeypatch
):
    # Arrange
    import server

    def fake_chat(history, message):
        history.append(
            types.Content(
                role="user",
                parts=[types.Part(text=message)],
            )
        )
        raise RuntimeError("Gemini unavailable")

    monkeypatch.setattr(server, "chat", fake_chat)

    session_id = "failed-chat-session"

    # Act
    response = client.post(
        "/chat",
        json={"message": "What can I cook?", "session_id": session_id},
    )

    # Assert
    assert response.status_code == 502
    assert db.load_messages(session_id) == []



def test_chat_stream_removes_partial_history_when_ai_service_fails(
    client, monkeypatch
):
    # Arrange
    import server

    def fake_chat_stream(history, message):
        history.append(
            types.Content(
                role="user",
                parts=[types.Part(text=message)],
            )
        )
        raise RuntimeError("Gemini unavailable")
        yield "Test response"

    monkeypatch.setattr(server, "chat_stream", fake_chat_stream)

    session_id = "failed-stream-session"

    # Act & Assert
    with pytest.raises(RuntimeError, match="Gemini unavailable"):
        client.post(
            "/chat/stream",
            json={"message": "What can I cook?", "session_id": session_id},
        )

    # Assert: partial history was not saved.
    assert db.load_messages(session_id) == []


def test_get_history_returns_saved_messages(client):
    # Arrange
    session_id = "history-session"
    messages = [
        types.Content(
            role="user",
            parts=[types.Part(text="I want chicken")],
        ),
        types.Content(
            role="model",
            parts=[types.Part(text="What kind of chicken?")],
        ),
    ]

    db.save_messages(
        session_id,
        [message.model_dump_json() for message in messages],
    )

    # Act
    response = client.get(f"/history/{session_id}")

    # Assert
    assert response.status_code == 200
    assert response.json() == [
        {"role": "user", "content": "I want chicken"},
        {"role": "assistant", "content": "What kind of chicken?"},
    ]


def test_get_history_skips_malformed_messages(client):
    # Arrange
    session_id = "malformed-history-session"

    db.save_messages(
        session_id,
        [
            "{invalid json",
            types.Content(
                role="user",
                parts=[types.Part(text="Hello")],
            ).model_dump_json(),
        ],
    )

    # Act
    response = client.get(f"/history/{session_id}")

    # Assert
    assert response.status_code == 200
    assert response.json() == [
        {"role": "user", "content": "Hello"},
    ]


def test_get_history_skips_empty_messages(client):
    # Arrange
    session_id = "empty-history-session"

    db.save_messages(
        session_id,
        [
            types.Content(
                role="model",
                parts=[types.Part(text="")],
            ).model_dump_json(),
            types.Content(
                role="user",
                parts=[types.Part(text="Hello")],
            ).model_dump_json(),
        ],
    )

    # Act
    response = client.get(f"/history/{session_id}")

    # Assert
    assert response.status_code == 200
    assert response.json() == [
        {"role": "user", "content": "Hello"},
    ]


def test_get_conversations_returns_conversation_titles(client):
    # Arrange
    session_id = "conversation-list-session"
    messages = [
        types.Content(
            role="user",
            parts=[types.Part(text="I want to make chicken curry")],
        ),
        types.Content(
            role="model",
            parts=[types.Part(text="Let's make chicken curry!")],
        ),
    ]

    db.save_messages(
        session_id,
        [message.model_dump_json() for message in messages],
    )

    # Act
    response = client.get("/conversations")

    # Assert
    assert response.status_code == 200
    assert response.json() == [
        {
            "session_id": session_id,
            "title": "I want to make chicken curry",
        }
    ]


def test_get_conversations_skips_malformed_messages(client):
    # Arrange
    session_id = "malformed-conversation-session"
    db.save_messages(session_id, ["{invalid json"])

    # Act
    response = client.get("/conversations")

    # Assert
    assert response.status_code == 200
    assert response.json() == []


def test_delete_conversation_removes_saved_messages_and_session(client):
    # Arrange
    import server

    session_id = "delete-conversation-session"
    message = types.Content(
        role="user",
        parts=[types.Part(text="Hello")],
    )

    db.save_messages(session_id, [message.model_dump_json()])
    server.sessions[session_id] = [message]

    # Act
    response = client.delete(f"/conversations/{session_id}")

    # Assert
    assert response.status_code == 200
    assert response.json() == {"deleted": session_id}
    assert db.load_messages(session_id) == []
    assert session_id not in server.sessions


def test_delete_conversation_returns_404_when_missing(client):
    # Arrange
    session_id = "missing-conversation-session"

    # Act
    response = client.delete(f"/conversations/{session_id}")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Conversation not found"


def test_delete_favorite_removes_saved_recipe(client):
    # Arrange
    db.save_favorite(
        "Garlic Chicken",
        "Ingredients:\n- Chicken\n\nSteps:\n1. Cook chicken",
    )
    favorite_id = db.list_favorites()[0][0]

    # Act
    response = client.delete(f"/favorites/{favorite_id}")

    # Assert
    assert response.status_code == 200
    assert response.json() == {"deleted": favorite_id}
    assert db.get_favorite_record(favorite_id) is None


def test_delete_favorite_returns_404_when_missing(client):
    # Arrange
    missing_favorite_id = 999

    # Act
    response = client.delete(f"/favorites/{missing_favorite_id}")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Favorite not found"


def test_get_favorites_returns_saved_favorites(client):
    # Arrange
    db.save_favorite("Garlic Chicken", "Test recipe")
    db.save_favorite("Beef Stir Fry", "Another test recipe")

    # Act
    response = client.get("/favorites")

    # Assert
    assert response.status_code == 200
    assert len(response.json()) == 2
    assert response.json() == [
        {"id": 1, "title": "Garlic Chicken"},
        {"id": 2, "title": "Beef Stir Fry"},
    ]


def test_get_favorites_returns_empty_list_when_none_saved(client):
    # Arrange
    # No favorites are saved.

    # Act
    response = client.get("/favorites")

    # Assert
    assert response.status_code == 200
    assert response.json() == []
