// Global state
let materials = [];
let transactions = [];
let dashboardData = {};

// API Base URL
const API_URL = window.location.origin;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] Initializing...');
    initializeApp();
    setupEventListeners();
});

// Initialize app properly
async function initializeApp() {
    try {
        // Load materials first
        await loadMaterials();
        console.log('[App] Materials loaded:', materials.length);
        
        // Then load dashboard
        await loadDashboard();
        console.log('[App] Dashboard loaded');
    } catch (error) {
        console.error('[App] Initialization error:', error);
    }
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Only update nav if called from nav click
    if (typeof event !== 'undefined' && event.target) {
        const navItem = event.target.closest('.nav-item');
        if (navItem) {
            navItem.classList.add('active');
        }
    } else {
        // Find and activate the corresponding nav item
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.getAttribute('onclick')?.includes(sectionId)) {
                item.classList.add('active');
            }
        });
    }
    
    // Load section-specific data
    if (sectionId === 'materials') loadMaterials();
}



// Dashboard (supports demo mode: uses window.demoData.dashboard when window.demoMode is true)
async function loadDashboard() {
    try {
        if (window.demoMode && window.demoData && window.demoData.dashboard) {
            dashboardData = window.demoData.dashboard;
            console.log('[Dashboard] Using demo dashboard data');
        } else {
            console.log('[Dashboard] Loading dashboard data...');
            const response = await fetch(`${API_URL}/api/analytics/dashboard`);
            dashboardData = await response.json();
        }
        
        console.log('[Dashboard] Data received:', dashboardData);
        
        // 1 DASHBOARD: Critical / Low / Over / Safety (% + material qty)
        const metrics = dashboardData.stockMetrics || {};
        const setMetric = (pctId, qtyId, data) => {
            const pctEl = document.getElementById(pctId);
            const qtyEl = document.getElementById(qtyId);
            if (pctEl) pctEl.textContent = (data && data.pct) != null ? data.pct : '0';
            if (qtyEl) qtyEl.textContent = (data && data.count) != null ? data.count + ' material qty' : '0 material qty';
        };
        setMetric('criticalPct', 'criticalQty', metrics.criticalStock);
        setMetric('lowPct', 'lowQty', metrics.lowStock);
        setMetric('overPct', 'overQty', metrics.overStock);
        setMetric('safetyPct', 'safetyQty', metrics.safetyStock);
        
        // 2 AI Insights list (counts in labels when available)
        const aiList = document.getElementById('aiInsightsList');
        if (aiList) {
            const c = (metrics.criticalStock && metrics.criticalStock.count) || 0;
            const l = (metrics.lowStock && metrics.lowStock.count) || 0;
            const o = (metrics.overStock && metrics.overStock.count) || 0;
            aiList.innerHTML = `
                <div class="ai-insight-item critical" onclick="showMaterialsPopup('critical')" role="button" tabindex="0" style="cursor: pointer;"><i class="fas fa-exclamation-circle"></i> Critical Stock (${c})</div>
                <div class="ai-insight-item low" onclick="showMaterialsPopup('low')" role="button" tabindex="0" style="cursor: pointer;"><i class="fas fa-exclamation-triangle"></i> Low Stock (${l})</div>
                <div class="ai-insight-item over" onclick="showMaterialsPopup('over')" role="button" tabindex="0" style="cursor: pointer;"><i class="fas fa-arrow-up"></i> Over Stock (${o})</div>
            `;
        }
        
        console.log('[Dashboard] Rendering charts...');
        renderCategoryChart(dashboardData.groupings || []);
        renderTrendChart(dashboardData.groupings || []);
        renderParetoChart();
        renderXyzParetoChart();
        updateABCXYZCounts(); // Update the counts in the boxes
        if (dashboardData.turnoverClassification) {
            renderTurnoverChart(dashboardData.turnoverClassification);
        }
        renderMaterialsSummary(dashboardData.groupings || []);
        loadRecentTransactions();
        
        // Load AI Dashboard Analysis (runs in demo mode too so AI still analyzes the overall system)
        console.log('[Dashboard] Loading AI analysis...');
        loadAIDashboardAnalysis();
        if (!window.demoMode && dashboardData.lowStockItems > 0 && materials.length > 0) {
            setTimeout(() => autoAnalyzeLowStock(), 3000);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error loading dashboard. Please check console for details.');
    }
}

// ============================================
// AI DASHBOARD ANALYSIS
// ============================================
async function loadAIDashboardAnalysis() {
    const container = document.getElementById('aiDashboardSummary');
    
    if (!container) {
        console.error('[AI] Dashboard summary container not found');
        return;
    }
    
    // Show animated loading with progress
    container.innerHTML = `
        <div class="text-center py-3">
            <div class="spinner-border text-primary mb-2" style="width: 2rem; height: 2rem;"></div>
            <p class="text-muted mb-1" id="aiLoadingText">AI is analyzing your inventory...</p>
            <div style="width: 100%; background: #e0e0e0; border-radius: 10px; height: 6px; margin: 10px 0;">
                <div id="aiLoadingProgress" style="width: 0%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; border-radius: 10px; transition: width 0.3s;"></div>
            </div>
            <p style="font-size: 0.85em; color: #999;" id="aiLoadingStep">Initializing AI...</p>
        </div>
    `;

    const materialCount = (window.demoMode && window.demoData && window.demoData.materials)
        ? window.demoData.materials.length
        : ((typeof materials !== 'undefined' && materials.length) ? materials.length : 0);
    const loadText = materialCount > 0 ? `Loading ${materialCount} materials...` : 'Loading inventory...';
    const steps = [
        { progress: 10, text: loadText },
        { progress: 30, text: 'Analyzing stock levels...' },
        { progress: 50, text: 'Detecting anomalies...' },
        { progress: 70, text: 'Calculating recommendations...' },
        { progress: 90, text: 'Generating insights...' }
    ];
    
    let currentStep = 0;
    const progressInterval = setInterval(() => {
        const progressBar = document.getElementById('aiLoadingProgress');
        const loadingText = document.getElementById('aiLoadingStep');
        
        if (currentStep < steps.length && progressBar && loadingText) {
            progressBar.style.width = steps[currentStep].progress + '%';
            loadingText.textContent = steps[currentStep].text;
            currentStep++;
        }
    }, 800);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        let response;
        if (window.demoMode && window.demoData && window.demoData.materials && window.demoData.materials.length > 0) {
            const demoPayload = window.demoData.materials;
            console.log('[AI] Demo mode: sending current demo data (' + demoPayload.length + ' items) for analysis...');
            response = await fetch(`${API_URL}/api/ai/dashboard-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ materials: demoPayload }),
                signal: controller.signal
            });
            if (!response.ok) {
                const storeRes = await fetch(`${API_URL}/api/ai/demo-materials`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ materials: demoPayload }),
                    signal: controller.signal
                });
                if (storeRes.ok) {
                    response = await fetch(`${API_URL}/api/ai/dashboard-analysis?demo=1&_=${Date.now()}`, { signal: controller.signal, cache: 'no-store' });
                }
            }
        } else {
            console.log('[AI] Fetching dashboard analysis from:', `${API_URL}/api/ai/dashboard-analysis`);
            response = await fetch(`${API_URL}/api/ai/dashboard-analysis`, {
                signal: controller.signal
            });
        }
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('[AI] Dashboard AI analysis received successfully');

        // Complete progress
        const progressBar = document.getElementById('aiLoadingProgress');
        const loadingText = document.getElementById('aiLoadingStep');
        if (progressBar) progressBar.style.width = '100%';
        if (loadingText) loadingText.textContent = 'Analysis complete!';
        
        // Wait a moment to show completion
        await new Promise(resolve => setTimeout(resolve, 500));

        // Store the full analysis globally
        window.aiAnalysisData = result;

        // Show summary in card
        const summary = result.analysis ? result.analysis.substring(0, 200) + '...' : 'Analysis complete';
        container.innerHTML = `
            <div style="text-align: left;">
                <p style="margin: 0 0 15px 0; color: #666; line-height: 1.6;">${summary}</p>
                <button onclick="openAIModal()" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-eye me-2"></i>View Full AI Analysis
                </button>
            </div>
        `;

    } catch (error) {
        clearInterval(progressInterval);
        console.error('AI Dashboard Analysis Error:', error);
        if (window.demoMode && window.demoData && window.demoData.materials && window.demoData.materials.length > 0) {
            const fallback = buildDemoModeAnalysisFallback(window.demoData.materials);
            window.aiAnalysisData = { analysis: fallback, timestamp: new Date().toISOString(), summary: {} };
            const summary = fallback.substring(0, 200) + '...';
            container.innerHTML = `
                <div style="text-align: left;">
                    <p style="margin: 0 0 15px 0; color: #666; line-height: 1.6;">${summary}</p>
                    <p style="font-size: 0.85em; color: #999;">(Analysis of current demo data — server AI unavailable)</p>
                    <button onclick="openAIModal()" class="btn btn-primary" style="width: 100%; margin-top: 8px;">
                        <i class="fas fa-eye me-2"></i>View Full Analysis
                    </button>
                </div>
            `;
            return;
        }
        let errorMessage = 'Unknown error occurred';
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out after 30 seconds';
        } else if (error.message) {
            errorMessage = error.message;
        }
        container.innerHTML = `
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
                <p style="color: #856404; margin: 0 0 10px 0;"><i class="fas fa-exclamation-triangle"></i> AI Analysis Unavailable</p>
                <p style="color: #666; margin: 0 0 10px 0; font-size: 0.9em;">${errorMessage}</p>
                <p style="color: #666; margin: 0; font-size: 0.85em;">The system is working, but AI analysis is temporarily unavailable. You can still use all other features.</p>
            </div>
        `;
    }
}

function buildDemoModeAnalysisFallback(mats) {
    const totalValue = mats.reduce((s, m) => s + (m.stock || 0) * (m.price || 0), 0);
    const critical = mats.filter(m => m.stock <= (m.reorderPoint || 0));
    const low = mats.filter(m => (m.reorderPoint || 0) < m.stock && m.stock <= (m.reorderPoint || 0) * 1.5);
    const over = mats.filter(m => m.stock > (m.reorderPoint || 0) * 3);
    const safety = mats.filter(m => (m.reorderPoint || 0) * 1.5 < m.stock && m.stock <= (m.reorderPoint || 0) * 3);
    const byGroup = {};
    mats.forEach(m => {
        const g = m.grouping || 'Other';
        if (!byGroup[g]) byGroup[g] = { count: 0, low: 0 };
        byGroup[g].count++;
        if (m.stock <= (m.reorderPoint || 0)) byGroup[g].low++;
    });
    let groupText = Object.entries(byGroup).map(([g, o]) => `${g}: ${o.count} items (${o.low} low/critical)`).join('; ');
    const topCritical = critical.slice(0, 5).map(m => `${m.partNumber || m.id}: ${m.stock} / ${m.reorderPoint} ${m.unit || ''}`).join('\n');
    return `## Demo mode – inventory analysis (current data)

**Total materials:** ${mats.length}  |  **Total value:** ₱${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}

### Stock status
- **Critical (at or below reorder):** ${critical.length} items
- **Low stock:** ${low.length} items
- **Safety band:** ${safety.length} items
- **Over stock:** ${over.length} items

### By category
${groupText}

### Items needing attention (sample)
${topCritical || 'None'}

### Recommendations
${critical.length > 0 ? `• Reorder or transfer stock for ${critical.length} critical item(s) to avoid stockouts.` : ''}
${over.length > 0 ? `• Review ${over.length} over-stocked item(s) for possible redistribution or reduced orders.` : ''}
• Use the Materials view and filters to drill down by category or ABC/XYZ class.`;
}

function openAIModal() {
    const modal = document.getElementById('aiModal');
    const modalBody = document.getElementById('aiModalBody');
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    if (window.aiAnalysisData) {
        modalBody.innerHTML = `
            <div style="padding: 20px; background: #fafafa; font-size: 0.95em;">
                ${formatAIAnalysis(window.aiAnalysisData.analysis)}
            </div>
            <div style="border-top: 1px solid #e0e0e0; padding: 15px; background: #f5f5f5; text-align: center; color: #666;">
                <i class="fas fa-clock" style="margin-right: 5px;"></i>
                Last analyzed: ${new Date(window.aiAnalysisData.timestamp).toLocaleString()}
                <button onclick="refreshAIAnalysis()" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 15px;">
                    <i class="fas fa-sync-alt" style="margin-right: 5px;"></i>Refresh Analysis
                </button>
            </div>
        `;
    } else {
        modalBody.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
                <h5>Loading AI insights...</h5>
            </div>
        `;
        // Load if not already loaded
        loadAIDashboardAnalysis();
    }
}

function closeAIModal() {
    const modal = document.getElementById('aiModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function refreshAIAnalysis() {
    const modalBody = document.getElementById('aiModalBody');
    modalBody.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
            <h5>Refreshing AI analysis...</h5>
        </div>
    `;
    loadAIDashboardAnalysis().then(() => {
        setTimeout(() => openAIModal(), 1000);
    });
}

async function autoAnalyzeLowStock() {
    try {
        if (!materials || materials.length === 0) {
            console.log('[AI] Materials not loaded yet, skipping low stock analysis');
            const statusDiv = document.getElementById('lowStockAIStatus');
            if (statusDiv) {
                statusDiv.innerHTML = '<i class="fas fa-check-circle" style="color: #4caf50;"></i> All stock levels healthy';
            }
            return;
        }
        
        const lowStockMaterials = materials.filter(m => m.stock <= m.reorderPoint);
        
        if (lowStockMaterials.length === 0) {
            console.log('[AI] No low stock materials found');
            const statusDiv = document.getElementById('lowStockAIStatus');
            if (statusDiv) {
                statusDiv.innerHTML = '<i class="fas fa-check-circle" style="color: #4caf50;"></i> All stock levels healthy';
            }
            return;
        }
        
        console.log('[AI] Analyzing', lowStockMaterials.length, 'low stock materials');
        
        const statusDiv = document.getElementById('lowStockAIStatus');
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fas fa-robot"></i> AI analyzing low stock...';
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(`${API_URL}/api/ai/low-stock-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ materials: lowStockMaterials }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Store the analysis
        window.lowStockAnalysisData = data;
        
        // Update status with clickable link
        if (statusDiv) {
            statusDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: #f44336;"></i> 
                <a href="#" onclick="showLowStockAnalysis(); return false;" style="color: #f44336; text-decoration: underline; font-weight: 600;">
                    ${lowStockMaterials.length} items analyzed - View Details
                </a>
            `;
        }
        
        console.log('[AI] Low stock analysis complete');
    } catch (error) {
        console.error('Auto Low Stock Analysis Error:', error);
        const statusDiv = document.getElementById('lowStockAIStatus');
        if (statusDiv) {
            if (error.name === 'AbortError') {
                statusDiv.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ff9800;"></i> Analysis timed out';
            } else {
                statusDiv.innerHTML = '<i class="fas fa-info-circle" style="color: #2196f3;"></i> AI analysis unavailable';
            }
        }
    }
}

function showLowStockAnalysis() {
    if (!window.lowStockAnalysisData) {
        alert('Low stock analysis not available. Please refresh the page.');
        return;
    }
    
    const modal = document.getElementById('aiModal');
    const modalBody = document.getElementById('aiModalBody');
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    modalBody.innerHTML = `
        <div style="background: linear-gradient(135deg, #f44336 0%, #e91e63 100%); color: white; padding: 20px; margin: -30px -30px 20px -30px; border-radius: 0;">
            <h3 style="margin: 0 0 10px 0; color: white;"><i class="fas fa-exclamation-triangle"></i> Low Stock Alert</h3>
            <p style="margin: 0; opacity: 0.9;">AI Analysis of Materials Requiring Attention</p>
        </div>
        <div style="padding: 20px; background: #fafafa; font-size: 0.95em;">
            ${formatAIAnalysis(window.lowStockAnalysisData.analysis)}
        </div>
        <div style="border-top: 1px solid #e0e0e0; padding: 15px; background: #f5f5f5; text-align: center; color: #666;">
            <i class="fas fa-exclamation-triangle text-danger" style="margin-right: 5px;"></i>
            Analyzed ${window.lowStockAnalysisData.materialsAnalyzed} low stock items
        </div>
    `;
}

async function analyzeLowStock() {
    const lowStockMaterials = materials.filter(m => m.stock <= m.reorderPoint);
    
    if (lowStockMaterials.length === 0) {
        alert('✅ Great news! No materials are currently low on stock.');
        return;
    }
    
    const modal = document.getElementById('aiModal');
    const modalBody = document.getElementById('aiModalBody');
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    modalBody.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-danger mb-3" style="width: 3rem; height: 3rem;"></div>
            <h5>AI is analyzing ${lowStockMaterials.length} low stock items...</h5>
            <p class="text-muted">This may take 10-30 seconds</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_URL}/api/ai/low-stock-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ materials: lowStockMaterials })
        });
        
        const data = await response.json();
        
        modalBody.innerHTML = `
            <div style="background: linear-gradient(135deg, #f44336 0%, #e91e63 100%); color: white; padding: 20px; margin: -30px -30px 20px -30px; border-radius: 0;">
                <h3 style="margin: 0 0 10px 0; color: white;"><i class="fas fa-exclamation-triangle"></i> Low Stock Alert</h3>
                <p style="margin: 0; opacity: 0.9;">AI Analysis of Materials Requiring Attention</p>
            </div>
            <div style="padding: 20px; background: #fafafa; font-size: 0.95em;">
                ${formatAIAnalysis(data.analysis)}
            </div>
            <div style="border-top: 1px solid #e0e0e0; padding: 15px; background: #f5f5f5; text-align: center; color: #666;">
                <i class="fas fa-exclamation-triangle text-danger" style="margin-right: 5px;"></i>
                Analyzed ${lowStockMaterials.length} low stock items
            </div>
        `;
    } catch (error) {
        modalBody.innerHTML = `
            <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 20px; margin: 15px; border-radius: 4px;">
                <h6 style="color: #f44336; margin: 0 0 10px 0;"><i class="fas fa-exclamation-triangle"></i> Analysis Failed</h6>
                <p style="margin: 0;">${error.message}</p>
            </div>
        `;
    }
}

async function analyzeMaterial(materialId) {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;
    
    const modal = document.getElementById('aiModal');
    const modalBody = document.getElementById('aiModalBody');
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Show progress indicator
    modalBody.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
            <h5>AI is analyzing ${material.partNumber}...</h5>
            <p class="text-muted">${material.description}</p>
            <div style="width: 80%; margin: 20px auto; background: #e0e0e0; border-radius: 10px; height: 6px;">
                <div id="materialAnalysisProgress" style="width: 0%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; border-radius: 10px; transition: width 0.5s;"></div>
            </div>
            <p style="font-size: 0.9em; color: #999;" id="materialAnalysisStep">Analyzing stock levels...</p>
        </div>
    `;
    
    // Simulate progress
    const progressBar = document.getElementById('materialAnalysisProgress');
    const stepText = document.getElementById('materialAnalysisStep');
    const steps = [
        { progress: 25, text: 'Checking stock status...' },
        { progress: 50, text: 'Calculating recommendations...' },
        { progress: 75, text: 'Assessing risks...' },
        { progress: 95, text: 'Finalizing analysis...' }
    ];
    
    let currentStep = 0;
    const progressInterval = setInterval(() => {
        if (currentStep < steps.length && progressBar && stepText) {
            progressBar.style.width = steps[currentStep].progress + '%';
            stepText.textContent = steps[currentStep].text;
            currentStep++;
        }
    }, 600);
    
    try {
        const response = await fetch(`${API_URL}/api/ai/material-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ material })
        });
        
        clearInterval(progressInterval);
        
        const data = await response.json();
        
        // Show completion
        if (progressBar) progressBar.style.width = '100%';
        if (stepText) stepText.textContent = 'Analysis complete!';
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        modalBody.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 20px -30px; border-radius: 0;">
                <h3 style="margin: 0 0 10px 0; color: white;">${material.partNumber}</h3>
                <p style="margin: 0; opacity: 0.9;">${material.description}</p>
            </div>
            <div style="padding: 20px; background: #fafafa; font-size: 0.95em;">
                ${formatAIAnalysis(data.analysis)}
            </div>
        `;
    } catch (error) {
        clearInterval(progressInterval);
        modalBody.innerHTML = `
            <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 20px; margin: 15px; border-radius: 4px;">
                <h6 style="color: #f44336; margin: 0 0 10px 0;"><i class="fas fa-exclamation-triangle"></i> Analysis Failed</h6>
                <p style="margin: 0;">${error.message}</p>
            </div>
        `;
    }
}

function formatAIAnalysis(text) {
    if (!text) return '<p class="text-muted">No analysis available</p>';
    
    // Split into lines for processing
    const lines = text.split('\n');
    let result = [];
    let inTable = false;
    let tableRows = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) {
            if (inList) {
                result.push('</ul>');
                inList = false;
            }
            continue;
        }
        
        // Handle tables
        if (line.startsWith('|') && line.endsWith('|')) {
            if (line.includes('---')) continue;
            
            if (!inTable) {
                inTable = true;
                tableRows = [];
            }
            
            const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
            const isHeader = tableRows.length === 0;
            const tag = isHeader ? 'th' : 'td';
            tableRows.push(`<tr>${cells.map(c => `<${tag} style="padding: 10px; border-bottom: 1px solid #e0e0e0; ${isHeader ? 'background: #f5f5f5; font-weight: 600; color: #333;' : 'color: #555;'}">${c}</${tag}>`).join('')}</tr>`);
        } else {
            // Close table if we were in one
            if (inTable) {
                result.push('<div style="overflow-x: auto; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><table style="width: 100%; border-collapse: collapse; background: white;">');
                result.push(tableRows.join('\n'));
                result.push('</table></div>');
                tableRows = [];
                inTable = false;
            }
            
            // Handle bullet points
            if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
                if (!inList) {
                    result.push('<ul style="margin: 15px 0; padding-left: 25px;">');
                    inList = true;
                }
                const content = line.substring(2).trim();
                result.push(`<li style="margin: 8px 0; color: #555; line-height: 1.6;">${content}</li>`);
            } else {
                if (inList) {
                    result.push('</ul>');
                    inList = false;
                }
                result.push(line);
            }
        }
    }
    
    // Close any open table or list
    if (inTable && tableRows.length > 0) {
        result.push('<div style="overflow-x: auto; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><table style="width: 100%; border-collapse: collapse; background: white;">');
        result.push(tableRows.join('\n'));
        result.push('</table></div>');
    }
    if (inList) {
        result.push('</ul>');
    }
    
    let formatted = result.join('\n');
    
    // Apply enhanced formatting with better styling
    return formatted
        // Main headers - colorful cards with icons
        .replace(/## 📊 (.*)/g, '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin: 25px 0 15px 0; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);"><h3 style="margin: 0; font-size: 1.5em; font-weight: 600;"><i class="fas fa-chart-bar" style="margin-right: 10px;"></i>$1</h3></div>')
        .replace(/## 🤖 (.*)/g, '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin: 25px 0 15px 0; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);"><h3 style="margin: 0; font-size: 1.5em; font-weight: 600;"><i class="fas fa-robot" style="margin-right: 10px;"></i>$1</h3></div>')
        .replace(/## 📈 (.*)/g, '<div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 20px; border-radius: 12px; margin: 25px 0 15px 0; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);"><h3 style="margin: 0; font-size: 1.5em; font-weight: 600;"><i class="fas fa-chart-line" style="margin-right: 10px;"></i>$1</h3></div>')
        .replace(/## 📋 (.*)/g, '<div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 20px; border-radius: 12px; margin: 25px 0 15px 0; box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);"><h3 style="margin: 0; font-size: 1.5em; font-weight: 600;"><i class="fas fa-clipboard-list" style="margin-right: 10px;"></i>$1</h3></div>')
        .replace(/## 📚 (.*)/g, '<div style="background: linear-gradient(135deg, #00bcd4 0%, #0097a7 100%); color: white; padding: 20px; border-radius: 12px; margin: 25px 0 15px 0; box-shadow: 0 4px 12px rgba(0, 188, 212, 0.3);"><h3 style="margin: 0; font-size: 1.5em; font-weight: 600;"><i class="fas fa-book" style="margin-right: 10px;"></i>$1</h3></div>')
        .replace(/## 🎯 (.*)/g, '<div style="background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%); color: white; padding: 20px; border-radius: 12px; margin: 25px 0 15px 0; box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);"><h3 style="margin: 0; font-size: 1.5em; font-weight: 600;"><i class="fas fa-bullseye" style="margin-right: 10px;"></i>$1</h3></div>')
        .replace(/## 🚨 (.*)/g, '<div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 20px; border-radius: 12px; margin: 25px 0 15px 0; box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);"><h3 style="margin: 0; font-size: 1.5em; font-weight: 600;"><i class="fas fa-exclamation-triangle" style="margin-right: 10px;"></i>$1</h3></div>')
        // Fallback for other headers
        .replace(/## (.*)/g, '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin: 25px 0 15px 0; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);"><h3 style="margin: 0; font-size: 1.5em; font-weight: 600;">$1</h3></div>')
        // Sub headers - info boxes
        .replace(/### (.*)/g, '<div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px 20px; margin: 20px 0 10px 0; border-radius: 4px;"><h4 style="margin: 0; color: #667eea; font-size: 1.1em; font-weight: 600;">$1</h4></div>')
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #333; font-weight: 600; background: #fff3cd; padding: 2px 6px; border-radius: 3px;">$1</strong>')
        // Icons - keep existing
        .replace(/⚠️/g, '<span style="font-size: 1.3em; margin-right: 8px;">⚠️</span>')
        .replace(/✅/g, '<span style="font-size: 1.3em; margin-right: 8px;">✅</span>')
        .replace(/🔴/g, '<span style="font-size: 1.3em; margin-right: 8px;">🔴</span>')
        .replace(/🟡/g, '<span style="font-size: 1.3em; margin-right: 8px;">🟡</span>')
        .replace(/🟢/g, '<span style="font-size: 1.3em; margin-right: 8px;">🟢</span>')
        // Paragraphs with better spacing and background
        .replace(/\n\n/g, '</p><p style="line-height: 1.9; color: #444; margin: 15px 0; font-size: 1.05em; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">')
        .replace(/\n/g, '<br>')
        // Horizontal rules
        .replace(/---/g, '<hr style="border: none; border-top: 2px solid #e0e0e0; margin: 30px 0;">');
}

// Dashboard
function renderCategoryChart(groupings) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) {
        console.error('[Chart] categoryChart canvas not found');
        return;
    }
    
    console.log('[Chart] Rendering category chart with', groupings.length, 'groupings');
    
    // Destroy existing chart if it exists
    if (window.categoryChartInstance) {
        window.categoryChartInstance.destroy();
    }
    
    window.categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: groupings.map(g => g.grouping),
            datasets: [{
                data: groupings.map(g => g.count),
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#fa709a', '#fee140', '#30cfd0', '#330867',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    console.log('[Chart] Category chart rendered successfully');
}

function renderTrendChart(groupings) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) {
        console.error('[Chart] trendChart canvas not found');
        return;
    }
    if (!groupings || groupings.length === 0) return;
    if (window.trendChartInstance) {
        window.trendChartInstance.destroy();
    }
    
    const mats = (typeof materials !== 'undefined' && materials.length) ? materials : [];
    const labels = groupings.map(g => g.grouping);
    
    // Calculate stock quantities by status for each grouping
    const criticalStockData = groupings.map(g => {
        const grp = g.grouping;
        return mats
            .filter(m => m.grouping === grp && (m.stock || 0) <= (m.reorderPoint || 0))
            .reduce((sum, m) => sum + (m.stock || 0), 0);
    });
    
    const lowStockData = groupings.map(g => {
        const grp = g.grouping;
        return mats
            .filter(m => {
                const stock = m.stock || 0;
                const reorder = m.reorderPoint || 0;
                const safetyStock = m.safetyStock || (m.reorderPoint || 0) * 2;
                const lowThreshold = reorder + (safetyStock - reorder) * 0.5;
                return m.grouping === grp && stock > reorder && stock < lowThreshold;
            })
            .reduce((sum, m) => sum + (m.stock || 0), 0);
    });
    
    const safetyStockData = groupings.map(g => {
        const grp = g.grouping;
        return mats
            .filter(m => {
                const stock = m.stock || 0;
                const reorder = m.reorderPoint || 0;
                const safetyStock = m.safetyStock || (m.reorderPoint || 0) * 2;
                const lowThreshold = reorder + (safetyStock - reorder) * 0.5;
                return m.grouping === grp && stock >= lowThreshold && stock <= safetyStock;
            })
            .reduce((sum, m) => sum + (m.stock || 0), 0);
    });
    
    const overStockData = groupings.map(g => {
        const grp = g.grouping;
        return mats
            .filter(m => {
                const stock = m.stock || 0;
                const safetyStock = m.safetyStock || (m.reorderPoint || 0) * 2;
                return m.grouping === grp && stock > safetyStock;
            })
            .reduce((sum, m) => sum + (m.stock || 0), 0);
    });
    
    window.trendChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Critical Stock',
                    data: criticalStockData,
                    backgroundColor: 'rgba(220, 38, 38, 0.85)',
                    borderColor: '#dc2626',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: 'Low Stock',
                    data: lowStockData,
                    backgroundColor: 'rgba(251, 146, 60, 0.85)',
                    borderColor: '#fb923c',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: 'Safety Stock',
                    data: safetyStockData,
                    backgroundColor: 'rgba(34, 197, 94, 0.85)',
                    borderColor: '#22c55e',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: 'Over Stock',
                    data: overStockData,
                    backgroundColor: 'rgba(59, 130, 246, 0.85)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Stock Quantity (units)',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        usePointStyle: true,
                        pointStyle: 'rectRounded'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            const grouping = context.label;
                            const grpMats = mats.filter(m => m.grouping === grouping);
                            
                            let count = 0;
                            if (label === 'Critical Stock') {
                                count = grpMats.filter(m => (m.stock || 0) <= (m.reorderPoint || 0)).length;
                            } else if (label === 'Low Stock') {
                                count = grpMats.filter(m => {
                                    const stock = m.stock || 0;
                                    const reorder = m.reorderPoint || 0;
                                    const safetyStock = m.safetyStock || (m.reorderPoint || 0) * 2;
                                    const lowThreshold = reorder + (safetyStock - reorder) * 0.5;
                                    return stock > reorder && stock < lowThreshold;
                                }).length;
                            } else if (label === 'Safety Stock') {
                                count = grpMats.filter(m => {
                                    const stock = m.stock || 0;
                                    const reorder = m.reorderPoint || 0;
                                    const safetyStock = m.safetyStock || (m.reorderPoint || 0) * 2;
                                    const lowThreshold = reorder + (safetyStock - reorder) * 0.5;
                                    return stock >= lowThreshold && stock <= safetyStock;
                                }).length;
                            } else if (label === 'Over Stock') {
                                count = grpMats.filter(m => {
                                    const stock = m.stock || 0;
                                    const safetyStock = m.safetyStock || (m.reorderPoint || 0) * 2;
                                    return stock > safetyStock;
                                }).length;
                            }
                            
                            return `${label}: ${value.toLocaleString()} units (${count} items)`;
                        },
                        footer: function(tooltipItems) {
                            const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
                            return `Total: ${total.toLocaleString()} units`;
                        }
                    }
                }
            }
        }
    });
    console.log('[Chart] Stock level trends chart rendered successfully');
}

// ABC Pareto chart: 3 bars only — A (high value), B (medium), C (low). Line = cumulative %.
function renderParetoChart() {
    const ctx = document.getElementById('paretoChart');
    const legendEl = document.getElementById('paretoLegend');
    
    if (!ctx) {
        console.warn('[Chart] paretoChart canvas not found');
        return;
    }
    
    if (window.paretoChartInstance) {
        window.paretoChartInstance.destroy();
        window.paretoChartInstance = null;
    }
    
    const mats = (typeof materials !== 'undefined' && materials.length) ? materials : [];
    const withValue = mats
        .map(m => ({ ...m, value: (m.stock || 0) * (m.price || 0) }))
        .filter(m => m.value > 0)
        .sort((a, b) => b.value - a.value);
    const totalValue = withValue.reduce((sum, m) => sum + m.value, 0);
    
    if (withValue.length === 0 || totalValue === 0) {
        if (legendEl) {
            legendEl.innerHTML = '<p style="color: #999; font-style: italic;">No data available. Please add price values to your items in ERPNext.</p>';
        }
        console.log('[Chart] No data for Pareto chart - items need price values');
        return;
    }
    
    let cum = 0;
    const abc = { A: { value: 0, count: 0 }, B: { value: 0, count: 0 }, C: { value: 0, count: 0 } };
    withValue.forEach(m => {
        cum += m.value;
        const pct = (cum / totalValue) * 100;
        const cls = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
        m.abc = cls;
        abc[cls].value += m.value;
        abc[cls].count++;
    });
    const labels = ['A (High value)', 'B (Medium value)', 'C (Low value)'];
    const values = [abc.A.value, abc.B.value, abc.C.value];
    const barColors = ['rgba(76, 175, 80, 0.85)', 'rgba(255, 152, 0, 0.85)', 'rgba(244, 67, 54, 0.85)'];
    const barBorderColors = ['#4caf50', '#ff9800', '#f44336'];
    let cumLine = 0;
    const cumulativePct = values.map(v => {
        cumLine += v;
        return ((cumLine / totalValue) * 100).toFixed(1);
    }).map(Number);
    
    if (legendEl) {
        legendEl.innerHTML = `
            <strong>A</strong>: ${abc.A.count} items = ${((abc.A.value / totalValue) * 100).toFixed(1)}% value &nbsp;|&nbsp;
            <strong>B</strong>: ${abc.B.count} items = ${((abc.B.value / totalValue) * 100).toFixed(1)}% value &nbsp;|&nbsp;
            <strong>C</strong>: ${abc.C.count} items = ${((abc.C.value / totalValue) * 100).toFixed(1)}% value
        `;
    }
    window.paretoChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Value (₱)',
                    data: values,
                    backgroundColor: barColors,
                    borderColor: barBorderColors,
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Cumulative %',
                    data: cumulativePct,
                    type: 'line',
                    borderColor: '#5c6bc0',
                    backgroundColor: 'rgba(92, 107, 192, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: { display: true, text: 'Value (₱)' }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    min: 0,
                    max: 100,
                    title: { display: true, text: 'Cumulative %' },
                    grid: { drawOnChartArea: false },
                    ticks: { callback: v => v + '%' }
                }
            },
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function (c) {
                            if (c.dataset.yAxisID === 'y1')
                                return 'Cumulative %: ' + c.raw + '%';
                            const cls = ['A', 'B', 'C'][c.dataIndex];
                            return 'Class ' + cls + ' — ₱' + (c.raw || 0).toLocaleString() + ' (' + abc[cls].count + ' items)';
                        }
                    }
                }
            }
        }
    });
    console.log('[Chart] ABC Pareto chart (3 bars: A/B/C) rendered successfully');
}

