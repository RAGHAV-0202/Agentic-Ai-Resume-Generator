/**
 * ═══════════════════════════════════════════════════════════════════
 * GRAMMAR & TONE CHECKER — AI-powered Resume Language Analysis
 * ═══════════════════════════════════════════════════════════════════
 *
 * Extracts all text content from resume data and sends it to Groq
 * for grammar, tone, and clarity analysis.
 */

import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "qwen/qwen3-32b",
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
                    temperature: 0.2,
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
            console.error(`❌ Grammar Checker — ${model} failed:`, error.message);
            lastError = error;
        }
    }
    throw lastError || new Error("All models failed for grammar check");
};

// ═══════════════════════════════════════════════════════════════════
// EXTRACT TEXT ITEMS WITH LOCATION METADATA
// ═══════════════════════════════════════════════════════════════════
const extractTextItems = (resumeData) => {
    const items = [];

    // Experience highlights
    (resumeData?.experience || []).forEach((exp, idx) => {
        (exp.highlights || []).forEach((h, hIdx) => {
            if (h && h.trim() && h !== "_skipped") {
                items.push({
                    text: h,
                    section: "experience",
                    field: "highlights",
                    arrayIndex: idx,
                    subIndex: hIdx,
                    context: `${exp.position || "Role"} at ${exp.company || "Company"}`,
                });
            }
        });
    });

    // Project highlights
    (resumeData?.projects || []).forEach((proj, idx) => {
        (proj.highlights || []).forEach((h, hIdx) => {
            if (h && h.trim() && h !== "_skipped") {
                items.push({
                    text: h,
                    section: "projects",
                    field: "highlights",
                    arrayIndex: idx,
                    subIndex: hIdx,
                    context: `Project: ${proj.name || "Unnamed"}`,
                });
            }
        });
    });

    // Achievements
    (resumeData?.achievements || []).forEach((a, idx) => {
        if (a && a.trim() && a !== "_skipped") {
            items.push({
                text: a,
                section: "achievements",
                field: "list",
                arrayIndex: idx,
                subIndex: 0,
                context: "Achievement",
            });
        }
    });

    return items;
};

// ═══════════════════════════════════════════════════════════════════
// MAIN GRAMMAR CHECK FUNCTION
// ═══════════════════════════════════════════════════════════════════
export const checkGrammarAndTone = async (resumeData, apiKey) => {
    const textItems = extractTextItems(resumeData);

    if (textItems.length === 0) {
        return {
            issues: [],
            overallTone: "neutral",
            overallScore: 100,
            summary: "No text content to analyze. Add experience highlights, project descriptions, or achievements first.",
        };
    }

    // Build the numbered text list for analysis
    const numberedText = textItems
        .map((item, i) => `[${i}] (${item.context}) "${item.text}"`)
        .join("\n");

    const systemPrompt = `You are an expert resume language reviewer. Analyze each numbered text item for grammar, professional tone, clarity, and impact.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no explanation outside the JSON.

Respond with this exact JSON structure:
{
  "issues": [
    {
      "index": <number matching the [N] index>,
      "original": "the original text",
      "suggestion": "the improved text",
      "type": "grammar" | "tone" | "clarity" | "weak_verb",
      "explanation": "brief explanation of the issue"
    }
  ],
  "overallTone": "professional" | "casual" | "mixed" | "excellent",
  "overallScore": <number 0-100>,
  "summary": "2-3 sentence overall assessment of the writing quality"
}

Rules:
- Only flag real issues — don't be overly pedantic.
- "weak_verb" = passive voice or weak action verbs (e.g., "was responsible for" → "Led", "worked on" → "Developed").
- "tone" = too casual or inconsistent tone for a professional resume.
- "clarity" = vague, wordy, or unclear phrasing.
- "grammar" = actual grammatical errors, spelling, punctuation.
- For each issue, provide a concrete improved version.
- If a bullet point is already excellent, don't include it.
- overallScore: 90-100 = excellent, 70-89 = good, 50-69 = needs work, below 50 = significant issues.`;

    const userPrompt = `Analyze these resume text items for grammar, tone, and clarity:

${numberedText}

Return the JSON analysis.`;

    const rawResponse = await callGroq([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
    ], apiKey);

    try {
        const analysis = JSON.parse(rawResponse);

        // Enrich issues with location metadata
        const enrichedIssues = (analysis.issues || []).map(issue => {
            const sourceItem = textItems[issue.index];
            if (!sourceItem) return null;
            return {
                ...issue,
                section: sourceItem.section,
                field: sourceItem.field,
                arrayIndex: sourceItem.arrayIndex,
                subIndex: sourceItem.subIndex,
                context: sourceItem.context,
            };
        }).filter(Boolean);

        return {
            issues: enrichedIssues,
            overallTone: analysis.overallTone || "mixed",
            overallScore: Math.max(0, Math.min(100, Number(analysis.overallScore) || 70)),
            summary: analysis.summary || "Analysis complete.",
        };
    } catch (err) {
        console.error("Failed to parse grammar check JSON:", err.message);
        throw new Error("Failed to parse grammar check response");
    }
};
