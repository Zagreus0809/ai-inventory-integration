# Deployment Guide

## 🚀 Deploy to Vercel (Recommended)

### Method 1: One-Click Deploy

1. Click the "Deploy with Vercel" button in README
2. Connect your GitHub account
3. Configure environment variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key
4. Click "Deploy"
5. Done! Your app is live

### Method 2: Vercel CLI

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
cd sap-ai-inventory
vercel
```

4. **Add Environment Variables**
```bash
vercel env add GEMINI_API_KEY
```
Enter your Gemini API key when prompted

5. **Deploy to Production**
```bash
vercel --prod
```

### Method 3: GitHub Integration

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/sap-ai-inventory.git
git push -u origin main
```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables:
     - Name: `GEMINI_API_KEY`
     - Value: Your Gemini API key
   - Click "Deploy"

3. **Automatic Deployments**
   - Every push to `main` branch auto-deploys
   - Preview deployments for pull requests

## 🔑 Getting Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key
5. Add to Vercel environment variables

## 📋 Environment Variables

Required variables for Vercel:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Optional variables:
```env
NODE_ENV=production
```

## ✅ Post-Deployment Checklist

- [ ] Verify app loads at Vercel URL
- [ ] Test dashboard displays correctly
- [ ] Check materials load (50 items)
- [ ] Test AI Forecast feature
- [ ] Test AI Optimization feature
- [ ] Test AI Anomaly Detection
- [ ] Test AI Chat Assistant
- [ ] Verify charts render properly
- [ ] Test on mobile devices
- [ ] Check browser console for errors

## 🔧 Troubleshooting

### Issue: "Failed to generate forecast"
**Solution**: Check Gemini API key is correctly set in Vercel environment variables

### Issue: "Module not found"
**Solution**: Ensure all dependencies are in `package.json` and run `npm install`

### Issue: "Cannot GET /"
**Solution**: Verify `vercel.json` routes are configured correctly

### Issue: Charts not displaying
**Solution**: Check Chart.js CDN is accessible and browser console for errors

### Issue: API calls failing
**Solution**: 
- Check Vercel function logs
- Verify API routes are correct
- Ensure CORS is configured

## 📊 Monitoring

### Vercel Dashboard
- View deployment logs
- Monitor function execution
- Check error rates
- View analytics

### Performance
- Use Vercel Analytics
- Monitor API response times
- Check function duration
- Review bandwidth usage

## 🔄 Updates

### Deploy Updates
```bash
git add .
git commit -m "Update description"
git push origin main
```

Vercel automatically deploys changes from GitHub.

### Rollback
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Deployments"
4. Find previous deployment
5. Click "Promote to Production"

## 🌐 Custom Domain

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Settings" → "Domains"
4. Add your custom domain
5. Configure DNS records as shown
6. Wait for SSL certificate (automatic)

## 📱 Mobile Optimization

The app is responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones

Test on multiple devices after deployment.

## 🔐 Security

### Best Practices
- Never commit `.env` file
- Use environment variables for secrets
- Enable HTTPS (automatic on Vercel)
- Keep dependencies updated
- Monitor for security alerts

### Rate Limiting
Consider adding rate limiting for production:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 💰 Cost Considerations

### Vercel
- Free tier: Generous limits for hobby projects
- Pro tier: $20/month for production apps

### Gemini API
- Free tier: 60 requests per minute
- Check [pricing](https://ai.google.dev/pricing) for details

## 📈 Scaling

### Current Capacity
- 50 materials (demo)
- Unlimited transactions
- In-memory storage

### Production Scaling
1. Add database (PostgreSQL/MongoDB)
2. Implement caching (Redis)
3. Use CDN for static assets
4. Optimize API queries
5. Add load balancing

## 🎯 Success Metrics

Monitor these after deployment:
- Page load time < 2s
- API response time < 500ms
- AI response time < 10s
- Uptime > 99.9%
- Error rate < 0.1%

## 📞 Support

If you encounter issues:
1. Check Vercel function logs
2. Review browser console
3. Test API endpoints directly
4. Check GitHub issues
5. Contact support

---

**Your SAP AI Inventory System is ready for the world! 🚀**
