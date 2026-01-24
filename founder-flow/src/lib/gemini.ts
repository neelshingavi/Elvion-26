import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MODELS = [
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash",
    "gemini-flash-latest"
];

export const callGemini = async (prompt: string, isJson: boolean = true, retries = 2) => {
    let lastError: any;

    for (const modelName of MODELS) {
        console.log(`Trying model: ${modelName}`);
        const currentModel = genAI.getGenerativeModel({ model: modelName });

        for (let i = 0; i < retries; i++) {
            try {
                const result = await currentModel.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                if (isJson) {
                    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
                }

                return text;
            } catch (error: any) {
                console.error(`Error with ${modelName} (attempt ${i + 1}):`, error.message);
                lastError = error;

                // If it's a quota error (429) or not found (404), try next model immediately if retries exhausted for this model
                const isQuotaOrNotFound = error.response?.status === 429 || error.status === 429 || error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("404") || error.message?.includes("not found");

                if (isQuotaOrNotFound) {
                    // Break inner retry loop to try next model
                    break;
                }

                // For other errors, wait and retry same model
                if (i < retries - 1) {
                    const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                    await sleep(delay);
                }
            }
        }
    }

    throw lastError || new Error("All models failed");
};
