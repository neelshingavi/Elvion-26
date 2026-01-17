import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const callGemini = async (prompt: string, isJson: boolean = true) => {
    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (isJson) {
            // Basic JSON extraction in case Gemini wraps it in markdown blocks
            const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            return JSON.parse(jsonMatch ? jsonMatch[0] : text);
        }

        return text;
    } catch (error) {
        console.error("Gemini API error:", error);
        throw error;
    }
};
