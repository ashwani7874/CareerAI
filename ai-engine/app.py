
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = FastAPI(
    title="CareerAI Matching Engine",
    description="AI-powered resume and job description matching",
    version="1.0.0"
)

SKILLS = [
    "Java", "Python", "C++", "JavaScript", "TypeScript",
    "SQL", "MongoDB", "MySQL", "PostgreSQL", "React",
    "Node.js", "Express.js", "Spring Boot",
    "Machine Learning", "Deep Learning",
    "Artificial Intelligence", "TensorFlow", "PyTorch",
    "Scikit-learn", "Pandas", "NumPy", "Matplotlib",
    "Git", "GitHub", "Docker", "Kubernetes", "AWS",
    "REST API", "HTML", "CSS", "Data Structures",
    "Algorithms", "OOP", "FastAPI", "Flask",
    "Communication", "Problem Solving"
]


class MatchRequest(BaseModel):
    resume_text: str
    job_description: str


def extract_skills(text):
    text_lower = text.lower()

    found = []

    for skill in SKILLS:
        pattern = r"(?<!\w)" + re.escape(skill.lower()) + r"(?!\w)"

        if re.search(pattern, text_lower):
            found.append(skill)

    return found


def calculate_similarity(resume_text, job_description):
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2)
    )

    try:
        vectors = vectorizer.fit_transform(
            [resume_text, job_description]
        )

        similarity = cosine_similarity(
            vectors[0:1],
            vectors[1:2]
        )[0][0]

        return round(float(similarity) * 100, 2)

    except ValueError:
        return 0.0


@app.get("/")
def home():
    return {
        "success": True,
        "message": "CareerAI Matching Engine is running"
    }


@app.post("/analyze")
def analyze_resume(request: MatchRequest):

    resume_text = request.resume_text.strip()
    job_description = request.job_description.strip()

    if not resume_text or not job_description:
        raise HTTPException(
            status_code=400,
            detail="Resume text and job description are required"
        )

    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_description)

    matched_skills = [
        skill for skill in job_skills
        if skill in resume_skills
    ]

    missing_skills = [
        skill for skill in job_skills
        if skill not in resume_skills
    ]

    if job_skills:
        skill_score = (
            len(matched_skills) / len(job_skills)
        ) * 100
    else:
        skill_score = 0

    similarity_score = calculate_similarity(
        resume_text,
        job_description
    )

    if job_skills:
        overall_score = (
            skill_score * 0.7
            + similarity_score * 0.3
        )
    else:
        overall_score = similarity_score

    overall_score = round(overall_score, 2)

    if overall_score >= 80:
        verdict = "Excellent Match"
    elif overall_score >= 60:
        verdict = "Good Match"
    elif overall_score >= 40:
        verdict = "Moderate Match"
    else:
        verdict = "Low Match"

    strengths = []

    if matched_skills:
        strengths.append(
            "You have relevant skills required for this job."
        )

    if similarity_score >= 50:
        strengths.append(
            "Your resume content is reasonably relevant to the job description."
        )

    suggestions = []

    if missing_skills:
        suggestions.append(
            "Consider developing these skills: "
            + ", ".join(missing_skills)
        )

    if similarity_score < 40:
        suggestions.append(
            "Improve your resume by highlighting projects and experience relevant to this role."
        )

    if not suggestions:
        suggestions.append(
            "Continue improving your relevant projects and practical experience."
        )

    return {
        "success": True,
        "overall_score": overall_score,
        "verdict": verdict,
        "skill_match_score": round(skill_score, 2),
        "text_similarity_score": similarity_score,
        "total_job_skills": len(job_skills),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "strengths": strengths,
        "suggestions": suggestions
    }
