// Vercel Serverless Function for Materials
const fetch = require('node-fetch');

// ERPNext Service (inline for serverless)
class ERPNextService {
  constructor() {
    this.baseUrl = process.env.ERPNEXT_URL;
    this.apiKey = process.env.ERPNEXT_API_KEY;
    this.apiSecret = process.env.ERPNEXT_API_SECRET;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ERPNext API Error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async getItems(filters = {}) {
    const params = new URLSearchParams({
      fields: JSON.stringify(['*']),
      filters: JSON.stringify(filters),
      limit_page_length: 999
    });
    
    return await this.request(`/api/resource/Item?${params}`);
  }

  async getBins(filters = {}) {
    const params = new URLSearchParams({
      fields: JSON.stringify(['*']),
      filters: JSON.stringify(filters),
      limit_page_length: 999
    });
    
    return await this.request(`/api/resource/Bin?${params}`);
  }
}

// Serverless function handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Debug: Log environment variable status
    console.log('[Materials] Environment check:');
    console.log('ERPNEXT_URL:', process.env.ERPNEXT_URL ? 'SET' : 'MISSING');
    console.log('ERPNEXT_API_KEY:', process.env.ERPNEXT_API_KEY ? 'SET' : 'MISSING');
    console.log('ERPNEXT_API_SECRET:', process.env.ERPNEXT_API_SECRET ? 'SET' : 'MISSING');
    console.log('All env keys:', Object.keys(process.env).filter(k => k.includes('ERP')).join(', '));
    
    const erpnext = new ERPNextService();
    
    // Validate environment variables
    if (!erpnext.baseUrl || !erpnext.apiKey || !erpnext.apiSecret) {
      console.error('[Materials] Missing environment variables');
      console.error('baseUrl:', erpnext.baseUrl);
      console.error('apiKey:', erpnext.apiKey ? 'SET' : 'MISSING');
      console.error('apiSecret:', erpnext.apiSecret ? 'SET' : 'MISSING');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'ERPNext credentials not configured',
        debug: {
          hasUrl: !!erpnext.baseUrl,
          hasKey: !!erpnext.apiKey,
          hasSecret: !!erpnext.apiSecret
        }
      });
    }

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
    
    // Fetch all bins in one call
    let allBins = [];
    try {
      const binsResult = await erpnext.getBins({});
      allBins = binsResult.data || [];
      console.log(`[Materials] Found ${allBins.length} bin records`);
    } catch (error) {
      console.error('[Materials] Error fetching bins:', error.message);
    }
    
    // Create stock map
    const stockMap = {};
    allBins.forEach(bin => {
      if (!stockMap[bin.item_code]) {
        stockMap[bin.item_code] = 0;
      }
      stockMap[bin.item_code] += (bin.actual_qty || 0);
    });
    
    // Map to materials format
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
    return res.status(200).json(filtered);
    
  } catch (error) {
    console.error('[Materials] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch materials from ERPNext', 
      details: error.message 
    });
  }
};
