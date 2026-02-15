const express = require('express');
const router = express.Router();
const materials = require('../data/materials');

// Stock classification: critical <= reorder, low = reorder < x <= 1.5*reorder, safety = >= 1.5*reorder, over = > 3*reorder
function classifyStock(m) {
  if (m.stock <= m.reorderPoint) return 'critical';
  if (m.stock <= m.reorderPoint * 1.5) return 'low';
  if (m.stock > m.reorderPoint * 3) return 'over';
  return 'safety';
}

// Dashboard statistics (SAP AI Inventory format: Critical, Low, Over, Safety + AI Insights + ABC/XYZ + Turnover)
router.get('/dashboard', (req, res) => {
  const totalMaterials = materials.length;
  const totalValue = materials.reduce((sum, m) => sum + (m.stock * m.price), 0);
  const criticalStock = materials.filter(m => m.stock <= m.reorderPoint);
  const lowStock = materials.filter(m => m.stock > m.reorderPoint && m.stock <= m.reorderPoint * 1.5);
  const overStock = materials.filter(m => m.stock > m.reorderPoint * 3);
  const safetyStock = materials.filter(m => m.stock > m.reorderPoint * 1.5 && m.stock <= m.reorderPoint * 3);
  const lowStockItems = criticalStock.length; // for backward compatibility
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

  // ABC (value) + XYZ (demand variability mock: turnover-based)
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
  // XYZ: X=stable (high movement), Y=moderate, Z=irregular (low movement) - use stock/reorder ratio as proxy
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
    // Section 1: Dashboard metrics (% + material qty)
    stockMetrics: {
      criticalStock: { count: criticalStock.length, pct: totalMaterials ? ((criticalStock.length / totalMaterials) * 100).toFixed(1) : 0 },
      lowStock: { count: lowStock.length, pct: totalMaterials ? ((lowStock.length / totalMaterials) * 100).toFixed(1) : 0 },
      overStock: { count: overStock.length, pct: totalMaterials ? ((overStock.length / totalMaterials) * 100).toFixed(1) : 0 },
      safetyStock: { count: safetyStock.length, pct: totalMaterials ? ((safetyStock.length / totalMaterials) * 100).toFixed(1) : 0 }
    },
    // Section 3: ABC/XYZ for Pareto (6 categories)
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
});

// Inventory turnover analysis
router.get('/turnover', (req, res) => {
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
});

// ABC Analysis
router.get('/abc-analysis', (req, res) => {
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
});

module.exports = router;
