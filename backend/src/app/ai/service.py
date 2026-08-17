"""AI business logic."""

from app.ai.client import GroqAIClient
from app.ai.schemas import ResumeAnalysis


class ResumeAIService:
    """Service for AI-powered resume analysis."""

    def __init__(self, client: GroqAIClient) -> None:
        self.client = client

    def analyze(self, resume_text: str) -> ResumeAnalysis:
        """Analyze resume text."""

        if not resume_text.strip():
            raise ValueError("Resume contains no extractable text.")

        result = self.client.analyze_resume(resume_text)

        return ResumeAnalysis.model_validate(result)