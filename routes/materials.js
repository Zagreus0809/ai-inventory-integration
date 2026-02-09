const express = require('express');
const router = express.Router();
const materials = require('../data/materials');

// In-memory storage (replace with database in production)
let inventory = materials.map(m => ({
  ...m,
  lastUpdated: new Date().toISOString(),
  movements: []
}));

// GET all materials
router.get('/', (req, res) => {
  const { grouping, search, lowStock } = req.query;
  
  let filtered = [...inventory];
  
  if (grouping) {
    filtered = filtered.filter(m => m.grouping === grouping);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(m => 
      m.description.toLowerCase().includes(searchLower) ||
      m.partNumber.toLowerCase().includes(searchLower) ||
      m.project.toLowerCase().includes(searchLower)
    );
  }
  
  if (lowStock === 'true') {
    filtered = filtered.filter(m => m.stock <= m.reorderPoint);
  }
  
  res.json(filtered);
});

// GET single material
router.get('/:id', (req, res) => {
  const material = inventory.find(m => m.id === req.params.id);
  if (!material) {
    return res.status(404).json({ error: 'Material not found' });
  }
  res.json(material);
});

// UPDATE material stock
router.put('/:id/stock', (req, res) => {
  const { quantity, type, reference } = req.body;
  const material = inventory.find(m => m.id === req.params.id);
  
  if (!material) {
    return res.status(404).json({ error: 'Material not found' });
  }
  
  const movement = {
    date: new Date().toISOString(),
    type,
    quantity,
    reference,
    previousStock: material.stock
  };
  
  if (type === 'IN') {
    material.stock += quantity;
  } else if (type === 'OUT') {
    material.stock -= quantity;
  }
  
  material.movements.push(movement);
  material.lastUpdated = new Date().toISOString();
  
  res.json(material);
});

// ADD new material
router.post('/', (req, res) => {
  const { partNumber, description, project, grouping, storageLocation, stock, reorderPoint, unit, price } = req.body;
  
  // Validation
  if (!partNumber || !description || !grouping || stock === undefined || reorderPoint === undefined || !unit) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Generate new ID
  const maxId = Math.max(...inventory.map(m => parseInt(m.id.replace('MAT', ''))), 0);
  const newId = `MAT${String(maxId + 1).padStart(3, '0')}`;
  
  const newMaterial = {
    id: newId,
    partNumber,
    description,
    project: project || 'Common',
    grouping,
    storageLocation: storageLocation || 'General Storage',
    stock: parseFloat(stock),
    reorderPoint: parseFloat(reorderPoint),
    unit,
    price: parseFloat(price) || 0,
    lastUpdated: new Date().toISOString(),
    movements: []
  };
  
  inventory.push(newMaterial);
  res.status(201).json(newMaterial);
});

module.exports = router;
