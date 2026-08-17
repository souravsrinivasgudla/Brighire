"""Groq AI client."""

import json

from groq import Groq

from app.core.config import settings


class GroqAIClient:
    """Client for communicating with Groq."""

    def __init__(self) -> None:
        self.client = Groq(
            api_key=settings.groq_api_key,
        )

    def analyze_resume(self, resume_text: str) -> dict:
        """Analyze resume text using Groq."""

        response = self.client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert technical recruiter and resume analyst. "
                        "Analyze the provided resume objectively. "
                        "Do not invent information that is not present in the resume. "
                        "Return the analysis as a valid JSON object. "
                        "The JSON object MUST contain these fields: "
                        "overall_score, summary, skills, strengths, weaknesses, "
                        "missing_skills, and suggestions. "
                        "overall_score MUST be an integer from 0 to 100. "
                        "skills, strengths, weaknesses, missing_skills, and "
                        "suggestions MUST be arrays of strings. "
                        "summary MUST be a string."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Analyze the following resume and return the result as JSON.\n\n"
                        f"RESUME:\n{resume_text}"
                    ),
                },
            ],
            response_format={
                "type": "json_object",
            },
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("AI returned an empty response.")

        return json.loads(content)