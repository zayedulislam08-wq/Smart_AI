import { GoogleGenAI, Chat, GenerateContentResponse, Modality, Type } from "@google/genai";

// ─── API Key Resolution ────────────────────────────────────────────────────────
// Reads from localStorage (managed by ApiKeyContext) with .env fallback.
// Components that have access to useApiKeys hook should call getActiveApiKey()
// and pass the key directly. This function is a fallback for non-React contexts.
const STORAGE_KEY = 'gemini_api_keys_v2';

const getKeyFromStorage = (): string | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const keys = JSON.parse(stored) as Array<{ id: string; key: string; isRateLimited: boolean; rateLimitUntil?: number; usageCount: number }>;
            const now = Date.now();
            const available = keys
                .filter(k => !k.isRateLimited || (k.rateLimitUntil && now > k.rateLimitUntil))
                .sort((a, b) => a.usageCount - b.usageCount);
            return available[0]?.key || null;
        }
    } catch { /* ignore */ }
    return null;
};

export const resolveApiKey = (explicitKey?: string | null): string => {
    const key = explicitKey || getKeyFromStorage() || import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
        throw new Error("No API key found. Please add one in Settings.");
    }
    return key;
};

const getAi = (apiKey?: string | null) => {
    return new GoogleGenAI({ apiKey: resolveApiKey(apiKey) });
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const createChat = (model: string, systemInstruction?: string, apiKey?: string | null): Chat => {
    return getAi(apiKey).chats.create({
        model,
        config: systemInstruction ? { systemInstruction } : undefined
    });
};

// ─── General Content ──────────────────────────────────────────────────────────
export const generateContent = async (model: string, prompt: string, config?: any, apiKey?: string | null): Promise<GenerateContentResponse> => {
    return await getAi(apiKey).models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config,
    });
};

// ─── Media (Image / Audio / PDF) ─────────────────────────────────────────────
export const generateContentWithMedia = async (model: string, prompt: string, fileBase64: string, mimeType: string, apiKey?: string | null): Promise<GenerateContentResponse> => {
    return await getAi(apiKey).models.generateContent({
        model,
        contents: [{ parts: [{ inlineData: { mimeType, data: fileBase64 } }, { text: prompt }] }],
    });
};

// ─── Video Analysis ───────────────────────────────────────────────────────────
export const analyzeVideoFrames = async (prompt: string, frames: { mimeType: string, data: string }[], model?: string, apiKey?: string | null): Promise<string> => {
    const parts: any[] = [{ text: prompt }];
    frames.forEach(frame => parts.push({ inlineData: { mimeType: frame.mimeType, data: frame.data } }));
    const response = await getAi(apiKey).models.generateContent({
        model: model || "gemini-2.5-pro",
        contents: [{ parts }],
    });
    return response.text || "";
};

// ─── Image Editing ────────────────────────────────────────────────────────────
export const editImage = async (prompt: string, imageBase64: string, mimeType: string, model?: string, apiKey?: string | null): Promise<GenerateContentResponse> => {
    return await getAi(apiKey).models.generateContent({
        model: model || 'gemini-2.5-flash-image',
        contents: [{ parts: [{ inlineData: { mimeType, data: imageBase64 } }, { text: prompt }] }],
        config: { responseModalities: [Modality.IMAGE] },
    });
};

// ─── Image Generation ─────────────────────────────────────────────────────────
export const generateImage = async (prompt: string, aspectRatio: string, style?: string, negativePrompt?: string, model?: string, apiKey?: string | null): Promise<string> => {
    let finalPrompt = prompt;
    if (style && style !== 'None') finalPrompt = `${style} style. ${finalPrompt}`;
    if (negativePrompt) finalPrompt += ` --without ${negativePrompt}`;

    const response = await getAi(apiKey).models.generateImages({
        model: model || 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio },
    });
    return response.generatedImages[0].image.imageBytes;
};

// ─── Grounded Search ──────────────────────────────────────────────────────────
export const generateGroundedContent = async (prompt: string, tool: 'googleSearch' | 'googleMaps', location?: { latitude: number, longitude: number }, model?: string, apiKey?: string | null): Promise<GenerateContentResponse> => {
    const config: any = {
        tools: [tool === 'googleMaps' ? { googleMaps: {} } : { googleSearch: {} }],
    };
    if (tool === 'googleMaps' && location) {
        config.toolConfig = { retrievalConfig: { latLng: location } };
    }
    return await getAi(apiKey).models.generateContent({
        model: model || 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        config,
    });
};

