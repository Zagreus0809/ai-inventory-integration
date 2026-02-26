const express = require('express');
const router = express.Router();
const erpnext = require('../services/erpnext');

// Helper: Fetch all materials with stock from ERPNext
async function getAllMaterialsWithStock() {
  const result = await erpnext.getItems({});
  const items = result.data || [];
  
  const materialsWithStock = await Promise.all(items.map(async (item) => {
    try {
      const bins = await erpnext.getBins({ item_code: item.name });
      const totalStock = bins.data?.reduce((sum, bin) => sum + (bin.actual_qty || 0), 0) || 0;
      
      return {
        id: item.name,
        partNumber: item.item_code || item.name,
        description: item.item_name || item.description || '',
        project: item.project || 'Common',
        grouping: item.item_group || 'General',
        storageLocation: item.default_warehouse || 'General Storage',
        stock: totalStock,
        reorderPoint: item.min_order_qty || 10,
        safetyStock: item.safety_stock || (item.min_order_qty || 10) * 2,
        unit: item.stock_uom || 'Nos',
        price: item.standard_rate || 0,
        lastUpdated: item.modified || new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching stock for ${item.name}:`, error);
      return null;
    }
  }));
  
  return materialsWithStock.filter(m => m !== null);
}

// Stock classification with safety stock ranges
// - Safety Stock: Between safetyStockMin (80% of safety stock) and safetyStockMax (safety stock value)
// - Low Stock: Below safetyStockMin but above reorder point
// - Critical Stock: At or below reorder point
// - Over Stock: Above safety stock
function classifyStock(m) {
  const safetyStock = m.safetyStock || m.reorderPoint * 2; // Default safety stock is 2x reorder point
  const safetyStockMin = safetyStock * 0.625; // 50% of safety stock (lower bound)
  const safetyStockMax = safetyStock; // 80% equivalent (upper bound)
  
  if (m.stock <= m.reorderPoint) return 'critical';
  if (m.stock > m.reorderPoint && m.stock < safetyStockMin) return 'low';
  if (m.stock >= safetyStockMin && m.stock <= safetyStockMax) return 'safety';
  if (m.stock > safetyStockMax) return 'over';
  return 'safety';
}

// Dashboard statistics - Real-time from ERPNext
router.get('/dashboard', async (req, res) => {
  try {
    const materials = await getAllMaterialsWithStock();
    
    const totalMaterials = materials.length;
    const totalValue = materials.reduce((sum, m) => sum + (m.stock * m.price), 0);
    
    // Classify each material
    const classified = materials.map(m => ({
      ...m,
      classification: classifyStock(m)
    }));
    
    const criticalStock = classified.filter(m => m.classification === 'critical');
    const lowStock = classified.filter(m => m.classification === 'low');
    const safetyStock = classified.filter(m => m.classification === 'safety');
    const overStock = classified.filter(m => m.classification === 'over');
    
    const lowStockItems = criticalStock.length + lowStock.length;
    const groupings = [...new Set(materials.map(m => m.grouping))];

    const groupingBreakdown = groupings.map(grp => {
      const groupMaterials = materials.filter(m => m.grouping === grp);
      return {
        grouping: grp,
        count: groupMaterials.length,
        totalStock: groupMaterials.reduce((sum, m) => sum + m.stock, 0),
        lowStock: groupMaterials.filter(m => m.stock <= m.reorderPoint).length,
        value: groupMaterials.reduce((sum, m) => sum + (m.stock * m.price), 0)
      };
    });

    // ABC Analysis
    const materialsWithValue = materials.map(m => ({
      ...m,
      totalValue: m.stock * m.price,
      stockClass: classifyStock(m)
    })).sort((a, b) => b.totalValue - a.totalValue);
    
    const totalVal = materialsWithValue.reduce((sum, m) => sum + m.totalValue, 0);
    let cumulative = 0;
    const abcMap = {};
    materialsWithValue.forEach(m => {
      cumulative += m.totalValue;
      const pct = (cumulative / totalVal) * 100;
      if (pct <= 80) abcMap[m.id] = 'A';
      else if (pct <= 95) abcMap[m.id] = 'B';
      else abcMap[m.id] = 'C';
    });
    
    // XYZ Analysis
    const turnoverData = materials.map(m => {
      const ratio = m.reorderPoint > 0 ? m.stock / m.reorderPoint : 0;
      let xyz = 'Z';
      if (ratio >= 2 && ratio <= 4) xyz = 'X';
      else if (ratio > 1 && ratio < 2) xyz = 'Y';
      return { ...m, abc: abcMap[m.id] || 'C', xyz, turnover: ratio };
    });
    
    const fastMoving = turnoverData.filter(m => m.turnover >= 2 && m.turnover <= 4).length;
    const slowMoving = turnoverData.filter(m => m.turnover > 1 && m.turnover < 2).length;
    const nonMoving = turnoverData.filter(m => m.turnover <= 1 || m.turnover > 4).length;
    
    const turnoverByClass = { A: { fast: 0, slow: 0, non: 0 }, B: { fast: 0, slow: 0, non: 0 }, C: { fast: 0, slow: 0, non: 0 } };
    turnoverData.forEach(m => {
      const key = m.turnover >= 2 && m.turnover <= 4 ? 'fast' : m.turnover > 1 && m.turnover < 2 ? 'slow' : 'non';
      turnoverByClass[m.abc][key]++;
    });

    res.json({
      totalMaterials,
      totalValue: totalValue.toFixed(2),
      lowStockItems,
      stockMetrics: {
        criticalStock: { count: criticalStock.length, pct: totalMaterials ? ((criticalStock.length / totalMaterials) * 100).toFixed(1) : 0 },
        lowStock: { count: lowStock.length, pct: totalMaterials ? ((lowStock.length / totalMaterials) * 100).toFixed(1) : 0 },
        overStock: { count: overStock.length, pct: totalMaterials ? ((overStock.length / totalMaterials) * 100).toFixed(1) : 0 },
        safetyStock: { count: safetyStock.length, pct: totalMaterials ? ((safetyStock.length / totalMaterials) * 100).toFixed(1) : 0 }
      },
      abcXyz: {
        A: materialsWithValue.filter(m => abcMap[m.id] === 'A').length,
        B: materialsWithValue.filter(m => abcMap[m.id] === 'B').length,
        C: materialsWithValue.filter(m => abcMap[m.id] === 'C').length,
        X: turnoverData.filter(m => m.xyz === 'X').length,
        Y: turnoverData.filter(m => m.xyz === 'Y').length,
        Z: turnoverData.filter(m => m.xyz === 'Z').length
      },
      turnoverClassification: { fastMoving, slowMoving, nonMoving, byClass: turnoverByClass },
      groupings: groupingBreakdown,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics from ERPNext:', error);
    res.status(500).json({ error: 'Failed to fetch analytics from ERPNext', details: error.message });
  }
});

// Inventory turnover analysis - Real-time from ERPNext
router.get('/turnover', async (req, res) => {
  try {
    const materials = await getAllMaterialsWithStock();
    
    const analysis = materials.map(m => ({
      id: m.id,
      partNumber: m.partNumber,
      description: m.description,
      stock: m.stock,
      reorderPoint: m.reorderPoint,
      daysOfStock: Math.floor((m.stock / m.reorderPoint) * 30),
      status: m.stock <= m.reorderPoint ? 'CRITICAL' : m.stock <= m.reorderPoint * 1.5 ? 'LOW' : 'NORMAL'
    }));
    
    res.json(analysis);
  } catch (error) {
    console.error('Error fetching turnover analysis from ERPNext:', error);
    res.status(500).json({ error: 'Failed to fetch turnover analysis from ERPNext', details: error.message });
  }
});

// ABC Analysis - Real-time from ERPNext
router.get('/abc-analysis', async (req, res) => {
  try {
    const materials = await getAllMaterialsWithStock();
    
    const materialsWithValue = materials.map(m => ({
      ...m,
      totalValue: m.stock * m.price
    })).sort((a, b) => b.totalValue - a.totalValue);
    
    const totalValue = materialsWithValue.reduce((sum, m) => sum + m.totalValue, 0);
    let cumulativeValue = 0;
    
    const classified = materialsWithValue.map(m => {
      cumulativeValue += m.totalValue;
      const percentage = (cumulativeValue / totalValue) * 100;
      
      let classification;
      if (percentage <= 80) classification = 'A';
      else if (percentage <= 95) classification = 'B';
      else classification = 'C';
      
      return {
        ...m,
        classification,
        valuePercentage: ((m.totalValue / totalValue) * 100).toFixed(2)
      };
    });
    
    res.json(classified);
  } catch (error) {
    console.error('Error fetching ABC analysis from ERPNext:', error);
    res.status(500).json({ error: 'Failed to fetch ABC analysis from ERPNext', details: error.message });
  }
});

module.exports = router;
