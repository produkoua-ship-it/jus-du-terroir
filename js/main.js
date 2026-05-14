// Core Logic for Jus de Terroir Dashboard Elite v1.0.3 - Fixed

// --- GLOBAL FUNCTIONS ---

window.renderView = async function(viewName) {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.classList.add('fade-out');
    
    setTimeout(() => {
        let htmlContent = '';
        try {
            switch(viewName) {
                case 'dashboard': htmlContent = renderDashboard(); break;
                case 'inventory': htmlContent = renderInventory(); break;
                case 'sales': htmlContent = renderSales(); break;
                case 'expenses': htmlContent = renderExpenses(); break;
                case 'reports': htmlContent = renderReports(); break;
                case 'settings': htmlContent = renderSettings(); break;
                default: htmlContent = `<div class="py-20 text-center font-bold uppercase tracking-widest text-xs text-gray-400">Vue non trouvée</div>`;
            }
        } catch (err) {
            console.error("Render Error:", err);
            htmlContent = `<div class="py-20 text-center text-terroir-primary font-bold">Erreur d'affichage : ${err.message}</div>`;
        }
        
        container.innerHTML = htmlContent;
        if (window.lucide) lucide.createIcons();
        if (window.initCharts) window.initCharts(viewName);
        
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.remove('active-tab');
            if (l.getAttribute('data-view') === viewName) l.classList.add('active-tab');
        });

        window.scrollTo({ top: 0, behavior: 'auto' });
        container.classList.remove('fade-out');
        container.classList.add('fade-in');
        setTimeout(() => container.classList.remove('fade-in'), 300);
    }, 250);
};

// --- MODALS ---

window.openSaleModal = function() {
    const modal = document.getElementById('sale-modal');
    if (!modal) return;
    
    const grid = document.getElementById('product-grid');
    if (grid && window.State && window.State.inventory) {
        const flavorMap = {
            'Bissap': { icon: '🌺', color: 'bg-red-50 text-red-600' },
            'Citron': { icon: '🍋', color: 'bg-yellow-50 text-yellow-600' },
            'Gingembre': { icon: '🫚', color: 'bg-orange-50 text-orange-600' },
            'Passion': { icon: '🫐', color: 'bg-purple-50 text-purple-600' },
            'Baobab': { icon: '🥥', color: 'bg-stone-50 text-stone-600' },
            'Tomi': { icon: '🥜', color: 'bg-amber-900/10 text-amber-900' }
        };

        const sorted = [...window.State.inventory].sort((a, b) => (a.size === 'Grand' ? -1 : 1));
        grid.innerHTML = sorted.map(item => {
            const key = Object.keys(flavorMap).find(k => item.name.toLowerCase().includes(k.toLowerCase()));
            const flavor = flavorMap[key] || { icon: '🥤', color: 'bg-gray-50 text-gray-400' };
            return `
                <button type="button" onclick="window.selectProduct('${item.id}', this)" 
                        class="product-card p-3 rounded-2xl bg-gray-50 border-2 border-transparent flex flex-col items-center gap-2 transition-all active:scale-95">
                    <div class="w-10 h-10 ${flavor.color} rounded-xl flex items-center justify-center text-xl">${flavor.icon}</div>
                    <div class="text-center">
                        <p class="text-[9px] font-black text-terroir-secondary leading-tight">${item.name}</p>
                        <p class="text-[8px] text-gray-400 font-bold uppercase">${Utils.formatCurrency(item.price)}</p>
                    </div>
                </button>`;
        }).join('');
    }
    document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
    modal.classList.remove('hidden'); modal.classList.add('flex');
};

window.selectProduct = (id, el) => {
    document.querySelectorAll('.product-card').forEach(c => c.classList.remove('border-terroir-primary', 'bg-terroir-primary/5', 'ring-2'));
    el.classList.add('border-terroir-primary', 'bg-terroir-primary/5', 'ring-2');
    document.getElementById('sale-product').value = id;
};

window.openStockModal = () => {
    const m = document.getElementById('stock-modal');
    document.getElementById('prod-date').value = new Date().toISOString().split('T')[0];
    
    // Populate flavors from inventory
    const select = document.getElementById('prod-flavor');
    if (select && State.inventory) {
        const flavors = [...new Set(State.inventory.map(i => i.name.split(' (')[0]))];
        select.innerHTML = '<option value="">Choisir...</option>' + 
            flavors.map(f => `<option value="${f}">${f}</option>`).join('');
    }
    
    m.classList.remove('hidden'); m.classList.add('flex');
};

