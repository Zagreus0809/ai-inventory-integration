# Setting Up Environment Variables on Vercel

## Problem
The app works locally but fails on Vercel with "error loading materials" because environment variables (ERPNext credentials) are not configured on Vercel.

## Solution: Add Environment Variables to Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. **Login to Vercel**
   - Go to: https://vercel.com/dashboard
   - Login with your account

2. **Select Your Project**
   - Find and click on: `ai-inventory-integration`
   - Or go directly to: https://vercel.com/zagreus0809/ai-inventory-integration

3. **Navigate to Settings**
   - Click the "Settings" tab at the top of the page

4. **Add Environment Variables**
   - Click "Environment Variables" in the left sidebar
   - Click "Add New" button

5. **Add Each Variable**

   **Variable 1: ERPNext URL**
   ```
   Name: ERPNEXT_URL
   Value: https://ai-inventory-erp.s.frappe.cloud
   Environments: ✓ Production  ✓ Preview  ✓ Development
   ```
   Click "Save"

   **Variable 2: ERPNext API Key**
   ```
   Name: ERPNEXT_API_KEY
   Value: 0488ba862d2b28d
   Environments: ✓ Production  ✓ Preview  ✓ Development
   ```
   Click "Save"

   **Variable 3: ERPNext API Secret**
   ```
   Name: ERPNEXT_API_SECRET
   Value: 9428001da16378f
   Environments: ✓ Production  ✓ Preview  ✓ Development
   ```
   Click "Save"

   **Variable 4: Gemini API Key**
   ```
   Name: GEMINI_API_KEY
   Value: AIzaSyBOJ11KLGuCb6VWQyZZtPX08fLNazxmUHo
   Environments: ✓ Production  ✓ Preview  ✓ Development
   ```
   Click "Save"

6. **Redeploy Your Application**
   - Go to the "Deployments" tab
   - Find the latest deployment
   - Click the three dots (...) menu
   - Click "Redeploy"
   - Wait for deployment to complete (usually 1-2 minutes)

7. **Verify It Works**
   - Visit your Vercel URL
   - The materials should now load correctly
   - Dashboard should display data from ERPNext

### Method 2: Via Vercel CLI

If you have Vercel CLI installed:

```bash
cd sap-ai-inventory

# Add environment variables
vercel env add ERPNEXT_URL
# Enter: https://ai-inventory-erp.s.frappe.cloud
# Select: Production, Preview, Development

vercel env add ERPNEXT_API_KEY
# Enter: 0488ba862d2b28d
# Select: Production, Preview, Development

vercel env add ERPNEXT_API_SECRET
# Enter: 9428001da16378f
# Select: Production, Preview, Development

vercel env add GEMINI_API_KEY
# Enter: AIzaSyBOJ11KLGuCb6VWQyZZtPX08fLNazxmUHo
# Select: Production, Preview, Development

# Redeploy
vercel --prod
```

### Method 3: Via vercel.json (Not Recommended for Secrets)

DO NOT use this method for API keys and secrets as they will be committed to git!

## Verification Steps

After adding environment variables and redeploying:

1. **Check Deployment Logs**
   - Go to Vercel Dashboard → Deployments
   - Click on the latest deployment
   - Check "Build Logs" for any errors
   - Check "Function Logs" for runtime errors

2. **Test the Application**
   - Visit your Vercel URL
   - Open browser console (F12)
   - Navigate to "Materials Master"
   - Materials should load from ERPNext

3. **Test API Endpoints**
   - Visit: `https://your-app.vercel.app/api/erpnext/test`
   - Should return: `{"success":true,"message":"Connected to ERPNext successfully"}`

## Troubleshooting

### Still Getting Errors?

1. **Check Environment Variables Are Set**
   - Go to Settings → Environment Variables
   - Verify all 4 variables are listed
   - Make sure they're enabled for all environments

2. **Check for Typos**
   - Variable names are case-sensitive
   - Must be exactly: `ERPNEXT_URL`, `ERPNEXT_API_KEY`, `ERPNEXT_API_SECRET`, `GEMINI_API_KEY`

3. **Redeploy Again**
   - Sometimes Vercel needs a fresh deployment
   - Go to Deployments → Click (...) → Redeploy

4. **Check Function Logs**
   - Go to your deployment
   - Click "Functions" tab
   - Look for error messages

### Common Errors

**"Only absolute URLs are supported"**
- Means `ERPNEXT_URL` is not set or empty
- Add the variable and redeploy

**"401 Unauthorized"**
- Means `ERPNEXT_API_KEY` or `ERPNEXT_API_SECRET` is wrong
- Double-check the values in ERPNext
- Update in Vercel and redeploy

**"Cannot find module './services/erpnext'"**
- Make sure you pushed all files to git
- Check that `services/erpnext.js` exists in your repo
- Redeploy from latest git commit

## Security Notes

- Never commit `.env` file to git (it's in `.gitignore`)
- Environment variables on Vercel are encrypted
- Only you can see the values in Vercel dashboard
- API keys are not exposed to the frontend

## Next Steps

After environment variables are configured:
1. Your app should work on Vercel
2. Materials will load from ERPNext in real-time
3. All features (Dashboard, Materials Master, Stock Entry) will work
4. Add prices to items in ERPNext to see Pareto charts

## Quick Reference

Your Vercel project: https://vercel.com/zagreus0809/ai-inventory-integration
Your ERPNext: https://ai-inventory-erp.s.frappe.cloud/desk

Environment Variables Needed:
- `ERPNEXT_URL` = https://ai-inventory-erp.s.frappe.cloud
- `ERPNEXT_API_KEY` = 0488ba862d2b28d
- `ERPNEXT_API_SECRET` = 9428001da16378f
- `GEMINI_API_KEY` = AIzaSyBOJ11KLGuCb6VWQyZZtPX08fLNazxmUHo
