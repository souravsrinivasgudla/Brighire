"""Groq AI client."""

import json
import logging
from typing import Any

from groq import (
    APIConnectionError,
    APIError,
    APIStatusError,
    APITimeoutError,
    Groq,
    GroqError,
)
from groq.types.chat import ChatCompletionMessageParam

from app.core.config import settings
from app.shared.exceptions import (
    AIProviderRequestError,
    AIProviderUnavailableError,
)

logger = logging.getLogger(__name__)

_AI_UNAVAILABLE = "AI service is temporarily unavailable."
_AI_REQUEST_FAILED = "AI service failed to process the request."


class GroqAIClient:
    """Client for communicating with Groq."""

    def __init__(self) -> None:
        self.client = Groq(
            api_key=settings.groq_api_key,
            timeout=settings.groq_timeout_seconds,
        )

    def analyze_resume(self, resume_text: str) -> dict:
        """Analyze resume text using Groq."""

        messages: list[ChatCompletionMessageParam] = [
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
        ]

        return self._create_json_completion(messages=messages)

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

        messages: list[ChatCompletionMessageParam] = [
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
        ]

        return self._create_json_completion(messages=messages)

    def _create_json_completion(
        self,
        *,
        messages: list[ChatCompletionMessageParam],
    ) -> dict[str, Any]:
        """Call Groq and parse a JSON object response safely."""

        try:
            response = self.client.chat.completions.create(
                model=settings.groq_model,
                messages=messages,
                response_format={
                    "type": "json_object",
                },
            )

            content = response.choices[0].message.content

            if not content:
                logger.error(
                    "Groq returned an empty completion (model=%s).",
                    settings.groq_model,
                )
                raise AIProviderRequestError(_AI_REQUEST_FAILED)

            return json.loads(content)

        except AIProviderUnavailableError:
            raise
        except AIProviderRequestError:
            raise
        except APITimeoutError:
            logger.warning(
                "Groq request timed out after %ss (model=%s).",
                settings.groq_timeout_seconds,
                settings.groq_model,
            )
            raise AIProviderUnavailableError(_AI_UNAVAILABLE) from None
        except APIConnectionError as exc:
            logger.warning(
                "Groq connection failed (model=%s): %s",
                settings.groq_model,
                exc,
            )
            raise AIProviderUnavailableError(_AI_UNAVAILABLE) from None
        except APIStatusError as exc:
            logger.error(
                "Groq rejected the request with HTTP %s (model=%s): %s",
                exc.status_code,
                settings.groq_model,
                exc.message,
            )
            raise AIProviderRequestError(_AI_REQUEST_FAILED) from None
        except APIError as exc:
            logger.error(
                "Groq API error (model=%s): %s",
                settings.groq_model,
                exc,
            )
            raise AIProviderRequestError(_AI_REQUEST_FAILED) from None
        except GroqError as exc:
            logger.warning(
                "Groq client error (model=%s): %s",
                settings.groq_model,
                exc,
            )
            raise AIProviderUnavailableError(_AI_UNAVAILABLE) from None
        except (
            json.JSONDecodeError,
            TypeError,
            ValueError,
            KeyError,
            IndexError,
        ) as exc:
            logger.error(
                "Groq returned an unusable payload (model=%s): %s: %s",
                settings.groq_model,
                type(exc).__name__,
                exc,
            )
            raise AIProviderRequestError(_AI_REQUEST_FAILED) from None
