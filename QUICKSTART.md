# Quick Start Guide - 5 Minutes to Launch! ⚡

## Local Development

### Step 1: Install Dependencies (1 min)
```bash
cd sap-ai-inventory
npm install
```

### Step 2: Get Gemini API Key (2 min)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key

### Step 3: Configure Environment (30 sec)
```bash
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=paste_your_key_here
PORT=3000
```

### Step 4: Start Server (30 sec)
```bash
npm start
```

### Step 5: Open Browser (30 sec)
```
http://localhost:3000
```

**Done! 🎉**

---

## Deploy to Vercel (Even Faster!)

### Option 1: One-Click Deploy
1. Click "Deploy with Vercel" button in README
2. Add `GEMINI_API_KEY` environment variable
3. Deploy!

### Option 2: GitHub + Vercel
```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/sap-ai-inventory.git
git push -u origin main

# Import to Vercel
# Go to vercel.com → New Project → Import from GitHub
# Add GEMINI_API_KEY environment variable
# Deploy!
```

---

## First Steps After Launch

### 1. Explore Dashboard
- View 50 pre-loaded materials
- Check inventory KPIs
- See category distribution

### 2. Try AI Features
- **Demand Forecasting**: Click "Generate Forecast"
- **Stock Optimization**: Click "Optimize Now"
- **Anomaly Detection**: Click "Scan for Anomalies"

### 3. Use AI Chat
- Ask: "How does AI improve inventory accuracy?"
- Ask: "What are the benefits of SAP integration?"
- Ask: "Explain the ABC analysis"

### 4. Browse Materials
- Filter by category
- Search by name or code
- Check low stock items

---

## Troubleshooting

### "Failed to generate forecast"
→ Check your Gemini API key in `.env`

### Port already in use
→ Change `PORT=3001` in `.env`

### Materials not loading
→ Refresh browser, check console

---

## What's Included

✅ 50 materials across 14 categories
✅ SAP-style dashboard with KPIs
✅ Real-time inventory tracking
✅ AI-powered forecasting
✅ Stock optimization
✅ Anomaly detection
✅ AI chat assistant
✅ Analytics & reporting
✅ Transaction management

---

## Next Steps

1. **Customize Materials**: Edit `data/materials.js`
2. **Add Database**: Integrate PostgreSQL/MongoDB
3. **Deploy to Production**: Use Vercel or your preferred host
4. **Add Authentication**: Implement user login
5. **Extend AI Features**: Add more AI capabilities

---

## Need Help?

- 📖 Read full [README.md](README.md)
- 🚀 Check [DEPLOYMENT.md](DEPLOYMENT.md)
- 💬 Open GitHub issue
- 📧 Contact support

---

**Enjoy your SAP AI Inventory System! 🎯**
