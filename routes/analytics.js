const express = require('express');
const router = express.Router();
const materials = require('../data/materials');

// Dashboard statistics
router.get('/dashboard', (req, res) => {
  const totalMaterials = materials.length;
  const totalValue = materials.reduce((sum, m) => sum + (m.stock * m.price), 0);
  const lowStockItems = materials.filter(m => m.stock <= m.reorderPoint).length;
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
  
  res.json({
    totalMaterials,
    totalValue: totalValue.toFixed(2),
    lowStockItems,
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
