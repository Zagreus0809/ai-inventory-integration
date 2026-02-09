const express = require('express');
const router = express.Router();

// In-memory storage for stock entries
let stockEntries = [];
let stockEntryCounter = 1;

// Stock Ledger - tracks all movements
let stockLedger = [];

// GET all stock entries
router.get('/', (req, res) => {
  const { type, startDate, endDate } = req.query;
  
  let filtered = [...stockEntries];
  
  if (type) {
    filtered = filtered.filter(e => e.entryType === type);
  }
  
  if (startDate) {
    filtered = filtered.filter(e => new Date(e.date) >= new Date(startDate));
  }
  
  if (endDate) {
    filtered = filtered.filter(e => new Date(e.date) <= new Date(endDate));
  }
  
  res.json(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// CREATE stock entry (Material Receipt, Issue, Transfer)
router.post('/', (req, res) => {
  const { entryType, items, sourceWarehouse, targetWarehouse, remarks, reference } = req.body;
  
  // Validation
  if (!entryType || !items || items.length === 0) {
    return res.status(400).json({ error: 'Entry type and items are required' });
  }
  
  // Validate entry type
  const validTypes = ['Material Receipt', 'Material Issue', 'Material Transfer', 'Material Consumption'];
  if (!validTypes.includes(entryType)) {
    return res.status(400).json({ error: 'Invalid entry type' });
  }
  
  // Create stock entry
  const stockEntry = {
    id: `SE-${String(stockEntryCounter++).padStart(6, '0')}`,
    entryType,
    items: items.map(item => ({
      materialId: item.materialId,
      partNumber: item.partNumber,
      description: item.description,
      quantity: parseFloat(item.quantity),
      unit: item.unit,
      warehouse: item.warehouse || targetWarehouse || sourceWarehouse,
      rate: parseFloat(item.rate || 0),
      amount: parseFloat(item.quantity) * parseFloat(item.rate || 0)
    })),
    sourceWarehouse: sourceWarehouse || null,
    targetWarehouse: targetWarehouse || null,
    totalAmount: items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.rate || 0)), 0),
    remarks: remarks || '',
    reference: reference || '',
    date: new Date().toISOString(),
    status: 'Submitted',
    createdBy: 'System User'
  };
  
  // Add to stock ledger
  items.forEach(item => {
    // For Material Receipt - add to target warehouse
    if (entryType === 'Material Receipt') {
      stockLedger.push({
        id: `SLE-${stockLedger.length + 1}`,
        stockEntryId: stockEntry.id,
        materialId: item.materialId,
        partNumber: item.partNumber,
        warehouse: targetWarehouse || item.warehouse,
        quantity: parseFloat(item.quantity),
        quantityChange: parseFloat(item.quantity),
        voucherType: 'Stock Entry',
        voucherNo: stockEntry.id,
        date: stockEntry.date,
        entryType: 'IN'
      });
    }
    
    // For Material Issue - remove from source warehouse
    if (entryType === 'Material Issue' || entryType === 'Material Consumption') {
      stockLedger.push({
        id: `SLE-${stockLedger.length + 1}`,
        stockEntryId: stockEntry.id,
        materialId: item.materialId,
        partNumber: item.partNumber,
        warehouse: sourceWarehouse || item.warehouse,
        quantity: -parseFloat(item.quantity),
        quantityChange: -parseFloat(item.quantity),
        voucherType: 'Stock Entry',
        voucherNo: stockEntry.id,
        date: stockEntry.date,
        entryType: 'OUT'
      });
    }
    
    // For Material Transfer - remove from source, add to target
    if (entryType === 'Material Transfer') {
      // OUT from source
      stockLedger.push({
        id: `SLE-${stockLedger.length + 1}`,
        stockEntryId: stockEntry.id,
        materialId: item.materialId,
        partNumber: item.partNumber,
        warehouse: sourceWarehouse,
        quantity: -parseFloat(item.quantity),
        quantityChange: -parseFloat(item.quantity),
        voucherType: 'Stock Entry',
        voucherNo: stockEntry.id,
        date: stockEntry.date,
        entryType: 'OUT'
      });
      
      // IN to target
      stockLedger.push({
        id: `SLE-${stockLedger.length + 1}`,
        stockEntryId: stockEntry.id,
        materialId: item.materialId,
        partNumber: item.partNumber,
        warehouse: targetWarehouse,
        quantity: parseFloat(item.quantity),
        quantityChange: parseFloat(item.quantity),
        voucherType: 'Stock Entry',
        voucherNo: stockEntry.id,
        date: stockEntry.date,
        entryType: 'IN'
      });
    }
  });
  
  stockEntries.push(stockEntry);
  res.status(201).json(stockEntry);
});

// GET stock ledger
router.get('/ledger', (req, res) => {
  const { materialId, warehouse } = req.query;
  
  let filtered = [...stockLedger];
  
  if (materialId) {
    filtered = filtered.filter(e => e.materialId === materialId);
  }
  
  if (warehouse) {
    filtered = filtered.filter(e => e.warehouse === warehouse);
  }
  
  res.json(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// GET stock balance by warehouse
router.get('/balance', (req, res) => {
  const { warehouse } = req.query;
  
  // Calculate stock balance from ledger
  const balance = {};
  
  stockLedger.forEach(entry => {
    if (warehouse && entry.warehouse !== warehouse) return;
    
    const key = `${entry.materialId}_${entry.warehouse}`;
    if (!balance[key]) {
      balance[key] = {
        materialId: entry.materialId,
        partNumber: entry.partNumber,
        warehouse: entry.warehouse,
        quantity: 0
      };
    }
    balance[key].quantity += entry.quantityChange;
  });
  
  res.json(Object.values(balance));
});

// GET single stock entry
router.get('/:id', (req, res) => {
  const entry = stockEntries.find(e => e.id === req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Stock entry not found' });
  }
  res.json(entry);
});

// CANCEL stock entry
router.post('/:id/cancel', (req, res) => {
  const entry = stockEntries.find(e => e.id === req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Stock entry not found' });
  }
  
  if (entry.status === 'Cancelled') {
    return res.status(400).json({ error: 'Entry already cancelled' });
  }
  
  entry.status = 'Cancelled';
  entry.cancelledDate = new Date().toISOString();
  
  // Reverse stock ledger entries
  const relatedLedgerEntries = stockLedger.filter(e => e.stockEntryId === entry.id);
  relatedLedgerEntries.forEach(ledgerEntry => {
    stockLedger.push({
      ...ledgerEntry,
      id: `SLE-${stockLedger.length + 1}`,
      quantity: -ledgerEntry.quantity,
      quantityChange: -ledgerEntry.quantityChange,
      entryType: ledgerEntry.entryType === 'IN' ? 'OUT' : 'IN',
      remarks: `Reversal of ${ledgerEntry.id}`
    });
  });
  
  res.json(entry);
});

module.exports = router;
