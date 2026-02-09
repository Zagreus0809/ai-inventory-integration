# 🔧 AI Troubleshooting Guide

## Issue: AI Not Displaying or Running

### Quick Diagnosis Steps

1. **Check if server is running:**
   ```cmd
   cd sap-ai-inventory
   node server.js
   ```
   Server should start on `http://localhost:3000`

2. **Test AI directly:**
   Open in browser: `http://localhost:3000/test-ai.html`
   
   This diagnostic page will:
   - Load materials
   - Test each AI endpoint individually
   - Show detailed error messages
   - Display console logs

3. **Check browser console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for `[AI]` prefixed messages
   - Check for any red error messages

### Common Issues & Solutions

#### Issue 1: "AI Insights" section shows loading forever

**Cause:** Materials not loaded before AI functions are called

**Solution:**
1. Click on "Materials" tab first
2. Wait for materials to load (should see 50 materials)
3. Then click on "AI Insights" tab
4. AI should start analyzing automatically

#### Issue 2: API Key errors

**Cause:** GEMINI_API_KEY not set or invalid

**Check:**
```cmd
cd sap-ai-inventory
type .env
```

Should show:
```
GEMINI_API_KEY=AIzaSyBOJ11KLGuCb6VWQyZZtPX08fLNazxmUHo
```

**Test API Key:**
```cmd
node test-real-ai.js
```

#### Issue 3: Network errors (CORS, fetch failed)

**Cause:** Server not running or wrong port

**Solution:**
1. Stop any running servers (Ctrl+C)
2. Restart server:
   ```cmd
   node server.js
   ```
3. Verify it says: `SAP AI Inventory System running on port 3000`
4. Open: `http://localhost:3000`

#### Issue 4: AI responses not formatting properly

**Cause:** formatAIResponse function issue

**Check:** Look in browser console for JavaScript errors

**Solution:** The updated app.js now has better error handling

### Testing Workflow

1. **Start Server:**
   ```cmd
   cd sap-ai-inventory
   node server.js
   ```

2. **Test AI Backend:**
   ```cmd
   node test-real-ai.js
   ```
   Should show: ✅ Real AI Testing Complete!

3. **Test Frontend:**
   - Open: `http://localhost:3000/test-ai.html`
   - Click "Load Materials" (should load 50 materials)
   - Click each test button one by one
   - Each should complete in 10-30 seconds

4. **Test Main App:**
   - Open: `http://localhost:3000`
   - Click "Materials" tab (wait for load)
   - Click "AI Insights" tab
   - Should see 3 AI analyses running

### Debug Mode

The app.js file now includes console.log statements:
- `[AI] loadAIInsights() called` - When AI section is opened
- `[AI] Materials loaded: 50` - Materials count
- `[AI] Starting Safety Stock Analysis...` - Each AI function
- `[AI] Response status: 200` - API responses
- `[AI] ✅ Safety Stock Analysis SUCCESS!` - Completion

### Expected Behavior

When you click "AI Insights" tab:
1. Page shows "Loading AI safety stock analysis..."
2. After 10-30 seconds: First analysis appears
3. After another 10-30 seconds: Second analysis appears
4. After another 10-30 seconds: Third analysis appears

Total time: 30-90 seconds for all 3 analyses

### Manual Testing

If automatic loading doesn't work:
1. Open "AI Insights" tab
2. Click individual "Refresh" buttons on each card
3. Each analysis runs independently

### Verification Checklist

- [ ] Server running on port 3000
- [ ] Can access http://localhost:3000
- [ ] Materials tab shows 50 materials
- [ ] test-ai.html page works
- [ ] Browser console shows [AI] logs
- [ ] No red errors in console
- [ ] GEMINI_API_KEY in .env file
- [ ] test-real-ai.js shows success

### Still Not Working?

1. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear cached files
   - Reload page (Ctrl+F5)

2. **Check firewall:**
   - Ensure port 3000 is not blocked
   - Try: `http://127.0.0.1:3000`

3. **Restart everything:**
   ```cmd
   # Stop server (Ctrl+C)
   # Close browser
   # Restart server
   node server.js
   # Open fresh browser window
   ```

4. **Check logs:**
   - Look at server console output
   - Look at browser console (F12)
   - Check for specific error messages

### Contact Info

If issue persists, provide:
1. Server console output
2. Browser console errors (F12 → Console tab)
3. Screenshot of the issue
4. Which step in this guide failed
