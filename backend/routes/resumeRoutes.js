
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
    uploadResume,
    getAllResumes,
    getResumeById,
    deleteResume,
    matchResumeToJob
} = require("../controllers/resumeController");

const {
    getResumeFeedback
} = require("../controllers/aiController");

router.use(protect);

// Upload resume
router.post("/upload", upload.single("resume"), uploadResume);

// Get all resumes
router.get("/", getAllResumes);

// Job description matching
router.post("/:id/match", matchResumeToJob);

// Resume feedback
router.post("/:id/feedback", getResumeFeedback);

// Get one resume
router.get("/:id", getResumeById);

// Delete resume
router.delete("/:id", deleteResume);

module.exports = router;
