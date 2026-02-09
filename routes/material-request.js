const express = require('express');
const router = express.Router();

// In-memory storage for material requests
let materialRequests = [];
let requestCounter = 1;

// GET all material requests
router.get('/', (req, res) => {
  const { status, type, requestedBy } = req.query;
  
  let filtered = [...materialRequests];
  
  if (status) {
    filtered = filtered.filter(r => r.status === status);
  }
  
  if (type) {
    filtered = filtered.filter(r => r.requestType === type);
  }
  
  if (requestedBy) {
    filtered = filtered.filter(r => r.requestedBy === requestedBy);
  }
  
  res.json(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// CREATE material request
router.post('/', (req, res) => {
  const { requestType, items, requiredBy, purpose, remarks, requestedBy } = req.body;
  
  // Validation
  if (!requestType || !items || items.length === 0) {
    return res.status(400).json({ error: 'Request type and items are required' });
  }
  
  // Validate request type
  const validTypes = ['Purchase', 'Material Transfer', 'Material Issue', 'Manufacture'];
  if (!validTypes.includes(requestType)) {
    return res.status(400).json({ error: 'Invalid request type' });
  }
  
  // Create material request
  const materialRequest = {
    id: `MR-${String(requestCounter++).padStart(6, '0')}`,
    requestType,
    items: items.map(item => ({
      materialId: item.materialId,
      partNumber: item.partNumber,
      description: item.description,
      quantity: parseFloat(item.quantity),
      unit: item.unit,
      warehouse: item.warehouse || '',
      requiredBy: item.requiredBy || requiredBy,
      currentStock: item.currentStock || 0,
      orderedQty: 0,
      receivedQty: 0
    })),
    requiredBy: requiredBy || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    purpose: purpose || '',
    remarks: remarks || '',
    requestedBy: requestedBy || 'System User',
    date: new Date().toISOString(),
    status: 'Pending',
    approvedBy: null,
    approvedDate: null
  };
  
  materialRequests.push(materialRequest);
  res.status(201).json(materialRequest);
});

// GET single material request
router.get('/:id', (req, res) => {
  const request = materialRequests.find(r => r.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Material request not found' });
  }
  res.json(request);
});

// UPDATE material request status
router.put('/:id/status', (req, res) => {
  const { status, approvedBy } = req.body;
  const request = materialRequests.find(r => r.id === req.params.id);
  
  if (!request) {
    return res.status(404).json({ error: 'Material request not found' });
  }
  
  // Validate status
  const validStatuses = ['Pending', 'Approved', 'Rejected', 'Partially Ordered', 'Ordered', 'Issued', 'Transferred', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  request.status = status;
  
  if (status === 'Approved') {
    request.approvedBy = approvedBy || 'System User';
    request.approvedDate = new Date().toISOString();
  }
  
  if (status === 'Cancelled') {
    request.cancelledDate = new Date().toISOString();
  }
  
  res.json(request);
});

// UPDATE material request item quantities (ordered/received)
router.put('/:id/items/:itemIndex', (req, res) => {
  const { orderedQty, receivedQty } = req.body;
  const request = materialRequests.find(r => r.id === req.params.id);
  
  if (!request) {
    return res.status(404).json({ error: 'Material request not found' });
  }
  
  const itemIndex = parseInt(req.params.itemIndex);
  if (itemIndex < 0 || itemIndex >= request.items.length) {
    return res.status(400).json({ error: 'Invalid item index' });
  }
  
  if (orderedQty !== undefined) {
    request.items[itemIndex].orderedQty = parseFloat(orderedQty);
  }
  
  if (receivedQty !== undefined) {
    request.items[itemIndex].receivedQty = parseFloat(receivedQty);
  }
  
  // Update overall status based on items
  const allOrdered = request.items.every(item => item.orderedQty >= item.quantity);
  const someOrdered = request.items.some(item => item.orderedQty > 0);
  const allReceived = request.items.every(item => item.receivedQty >= item.quantity);
  
  if (allReceived) {
    request.status = 'Issued';
  } else if (allOrdered) {
    request.status = 'Ordered';
  } else if (someOrdered) {
    request.status = 'Partially Ordered';
  }
  
  res.json(request);
});

// Auto-generate material requests for low stock items
router.post('/auto-generate', (req, res) => {
  const materials = require('../data/materials');
  
  // Find materials below reorder point
  const lowStockMaterials = materials.filter(m => m.stock <= m.reorderPoint);
  
  if (lowStockMaterials.length === 0) {
    return res.json({ message: 'No materials below reorder point', count: 0 });
  }
  
  // Create material request
  const materialRequest = {
    id: `MR-${String(requestCounter++).padStart(6, '0')}`,
    requestType: 'Purchase',
    items: lowStockMaterials.map(m => ({
      materialId: m.id,
      partNumber: m.partNumber,
      description: m.description,
      quantity: m.reorderPoint * 2 - m.stock, // Order to reach 2x reorder point
      unit: m.unit,
      warehouse: m.storageLocation,
      requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      currentStock: m.stock,
      orderedQty: 0,
      receivedQty: 0
    })),
    requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    purpose: 'Auto-generated for low stock items',
    remarks: 'System generated material request based on reorder levels',
    requestedBy: 'System (Auto)',
    date: new Date().toISOString(),
    status: 'Pending',
    approvedBy: null,
    approvedDate: null
  };
  
  materialRequests.push(materialRequest);
  res.status(201).json({
    message: 'Material request created for low stock items',
    count: lowStockMaterials.length,
    request: materialRequest
  });
});

module.exports = router;