window.openNewProductModal = () => {
    const m = document.getElementById('product-modal');
    m.classList.remove('hidden'); m.classList.add('flex');
};

window.openExpenseModal = () => {
    const m = document.getElementById('expense-modal');
    document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
    m.classList.remove('hidden'); m.classList.add('flex');
};

window.toggleActionMenu = () => {
    const overlay = document.getElementById('quick-action-overlay');
    const icon = document.getElementById('plus-icon');
    if (!overlay.classList.contains('active')) {
        overlay.classList.add('active');
        if (icon) icon.style.transform = 'rotate(45deg)';
    } else {
        overlay.classList.remove('active');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
};

// --- CHARTS ---

window.initCharts = (viewName) => {
    if (!window.Chart) return;
    if (window.myDashboardChart) window.myDashboardChart.destroy();
    if (window.myReportsChart) window.myReportsChart.destroy();

    if (viewName === 'dashboard') {
        const ctx = document.getElementById('dashboardChart');
        if (!ctx) return;
        window.myDashboardChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                datasets: [{
                    label: 'Ventes',
                    data: [12000, 19000, 15000, 25000, 22000, 30000, 18000],
                    borderColor: '#C8265A', backgroundColor: 'rgba(200, 38, 90, 0.1)',
                    tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#C8265A'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false } } } }
        });
    }

    if (viewName === 'reports') {
        const ctx = document.getElementById('reportsChart');
        if (!ctx) return;
        const stats = State.getFilteredStats(window.currentReportFilter || 'month', window.selectedReportDate);
        window.myReportsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Entrées', 'Sorties'],
                datasets: [{
                    data: [stats.revenue || 1, stats.expense || 0],
                    backgroundColor: ['#6CA742', '#C8265A'], borderWidth: 0, cutout: '80%'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }
};

// --- SETTINGS LOGIC ---

window.saveSettings = async function() {
    const btn = event.currentTarget;
    const original = btn.innerHTML;
    btn.innerHTML = 'Enregistrement...';
    
    try {
        // Save Prices & Limits
        const prices = document.querySelectorAll('.price-input');
        for (let input of prices) {
            const id = input.getAttribute('data-id');
            const price = parseInt(input.value);
            const limitInput = document.querySelector(`[data-limit-id="${id}"]`);
            const limit = limitInput ? parseInt(limitInput.value) : 5;
            await State.updatePrice(id, price, limit);
        }

        // Save PIN & Biometrics
        const pin = document.getElementById('set-pin').value;
        await State.updateSettings('pin', pin);
        
        Utils.showToast("Réglages sauvegardés !");
        window.renderView('settings');
    } catch (e) {
        Utils.showToast("Erreur lors de la sauvegarde", "error");
    } finally {
        btn.innerHTML = original;
    }
};

window.toggleBiometrics = async () => {
    const newValue = !State.settings.useBiometrics;
    await State.updateSettings('useBiometrics', newValue);
    window.renderView('settings');
};

// --- AUTH LOGIC ---

window.enterPin = (digit) => {
    if (!window.currentPin) window.currentPin = "";
    if (window.currentPin.length >= 4) return;
    window.currentPin += digit;
    updatePinDisplay();
    if (window.currentPin.length === 4) {
        setTimeout(() => {
            if (window.currentPin === State.settings.pin) {
                document.getElementById('lock-screen').classList.add('hidden');
                Utils.showToast("Bienvenue Alida Edwige !");
            } else {
                window.currentPin = ""; updatePinDisplay();
                Utils.showToast("Code PIN incorrect", "error");
            }
        }, 300);
    }
};

window.clearPin = () => { window.currentPin = ""; updatePinDisplay(); };

function updatePinDisplay() {
    const dots = document.querySelectorAll('#pin-display div');
    dots.forEach((dot, i) => {
        if (i < (window.currentPin || "").length) dot.classList.add('bg-terroir-primary', 'border-terroir-primary');
        else dot.classList.remove('bg-terroir-primary', 'border-terroir-primary');
    });
}

window.authenticateBiometric = async () => {
    try {
        const challenge = new Uint8Array(32); window.crypto.getRandomValues(challenge);
        await navigator.credentials.create({
            publicKey: { challenge, rp: { name: "Jus du Terroir" }, user: { id: new Uint8Array(16), name: "alida", displayName: "Alida" }, pubKeyCredParams: [{ alg: -7, type: "public-key" }], authenticatorSelection: { userVerification: "required" }, timeout: 60000 }
        });
        document.getElementById('lock-screen').classList.add('hidden');
    } catch (e) { Utils.showToast("Annulé", "error"); }
};

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', async () => {
    await State.init();
    window.renderView('dashboard');
    
    if (State.settings.pin && State.settings.pin.length === 4) {
        document.getElementById('lock-screen').classList.remove('hidden');
        if (window.PublicKeyCredential && await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
            document.getElementById('biometric-btn')?.classList.remove('hidden');
            if (State.settings.useBiometrics) setTimeout(() => window.authenticateBiometric(), 500);
        }
    }
});

// --- RENDER FUNCTIONS (Templates) ---

function renderDashboard() {
    const stats = State.getStats();
    return `
        <div class="animate-pop">
            <h2 class="text-2xl font-black mb-1 text-terroir-secondary">Bonjour Alida Edwige 👋</h2>
            <p class="text-gray-400 text-sm font-medium mb-8">L'état de votre activité aujourd'hui.</p>
            
            ${window.AIAssistant ? AIAssistant.renderAssistantUI() : ''}
            
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
                    <p class="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 text-terroir-success">Ventes Jour</p>
                    <h3 class="text-xl font-black text-terroir-secondary">${Utils.formatCurrency(stats.totalRevenue)}</h3>
                </div>
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
                    <p class="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 text-terroir-primary">Dépenses</p>
                    <h3 class="text-xl font-black text-terroir-secondary">${Utils.formatCurrency(stats.totalExpense)}</h3>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-8">
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex items-center gap-4">
                    <div class="w-12 h-12 bg-terroir-accent/10 rounded-2xl flex items-center justify-center text-xl text-terroir-accent">🍾</div>
                    <div>
                        <p class="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Grands Formats</p>
                        <h3 class="text-xl font-black text-terroir-secondary">${stats.totalGrands || 0} <span class="text-[10px] text-gray-400">btles</span></h3>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex items-center gap-4">
                    <div class="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-xl text-pink-600">🍼</div>
                    <div>
                        <p class="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Petits Formats</p>
                        <h3 class="text-xl font-black text-terroir-secondary">${stats.totalPetits || 0} <span class="text-[10px] text-gray-400">btles</span></h3>
                    </div>
                </div>
            </div>

            <div class="bg-terroir-secondary rounded-[2.5rem] p-6 mb-8 text-white shadow-xl flex flex-col gap-4">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="text-[10px] font-black uppercase text-white/50 mb-1 tracking-widest">Bénéfice Net Global</p>
                        <h3 class="text-2xl font-black text-terroir-success">${Utils.formatCurrency(stats?.totalProfit || 0)}</h3>
                    </div>
                    <div class="bg-white/10 p-3 rounded-2xl text-center">
                        <p class="text-[8px] font-black uppercase text-white/40 mb-1">Alertes</p>
                        <h3 class="text-xs font-black">${stats.lowStockItems || 0} Stock</h3>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 mb-8 h-64">
                <canvas id="dashboardChart"></canvas>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 class="font-black text-lg mb-4 flex items-center justify-between">Ventes Récentes <button onclick="window.renderView('sales')" class="text-terroir-primary text-[10px] font-black uppercase">Voir tout</button></h3>
                    <div class="space-y-3">
                        ${(State.recentSales || []).slice(0, 3).map(s => `
                            <div class="bg-white p-4 rounded-3xl flex items-center justify-between border border-gray-50 shadow-sm">
                                <div class="flex items-center gap-4"><div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">🛍️</div><div><p class="font-bold text-sm">${s.items || 'Vente'}</p><p class="text-[10px] text-gray-400">${new Date(s.date).toLocaleDateString()}</p></div></div>
                                <p class="font-black text-terroir-success">${Utils.formatCurrency(s.total || 0)}</p>
                            </div>`).join('') || '<p class="text-center text-gray-300 py-4 text-xs">Aucune vente récente</p>'}
                    </div>
                </div>

                <div>
                    <h3 class="font-black text-lg mb-4 flex items-center justify-between">Productions <button onclick="window.renderView('inventory')" class="text-terroir-primary text-[10px] font-black uppercase">Gérer</button></h3>
                    <div class="space-y-3">
                        ${(State.productions || []).slice(0, 3).map(p => `
                            <div class="bg-white p-4 rounded-3xl flex items-center justify-between border border-gray-50 shadow-sm">
                                <div class="flex items-center gap-4"><div class="w-10 h-10 bg-terroir-primary/5 text-terroir-primary rounded-xl flex items-center justify-center">🧪</div><div><p class="font-bold text-sm">${p.items || 'Production'}</p><p class="text-[10px] text-gray-400">${new Date(p.date).toLocaleDateString()}</p></div></div>
                                <p class="font-black text-terroir-secondary">Mis en bouteille</p>
                            </div>`).join('') || '<p class="text-center text-gray-300 py-4 text-xs">Aucune production</p>'}

                    </div>
                </div>
            </div>
        </div>`;
}

function renderBackButton() {
    return `
        <button onclick="window.renderView('dashboard')" class="mb-8 flex items-center gap-3 bg-white/50 backdrop-blur-md border border-white/50 py-2 px-4 rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all group">
            <div class="w-7 h-7 rounded-xl bg-terroir-primary text-white flex items-center justify-center shadow-lg shadow-terroir-primary/30 group-hover:-translate-x-1 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest text-terroir-secondary">Retour</span>
        </button>
    `;
}

function renderInventory() {
    return `
        <div class="animate-pop">
            ${renderBackButton()}
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h2 class="text-2xl font-black">Mon Stock</h2>
                    <p class="text-gray-400 text-sm font-medium">Gestion par format.</p>
                </div>
                <button onclick="window.openStockModal()" class="w-12 h-12 bg-terroir-primary text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                </button>
            </div>

            <div class="grid grid-cols-2 gap-3 items-start">
                <!-- COLUMN GRANDS -->
                <div class="space-y-3">
                    <div class="bg-terroir-secondary rounded-2xl p-3 text-center mb-2">
                        <p class="text-[9px] font-black text-white uppercase tracking-widest">Grands</p>
                    </div>
                    ${(State.inventory || [])
                        .filter(i => i.name.toLowerCase().includes('grand'))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(i => renderStockCard(i)).join('')}
                </div>

                <!-- COLUMN PETITS -->
                <div class="space-y-3">
                    <div class="bg-terroir-primary rounded-2xl p-3 text-center mb-2">
                        <p class="text-[9px] font-black text-white uppercase tracking-widest">Petits</p>
                    </div>
                    ${(State.inventory || [])
                        .filter(i => i.name.toLowerCase().includes('petit'))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(i => renderStockCard(i)).join('')}
                </div>
            </div>
        </div>`;
}

function renderStockCard(i) {
    const low = i.stock <= (i.critical_limit || 5);
    const flavor = i.name.split(' (')[0];
    return `
        <div class="bg-white p-4 rounded-[2rem] border ${low ? 'border-terroir-primary/20 bg-terroir-primary/[0.02]' : 'border-gray-50'} shadow-sm flex flex-col gap-3 relative overflow-hidden">
            ${low ? '<div class="absolute top-0 right-0 w-2 h-full bg-terroir-primary animate-pulse"></div>' : ''}
            <div class="flex flex-col">
                <h4 class="font-black text-[10px] text-terroir-secondary uppercase leading-tight">${flavor}</h4>
            </div>
            <div class="flex items-end justify-between">
                <p class="text-xl font-black ${low ? 'text-terroir-primary' : 'text-terroir-secondary'} leading-none">${i.stock || 0}</p>
                <p class="text-[8px] text-gray-400 font-bold uppercase">btles</p>
            </div>
        </div>`;
}

function renderSales() {
    const sorted = [...(State.recentSales || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    return `<div class="animate-pop">${renderBackButton()}<h2 class="text-2xl font-black mb-8">Historique</h2><div class="space-y-4">${sorted.map(s => `<div class="bg-white p-5 rounded-[2rem] border border-gray-50 shadow-sm flex items-center justify-between"><div class="flex items-center gap-4"><div class="w-12 h-12 bg-terroir-success/5 text-terroir-success rounded-2xl flex items-center justify-center">🛍️</div><div><h4 class="font-black text-sm">${s.items || 'Produit'}</h4><p class="text-[10px] text-gray-400">${new Date(s.date).toLocaleDateString()}</p></div></div><p class="font-black text-terroir-success">${Utils.formatCurrency(s.total)}</p></div>`).join('')}</div></div>`;
}

function renderExpenses() {
    const selectedDate = window.currentExpenseDate || new Date().toISOString().split('T')[0];
    const filtered = (State.expenses || []).filter(e => {
        const d = new Date(e.date).toISOString().split('T')[0];
        return d === selectedDate;
    });
    const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
        <div class="animate-pop">
            ${renderBackButton()}
            <div class="flex justify-between items-center mb-8">
                <h2 class="text-2xl font-black">Dépenses</h2>
                <div class="relative">
                    <input type="date" value="${selectedDate}" 
                        onchange="window.currentExpenseDate = this.value; renderView('expenses')"
                        class="bg-white border border-gray-100 rounded-2xl p-3 text-[10px] font-black uppercase outline-none shadow-sm text-terroir-secondary">
                </div>
            </div>
            
            <div class="space-y-4">
                ${sorted.map(e => `
                    <div class="bg-white p-5 rounded-[2rem] border border-gray-50 shadow-sm flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-terroir-accent/5 text-terroir-accent rounded-2xl flex items-center justify-center">💸</div>
                            <div>
                                <h4 class="font-black text-sm">${e.item || 'Dépense'}</h4>
                                <p class="text-[10px] text-gray-400">${new Date(e.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <p class="font-black text-terroir-primary">-${Utils.formatCurrency(e.amount)}</p>
                    </div>
                `).join('') || `
                    <div class="py-20 text-center">
                        <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📅</div>
                        <p class="text-gray-400 font-bold text-sm uppercase tracking-widest">Aucune dépense ce jour</p>
                    </div>
                `}
            </div>
        </div>`;
}

function renderReports() {
    const filter = window.currentReportFilter || 'month';
    const stats = State.getFilteredStats(filter, window.selectedReportDate);
    return `<div class="animate-pop">${renderBackButton()}<h2 class="text-2xl font-black mb-8">Bilan Financier</h2>
        <div class="flex gap-3 mb-8"><select onchange="window.currentReportFilter=this.value; window.renderView('reports')" class="bg-white border border-gray-100 rounded-2xl p-4 text-[10px] font-black uppercase outline-none shadow-sm"><option value="today" ${filter==='today'?'selected':''}>Aujourd'hui</option><option value="week" ${filter==='week'?'selected':''}>Semaine</option><option value="month" ${filter==='month'?'selected':''}>Mois</option></select></div>
        <div class="bg-terroir-secondary rounded-[2.5rem] p-10 mb-8 text-center text-white shadow-2xl relative overflow-hidden"><p class="text-[10px] font-black uppercase text-white/40 mb-2 tracking-widest">Bénéfice Net</p><h3 class="text-4xl font-black mb-6 text-terroir-success">${Utils.formatCurrency(stats.profit)}</h3><div class="grid grid-cols-2 gap-4 border-t border-white/10 pt-6"><div><p class="text-[9px] text-white/40">Entrées</p><p class="font-black text-terroir-success">+${Utils.formatCurrency(stats.revenue)}</p></div><div><p class="text-[9px] text-white/40">Sorties</p><p class="font-black text-terroir-primary">-${Utils.formatCurrency(stats.expense)}</p></div></div></div>
        <div class="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 h-64"><canvas id="reportsChart"></canvas></div>
    </div>`;
}

function renderSettings() {
    return `
        <div class="animate-pop">
            ${renderBackButton()}
            <h2 class="text-2xl font-black mb-8 text-terroir-secondary">Paramètres</h2>
            
            <div class="bg-gradient-to-br from-terroir-primary to-pink-600 rounded-[2.5rem] p-8 text-white shadow-xl mb-8">
                <h3 class="text-xl font-black mb-2">Création Originale Refontiq</h3>
                <p class="text-xs text-white/80 font-medium leading-relaxed">Conçu exclusivement pour l'excellence de "Jus du Terroir" par Alida Edwige.</p>
            </div>

            <div class="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 mb-8">
                <h3 class="font-black text-lg mb-6 flex items-center gap-3 text-terroir-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-terroir-primary"><rect width="20" height="12" x="2" y="9" rx="2" ry="2"/><path d="M7 9V5a5 5 0 0 1 10 0v4"/></svg>
                    Sécurité App
                </h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <p class="font-bold text-sm">Code PIN</p>
                        <input type="password" maxlength="4" placeholder="0000" id="set-pin" value="${State.settings.pin || ''}" class="w-20 bg-white border border-gray-100 rounded-xl p-2 text-center font-black tracking-widest outline-none">
                    </div>
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <p class="font-bold text-sm">Empreinte / FaceID</p>
                        <button onclick="window.toggleBiometrics()" class="w-12 h-6 rounded-full relative transition-all duration-300 ${State.settings.useBiometrics ? 'bg-terroir-success' : 'bg-gray-200'}">
                            <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${State.settings.useBiometrics ? 'translate-x-6' : ''}"></div>
                        </button>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 mb-8">
                <h3 class="font-black text-lg mb-6 flex items-center gap-3 text-terroir-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-terroir-primary"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    Prix & Alertes Stock
                </h3>
                <div class="space-y-3">
                    ${(State.inventory || []).sort((a, b) => a.name.localeCompare(b.name)).map(item => `
                        <div class="p-4 bg-gray-50 rounded-2xl flex flex-col gap-3">
                            <p class="font-black text-xs text-terroir-secondary uppercase tracking-wider">${item.name || 'Produit'}</p>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <p class="text-[8px] font-black uppercase text-gray-400 mb-1">Prix (CFA)</p>
                                    <input type="number" data-id="${item.id}" value="${item.price || 0}" class="price-input w-full bg-white border border-gray-100 rounded-xl p-2 font-black text-sm outline-none">
                                </div>
                                <div>
                                    <p class="text-[8px] font-black uppercase text-gray-400 mb-1">Alerte (Qté)</p>
                                    <input type="number" data-limit-id="${item.id}" value="${item.critical_limit || 5}" class="w-full bg-white border border-gray-100 rounded-xl p-2 font-black text-sm outline-none">
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <button onclick="window.saveSettings()" class="w-full bg-terroir-secondary text-white font-black py-5 rounded-[1.5rem] shadow-xl active:scale-95 transition-all">Sauvegarder les réglages</button>
            <button onclick="window.exportToCSV()" class="w-full mt-4 bg-white border border-gray-100 text-terroir-secondary font-black py-5 rounded-[1.5rem] active:scale-95 transition-all">Exporter CSV</button>
        </div>`;
}

window.exportToCSV = () => {
    let csv = "Date;Type;Details;Montant\n";
    State.recentSales.forEach(s => csv += `${new Date(s.date).toLocaleDateString()};Vente;${s.items};${s.total}\n`);
    State.expenses.forEach(e => csv += `${new Date(e.date).toLocaleDateString()};Depense;${e.item};${e.amount}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Rapport_Terroir_${new Date().toLocaleDateString()}.csv`; a.click();
};

// --- FORM SUBMISSIONS ---

document.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = e.target.id;
    if (id === 'form-sale') {
        const prodId = document.getElementById('sale-product').value;
        const qty = parseInt(document.getElementById('sale-qty').value);
        if (!prodId) return Utils.showToast("Choisissez un produit", "error");
        
        const item = (State.inventory || []).find(i => i.id == prodId);
        if (!item) return Utils.showToast("Produit introuvable", "error");
        
        const total = (item.price || 0) * qty;
        await State.addSale(item.name, total);
        
        document.getElementById('sale-modal').classList.add('hidden');
        Utils.showToast("Vente enregistrée !");
        window.renderView('sales');
    }
    if (id === 'form-stock') {
        const f = document.getElementById('prod-flavor').value;
        const qp = parseInt(document.getElementById('prod-qty-petit').value) || 0;
        const qg = parseInt(document.getElementById('prod-qty-grand').value) || 0;
        await State.addProduction(f, qp, qg);
        document.getElementById('stock-modal').classList.add('hidden');
        Utils.showToast("Stock mis à jour !");
        window.renderView('inventory');
    }
    if (id === 'form-expense') {
        const item = document.getElementById('exp-item').value;
        const amt = parseInt(document.getElementById('exp-amount').value);
        await State.addGeneralExpense(item, amt);
        document.getElementById('expense-modal').classList.add('hidden');
        Utils.showToast("Dépense enregistrée !");
        window.renderView('expenses');
    }
    if (id === 'form-new-product') {
        const flavor = document.getElementById('new-flavor').value;
        const pPetit = parseInt(document.getElementById('new-price-petit').value);
        const pGrand = parseInt(document.getElementById('new-price-grand').value);
        const limit = parseInt(document.getElementById('new-limit').value);
        
        await State.addNewProduct(flavor, pPetit, pGrand, limit);
        document.getElementById('product-modal').classList.add('hidden');
        Utils.showToast("Nouveau produit créé !");
        window.renderView('inventory');
    }
});
