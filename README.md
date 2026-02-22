# SAP AI Inventory System

SAP-style inventory management with Gemini AI integration and ERPNext Cloud connectivity.

## Features

- 📊 Real-time inventory tracking
- 🤖 AI-powered analysis with Google Gemini
- 🔗 ERPNext Cloud integration (optional)
- 📦 Stock entry management (Receipt, Issue, Transfer)
- 📈 Analytics and reporting
- 🎯 Low stock alerts

## ERPNext Integration

This system can connect to ERPNext Cloud as its database. See [ERPNEXT_SETUP.md](./ERPNEXT_SETUP.md) for detailed setup instructions.

**Quick Setup:**
1. Generate API credentials in ERPNext (User Menu → My Settings → API Access)
2. Add credentials to `.env` file
3. Run `node test-erpnext-connection.js` to verify
4. Start the server - it will automatically use ERPNext data

**Fallback Mode:** If ERPNext is not configured, the system uses mock data for testing.

## Local development

```bash
npm install
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key
# Optionally add ERPNext credentials (see ERPNEXT_SETUP.md)
npm start
```

Open http://localhost:3000

## Deploy on Vercel (GitHub → auto deploy)

1. Push this project to a GitHub repo (e.g. `sap-ai-inventory` or as a folder in a monorepo).
2. In [Vercel](https://vercel.com), **Add New Project** → Import the repo.
3. Set **Root Directory** to this folder if the repo contains multiple projects (e.g. `sap-ai-inventory`).
4. **Environment Variables** (Settings → Environment Variables):
   - `GEMINI_API_KEY` = your Gemini API key (required for AI analysis)
   - `ERPNEXT_URL` = your ERPNext instance URL (optional)
   - `ERPNEXT_API_KEY` = your ERPNext API key (optional)
   - `ERPNEXT_API_SECRET` = your ERPNext API secret (optional)
5. Deploy. Vercel will use `vercel.json`, build the serverless function from `api/index.js`, and serve the app.

The app uses `window.location.origin` for API calls, so it works on your Vercel URL without changes. Demo mode and all API routes run on the serverless function.