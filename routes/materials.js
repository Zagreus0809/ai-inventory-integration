const express = require('express');
const router = express.Router();
const erpnext = require('../services/erpnext');

// GET all materials - Real-time from ERPNext (Optimized for Vercel)
router.get('/', async (req, res) => {
  try {
    console.log('[Materials] Fetching from ERPNext...');
    const { grouping, search, lowStock } = req.query;
    const filters = {};
    
    if (grouping) {
      filters.item_group = grouping;
    }
    
    // Fetch items
    const result = await erpnext.getItems(filters);
    const items = result.data || [];
    console.log(`[Materials] Found ${items.length} items`);
    
    // Fetch all bins in one call (faster than per-item)
    let allBins = [];
    try {
      const binsResult = await erpnext.getBins({});
      allBins = binsResult.data || [];
      console.log(`[Materials] Found ${allBins.length} bin records`);
    } catch (error) {
      console.error('[Materials] Error fetching bins:', error.message);
    }
    
    // Create a map of item_code to total stock
    const stockMap = {};
    allBins.forEach(bin => {
      if (!stockMap[bin.item_code]) {
        stockMap[bin.item_code] = 0;
      }
      stockMap[bin.item_code] += (bin.actual_qty || 0);
    });
    
    // Map items to materials format (much faster - no async calls)
    const materials = items.map(item => ({
      id: item.name,
      partNumber: item.item_code || item.name,
      description: item.item_name || item.description || '',
      project: item.project || 'Common',
      grouping: item.item_group || 'General',
      storageLocation: item.default_warehouse || 'General Storage',
      stock: stockMap[item.name] || 0,
      reorderPoint: item.min_order_qty || 10,
      safetyStock: item.safety_stock || (item.min_order_qty || 10) * 2,
      unit: item.stock_uom || 'Nos',
      price: item.standard_rate || 0,
      lastUpdated: item.modified || new Date().toISOString()
    }));
    
    let filtered = materials;
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(m => 
        m.description.toLowerCase().includes(searchLower) ||
        m.partNumber.toLowerCase().includes(searchLower) ||
        m.project.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply low stock filter
    if (lowStock === 'true') {
      filtered = filtered.filter(m => m.stock <= m.reorderPoint);
    }
    
    console.log(`[Materials] Returning ${filtered.length} materials`);
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching materials from ERPNext:', error);
    res.status(500).json({ error: 'Failed to fetch materials from ERPNext', details: error.message });
  }
});

// GET single material - Real-time from ERPNext
router.get('/:id', async (req, res) => {
  try {
    const item = await erpnext.getItem(req.params.id);
    const bins = await erpnext.getBins({ item_code: req.params.id });
    const totalStock = bins.data?.reduce((sum, bin) => sum + (bin.actual_qty || 0), 0) || 0;
    
    const material = {
      id: item.data.name,
      partNumber: item.data.item_code || item.data.name,
      description: item.data.item_name || item.data.description || '',
      project: item.data.project || 'Common',
      grouping: item.data.item_group || 'General',
      storageLocation: item.data.default_warehouse || 'General Storage',
      stock: totalStock,
      reorderPoint: item.data.min_order_qty || 10,
      unit: item.data.stock_uom || 'Nos',
      price: item.data.standard_rate || 0,
      lastUpdated: item.data.modified || new Date().toISOString()
    };
    
    res.json(material);
  } catch (error) {
    console.error('Error fetching material from ERPNext:', error);
    res.status(404).json({ error: 'Material not found in ERPNext', details: error.message });
  }
});

// UPDATE material stock - Creates Stock Entry in ERPNext
router.put('/:id/stock', async (req, res) => {
  try {
    const { quantity, type, reference, warehouse } = req.body;
    
    if (!quantity || !type) {
      return res.status(400).json({ error: 'Quantity and type are required' });
    }
    
    // Determine stock entry type
    let stockEntryType = 'Material Receipt';
    let targetWarehouse = warehouse;
    let sourceWarehouse = null;
    
    if (type === 'OUT') {
      stockEntryType = 'Material Issue';
      sourceWarehouse = warehouse;
      targetWarehouse = null;
    }
    
    // Create stock entry in ERPNext
    const stockEntryData = {
      doctype: 'Stock Entry',
      stock_entry_type: stockEntryType,
      from_warehouse: sourceWarehouse,
      to_warehouse: targetWarehouse,
      remarks: reference || `Stock update via API - ${type}`,
      items: [{
        item_code: req.params.id,
        qty: parseFloat(quantity),
        s_warehouse: sourceWarehouse,
        t_warehouse: targetWarehouse
      }]
    };
    
    const result = await erpnext.createStockEntry(stockEntryData);
    
    // Fetch updated material data
    const item = await erpnext.getItem(req.params.id);
    const bins = await erpnext.getBins({ item_code: req.params.id });
    const totalStock = bins.data?.reduce((sum, bin) => sum + (bin.actual_qty || 0), 0) || 0;
    
    res.json({
      id: item.data.name,
      partNumber: item.data.item_code || item.data.name,
      description: item.data.item_name || item.data.description || '',
      stock: totalStock,
      stockEntryId: result.data.name,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating stock in ERPNext:', error);
    res.status(500).json({ error: 'Failed to update stock in ERPNext', details: error.message });
  }
});

// ADD new material - Creates Item in ERPNext
router.post('/', async (req, res) => {
  try {
    const { partNumber, description, project, grouping, storageLocation, stock, reorderPoint, unit, price } = req.body;
    
    // Validation
    if (!partNumber || !description || !grouping || !unit) {
      return res.status(400).json({ error: 'Missing required fields: partNumber, description, grouping, unit' });
    }
    
    // Create item in ERPNext
    const itemData = {
      doctype: 'Item',
      item_code: partNumber,
      item_name: description,
      item_group: grouping,
      stock_uom: unit,
      is_stock_item: 1,
      include_item_in_manufacturing: 1,
      default_warehouse: storageLocation || null,
      min_order_qty: parseFloat(reorderPoint) || 10,
      standard_rate: parseFloat(price) || 0,
      description: description
    };
    
    const result = await erpnext.request('/api/resource/Item', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
    
    // If initial stock is provided, create stock entry
    if (stock && parseFloat(stock) > 0 && storageLocation) {
      const stockEntryData = {
        doctype: 'Stock Entry',
        stock_entry_type: 'Material Receipt',
        to_warehouse: storageLocation,
        items: [{
          item_code: partNumber,
          qty: parseFloat(stock),
          t_warehouse: storageLocation,
          basic_rate: parseFloat(price) || 0
        }]
      };
      
      await erpnext.createStockEntry(stockEntryData);
    }
    
    // Fetch the created item
    const item = await erpnext.getItem(partNumber);
    const bins = await erpnext.getBins({ item_code: partNumber });
    const totalStock = bins.data?.reduce((sum, bin) => sum + (bin.actual_qty || 0), 0) || 0;
    
    const newMaterial = {
      id: item.data.name,
      partNumber: item.data.item_code || item.data.name,
      description: item.data.item_name || item.data.description || '',
      project: project || 'Common',
      grouping: item.data.item_group || 'General',
      storageLocation: item.data.default_warehouse || 'General Storage',
      stock: totalStock,
      reorderPoint: item.data.min_order_qty || 10,
      unit: item.data.stock_uom || 'Nos',
      price: item.data.standard_rate || 0,
      lastUpdated: item.data.modified || new Date().toISOString()
    };
    
    res.status(201).json(newMaterial);
  } catch (error) {
    console.error('Error creating material in ERPNext:', error);
    res.status(500).json({ error: 'Failed to create material in ERPNext', details: error.message });
  }
});

module.exports = router;
