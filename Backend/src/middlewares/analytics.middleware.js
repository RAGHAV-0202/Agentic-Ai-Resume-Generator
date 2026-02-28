/**
 * ═══════════════════════════════════════════════════════════════════
 * ANALYTICS MIDDLEWARE — Event tracking helper
 * ═══════════════════════════════════════════════════════════════════
 *
 * Fire-and-forget tracking. Never throws — failures are logged silently.
 */

import Analytics from "../models/Analytics.model.js";

/**
 * Track a usage event.
 * @param {string} userId - User ID
 * @param {string} event - Event type (ai_chat, ats_analyze, grammar_check, tts, pdf_compile, resume_create)
 * @param {object} data - { tokensUsed, charactersUsed, ...metadata }
 */
export const trackEvent = (userId, event, data = {}) => {
    const { tokensUsed = 0, charactersUsed = 0, ...metadata } = data;

    // Fire and forget — don't await, don't block
    Analytics.create({
        userId,
        event,
        tokensUsed,
        charactersUsed,
        metadata,
    }).catch((err) => {
        console.error(`⚠️ Analytics tracking failed [${event}]:`, err.message);
    });
};
