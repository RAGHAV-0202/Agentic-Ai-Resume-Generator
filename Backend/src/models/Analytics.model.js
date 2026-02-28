/**
 * ═══════════════════════════════════════════════════════════════════
 * ANALYTICS MODEL — Tracks usage events across the platform
 * ═══════════════════════════════════════════════════════════════════
 */

import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        event: {
            type: String,
            enum: [
                "ai_chat",
                "ats_analyze",
                "grammar_check",
                "tts",
                "pdf_compile",
                "resume_create",
            ],
            required: true,
            index: true,
        },
        tokensUsed: {
            type: Number,
            default: 0,
        },
        charactersUsed: {
            type: Number,
            default: 0,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient aggregation queries
analyticsSchema.index({ event: 1, createdAt: -1 });
analyticsSchema.index({ userId: 1, createdAt: -1 });
analyticsSchema.index({ createdAt: -1 });

const Analytics = mongoose.model("Analytics", analyticsSchema);

export default Analytics;
