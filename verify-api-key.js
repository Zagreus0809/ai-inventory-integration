// Verify Gemini API Key
const fetch = require('node-fetch');
require('dotenv').config();

async function verifyAPIKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔑 Verifying Gemini API Key...');
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`);
  
  try {
    // List available models
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log('📡 Fetching available models...\n');
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Key is VALID!\n');
      console.log('Available models:');
      if (data.models) {
        data.models.forEach(model => {
          if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
            console.log(`  ✓ ${model.name.replace('models/', '')} - ${model.displayName}`);
          }
        });
      }
    } else {
      console.log('❌ API Key is INVALID or has issues:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyAPIKey();
