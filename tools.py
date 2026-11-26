
from pydantic import ValidationError

import db
from recipes import Recipe, Step, to_text


def save_favorite(
    title: str,
    ingredients: list[str],
    steps: list[str],
    step_timers: list[int],
    step_timer_maxes: list[int] | None = None,
) -> str:
    """Save a recipe to the user's favorites. Use this ONLY when the user's
    latest message explicitly asks to save, favorite, or keep a recipe.

    title is the dish name.
    ingredients is a list with one ingredient per item, including its amount.
    steps is a list with one cooking step per item, in order, without step numbers.
    step_timers contains the minimum or starting timer for each step, in seconds.
    step_timer_maxes contains the maximum timer for each step, in seconds.
    Both timer lists must have one integer per cooking step, in the same order.
    Use the same value in both lists for a single-duration timer.
    Use 0 in both lists when no useful timer applies.
    """
    if step_timer_maxes is None:
        step_timer_maxes = step_timers.copy()

    if not all(isinstance(timer, int) and not isinstance(timer, bool) for timer in step_timers):
        return "Could not save: timer values must be integers."

    if not all(
        isinstance(timer, int) and not isinstance(timer, bool)
        for timer in step_timer_maxes
    ):
        return "Could not save: timer values must be integers."

    if len(steps) != len(step_timers) or len(steps) != len(step_timer_maxes):
        return "Could not save: every cooking step needs matching minimum and maximum timer values."

    try:
        recipe_steps = []

        for index, step_text in enumerate(steps):
            timer_min = step_timers[index]
            timer_max = step_timer_maxes[index]

            if timer_min < 0 or timer_max < 0:
                return "Could not save: timer values cannot be negative."

            if (timer_min == 0) != (timer_max == 0):
                return "Could not save: use 0 for both timer values when no timer applies."

            if timer_min > timer_max:
                return "Could not save: a maximum timer cannot be shorter than its minimum."

            if timer_min == 0:
                timer_min = None
                timer_max = None

            recipe_steps.append(
                Step(
                    text=step_text,
                    timer_seconds=timer_min,
                    timer_max_seconds=timer_max,
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

    saved = db.save_favorite(
        title,
        to_text(recipe),
        recipe.model_dump_json(),
    )

    if not saved:
        return f"'{title}' is already in your favorites."

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
