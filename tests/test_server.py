
import pytest
from fastapi.testclient import TestClient

import db


@pytest.fixture
def client(temp_db, monkeypatch):
    # Arrange: prevent the server from making real AI calls.
    import agent

    def fake_chat(history, message):
        return "Test response"

    def fake_chat_stream(history, message):
        yield "Test response"

    monkeypatch.setattr(agent, "chat", fake_chat)
    monkeypatch.setattr(agent, "chat_stream", fake_chat_stream)

    # Arrange: import the server after the temporary database is active.
    import server

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
