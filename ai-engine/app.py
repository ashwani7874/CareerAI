
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = FastAPI(
    title="CareerAI AI Engine",
    description="Resume analysis, job matching and feedback",
    version="2.0.0"
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
    "Algorithms", "OOP", "FastAPI", "Flask"
]

SECTIONS = {
    "contact": ["email", "phone", "linkedin", "github"],
    "summary": ["summary", "objective", "professional profile"],
    "education": ["education", "academic qualification"],
    "skills": ["technical skills", "skills", "technologies"],
    "projects": ["projects", "personal projects", "academic projects"],
    "experience": ["experience", "work experience", "internship"],
    "certifications": ["certifications", "certificates"]
}


class MatchRequest(BaseModel):
    resume_text: str
    job_description: str


class FeedbackRequest(BaseModel):
    resume_text: str


def extract_skills(text):
    text_lower = text.lower()
    found = []

    for skill in SKILLS:
        pattern = r"(?<!\w)" + re.escape(skill.lower()) + r"(?!\w)"

        if re.search(pattern, text_lower):
            found.append(skill)

    return found


def calculate_similarity(resume_text, job_description):
    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2)
        )

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
        "message": "CareerAI AI Engine is running",
        "version": "2.0.0"
    }


# JOB DESCRIPTION MATCHING
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

    skill_score = (
        len(matched_skills) / len(job_skills) * 100
        if job_skills else 0
    )

    similarity_score = calculate_similarity(
        resume_text,
        job_description
    )

    overall_score = (
        skill_score * 0.7 + similarity_score * 0.3
        if job_skills else similarity_score
    )

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
            "Your resume contains skills relevant to this job."
        )

    if similarity_score >= 50:
        strengths.append(
            "Your resume content has reasonable similarity to the job description."
        )

    suggestions = []

    if missing_skills:
        suggestions.append(
            "Consider developing these job-related skills: "
            + ", ".join(missing_skills)
        )

    if similarity_score < 40:
        suggestions.append(
            "Highlight projects and experience relevant to this job."
        )

    if not suggestions:
        suggestions.append(
            "Continue strengthening your relevant projects and experience."
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


# RESUME FEEDBACK
@app.post("/feedback")
def resume_feedback(request: FeedbackRequest):

    text = request.resume_text.strip()

    if len(text) < 50:
        raise HTTPException(
            status_code=400,
            detail="Resume text is too short to analyze"
        )

    lower_text = text.lower()
    word_count = len(text.split())

    # Detect resume sections
    detected_sections = []
    missing_sections = []

    for section, keywords in SECTIONS.items():
        found = any(keyword in lower_text for keyword in keywords)

        if found:
            detected_sections.append(section)
        else:
            missing_sections.append(section)

    # Extract technical skills
    skills = extract_skills(text)

    # Analyze bullet points
    bullet_count = len(
        re.findall(r"(?m)^\s*(?:[-*•]|\d+[.)])\s+", text)
    )

    # Detect measurable achievements
    has_numbers = bool(
        re.search(r"\b\d+(?:\.\d+)?%?\b", text)
    )

    # Detect action verbs
    action_verbs = [
        "developed", "built", "created", "implemented",
        "designed", "managed", "improved", "optimized",
        "analyzed", "deployed", "automated", "led"
    ]

    action_verb_count = sum(
        len(re.findall(r"\b" + verb + r"\b", lower_text))
        for verb in action_verbs
    )

    strengths = []
    weaknesses = []
    suggestions = []

    # Section feedback
    if "education" in detected_sections:
        strengths.append("Education information is present.")
    else:
        weaknesses.append("Education section was not detected.")
        suggestions.append(
            "Add your degree, college, graduation year and relevant coursework."
        )

    if "skills" in detected_sections:
        strengths.append("A skills section is present.")
    else:
        weaknesses.append("A dedicated skills section was not detected.")
        suggestions.append(
            "Add a dedicated technical skills section."
        )

    if "projects" in detected_sections:
        strengths.append("Projects section is present.")
    else:
        weaknesses.append("Projects section was not detected.")
        suggestions.append(
            "Add 2-3 relevant projects with technologies and outcomes."
        )

    if "experience" in detected_sections:
        strengths.append("Experience or internship information is present.")
    else:
        suggestions.append(
            "If applicable, include internships, work experience or practical training."
        )

    if "summary" in detected_sections:
        strengths.append("Professional summary or objective is present.")
    else:
        weaknesses.append("Professional summary was not detected.")
        suggestions.append(
            "Add a short professional summary tailored to your target role."
        )

    if "certifications" not in detected_sections:
        suggestions.append(
            "Include relevant certifications if you have completed any."
        )

    # Content quality
    if word_count < 150:
        weaknesses.append("Resume content appears very short.")
        suggestions.append(
            "Add relevant details about skills, projects, education and experience."
        )
    elif word_count >= 300:
        strengths.append("Resume contains a reasonable amount of content.")

    if bullet_count >= 3:
        strengths.append("Resume uses bullet points to present information.")
    else:
        weaknesses.append("Few structured bullet points were detected.")
        suggestions.append(
            "Use concise bullet points instead of long paragraphs."
        )

    if has_numbers:
        strengths.append("Measurable numbers or figures were detected.")
    else:
        weaknesses.append("Few measurable achievements were detected.")
        suggestions.append(
            "Add numbers, percentages or measurable project results where accurate."
        )

    if action_verb_count >= 2:
        strengths.append("Action-oriented language was detected.")
    else:
        suggestions.append(
            "Start project and experience descriptions with strong action verbs such as Developed, Built or Implemented."
        )

    if skills:
        strengths.append(
            "Detected technical skills: " + ", ".join(skills)
        )
    else:
        weaknesses.append("No recognized technical skills were detected.")
        suggestions.append(
            "Include relevant technical skills using their accurate names."
        )

    # Calculate a rule-based feedback score
    score = 0

    score += len(detected_sections) / len(SECTIONS) * 50
    score += min(word_count / 400, 1) * 15
    score += min(bullet_count / 6, 1) * 10
    score += 10 if has_numbers else 0
    score += min(action_verb_count / 4, 1) * 10
    score += 5 if skills else 0

    score = round(min(score, 100), 2)

    if score >= 80:
        rating = "Strong Resume"
    elif score >= 60:
        rating = "Good Resume"
    elif score >= 40:
        rating = "Needs Improvement"
    else:
        rating = "Needs Major Improvement"

    if not suggestions:
        suggestions.append(
            "Continue tailoring your resume to each job description."
        )

    return {
        "success": True,
        "feedback_score": score,
        "rating": rating,
        "word_count": word_count,
        "detected_sections": detected_sections,
        "missing_sections": missing_sections,
        "detected_skills": skills,
        "bullet_points": bullet_count,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions
    }
