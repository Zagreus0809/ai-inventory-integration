# SAP AI Inventory System

SAP-style inventory management with Gemini AI integration.

## Local development

```bash
npm install
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key
npm start
```

Open http://localhost:3000

## Deploy on Vercel (GitHub → auto deploy)

1. Push this project to a GitHub repo (e.g. `sap-ai-inventory` or as a folder in a monorepo).
2. In [Vercel](https://vercel.com), **Add New Project** → Import the repo.
3. Set **Root Directory** to this folder if the repo contains multiple projects (e.g. `sap-ai-inventory`).
4. **Environment Variables** (Settings → Environment Variables):
   - `GEMINI_API_KEY` = your Gemini API key (required for AI analysis)
5. Deploy. Vercel will use `vercel.json`, build the serverless function from `api/index.js`, and serve the app.

The app uses `window.location.origin` for API calls, so it works on your Vercel URL without changes. Demo mode and all API routes run on the serverless function.