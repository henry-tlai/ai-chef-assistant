
from pydantic import ValidationError

import db
from recipes import Recipe, Step, to_text


def save_favorite(
    title: str,
    ingredients: list[str],
    steps: list[str],
    step_timers: list[int],
) -> str:
    """Save a recipe to the user's favorites. Use this ONLY when the user's
    latest message explicitly asks to save, favorite, or keep a recipe.

    title is the dish name.
    ingredients is a list with one ingredient per item, including its amount.
    steps is a list with one cooking step per item, in order, without step numbers.
    step_timers must contain one integer per cooking step, in the same order.
    Use the estimated timer duration in seconds. Use 0 when no useful timer applies.
    """
    if len(steps) != len(step_timers):
        return "Could not save: every cooking step needs a matching timer value."

    try:
        recipe_steps = []

        for index, step_text in enumerate(steps):
            timer = step_timers[index]

            if timer < 0:
                return "Could not save: timer values cannot be negative."

            if timer == 0:
                timer = None

            recipe_steps.append(
                Step(
                    text=step_text,
                    timer_seconds=timer,
                )
            )

        recipe = Recipe(
            title=title,
            ingredients=ingredients,
            steps=recipe_steps,
        )

    except ValidationError:
        return (
            "Could not save: a recipe needs a title and at least one step. "
            "Try again with the steps."
        )

    db.save_favorite(
        title,
        to_text(recipe),
        recipe.model_dump_json(),
    )

    return f"Saved '{title}' to favorites."


def list_favorites() -> str:
    """List the recipes the user has saved as favorites, by name. Use this when
    the user asks what they've saved or wants to see their favorites."""
    rows = db.list_favorites()

    if not rows:
        return "No favorites saved yet."

    return "\n".join(f"- {title}" for _, title in rows)


def get_favorite(title: str) -> str:
    """Load the full recipe for one saved favorite. Use this when the user wants
    to open, view, or cook a saved recipe, for example "let's cook the steak".
    title is the name of the recipe, or part of it, as the user said it."""
    matches = db.find_favorite(title)

    if not matches:
        return (
            f"No favorite found matching '{title}'. "
            "Suggest the user check their favorites list."
        )

    if len(matches) > 1:
        names = ", ".join(title for title, _, _ in matches)
        return f"Several favorites match: {names}."

    found_title, recipe_text, _ = matches[0]

    return f"{found_title}\n\n{recipe_text}"


def get_favorite_structured(title: str) -> dict | str:
    """Retrieve a saved favorite as structured recipe data for cooking mode."""
    matches = db.find_favorite(title)

    if not matches:
        return f"No favorite found matching '{title}'."

    if len(matches) > 1:
        names = ", ".join(title for title, _, _ in matches)
        return f"Several favorites match: {names}."

    found_title, _, recipe_json = matches[0]

    if not recipe_json:
        return f"Structured recipe data is unavailable for '{found_title}'."

    try:
        recipe = Recipe.model_validate_json(recipe_json)
        return recipe.model_dump()
    except ValidationError:
        return f"Could not load structured recipe data for '{found_title}'."


TOOLS = {
    "save_favorite": save_favorite,
    "list_favorites": list_favorites,
    "get_favorite": get_favorite,
}
