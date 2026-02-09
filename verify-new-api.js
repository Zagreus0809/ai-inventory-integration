// Verify new Gemini API Key
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function verifyNewAPIKey() {
  console.log('🔑 Verifying New Gemini API Key...\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`);
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    console.log('📡 Testing API with simple prompt...\n');
    
    const result = await model.generateContent('Say "Hello! The new API key is working perfectly!"');
    const response = result.response;
    const text = response.text();
    
    console.log('✅ SUCCESS! API Key is VALID and WORKING!\n');
    console.log(`Response: ${text}\n`);
    console.log('🎉 Your Gemini AI is now fully operational!\n');
    console.log('The system will now use REAL AI instead of demo mode.\n');
    
    return true;
  } catch (error) {
    console.error('❌ ERROR: API Key verification failed\n');
    console.error(`Error: ${error.message}\n`);
    
    if (error.message.includes('403')) {
      console.log('⚠️  This API key may be invalid or restricted.\n');
      console.log('Please generate a new key at: https://aistudio.google.com/app/apikey\n');
    } else if (error.message.includes('404')) {
      console.log('⚠️  Model not found. Trying alternative model...\n');
      
      try {
        const model2 = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result2 = await model2.generateContent('Test');
        console.log('✅ Alternative model works! Update code to use "gemini-pro"\n');
      } catch (e) {
        console.log('❌ Alternative model also failed\n');
      }
    }
    
    return false;
  }
}

verifyNewAPIKey();
