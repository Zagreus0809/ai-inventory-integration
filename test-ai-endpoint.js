require('dotenv').config();
const fetch = require('node-fetch');

async function testAIEndpoint() {
  try {
    console.log('Testing AI dashboard-analysis endpoint...\n');
    console.log('URL: http://localhost:3000/api/ai/dashboard-analysis');
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'NOT SET');
    console.log('\nFetching...\n');
    
    const response = await fetch('http://localhost:3000/api/ai/dashboard-analysis');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.error('\n❌ ERROR:', data.error);
      console.error('Details:', data.details);
    } else if (data.success) {
      console.log('\n✅ SUCCESS');
      console.log('Analysis length:', data.analysis?.length || 0, 'characters');
      console.log('Is Mock:', data.isMock);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAIEndpoint();
