
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

router.use(protect);

router.post("/upload", upload.single("resume"), uploadResume);

router.get("/", getAllResumes);

// Match route before the generic ID route for clarity
router.post("/:id/match", matchResumeToJob);

router.get("/:id", getResumeById);

router.delete("/:id", deleteResume);

module.exports = router;
