# System Architecture

## Overview

The SAP AI Inventory System now supports dual-mode operation: Mock Data (for testing) and ERPNext Cloud (for production).

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Browser)                       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Materials   │  │ Stock Entry  │  │  Analytics   │      │
│  │  Dashboard   │  │   Forms      │  │   Reports    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│                    public/app.js                             │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js Server                          │
│                     (server.js)                              │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Routes Layer                       │   │
│  │                                                        │   │
│  │  /api/materials      /api/stock-entry                │   │
│  │  /api/analytics      /api/ai                         │   │
│  │  /api/transactions   /api/material-request           │   │
│  └────────────┬─────────────────────────────────────────┘   │
│               │                                              │
│               ▼                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Smart Routing Logic                      │   │
│  │                                                        │   │
│  │  if (useMockData) {                                   │   │
│  │    → Use local data                                   │   │
│  │  } else {                                             │   │
│  │    → Call ERPNext Service                            │   │
│  │  }                                                    │   │
│  └────────────┬─────────────────────────────────────────┘   │
│               │                                              │
│               ▼                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           ERPNext Service Layer                       │   │
│  │         (services/erpnext.js)                        │   │
│  │                                                        │   │
│  │  • Authentication (API Key + Secret)                 │   │
│  │  • Request/Response handling                         │   │
│  │  • Error handling                                    │   │
│  │  • Data transformation                               │   │
│  └────────────┬─────────────────────────────────────────┘   │
└───────────────┼─────────────────────────────────────────────┘
                │ HTTPS
                ▼
┌─────────────────────────────────────────────────────────────┐
│              ERPNext Cloud Instance                          │
│      https://ai-inventory-erp.s.frappe.cloud                │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Items     │  │ Stock Entry  │  │     Bin      │      │
│  │   (DocType)  │  │  (DocType)   │  │  (DocType)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Warehouse   │  │ Stock Ledger │  │   Material   │      │
│  │  (DocType)   │  │    Entry     │  │   Request    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│                    MariaDB Database                          │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Reading Materials (GET /api/materials)

```
User Request
    ↓
Express Route (routes/materials.js)
    ↓
Check: useMockData?
    ├─ YES → Return local data/materials.js
    └─ NO  → ERPNext Service
              ↓
         GET /api/resource/Item
              ↓
         For each item:
           GET /api/resource/Bin (stock levels)
              ↓
         Transform to SAP format
              ↓
         Return to frontend
```

### Creating Stock Entry (POST /api/stock-entry)

```
User Submits Form
    ↓
Express Route (routes/stock-entry.js)
    ↓
Validate data
    ↓
Check: useMockData?
    ├─ YES → Store in memory
    └─ NO  → ERPNext Service
              ↓
         POST /api/resource/Stock Entry
              ↓
         ERPNext creates:
           - Stock Entry document
           - Stock Ledger Entries
           - Updates Bin quantities
              ↓
         Return confirmation
              ↓
         Update frontend
```

## Component Responsibilities

### Frontend (public/app.js)
- User interface rendering
- Form validation
- API calls to backend
- Real-time updates
- AI analysis display

### Backend Routes (routes/*.js)
- Request validation
- Business logic
- Mode detection (mock vs ERPNext)
- Response formatting
- Error handling

### ERPNext Service (services/erpnext.js)
- API authentication
- HTTP request management
- Data transformation (ERPNext ↔ SAP format)
- Connection testing
- Error handling

### ERPNext Cloud
- Data persistence
- Stock calculations
- Transaction management
- User permissions
- Audit trail

## Configuration

### Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# AI Features
GEMINI_API_KEY=your_key

# ERPNext Integration
ERPNEXT_URL=https://ai-inventory-erp.s.frappe.cloud
ERPNEXT_API_KEY=your_api_key
ERPNEXT_API_SECRET=your_api_secret
```

## Security

### Authentication Flow

```
Client Request
    ↓
Express Server
    ↓
ERPNext Service adds header:
  Authorization: token API_KEY:API_SECRET
    ↓
ERPNext validates credentials
    ↓
Returns data or 401/403
```

### Security Features
- ✅ HTTPS only communication
- ✅ API credentials in environment variables
- ✅ No credentials in code
- ✅ Token-based authentication
- ✅ ERPNext permission system
- ✅ Request validation

## Scalability

### Current Setup
- Single server instance
- Direct API calls to ERPNext
- In-memory caching for mock mode

### Future Enhancements
- Redis caching for ERPNext data
- Queue system for bulk operations
- Webhook integration for real-time updates
- Load balancing for multiple instances

## Error Handling

```
Try {
  Call ERPNext API
}
Catch (error) {
  Log error details
  ↓
  Return user-friendly message
  ↓
  Fallback to mock data (optional)
}
```

## Monitoring

### Health Checks
- `GET /api/health` - Server status
- `GET /api/erpnext/test` - ERPNext connection

### Logging
- Console logs for debugging
- Error tracking
- API call timing
- Connection status

## Deployment Options

### Local Development
```
npm install
npm start
→ http://localhost:3000
```

### Vercel (Serverless)
```
vercel deploy
→ https://your-app.vercel.app
```

### Docker (Future)
```
docker build -t sap-inventory .
docker run -p 3000:3000 sap-inventory
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Backend | Node.js, Express.js |
| API Client | node-fetch |
| AI | Google Gemini API |
| Database | ERPNext Cloud (MariaDB) |
| Deployment | Vercel (Serverless) |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/materials | GET | List all materials |
| /api/materials/:id | GET | Get material details |
| /api/stock-entry | POST | Create stock entry |
| /api/stock-entry | GET | List stock entries |
| /api/stock-entry/ledger | GET | Stock movements |
| /api/ai/analyze | POST | AI analysis |
| /api/erpnext/test | GET | Test connection |

## Data Mapping

### Item (ERPNext) → Material (SAP)

| ERPNext Field | SAP Field | Type |
|---------------|-----------|------|
| name | id | String |
| item_code | partNumber | String |
| item_name | description | String |
| item_group | grouping | String |
| default_warehouse | storageLocation | String |
| actual_qty (Bin) | stock | Number |
| min_order_qty | reorderPoint | Number |
| stock_uom | unit | String |
| standard_rate | price | Number |
