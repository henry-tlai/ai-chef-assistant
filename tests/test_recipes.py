
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
