# 📦 ERPNext Features - Quick Guide

## 🚀 Access
**URL:** http://localhost:3000

## 📥 Stock Entry (Material Movements)

### Types
1. **Material Receipt** → Receive stock (IN)
2. **Material Issue** → Issue stock (OUT)
3. **Material Transfer** → Move between warehouses
4. **Material Consumption** → Production use

### Quick Steps
1. Click "Stock Entry" in sidebar
2. Click "New Stock Entry"
3. Select type → Choose material → Enter quantity
4. Submit ✅

## 📋 Material Request

### Types
1. **Purchase** → Buy materials
2. **Material Transfer** → Move stock
3. **Material Issue** → Issue materials
4. **Manufacture** → Production needs

### Quick Steps
1. Click "Material Request" in sidebar
2. Click "New Material Request"
3. Select type → Choose material → Enter quantity
4. Submit ✅

### Auto-Generate
Click "Auto-Generate for Low Stock" → System creates requests automatically!

## 📖 Stock Ledger

### View All Movements
1. Click "Stock Ledger" in sidebar
2. See all IN/OUT transactions
3. Filter by material, warehouse, or type
4. View running balance

## ✅ All Features Working

- Stock Entry ✅
- Material Request ✅
- Stock Ledger ✅
- Auto-Generate ✅
- Multi-Warehouse ✅
- Approval Workflow ✅

## 🎯 Quick Test

Run: `node test-erpnext-features.js`

**Result:** All 6 tests passed! 🎉
