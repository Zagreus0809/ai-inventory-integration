// Quick test script to verify API functionality
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing SAP AI Inventory System API...\n');
  
  // Test 1: Get all materials
  console.log('1️⃣ Testing GET /api/materials...');
  try {
    const response = await fetch(`${API_URL}/api/materials`);
    const materials = await response.json();
    console.log(`✅ Success! Found ${materials.length} materials`);
    console.log(`   First material: ${materials[0].partNumber} - ${materials[0].description}`);
    console.log(`   Price: ₱${materials[0].price}, Stock: ${materials[0].stock}\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // Test 2: Get dashboard analytics
  console.log('2️⃣ Testing GET /api/analytics/dashboard...');
  try {
    const response = await fetch(`${API_URL}/api/analytics/dashboard`);
    const dashboard = await response.json();
    console.log(`✅ Success!`);
    console.log(`   Total Materials: ${dashboard.totalMaterials}`);
    console.log(`   Total Value: ₱${parseFloat(dashboard.totalValue).toLocaleString()}`);
    console.log(`   Low Stock Items: ${dashboard.lowStockItems}`);
    console.log(`   Groupings: ${dashboard.groupings.length}\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // Test 3: Add a new material
  console.log('3️⃣ Testing POST /api/materials (Add Material)...');
  try {
    const newMaterial = {
      partNumber: 'TEST-001',
      description: 'Test Material for API Verification',
      project: 'Common',
      grouping: 'Supplies',
      storageLocation: 'Test Storage',
      stock: 100,
      reorderPoint: 20,
      unit: 'PC',
      price: 5.50
    };
    
    const response = await fetch(`${API_URL}/api/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMaterial)
    });
    
    const added = await response.json();
    console.log(`✅ Success! Material added with ID: ${added.id}`);
    console.log(`   Part Number: ${added.partNumber}`);
    console.log(`   Total Value: ₱${(added.stock * added.price).toFixed(2)}\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // Test 4: Test Gemini AI (Safety Stock Analysis)
  console.log('4️⃣ Testing POST /api/ai/safety-stock (Gemini AI)...');
  try {
    const materialsResponse = await fetch(`${API_URL}/api/materials`);
    const materials = await materialsResponse.json();
    
    const response = await fetch(`${API_URL}/api/ai/safety-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materials: materials.slice(0, 10) }) // Test with 10 materials
    });
    
    const result = await response.json();
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      if (result.details) console.log(`   Details: ${result.details}`);
    } else {
      console.log(`✅ Success! Gemini AI analyzed ${result.materialsAnalyzed} materials`);
      console.log(`   Analysis preview: ${result.analysis.substring(0, 150)}...\n`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  console.log('✨ API Testing Complete!\n');
}

testAPI();
