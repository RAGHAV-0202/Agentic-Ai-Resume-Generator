/**
 * ═══════════════════════════════════════════════════════════════════
 * TTS CONTROLLER — Groq Orpheus Text-to-Speech
 * ═══════════════════════════════════════════════════════════════════
 *
 * Converts text to natural human-like speech using Groq's Orpheus model.
 * Returns audio/wav binary streamed to the client.
 */

import Groq from "groq-sdk";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { trackEvent } from "../middlewares/analytics.middleware.js";
import { getGroqApiKey } from "../utils/apiKeyManager.js";
import dotenv from "dotenv";

dotenv.config();

export const textToSpeech = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const userId = req.user._id;

    if (!text?.trim()) {
        throw new ApiError(400, "Text is required");
    }

    // Clean text for TTS — remove markdown, excess whitespace
    const cleanText = text
        .replace(/[*_#`~]/g, "")
        .replace(/\n{2,}/g, ". ")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 4096); // Groq limit

    if (!cleanText) {
        throw new ApiError(400, "No speakable text after cleaning");
    }

    try {
        const groq = new Groq({ apiKey: getGroqApiKey() });
        const response = await groq.audio.speech.create({
            model: "canopylabs/orpheus-v1-english",
            voice: "hannah",
            input: cleanText,
            response_format: "wav",
        });

        // Track usage
        trackEvent(userId, "tts", {
            charactersUsed: cleanText.length,
        });

        // Stream audio to client
        const buffer = Buffer.from(await response.arrayBuffer());
        res.set({
            "Content-Type": "audio/wav",
            "Content-Length": buffer.length,
            "Cache-Control": "no-cache",
        });
        res.send(buffer);
    } catch (error) {
        console.error("TTS Error:", error.message);
        throw new ApiError(500, "Failed to generate speech: " + error.message);
    }
});
