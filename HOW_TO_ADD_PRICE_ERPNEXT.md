# How to Add Price to Items in ERPNext

## Why You Need Price Values

The Pareto charts (ABC and XYZ analysis) require price data to calculate inventory value:
- **Inventory Value** = Stock Quantity × Price
- Without price, the charts cannot display because value = 0

## Method 1: Add Price via ERPNext Web Interface (Recommended)

### Step-by-Step:

1. **Login to ERPNext**
   - Go to: https://ai-inventory-erp.s.frappe.cloud/desk
   - Login with your credentials

2. **Navigate to Item List**
   - Click on "Stock" module in the sidebar
   - Click on "Item" or search for "Item List"
   - You'll see your 2 items listed

3. **Edit Each Item**
   - Click on an item to open it
   - Scroll down to find the "Rates" section
   - Look for the field: **"Standard Selling Rate"** or **"Valuation Rate"**
   - Enter the price (e.g., 1500.00 for ₱1,500)
   - Click "Save" button at the top

4. **Repeat for All Items**
   - Go back to Item List
   - Edit your second item
   - Add price and save

5. **Refresh Your Dashboard**
   - Go back to http://localhost:3000
   - Click the "Refresh" button on the dashboard
   - The Pareto charts should now display with real data!

## Method 2: Add Price via Your Program (Edit Button)

You already have an "Edit" button in the Materials Master section:

1. **Go to Materials Master**
   - Open http://localhost:3000
   - Click "Materials Master" in the sidebar

2. **Click Edit Button**
   - Find your item in the table
   - Click the "Edit" button next to it
   - Enter a price in the "Price" field
   - Click "Save Changes"

3. **Refresh Dashboard**
   - Go back to Dashboard
   - Click "Refresh"
   - Charts should now show real data

## Method 3: Add Price When Creating New Items

When adding new items through your program:

1. **Click "Add Material"** in Materials Master
2. Fill in all fields including:
   - Part Number
   - Description
   - Grouping
   - Unit
   - **Price** ← Make sure to fill this!
   - Stock (optional)
   - Reorder Point
3. Click "Add Material"

## What Price Field is Used?

The system reads the **`standard_rate`** field from ERPNext Item:
- In ERPNext UI: "Standard Selling Rate" or "Valuation Rate"
- In API: `item.standard_rate`
- In your program: "Price" field

## Example Prices

For testing, you can use these sample prices:
- Electronic components: ₱500 - ₱5,000
- Raw materials: ₱100 - ₱2,000
- Finished goods: ₱1,000 - ₱10,000

## Verify Charts Are Working

After adding prices:

1. **Check Materials Master**
   - You should see the "Value Class" column showing A/B/C badges
   - Hover over badges to see calculated inventory value

2. **Check Dashboard**
   - Scroll to "3 ABC/XYZ ANALYSIS" section
   - ABC Pareto Chart should show 3 bars (A/B/C)
   - XYZ Pareto Chart should show 3 bars (X/Y/Z)
   - Both charts should have cumulative % lines

3. **Real-time Updates**
   - Any price changes in ERPNext will reflect immediately
   - Just click "Refresh" on the dashboard

## Troubleshooting

**Charts still not showing?**
- Make sure BOTH items have price > 0
- Make sure items have stock > 0
- Check browser console (F12) for errors
- Try hard refresh (Ctrl+Shift+R)

**Price not updating?**
- Check if you saved the item in ERPNext
- Wait a few seconds for API sync
- Click "Refresh" button on dashboard

**Need help?**
- Check ERPNext documentation: https://docs.erpnext.com/docs/user/manual/en/stock/item
- Check the browser console for API errors
