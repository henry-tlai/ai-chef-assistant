from pydantic import BaseModel, Field, model_validator


class Step(BaseModel):
    text: str
    timer_seconds: int | None = None
    timer_max_seconds: int | None = None
    image_url: str | None = None

    @model_validator(mode="after")
    def validate_timer_range(self):
        minimum = self.timer_seconds
        maximum = self.timer_max_seconds

        if minimum is None and maximum is None:
            return self

        if minimum is None or maximum is None:
            raise ValueError("Both timer values must be provided together.")

        if minimum < 0 or maximum < 0:
            raise ValueError("Timer values cannot be negative.")

        if minimum > maximum:
            raise ValueError("Maximum timer cannot be shorter than minimum.")

        return self


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