// ─── Text-to-Speech ───────────────────────────────────────────────────────────
export const generateSpeech = async (prompt: string, voiceName: string, secondVoiceName?: string, model?: string, apiKey?: string | null): Promise<string> => {
    const config: any = { responseModalities: [Modality.AUDIO] };
    if (secondVoiceName) {
        config.speechConfig = {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                    { speaker: 'Speaker 1', voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
                    { speaker: 'Speaker 2', voiceConfig: { prebuiltVoiceConfig: { voiceName: secondVoiceName } } },
                ]
            }
        };
    } else {
        config.speechConfig = { voiceConfig: { prebuiltVoiceConfig: { voiceName } } };
    }
    const response = await getAi(apiKey).models.generateContent({
        model: model || "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config,
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
};

// ─── Conversation Script ──────────────────────────────────────────────────────
export const generateConversationScript = async (topic: string, apiKey?: string | null): Promise<string> => {
    const response = await getAi(apiKey).models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: `Write a short, engaging dialogue script (approx 100 words) between two characters discussing: "${topic}". Format:\nSpeaker 1: [Text]\nSpeaker 2: [Text]\nDo not add titles or markdown.` }] }],
    });
    return response.text || '';
};

// ─── Text Suggestions ─────────────────────────────────────────────────────────
export const getTextSuggestions = async (text: string, apiKey?: string | null): Promise<string[]> => {
    const response = await getAi(apiKey).models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: `Analyze: "${text}". Give 3 improved versions on separate lines. No numbering or labels.` }] }],
    });
    return (response.text || '').split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 3);
};

// ─── Live Conversation ────────────────────────────────────────────────────────
export const connectLive = (callbacks: any, systemInstruction: string, voiceName: string = 'Zephyr', model?: string, apiKey?: string | null): Promise<any> => {
    return getAi(apiKey).live.connect({
        model: model || 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
            systemInstruction,
            outputAudioTranscription: {},
            inputAudioTranscription: {},
        },
    });
};

// ─── Audio Transcription ──────────────────────────────────────────────────────
export const transcribeAudio = async (audioBase64: string, mimeType: string, targetLanguage?: string, model?: string, apiKey?: string | null): Promise<string> => {
    const instruction = targetLanguage
        ? `Transcribe this audio and translate to ${targetLanguage}.`
        : "Transcribe the following audio.";
    const response = await getAi(apiKey).models.generateContent({
        model: model || "gemini-2.5-flash",
        contents: [{ parts: [{ inlineData: { data: audioBase64, mimeType } }, { text: instruction }] }],
    });
    return response.text || "";
};

// ─── Summarize Text ───────────────────────────────────────────────────────────
export const summarizeText = async (text: string, apiKey?: string | null): Promise<string> => {
    const response = await getAi(apiKey).models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: `Provide a concise, well-structured summary of:\n\n${text}` }] }],
    });
    return response.text || "";
};

// ─── Complex Task (Thinking) ──────────────────────────────────────────────────
export const solveComplexTask = async (prompt: string, thinkingBudget: number = 1024, model?: string, apiKey?: string | null): Promise<string> => {
    const response = await getAi(apiKey).models.generateContent({
        model: model || "gemini-2.5-pro",
        contents: [{ parts: [{ text: prompt }] }],
        config: { thinkingConfig: { thinkingBudget } }
    });
    return response.text || "";
};

// ─── Workflow Generation ──────────────────────────────────────────────────────
export const generateWorkflow = async (goal: string, model?: string, apiKey?: string | null): Promise<string> => {
    const response = await getAi(apiKey).models.generateContent({
        model: model || "gemini-2.5-pro",
        contents: [{ parts: [{ text: goal }] }],
        config: {
            systemInstruction: "You are a helpful assistant that creates structured, actionable workflows. Generate a step-by-step plan in JSON format.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    steps: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                estimated_time: { type: Type.STRING },
                            },
                            required: ['title', 'description']
                        }
                    }
                },
                required: ['title', 'summary', 'steps']
            }
        },
    });
    return response.text || "";
};

// ─── Document Processing ──────────────────────────────────────────────────────
export const processDocument = async (documentContent: string, userPrompt: string, model?: string, apiKey?: string | null): Promise<string> => {
    const fullPrompt = `DOCUMENT CONTENT:\n\`\`\`\n${documentContent}\n\`\`\`\n\nUSER INSTRUCTIONS:\n\`\`\`\n${userPrompt}\n\`\`\`\n\nReturn the full modified document.`;
    const response = await getAi(apiKey).models.generateContent({
        model: model || "gemini-2.5-pro",
        contents: [{ parts: [{ text: fullPrompt }] }],
        config: {
            systemInstruction: "You are an expert document editor. Apply the instructions and return the full modified document as HTML. No JavaScript, no <script> tags, no inline event handlers.",
        },
    });
    return response.text || "";
};

// ─── Content Conversion ───────────────────────────────────────────────────────
export const convertContent = async (sourceContent: string, targetFormat: 'csv' | 'markdown' | 'plaintext', model?: string, apiKey?: string | null): Promise<string> => {
    const instructions: Record<string, string> = {
        csv: "Convert the HTML to valid CSV. Output only raw CSV data.",
        markdown: "Convert the HTML to well-formatted Markdown. Output only raw Markdown.",
        plaintext: "Convert HTML to readable plain text preserving structure. Output only text.",
    };
    const response = await getAi(apiKey).models.generateContent({
        model: model || "gemini-2.5-flash",
        contents: [{ parts: [{ text: sourceContent }] }],
        config: { systemInstruction: instructions[targetFormat] },
    });
    return (response.text || "").replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim();
};
