const fetch = require('node-fetch');

class ERPNextService {
  constructor() {
    this.baseUrl = process.env.ERPNEXT_URL;
    this.apiKey = process.env.ERPNEXT_API_KEY;
    this.apiSecret = process.env.ERPNEXT_API_SECRET;
    
    // Validate configuration
    if (!this.baseUrl || !this.apiKey || !this.apiSecret) {
      console.error('[ERPNext] Configuration missing!');
      console.error('ERPNEXT_URL:', this.baseUrl ? 'Set' : 'MISSING');
      console.error('ERPNEXT_API_KEY:', this.apiKey ? 'Set' : 'MISSING');
      console.error('ERPNEXT_API_SECRET:', this.apiSecret ? 'Set' : 'MISSING');
    } else {
      console.log('[ERPNext] Service initialized successfully');
      console.log('[ERPNext] URL:', this.baseUrl);
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    console.log(`[ERPNext] Request: ${options.method || 'GET'} ${endpoint}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[ERPNext] Error ${response.status}:`, error);
        throw new Error(`ERPNext API Error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      console.log(`[ERPNext] Success: ${endpoint}`);
      return data;
    } catch (error) {
      console.error('[ERPNext] Request failed:', error.message);
      throw error;
    }
  }

  // Get all items (materials)
  async getItems(filters = {}) {
    const params = new URLSearchParams({
      fields: JSON.stringify(['*']),
      filters: JSON.stringify(filters),
      limit_page_length: 999
    });
    
    return await this.request(`/api/resource/Item?${params}`);
  }

  // Get single item
  async getItem(itemCode) {
    return await this.request(`/api/resource/Item/${itemCode}`);
  }

  // Get stock balance
  async getStockBalance(itemCode, warehouse = null) {
    const params = new URLSearchParams({
      item_code: itemCode
    });
    
    if (warehouse) {
      params.append('warehouse', warehouse);
    }

    return await this.request(`/api/method/erpnext.stock.utils.get_stock_balance?${params}`);
  }

  // Get bin (stock) data
  async getBins(filters = {}) {
    const params = new URLSearchParams({
      fields: JSON.stringify(['*']),
      filters: JSON.stringify(filters),
      limit_page_length: 999
    });
    
    return await this.request(`/api/resource/Bin?${params}`);
  }

  // Create stock entry
  async createStockEntry(data) {
    return await this.request('/api/resource/Stock Entry', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Get stock entries
  async getStockEntries(filters = {}) {
    const params = new URLSearchParams({
      fields: JSON.stringify(['*']),
      filters: JSON.stringify(filters),
      limit_page_length: 100
    });
    
    return await this.request(`/api/resource/Stock Entry?${params}`);
  }

  // Create material request
  async createMaterialRequest(data) {
    return await this.request('/api/resource/Material Request', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Get material requests
  async getMaterialRequests(filters = {}) {
    const params = new URLSearchParams({
      fields: JSON.stringify(['*']),
      filters: JSON.stringify(filters),
      limit_page_length: 100
    });
    
    return await this.request(`/api/resource/Material Request?${params}`);
  }

  // Get warehouses
  async getWarehouses() {
    const params = new URLSearchParams({
      fields: JSON.stringify(['name', 'warehouse_name', 'is_group']),
      filters: JSON.stringify({ is_group: 0 }),
      limit_page_length: 999
    });
    
    return await this.request(`/api/resource/Warehouse?${params}`);
  }

  // Get stock ledger entries for analytics
  async getStockLedgerEntries(filters = {}) {
    const params = new URLSearchParams({
      fields: JSON.stringify(['*']),
      filters: JSON.stringify(filters),
      limit_page_length: 1000
    });
    
    return await this.request(`/api/resource/Stock Ledger Entry?${params}`);
  }

  // Test connection
  async testConnection() {
    try {
      await this.request('/api/method/frappe.auth.get_logged_user');
      return { success: true, message: 'Connected to ERPNext successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new ERPNextService();
