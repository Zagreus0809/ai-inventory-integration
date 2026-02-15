// Demo Mode - Real demo that affects ALL system functions (dashboard, materials, stock entry, material request, ledger)
let demoRunning = false;

function toggleDemo() {
    if (window.demoMode) {
        stopDemo();
    } else {
        startDemo();
    }
}

function startDemo() {
    if (demoRunning) {
        alert('Demo is already starting. Please wait.');
        return;
    }
    if (!confirm('Start AI Demo? Demo mode will run the system with simulated data — dashboard, materials, stock entries, material requests, and stock ledger will all show demo data. You can stop demo anytime.')) {
        return;
    }
    demoRunning = true;
    const demoBtn = document.getElementById('aiDemoBtn');
    const demoBtnText = document.getElementById('aiDemoBtnText');
    if (demoBtn) {
        demoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span id="aiDemoBtnText">Starting...</span>';
        demoBtn.onclick = null;
        demoBtn.setAttribute('onclick', 'toggleDemo()');
    }
    try {
        console.log('[Demo] Starting real demo mode...');
        const baseMats = (typeof materials !== 'undefined' && materials.length) ? materials.map(m => ({ ...m })) : null;
        if (baseMats && baseMats.length) {
            runDemoWithMaterials(baseMats);
        } else {
            fetch(window.location.origin + '/api/materials').then(r => r.json()).then(mats => {
                runDemoWithMaterials(mats && mats.length ? mats : []);
            }).catch(() => {
                demoRunning = false;
                if (demoBtn) demoBtn.innerHTML = '<i class="fas fa-play-circle"></i> <span id="aiDemoBtnText">AI Demo</span>';
                alert('Could not load materials. Try refreshing the page first.');
            });
        }
    } catch (e) {
        console.error('[Demo] Error:', e);
        demoRunning = false;
        if (demoBtn) demoBtn.innerHTML = '<i class="fas fa-play-circle"></i> <span id="aiDemoBtnText">AI Demo</span>';
    }
}

function runDemoWithMaterials(baseMats) {
    const mats = (baseMats && baseMats.length) ? baseMats.map(m => ({ ...m })) : [];
    const total = mats.length;
    for (let i = 0; i < total; i++) {
        const m = mats[i];
        const rp = m.reorderPoint || 1;
        const r = Math.random();
        if (r < 0.2) {
            m.stock = Math.floor(rp * (0.3 + Math.random() * 0.4));
        } else if (r < 0.45) {
            m.stock = Math.floor(rp * (1.0 + Math.random() * 0.5));
        } else if (r < 0.65) {
            m.stock = Math.floor(rp * (3 + Math.random() * 2.5));
        } else {
            m.stock = Math.floor(rp * (1.5 + Math.random() * 1.0));
        }
        if (m.stock < 0) m.stock = 0;
    }
    const demoMaterials = mats;
    const dashboard = buildDashboardFromMaterials(demoMaterials);
    const stockEntries = generateDemoStockEntriesForDemo(demoMaterials);
    const materialRequests = generateDemoMaterialRequestsForDemo(demoMaterials);
    const stockLedger = generateDemoStockLedgerForDemo(demoMaterials);
    window.demoMode = true;
    window.demoData = {
        materials: demoMaterials,
        dashboard,
        stockEntries,
        materialRequests,
        stockLedger
    };
    demoRunning = false;
    document.getElementById('demoModeBanner').style.display = 'flex';
    document.body.classList.add('demo-mode-active');
    const demoBtn = document.getElementById('aiDemoBtn');
    const demoBtnText = document.getElementById('aiDemoBtnText');
    if (demoBtn) {
        demoBtn.innerHTML = '<i class="fas fa-stop"></i> <span id="aiDemoBtnText">Stop Demo</span>';
        demoBtn.setAttribute('onclick', 'toggleDemo()');
    }
    materials = demoMaterials;
    loadDashboard();
    loadMaterials();
    loadStockEntries();
    loadMaterialRequests();
    loadStockLedger();
    console.log('[Demo] Demo mode is running. All functions use demo data.');
}

