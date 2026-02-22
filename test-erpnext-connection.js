require('dotenv').config();
const erpnext = require('./services/erpnext');

async function testConnection() {
  console.log('Testing ERPNext Connection...');
  console.log('URL:', process.env.ERPNEXT_URL);
  console.log('API Key configured:', !!process.env.ERPNEXT_API_KEY && process.env.ERPNEXT_API_KEY !== 'your_api_key_here');
  console.log('');

  try {
    // Test connection
    console.log('1. Testing authentication...');
    const authTest = await erpnext.testConnection();
    console.log('   Result:', authTest);
    console.log('');

    if (!authTest.success) {
      console.log('❌ Connection failed. Please check your credentials.');
      return;
    }

    // Get warehouses
    console.log('2. Fetching warehouses...');
    const warehouses = await erpnext.getWarehouses();
    console.log(`   Found ${warehouses.data?.length || 0} warehouses`);
    if (warehouses.data?.length > 0) {
      console.log('   Sample:', warehouses.data.slice(0, 3).map(w => w.name));
    }
    console.log('');

    // Get items
    console.log('3. Fetching items...');
    const items = await erpnext.getItems();
    console.log(`   Found ${items.data?.length || 0} items`);
    if (items.data?.length > 0) {
      console.log('   Sample:', items.data.slice(0, 3).map(i => `${i.item_code} - ${i.item_name}`));
    }
    console.log('');

    // Get stock entries
    console.log('4. Fetching recent stock entries...');
    const stockEntries = await erpnext.getStockEntries();
    console.log(`   Found ${stockEntries.data?.length || 0} stock entries`);
    console.log('');

    console.log('✅ All tests passed! ERPNext connection is working.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure your ERPNext instance is accessible');
    console.error('2. Verify your API Key and Secret are correct');
    console.error('3. Check that the API Key has proper permissions');
    console.error('4. Ensure your ERPNext instance allows API access');
  }
}

testConnection();
