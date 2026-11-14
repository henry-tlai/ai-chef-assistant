from pydantic import BaseModel, Field


class Step(BaseModel):
    text: str
    timer_seconds: int | None = None   
    image_url: str | None = None       


class Recipe(BaseModel):
    title: str
    servings: int | None = None
    total_minutes: int | None = None
    ingredients: list[str]
    steps: list[Step] = Field(min_length=1)