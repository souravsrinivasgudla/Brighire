"""AI business logic."""

import logging

from pydantic import ValidationError

from app.ai.client import GroqAIClient
from app.ai.schemas import ResumeAnalysis
from app.shared.exceptions import AIProviderRequestError

logger = logging.getLogger(__name__)


class ResumeAIService:
    """Service for AI-powered resume analysis."""

    def __init__(self, client: GroqAIClient) -> None:
        self.client = client

    def analyze(self, resume_text: str) -> ResumeAnalysis:
        """Analyze resume text."""

        if not resume_text.strip():
            raise ValueError("Resume contains no extractable text.")

        result = self.client.analyze_resume(resume_text)

        try:
            return ResumeAnalysis.model_validate(result)
        except ValidationError as exc:
            logger.error(
                "Groq analysis payload failed schema validation: %s",
                exc.errors(include_url=False),
            )
            raise AIProviderRequestError(
                "AI service failed to process the request."
            ) from exc
