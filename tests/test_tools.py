
import json

import db
import tools


def test_get_favorite_no_match(temp_db):
    # Arrange
    query = "pizza"

    # Act
    result = tools.get_favorite(query)

    # Assert
    assert "No favorite found" in result


def test_get_favorite_multiple_matches(temp_db):
    # Arrange
    tools.save_favorite("Chicken Soup", ["broth"], ["Boil"], [300])
    tools.save_favorite("Chicken Curry", ["curry paste"], ["Simmer"], [0])

    # Act
    result = tools.get_favorite("chicken")

    # Assert
    assert "Several favorites match" in result


def test_get_favorite_single_match(temp_db):
    # Arrange
    tools.save_favorite("Garlic Herb Steak", ["steak"], ["Sear it"], [120])

    # Act
    result = tools.get_favorite("steak")

    # Assert
    assert "1. Sear it" in result


def test_save_favorite_stores_the_steps_separately(temp_db):
    # Arrange
    title = "Toast"
    ingredients = ["2 slices bread"]
    steps = ["Toast it", "Butter it"]
    step_timers = [60, 0]

    # Act
    tools.save_favorite(title, ingredients, steps, step_timers)
    favorite_id = db.list_favorites()[0][0]
    record = db.get_favorite_record(favorite_id)
    data = json.loads(record[3])

    # Assert
    assert [step["text"] for step in data["steps"]] == steps
    assert [step["timer_seconds"] for step in data["steps"]] == [60, None]


def test_save_favorite_rejects_a_recipe_with_no_steps(temp_db):
    # Arrange
    title = "Empty"
    ingredients = ["air"]
    steps = []
    step_timers = []

    # Act
    result = tools.save_favorite(title, ingredients, steps, step_timers)
    favorites = db.list_favorites()

    # Assert
    assert "at least one step" in result
    assert favorites == []
