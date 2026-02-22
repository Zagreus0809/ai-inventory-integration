# ERPNext Integration Setup Guide

This guide will help you connect your SAP AI Inventory System to ERPNext Cloud.

## Prerequisites

- ERPNext Cloud instance: `https://ai-inventory-erp.s.frappe.cloud`
- ERPNext user account with API access permissions

## Step 1: Generate API Credentials in ERPNext

1. Log in to your ERPNext instance: https://ai-inventory-erp.s.frappe.cloud/desk
2. Click on your user avatar (top right) → **My Settings**
3. Scroll down to **API Access** section
4. Click **Generate Keys** button
5. Copy both the **API Key** and **API Secret** (you'll only see the secret once!)

## Step 2: Configure Environment Variables

Update your `.env` file with the ERPNext credentials:

```env
PORT=3000
GEMINI_API_KEY=your_gemini_key_here
NODE_ENV=development

# ERPNext Configuration
ERPNEXT_URL=https://ai-inventory-erp.s.frappe.cloud
ERPNEXT_API_KEY=your_api_key_here
ERPNEXT_API_SECRET=your_api_secret_here
```

## Step 3: Test the Connection

Run the test script to verify your connection:

```bash
node test-erpnext-connection.js
```

You should see:
- ✅ Authentication successful
- List of warehouses
- List of items
- Recent stock entries

## Step 4: Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## Step 5: Verify Integration

### Test via API endpoint:
```bash
curl http://localhost:3000/api/erpnext/test
```

### Test in browser:
1. Open http://localhost:3000
2. The materials list should now show data from ERPNext
3. Create a stock entry to test write operations

## How It Works

### Automatic Fallback
The system automatically detects if ERPNext is configured:
- **ERPNext configured**: Fetches real data from your ERPNext instance
- **Not configured**: Uses mock data for testing/demo purposes

### Supported Features

#### Materials Management
- ✅ Fetch all items from ERPNext
- ✅ Get individual item details
- ✅ Real-time stock levels from bins
- ✅ Search and filter items
- ✅ Low stock alerts

#### Stock Entries
- ✅ Create Material Receipt
- ✅ Create Material Issue
- ✅ Create Material Transfer
- ✅ View stock entry history
- ✅ Stock ledger tracking

#### Analytics
- ✅ Stock movement analysis
- ✅ Warehouse-wise stock reports
- ✅ Item consumption patterns

## ERPNext Data Mapping

| SAP AI Field | ERPNext Field |
|--------------|---------------|
| id | name (Item Code) |
| partNumber | item_code |
| description | item_name / description |
| grouping | item_group |
| storageLocation | default_warehouse |
| stock | actual_qty (from Bin) |
| reorderPoint | min_order_qty |
| unit | stock_uom |
| price | standard_rate |

## Troubleshooting

### Connection Failed
- Verify your ERPNext URL is correct
- Check that API Key and Secret are properly copied
- Ensure your ERPNext user has API access permissions

### No Items Showing
- Make sure you have items created in ERPNext
- Check that items are not disabled
- Verify the API key has read permissions for Items

### Stock Entry Creation Fails
- Ensure warehouses exist in ERPNext
- Verify items exist before creating stock entries
- Check that the API key has write permissions

### Permission Errors
In ERPNext, ensure your user has these permissions:
- Item: Read, Write
- Bin: Read
- Stock Entry: Read, Write, Create
- Stock Ledger Entry: Read
- Warehouse: Read

## API Endpoints

### Test Connection
```
GET /api/erpnext/test
```

### Materials
```
GET /api/materials              # List all materials
GET /api/materials/:id          # Get single material
GET /api/materials?search=text  # Search materials
GET /api/materials?lowStock=true # Low stock items
```

### Stock Entries
```
POST /api/stock-entry           # Create stock entry
GET /api/stock-entry            # List stock entries
GET /api/stock-entry/:id        # Get single entry
GET /api/stock-entry/ledger     # Stock ledger
```

## Next Steps

1. **Import Existing Data**: If you have materials in the mock system, you can manually create them in ERPNext
2. **Configure Warehouses**: Set up your warehouse structure in ERPNext
3. **Set Reorder Levels**: Configure min_order_qty for items in ERPNext
4. **Enable AI Features**: The AI analysis will work with real ERPNext data

## Support

For ERPNext-specific issues:
- ERPNext Documentation: https://docs.erpnext.com
- ERPNext Forum: https://discuss.erpnext.com

For integration issues:
- Check the console logs for detailed error messages
- Run the test script for diagnostics
- Verify your .env configuration
