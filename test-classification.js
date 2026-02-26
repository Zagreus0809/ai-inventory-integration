require('dotenv').config();
const erpnext = require('./services/erpnext');

async function testClassification() {
  try {
    console.log('Fetching items from ERPNext...\n');
    
    const result = await erpnext.getItems({});
    const items = result.data || [];
    
    const binsResult = await erpnext.getBins({});
    const allBins = binsResult.data || [];
    
    const stockMap = {};
    allBins.forEach(bin => {
      if (!stockMap[bin.item_code]) {
        stockMap[bin.item_code] = 0;
      }
      stockMap[bin.item_code] += (bin.actual_qty || 0);
    });
    
    console.log('Item Classification Analysis:\n');
    console.log('=' .repeat(120));
    console.log('Part Number'.padEnd(20) + 'Stock'.padEnd(10) + 'Reorder'.padEnd(10) + 'Safety'.padEnd(10) + 'Min(50%)'.padEnd(10) + 'Max(100%)'.padEnd(12) + 'Classification');
    console.log('=' .repeat(120));
    
    items.forEach(item => {
      const stock = stockMap[item.name] || 0;
      const reorderPoint = item.min_order_qty || 10;
      const safetyStock = item.safety_stock || reorderPoint * 2;
      const safetyMin = safetyStock * 0.625; // 50% of safety stock
      const safetyMax = safetyStock; // 100% of safety stock
      
      let classification = '';
      if (stock <= reorderPoint) classification = 'CRITICAL';
      else if (stock > reorderPoint && stock < safetyMin) classification = 'LOW';
      else if (stock >= safetyMin && stock <= safetyMax) classification = 'SAFETY';
      else if (stock > safetyMax) classification = 'OVER';
      
      console.log(
        item.item_code.padEnd(20) +
        stock.toString().padEnd(10) +
        reorderPoint.toString().padEnd(10) +
        safetyStock.toString().padEnd(10) +
        safetyMin.toFixed(1).padEnd(10) +
        safetyMax.toString().padEnd(12) +
        classification
      );
    });
    
    console.log('=' .repeat(120));
    
    // Count by classification
    const counts = { CRITICAL: 0, LOW: 0, SAFETY: 0, OVER: 0 };
    items.forEach(item => {
      const stock = stockMap[item.name] || 0;
      const reorderPoint = item.min_order_qty || 10;
      const safetyStock = item.safety_stock || reorderPoint * 2;
      const safetyMin = safetyStock * 0.625;
      const safetyMax = safetyStock;
      
      if (stock <= reorderPoint) counts.CRITICAL++;
      else if (stock > reorderPoint && stock < safetyMin) counts.LOW++;
      else if (stock >= safetyMin && stock <= safetyMax) counts.SAFETY++;
      else if (stock > safetyMax) counts.OVER++;
    });
    
    console.log('\nSummary:');
    console.log(`Critical: ${counts.CRITICAL} items (${((counts.CRITICAL/items.length)*100).toFixed(1)}%)`);
    console.log(`Low: ${counts.LOW} items (${((counts.LOW/items.length)*100).toFixed(1)}%)`);
    console.log(`Safety: ${counts.SAFETY} items (${((counts.SAFETY/items.length)*100).toFixed(1)}%)`);
    console.log(`Over: ${counts.OVER} items (${((counts.OVER/items.length)*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testClassification();
