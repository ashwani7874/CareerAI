
const mongoose = require("mongoose");
const Resume = require("../models/Resume");

// Generate AI resume feedback
exports.getResumeFeedback = async (req, res) => {
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

        const aiServiceUrl =
            process.env.AI_SERVICE_URL ||
            "http://127.0.0.1:8000";

        const aiResponse = await fetch(
            `${aiServiceUrl}/feedback`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    resume_text: resume.extractedText
                }),
                signal: AbortSignal.timeout(30000)
            }
        );

        const result = await aiResponse.json();

        if (!aiResponse.ok) {
            return res.status(aiResponse.status).json({
                success: false,
                message: result.detail || "Resume feedback failed"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Resume feedback generated successfully",
            resumeId: resume._id,
            originalName: resume.originalName,
            feedback: result
        });

    } catch (error) {
        console.error("Resume Feedback Error:", error);

        return res.status(503).json({
            success: false,
            message: "AI service is unavailable",
            error: error.message
        });
    }
};
