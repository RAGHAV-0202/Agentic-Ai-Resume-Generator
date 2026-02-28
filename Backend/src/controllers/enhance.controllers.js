/**
 * ═══════════════════════════════════════════════════════════════════
 * ENHANCE CONTROLLER — AI Bullet Point Enhancer
 * ═══════════════════════════════════════════════════════════════════
 *
 * Rewrites a resume bullet point to be more impactful using
 * action verbs, metrics, and concise professional language.
 */

import Groq from "groq-sdk";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { trackEvent } from "../middlewares/analytics.middleware.js";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const enhanceBullet = asyncHandler(async (req, res) => {
    const { text, context } = req.body;
    const userId = req.user._id;

    if (!text?.trim()) {
        throw new ApiError(400, "Bullet point text is required");
    }

    const systemPrompt = `You are an expert resume writer. Rewrite the given bullet point to be more impactful for a professional resume.

Rules:
- Start with a strong action verb (e.g., Engineered, Spearheaded, Optimized, Architected)
- Include quantifiable metrics where possible (e.g., "by 40%", "10K+ users", "$2M revenue")
- Keep it concise — one line, under 120 characters ideally
- Use professional, industry-standard language
- If the original is already great, improve it slightly or keep it
- Return ONLY the enhanced bullet point text, nothing else — no quotes, no prefix, no explanation

${context ? `Context: The person works as ${context}` : ""}`;

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text.trim() },
            ],
            temperature: 0.7,
            max_tokens: 150,
        });

        const enhanced = completion.choices[0]?.message?.content?.trim() || text;
        const tokensUsed = completion.usage?.total_tokens || 0;

        trackEvent(userId, "ai_chat", { tokensUsed, metadata: { type: "enhance_bullet" } });

        res.status(200).json(
            new ApiResponse(200, { enhanced, original: text.trim() }, "Bullet point enhanced")
        );
    } catch (error) {
        console.error("Enhance error:", error.message);
        throw new ApiError(500, "Failed to enhance bullet point: " + error.message);
    }
});
