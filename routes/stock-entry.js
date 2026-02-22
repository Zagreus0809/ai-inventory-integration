const express = require('express');
const router = express.Router();
const erpnext = require('../services/erpnext');

// GET all stock entries - Real-time from ERPNext
router.get('/', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const filters = {};
    
    if (type) {
      filters.stock_entry_type = type;
    }
    
    if (startDate) {
      filters.posting_date = ['>=', startDate];
    }
    
    const result = await erpnext.getStockEntries(filters);
    const entries = result.data || [];
    
    const formatted = entries.map(entry => ({
      id: entry.name,
      entryType: entry.stock_entry_type,
      items: entry.items || [],
      sourceWarehouse: entry.from_warehouse,
      targetWarehouse: entry.to_warehouse,
      totalAmount: entry.total_amount || 0,
      remarks: entry.remarks || '',
      reference: entry.purchase_order || entry.work_order || '',
      date: entry.posting_date,
      status: entry.docstatus === 1 ? 'Submitted' : entry.docstatus === 2 ? 'Cancelled' : 'Draft',
      createdBy: entry.owner
    }));
    
    // Apply date filters
    let filtered = formatted;
    if (endDate) {
      filtered = filtered.filter(e => new Date(e.date) <= new Date(endDate));
    }
    
    res.json(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
  } catch (error) {
    console.error('Error fetching stock entries from ERPNext:', error);
    res.status(500).json({ error: 'Failed to fetch stock entries from ERPNext', details: error.message });
  }
});

// CREATE stock entry (Material Receipt, Issue, Transfer) - ERPNext only
router.post('/', async (req, res) => {
  try {
    const { entryType, items, sourceWarehouse, targetWarehouse, remarks, reference } = req.body;
    
    // Validation
    if (!entryType || !items || items.length === 0) {
      return res.status(400).json({ error: 'Entry type and items are required' });
    }

    // Create in ERPNext
    const stockEntryData = {
      doctype: 'Stock Entry',
      stock_entry_type: entryType,
      from_warehouse: sourceWarehouse || null,
      to_warehouse: targetWarehouse || null,
      remarks: remarks || '',
      items: items.map(item => ({
        item_code: item.materialId,
        qty: parseFloat(item.quantity),
        uom: item.unit,
        s_warehouse: sourceWarehouse || null,
        t_warehouse: targetWarehouse || null,
        basic_rate: parseFloat(item.rate || 0)
      }))
    };
    
    const result = await erpnext.createStockEntry(stockEntryData);
    
    res.status(201).json({
      id: result.data.name,
      entryType: result.data.stock_entry_type,
      items: result.data.items,
      sourceWarehouse: result.data.from_warehouse,
      targetWarehouse: result.data.to_warehouse,
      totalAmount: result.data.total_amount || 0,
      remarks: result.data.remarks,
      date: result.data.posting_date,
      status: result.data.docstatus === 1 ? 'Submitted' : 'Draft',
      createdBy: result.data.owner
    });
  } catch (error) {
    console.error('Error creating stock entry in ERPNext:', error);
    res.status(500).json({ error: 'Failed to create stock entry in ERPNext', details: error.message });
  }
});

// GET stock ledger - Real-time from ERPNext
router.get('/ledger', async (req, res) => {
  try {
    const { materialId, warehouse } = req.query;
    const filters = {};
    
    if (materialId) {
      filters.item_code = materialId;
    }
    
    if (warehouse) {
      filters.warehouse = warehouse;
    }
    
    const result = await erpnext.getStockLedgerEntries(filters);
    const entries = result.data || [];
    
    const formatted = entries.map(entry => ({
      id: entry.name,
      stockEntryId: entry.voucher_no,
      materialId: entry.item_code,
      partNumber: entry.item_code,
      warehouse: entry.warehouse,
      quantity: entry.actual_qty,
      quantityChange: entry.qty_after_transaction - (entry.actual_qty || 0),
      voucherType: entry.voucher_type,
      voucherNo: entry.voucher_no,
      date: entry.posting_date,
      entryType: entry.actual_qty > 0 ? 'IN' : 'OUT'
    }));
    
    res.json(formatted.sort((a, b) => new Date(b.date) - new Date(a.date)));
  } catch (error) {
    console.error('Error fetching stock ledger from ERPNext:', error);
    res.status(500).json({ error: 'Failed to fetch stock ledger from ERPNext', details: error.message });
  }
});

// GET stock balance by warehouse - Real-time from ERPNext
router.get('/balance', async (req, res) => {
  try {
    const { warehouse } = req.query;
    const filters = {};
    
    if (warehouse) {
      filters.warehouse = warehouse;
    }
    
    const result = await erpnext.getBins(filters);
    const bins = result.data || [];
    
    const balance = bins.map(bin => ({
      materialId: bin.item_code,
      partNumber: bin.item_code,
      warehouse: bin.warehouse,
      quantity: bin.actual_qty || 0
    }));
    
    res.json(balance);
  } catch (error) {
    console.error('Error fetching stock balance from ERPNext:', error);
    res.status(500).json({ error: 'Failed to fetch stock balance from ERPNext', details: error.message });
  }
});

// GET single stock entry - Real-time from ERPNext
router.get('/:id', async (req, res) => {
  try {
    const result = await erpnext.request(`/api/resource/Stock Entry/${req.params.id}`);
    const entry = result.data;
    
    res.json({
      id: entry.name,
      entryType: entry.stock_entry_type,
      items: entry.items || [],
      sourceWarehouse: entry.from_warehouse,
      targetWarehouse: entry.to_warehouse,
      totalAmount: entry.total_amount || 0,
      remarks: entry.remarks || '',
      reference: entry.purchase_order || entry.work_order || '',
      date: entry.posting_date,
      status: entry.docstatus === 1 ? 'Submitted' : entry.docstatus === 2 ? 'Cancelled' : 'Draft',
      createdBy: entry.owner
    });
  } catch (error) {
    console.error('Error fetching stock entry from ERPNext:', error);
    res.status(404).json({ error: 'Stock entry not found in ERPNext', details: error.message });
  }
});

// CANCEL stock entry - ERPNext only
router.post('/:id/cancel', async (req, res) => {
  try {
    // Cancel in ERPNext by setting docstatus to 2
    const result = await erpnext.request(`/api/resource/Stock Entry/${req.params.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        docstatus: 2
      })
    });
    
    res.json({
      id: result.data.name,
      status: 'Cancelled',
      cancelledDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error cancelling stock entry in ERPNext:', error);
    res.status(500).json({ error: 'Failed to cancel stock entry in ERPNext', details: error.message });
  }
});

module.exports = router;
