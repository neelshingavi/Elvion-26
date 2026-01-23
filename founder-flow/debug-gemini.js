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

async function test() {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = "gemini-1.0-pro";

    try {
        console.log(`Testing ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log(`SUCCESS: ${modelName}`);
        console.log(result.response.text());
    } catch (e) {
        console.log(`FAILED: ${modelName}`);
        console.log(e.message);
    }
}
test();