// XYZ Pareto chart: bars = value by demand class (X, Y, Z), line = cumulative % of value. Classic Pareto style.
function renderXyzParetoChart() {
    const ctx = document.getElementById('xyzParetoChart');
    const legendEl = document.getElementById('xyzParetoLegend');
    
    if (!ctx) {
        console.warn('[Chart] xyzParetoChart canvas not found');
        return;
    }
    
    if (window.xyzParetoChartInstance) {
        window.xyzParetoChartInstance.destroy();
        window.xyzParetoChartInstance = null;
    }
    
    const mats = (typeof materials !== 'undefined' && materials.length) ? materials : [];
    const ratio = m => (m.reorderPoint > 0 ? (m.stock / m.reorderPoint) : 0);
    const xyz = m => {
        const r = ratio(m);
        if (r >= 2 && r <= 4) return 'X';
        if (r > 1 && r < 2) return 'Y';
        return 'Z';
    };
    const xyzValue = { X: 0, Y: 0, Z: 0 };
    const xyzCount = { X: 0, Y: 0, Z: 0 };
    mats.forEach(m => {
        const v = (m.stock || 0) * (m.price || 0);
        const cls = xyz(m);
        xyzValue[cls] += v;
        xyzCount[cls]++;
    });
    const totalValue = xyzValue.X + xyzValue.Y + xyzValue.Z;
    
    if (totalValue === 0) {
        if (legendEl) {
            legendEl.innerHTML = '<p style="color: #999; font-style: italic;">No data available. Please add price values to your items in ERPNext.</p>';
        }
        console.log('[Chart] No data for XYZ Pareto chart - items need price values');
        return;
    }
    
    const order = ['X', 'Y', 'Z'];
    const labels = order.map(c => (c === 'X' ? 'X (Stable)' : c === 'Y' ? 'Y (Moderate)' : 'Z (Irregular)'));
    const values = order.map(c => xyzValue[c]);
    let cum = 0;
    const cumulativePct = values.map(v => {
        cum += v;
        return ((cum / totalValue) * 100).toFixed(1);
    }).map(Number);
    
    if (legendEl) {
        const pctPerClass = order.map((c, i) => (totalValue ? ((xyzValue[c] / totalValue) * 100).toFixed(1) : 0));
        const parts = order.map((c, i) => `${c}: ${xyzCount[c]} items = ${pctPerClass[i]}% of value`).join('  |  ');
        legendEl.innerHTML = '<strong>' + parts + '</strong>';
    }
    window.xyzParetoChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Value (₱)',
                    data: values,
                    backgroundColor: ['#2196f3', '#ff9800', '#9e9e9e'],
                    borderColor: ['#1976d2', '#f57c00', '#616161'],
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Cumulative %',
                    data: cumulativePct,
                    type: 'line',
                    borderColor: '#e91e63',
                    backgroundColor: 'rgba(233, 30, 99, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.2,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: { display: true, text: 'Value (₱)' }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    min: 0,
                    max: 100,
                    title: { display: true, text: 'Cumulative %' },
                    grid: { drawOnChartArea: false },
                    ticks: { callback: v => v + '%' }
                }
            },
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function (c) {
                            if (c.dataset.yAxisID === 'y1')
                                return 'Cumulative %: ' + c.raw + '%';
                            return 'Value: ₱' + (c.raw || 0).toLocaleString();
                        }
                    }
                }
            }
        }
    });
    console.log('[Chart] XYZ Pareto chart rendered successfully');
}

