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



// Dashboard
async function loadDashboard() {
    try {
        console.log('[Dashboard] Loading dashboard data...');
        const response = await fetch(`${API_URL}/api/analytics/dashboard`);
        dashboardData = await response.json();
        
        console.log('[Dashboard] Data received:', dashboardData);
        
        document.getElementById('totalMaterials').textContent = dashboardData.totalMaterials;
        document.getElementById('lowStockItems').textContent = dashboardData.lowStockItems;
        document.getElementById('turnoverRate').textContent = '85%';
        
        console.log('[Dashboard] Rendering charts...');
        renderCategoryChart(dashboardData.groupings);
        renderTrendChart(dashboardData.groupings);
        renderMaterialsSummary(dashboardData.groupings);
        loadRecentTransactions();
        
        // Load AI Dashboard Analysis automatically
        console.log('[Dashboard] Loading AI analysis...');
        loadAIDashboardAnalysis();
        
        // Automatically analyze low stock if there are any
        if (dashboardData.lowStockItems > 0 && materials.length > 0) {
            console.log('[Dashboard] Low stock detected, analyzing automatically...');
            setTimeout(() => autoAnalyzeLowStock(), 3000);
        } else {
            const statusDiv = document.getElementById('lowStockAIStatus');
            if (statusDiv) {
                statusDiv.innerHTML = '<i class="fas fa-check-circle" style="color: #4caf50;"></i> All stock levels healthy';
            }
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

    // Simulate progress updates
    const progressBar = document.getElementById('aiLoadingProgress');
    const loadingText = document.getElementById('aiLoadingStep');
    const steps = [
        { progress: 10, text: 'Loading 50 materials...' },
        { progress: 30, text: 'Analyzing stock levels...' },
        { progress: 50, text: 'Detecting anomalies...' },
        { progress: 70, text: 'Calculating recommendations...' },
        { progress: 90, text: 'Generating insights...' }
    ];
    
    let currentStep = 0;
    const progressInterval = setInterval(() => {
        if (currentStep < steps.length) {
            progressBar.style.width = steps[currentStep].progress + '%';
            loadingText.textContent = steps[currentStep].text;
            currentStep++;
        }
    }, 800);

    try {
        console.log('[AI] Fetching dashboard analysis from:', `${API_URL}/api/ai/dashboard-analysis`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(`${API_URL}/api/ai/dashboard-analysis`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('[AI] Dashboard analysis received successfully');

        // Complete progress
        progressBar.style.width = '100%';
        loadingText.textContent = 'Analysis complete!';
        
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
        // Main headers - large, colorful
        .replace(/## (.*)/g, '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; border-radius: 8px; margin: 30px 0 20px 0; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);"><h3 style="margin: 0; font-size: 1.4em; font-weight: 600;">$1</h3></div>')
        // Sub headers - clean, simple
        .replace(/### (.*)/g, '<h4 style="color: #667eea; margin: 25px 0 15px 0; font-size: 1.2em; font-weight: 600; padding-left: 15px; border-left: 4px solid #667eea;">$1</h4>')
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #333; font-weight: 600;">$1</strong>')
        // Icons and emojis with better spacing
        .replace(/⚠️/g, '<span style="font-size: 1.3em; margin-right: 8px;">⚠️</span>')
        .replace(/✅/g, '<span style="font-size: 1.3em; margin-right: 8px;">✅</span>')
        .replace(/🔴/g, '<span style="font-size: 1.3em; margin-right: 8px;">🔴</span>')
        .replace(/🟡/g, '<span style="font-size: 1.3em; margin-right: 8px;">🟡</span>')
        .replace(/🟢/g, '<span style="font-size: 1.3em; margin-right: 8px;">🟢</span>')
        .replace(/⬆️/g, '<i class="fas fa-arrow-up" style="color: #4caf50; margin: 0 5px;"></i>')
        .replace(/⬇️/g, '<i class="fas fa-arrow-down" style="color: #f44336; margin: 0 5px;"></i>')
        .replace(/⚡/g, '<i class="fas fa-bolt" style="color: #ff9800; margin: 0 5px;"></i>')
        .replace(/🚀/g, '<i class="fas fa-rocket" style="color: #667eea; margin: 0 5px;"></i>')
        .replace(/🎯/g, '<i class="fas fa-bullseye" style="color: #00bcd4; margin: 0 5px;"></i>')
        .replace(/💪/g, '<i class="fas fa-hand-rock" style="color: #4caf50; margin: 0 5px;"></i>')
        .replace(/📊/g, '<i class="fas fa-chart-bar" style="color: #667eea; margin: 0 5px;"></i>')
        .replace(/📅/g, '<i class="fas fa-calendar" style="color: #00bcd4; margin: 0 5px;"></i>')
        .replace(/🚨/g, '<i class="fas fa-exclamation-triangle" style="color: #f44336; margin: 0 5px;"></i>')
        .replace(/🤖/g, '<i class="fas fa-robot" style="color: #667eea; margin: 0 5px;"></i>')
        .replace(/💰/g, '<i class="fas fa-dollar-sign" style="color: #4caf50; margin: 0 5px;"></i>')
        .replace(/📦/g, '<i class="fas fa-box" style="color: #667eea; margin: 0 5px;"></i>')
        .replace(/💡/g, '<i class="fas fa-lightbulb" style="color: #ffc107; margin: 0 5px;"></i>')
        // Paragraphs with better spacing
        .replace(/\n\n/g, '</p><p style="line-height: 1.8; color: #555; margin: 15px 0; font-size: 1.05em;">')
        .replace(/\n/g, '<br>')
        // Horizontal rules
        .replace(/---/g, '<hr style="border: none; border-top: 2px solid #e0e0e0; margin: 30px 0;">');
}

// Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/api/analytics/dashboard`);
        dashboardData = await response.json();
        
        document.getElementById('totalMaterials').textContent = dashboardData.totalMaterials;
        document.getElementById('totalValue').textContent = `$${parseFloat(dashboardData.totalValue).toLocaleString()}`;
        document.getElementById('lowStockItems').textContent = dashboardData.lowStockItems;
        document.getElementById('turnoverRate').textContent = '85%';
        
        renderCategoryChart(dashboardData.groupings);
        loadRecentTransactions();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

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
    
    console.log('[Chart] Rendering trend chart with', groupings.length, 'groupings');
    
    // Destroy existing chart if it exists
    if (window.trendChartInstance) {
        window.trendChartInstance.destroy();
    }
    
    // Create stock level data
    const labels = groupings.map(g => g.grouping);
    const stockData = groupings.map(g => g.totalStock);
    const lowStockData = groupings.map(g => g.lowStock);
    
    console.log('[Chart] Stock data:', stockData);
    console.log('[Chart] Low stock data:', lowStockData);
    
    window.trendChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Stock',
                    data: stockData,
                    backgroundColor: '#667eea',
                    borderColor: '#667eea',
                    borderWidth: 1
                },
                {
                    label: 'Low Stock Items',
                    data: lowStockData,
                    backgroundColor: '#f5576c',
                    borderColor: '#f5576c',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    console.log('[Chart] Trend chart rendered successfully');
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

// Materials
async function loadMaterials() {
    try {
        console.log('[Materials] Loading materials...');
        const response = await fetch(`${API_URL}/api/materials`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        materials = await response.json();
        console.log('[Materials] Loaded:', materials.length, 'materials');
        
        populateCategoryFilter();
        
        // Only render table if we're on materials section
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
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Part Number</th>
                    <th>Description</th>
                    <th>Project</th>
                    <th>Grouping</th>
                    <th>Stock</th>
                    <th>Unit</th>
                    <th>Reorder Point</th>
                    <th>Status</th>
                    <th>Storage Location</th>
                    <th>AI Analysis</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(m => {
                    const status = m.stock <= m.reorderPoint ? 'critical' : 
                                 m.stock <= m.reorderPoint * 1.5 ? 'low' : 'normal';
                    return `
                        <tr>
                            <td><strong>${m.partNumber}</strong></td>
                            <td>${m.description}</td>
                            <td>${m.project}</td>
                            <td>${m.grouping}</td>
                            <td>${m.stock.toLocaleString()}</td>
                            <td>${m.unit}</td>
                            <td>${m.reorderPoint}</td>
                            <td><span class="status-badge status-${status}">${status.toUpperCase()}</span></td>
                            <td style="font-size: 11px">${m.storageLocation}</td>
                            <td>
                                <button onclick="analyzeMaterial('${m.id}')" class="btn btn-sm btn-primary" style="font-size: 0.75em; padding: 4px 8px;">
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
    const grouping = document.getElementById('categoryFilter').value;
    const search = document.getElementById('materialSearch').value.toLowerCase();
    const lowStockOnly = document.getElementById('lowStockFilter').checked;
    
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
        const response = await fetch(`${API_URL}/api/stock-entry`);
        stockEntries = await response.json();
        
        // Merge with demo data if exists
        const demoEntries = JSON.parse(localStorage.getItem('demoStockEntries') || '[]');
        if (demoEntries.length > 0) {
            // Convert demo entries to match expected format
            const formattedDemoEntries = demoEntries.map(entry => ({
                id: entry.id,
                entryType: entry.entryType,
                date: entry.date,
                items: [{
                    partNumber: entry.partNumber,
                    description: entry.description,
                    quantity: entry.quantity,
                    unit: entry.unit
                }],
                sourceWarehouse: entry.direction === 'OUT' ? entry.warehouse : '-',
                targetWarehouse: entry.direction === 'IN' ? entry.warehouse : '-',
                totalAmount: parseFloat(entry.cost),
                status: entry.status
            }));
            stockEntries = [...formattedDemoEntries, ...stockEntries];
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
        const response = await fetch(`${API_URL}/api/material-request`);
        materialRequests = await response.json();
        
        // Merge with demo data if exists
        const demoRequests = JSON.parse(localStorage.getItem('demoMaterialRequests') || '[]');
        if (demoRequests.length > 0) {
            // Convert demo requests to match expected format
            const formattedDemoRequests = demoRequests.map(req => ({
                id: req.id,
                requestType: req.requestType,
                date: req.createdDate,
                items: [{
                    partNumber: req.partNumber,
                    description: req.description,
                    quantity: req.quantity,
                    unit: req.unit
                }],
                requiredDate: req.requiredDate,
                status: req.status,
                totalAmount: parseFloat(req.estimatedCost),
                project: req.project
            }));
            materialRequests = [...formattedDemoRequests, ...materialRequests];
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
        const response = await fetch(`${API_URL}/api/stock-entry/ledger`);
        stockLedger = await response.json();
        
        // Merge with demo data if exists
        const demoLedger = JSON.parse(localStorage.getItem('demoStockLedger') || '[]');
        if (demoLedger.length > 0) {
            stockLedger = [...demoLedger, ...stockLedger];
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
