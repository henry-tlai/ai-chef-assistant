import json

import pytest
from fastapi.testclient import TestClient
from google.genai import types

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