function buildDashboardFromMaterials(mats) {
    const totalMaterials = mats.length;
    const totalValue = mats.reduce((sum, m) => sum + (m.stock * (m.price || 0)), 0);
    const criticalStock = mats.filter(m => m.stock <= m.reorderPoint);
    const lowStock = mats.filter(m => m.stock > m.reorderPoint && m.stock <= m.reorderPoint * 1.5);
    const overStock = mats.filter(m => m.stock > m.reorderPoint * 3);
    const safetyStock = mats.filter(m => m.stock > m.reorderPoint * 1.5 && m.stock <= m.reorderPoint * 3);
    const groupings = [...new Set(mats.map(m => m.grouping))];
    const groupingBreakdown = groupings.map(grp => {
        const groupMaterials = mats.filter(m => m.grouping === grp);
        return {
            grouping: grp,
            count: groupMaterials.length,
            totalStock: groupMaterials.reduce((sum, m) => sum + m.stock, 0),
            lowStock: groupMaterials.filter(m => m.stock <= m.reorderPoint).length,
            value: groupMaterials.reduce((sum, m) => sum + (m.stock * (m.price || 0)), 0)
        };
    });
    const materialsWithValue = mats.map(m => ({ ...m, totalValue: m.stock * (m.price || 0) })).sort((a, b) => b.totalValue - a.totalValue);
    const totalVal = materialsWithValue.reduce((sum, m) => sum + m.totalValue, 0);
    let cumulative = 0;
    const abcMap = {};
    materialsWithValue.forEach(m => {
        cumulative += m.totalValue;
        const pct = totalVal ? (cumulative / totalVal) * 100 : 0;
        abcMap[m.id] = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
    });
    const turnoverData = mats.map(m => {
        const ratio = m.reorderPoint > 0 ? m.stock / m.reorderPoint : 0;
        let xyz = 'Z';
        if (ratio >= 2 && ratio <= 4) xyz = 'X';
        else if (ratio > 1 && ratio < 2) xyz = 'Y';
        return { ...m, abc: abcMap[m.id] || 'C', xyz, turnover: ratio };
    });
    const byClass = { A: { fast: 0, slow: 0, non: 0 }, B: { fast: 0, slow: 0, non: 0 }, C: { fast: 0, slow: 0, non: 0 } };
    turnoverData.forEach(m => {
        const key = m.turnover >= 2 && m.turnover <= 4 ? 'fast' : m.turnover > 1 && m.turnover < 2 ? 'slow' : 'non';
        byClass[m.abc][key]++;
    });
    return {
        totalMaterials,
        totalValue: totalValue.toFixed(2),
        lowStockItems: criticalStock.length,
        stockMetrics: {
            criticalStock: { count: criticalStock.length, pct: totalMaterials ? ((criticalStock.length / totalMaterials) * 100).toFixed(1) : 0 },
            lowStock: { count: lowStock.length, pct: totalMaterials ? ((lowStock.length / totalMaterials) * 100).toFixed(1) : 0 },
            overStock: { count: overStock.length, pct: totalMaterials ? ((overStock.length / totalMaterials) * 100).toFixed(1) : 0 },
            safetyStock: { count: safetyStock.length, pct: totalMaterials ? ((safetyStock.length / totalMaterials) * 100).toFixed(1) : 0 }
        },
        turnoverClassification: {
            fastMoving: turnoverData.filter(m => m.turnover >= 2 && m.turnover <= 4).length,
            slowMoving: turnoverData.filter(m => m.turnover > 1 && m.turnover < 2).length,
            nonMoving: turnoverData.filter(m => m.turnover <= 1 || m.turnover > 4).length,
            byClass
        },
        groupings: groupingBreakdown,
        lastUpdated: new Date().toISOString()
    };
}

