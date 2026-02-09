// Demo System - Interactive Walkthrough
let demoStep = 0;
let demoInterval = null;

const demoSteps = [
    {
        title: "Welcome to AI Inventory Integration (ERPNext)",
        content: `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-robot" style="font-size: 64px; color: #667eea; margin-bottom: 20px;"></i>
                <h2 style="color: #333; margin-bottom: 15px;">AI-Powered Inventory Management System</h2>
                <p style="font-size: 1.1em; color: #666; line-height: 1.8; max-width: 600px; margin: 0 auto;">
                    This interactive demo showcases how AI transforms traditional inventory management 
                    by analyzing <strong>50 real materials</strong> across multiple projects.
                </p>
                <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                    <h4 style="color: #667eea; margin-bottom: 15px;">Demo Features:</h4>
                    <div style="text-align: left; display: inline-block;">
                        <p><i class="fas fa-check-circle" style="color: #4caf50;"></i> 50 materials across Nivio, Migne, Common projects</p>
                        <p><i class="fas fa-check-circle" style="color: #4caf50;"></i> AI analyzing specific part numbers (G02277700, PCB-S18, etc.)</p>
                        <p><i class="fas fa-check-circle" style="color: #4caf50;"></i> Automatic low stock detection & analysis</p>
                        <p><i class="fas fa-check-circle" style="color: #4caf50;"></i> Individual material AI recommendations</p>
                        <p><i class="fas fa-check-circle" style="color: #4caf50;"></i> Real-time inventory insights with exact costs</p>
                    </div>
                </div>
            </div>
        `,
        action: null
    },
    {
        title: "Step 1: Dashboard Overview",
        content: `
            <div style="padding: 20px;">
                <h3 style="color: #667eea; margin-bottom: 15px;"><i class="fas fa-th-large"></i> Dashboard - 50 Materials Overview</h3>
                <p style="font-size: 1.05em; color: #555; line-height: 1.8; margin-bottom: 20px;">
                    Look at the dashboard now showing <strong>real-time data</strong> for all 50 materials:
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                        <strong>Projects:</strong><br>
                        • Nivio<br>
                        • Migne (Horizontal/Vertical)<br>
                        • Common Direct
                    </div>
                    <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #9c27b0;">
                        <strong>Categories:</strong><br>
                        • PCB, Cu wire, Resin<br>
                        • Bobbin, Cable, Case<br>
                        • Ferrite, Pin header, etc.
                    </div>
                </div>
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <strong>📊 KPI Cards show:</strong><br>
                    • Total Materials: 50 items<br>
                    • Low Stock Items: Automatically detected<br>
                    • Charts: Stock levels by category<br>
                    • AI Insights: Loading automatically
                </div>
            </div>
        `,
        action: () => { showSection('dashboard'); setTimeout(() => loadDashboard(), 500); }
    },
    {
        title: "Step 2: AI Dashboard Analysis",
        content: `
            <div style="padding: 20px;">
                <h3 style="color: #667eea; margin-bottom: 15px;"><i class="fas fa-robot"></i> AI Analyzing All 50 Materials</h3>
                <p style="font-size: 1.05em; color: #555; line-height: 1.8; margin-bottom: 20px;">
                    The AI automatically analyzes the entire inventory and provides:
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 15px;">AI Analysis Includes:</h4>
                    <p><strong>✓ Specific Part Numbers:</strong> G02277700, PCB-S18, XNM-AU-00224, etc.</p>
                    <p><strong>✓ Exact Quantities:</strong> 2210 M, 450 PC, 45 KG (with units)</p>
                    <p><strong>✓ Real Costs:</strong> ₱352.80, ₱1,875.00 (calculated from actual prices)</p>
                    <p><strong>✓ Project Context:</strong> Which project uses each material</p>
                    <p><strong>✓ Urgency Levels:</strong> TODAY, THIS WEEK, NEXT WEEK</p>
                    <p><strong>✓ Action Items:</strong> Specific purchase orders with exact quantities</p>
                </div>
                <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
                    <strong>💡 Click "View Full AI Analysis"</strong> button in the AI Insights card to see comprehensive analysis!
                </div>
            </div>
        `,
        action: () => { showSection('dashboard'); }
    },
    {
        title: "Step 3: Automatic Low Stock Detection",
        content: `
            <div style="padding: 20px;">
                <h3 style="color: #f44336; margin-bottom: 15px;"><i class="fas fa-exclamation-triangle"></i> Low Stock AI Analysis</h3>
                <p style="font-size: 1.05em; color: #555; line-height: 1.8; margin-bottom: 20px;">
                    When materials reach low stock levels, AI <strong>automatically analyzes</strong> them:
                </p>
                <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f44336;">
                    <h4 style="color: #f44336; margin-bottom: 15px;">Automatic Analysis:</h4>
                    <p><strong>1. Detection:</strong> System identifies materials at/below reorder point</p>
                    <p><strong>2. AI Analysis:</strong> Analyzes each low stock material automatically</p>
                    <p><strong>3. Notification:</strong> Shows "X items analyzed - View Details" link</p>
                    <p><strong>4. Recommendations:</strong> Provides specific order quantities and costs</p>
                </div>
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <strong>📋 AI provides for each low stock item:</strong><br>
                    • Part number (e.g., XNM-AU-01940)<br>
                    • Current stock vs reorder point<br>
                    • Exact order quantity needed<br>
                    • Order cost calculation<br>
                    • Urgency level (TODAY/THIS WEEK)<br>
                    • Project impact assessment
                </div>
            </div>
        `,
        action: () => { showSection('dashboard'); }
    },
    {
        title: "Step 4: Materials Master - 50 Items",
        content: `
            <div style="padding: 20px;">
                <h3 style="color: #667eea; margin-bottom: 15px;"><i class="fas fa-boxes"></i> Materials Master Data</h3>
                <p style="font-size: 1.05em; color: #555; line-height: 1.8; margin-bottom: 20px;">
                    View all <strong>50 materials</strong> with complete details:
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 15px;">Each Material Shows:</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <p>• Part Number (G02277700)</p>
                        <p>• Description</p>
                        <p>• Project (Nivio/Migne/Common)</p>
                        <p>• Category (PCB/Cu wire/etc.)</p>
                        <p>• Current Stock (2210 M)</p>
                        <p>• Reorder Point (500 M)</p>
                        <p>• Status (NORMAL/LOW/CRITICAL)</p>
                        <p>• Storage Location</p>
                    </div>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                    <strong>🤖 AI Analyze Button:</strong> Each material has an "Analyze" button for individual AI analysis!
                </div>
            </div>
        `,
        action: () => { showSection('materials'); setTimeout(() => loadMaterials(), 500); }
    },
    {
        title: "Step 5: Individual Material AI Analysis",
        content: `
            <div style="padding: 20px;">
                <h3 style="color: #667eea; margin-bottom: 15px;"><i class="fas fa-search"></i> AI Analysis Per Material</h3>
                <p style="font-size: 1.05em; color: #555; line-height: 1.8; margin-bottom: 20px;">
                    Click <strong>"Analyze"</strong> button on any material to get detailed AI insights:
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 15px;">7-Section Comprehensive Analysis:</h4>
                    <p><strong>1. Status Assessment:</strong> Current health, days of coverage, risk level</p>
                    <p><strong>2. Recommendations:</strong> Should reorder? Exact quantity? When?</p>
                    <p><strong>3. Usage Analysis:</strong> Consumption rate, project context</p>
                    <p><strong>4. Financial Impact:</strong> Current value, order cost, stockout cost</p>
                    <p><strong>5. Risks & Mitigation:</strong> What could go wrong? Contingency plans</p>
                    <p><strong>6. Optimization:</strong> Reorder point adjustments, storage efficiency</p>
                    <p><strong>7. Action Items:</strong> Specific tasks for today, this week, this month</p>
                </div>
                <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
                    <strong>💡 Try it:</strong> Go to Materials Master and click "Analyze" on any material!
                </div>
            </div>
        `,
        action: () => { showSection('materials'); }
    },
    {
        title: "Step 6: Stock Entry (ERPNext Feature)",
        content: `
            <div style="padding: 20px;">
                <h3 style="color: #667eea; margin-bottom: 15px;"><i class="fas fa-exchange-alt"></i> Stock Entry Management</h3>
                <p style="font-size: 1.05em; color: #555; line-height: 1.8; margin-bottom: 20px;">
                    ERPNext-style stock entry for tracking material movements:
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 15px;">Entry Types:</h4>
                    <p><strong>• Material Receipt:</strong> Stock IN from suppliers</p>
                    <p><strong>• Material Issue:</strong> Stock OUT for production</p>
                    <p><strong>• Material Transfer:</strong> Warehouse to warehouse</p>
                    <p><strong>• Material Consumption:</strong> Production use</p>
                </div>
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <strong>📝 Each entry tracks:</strong> Date, quantity, warehouse, cost, status
                </div>
            </div>
        `,
        action: () => { showSection('stock-entry'); setTimeout(() => loadStockEntries(), 500); }
    },
    {
        title: "Step 7: Material Request",
        content: `
            <div style="padding: 20px;">
                <h3 style="color: #667eea; margin-bottom: 15px;"><i class="fas fa-clipboard-list"></i> Material Request System</h3>
                <p style="font-size: 1.05em; color: #555; line-height: 1.8; margin-bottom: 20px;">
                    Create and manage material requests for purchasing:
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 15px;">Features:</h4>
                    <p><strong>• Manual Requests:</strong> Create requests for specific materials</p>
                    <p><strong>• Auto-Generate:</strong> Automatically create requests for low stock items</p>
                    <p><strong>• Approval Workflow:</strong> Pending → Approved → Ordered</p>
                    <p><strong>• Request Types:</strong> Purchase, Transfer, Issue, Manufacture</p>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                    <strong>🤖 AI Integration:</strong> Use AI analysis to determine what to request!
                </div>
            </div>
        `,
        action: () => { showSection('material-request'); setTimeout(() => loadMaterialRequests(), 500); }
    },
    {
        title: "Step 8: Stock Ledger",
        content: `
            <div style="padding: 20px;">
                <h3 style="color: #667eea; margin-bottom: 15px;"><i class="fas fa-book"></i> Stock Ledger - Complete History</h3>
                <p style="font-size: 1.05em; color: #555; line-height: 1.8; margin-bottom: 20px;">
                    Track every stock movement with complete audit trail:
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 15px;">Ledger Tracks:</h4>
                    <p><strong>• Date & Time:</strong> When movement occurred</p>
                    <p><strong>• Voucher Number:</strong> Reference to stock entry</p>
                    <p><strong>• Part Number:</strong> Which material moved</p>
                    <p><strong>• Quantity Change:</strong> +/- amount</p>
                    <p><strong>• Running Balance:</strong> Current stock after movement</p>
                    <p><strong>• Warehouse:</strong> Location of movement</p>
                    <p><strong>• Entry Type:</strong> IN or OUT</p>
                </div>
                <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
                    <strong>📊 Statistics:</strong> Total IN, Total OUT, Total Transactions
                </div>
            </div>
        `,
        action: () => { showSection('stock-ledger'); setTimeout(() => loadStockLedger(), 500); }
    },
    {
        title: "Demo Complete!",
        content: `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-check-circle" style="font-size: 64px; color: #4caf50; margin-bottom: 20px;"></i>
                <h2 style="color: #333; margin-bottom: 15px;">You've Seen All Features!</h2>
                <p style="font-size: 1.1em; color: #666; line-height: 1.8; max-width: 600px; margin: 0 auto 30px;">
                    This system demonstrates how AI transforms inventory management with:
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #667eea; margin-bottom: 15px;">Key Benefits:</h4>
                    <div style="text-align: left; display: inline-block;">
                        <p><strong>✓ Specific Analysis:</strong> AI uses exact part numbers, not generic advice</p>
                        <p><strong>✓ Real Costs:</strong> All recommendations include actual cost calculations</p>
                        <p><strong>✓ Automatic Detection:</strong> Low stock items analyzed automatically</p>
                        <p><strong>✓ Actionable Insights:</strong> Specific purchase orders with quantities</p>
                        <p><strong>✓ Complete Tracking:</strong> ERPNext-style stock management</p>
                        <p><strong>✓ 50 Real Materials:</strong> Actual data from Nivio, Migne, Common projects</p>
                    </div>
                </div>
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px;">
                    <h4 style="color: #2196f3; margin-bottom: 10px;">Ready to Explore?</h4>
                    <p style="color: #666;">Navigate through the system and try the AI features yourself!</p>
                </div>
            </div>
        `,
        action: () => showSection('dashboard')
    }
];

