# Quick Test Guide - ERPNext Integration

## ✅ System Status

**Server Running:** http://localhost:3000
**ERPNext Connected:** ✅ https://ai-inventory-erp.s.frappe.cloud
**Mode:** ERPNext-Only (No Mock Data)

## 🎯 Current State

Your system is now 100% connected to ERPNext. Since you have:
- ✅ 4 Warehouses in ERPNext
- ⚠️ 0 Items in ERPNext
- ⚠️ 0 Stock Entries

The materials list will be empty until you add items.

## 🚀 Quick Start: Add Your First Item

### Option 1: Via ERPNext Web Interface

1. **Open ERPNext:**
   - Go to: https://ai-inventory-erp.s.frappe.cloud/desk
   - Login with your credentials

2. **Create an Item:**
   - Navigate to: **Stock → Item → New**
   - Fill in:
     - **Item Code:** ITEM-001
     - **Item Name:** Test Material
     - **Item Group:** Raw Material (or create new)
     - **Default Warehouse:** Stores - CA
     - **Stock UOM:** Nos
     - **Min Order Qty:** 10
     - **Standard Rate:** 100
   - Click **Save**

3. **Add Initial Stock:**
   - Navigate to: **Stock → Stock Entry → New**
   - **Stock Entry Type:** Material Receipt
   - **Target Warehouse:** Stores - CA
   - **Items:**
     - Item Code: ITEM-001
     - Qty: 50
   - Click **Submit**

4. **View in App:**
   - Open: http://localhost:3000
   - Refresh the page
   - Your item appears with stock of 50!

### Option 2: Via API (Using Postman or curl)

**Create Item:**
```bash
curl -X POST http://localhost:3000/api/materials \
  -H "Content-Type: application/json" \
  -d '{
    "partNumber": "ITEM-001",
    "description": "Test Material",
    "grouping": "Raw Material",
    "unit": "Nos",
    "reorderPoint": 10,
    "price": 100,
    "storageLocation": "Stores - CA",
    "stock": 50
  }'
```

This will:
1. Create the item in ERPNext
2. Create a stock entry with 50 units
3. Return the created item

## 📊 Test the Integration

### Test 1: View Materials
```
Open: http://localhost:3000
```
- Should show all items from ERPNext
- Currently empty (add items first)

### Test 2: Check Connection
```
Open: http://localhost:3000/api/erpnext/test
```
- Should return: `{"success":true,"message":"Connected to ERPNext successfully"}`

### Test 3: View Warehouses
Your ERPNext has these warehouses:
- Finished Goods - CA
- Goods In Transit - CA
- Stores - CA
- (1 more)

Use these when creating stock entries.

## 🎨 Sample Items to Create

Here are some sample items you can create to test:

### Item 1: Raw Material
- **Item Code:** RM-001
- **Item Name:** Steel Plate
- **Item Group:** Raw Material
- **UOM:** Kg
- **Min Order Qty:** 100
- **Rate:** 50
- **Warehouse:** Stores - CA

### Item 2: Finished Good
- **Item Code:** FG-001
- **Item Name:** Finished Product A
- **Item Group:** Finished Goods
- **UOM:** Nos
- **Min Order Qty:** 20
- **Rate:** 500
- **Warehouse:** Finished Goods - CA

### Item 3: Consumable
- **Item Code:** CONS-001
- **Item Name:** Office Supplies
- **Item Group:** Consumable
- **UOM:** Nos
- **Min Order Qty:** 10
- **Rate:** 25
- **Warehouse:** Stores - CA

## 🔄 Real-Time Test

### Test Real-Time Sync:

1. **Open the app:** http://localhost:3000
2. **In another tab, open ERPNext**
3. **Create an item in ERPNext**
4. **Refresh the app** → Item appears!
5. **Add stock in ERPNext**
6. **Refresh the app** → Stock updated!

## 📱 Using the App

### Dashboard
- Shows total materials, value, low stock alerts
- ABC/XYZ analysis
- Stock metrics
- All calculated from ERPNext data in real-time

### Materials List
- View all items
- Search by name/code
- Filter by group
- Filter low stock items
- Click item to see details

### Stock Entry
- Create Material Receipt (add stock)
- Create Material Issue (remove stock)
- Create Material Transfer (move between warehouses)
- All entries saved to ERPNext

### Analytics
- Inventory turnover
- ABC analysis
- Stock classification
- All based on real ERPNext data

## 🎯 Next Actions

1. **Add 5-10 items** in ERPNext to test
2. **Create stock entries** to add initial stock
3. **Test the app** - view materials, create entries
4. **Check ERPNext** - verify entries appear there
5. **Test analytics** - see dashboard calculations

## 💡 Tips

### For Testing
- Start with 3-5 items
- Use different item groups
- Add varying stock levels
- Test low stock alerts (set stock below reorder point)

### For Production
- Plan your item structure
- Define item groups clearly
- Set realistic reorder levels
- Use meaningful item codes

## 🐛 Troubleshooting

### Materials list is empty
- **Cause:** No items in ERPNext
- **Solution:** Create items in ERPNext first

### "Failed to fetch materials"
- **Cause:** ERPNext connection issue
- **Solution:** Check internet, verify credentials

### Item not appearing
- **Cause:** Item might be disabled
- **Solution:** Check item status in ERPNext

### Stock not updating
- **Cause:** Stock entry not submitted
- **Solution:** Submit stock entries in ERPNext

## 📞 Support

- **ERPNext Docs:** https://docs.erpnext.com/docs/user/manual/en/stock
- **Your Instance:** https://ai-inventory-erp.s.frappe.cloud
- **Test Connection:** http://localhost:3000/api/erpnext/test

---

**Ready to test!** Create your first item in ERPNext and watch it appear in the app in real-time! 🚀
