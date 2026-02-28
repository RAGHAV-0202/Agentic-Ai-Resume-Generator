/**
 * ═══════════════════════════════════════════════════════════════════
 * ANALYTICS CONTROLLERS — User + Admin stats endpoints
 * ═══════════════════════════════════════════════════════════════════
 */

import Analytics from "../models/Analytics.model.js";
import Resume from "../models/Resume.model.js";
import User from "../models/User.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

// ====================================================================
// USER ANALYTICS — GET /api/analytics/me
// ====================================================================
export const getUserAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Aggregate totals
    const [totals] = await Analytics.aggregate([
        { $match: { userId } },
        {
            $group: {
                _id: null,
                totalEvents: { $sum: 1 },
                totalTokens: { $sum: "$tokensUsed" },
                totalCharacters: { $sum: "$charactersUsed" },
                aiChats: { $sum: { $cond: [{ $eq: ["$event", "ai_chat"] }, 1, 0] } },
                atsAnalyses: { $sum: { $cond: [{ $eq: ["$event", "ats_analyze"] }, 1, 0] } },
                grammarChecks: { $sum: { $cond: [{ $eq: ["$event", "grammar_check"] }, 1, 0] } },
                ttsRequests: { $sum: { $cond: [{ $eq: ["$event", "tts"] }, 1, 0] } },
                pdfCompiles: { $sum: { $cond: [{ $eq: ["$event", "pdf_compile"] }, 1, 0] } },
            },
        },
    ]);

    // Resume count
    const resumeCount = await Resume.countDocuments({ userId });

    // Activity over last 30 days (daily breakdown)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyActivity = await Analytics.aggregate([
        { $match: { userId, createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 },
                tokens: { $sum: "$tokensUsed" },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            totals: totals || {
                totalEvents: 0, totalTokens: 0, totalCharacters: 0,
                aiChats: 0, atsAnalyses: 0, grammarChecks: 0,
                ttsRequests: 0, pdfCompiles: 0,
            },
            resumeCount,
            dailyActivity,
        }, "User analytics fetched")
    );
});

// ====================================================================
// ADMIN ANALYTICS — GET /api/admin/analytics
// ====================================================================
export const getAdminAnalytics = asyncHandler(async (req, res) => {
    // Platform-wide totals
    const [totals] = await Analytics.aggregate([
        {
            $group: {
                _id: null,
                totalEvents: { $sum: 1 },
                totalTokens: { $sum: "$tokensUsed" },
                totalCharacters: { $sum: "$charactersUsed" },
                aiChats: { $sum: { $cond: [{ $eq: ["$event", "ai_chat"] }, 1, 0] } },
                atsAnalyses: { $sum: { $cond: [{ $eq: ["$event", "ats_analyze"] }, 1, 0] } },
                grammarChecks: { $sum: { $cond: [{ $eq: ["$event", "grammar_check"] }, 1, 0] } },
                ttsRequests: { $sum: { $cond: [{ $eq: ["$event", "tts"] }, 1, 0] } },
                pdfCompiles: { $sum: { $cond: [{ $eq: ["$event", "pdf_compile"] }, 1, 0] } },
                resumeCreates: { $sum: { $cond: [{ $eq: ["$event", "resume_create"] }, 1, 0] } },
            },
        },
    ]);

    // Counts
    const totalUsers = await User.countDocuments();
    const totalResumes = await Resume.countDocuments();

    // Active users (7d and 30d)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeUsers7d] = await Analytics.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: "$userId" } },
        { $count: "count" },
    ]);
    const [activeUsers30d] = await Analytics.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: "$userId" } },
        { $count: "count" },
    ]);

    // Daily platform activity (30 days)
    const dailyActivity = await Analytics.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 },
                tokens: { $sum: "$tokensUsed" },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Top 10 users by activity
    const topUsers = await Analytics.aggregate([
        { $group: { _id: "$userId", events: { $sum: 1 }, tokens: { $sum: "$tokensUsed" } } },
        { $sort: { events: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                events: 1,
                tokens: 1,
                name: { $ifNull: ["$user.fullName", "$user.firstName"] },
                email: "$user.email",
            },
        },
    ]);

    // Event type breakdown
    const eventBreakdown = await Analytics.aggregate([
        { $group: { _id: "$event", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            totals: totals || {
                totalEvents: 0, totalTokens: 0, totalCharacters: 0,
                aiChats: 0, atsAnalyses: 0, grammarChecks: 0,
                ttsRequests: 0, pdfCompiles: 0, resumeCreates: 0,
            },
            totalUsers,
            totalResumes,
            activeUsers7d: activeUsers7d?.count || 0,
            activeUsers30d: activeUsers30d?.count || 0,
            dailyActivity,
            topUsers,
            eventBreakdown,
        }, "Admin analytics fetched")
    );
});
