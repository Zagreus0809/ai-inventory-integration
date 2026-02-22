require('dotenv').config();
const erpnext = require('./services/erpnext');

async function testMaterialsRoute() {
  try {
    console.log('Testing materials route logic...\n');
    
    // Get items
    console.log('1. Fetching items from ERPNext...');
    const result = await erpnext.getItems({});
    const items = result.data || [];
    console.log(`   Found ${items.length} items`);
    
    if (items.length === 0) {
      console.log('   ⚠️  No items found in ERPNext');
      return;
    }
    
    // Get stock for first item
    console.log('\n2. Fetching stock for items...');
    const firstItem = items[0];
    console.log(`   Testing with item: ${firstItem.name}`);
    
    const bins = await erpnext.getBins({ item_code: firstItem.name });
    const totalStock = bins.data?.reduce((sum, bin) => sum + (bin.actual_qty || 0), 0) || 0;
    console.log(`   Stock: ${totalStock}`);
    
    // Map to material format
    console.log('\n3. Mapping to material format...');
    const material = {
      id: firstItem.name,
      partNumber: firstItem.item_code || firstItem.name,
      description: firstItem.item_name || firstItem.description || '',
      project: firstItem.project || 'Common',
      grouping: firstItem.item_group || 'General',
      storageLocation: firstItem.default_warehouse || 'General Storage',
      stock: totalStock,
      reorderPoint: firstItem.min_order_qty || 10,
      unit: firstItem.stock_uom || 'Nos',
      price: firstItem.standard_rate || 0,
      lastUpdated: firstItem.modified || new Date().toISOString()
    };
    
    console.log('   Mapped material:', JSON.stringify(material, null, 2));
    
    console.log('\n✅ Materials route logic works correctly');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMaterialsRoute();
