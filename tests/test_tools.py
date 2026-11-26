
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

def test_save_favorite_stores_timer_ranges(temp_db):
    # Arrange
    title = "Roasted Chicken"
    ingredients = ["1 whole chicken"]
    steps = ["Roast the chicken"]
    step_timers = [600]
    step_timer_maxes = [720]

    # Act
    result = tools.save_favorite(
        title,
        ingredients,
        steps,
        step_timers,
        step_timer_maxes,
    )
    favorite_id = db.list_favorites()[0][0]
    record = db.get_favorite_record(favorite_id)
    data = json.loads(record[3])

    # Assert
    assert "Saved" in result
    assert data["steps"][0]["timer_seconds"] == 600
    assert data["steps"][0]["timer_max_seconds"] == 720

def test_save_favorite_stores_fixed_timer_range(temp_db):
    # Arrange
    title = "Boiled Eggs"
    ingredients = ["2 eggs"]
    steps = ["Boil the eggs"]
    step_timers = [600]
    step_timer_maxes = [600]

    # Act
    tools.save_favorite(
        title,
        ingredients,
        steps,
        step_timers,
        step_timer_maxes,
    )
    favorite_id = db.list_favorites()[0][0]
    record = db.get_favorite_record(favorite_id)
    data = json.loads(record[3])

    # Assert
    assert data["steps"][0]["timer_seconds"] == 600
    assert data["steps"][0]["timer_max_seconds"] == 600

def test_save_favorite_rejects_mismatched_timer_lists(temp_db):
    # Arrange
    title = "Chicken"
    ingredients = ["chicken"]
    steps = ["Cook chicken", "Rest chicken"]
    step_timers = [600]
    step_timer_maxes = [720, 900]

    # Act
    result = tools.save_favorite(
        title,
        ingredients,
        steps,
        step_timers,
        step_timer_maxes,
    )

    # Assert
    assert "matching minimum and maximum" in result
    assert db.list_favorites() == []


def test_save_favorite_rejects_maximum_shorter_than_minimum(temp_db):
    # Arrange
    title = "Chicken"
    ingredients = ["chicken"]
    steps = ["Cook chicken"]
    step_timers = [720]
    step_timer_maxes = [600]

    # Act
    result = tools.save_favorite(
        title,
        ingredients,
        steps,
        step_timers,
        step_timer_maxes,
    )

    # Assert
    assert "maximum timer cannot be shorter" in result
    assert db.list_favorites() == []

def test_save_favorite_rejects_incomplete_timer_range(temp_db):
    # Arrange
    title = "Chicken"
    ingredients = ["chicken"]
    steps = ["Cook chicken"]
    step_timers = [0]
    step_timer_maxes = [600]

    # Act
    result = tools.save_favorite(
        title,
        ingredients,
        steps,
        step_timers,
        step_timer_maxes,
    )

    # Assert
    assert "use 0 for both timer values" in result
    assert db.list_favorites() == []