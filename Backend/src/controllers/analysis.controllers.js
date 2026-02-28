/**
 * ═══════════════════════════════════════════════════════════════════
 * AI ANALYSIS CONTROLLERS — ATS Analyzer & Grammar Checker
 * ═══════════════════════════════════════════════════════════════════
 */

import Resume from "../models/Resume.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { analyzeATSMatch } from "../utils/atsAnalyzer.js";
import { checkGrammarAndTone } from "../utils/grammarChecker.js";
import dotenv from "dotenv";

dotenv.config();

// ====================================================================
// ATS SCORE ANALYZER
// ====================================================================
export const atsAnalyze = asyncHandler(async (req, res) => {
    const { resumeId, jobDescription } = req.body;
    const userId = req.user._id;

    if (!resumeId || !jobDescription?.trim()) {
        throw new ApiError(400, "resumeId and jobDescription are required");
    }

    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
        throw new ApiError(404, "Resume not found or unauthorized");
    }

    const resumeData = resume.data?.toObject ? resume.data.toObject() : resume.data;

    const analysis = await analyzeATSMatch(
        resumeData,
        jobDescription.trim(),
        process.env.GROQ_API_KEY
    );

    res.status(200).json(
        new ApiResponse(200, { analysis }, "ATS analysis completed successfully")
    );
});

// ====================================================================
// GRAMMAR & TONE CHECKER
// ====================================================================
export const grammarCheck = asyncHandler(async (req, res) => {
    const { resumeId } = req.body;
    const userId = req.user._id;

    if (!resumeId) {
        throw new ApiError(400, "resumeId is required");
    }

    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
        throw new ApiError(404, "Resume not found or unauthorized");
    }

    const resumeData = resume.data?.toObject ? resume.data.toObject() : resume.data;

    const analysis = await checkGrammarAndTone(
        resumeData,
        process.env.GROQ_API_KEY
    );

    res.status(200).json(
        new ApiResponse(200, { analysis }, "Grammar check completed successfully")
    );
});
