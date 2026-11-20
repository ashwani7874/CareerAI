
const fs = require("fs");
const pdf = require("pdf-parse");
const mongoose = require("mongoose");
const Resume = require("../models/Resume");

// Extract technical skills
const extractSkills = (text) => {
    const skillList = [
        "Java", "Python", "C++", "JavaScript", "TypeScript",
        "SQL", "MongoDB", "MySQL", "PostgreSQL", "React",
        "Node.js", "Express.js", "Spring Boot",
        "Machine Learning", "Deep Learning",
        "Artificial Intelligence", "TensorFlow", "PyTorch",
        "Scikit-learn", "Pandas", "NumPy", "Matplotlib",
        "Git", "GitHub", "Docker", "Kubernetes", "AWS",
        "REST API", "HTML", "CSS"
    ];

    const lowerText = text.toLowerCase();

    return skillList.filter(skill =>
        lowerText.includes(skill.toLowerCase())
    );
};

// Calculate basic resume score
const calculateResumeScore = (skills, text) => {
    let score = 0;

    score += Math.min(skills.length * 4, 40);

    const wordCount = text.trim().split(/\s+/).length;

    if (wordCount >= 300) score += 20;
    else if (wordCount >= 150) score += 10;

    if (/projects/i.test(text)) score += 15;
    if (/education/i.test(text)) score += 15;
    if (/experience|internship/i.test(text)) score += 10;

    return Math.min(score, 100);
};

// Upload and analyze resume
exports.uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a PDF file"
            });
        }

        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdf(dataBuffer);

        const skills = extractSkills(pdfData.text);
        const score = calculateResumeScore(
            skills,
            pdfData.text
        );

        const resume = await Resume.create({
            user: req.user.id,
            originalName: req.file.originalname,
            filePath: req.file.path,
            extractedText: pdfData.text,
            skills,
            score
        });

        res.status(201).json({
            success: true,
            message: "Resume uploaded and analyzed successfully",
            resume: {
                id: resume._id,
                originalName: resume.originalName,
                skills: resume.skills,
                score: resume.score,
                extractedText: resume.extractedText
            }
        });

    } catch (error) {
        console.error("Upload Error:", error);

        if (req.file) {
            fs.promises.unlink(req.file.path).catch(() => {});
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all resumes
exports.getAllResumes = async (req, res) => {
    try {
        const resumes = await Resume.find({
            user: req.user.id
        })
            .select("-extractedText -filePath")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: resumes.length,
            resumes
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get resume by ID
exports.getResumeById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume ID"
            });
        }

        const resume = await Resume.findOne({
            _id: id,
            user: req.user.id
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        res.status(200).json({
            success: true,
            resume
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete resume
exports.deleteResume = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume ID"
            });
        }

        const resume = await Resume.findOneAndDelete({
            _id: id,
            user: req.user.id
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        try {
            await fs.promises.unlink(resume.filePath);
        } catch (fileError) {
            if (fileError.code !== "ENOENT") {
                console.error("File deletion error:", fileError);
            }
        }

        res.status(200).json({
            success: true,
            message: "Resume deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Match resume with a job description using Python AI engine
exports.matchResumeToJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { jobDescription } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume ID"
            });
        }

        if (
            typeof jobDescription !== "string" ||
            !jobDescription.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a job description"
            });
        }

        const resume = await Resume.findOne({
            _id: id,
            user: req.user.id
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        const aiServiceUrl =
            process.env.AI_SERVICE_URL ||
            "http://127.0.0.1:8000";

        const aiResponse = await fetch(
            `${aiServiceUrl}/analyze`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    resume_text: resume.extractedText,
                    job_description: jobDescription
                }),
                signal: AbortSignal.timeout(30000)
            }
        );

        const result = await aiResponse.json();

        if (!aiResponse.ok) {
            return res.status(aiResponse.status).json({
                success: false,
                message: result.detail || "AI analysis failed"
            });
        }

        res.status(200).json({
            success: true,
            message: "Job matching completed successfully",
            resumeId: resume._id,
            analysis: result
        });

    } catch (error) {
        console.error("AI Matching Error:", error);

        res.status(503).json({
            success: false,
            message: "AI service is unavailable. Make sure the Python AI engine is running.",
            error: error.message
        });
    }
};
