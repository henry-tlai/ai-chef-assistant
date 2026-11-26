from pydantic import BaseModel, Field


class Step(BaseModel):
    text: str
    timer_seconds: int | None = None
    timer_max_seconds: int | None = None
    image_url: str | None = None


class Recipe(BaseModel):
    title: str
    servings: int | None = None
    total_minutes: int | None = None
    ingredients: list[str]
    steps: list[Step] = Field(min_length=1)


def to_text(recipe: Recipe) -> str:
    lines = ["Ingredients:"]
    lines += [f"- {item}" for item in recipe.ingredients]
    lines += ["", "Steps:"]
    lines += [
        f"{n}. {step.text}"
        for n, step in enumerate(recipe.steps, start=1)
    ]
    return "\n".join(lines)
