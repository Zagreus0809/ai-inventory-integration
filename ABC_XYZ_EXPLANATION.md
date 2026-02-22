# ABC/XYZ Classification Explained

## ✅ What Was Added

I've added explanations and counts to the ABC/XYZ classification boxes on your dashboard.

## 📊 What is ABC/XYZ Classification?

### ABC Analysis (Value-Based)
ABC analysis classifies inventory items based on their **total value** (Stock × Price).

**How it works:**
1. Calculate total value for each item: `Stock × Price`
2. Sort items by total value (highest to lowest)
3. Calculate cumulative percentage of total value
4. Classify:
   - **Class A**: Items that make up the first 80% of total value (high-value items)
   - **Class B**: Items that make up the next 15% of value (medium-value items)
   - **Class C**: Items that make up the last 5% of value (low-value items)

**Example with your 2 items:**
- Item 1: Stock = 50, Price = ₱100 → Value = ₱5,000
- Item 2: Stock = 30, Price = ₱50 → Value = ₱1,500
- Total Value = ₱6,500

Cumulative calculation:
- Item 1: ₱5,000 / ₱6,500 = 76.9% → **Class A** (first 80%)
- Item 2: ₱6,500 / ₱6,500 = 100% → **Class B** (next 15%)

**Management Strategy:**
- **A items**: Tight control, frequent monitoring, accurate records
- **B items**: Moderate control, regular reviews
- **C items**: Simple controls, bulk ordering

### XYZ Analysis (Demand-Based)
XYZ analysis classifies items based on **demand stability** using the Stock/Reorder ratio.

**How it works:**
1. Calculate ratio: `Current Stock / Reorder Point`
2. Classify based on ratio:
   - **Class X**: Stable demand (ratio between 2-4x) - predictable consumption
   - **Class Y**: Moderate demand (ratio between 1-2x) - some variability
   - **Class Z**: Irregular demand (ratio < 1x or > 4x) - unpredictable

**Example with your 2 items:**
- Item 1: Stock = 50, Reorder = 10 → Ratio = 5.0 → **Class Z** (irregular, overstocked)
- Item 2: Stock = 30, Reorder = 10 → Ratio = 3.0 → **Class X** (stable)

**Management Strategy:**
- **X items**: Standard reorder procedures, safety stock
- **Y items**: Flexible ordering, monitor trends
- **Z items**: Special attention, investigate causes

## 🎯 Combined ABC-XYZ Matrix

The real power comes from combining both analyses:

| Combination | Meaning | Management Approach |
|-------------|---------|---------------------|
| **AX** | High value, stable demand | Optimal - maintain current levels |
| **AY** | High value, moderate demand | Monitor closely, adjust safety stock |
| **AZ** | High value, irregular demand | Critical - investigate and optimize |
| **BX** | Medium value, stable demand | Standard procedures |
| **BY** | Medium value, moderate demand | Regular reviews |
| **BZ** | Medium value, irregular demand | Investigate patterns |
| **CX** | Low value, stable demand | Bulk ordering, simple controls |
| **CY** | Low value, moderate demand | Minimal monitoring |
| **CZ** | Low value, irregular demand | Consider discontinuing |

## 📈 Pareto Charts

### ABC Pareto Chart
Shows the distribution of inventory value:
- **Bars**: Number of items in each class (A, B, C)
- **Line**: Cumulative percentage of total value
- **Purpose**: Visualize the 80/20 rule (80% of value in 20% of items)

### XYZ Pareto Chart
Shows the distribution by demand stability:
- **Bars**: Total value of items in each class (X, Y, Z)
- **Line**: Cumulative percentage of total value
- **Purpose**: Identify which demand patterns hold most value

## 🔢 Your Current Data

With 2 items in ERPNext, you'll see:
- **ABC boxes**: Show how many items in each value class
- **XYZ boxes**: Show how many items in each demand class
- **Pareto charts**: Visual representation of the distribution

**Example counts you might see:**
- A: 1 item (highest value item)
- B: 1 item (lower value item)
- C: 0 items (none in lowest 5%)
- X: 1 item (stable demand)
- Y: 0 items (no moderate demand)
- Z: 1 item (irregular demand)

## 💡 How to Use This Information

### For High-Value Items (Class A):
1. Monitor stock levels daily
2. Maintain accurate records
3. Negotiate better prices with suppliers
4. Consider just-in-time delivery

### For Stable Demand Items (Class X):
1. Set up automatic reordering
2. Maintain consistent safety stock
3. Use economic order quantity (EOQ)
4. Establish reliable supplier relationships

### For Irregular Items (Class Z):
1. Investigate why demand is irregular
2. Consider reducing stock levels
3. Look for alternative items
4. Evaluate if item is still needed

## 🎨 Visual Indicators

The dashboard now shows:
- **Explanation text**: Describes how ABC and XYZ work
- **Count numbers**: Shows how many items in each class
- **Color coding**: 
  - Blue (A) = High value
  - Purple (B) = Medium value
  - Green (C) = Low value
  - Yellow (X) = Stable
  - Pink (Y) = Moderate
  - Gray (Z) = Irregular

## 📱 Interactive Features

**Click any box** to see:
- List of all items in that class
- Part numbers and descriptions
- Current stock levels
- Reorder points
- Status indicators

## 🚀 As You Add More Items

When you add more items to ERPNext:
- Classifications will automatically update
- Pareto charts will show clearer patterns
- The 80/20 rule will become more visible
- You'll see which items need most attention

**Recommended minimum:** 10-20 items for meaningful analysis

## 📊 Best Practices

1. **Review classifications monthly** - Items can move between classes
2. **Focus on AX items** - High value + stable = most important
3. **Investigate AZ items** - High value + irregular = needs attention
4. **Simplify CZ items** - Low value + irregular = consider removing
5. **Use for procurement planning** - Order A items more frequently
6. **Set different service levels** - A items = 99%, C items = 90%

## 🔍 Troubleshooting

### "All items showing as Class A"
- Normal with 2-3 items
- Add more items for better distribution
- ABC works best with 20+ items

### "All items showing as Class Z"
- Check if reorder points are set correctly
- Verify stock levels are accurate
- Adjust reorder points based on actual consumption

### "Pareto chart is empty"
- Charts need at least 1 item with value > 0
- Check that items have price set
- Verify stock quantities are not zero

---

**Updated:** Dashboard now shows ABC/XYZ explanations and counts
**Server:** Running on http://localhost:3000
**Refresh:** Your dashboard to see the new information
