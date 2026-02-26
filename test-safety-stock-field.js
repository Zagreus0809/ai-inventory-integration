require('dotenv').config();
const erpnext = require('./services/erpnext');

async function testSafetyStockField() {
  try {
    console.log('Checking if ERPNext returns safety_stock field...\n');
    
    const result = await erpnext.getItems({});
    const items = result.data || [];
    
    console.log('Sample item fields:');
    if (items.length > 0) {
      const firstItem = items[0];
      console.log('\nItem:', firstItem.item_code);
      console.log('Fields available:');
      console.log('- min_order_qty:', firstItem.min_order_qty);
      console.log('- safety_stock:', firstItem.safety_stock);
      console.log('- reorder_level:', firstItem.reorder_level);
      console.log('- re_order_level:', firstItem.re_order_level);
      
      console.log('\nAll fields containing "stock" or "order":');
      Object.keys(firstItem).filter(k => 
        k.toLowerCase().includes('stock') || 
        k.toLowerCase().includes('order') ||
        k.toLowerCase().includes('reorder')
      ).forEach(key => {
        console.log(`- ${key}:`, firstItem[key]);
      });
    }
    
    console.log('\n\nAll items with their safety stock values:');
    console.log('='.repeat(80));
    console.log('Item Code'.padEnd(25) + 'min_order_qty'.padEnd(20) + 'safety_stock');
    console.log('='.repeat(80));
    
    items.forEach(item => {
      console.log(
        (item.item_code || '').padEnd(25) +
        (item.min_order_qty || 0).toString().padEnd(20) +
        (item.safety_stock || 'NOT SET')
      );
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSafetyStockField();
