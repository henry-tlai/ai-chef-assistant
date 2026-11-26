
import pytest
from pydantic import ValidationError

from recipes import Recipe, Step, to_text


def test_to_text_numbers_the_steps():
    # Arrange
    recipe = Recipe(
        title="Toast",
        ingredients=["2 slices bread"],
        steps=[Step(text="Toast it"), Step(text="Butter it")],
    )

    # Act
    text = to_text(recipe)

    # Assert
    assert "- 2 slices bread" in text
    assert "1. Toast it" in text
    assert "2. Butter it" in text


def test_a_recipe_needs_at_least_one_step():
    # Arrange
    recipe_data = {
        "title": "Empty",
        "ingredients": [],
        "steps": [],
    }

    # Act & Assert
    with pytest.raises(ValidationError):
        Recipe(**recipe_data)


def test_step_allows_no_timer():
    # Arrange
    step_data = {
        "text": "Add the seasoning",
        "timer_seconds": None,
        "timer_max_seconds": None,
    }

    # Act
    step = Step(**step_data)

    # Assert
    assert step.timer_seconds is None
    assert step.timer_max_seconds is None


def test_step_accepts_a_valid_timer_range():
    # Arrange
    step_data = {
        "text": "Cook the chicken",
        "timer_seconds": 600,
        "timer_max_seconds": 720,
    }

    # Act
    step = Step(**step_data)

    # Assert
    assert step.timer_seconds == 600
    assert step.timer_max_seconds == 720


def test_step_accepts_a_fixed_timer():
    # Arrange
    step_data = {
        "text": "Boil the water",
        "timer_seconds": 300,
        "timer_max_seconds": 300,
    }

    # Act
    step = Step(**step_data)

    # Assert
    assert step.timer_seconds == 300
    assert step.timer_max_seconds == 300


def test_step_rejects_an_incomplete_timer_range():
    # Arrange
    step_data = {
        "text": "Cook the chicken",
        "timer_seconds": 600,
        "timer_max_seconds": None,
    }

    # Act & Assert
    with pytest.raises(ValidationError):
        Step(**step_data)


def test_step_rejects_negative_timer_values():
    # Arrange
    step_data = {
        "text": "Cook the chicken",
        "timer_seconds": -60,
        "timer_max_seconds": 300,
    }

    # Act & Assert
    with pytest.raises(ValidationError):
        Step(**step_data)


def test_step_rejects_maximum_shorter_than_minimum():
    # Arrange
    step_data = {
        "text": "Cook the chicken",
        "timer_seconds": 720,
        "timer_max_seconds": 600,
    }

    # Act & Assert
    with pytest.raises(ValidationError):
        Step(**step_data)
