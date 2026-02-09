// Direct Gemini API test
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  console.log('🤖 Testing Gemini AI directly...\n');
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    console.log('Sending simple prompt...');
    const result = await model.generateContent('Say "Hello, SAP Inventory System is working!"');
    const response = result.response;
    const text = response.text();
    
    console.log(`✅ SUCCESS!\n`);
    console.log(`Response: ${text}\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testGemini();
