require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    return;
  }

  console.log('🔍 Listing available Gemini models...\n');
  console.log('API Key:', apiKey.substring(0, 10) + '...\n');

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try to list models using the API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
    const data = await response.json();
    
    if (data.models) {
      console.log('✅ Available models:\n');
      data.models.forEach(model => {
        console.log(`  - ${model.name}`);
        console.log(`    Display Name: ${model.displayName}`);
        console.log(`    Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
        console.log('');
      });
    } else {
      console.log('❌ No models found or error:', data);
    }
  } catch (error) {
    console.error('❌ Error listing models:', error.message);
  }
}

listModels();
