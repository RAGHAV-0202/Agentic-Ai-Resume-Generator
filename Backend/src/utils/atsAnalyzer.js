/**
 * ═══════════════════════════════════════════════════════════════════
 * ATS SCORE ANALYZER — AI-powered Job Description Matching
 * ═══════════════════════════════════════════════════════════════════
 *
 * Compares resume data against a job description using Groq LLM.
 * Returns match score, keyword analysis, and actionable suggestions.
 */

import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

// ═══════════════════════════════════════════════════════════════════
// MODEL CONFIG (shared with agentSystem)
// ═══════════════════════════════════════════════════════════════════
const GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "qwen/qwen3-32b",
    "moonshotai/kimi-k2-instruct",
    "openai/gpt-oss-20b",
    "moonshotai/kimi-k2-instruct-0905",
    "llama-3.1-8b-instant",
];

const modelState = { cooldowns: {}, preferredIndex: 0 };

const getModelOrder = () => {
    const now = Date.now();
    if (!modelState.cooldowns[GROQ_MODELS[0]] || now >= modelState.cooldowns[GROQ_MODELS[0]]) {
        modelState.preferredIndex = 0;
    }
    const ordered = [];
    for (let i = 0; i < GROQ_MODELS.length; i++) {
        const idx = (modelState.preferredIndex + i) % GROQ_MODELS.length;
        const model = GROQ_MODELS[idx];
        if (now >= (modelState.cooldowns[model] || 0)) ordered.push(model);
    }
    return ordered;
};

const callGroq = async (messages, apiKey) => {
    const models = getModelOrder();
    let lastError;
    for (const model of models) {
        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: 0.3,
                    max_tokens: 4096,
                    response_format: { type: "json_object" },
                }),
            });
            if (!response.ok) {
                const err = await response.text();
                if (response.status === 429) {
                    modelState.cooldowns[model] = Date.now() + 60000;
                }
                throw new Error(`${model}: ${response.status} — ${err}`);
            }
            const data = await response.json();
            const idx = GROQ_MODELS.indexOf(model);
            if (idx >= 0) modelState.preferredIndex = idx;
            return data.choices[0].message.content;
        } catch (error) {
            console.error(`❌ ATS Analyzer — ${model} failed:`, error.message);
            lastError = error;
        }
    }
    throw lastError || new Error("All models failed for ATS analysis");
};

// ═══════════════════════════════════════════════════════════════════
// EXTRACT RESUME TEXT FOR ANALYSIS
// ═══════════════════════════════════════════════════════════════════
const extractResumeText = (resumeData) => {
    const parts = [];

    // Personal
    const p = resumeData?.personal || {};
    if (p.name) parts.push(`Name: ${p.name}`);
    if (p.location) parts.push(`Location: ${p.location}`);

    // Education
    (resumeData?.education || []).forEach(e => {
        if (!e?.institution) return;
        parts.push(`Education: ${e.degree || ""} at ${e.institution} (${e.startDate || ""} – ${e.endDate || ""})`);
        if (e.coursework?.length) parts.push(`Coursework: ${e.coursework.join(", ")}`);
    });

    // Experience
    (resumeData?.experience || []).forEach(e => {
        if (!e?.company) return;
        parts.push(`Experience: ${e.position || ""} at ${e.company} (${e.startDate || ""} – ${e.endDate || ""})`);
        if (e.highlights?.length) parts.push(`• ${e.highlights.join("\n• ")}`);
    });

    // Projects
    (resumeData?.projects || []).forEach(p => {
        if (!p?.name) return;
        parts.push(`Project: ${p.name}`);
        if (p.technologies?.length) parts.push(`Technologies: ${p.technologies.join(", ")}`);
        if (p.highlights?.length) parts.push(`• ${p.highlights.join("\n• ")}`);
    });

    // Skills
    const skills = resumeData?.skills || {};
    const allSkills = [
        ...(skills.languages || []),
        ...(skills.frameworks || []),
        ...(skills.developerTools || []),
        ...(skills.libraries || []),
        ...(skills.technologies || []),
        ...((skills.customSkills || []).flatMap(cs => cs.items || [])),
    ].filter(Boolean);
    if (allSkills.length) parts.push(`Skills: ${allSkills.join(", ")}`);

    // Achievements
    const achievements = resumeData?.achievements || [];
    if (achievements.length) parts.push(`Achievements: ${achievements.join("; ")}`);

    return parts.join("\n");
};

// ═══════════════════════════════════════════════════════════════════
// MAIN ANALYSIS FUNCTION
// ═══════════════════════════════════════════════════════════════════
export const analyzeATSMatch = async (resumeData, jobDescription, apiKey) => {
    const resumeText = extractResumeText(resumeData);

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer. 
Your job is to compare a resume against a job description and provide a detailed match analysis.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no explanation outside the JSON.

Respond with this exact JSON structure:
{
  "matchScore": <number 0-100>,
  "matchedKeywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["keyword1", "keyword2", ...],
  "sectionScores": {
    "experience": { "score": <0-100>, "feedback": "brief feedback" },
    "skills": { "score": <0-100>, "feedback": "brief feedback" },
    "projects": { "score": <0-100>, "feedback": "brief feedback" },
    "education": { "score": <0-100>, "feedback": "brief feedback" }
  },
  "suggestions": [
    "actionable suggestion 1",
    "actionable suggestion 2",
    "actionable suggestion 3",
    "actionable suggestion 4",
    "actionable suggestion 5"
  ],
  "summary": "2-3 sentence overall assessment"
}

Rules:
- matchedKeywords: Important skills, technologies, and qualifications found in BOTH the resume and JD.
- missingKeywords: Important requirements from the JD that are NOT in the resume. Limit to top 10.
- suggestions: Specific, actionable improvements the candidate can make. Exactly 5.
- Be fair but thorough. A perfect match is rare — most scores should be 40-85.`;

    const userPrompt = `## Resume:
${resumeText}

## Job Description:
${jobDescription}

Analyze how well this resume matches the job description. Return the JSON analysis.`;

    const rawResponse = await callGroq([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
    ], apiKey);

    try {
        const analysis = JSON.parse(rawResponse);
        // Validate and clamp
        analysis.matchScore = Math.max(0, Math.min(100, Number(analysis.matchScore) || 0));
        analysis.matchedKeywords = Array.isArray(analysis.matchedKeywords) ? analysis.matchedKeywords : [];
        analysis.missingKeywords = Array.isArray(analysis.missingKeywords) ? analysis.missingKeywords : [];
        analysis.suggestions = Array.isArray(analysis.suggestions) ? analysis.suggestions.slice(0, 5) : [];
        return analysis;
    } catch (err) {
        console.error("Failed to parse ATS analysis JSON:", err.message);
        throw new Error("Failed to parse ATS analysis response");
    }
};
