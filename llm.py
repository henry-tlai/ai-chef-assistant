
# This file talks to Gemini API
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

MODEL = "gemini-3.5-flash-lite"


def get_client():
    return genai.Client(
        http_options=types.HttpOptions(timeout=60000)
    )


def ask_model(history, system_prompt, tools=None):
    client = get_client()

    response = client.models.generate_content(
        model=MODEL,
        contents=history,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            tools=tools,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                disable=True
            ),
        ),
    )
    return response.candidates[0].content


def ask_model_stream(history, system_prompt, tools=None):
    """Yield chunks as the model writes them."""
    client = get_client()

    return client.models.generate_content_stream(
        model=MODEL,
        contents=history,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            tools=tools,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                disable=True
            ),
        ),
    )