function startDemo() {
    demoStep = 0;
    showDemoStep();
}

function showDemoStep() {
    const modal = document.getElementById('demoModal');
    const body = document.getElementById('demoModalBody');
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    const step = demoSteps[demoStep];
    
    body.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; margin: -30px -30px 20px -30px;">
                <h3 style="margin: 0; color: white;">${step.title}</h3>
                <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 0.9em;">Step ${demoStep + 1} of ${demoSteps.length}</p>
            </div>
            ${step.content}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 2px solid #e0e0e0;">
            <button onclick="prevDemoStep()" class="btn btn-secondary" ${demoStep === 0 ? 'disabled' : ''}>
                <i class="fas fa-arrow-left"></i> Previous
            </button>
            <div style="color: #666;">
                <i class="fas fa-circle" style="font-size: 8px; margin: 0 5px;"></i>
                Step ${demoStep + 1} / ${demoSteps.length}
            </div>
            <button onclick="nextDemoStep()" class="btn btn-primary" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none;">
                ${demoStep === demoSteps.length - 1 ? 'Finish' : 'Next'} <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `;
    
    if (step.action) {
        step.action();
    }
}

function nextDemoStep() {
    if (demoStep < demoSteps.length - 1) {
        demoStep++;
        showDemoStep();
    } else {
        closeDemoModal();
    }
}

function prevDemoStep() {
    if (demoStep > 0) {
        demoStep--;
        showDemoStep();
    }
}

function closeDemoModal() {
    const modal = document.getElementById('demoModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    demoStep = 0;
}
