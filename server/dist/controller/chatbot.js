"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithAI = chatWithAI;
exports.recommendWorkers = recommendWorkers;
// Flexible validation - just check if it's not empty
function validateQuestion(question) {
    if (!question || question.trim().length === 0) {
        return { valid: false, message: "Please enter a question." };
    }
    // Very lenient - just check if it has at least 3 characters
    if (question.trim().length < 3) {
        return { valid: false, message: "Please enter a valid question." };
    }
    return { valid: true };
}
function chatWithAI(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        try {
            const { message } = req.body;
            if (!message || typeof message !== "string") {
                return res.status(400).json({ error: "Message is required" });
            }
            // Basic validation - just check if question exists
            const validation = validateQuestion(message);
            if (!validation.valid) {
                return res.status(400).json({ error: validation.message });
            }
            // Check if API key is configured
            const apiKey = process.env.BLACKBOX_API_KEY; // Keep using BLACKBOX_API_KEY env var name
            if (!apiKey) {
                console.error("BLACKBOX_API_KEY (Gemini API Key) is not configured in environment variables");
                return res.status(500).json({ error: "Chatbot service is not configured" });
            }
            console.log("Calling Google Gemini API with message:", message.substring(0, 50) + "...");
            // Prepare request body with improved system prompt
            const requestBody = {
                contents: [{
                        parts: [{
                                text: `You are a friendly, helpful, and knowledgeable medical assistant chatbot. Your role is to provide comprehensive, accurate medical information in a conversational and easy-to-understand manner.

IMPORTANT GUIDELINES:
- Answer questions naturally and conversationally, just like a real chatbot
- Provide complete, detailed answers - don't truncate responses mid-sentence
- Understand questions even if they have spelling mistakes or are asked in casual ways
- You can understand medical questions in ANY format - formal, casual, with typos, abbreviations, etc.
- Do not include a brief disclaimer that you provide general information and are not a substitute for professional medical advice
- Be empathetic, clear, and thorough in your responses
- If a question seems medical/health-related (even if unclear), do your best to understand and answer it
- If a paitent is asking about a specific medicine, do your research and give the best medicines
-

User's question (may have typos or be in any format): ${message}

Please provide a complete, detailed, and helpful response:`
                            }]
                    }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 2048, // Increased for full answers
                    topP: 0.95,
                    topK: 40,
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            };
            // First, try to list available models to see what's accessible
            let availableModels = [];
            try {
                const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                const listResponse = yield fetch(listUrl);
                const listData = yield listResponse.json();
                if (listResponse.ok && listData.models) {
                    availableModels = listData.models
                        .filter((m) => { var _a; return (_a = m.supportedGenerationMethods) === null || _a === void 0 ? void 0 : _a.includes("generateContent"); })
                        .map((m) => { var _a; return (_a = m.name) === null || _a === void 0 ? void 0 : _a.replace("models/", ""); });
                    console.log("Available models:", availableModels);
                }
            }
            catch (listError) {
                console.log("Could not list models, will try default models");
            }
            // Try different API versions and model names
            const apiVersions = ["v1beta", "v1"];
            const defaultModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
            const modelsToTry = availableModels.length > 0 ? availableModels : defaultModels;
            let data = null;
            let lastError = null;
            // Try each API version
            for (const version of apiVersions) {
                // Try each model
                for (const model of modelsToTry) {
                    try {
                        const geminiUrl = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
                        console.log(`Trying ${version} with model: ${model}`);
                        const response = yield fetch(geminiUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(requestBody),
                        });
                        data = yield response.json();
                        if (!response.ok) {
                            console.error(`Gemini API Error for ${version}/${model}:`, JSON.stringify(data, null, 2));
                            lastError = data;
                            // Continue to next model
                            continue;
                        }
                        // Success! Break out of loops
                        console.log(`Successfully used ${version} with model: ${model}`);
                        break;
                    }
                    catch (fetchError) {
                        console.error(`Fetch error for ${version}/${model}:`, fetchError.message);
                        lastError = fetchError;
                        continue;
                    }
                }
                // If we got a successful response, break out of version loop
                if (data && data.candidates) {
                    break;
                }
            }
            // If all models failed
            if (!data || !data.candidates) {
                console.error("All Gemini models failed. Last error:", lastError);
                const errorMessage = ((_a = lastError === null || lastError === void 0 ? void 0 : lastError.error) === null || _a === void 0 ? void 0 : _a.message) || (lastError === null || lastError === void 0 ? void 0 : lastError.message) || "All model attempts failed";
                return res.status(500).json({
                    error: "Failed to process your question. Please try again later.",
                    details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
                });
            }
            // Extract response from Gemini API format
            const candidate = (_b = data.candidates) === null || _b === void 0 ? void 0 : _b[0];
            if (!candidate) {
                console.error("No candidate in Gemini API response:", JSON.stringify(data, null, 2));
                return res.status(500).json({
                    error: "Failed to generate a response. Please try again.",
                    details: process.env.NODE_ENV === "development" ? "No candidate in API response" : undefined,
                });
            }
            // Check if response was blocked or filtered
            if (candidate.finishReason && candidate.finishReason !== "STOP") {
                console.warn("Response finish reason:", candidate.finishReason);
                if (candidate.finishReason === "SAFETY") {
                    return res.status(400).json({
                        error: "Your question was blocked by safety filters. Please rephrase your question.",
                    });
                }
                if (candidate.finishReason === "MAX_TOKENS") {
                    console.warn("Response may be truncated due to token limit");
                }
            }
            const aiResponse = (_e = (_d = (_c = candidate.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text;
            if (!aiResponse) {
                console.error("No text in Gemini API response:", JSON.stringify(data, null, 2));
                return res.status(500).json({
                    error: "Failed to generate a response. Please try again.",
                    details: process.env.NODE_ENV === "development" ? "No text in API response" : undefined,
                });
            }
            return res.json({
                response: aiResponse,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Chatbot error:", error);
            console.error("Error stack:", error.stack);
            // Provide more detailed error in development
            const errorDetails = process.env.NODE_ENV === "development"
                ? {
                    message: error.message,
                    stack: error.stack,
                    apiKeyPresent: !!process.env.BLACKBOX_API_KEY,
                    apiKeyLength: ((_f = process.env.BLACKBOX_API_KEY) === null || _f === void 0 ? void 0 : _f.length) || 0,
                }
                : undefined;
            return res.status(500).json({
                error: "Failed to process your question. Please try again later.",
                details: errorDetails,
            });
        }
    });
}
/**
 * Fallback recommendation function when AI is unavailable
 * Uses server-side filtering and ranking logic
 */
function getFallbackRecommendations(preferences, workers, res) {
    var _a, _b;
    try {
        let filteredWorkers = [...workers];
        // 1. Filter by role based on careType
        if (preferences.careType && preferences.careType !== "any") {
            const roleMap = {
                "nurse": "Nurse",
                "caretaker": "Caretaker",
                "compounder": "Compounder"
            };
            const targetRole = roleMap[preferences.careType];
            if (targetRole) {
                filteredWorkers = filteredWorkers.filter((w) => w.role === targetRole);
                console.log(`Filtered by role ${targetRole}: ${filteredWorkers.length} workers`);
            }
        }
        // 2. Filter by availability
        filteredWorkers = filteredWorkers.filter((w) => w.isAvailable !== false);
        // 3. Filter by budget
        if (preferences.budget && preferences.budget !== "any") {
            if (preferences.budget === "budget") {
                // ₹400-₹450/hr: Caretaker (₹400) or Compounder (₹450)
                filteredWorkers = filteredWorkers.filter((w) => (w.hourlyRate && w.hourlyRate <= 450) ||
                    (w.role === "Caretaker" && (!w.hourlyRate || w.hourlyRate <= 450)) ||
                    (w.role === "Compounder" && (!w.hourlyRate || w.hourlyRate <= 450)));
            }
            else if (preferences.budget === "moderate") {
                // ₹450-₹500/hr: Mix of Compounder and Nurse
                filteredWorkers = filteredWorkers.filter((w) => (w.hourlyRate && w.hourlyRate >= 450 && w.hourlyRate <= 500) ||
                    (!w.hourlyRate && (w.role === "Compounder" || w.role === "Nurse")));
            }
            else if (preferences.budget === "premium") {
                // ₹500+/hr: Nurse
                filteredWorkers = filteredWorkers.filter((w) => (w.hourlyRate && w.hourlyRate >= 500) ||
                    (w.role === "Nurse" && (!w.hourlyRate || w.hourlyRate >= 500)));
            }
            console.log(`Filtered by budget ${preferences.budget}: ${filteredWorkers.length} workers`);
        }
        // 4. Filter by experience if requested
        if ((_a = preferences.specialRequirements) === null || _a === void 0 ? void 0 : _a.includes("experienced")) {
            filteredWorkers = filteredWorkers.filter((w) => (w.averageRating || 0) >= 4.0 && (w.reviewCount || 0) >= 5);
            console.log(`Filtered by experience: ${filteredWorkers.length} workers`);
        }
        // 5. Sort workers by priority
        filteredWorkers.sort((a, b) => {
            // Primary: Rating (higher is better)
            const ratingA = a.averageRating || 0;
            const ratingB = b.averageRating || 0;
            if (ratingB !== ratingA) {
                return ratingB - ratingA;
            }
            // Secondary: Review count (more reviews = more reliable)
            const reviewsA = a.reviewCount || 0;
            const reviewsB = b.reviewCount || 0;
            if (reviewsB !== reviewsA) {
                return reviewsB - reviewsA;
            }
            // Tertiary: Lower price (better value)
            const rateA = a.hourlyRate || 0;
            const rateB = b.hourlyRate || 0;
            return rateA - rateB;
        });
        // 6. Limit to top 10 workers
        const recommendedWorkers = filteredWorkers.slice(0, 10);
        // 7. Build reasoning
        let reasoning = "Recommended based on your preferences";
        if (preferences.careType && preferences.careType !== "any") {
            const roleMap = {
                "nurse": "Nurses",
                "caretaker": "Caretakers",
                "compounder": "Compounders"
            };
            reasoning += ` (${roleMap[preferences.careType] || "Workers"})`;
        }
        if (preferences.budget && preferences.budget !== "any") {
            reasoning += `, ${preferences.budget} pricing`;
        }
        if ((_b = preferences.specialRequirements) === null || _b === void 0 ? void 0 : _b.includes("experienced")) {
            reasoning += ", highly experienced";
        }
        reasoning += ".";
        console.log(`Fallback recommendation: ${recommendedWorkers.length} workers selected`);
        return res.json({
            workers: recommendedWorkers,
            reasoning,
            count: recommendedWorkers.length,
        });
    }
    catch (error) {
        console.error("Fallback recommendation error:", error);
        // Even if fallback fails, return available workers
        const availableWorkers = workers
            .filter((w) => w.isAvailable !== false)
            .slice(0, 10);
        return res.json({
            workers: availableWorkers,
            reasoning: "Showing available workers",
            count: availableWorkers.length,
        });
    }
}
function recommendWorkers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            console.log("=== AI Recommendation Request ===");
            const { preferences, workers } = req.body;
            if (!preferences || typeof preferences !== "object") {
                console.error("Invalid preferences:", preferences);
                return res.status(400).json({ error: "Preferences are required" });
            }
            if (!workers || !Array.isArray(workers) || workers.length === 0) {
                console.error("Invalid workers list:", workers);
                return res.status(400).json({ error: "Workers list is required" });
            }
            // Check if API key is configured
            const apiKey = process.env.BLACKBOX_API_KEY;
            if (!apiKey) {
                console.error("BLACKBOX_API_KEY (Gemini API Key) is not configured");
                return res.status(500).json({ error: "AI service is not configured" });
            }
            console.log("API Key found, length:", apiKey.length);
            // Prepare worker data summary for AI
            const workersSummary = workers.map((worker) => ({
                id: worker._id,
                name: worker.username,
                role: worker.role,
                hourlyRate: worker.hourlyRate,
                dailyRate: worker.dailyRate,
                weeklyRate: worker.weeklyRate,
                isAvailable: worker.isAvailable !== false,
                address: worker.address,
                averageRating: worker.averageRating || 0,
                reviewCount: worker.reviewCount || 0,
            }));
            // Build prompt for AI
            const preferencesText = `
Care Type: ${preferences.careType || "Not specified"}
Patient Type: ${preferences.patientType || "Not specified"}
Duration: ${preferences.duration || "Not specified"}
Budget: ${preferences.budget || "Not specified"}
Special Requirements: ${((_a = preferences.specialRequirements) === null || _a === void 0 ? void 0 : _a.join(", ")) || "None"}
    `.trim();
            const workersText = workersSummary
                .map((w) => `ID: ${w.id}, Name: ${w.name}, Role: ${w.role}, Rates: ₹${w.hourlyRate || 0}/hr, ₹${w.dailyRate || 0}/day, ₹${w.weeklyRate || 0}/week, Rating: ${w.averageRating}/5 (${w.reviewCount} reviews), Available: ${w.isAvailable}`)
                .join("\n");
            const prompt = `You are an intelligent healthcare worker recommendation system for Jeevan 108. Based on the patient's preferences, recommend the most suitable healthcare workers from the available list.

PATIENT PREFERENCES:
${preferencesText}

AVAILABLE WORKERS:
${workersText}

MATCHING GUIDELINES:
1. CARE TYPE to ROLE:
   - "nurse" → Recommend only Nurse workers
   - "caretaker" → Recommend only Caretaker workers
   - "compounder" → Recommend only Compounder workers
   - "any" → Recommend best match across all roles

2. PATIENT TYPE MATCHING:
   - "elderly" → Prioritize experienced workers with good ratings
   - "post-surgery" → Prioritize Nurse workers (they handle medical care)
   - "chronic" → Prioritize Nurse or Compounder workers
   - "child" → Prioritize experienced, verified workers
   - "disability" → Prioritize Caretaker or Nurse workers

3. DURATION to SERVICE TYPE:
   - "hourly" → Workers suitable for short-term care (2-8 hours)
   - "daily" → Workers suitable for full-day service (8-12 hours)
   - "weekly" → Workers available for multiple days
   - "long-term" → Workers with good ratings and availability

4. BUDGET MATCHING:
   - "budget" → ₹400-₹450/hr (Caretaker: ₹400/hr, Compounder: ₹450/hr)
   - "moderate" → ₹450-₹500/hr (mix of Compounder and Nurse)
   - "premium" → ₹500+/hr (Nurse: ₹500/hr)
   - "any" → Consider all price ranges, prioritize quality

5. SPECIAL REQUIREMENTS:
   - "experienced" → Workers with averageRating >= 4.0 and reviewCount >= 5
   - "verified" → All workers are government verified (ignore if not searchable)
   - "english-speaking" → Assume all workers can communicate
   - "male" or "female" → Cannot filter (data not available)

RANKING PRIORITY:
1. Role match (MOST IMPORTANT)
2. Patient type suitability
3. Budget alignment
4. Experience (higher ratings and reviews first)
5. Availability status

RULES:
- Only recommend available workers (isAvailable: true)
- Recommend 5-10 workers maximum
- If not enough workers match exactly, relax budget constraints
- Always prioritize role match over other factors

RESPONSE FORMAT (JSON only, no other text):
{
  "recommendedIds": ["worker_id_1", "worker_id_2", "worker_id_3", ...],
  "reasoning": "Brief explanation of why these workers were recommended"
}

Return ONLY the JSON object, nothing else.`;
            console.log("Calling AI for worker recommendations...");
            console.log("Preferences:", preferencesText);
            console.log("Workers summary:", workersSummary.length, "workers");
            console.log("First 3 workers:", workersSummary.slice(0, 3));
            const requestBody = {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.3, // Lower temperature for more consistent recommendations
                    maxOutputTokens: 2048,
                    topP: 0.95,
                    topK: 40,
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE",
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE",
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE",
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE",
                    },
                ],
            };
            // Try different API versions and models
            const apiVersions = ["v1beta", "v1"];
            const defaultModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
            let data = null;
            let lastError = null;
            for (const version of apiVersions) {
                for (const model of defaultModels) {
                    try {
                        const geminiUrl = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
                        console.log(`Trying ${version} with model: ${model}`);
                        const response = yield fetch(geminiUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(requestBody),
                        });
                        data = yield response.json();
                        if (!response.ok) {
                            console.error(`Gemini API Error for ${version}/${model}:`, JSON.stringify(data, null, 2));
                            lastError = data;
                            continue;
                        }
                        if (data && data.candidates) {
                            console.log(`Successfully used ${version} with model: ${model}`);
                            break;
                        }
                    }
                    catch (fetchError) {
                        console.error(`Fetch error for ${version}/${model}:`, fetchError.message);
                        lastError = fetchError;
                        continue;
                    }
                }
                if (data && data.candidates) {
                    break;
                }
            }
            if (!data || !data.candidates) {
                console.error("All Gemini models failed. Last error:", lastError);
                console.error("Last error details:", JSON.stringify(lastError, null, 2));
                console.log("Falling back to server-side recommendation logic...");
                // Fallback: Use server-side filtering logic instead of AI
                return getFallbackRecommendations(preferences, workers, res);
            }
            const candidate = (_b = data.candidates) === null || _b === void 0 ? void 0 : _b[0];
            if (!candidate) {
                console.log("No candidate in AI response, using fallback...");
                return getFallbackRecommendations(preferences, workers, res);
            }
            const aiResponse = (_e = (_d = (_c = candidate.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text;
            if (!aiResponse) {
                console.log("No AI response text, using fallback...");
                return getFallbackRecommendations(preferences, workers, res);
            }
            // Parse JSON response from AI
            let recommendationData;
            try {
                // Extract JSON from response (handle markdown code blocks if present)
                let jsonText = aiResponse.trim();
                const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
                if (jsonMatch) {
                    jsonText = jsonMatch[1];
                }
                recommendationData = JSON.parse(jsonText);
            }
            catch (parseError) {
                console.error("Failed to parse AI response as JSON:", aiResponse);
                // Fallback: try to extract IDs from text
                const idMatches = aiResponse.match(/"([a-f0-9]{24})"/g);
                if (idMatches && idMatches.length > 0) {
                    recommendationData = {
                        recommendedIds: idMatches.map((m) => m.replace(/"/g, "")),
                        reasoning: "AI recommendation based on your preferences",
                    };
                }
                else {
                    console.log("Failed to extract worker IDs from AI response, using fallback...");
                    return getFallbackRecommendations(preferences, workers, res);
                }
            }
            // Validate and filter recommended IDs
            const recommendedIds = recommendationData.recommendedIds || [];
            const validIds = recommendedIds.filter((id) => workers.some((w) => w._id.toString() === id.toString()));
            // Get full worker objects in the recommended order
            const recommendedWorkers = validIds
                .map((id) => workers.find((w) => w._id.toString() === id.toString()))
                .filter((w) => w !== undefined);
            // If AI didn't recommend enough, add remaining available workers
            if (recommendedWorkers.length < 3 && workers.length > recommendedWorkers.length) {
                const remainingWorkers = workers
                    .filter((w) => !recommendedWorkers.some((rw) => rw._id.toString() === w._id.toString()))
                    .filter((w) => w.isAvailable !== false)
                    .slice(0, 5);
                recommendedWorkers.push(...remainingWorkers);
            }
            return res.json({
                workers: recommendedWorkers,
                reasoning: recommendationData.reasoning || "Recommended based on your preferences",
                count: recommendedWorkers.length,
            });
        }
        catch (error) {
            console.error("AI recommendation error:", error);
            console.error("Error stack:", error.stack);
            console.log("Using fallback recommendation due to error...");
            // Try to use fallback with preferences and workers from request
            try {
                const { preferences, workers } = req.body;
                if (preferences && workers && Array.isArray(workers) && workers.length > 0) {
                    return getFallbackRecommendations(preferences, workers, res);
                }
            }
            catch (fallbackError) {
                console.error("Fallback also failed:", fallbackError);
            }
            // If everything fails, return error
            return res.status(500).json({
                error: "Failed to generate recommendations. Please try again later.",
                details: process.env.NODE_ENV === "development" ? error.message : undefined,
            });
        }
    });
}
