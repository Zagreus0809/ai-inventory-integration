require('dotenv').config();
const erpnext = require('./services/erpnext');

async function testABCClassification() {
  try {
    console.log('Testing ABC Classification...\n');
    
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
    
    // Calculate inventory value for each item
    const materialsWithValue = items.map(item => ({
      partNumber: item.item_code,
      description: item.item_name,
      stock: stockMap[item.name] || 0,
      price: item.standard_rate || 0,
      inventoryValue: (stockMap[item.name] || 0) * (item.standard_rate || 0)
    })).sort((a, b) => b.inventoryValue - a.inventoryValue);
    
    const totalValue = materialsWithValue.reduce((sum, m) => sum + m.inventoryValue, 0);
    
    console.log('ABC Classification Analysis:');
    console.log('='.repeat(120));
    console.log('Part Number'.padEnd(25) + 'Stock'.padEnd(10) + 'Price'.padEnd(15) + 'Inv Value'.padEnd(15) + '% of Total'.padEnd(12) + 'Cumulative %'.padEnd(15) + 'Class');
    console.log('='.repeat(120));
    
    let cumulative = 0;
    materialsWithValue.forEach(m => {
      const prevCumulative = cumulative; // Before adding this item
      cumulative += m.inventoryValue;
      const pct = totalValue > 0 ? (m.inventoryValue / totalValue) * 100 : 0;
      const cumulativePct = totalValue > 0 ? (cumulative / totalValue) * 100 : 0;
      
      // Classify based on cumulative BEFORE adding this item
      let abcClass = 'C';
      if (prevCumulative < 80) abcClass = 'A';
      else if (prevCumulative < 95) abcClass = 'B';
      
      console.log(
        m.partNumber.padEnd(25) +
        m.stock.toString().padEnd(10) +
        ('₱' + m.price.toFixed(2)).padEnd(15) +
        ('₱' + m.inventoryValue.toFixed(2)).padEnd(15) +
        (pct.toFixed(1) + '%').padEnd(12) +
        (cumulativePct.toFixed(1) + '%').padEnd(15) +
        abcClass + (abcClass === 'A' ? ' (High)' : abcClass === 'B' ? ' (Medium)' : ' (Low)')
      );
    });
    
    console.log('='.repeat(120));
    console.log(`\nTotal Inventory Value: ₱${totalValue.toFixed(2)}`);
    
    const aCount = materialsWithValue.filter((m, i) => {
      let cum = 0;
      for (let j = 0; j < i; j++) cum += materialsWithValue[j].inventoryValue; // Before this item
      const prevPct = (cum / totalValue) * 100;
      return prevPct < 80;
    }).length;
    
    const bCount = materialsWithValue.filter((m, i) => {
      let cum = 0;
      for (let j = 0; j < i; j++) cum += materialsWithValue[j].inventoryValue; // Before this item
      const prevPct = (cum / totalValue) * 100;
      return prevPct >= 80 && prevPct < 95;
    }).length;
    
    const cCount = items.length - aCount - bCount;
    
    console.log(`\nA (High Value): ${aCount} items`);
    console.log(`B (Medium Value): ${bCount} items`);
    console.log(`C (Low Value): ${cCount} items`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testABCClassification();
