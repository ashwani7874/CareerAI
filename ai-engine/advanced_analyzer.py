
import re
from collections import Counter


# --------------------------------------------------
# 1. Technical skill database
# --------------------------------------------------

TECHNICAL_SKILLS = {
    "Programming Languages": [
        "python", "java", "javascript", "typescript",
        "c", "c++", "c#", "php", "go", "rust"
    ],
    "Web Development": [
        "html", "css", "react", "angular", "vue",
        "node.js", "express", "django", "flask",
        "fastapi", "spring boot"
    ],
    "Database": [
        "mysql", "mongodb", "postgresql", "sqlite",
        "redis", "oracle", "sql"
    ],
    "AI and Machine Learning": [
        "machine learning", "deep learning",
        "artificial intelligence", "tensorflow",
        "pytorch", "scikit-learn", "pandas",
        "numpy", "nlp", "computer vision",
        "generative ai", "llm"
    ],
    "Tools and Technologies": [
        "git", "github", "docker", "kubernetes",
        "aws", "azure", "gcp", "linux",
        "jenkins", "postman", "rest api"
    ]
}


# --------------------------------------------------
# 2. Resume section detection
# --------------------------------------------------

SECTION_PATTERNS = {
    "Education": [
        r"\beducation\b",
        r"\bacademic background\b",
        r"\bacademic qualification\b"
    ],
    "Experience": [
        r"\bexperience\b",
        r"\bwork history\b",
        r"\bemployment history\b",
        r"\binternship\b"
    ],
    "Projects": [
        r"\bprojects\b",
        r"\bpersonal projects\b",
        r"\bacademic projects\b"
    ],
    "Skills": [
        r"\bskills\b",
        r"\btechnical skills\b",
        r"\bcore competencies\b"
    ],
    "Certifications": [
        r"\bcertifications\b",
        r"\bcertificates\b",
        r"\blicenses\b"
    ],
    "Achievements": [
        r"\bachievements\b",
        r"\bawards\b",
        r"\baccomplishments\b"
    ],
    "Summary": [
        r"\bprofessional summary\b",
        r"\bcareer objective\b",
        r"\bprofile summary\b",
        r"\bsummary\b"
    ]
}


# --------------------------------------------------
# 3. Action verbs for bullet point analysis
# --------------------------------------------------

ACTION_VERBS = {
    "developed", "built", "designed", "implemented",
    "created", "optimized", "improved", "managed",
    "led", "automated", "analyzed", "deployed",
    "engineered", "integrated", "reduced",
    "increased", "achieved", "delivered",
    "launched", "maintained"
}


WEAK_WORDS = {
    "worked on", "responsible for", "helped with",
    "involved in", "did", "made", "good knowledge",
    "hardworking", "team player"
}


# --------------------------------------------------
# 4. Detect resume sections
# --------------------------------------------------

def detect_sections(text):
    detected = []
    lower_text = text.lower()

    for section, patterns in SECTION_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, lower_text):
                detected.append(section)
                break

    return detected


# --------------------------------------------------
# 5. Extract technical skills
# --------------------------------------------------

def extract_technical_skills(text):
    lower_text = text.lower()
    detected = []

    for category, skills in TECHNICAL_SKILLS.items():
        for skill in skills:
            pattern = r"(?<!\w)" + re.escape(skill.lower()) + r"(?!\w)"

            if re.search(pattern, lower_text):
                detected.append(skill)

    return sorted(set(detected), key=str.lower)


# --------------------------------------------------
# 6. Analyze bullet points
# --------------------------------------------------

def analyze_bullet_points(text):
    lines = [
        line.strip(" \t-•*")
        for line in text.splitlines()
        if len(line.strip()) > 20
    ]

    weak_points = []
    strong_points = []
    quantified_points = []

    for line in lines:
        lower = line.lower()

        if any(word in lower for word in WEAK_WORDS):
            weak_points.append(line)

        elif any(
            lower.startswith(verb + " ")
            for verb in ACTION_VERBS
        ):
            strong_points.append(line)

        if re.search(r"\b\d+(\.\d+)?\s*%?\b", line):
            quantified_points.append(line)

    return {
        "total_lines_analyzed": len(lines),
        "strong_bullet_points": strong_points[:10],
        "weak_bullet_points": weak_points[:10],
        "quantified_achievements": quantified_points[:10],
        "strong_bullet_count": len(strong_points),
        "weak_bullet_count": len(weak_points),
        "quantified_achievement_count": len(quantified_points)
    }


# --------------------------------------------------
# 7. Analyze resume content
# --------------------------------------------------

def analyze_resume_content(text):
    word_count = len(re.findall(r"\b[\w+#.]+\b", text))
    sections = detect_sections(text)
    skills = extract_technical_skills(text)
    bullet_analysis = analyze_bullet_points(text)

    missing_sections = [
        section
        for section in SECTION_PATTERNS
        if section not in sections
    ]

    recommendations = []

    if "Summary" not in sections:
        recommendations.append(
            "Add a professional summary describing your background and career goals."
        )

    if "Projects" not in sections:
        recommendations.append(
            "Add relevant projects demonstrating practical technical skills."
        )

    if "Education" not in sections:
        recommendations.append(
            "Include your educational qualifications."
        )

    if "Experience" not in sections:
        recommendations.append(
            "Include internships, work experience or relevant practical experience where applicable."
        )

    if bullet_analysis["weak_bullet_count"] > 0:
        recommendations.append(
            "Rewrite vague descriptions using specific actions and outcomes."
        )

    if bullet_analysis["quantified_achievement_count"] == 0:
        recommendations.append(
            "Add measurable outcomes such as percentages, time saved or project scale where truthful."
        )

    if len(skills) < 5:
        recommendations.append(
            "Include relevant technical skills that you can genuinely demonstrate."
        )

    if word_count < 150:
        recommendations.append(
            "Your resume has limited content. Add relevant projects, skills and achievements."
        )

    return {
        "word_count": word_count,
        "detected_sections": sections,
        "missing_sections": missing_sections,
        "detected_skills": skills,
        "bullet_analysis": bullet_analysis,
        "recommendations": recommendations
    }


# --------------------------------------------------
# 8. Compare resume against a job description
# --------------------------------------------------

def analyze_job_keywords(resume_text, job_description):
    resume_skills = set(extract_technical_skills(resume_text))
    job_skills = set(extract_technical_skills(job_description))

    matched = sorted(resume_skills.intersection(job_skills))
    missing = sorted(job_skills - resume_skills)

    if job_skills:
        match_percentage = round(
            len(matched) / len(job_skills) * 100,
            2
        )
    else:
        match_percentage = 0

    return {
        "job_skills": sorted(job_skills),
        "matched_skills": matched,
        "missing_skills": missing,
        "keyword_match_percentage": match_percentage
    }


# --------------------------------------------------
# 9. Main advanced analyzer
# --------------------------------------------------

def advanced_resume_analysis(resume_text, job_description=None):
    if not isinstance(resume_text, str) or not resume_text.strip():
        raise ValueError("Resume text cannot be empty.")

    resume_analysis = analyze_resume_content(resume_text)

    job_analysis = None

    if job_description and job_description.strip():
        job_analysis = analyze_job_keywords(
            resume_text,
            job_description
        )

    return {
        "success": True,
        "resume_analysis": resume_analysis,
        "job_analysis": job_analysis
    }