// Turnover classification bar chart (Class A, B, C)
function renderTurnoverChart(turnoverData) {
    const ctx = document.getElementById('turnoverChart');
    if (!ctx || !turnoverData || !turnoverData.byClass) return;
    if (window.turnoverChartInstance) {
        window.turnoverChartInstance.destroy();
    }
    const byClass = turnoverData.byClass;
    window.turnoverChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Class A', 'Class B', 'Class C'],
            datasets: [
                { label: 'Fast-Moving', data: [byClass.A?.fast || 0, byClass.B?.fast || 0, byClass.C?.fast || 0], backgroundColor: '#4caf50' },
                { label: 'Slow-Moving', data: [byClass.A?.slow || 0, byClass.B?.slow || 0, byClass.C?.slow || 0], backgroundColor: '#ff9800' },
                { label: 'Non-Moving', data: [byClass.A?.non || 0, byClass.B?.non || 0, byClass.C?.non || 0], backgroundColor: '#f44336' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function filterByCategory(cat) {
    window.paretoFilter = cat;
    showSection('materials');
    setTimeout(() => {
        if (document.getElementById('categoryFilter')) filterMaterials();
    }, 300);
}

function getMaterialsFilteredByType(type) {
    const mats = (typeof materials !== 'undefined' && materials.length) ? materials : [];
    const r = type.toLowerCase();
    
    // New classification logic using safety stock ranges
    if (r === 'critical') return mats.filter(m => (m.stock || 0) <= (m.reorderPoint || 0));
    if (r === 'low') {
        return mats.filter(m => {
            const stock = m.stock || 0;
            const reorderPoint = m.reorderPoint || 0;
            const safetyStock = m.safetyStock || reorderPoint * 2;
            const safetyMin = safetyStock * 0.625; // 50% of safety stock
            return stock > reorderPoint && stock < safetyMin;
        });
    }
    if (r === 'safety') {
        return mats.filter(m => {
            const stock = m.stock || 0;
            const reorderPoint = m.reorderPoint || 0;
            const safetyStock = m.safetyStock || reorderPoint * 2;
            const safetyMin = safetyStock * 0.625; // 50% of safety stock
            const safetyMax = safetyStock; // 100% of safety stock
            return stock >= safetyMin && stock <= safetyMax;
        });
    }
    if (r === 'over') {
        return mats.filter(m => {
            const stock = m.stock || 0;
            const safetyStock = m.safetyStock || (m.reorderPoint || 0) * 2;
            return stock > safetyStock;
        });
    }
    if (['a', 'b', 'c', 'x', 'y', 'z'].includes(r)) {
        const withValue = mats.map(m => ({ ...m, totalValue: (m.stock || 0) * (m.price || 0) })).sort((a, b) => b.totalValue - a.totalValue);
        const totalVal = withValue.reduce((s, m) => s + m.totalValue, 0);
        let cum = 0;
        const abc = {};
        withValue.forEach(m => {
            cum += m.totalValue;
            const pct = totalVal ? (cum / totalVal) * 100 : 0;
            abc[m.id] = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
        });
        const ratio = m => (m.reorderPoint > 0 ? (m.stock / m.reorderPoint) : 0);
        const xyz = m => {
            const rp = ratio(m);
            if (rp >= 2 && rp <= 4) return 'X';
            if (rp > 1 && rp < 2) return 'Y';
            return 'Z';
        };
        const cls = r.toUpperCase();
        if (['A', 'B', 'C'].includes(cls)) return mats.filter(m => abc[m.id] === cls);
        return mats.filter(m => xyz(m) === cls);
    }
    return mats;
}

// Update ABC/XYZ counts in the dashboard boxes
function updateABCXYZCounts() {
    const classes = ['A', 'B', 'C', 'X', 'Y', 'Z'];
    classes.forEach(cls => {
        const count = getMaterialsFilteredByType(cls).length;
        const countEl = document.getElementById(`count${cls}`);
        if (countEl) {
            countEl.textContent = count;
        }
    });
    console.log('[Dashboard] ABC/XYZ counts updated');
}

function showMaterialsPopup(type) {
    const list = getMaterialsFilteredByType(type);
    const titles = {
        critical: 'Critical Stock',
        low: 'Low Stock',
        over: 'Over Stock',
        safety: 'Safety Stock',
        A: 'Class A (High Value Items)',
        B: 'Class B (Medium Value Items)',
        C: 'Class C (Low Value Items)',
        X: 'Class X (Stable Demand)',
        Y: 'Class Y (Moderate or Seasonal)',
        Z: 'Class Z (Irregular)'
    };
    const title = titles[type] || type;
    const titleEl = document.getElementById('materialsListModalTitle');
    const bodyEl = document.getElementById('materialsListModalBody');
    const modal = document.getElementById('materialsListModal');
    if (!titleEl || !bodyEl || !modal) return;
    titleEl.innerHTML = `<i class="fas fa-boxes"></i> ${title} (${list.length} materials)`;
    if (list.length === 0) {
        bodyEl.innerHTML = '<p class="text-muted">No materials in this category.</p>';
    } else {
        const html = `
            <table class="table table-sm table-striped" style="font-size: 0.9em;">
                <thead><tr>
                    <th>Part #</th><th>Description</th><th>Grouping</th><th>Stock</th><th>Reorder</th><th>Unit</th><th>Status</th>
                </tr></thead>
                <tbody>
                    ${list.map(m => {
                        const rp = m.reorderPoint || 0;
                        const st = m.stock || 0;
                        const safetyStock = m.safetyStock || rp * 2;
                        const safetyMin = safetyStock * 0.625;
                        const safetyMax = safetyStock;
                        
                        let status = 'Safety';
                        if (st <= rp) status = 'Critical';
                        else if (st > rp && st < safetyMin) status = 'Low';
                        else if (st >= safetyMin && st <= safetyMax) status = 'Safety';
                        else if (st > safetyMax) status = 'Over';
                        
                        const statusClass = status === 'Critical' ? 'text-danger' : status === 'Low' ? 'text-warning' : status === 'Over' ? 'text-info' : 'text-success';
                        return `<tr>
                            <td><strong>${(m.partNumber || m.id || '').toString()}</strong></td>
                            <td>${(m.description || '').toString().substring(0, 40)}</td>
                            <td>${(m.grouping || '').toString()}</td>
                            <td>${st.toLocaleString()}</td>
                            <td>${rp.toLocaleString()}</td>
                            <td>${(m.unit || '').toString()}</td>
                            <td><span class="${statusClass}">${status}</span></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        `;
        bodyEl.innerHTML = html;
    }
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeMaterialsListModal() {
    const modal = document.getElementById('materialsListModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function renderMaterialsSummary(groupings) {
    const container = document.getElementById('materialsSummaryTable');
    if (!container) {
        console.error('[Table] materialsSummaryTable not found');
        return;
    }
    
    console.log('[Table] Rendering materials summary with', groupings.length, 'groupings');
    
    const html = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Category</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600;">Total Items</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600;">Total Stock</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600;">Low Stock</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600;">Status</th>
                </tr>
            </thead>
            <tbody>
                ${groupings.map(g => {
                    const healthPercent = g.lowStock === 0 ? 100 : ((g.count - g.lowStock) / g.count * 100);
                    const statusColor = healthPercent >= 80 ? '#4caf50' : healthPercent >= 50 ? '#ff9800' : '#f44336';
                    const statusText = healthPercent >= 80 ? 'Healthy' : healthPercent >= 50 ? 'Warning' : 'Critical';
                    
                    return `
                        <tr style="border-bottom: 1px solid #e0e0e0;">
                            <td style="padding: 12px; font-weight: 500;">${g.grouping}</td>
                            <td style="padding: 12px; text-align: center;">${g.count}</td>
                            <td style="padding: 12px; text-align: center; font-weight: 600;">${g.totalStock.toLocaleString()}</td>
                            <td style="padding: 12px; text-align: center; color: ${g.lowStock > 0 ? '#f44336' : '#4caf50'}; font-weight: 600;">
                                ${g.lowStock}
                            </td>
                            <td style="padding: 12px; text-align: right;">
                                <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">
                                    ${statusText}
                                </span>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
            <tfoot>
                <tr style="background: #f8f9fa; border-top: 2px solid #dee2e6; font-weight: 600;">
                    <td style="padding: 12px;">TOTAL</td>
                    <td style="padding: 12px; text-align: center;">${groupings.reduce((sum, g) => sum + g.count, 0)}</td>
                    <td style="padding: 12px; text-align: center;">${groupings.reduce((sum, g) => sum + g.totalStock, 0).toLocaleString()}</td>
                    <td style="padding: 12px; text-align: center; color: #f44336;">${groupings.reduce((sum, g) => sum + g.lowStock, 0)}</td>
                    <td style="padding: 12px;"></td>
                </tr>
            </tfoot>
        </table>
    `;
    
    container.innerHTML = html;
    console.log('[Table] Materials summary rendered successfully');
}

async function loadRecentTransactions() {
    try {
        const response = await fetch(`${API_URL}/api/transactions`);
        transactions = await response.json();
        
        const container = document.getElementById('recentTransactions');
        if (transactions.length === 0) {
            container.innerHTML = '<p class="loading">No transactions yet</p>';
            return;
        }
        
        const html = `
            <table>
                <thead>
                    <tr>
                        <th>Transaction ID</th>
                        <th>Type</th>
                        <th>Material</th>
                        <th>Quantity</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.slice(0, 10).map(t => `
                        <tr>
                            <td>${t.id}</td>
                            <td>${t.type}</td>
                            <td>${t.materialCode || 'N/A'}</td>
                            <td>${t.quantity || 0}</td>
                            <td>${new Date(t.date).toLocaleDateString()}</td>
                            <td><span class="status-badge status-normal">${t.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Materials (supports demo mode: uses window.demoData.materials when window.demoMode is true)
async function loadMaterials() {
    try {
        if (window.demoMode && window.demoData && window.demoData.materials) {
            materials = window.demoData.materials;
            console.log('[Materials] Using demo materials:', materials.length);
        } else {
            console.log('[Materials] Loading materials...');
            const response = await fetch(`${API_URL}/api/materials`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            materials = await response.json();
        }
        
        console.log('[Materials] Loaded:', materials.length, 'materials');
        populateCategoryFilter();
        
        const materialsSection = document.getElementById('materials');
        if (materialsSection && materialsSection.classList.contains('active')) {
            renderMaterialsTable(materials);
        }
        return materials;
    } catch (error) {
        console.error('Error loading materials:', error);
        alert('Error loading materials. Please refresh the page.');
        return [];
    }
}

function populateCategoryFilter() {
    const groupings = [...new Set(materials.map(m => m.grouping))];
    const select = document.getElementById('categoryFilter');
    
    groupings.forEach(grp => {
        const option = document.createElement('option');
        option.value = grp;
        option.textContent = grp;
        select.appendChild(option);
    });
}

function renderMaterialsTable(data) {
    const container = document.getElementById('materialsTable');
    
    if (data.length === 0) {
        container.innerHTML = '<p class="loading">No materials found</p>';
        return;
    }
    
    // Calculate ABC classification for value indicators
    const withValue = data.map(m => ({ ...m, totalValue: (m.stock || 0) * (m.price || 0) })).sort((a, b) => b.totalValue - a.totalValue);
    const totalVal = withValue.reduce((s, m) => s + m.totalValue, 0);
    let cum = 0;
    const abc = {};
    const abcDetails = {}; // Store detailed info for tooltips
    withValue.forEach(m => {
        const itemPct = totalVal > 0 ? (m.totalValue / totalVal) * 100 : 0;
        const prevCum = cum; // Cumulative BEFORE adding this item
        cum += m.totalValue;
        const cumulativePct = totalVal > 0 ? (cum / totalVal) * 100 : 0;
        
        // Classify based on where the cumulative was BEFORE adding this item
        // This ensures high-value items that push us over 80% are still classified as A
        let abcClass;
        if (prevCum < 80) {
            abcClass = 'A'; // Top 80% of value
        } else if (prevCum < 95) {
            abcClass = 'B'; // Next 15% (80-95%)
        } else {
            abcClass = 'C'; // Bottom 5% (95-100%)
        }
        
        abc[m.id] = abcClass;
        abcDetails[m.id] = {
            stock: m.stock || 0,
            price: m.price || 0,
            totalValue: m.totalValue,
            itemPct: itemPct,
            cumulativePct: cumulativePct,
            abcClass: abcClass
        };
    });
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Part Number</th>
                    <th>Description</th>
                    <th>Value Class</th>
                    <th>Price</th>
                    <th>Project</th>
                    <th>Grouping</th>
                    <th>Stock</th>
                    <th>Unit</th>
                    <th>Reorder Point</th>
                    <th>Status</th>
                    <th>Storage Location</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(m => {
                    const status = (m.stock || 0) <= (m.reorderPoint || 0) ? 'critical' : 
                                 (m.stock || 0) <= (m.reorderPoint || 0) * 1.5 ? 'low' : 'normal';
                    const valueClass = abc[m.id] || 'C';
                    const valueLabel = valueClass === 'A' ? 'High Value' : valueClass === 'B' ? 'Medium Value' : 'Low Value';
                    const valueColor = valueClass === 'A' ? '#2196f3' : valueClass === 'B' ? '#9c27b0' : '#4caf50';
                    const details = abcDetails[m.id] || {};
                    const tooltipText = `ABC Classification: ${valueClass} (${valueLabel})

INVENTORY VALUE (Stock × Price):
Stock: ${(details.stock || 0).toLocaleString()} units × Price: ₱${(details.price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
= Total Inventory Value: ₱${(details.totalValue || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}

PERCENTAGE OF TOTAL INVENTORY:
This item: ${(details.itemPct || 0).toFixed(2)}% of total inventory value
Cumulative: ${(details.cumulativePct || 0).toFixed(2)}%

WHY CLASS ${valueClass}?
${valueClass === 'A' ? '✓ Top 80% of total inventory value\n✓ High priority for inventory control\n✓ Requires tight management' : valueClass === 'B' ? '• Next 15% of inventory value (80-95%)\n• Medium priority\n• Moderate control needed' : '• Bottom 5% of inventory value (95-100%)\n• Low priority\n• Basic control sufficient'}

Note: ABC is based on TOTAL inventory value (Stock × Price),
not just unit price. High-priced items with low stock may be Class C.

To change: Adjust price or stock quantity in ERPNext`;
                    const materialId = (m.id || '').toString().replace(/'/g, "\\'");
                    
                    return `
                        <tr>
                            <td><strong>${m.partNumber || ''}</strong></td>
                            <td>${m.description || ''}</td>
                            <td>
                                <span class="value-badge" style="background: ${valueColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75em; font-weight: 600; cursor: help; white-space: pre-line;" title="${tooltipText}">
                                    ${valueClass} - ${valueLabel}
                                </span>
                            </td>
                            <td>₱${(m.price || 0).toFixed(2)}</td>
                            <td>${m.project || ''}</td>
                            <td>${m.grouping || ''}</td>
                            <td>${(m.stock || 0).toLocaleString()}</td>
                            <td>${m.unit || ''}</td>
                            <td>${m.reorderPoint || 0}</td>
                            <td><span class="status-badge status-${status}">${status.toUpperCase()}</span></td>
                            <td style="font-size: 11px">${m.storageLocation || ''}</td>
                            <td>
                                <button onclick="editMaterial('${materialId}')" class="btn btn-sm btn-warning" style="font-size: 0.75em; padding: 4px 8px; margin-right: 4px;" title="Edit Material">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button onclick="analyzeMaterial('${materialId}')" class="btn btn-sm btn-primary" style="font-size: 0.75em; padding: 4px 8px;" title="AI Analysis">
                                    <i class="fas fa-robot"></i> Analyze
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}

function filterMaterials() {
    const grouping = document.getElementById('categoryFilter')?.value || '';
    const search = (document.getElementById('materialSearch')?.value || '').toLowerCase();
    const lowStockOnly = document.getElementById('lowStockFilter')?.checked || false;
    const pareto = window.paretoFilter;
    
    let filtered = materials;
    
    if (grouping) {
        filtered = filtered.filter(m => m.grouping === grouping);
    }
    
    if (search) {
        filtered = filtered.filter(m => 
            m.description.toLowerCase().includes(search) ||
            m.partNumber.toLowerCase().includes(search) ||
            m.project.toLowerCase().includes(search)
        );
    }
    
    if (lowStockOnly) {
        filtered = filtered.filter(m => m.stock <= m.reorderPoint);
    }
    
    // Pareto filter (ABC = value class, XYZ = demand/turnover class)
    if (pareto && ['A','B','C','X','Y','Z'].includes(pareto)) {
        const withValue = materials.map(m => ({ ...m, totalValue: (m.stock || 0) * (m.price || 0) })).sort((a, b) => b.totalValue - a.totalValue);
        const totalVal = withValue.reduce((s, m) => s + m.totalValue, 0);
        let cum = 0;
        const abc = {};
        withValue.forEach(m => {
            cum += m.totalValue;
            const pct = totalVal ? (cum / totalVal) * 100 : 0;
            abc[m.id] = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
        });
        const ratio = m => (m.reorderPoint > 0 ? (m.stock / m.reorderPoint) : 0);
        const xyz = m => {
            const r = ratio(m);
            if (r >= 2 && r <= 4) return 'X';
            if (r > 1 && r < 2) return 'Y';
            return 'Z';
        };
        if (['A','B','C'].includes(pareto)) {
            filtered = filtered.filter(m => abc[m.id] === pareto);
        } else {
            filtered = filtered.filter(m => xyz(m) === pareto);
        }
        window.paretoFilter = null; // clear after one use so normal filter works
    }
    
    renderMaterialsTable(filtered);
}

// Utility functions
function refreshDashboard() {
    loadDashboard();
}

function viewMaterial(id) {
    const material = materials.find(m => m.id === id);
    alert(`Material Details:\n\nCode: ${material.code}\nName: ${material.name}\nStock: ${material.stock} ${material.unit}\nPrice: $${material.price}`);
}

function exportMaterials() {
    alert('Export feature coming soon!');
}

function showAddMaterial() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h2>Add New Material</h2>
            <form id="addMaterialForm" style="display: grid; gap: 15px;">
                <div>
                    <label>Part Number *</label>
                    <input type="text" id="newPartNumber" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div>
                    <label>Description *</label>
                    <input type="text" id="newDescription" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label>Project</label>
                        <select id="newProject" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="Common">Common</option>
                            <option value="Nivio">Nivio</option>
                            <option value="Migne">Migne</option>
                            <option value="Common Direct">Common Direct</option>
                        </select>
                    </div>
                    <div>
                        <label>Grouping *</label>
                        <select id="newGrouping" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="">Select...</option>
                            <option value="PCB">PCB</option>
                            <option value="Cu wire">Cu wire</option>
                            <option value="Resin">Resin</option>
                            <option value="Bobbin">Bobbin</option>
                            <option value="Cable wire">Cable wire</option>
                            <option value="Sensor Case">Sensor Case</option>
                            <option value="Case">Case</option>
                            <option value="Ferrite">Ferrite</option>
                            <option value="Pin header">Pin header</option>
                            <option value="Soldering">Soldering</option>
                            <option value="Supplies">Supplies</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label>Storage Location</label>
                    <input type="text" id="newStorageLocation" placeholder="e.g., Storage Rack 1 Layer 2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                    <div>
                        <label>Stock Quantity *</label>
                        <input type="number" id="newStock" required min="0" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label>Reorder Point *</label>
                        <input type="number" id="newReorderPoint" required min="0" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label>Unit *</label>
                        <select id="newUnit" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="">Select...</option>
                            <option value="PC">PC (Pieces)</option>
                            <option value="M">M (Meters)</option>
                            <option value="KG">KG (Kilograms)</option>
                            <option value="L">L (Liters)</option>
                            <option value="BOX">BOX</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label>Unit Price (₱)</label>
                    <input type="number" id="newPrice" min="0" step="0.01" placeholder="0.00" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button type="button" onclick="closeModal()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                    <button type="submit" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">Add Material</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('addMaterialForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newMaterial = {
            partNumber: document.getElementById('newPartNumber').value,
            description: document.getElementById('newDescription').value,
            project: document.getElementById('newProject').value,
            grouping: document.getElementById('newGrouping').value,
            storageLocation: document.getElementById('newStorageLocation').value || 'General Storage',
            stock: parseFloat(document.getElementById('newStock').value),
            reorderPoint: parseFloat(document.getElementById('newReorderPoint').value),
            unit: document.getElementById('newUnit').value,
            price: parseFloat(document.getElementById('newPrice').value) || 0
        };
        
        try {
            const response = await fetch(`${API_URL}/api/materials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMaterial)
            });
            
            if (response.ok) {
                const addedMaterial = await response.json();
                alert(`Material added successfully!\nID: ${addedMaterial.id}\nPart Number: ${addedMaterial.partNumber}`);
                closeModal();
                loadMaterials();
                loadDashboard();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            alert(`Error adding material: ${error.message}`);
        }
    });
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Edit Material Modal
async function editMaterial(materialId) {
    try {
        // Fetch current material data
        const response = await fetch(`${API_URL}/api/materials/${materialId}`);
        if (!response.ok) throw new Error('Failed to fetch material');
        const material = await response.json();
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <h2 style="margin-bottom: 20px; color: #667eea;">
                    <i class="fas fa-edit"></i> Edit Material
                </h2>
                <form id="editMaterialForm">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                        <div>
                            <label>Part Number *</label>
                            <input type="text" id="editPartNumber" value="${material.partNumber}" required readonly style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: #f5f5f5;">
                        </div>
                        <div>
                            <label>Description *</label>
                            <input type="text" id="editDescription" value="${material.description}" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                        <div>
                            <label>Project</label>
                            <select id="editProject" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="Nivio" ${material.project === 'Nivio' ? 'selected' : ''}>Nivio</option>
                                <option value="Migne" ${material.project === 'Migne' ? 'selected' : ''}>Migne</option>
                                <option value="Common Direct" ${material.project === 'Common Direct' ? 'selected' : ''}>Common Direct</option>
                                <option value="Common" ${material.project === 'Common' ? 'selected' : ''}>Common</option>
                            </select>
                        </div>
                        <div>
                            <label>Grouping *</label>
                            <select id="editGrouping" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="PCB" ${material.grouping === 'PCB' ? 'selected' : ''}>PCB</option>
                                <option value="Cu wire" ${material.grouping === 'Cu wire' ? 'selected' : ''}>Cu wire</option>
                                <option value="Resin" ${material.grouping === 'Resin' ? 'selected' : ''}>Resin</option>
                                <option value="Bobbin" ${material.grouping === 'Bobbin' ? 'selected' : ''}>Bobbin</option>
                                <option value="Cable wire" ${material.grouping === 'Cable wire' ? 'selected' : ''}>Cable wire</option>
                                <option value="Sensor Case" ${material.grouping === 'Sensor Case' ? 'selected' : ''}>Sensor Case</option>
                                <option value="Case" ${material.grouping === 'Case' ? 'selected' : ''}>Case</option>
                                <option value="Ferrite" ${material.grouping === 'Ferrite' ? 'selected' : ''}>Ferrite</option>
                                <option value="Pin header" ${material.grouping === 'Pin header' ? 'selected' : ''}>Pin header</option>
                                <option value="Soldering" ${material.grouping === 'Soldering' ? 'selected' : ''}>Soldering</option>
                                <option value="Supplies" ${material.grouping === 'Supplies' ? 'selected' : ''}>Supplies</option>
                                <option value="General" ${material.grouping === 'General' ? 'selected' : ''}>General</option>
                                <option value="Raw Material" ${material.grouping === 'Raw Material' ? 'selected' : ''}>Raw Material</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label>Storage Location</label>
                        <input type="text" id="editStorageLocation" value="${material.storageLocation}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 10px;">
                        <div>
                            <label>Current Stock</label>
                            <input type="number" id="editStock" value="${material.stock}" readonly style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: #f5f5f5;">
                            <small style="color: #666;">Use Stock Entry to change</small>
                        </div>
                        <div>
                            <label>Reorder Point *</label>
                            <input type="number" id="editReorderPoint" value="${material.reorderPoint}" required min="0" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label>Unit *</label>
                            <select id="editUnit" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="PC" ${material.unit === 'PC' ? 'selected' : ''}>PC (Pieces)</option>
                                <option value="Nos" ${material.unit === 'Nos' ? 'selected' : ''}>Nos (Numbers)</option>
                                <option value="M" ${material.unit === 'M' ? 'selected' : ''}>M (Meters)</option>
                                <option value="KG" ${material.unit === 'KG' ? 'selected' : ''}>KG (Kilograms)</option>
                                <option value="Kg" ${material.unit === 'Kg' ? 'selected' : ''}>Kg (Kilograms)</option>
                                <option value="L" ${material.unit === 'L' ? 'selected' : ''}>L (Liters)</option>
                                <option value="BOX" ${material.unit === 'BOX' ? 'selected' : ''}>BOX</option>
                            </select>
                        </div>
                    </div>
                    <div style="margin-top: 10px;">
                        <label>Unit Price (₱)</label>
                        <input type="number" id="editPrice" value="${material.price}" min="0" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                        <button type="button" onclick="closeModal()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                        <button type="submit" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('editMaterialForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updatedMaterial = {
                description: document.getElementById('editDescription').value,
                project: document.getElementById('editProject').value,
                grouping: document.getElementById('editGrouping').value,
                storageLocation: document.getElementById('editStorageLocation').value,
                reorderPoint: parseFloat(document.getElementById('editReorderPoint').value),
                unit: document.getElementById('editUnit').value,
                price: parseFloat(document.getElementById('editPrice').value) || 0
            };
            
            try {
                // Note: ERPNext update would go here - for now we'll show a message
                // In a full implementation, you'd call PUT /api/materials/:id
                alert('Note: Material updates will be synced to ERPNext.\n\nUpdated fields:\n' + 
                      Object.keys(updatedMaterial).map(k => `- ${k}: ${updatedMaterial[k]}`).join('\n'));
                
                closeModal();
                loadMaterials();
                loadDashboard();
            } catch (error) {
                alert(`Error updating material: ${error.message}`);
            }
        });
    } catch (error) {
        alert(`Error loading material: ${error.message}`);
    }
}

function setupEventListeners() {
    document.getElementById('globalSearch')?.addEventListener('input', (e) => {
        console.log('Searching:', e.target.value);
    });
}


// ========================================
// ERPNext-Style Inventory Features
// ========================================

// Stock Entry Functions
let stockEntries = [];

async function loadStockEntries() {
    try {
        if (window.demoMode && window.demoData && window.demoData.stockEntries) {
            stockEntries = window.demoData.stockEntries;
            console.log('[Stock Entry] Using demo stock entries:', stockEntries.length);
        } else {
            const response = await fetch(`${API_URL}/api/stock-entry`);
            stockEntries = await response.json();
            const demoEntries = JSON.parse(localStorage.getItem('demoStockEntries') || '[]');
            if (demoEntries.length > 0) {
                const formattedDemoEntries = demoEntries.map(entry => ({
                    id: entry.id,
                    entryType: entry.entryType,
                    date: entry.date,
                    items: [{ partNumber: entry.partNumber, description: entry.description, quantity: entry.quantity, unit: entry.unit }],
                    sourceWarehouse: entry.direction === 'OUT' ? entry.warehouse : '-',
                    targetWarehouse: entry.direction === 'IN' ? entry.warehouse : '-',
                    totalAmount: parseFloat(entry.cost),
                    status: entry.status
                }));
                stockEntries = [...formattedDemoEntries, ...stockEntries];
            }
        }
        renderStockEntriesTable(stockEntries);
    } catch (error) {
        console.error('Error loading stock entries:', error);
    }
}

function renderStockEntriesTable(data) {
    const container = document.getElementById('stockEntriesTable');
    
    if (data.length === 0) {
        container.innerHTML = '<p class="loading">No stock entries found. Create your first stock entry!</p>';
        return;
    }
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Entry ID</th>
                    <th>Entry Type</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Source Warehouse</th>
                    <th>Target Warehouse</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(entry => `
                    <tr>
                        <td><strong>${entry.id}</strong></td>
                        <td><span class="badge badge-info">${entry.entryType}</span></td>
                        <td>${new Date(entry.date).toLocaleDateString()}</td>
                        <td>${entry.items.length} items</td>
                        <td>${entry.sourceWarehouse || '-'}</td>
                        <td>${entry.targetWarehouse || '-'}</td>
                        <td>₱${entry.totalAmount.toLocaleString()}</td>
                        <td><span class="status-badge status-${entry.status.toLowerCase()}">${entry.status}</span></td>
                        <td>
                            <button class="btn-sm btn-secondary" onclick="viewStockEntry('${entry.id}')">View</button>
                            ${entry.status !== 'Cancelled' ? `<button class="btn-sm btn-danger" onclick="cancelStockEntry('${entry.id}')">Cancel</button>` : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}

function filterStockEntries() {
    const type = document.getElementById('stockEntryTypeFilter').value;
    const dateFrom = document.getElementById('stockEntryDateFrom').value;
    const dateTo = document.getElementById('stockEntryDateTo').value;
    
    let filtered = stockEntries;
    
    if (type) {
        filtered = filtered.filter(e => e.entryType === type);
    }
    
    if (dateFrom) {
        filtered = filtered.filter(e => new Date(e.date) >= new Date(dateFrom));
    }
    
    if (dateTo) {
        filtered = filtered.filter(e => new Date(e.date) <= new Date(dateTo));
    }
    
    renderStockEntriesTable(filtered);
}

function showNewStockEntry() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <h2><i class="fas fa-exchange-alt"></i> New Stock Entry</h2>
            <form id="stockEntryForm" style="display: grid; gap: 20px;">
                <div>
                    <label>Entry Type *</label>
                    <select id="entryType" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Select Entry Type...</option>
                        <option value="Material Receipt">Material Receipt (Stock IN)</option>
                        <option value="Material Issue">Material Issue (Stock OUT)</option>
                        <option value="Material Transfer">Material Transfer (Warehouse to Warehouse)</option>
                        <option value="Material Consumption">Material Consumption (Production Use)</option>
                    </select>
                </div>
                
                <div id="warehouseFields" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div id="sourceWarehouseDiv" style="display: none;">
                        <label>Source Warehouse</label>
                        <input type="text" id="sourceWarehouse" placeholder="e.g., Main Warehouse" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div id="targetWarehouseDiv" style="display: none;">
                        <label>Target Warehouse</label>
                        <input type="text" id="targetWarehouse" placeholder="e.g., Production Floor" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>
                
                <div>
                    <label>Select Material *</label>
                    <select id="stockEntryMaterial" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Select Material...</option>
                        ${materials.map(m => `<option value="${m.id}" data-part="${m.partNumber}" data-desc="${m.description}" data-unit="${m.unit}" data-price="${m.price}">${m.partNumber} - ${m.description}</option>`).join('')}
                    </select>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label>Quantity *</label>
                        <input type="number" id="stockEntryQuantity" required min="0.01" step="0.01" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label>Rate (₱)</label>
                        <input type="number" id="stockEntryRate" min="0" step="0.01" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>
                
                <div>
                    <label>Remarks</label>
                    <textarea id="stockEntryRemarks" rows="3" placeholder="Additional notes..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Submit Stock Entry</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle entry type change
    document.getElementById('entryType').addEventListener('change', (e) => {
        const type = e.target.value;
        const sourceDiv = document.getElementById('sourceWarehouseDiv');
        const targetDiv = document.getElementById('targetWarehouseDiv');
        
        if (type === 'Material Receipt') {
            sourceDiv.style.display = 'none';
            targetDiv.style.display = 'block';
        } else if (type === 'Material Issue' || type === 'Material Consumption') {
            sourceDiv.style.display = 'block';
            targetDiv.style.display = 'none';
        } else if (type === 'Material Transfer') {
            sourceDiv.style.display = 'block';
            targetDiv.style.display = 'block';
        }
    });
    
    // Auto-fill rate when material is selected
    document.getElementById('stockEntryMaterial').addEventListener('change', (e) => {
        const option = e.target.selectedOptions[0];
        const price = option.getAttribute('data-price');
        document.getElementById('stockEntryRate').value = price || 0;
    });
    
    document.getElementById('stockEntryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const materialSelect = document.getElementById('stockEntryMaterial');
        const selectedOption = materialSelect.selectedOptions[0];
        
        const stockEntry = {
            entryType: document.getElementById('entryType').value,
            sourceWarehouse: document.getElementById('sourceWarehouse').value || null,
            targetWarehouse: document.getElementById('targetWarehouse').value || null,
            remarks: document.getElementById('stockEntryRemarks').value,
            items: [{
                materialId: materialSelect.value,
                partNumber: selectedOption.getAttribute('data-part'),
                description: selectedOption.getAttribute('data-desc'),
                quantity: parseFloat(document.getElementById('stockEntryQuantity').value),
                unit: selectedOption.getAttribute('data-unit'),
                rate: parseFloat(document.getElementById('stockEntryRate').value) || 0
            }]
        };
        
        try {
            const response = await fetch(`${API_URL}/api/stock-entry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stockEntry)
            });
            
            if (response.ok) {
                const result = await response.json();
                alert(`Stock Entry created successfully!\nEntry ID: ${result.id}`);
                closeModal();
                loadStockEntries();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            alert(`Error creating stock entry: ${error.message}`);
        }
    });
}

async function viewStockEntry(id) {
    try {
        const response = await fetch(`${API_URL}/api/stock-entry/${id}`);
        const entry = await response.json();
        
        alert(`Stock Entry Details:\n\nID: ${entry.id}\nType: ${entry.entryType}\nDate: ${new Date(entry.date).toLocaleString()}\nItems: ${entry.items.length}\nTotal Amount: ₱${entry.totalAmount.toLocaleString()}\nStatus: ${entry.status}`);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function cancelStockEntry(id) {
    if (!confirm('Are you sure you want to cancel this stock entry? This will reverse all stock movements.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/stock-entry/${id}/cancel`, {
            method: 'POST'
        });
        
        if (response.ok) {
            alert('Stock entry cancelled successfully!');
            loadStockEntries();
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Material Request Functions
let materialRequests = [];

async function loadMaterialRequests() {
    try {
        if (window.demoMode && window.demoData && window.demoData.materialRequests) {
            materialRequests = window.demoData.materialRequests;
            console.log('[Material Request] Using demo material requests:', materialRequests.length);
        } else {
            const response = await fetch(`${API_URL}/api/material-request`);
            materialRequests = await response.json();
            const demoRequests = JSON.parse(localStorage.getItem('demoMaterialRequests') || '[]');
            if (demoRequests.length > 0) {
                const formattedDemoRequests = demoRequests.map(req => ({
                    id: req.id,
                    requestType: req.requestType,
                    date: req.createdDate,
                    items: [{ partNumber: req.partNumber, description: req.description, quantity: req.quantity, unit: req.unit }],
                    requiredDate: req.requiredDate,
                    requiredBy: req.requiredDate,
                    status: req.status,
                    totalAmount: parseFloat(req.estimatedCost),
                    project: req.project,
                    requestedBy: 'Demo User'
                }));
                materialRequests = [...formattedDemoRequests, ...materialRequests];
            }
        }
        renderMaterialRequestsTable(materialRequests);
    } catch (error) {
        console.error('Error loading material requests:', error);
    }
}

function renderMaterialRequestsTable(data) {
    const container = document.getElementById('materialRequestsTable');
    
    if (data.length === 0) {
        container.innerHTML = '<p class="loading">No material requests found. Create your first material request!</p>';
        return;
    }
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Request ID</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Required By</th>
                    <th>Items</th>
                    <th>Requested By</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(req => `
                    <tr>
                        <td><strong>${req.id}</strong></td>
                        <td><span class="badge badge-info">${req.requestType}</span></td>
                        <td>${new Date(req.date).toLocaleDateString()}</td>
                        <td>${new Date(req.requiredBy).toLocaleDateString()}</td>
                        <td>${req.items.length} items</td>
                        <td>${req.requestedBy}</td>
                        <td><span class="status-badge status-${req.status.toLowerCase().replace(' ', '-')}">${req.status}</span></td>
                        <td>
                            <button class="btn-sm btn-secondary" onclick="viewMaterialRequest('${req.id}')">View</button>
                            ${req.status === 'Pending' ? `<button class="btn-sm btn-success" onclick="approveMaterialRequest('${req.id}')">Approve</button>` : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}

function filterMaterialRequests() {
    const status = document.getElementById('materialRequestStatusFilter').value;
    const type = document.getElementById('materialRequestTypeFilter').value;
    
    let filtered = materialRequests;
    
    if (status) {
        filtered = filtered.filter(r => r.status === status);
    }
    
    if (type) {
        filtered = filtered.filter(r => r.requestType === type);
    }
    
    renderMaterialRequestsTable(filtered);
}

function showNewMaterialRequest() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <h2><i class="fas fa-clipboard-list"></i> New Material Request</h2>
            <form id="materialRequestForm" style="display: grid; gap: 15px;">
                <div>
                    <label>Request Type *</label>
                    <select id="requestType" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Select Type...</option>
                        <option value="Purchase">Purchase</option>
                        <option value="Material Transfer">Material Transfer</option>
                        <option value="Material Issue">Material Issue</option>
                        <option value="Manufacture">Manufacture</option>
                    </select>
                </div>
                
                <div>
                    <label>Select Material *</label>
                    <select id="requestMaterial" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Select Material...</option>
                        ${materials.map(m => `<option value="${m.id}" data-part="${m.partNumber}" data-desc="${m.description}" data-unit="${m.unit}" data-stock="${m.stock}">${m.partNumber} - ${m.description} (Stock: ${m.stock})</option>`).join('')}
                    </select>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label>Quantity *</label>
                        <input type="number" id="requestQuantity" required min="1" step="0.01" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label>Required By</label>
                        <input type="date" id="requestRequiredBy" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>
                
                <div>
                    <label>Purpose</label>
                    <input type="text" id="requestPurpose" placeholder="e.g., Production, Maintenance" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div>
                    <label>Remarks</label>
                    <textarea id="requestRemarks" rows="3" placeholder="Additional notes..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Submit Request</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('materialRequestForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const materialSelect = document.getElementById('requestMaterial');
        const selectedOption = materialSelect.selectedOptions[0];
        
        const materialRequest = {
            requestType: document.getElementById('requestType').value,
            requiredBy: document.getElementById('requestRequiredBy').value || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            purpose: document.getElementById('requestPurpose').value,
            remarks: document.getElementById('requestRemarks').value,
            requestedBy: 'Current User',
            items: [{
                materialId: materialSelect.value,
                partNumber: selectedOption.getAttribute('data-part'),
                description: selectedOption.getAttribute('data-desc'),
                quantity: parseFloat(document.getElementById('requestQuantity').value),
                unit: selectedOption.getAttribute('data-unit'),
                currentStock: parseFloat(selectedOption.getAttribute('data-stock'))
            }]
        };
        
        try {
            const response = await fetch(`${API_URL}/api/material-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(materialRequest)
            });
            
            if (response.ok) {
                const result = await response.json();
                alert(`Material Request created successfully!\nRequest ID: ${result.id}`);
                closeModal();
                loadMaterialRequests();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            alert(`Error creating material request: ${error.message}`);
        }
    });
}

async function autoGenerateMaterialRequest() {
    if (!confirm('This will create a material request for all items below reorder point. Continue?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/material-request/auto-generate`, {
            method: 'POST'
        });
        
        const result = await response.json();
        alert(`${result.message}\n\nMaterials: ${result.count}\nRequest ID: ${result.request?.id || 'N/A'}`);
        loadMaterialRequests();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function viewMaterialRequest(id) {
    try {
        const response = await fetch(`${API_URL}/api/material-request/${id}`);
        const req = await response.json();
        
        const itemsList = req.items.map(item => `- ${item.partNumber}: ${item.quantity} ${item.unit}`).join('\n');
        alert(`Material Request Details:\n\nID: ${req.id}\nType: ${req.requestType}\nDate: ${new Date(req.date).toLocaleString()}\nRequired By: ${new Date(req.requiredBy).toLocaleDateString()}\nStatus: ${req.status}\n\nItems:\n${itemsList}`);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function approveMaterialRequest(id) {
    try {
        const response = await fetch(`${API_URL}/api/material-request/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Approved', approvedBy: 'Current User' })
        });
        
        if (response.ok) {
            alert('Material request approved successfully!');
            loadMaterialRequests();
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Stock Ledger Functions
let stockLedger = [];

async function loadStockLedger() {
    try {
        if (window.demoMode && window.demoData && window.demoData.stockLedger) {
            stockLedger = window.demoData.stockLedger;
            console.log('[Stock Ledger] Using demo ledger:', stockLedger.length);
        } else {
            const response = await fetch(`${API_URL}/api/stock-entry/ledger`);
            stockLedger = await response.json();
            const demoLedger = JSON.parse(localStorage.getItem('demoStockLedger') || '[]');
            if (demoLedger.length > 0) stockLedger = [...demoLedger, ...stockLedger];
        }
        renderStockLedgerTable(stockLedger);
        updateLedgerStats();
    } catch (error) {
        console.error('Error loading stock ledger:', error);
    }
}

function renderStockLedgerTable(data) {
    const container = document.getElementById('stockLedgerTable');
    
    if (data.length === 0) {
        container.innerHTML = '<p class="loading">No stock movements recorded yet.</p>';
        return;
    }
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Voucher No</th>
                    <th>Part Number</th>
                    <th>Warehouse</th>
                    <th>Qty Change</th>
                    <th>Balance</th>
                    <th>Entry Type</th>
                </tr>
            </thead>
            <tbody>
                ${data.map((entry, index) => {
                    // Calculate running balance
                    const balance = data.slice(0, index + 1)
                        .filter(e => e.materialId === entry.materialId && e.warehouse === entry.warehouse)
                        .reduce((sum, e) => sum + e.quantityChange, 0);
                    
                    return `
                        <tr>
                            <td>${new Date(entry.date).toLocaleString()}</td>
                            <td><strong>${entry.voucherNo}</strong></td>
                            <td>${entry.partNumber}</td>
                            <td>${entry.warehouse}</td>
                            <td class="${entry.quantityChange > 0 ? 'text-success' : 'text-danger'}">
                                ${entry.quantityChange > 0 ? '+' : ''}${entry.quantityChange}
                            </td>
                            <td><strong>${balance}</strong></td>
                            <td><span class="badge badge-${entry.entryType === 'IN' ? 'success' : 'danger'}">${entry.entryType}</span></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}

function updateLedgerStats() {
    if (!stockLedger || stockLedger.length === 0) {
        document.getElementById('totalStockIn').textContent = '0';
        document.getElementById('totalStockOut').textContent = '0';
        document.getElementById('totalTransactions').textContent = '0';
        return;
    }
    
    const totalIn = stockLedger
        .filter(e => e.entryType === 'IN' || e.entryType === 'in')
        .reduce((sum, e) => sum + Math.abs(e.quantityChange || e.quantity || 0), 0);
    
    const totalOut = stockLedger
        .filter(e => e.entryType === 'OUT' || e.entryType === 'out')
        .reduce((sum, e) => sum + Math.abs(e.quantityChange || e.quantity || 0), 0);
    
    document.getElementById('totalStockIn').textContent = totalIn.toLocaleString();
    document.getElementById('totalStockOut').textContent = totalOut.toLocaleString();
    document.getElementById('totalTransactions').textContent = stockLedger.length;
}

function filterStockLedger() {
    const search = document.getElementById('ledgerMaterialSearch').value.toLowerCase();
    const warehouse = document.getElementById('ledgerWarehouseFilter').value;
    const entryType = document.getElementById('ledgerEntryTypeFilter').value;
    
    let filtered = stockLedger;
    
    if (search) {
        filtered = filtered.filter(e => e.partNumber.toLowerCase().includes(search));
    }
    
    if (warehouse) {
        filtered = filtered.filter(e => e.warehouse === warehouse);
    }
    
    if (entryType) {
        filtered = filtered.filter(e => e.entryType === entryType);
    }
    
    renderStockLedgerTable(filtered);
}

function exportStockLedger() {
    alert('Export feature coming soon! Will export to Excel/CSV.');
}

// Update showSection to load ERPNext features
const originalShowSection = showSection;
showSection = function(sectionId) {
    originalShowSection(sectionId);
    
    if (sectionId === 'stock-entry') loadStockEntries();
    if (sectionId === 'material-request') loadMaterialRequests();
    if (sectionId === 'stock-ledger') loadStockLedger();
};
