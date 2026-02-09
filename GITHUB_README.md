# 🤖 SAP AI Inventory Management System

An intelligent inventory management system powered by Google's Gemini AI, designed for electronics manufacturing with SAP-style features and ERPNext-inspired workflows.

## 🌟 Features

### 📊 Dashboard
- **Real-time KPIs**: Total materials, low stock alerts, turnover rates
- **AI-Powered Insights**: Automatic inventory analysis using Gemini AI
- **Visual Charts**: Doughnut and bar charts for inventory distribution
- **Materials Overview**: Comprehensive table with health status indicators
- **Recent Transactions**: Track all inventory movements

### 🤖 AI Integration
- **Automatic Analysis**: AI analyzes all 50 materials on page load
- **Comprehensive Insights**: Risk assessment, optimization recommendations
- **Efficiency Metrics**: Compare manual vs AI-powered tracking
- **Beautiful Formatting**: Color-coded results with tables and status indicators

### 📦 Materials Management
- **50 Pre-loaded Materials**: PCB, Cu wire, Resin, Bobbin, Cable, Case, Ferrite, etc.
- **Advanced Filtering**: By category, search, low stock status
- **Add New Materials**: Easy material creation form
- **Stock Tracking**: Real-time stock levels and reorder points

### 📝 ERPNext-Style Features
- **Stock Entry**: Material Receipt, Issue, Transfer, Consumption
- **Material Request**: Create, approve, auto-generate for low stock
- **Stock Ledger**: Complete transaction history with running balance
- **Warehouse Management**: Multi-warehouse support

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ installed
- Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Zagreus0809/ai-inventory-integration.git
   cd ai-inventory-integration
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy .env.example to .env
   copy .env.example .env
   
   # Edit .env and add your Gemini API key
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the server**
   ```bash
   node server.js
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📸 Screenshots

### Dashboard
- KPI cards showing total materials, value, low stock alerts
- AI-powered insights with beautiful formatting
- Charts showing inventory distribution and trends
- Materials overview table with health status

### AI Analysis
- Automatic analysis on page load
- Comprehensive inventory insights
- Risk assessment matrix
- Optimization recommendations
- Efficiency metrics

### Materials Management
- View all 50 materials
- Filter by category
- Search functionality
- Add new materials

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI**: Google Gemini 2.5 Flash
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
sap-ai-inventory/
├── data/
│   └── materials.js          # 50 pre-loaded materials
├── public/
│   ├── index.html           # Main UI
│   ├── app.js               # Frontend logic
│   └── styles.css           # Styling
├── routes/
│   ├── ai.js                # AI analysis endpoints
│   ├── analytics.js         # Dashboard analytics
│   ├── materials.js         # Materials CRUD
│   ├── stock-entry.js       # Stock movements
│   ├── material-request.js  # Purchase requests
│   └── transactions.js      # Transaction history
├── server.js                # Express server
├── vercel.json              # Vercel configuration
└── package.json             # Dependencies
```

## 🔧 Configuration

### Environment Variables
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
```

### Vercel Deployment
1. Push to GitHub
2. Import to Vercel
3. Add `GEMINI_API_KEY` environment variable
4. Deploy!

See [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📊 Data

### Materials (50 items)
- **PCB**: 8 items
- **Cu wire**: 6 items
- **Resin**: 4 items
- **Bobbin**: 4 items
- **Cable wire**: 4 items
- **Sensor Case**: 4 items
- **Case**: 4 items
- **Ferrite**: 4 items
- **Pin header**: 4 items
- **Soldering**: 4 items
- **Supplies**: 4 items

Each material includes:
- Part number
- Description
- Project (Nivio, Migne, Common Direct)
- Stock quantity
- Reorder point
- Unit of measure
- Storage location
- Price

## 🤖 AI Features

### Dashboard Analysis
- Analyzes all 50 materials automatically
- Provides comprehensive insights
- Takes 10-30 seconds
- Beautifully formatted results

### Analysis Includes:
- Executive summary
- AI-powered insights
- Efficiency metrics
- Risk assessment matrix
- Top priority actions
- Inventory optimization recommendations
- Demand forecasting
- System performance indicators
- 7-day action plan
- Cost impact analysis

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [FEATURES.md](FEATURES.md) - Detailed features
- [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) - Deployment guide
- [AI_TROUBLESHOOTING.md](AI_TROUBLESHOOTING.md) - AI debugging
- [THESIS_GUIDE.md](THESIS_GUIDE.md) - Research documentation

## 🧪 Testing

### Test AI Functionality
```bash
# Test real AI
node test-real-ai.js

# Test dashboard AI
node test-dashboard-ai.js

# List available models
node list-models.js
```

### Test API Endpoints
```bash
# Test all endpoints
node test-api.js

# Test ERPNext features
node test-erpnext-features.js
```

## 🎯 Use Cases

### Manufacturing
- Track raw materials for electronics production
- Monitor stock levels across multiple projects
- Automate reorder point alerts
- Optimize inventory carrying costs

### Warehouse Management
- Multi-location stock tracking
- Stock entry and transfer workflows
- Material request and approval process
- Complete audit trail via stock ledger

### Research & Thesis
- Demonstrate AI integration in inventory management
- Measure efficiency improvements
- Compare manual vs automated tracking
- Document ROI and cost savings

## 🔐 Security

- Environment variables for sensitive data
- API key not committed to repository
- CORS enabled for API security
- Input validation on all endpoints

## 📈 Performance

- Fast page load (<2 seconds)
- AI analysis (10-30 seconds)
- Real-time updates
- Responsive design
- Optimized for Vercel serverless

## 🤝 Contributing

This is a thesis/research project. Feel free to fork and adapt for your needs.

## 📄 License

MIT License - See LICENSE file for details

## 👤 Author

**Lans Jeffrey Galos**
- GitHub: [@Zagreus0809](https://github.com/Zagreus0809)
- Project: AI-Powered Inventory Management System

## 🙏 Acknowledgments

- Google Gemini AI for intelligent analysis
- Chart.js for beautiful visualizations
- Font Awesome for icons
- Vercel for hosting platform

## 📞 Support

For issues or questions:
1. Check [AI_TROUBLESHOOTING.md](AI_TROUBLESHOOTING.md)
2. Review [QUICKSTART.md](QUICKSTART.md)
3. Open an issue on GitHub

## 🚀 Live Demo

Coming soon on Vercel!

---

**Built with ❤️ for efficient inventory management**
