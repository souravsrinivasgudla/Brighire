from app.ai.client import GroqAIClient
from app.ai.service import ResumeAIService


def main() -> None:
    client = GroqAIClient()
    service = ResumeAIService(client)

    analysis = service.analyze(
        """
        John Doe
        Software Engineer

        Skills:
        Python, FastAPI, PostgreSQL, Docker, AWS

        Experience:
        3 years of backend development.
        Built REST APIs using Python and FastAPI.
        Worked with PostgreSQL and Docker.
        """
    )

    print("\n=== RESUME ANALYSIS ===")
    print(f"Score: {analysis.overall_score}")
    print(f"Summary: {analysis.summary}")

    print("\nSkills:")
    for skill in analysis.skills:
        print(f"  - {skill}")

    print("\nStrengths:")
    for strength in analysis.strengths:
        print(f"  - {strength}")

    print("\nWeaknesses:")
    for weakness in analysis.weaknesses:
        print(f"  - {weakness}")

    print("\nMissing Skills:")
    for skill in analysis.missing_skills:
        print(f"  - {skill}")

    print("\nSuggestions:")
    for suggestion in analysis.suggestions:
        print(f"  - {suggestion}")


if __name__ == "__main__":
    main()