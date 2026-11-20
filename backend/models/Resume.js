
const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        originalName: {
            type: String,
            required: true
        },

        filePath: {
            type: String,
            required: true
        },

        extractedText: {
            type: String,
            default: ""
        },

        skills: {
            type: [String],
            default: []
        },

        score: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Resume", resumeSchema);
