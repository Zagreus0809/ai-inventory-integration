# Quick Start: Connect to ERPNext

Follow these 3 simple steps to connect your inventory system to ERPNext Cloud.

## Step 1: Get API Credentials (2 minutes)

1. Open: https://ai-inventory-erp.s.frappe.cloud/desk
2. Login to your account
3. Click your profile picture (top right) → **My Settings**
4. Scroll down to **API Access**
5. Click **Generate Keys**
6. **IMPORTANT**: Copy both keys immediately (you won't see the secret again!)

## Step 2: Update .env File (1 minute)

Open `sap-ai-inventory/.env` and replace these lines:

```env
ERPNEXT_API_KEY=your_api_key_here
ERPNEXT_API_SECRET=your_api_secret_here
```

With your actual credentials:

```env
ERPNEXT_API_KEY=abc123def456...
ERPNEXT_API_SECRET=xyz789uvw012...
```

Save the file.

## Step 3: Test & Run (1 minute)

```bash
# Test the connection
node test-erpnext-connection.js

# If successful, start the server
npm start
```

Open http://localhost:3000 - you should now see your ERPNext inventory data!

## What You'll See

✅ Real items from your ERPNext instance
✅ Live stock levels from warehouses
✅ Ability to create stock entries
✅ All data synced with ERPNext

## Troubleshooting

### "Connection failed"
- Double-check you copied the API Key and Secret correctly
- Make sure there are no extra spaces
- Verify you're logged into the correct ERPNext instance

### "No items showing"
- You need to create items in ERPNext first
- Go to: Stock → Item → New
- Create at least one item to test

### "Permission denied"
- Your ERPNext user needs these permissions:
  - Item: Read, Write
  - Stock Entry: Read, Write, Create
  - Bin: Read
  - Warehouse: Read

## Need Help?

- Full documentation: See `ERPNEXT_SETUP.md`
- Technical details: See `INTEGRATION_SUMMARY.md`
- ERPNext docs: https://docs.erpnext.com

## Demo Mode

Don't have ERPNext credentials yet? No problem!
- The system automatically uses mock data
- You can test all features
- Add credentials later when ready
