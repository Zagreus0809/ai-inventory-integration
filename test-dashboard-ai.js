require('dotenv').config();
const fetch = require('node-fetch');

async function testDashboardAI() {
  console.log('🧪 Testing Dashboard AI Endpoint...\n');
  
  const API_URL = 'http://localhost:3000';
  
  try {
    console.log('📡 Sending request to:', `${API_URL}/api/ai/dashboard-analysis`);
    console.log('⏱️  This will take 10-30 seconds...\n');
    
    const startTime = Date.now();
    const response = await fetch(`${API_URL}/api/ai/dashboard-analysis`);
    const endTime = Date.now();
    
    console.log('✅ Response received in', ((endTime - startTime) / 1000).toFixed(1), 'seconds');
    console.log('📊 Status:', response.status, response.statusText);
    
    const data = await response.json();
    
    console.log('\n📋 Response Data:');
    console.log('  - Success:', data.success);
    console.log('  - Is Mock:', data.isMock);
    console.log('  - Timestamp:', data.timestamp);
    console.log('  - Summary:', data.summary ? 'Present' : 'Missing');
    console.log('  - Analysis Length:', data.analysis ? data.analysis.length : 0, 'characters');
    
    if (data.analysis) {
      console.log('\n📝 Analysis Preview (first 500 chars):');
      console.log(data.analysis.substring(0, 500) + '...\n');
    }
    
    if (data.error) {
      console.log('\n❌ Error:', data.error);
    }
    
    if (data.isMock) {
      console.log('\n⚠️  Running in DEMO MODE');
      console.log('   Reason:', data.reason);
    } else {
      console.log('\n🎉 REAL AI IS WORKING!');
    }
    
    console.log('\n✅ Dashboard AI Test Complete!');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('\n💡 Make sure server is running:');
    console.error('   node server.js');
  }
}

testDashboardAI();