function generateDemoStockEntriesForDemo(demoMaterials) {
    const entryTypes = [
        { type: 'Material Receipt', direction: 'IN' },
        { type: 'Material Issue', direction: 'OUT' },
        { type: 'Material Transfer', direction: 'TRANSFER' },
        { type: 'Material Consumption', direction: 'OUT' }
    ];
    const warehouses = ['Main Warehouse', 'Production Floor', 'Quality Control', 'Finished Goods'];
    const entries = [];
    const count = Math.min(20, demoMaterials.length);
    for (let i = 0; i < count; i++) {
        const material = demoMaterials[Math.floor(Math.random() * demoMaterials.length)];
        const entryType = entryTypes[Math.floor(Math.random() * entryTypes.length)];
        const qty = Math.floor(Math.random() * 200) + 50;
        const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
        entries.push({
            id: `SE-DEMO-${Date.now()}-${i}`,
            entryType: entryType.type,
            direction: entryType.direction,
            date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            items: [{ partNumber: material.partNumber, description: material.description, quantity: qty, unit: material.unit }],
            sourceWarehouse: entryType.direction === 'OUT' ? warehouse : '-',
            targetWarehouse: entryType.direction === 'IN' ? warehouse : '-',
            totalAmount: qty * (material.price || 0),
            status: 'Submitted'
        });
    }
    return entries;
}

function generateDemoMaterialRequestsForDemo(demoMaterials) {
    const lowStock = demoMaterials.filter(m => m.stock <= m.reorderPoint);
    const requestTypes = ['Purchase', 'Material Transfer', 'Material Issue', 'Manufacture'];
    const statuses = ['Pending', 'Approved', 'Ordered'];
    const requests = [];
    for (let i = 0; i < Math.min(lowStock.length, 12); i++) {
        const material = lowStock[i];
        const orderQty = Math.max(material.reorderPoint * 2 - material.stock, 10);
        requests.push({
            id: `MR-DEMO-${Date.now()}-${i}`,
            requestType: requestTypes[i % requestTypes.length],
            date: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
            requiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            requiredBy: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            items: [{ partNumber: material.partNumber, description: material.description, quantity: Math.ceil(orderQty), unit: material.unit }],
            status: statuses[i % statuses.length],
            totalAmount: orderQty * (material.price || 0),
            project: material.project,
            requestedBy: 'Demo User'
        });
    }
    return requests;
}

function generateDemoStockLedgerForDemo(demoMaterials) {
    const ledger = [];
    const warehouses = ['Main Warehouse', 'Production Floor', 'Quality Control'];
    const selected = demoMaterials.slice(0, 25);
    selected.forEach(m => {
        const numTx = Math.floor(Math.random() * 5) + 3;
        let balance = m.stock;
        for (let i = 0; i < numTx; i++) {
            const isIn = Math.random() > 0.5;
            const qty = Math.floor(Math.random() * 80) + 20;
            const change = isIn ? qty : -qty;
            balance += change;
            ledger.push({
                id: `LE-DEMO-${m.id}-${i}`,
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                voucherNo: `${isIn ? 'SE-IN' : 'SE-OUT'}-${Math.floor(Math.random() * 10000)}`,
                partNumber: m.partNumber,
                materialId: m.id,
                warehouse: warehouses[Math.floor(Math.random() * warehouses.length)],
                entryType: isIn ? 'IN' : 'OUT',
                quantityChange: change,
                quantity: Math.abs(change),
                balance: Math.max(balance, 0)
            });
        }
    });
    ledger.sort((a, b) => new Date(b.date) - new Date(a.date));
    return ledger;
}

function stopDemo() {
    window.demoMode = false;
    window.demoData = null;
    document.getElementById('demoModeBanner').style.display = 'none';
    document.body.classList.remove('demo-mode-active');
    const demoBtn = document.getElementById('aiDemoBtn');
    if (demoBtn) {
        demoBtn.innerHTML = '<i class="fas fa-play-circle"></i> <span id="aiDemoBtnText">AI Demo</span>';
        demoBtn.setAttribute('onclick', 'toggleDemo()');
    }
    loadMaterials();
    loadDashboard();
    loadStockEntries();
    loadMaterialRequests();
    loadStockLedger();
    console.log('[Demo] Demo mode stopped. Using live data.');
}

async function generateDemoData() {
    await generateDemoStockEntries();
    await generateDemoMaterialRequests();
    await generateDemoStockLedger();
}

