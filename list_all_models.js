const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

let apiKey = "";
try {
    const envConfig = fs.readFileSync('.env.local', 'utf8');
    const apiKeyLine = envConfig.split('\n').find(line => line.includes('GEMINI_API_KEY'));
    if (apiKeyLine) apiKey = apiKeyLine.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
} catch (e) {
    console.error("No .env.local");
}

async function list() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log("AVAILABLE_MODELS_START");
            data.models.forEach(m => console.log(m.name));
            console.log("AVAILABLE_MODELS_END");
        } else {
            console.log("NO_MODELS_FOUND", JSON.stringify(data));
        }
    } catch (e) {
        console.log("FETCH_ERROR", e.message);
    }
}
list();
