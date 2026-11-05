"""Optional model adapter; imports and credentials stay out of data collectors."""
import os


def create_model(api_key):
    if not api_key:
        return None
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    return genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-flash-latest"))


def generate_strategy(model, prompt):
    response = model.generate_content(
        prompt,
        generation_config={
            "response_mime_type": "application/json",
            "max_output_tokens": 4096,
        },
        request_options={"timeout": 60},
    )
    return response.text