async function generateDemoStockEntries() {
    const entryTypes = [
        { type: 'Material Receipt', direction: 'IN' },
        { type: 'Material Issue', direction: 'OUT' },
        { type: 'Material Transfer', direction: 'TRANSFER' },
        { type: 'Material Consumption', direction: 'OUT' }
    ];
    
    const warehouses = ['Main Warehouse', 'Production Floor', 'Quality Control', 'Finished Goods'];
    
    // Generate 20 stock entries from random materials
    const entries = [];
    for (let i = 0; i < 20; i++) {
        const material = materials[Math.floor(Math.random() * materials.length)];
        const entryType = entryTypes[Math.floor(Math.random() * entryTypes.length)];
        const qty = Math.floor(Math.random() * 200) + 50;
        const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
        
        entries.push({
            id: `SE-${Date.now()}-${i}`,
            entryType: entryType.type,
            direction: entryType.direction,
            partNumber: material.partNumber,
            description: material.description,
            quantity: qty,
            unit: material.unit,
            warehouse: warehouse,
            date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'Submitted',
            cost: (qty * material.price).toFixed(2)
        });
    }
    
    // Store in localStorage for persistence
    localStorage.setItem('demoStockEntries', JSON.stringify(entries));
    console.log('[Demo] Generated', entries.length, 'stock entries');
    
    return entries;
}

async function generateDemoMaterialRequests() {
    const requestTypes = ['Purchase', 'Transfer', 'Material Issue', 'Manufacture'];
    const statuses = ['Pending', 'Approved', 'Ordered', 'Stopped'];
    
    // Get low stock materials
    const lowStockMaterials = materials.filter(m => m.stock <= m.reorderPoint);
    
    // Generate requests for low stock items
    const requests = [];
    for (let i = 0; i < Math.min(lowStockMaterials.length, 15); i++) {
        const material = lowStockMaterials[i];
        const orderQty = Math.max(material.reorderPoint * 2 - material.stock, 0);
        const requestType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        requests.push({
            id: `MR-${Date.now()}-${i}`,
            requestType: requestType,
            partNumber: material.partNumber,
            description: material.description,
            quantity: Math.ceil(orderQty),
            unit: material.unit,
            requiredDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
            status: status,
            project: material.project,
            estimatedCost: (orderQty * material.price).toFixed(2),
            createdDate: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    // Store in localStorage
    localStorage.setItem('demoMaterialRequests', JSON.stringify(requests));
    console.log('[Demo] Generated', requests.length, 'material requests');
    
    return requests;
}

async function generateDemoStockLedger() {
    const ledgerEntries = [];
    const warehouses = ['Main Warehouse', 'Production Floor', 'Quality Control'];
    
    // Generate ledger entries for random materials
    const selectedMaterials = materials.slice(0, 30);
    
    for (const material of selectedMaterials) {
        let runningBalance = material.stock;
        const numTransactions = Math.floor(Math.random() * 5) + 3;
        
        for (let i = 0; i < numTransactions; i++) {
            const isIncoming = Math.random() > 0.5;
            const qty = Math.floor(Math.random() * 100) + 20;
            const change = isIncoming ? qty : -qty;
            runningBalance += change;
            
            ledgerEntries.push({
                id: `LE-${Date.now()}-${material.id}-${i}`,
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                voucherNo: `${isIncoming ? 'SE-IN' : 'SE-OUT'}-${Math.floor(Math.random() * 10000)}`,
                partNumber: material.partNumber,
                description: material.description,
                entryType: isIncoming ? 'IN' : 'OUT',
                quantity: Math.abs(change),
                unit: material.unit,
                balance: Math.max(runningBalance, 0),
                warehouse: warehouses[Math.floor(Math.random() * warehouses.length)],
                project: material.project
            });
        }
    }
    
    // Sort by date descending
    ledgerEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Store in localStorage
    localStorage.setItem('demoStockLedger', JSON.stringify(ledgerEntries));
    console.log('[Demo] Generated', ledgerEntries.length, 'stock ledger entries');
    
    return ledgerEntries;
}

// Dummy array for compatibility
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

// Keep old functions for compatibility
function showDemoStep() {}
function nextDemoStep() {}
function prevDemoStep() {}
