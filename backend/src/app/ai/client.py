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


    def analyze_resume_job_match(
        self,
        *,
        resume_text: str,
        job_title: str,
        company: str,
        job_description: str,
        requirements: str | None,
    ) -> dict:
        """Analyze how well a resume matches a job."""

        requirements_text = requirements or "No specific requirements provided."

        prompt = f"""
    Analyze the following resume against the provided job.

    Return ONLY valid JSON.

    The JSON must contain exactly these fields:

    {{
    "match_score": integer from 0 to 100,
    "summary": "string",
    "matched_skills": ["string"],
    "missing_skills": ["string"],
    "strengths": ["string"],
    "gaps": ["string"],
    "recommendations": ["string"]
    }}

    Resume:
    {resume_text}

    Job Title:
    {job_title}

    Company:
    {company}

    Job Description:
    {job_description}

    Job Requirements:
    {requirements_text}

    The response must be valid JSON.
    """

        response = self.client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert recruitment assistant. "
                        "Analyze resume-to-job compatibility. "
                        "Always return JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            response_format={
                "type": "json_object",
            },
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError(
                "AI returned an empty response."
            )

        return json.loads(content)