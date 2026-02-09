// Quick Gemini AI test with minimal data
const fetch = require('node-fetch');

async function quickTest() {
  console.log('⚡ Quick Gemini AI Test...\n');
  
  const testMaterials = [
    { id: 'MAT001', partNumber: 'G02277700', description: 'Copper Wire', stock: 2210, reorderPoint: 500, price: 0.15 },
    { id: 'MAT002', partNumber: 'PCB-S18', description: 'PCB Board', stock: 450, reorderPoint: 100, price: 2.50 }
  ];
  
  try {
    console.log('Sending request to Gemini AI...');
    const response = await fetch('http://localhost:3000/api/ai/safety-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materials: testMaterials })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.log(`❌ Error: ${data.error}`);
      if (data.details) console.log(`Details: ${data.details}`);
    } else {
      console.log(`✅ SUCCESS! Gemini AI is working!\n`);
      console.log(`Materials Analyzed: ${data.materialsAnalyzed}`);
      console.log(`Timestamp: ${data.timestamp}`);
      console.log(`\nAnalysis Preview:\n${data.analysis.substring(0, 300)}...\n`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

quickTest();
