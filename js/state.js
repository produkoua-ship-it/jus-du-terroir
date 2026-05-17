// State management and Supabase Cloud Database Integration (Local-First Offline Architected)

const supabaseUrl = 'https://saybrhjnzivcblmkcdgj.supabase.co';
const supabaseKey = 'sb_publishable_WfaiELUt2LRkodCmBKhnjA_-DFF4mHE';
const supabaseClient = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

const defaultInventory = [
    { id: '1_P', name: 'Bissap (Petit)', category: 'Fleur', size: 'Petit', price: 500, stock: 45, critical_limit: 5, last_updated: new Date().toISOString() },
    { id: '1_G', name: 'Bissap (Grand)', category: 'Fleur', size: 'Grand', price: 1000, stock: 30, critical_limit: 5, last_updated: new Date().toISOString() },
    { id: '2_P', name: 'Gingembre (Petit)', category: 'Racine', size: 'Petit', price: 700, stock: 25, critical_limit: 5, last_updated: new Date().toISOString() },
    { id: '2_G', name: 'Gingembre (Grand)', category: 'Racine', size: 'Grand', price: 1200, stock: 15, critical_limit: 5, last_updated: new Date().toISOString() },
    { id: '3_P', name: 'Citron (Petit)', category: 'Fruit', size: 'Petit', price: 500, stock: 10, critical_limit: 5, last_updated: new Date().toISOString() },
    { id: '3_G', name: 'Citron (Grand)', category: 'Fruit', size: 'Grand', price: 1000, stock: 5, critical_limit: 5, last_updated: new Date().toISOString() },
    { id: '4_P', name: 'Passion (Petit)', category: 'Fruit', size: 'Petit', price: 700, stock: 12, critical_limit: 5, last_updated: new Date().toISOString() },
    { id: '4_G', name: 'Passion (Grand)', category: 'Fruit', size: 'Grand', price: 1300, stock: 8, critical_limit: 5, last_updated: new Date().toISOString() },
    { id: '5_P', name: 'Tomi (Petit)', category: 'Fruit', size: 'Petit', price: 600, stock: 20, critical_limit: 5, last_updated: new Date().toISOString() },
    { id: '5_G', name: 'Tomi (Grand)', category: 'Fruit', size: 'Grand', price: 1100, stock: 10, critical_limit: 5, last_updated: new Date().toISOString() },
    { id: '6_P', name: 'Baobab (Petit)', category: 'Fruit', size: 'Petit', price: 600, stock: 18, critical_limit: 5, last_updated: new Date().toISOString() },
    { id: '6_G', name: 'Baobab (Grand)', category: 'Fruit', size: 'Grand', price: 1100, stock: 12, critical_limit: 5, last_updated: new Date().toISOString() },
];

const State = {
    inventory: [],
    recentSales: [],
    productions: [],
    expenses: [],
    isOnline: navigator.onLine,
    isSyncing: false,

    settings: {
        theme: localStorage.getItem('terroir-theme') || 'light',
        notifications: true,
        businessName: 'Jus du Terroir',
        pin: localStorage.getItem('terroir-pin') || null,
        useBiometrics: false
    },

    // Helper functions for Local Storage
    saveLocal: function(key, data) {
        localStorage.setItem('terroir-' + key, JSON.stringify(data));
    },

    loadLocal: function(key, defaultValue = []) {
        const data = localStorage.getItem('terroir-' + key);
        try {
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error("Error parsing local terroir-" + key, e);
            return defaultValue;
        }
    },

    getPendingActions: function() {
        return this.loadLocal('pending-actions', []);
    },

    savePendingActions: function(actions) {
        this.saveLocal('pending-actions', actions);
    },

    queueAction: function(type, data) {
        const actions = this.getPendingActions();
        const action = {
            id: 'A-' + Math.floor(Math.random() * 10000000),
            type,
            data,
            timestamp: new Date().toISOString()
        };
        actions.push(action);
        this.savePendingActions(actions);
        this.updateSyncStatusIndicator(this.isOnline);
        
        if (this.isOnline) {
            this.processPendingActions().catch(err => console.error("Error processing pending action:", err));
        }
    },

    init: async function() {
        try {
            console.log("Initializing local-first state...");
            
            // 1. Load from localStorage immediately for Instant Startup
            this.inventory = this.loadLocal('inventory', []);
            if (this.inventory.length === 0) {
                console.warn("Local inventory empty. Using default inventory.");
                this.inventory = defaultInventory;
                this.saveLocal('inventory', this.inventory);
            }
            
            this.recentSales = this.loadLocal('sales', []);
            this.productions = this.loadLocal('productions', []);
            this.expenses = this.loadLocal('expenses', []);
            
            // Load and apply settings
            const localSettings = this.loadLocal('settings', null);
            if (localSettings) {
                this.settings = { ...this.settings, ...localSettings };
            }
            
            // Keep theme & PIN backward compatible with existing settings
            const legacyTheme = localStorage.getItem('terroir-theme');
            if (legacyTheme) this.settings.theme = legacyTheme;
            const legacyPin = localStorage.getItem('terroir-pin');
            if (legacyPin) this.settings.pin = legacyPin;

            this.applyTheme(this.settings.theme);

            // 2. Render UI immediately (loaded from local cache in <1ms)
            this.triggerUIRefresh();

            // 3. Listen to network connectivity
            this.isOnline = navigator.onLine;
            this.updateSyncStatusIndicator(this.isOnline);

            window.addEventListener('online', () => this.setOnlineStatus(true));
            window.addEventListener('offline', () => this.setOnlineStatus(false));

            // 4. Background Sync with Cloud (non-blocking)
            if (supabaseClient) {
                this.syncWithCloud().catch(err => console.error("Initial background sync failed:", err));
            } else {
                console.warn("Supabase client is not available. Operating in Offline Mode.");
            }
        } catch (e) {
            console.error("Critical State Initialization Error:", e);
            Utils.showToast("Erreur d'initialisation locale", "error");
            this.inventory = defaultInventory;
        }
    },

    setOnlineStatus: function(isOnline) {
        this.isOnline = isOnline;
        console.log(`Network Status updated to: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
        
        this.updateSyncStatusIndicator(isOnline);
        
        if (isOnline) {
            Utils.showToast("Connexion internet détectée", "success");
            // Delay sync slightly to allow connection stabilization
            setTimeout(() => {
                this.syncWithCloud().catch(err => console.error("Cloud sync failed:", err));
                this.processPendingActions().catch(err => console.error("Pending actions processing failed:", err));
            }, 1000);
        } else {
            Utils.showToast("Mode hors connexion activé", "info");
        }
    },

    updateSyncStatusIndicator: function(isOnline, state = '') {
        const badges = document.querySelectorAll('.network-badge');
        if (badges.length === 0) return;

        const pendingCount = this.getPendingActions().length;
        let badgeHTML = '';

        if (!isOnline) {
            badgeHTML = `
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Hors ligne ${pendingCount > 0 ? `(${pendingCount} en attente)` : ''}</span>
            `;
            badges.forEach(b => {
                b.className = "network-badge flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 no-print";
                b.innerHTML = badgeHTML;
            });
        } else if (state === 'syncing') {
            badgeHTML = `
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span>Synchro...</span>
            `;
            badges.forEach(b => {
                b.className = "network-badge flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20 no-print";
                b.innerHTML = badgeHTML;
            });
        } else if (pendingCount > 0) {
            badgeHTML = `
                <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <span>Synchro en attente (${pendingCount})</span>
            `;
            badges.forEach(b => {
                b.className = "network-badge flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 no-print";
                b.innerHTML = badgeHTML;
            });
        } else {
            badgeHTML = `
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>En ligne</span>
            `;
            badges.forEach(b => {
                b.className = "network-badge flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 no-print";
                b.innerHTML = badgeHTML;
            });
        }
    },

    processPendingActions: async function() {
        if (this.isSyncing) return;
        if (!supabaseClient || !this.isOnline) return;

        const actions = this.getPendingActions();
        if (actions.length === 0) return;

        this.isSyncing = true;
        this.updateSyncStatusIndicator(true, 'syncing');
        console.log(`Syncing ${actions.length} offline actions to Supabase...`);

        let successCount = 0;
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            let success = false;
            try {
                switch (action.type) {
                    case 'addSale':
                        const { error: saleErr } = await supabaseClient.from('sales').insert([action.data]);
                        if (!saleErr) success = true;
                        else console.error("Error inserting sale:", saleErr);
                        break;
                    case 'addProduction':
                        const { error: prodErr } = await supabaseClient.from('productions').insert([action.data]);
                        if (!prodErr) success = true;
                        else console.error("Error inserting production:", prodErr);
                        break;
                    case 'addNewProduct':
                        const { error: newProdErr } = await supabaseClient.from('inventory').insert(action.data);
                        if (!newProdErr) success = true;
                        else console.error("Error inserting product:", newProdErr);
                        break;
                    case 'addGeneralExpense':
                        const { error: expErr } = await supabaseClient.from('expenses').insert([action.data]);
                        if (!expErr) success = true;
                        else console.error("Error inserting expense:", expErr);
                        break;
                    case 'updateStock':
                    case 'updatePrice':
                        const { error: stockErr } = await supabaseClient.from('inventory').upsert([action.data]);
                        if (!stockErr) success = true;
                        else console.error("Error updating inventory:", stockErr);
                        break;
                    case 'updateSettings':
                        const { error: setErr } = await supabaseClient.from('app_settings').upsert([action.data]);
                        if (!setErr) success = true;
                        else console.error("Error updating settings:", setErr);
                        break;
                }
            } catch (err) {
                console.error(`Error in queue execution for action ${action.type}:`, err);
            }

            if (success) {
                successCount++;
            } else {
                console.warn(`Sync queue blocked at action ${action.type}. Retrying later.`);
                break;
            }
        }

        if (successCount > 0) {
            const remaining = this.getPendingActions().slice(successCount);
            this.savePendingActions(remaining);
            console.log(`Successfully processed ${successCount} queued actions. ${remaining.length} remaining.`);
        }

        this.isSyncing = false;
        this.updateSyncStatusIndicator(this.isOnline);
    },

    syncWithCloud: async function() {
        if (!supabaseClient || !this.isOnline) return;
        
        console.log("Synchronizing data with Supabase Cloud...");
        this.updateSyncStatusIndicator(true, 'syncing');

        try {
            // 1. Process pending queue first to ensure cloud receives latest local edits
            await this.processPendingActions();

            // 2. Sync Inventory (Merge based on last_updated)
            const { data: cloudInv, error: invErr } = await supabaseClient.from('inventory').select('*');
            if (invErr) throw invErr;

            if (cloudInv && cloudInv.length > 0) {
                const mergedInventory = [...this.inventory];
                
                cloudInv.forEach(cloudItem => {
                    const localIndex = mergedInventory.findIndex(li => li.id === cloudItem.id);
                    if (localIndex === -1) {
                        mergedInventory.push(cloudItem);
                    } else {
                        const localItem = mergedInventory[localIndex];
                        const localTime = new Date(localItem.last_updated || 0).getTime();
                        const cloudTime = new Date(cloudItem.last_updated || 0).getTime();
                        
                        if (cloudTime > localTime) {
                            mergedInventory[localIndex] = cloudItem;
                        } else if (localTime > cloudTime) {
                            // Local item is newer, queue update for cloud
                            this.queueAction('updateStock', localItem);
                        }
                    }
                });
                
                this.inventory = mergedInventory;
                this.saveLocal('inventory', this.inventory);
            }

            // 3. Sync Sales (Merge and prevent duplicates)
            const { data: cloudSales, error: salesErr } = await supabaseClient.from('sales').select('*').order('date', { ascending: false }).limit(100);
            if (salesErr) throw salesErr;

            if (cloudSales) {
                const salesMap = {};
                cloudSales.forEach(s => salesMap[s.id] = s);
                this.recentSales.forEach(s => salesMap[s.id] = s);
                
                this.recentSales = Object.values(salesMap)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 100);
                    
                this.saveLocal('sales', this.recentSales);
            }

            // 4. Sync Productions
            const { data: cloudProds, error: prodsErr } = await supabaseClient.from('productions').select('*').order('date', { ascending: false }).limit(100);
            if (prodsErr) throw prodsErr;

            if (cloudProds) {
                const prodsMap = {};
                cloudProds.forEach(p => prodsMap[p.id] = p);
                this.productions.forEach(p => prodsMap[p.id] = p);
                
                this.productions = Object.values(prodsMap)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 100);
                    
                this.saveLocal('productions', this.productions);
            }

            // 5. Sync Expenses
            const { data: cloudExps, error: expsErr } = await supabaseClient.from('expenses').select('*').order('date', { ascending: false }).limit(100);
            if (expsErr) throw expsErr;

            if (cloudExps) {
                const expsMap = {};
                cloudExps.forEach(e => expsMap[e.id] = e);
                this.expenses.forEach(e => expsMap[e.id] = e);
                
                this.expenses = Object.values(expsMap)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 100);
                    
                this.saveLocal('expenses', this.expenses);
            }

            // 6. Sync App Settings
            const { data: settingsArray, error: settingsErr } = await supabaseClient.from('app_settings').select('*').limit(1);
            if (!settingsErr && settingsArray && settingsArray.length > 0) {
                const cloudSettings = settingsArray[0];
                this.settings.pin = cloudSettings.pin || this.settings.pin;
                this.settings.theme = cloudSettings.theme || this.settings.theme;
                this.settings.useBiometrics = cloudSettings.use_biometrics !== undefined ? cloudSettings.use_biometrics : this.settings.useBiometrics;
                
                this.saveLocal('settings', this.settings);
                localStorage.setItem('terroir-theme', this.settings.theme);
                if (this.settings.pin) localStorage.setItem('terroir-pin', this.settings.pin);
                this.applyTheme(this.settings.theme);
            }

            console.log("Cloud synchronisation complete.");
            this.updateSyncStatusIndicator(true);
            this.triggerUIRefresh();

            // Run queue again if new updateStock actions were added during merge
            if (this.getPendingActions().length > 0) {
                this.processPendingActions().catch(err => console.error("Post-sync process queue failure:", err));
            }
        } catch (e) {
            console.error("Cloud synchronization failed (app will continue working offline):", e);
            this.updateSyncStatusIndicator(false);
        }
    },

    addSale: async function(items, total, saleDate) {
        const sale = {
            id: 'V-' + Math.floor(Math.random() * 1000000),
            date: saleDate ? new Date(saleDate).toISOString() : new Date().toISOString(),
            items: items,
            total: total,
            status: 'Completed'
        };
        
        // 1. Optimistic local update (instant response)
        this.recentSales.unshift(sale); 
        if (this.recentSales.length > 100) this.recentSales.pop(); 
        
        this.saveLocal('sales', this.recentSales);
        this.triggerUIRefresh();
        Utils.showToast("Vente enregistrée", "success");
        
        // 2. Queue action for cloud
        this.queueAction('addSale', sale);
    },

    addProduction: async function(flavorName, qtyPetit, qtyGrand, depense, prodDate) {
        const prod = {
            id: 'P-' + Math.floor(Math.random() * 1000000),
            date: prodDate ? new Date(prodDate).toISOString() : new Date().toISOString(),
            items: `${qtyPetit} Petits, ${qtyGrand} Grands (${flavorName})`,
            cost: depense || 0
        };
        
        // 1. Local update
        this.productions.unshift(prod);
        if (this.productions.length > 100) this.productions.pop();
        this.saveLocal('productions', this.productions);
        
        // Update Inventory Stock (Local)
        const petitItem = this.inventory.find(i => i.name.includes(flavorName) && i.name.toLowerCase().includes('petit'));
        const grandItem = this.inventory.find(i => i.name.includes(flavorName) && i.name.toLowerCase().includes('grand'));
        
        if (petitItem && qtyPetit > 0) await this.updateStock(petitItem.id, qtyPetit);
        if (grandItem && qtyGrand > 0) await this.updateStock(grandItem.id, qtyGrand);
        
        this.triggerUIRefresh();
        Utils.showToast("Production enregistrée", "success");
        
        // 2. Queue action for cloud
        this.queueAction('addProduction', prod);
    },

    addNewProduct: async function(flavorName, pricePetit, priceGrand, limit) {
        const idBase = Math.floor(Math.random() * 1000);
        const newItems = [
            { id: idBase + '_P', name: `${flavorName} (Petit)`, category: 'Jus', size: 'Petit', price: pricePetit, stock: 0, critical_limit: limit, last_updated: new Date().toISOString() },
            { id: idBase + '_G', name: `${flavorName} (Grand)`, category: 'Jus', size: 'Grand', price: priceGrand, stock: 0, critical_limit: limit, last_updated: new Date().toISOString() }
        ];

        // 1. Local update
        this.inventory.push(...newItems);
        this.saveLocal('inventory', this.inventory);
        this.triggerUIRefresh();
        Utils.showToast("Nouveau produit créé", "success");

        // 2. Queue action for cloud
        this.queueAction('addNewProduct', newItems);
        return true;
    },

    addGeneralExpense: async function(itemLabel, amount, date) {
        const expense = {
            id: 'E-' + Math.floor(Math.random() * 1000000),
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
            item: itemLabel,
            amount: amount,
            category: 'Matière Première'
        };
        
        // 1. Local update
        this.expenses.unshift(expense);
        if (this.expenses.length > 100) this.expenses.pop();
        this.saveLocal('expenses', this.expenses);
        this.triggerUIRefresh();
        Utils.showToast("Achat enregistré", "success");
        
        // 2. Queue action for cloud
        this.queueAction('addGeneralExpense', expense);
    },

    updateStock: async function(id, quantityChange) {
        const item = this.inventory.find(i => i.id === id);
        if (item) {
            item.stock += quantityChange;
            if(item.stock < 0) item.stock = 0;
            item.last_updated = new Date().toISOString();
            
            // Local update
            this.saveLocal('inventory', this.inventory);
            
            // Queue action for cloud
            this.queueAction('updateStock', item);
        }
    },

    getStats: function() {
        const inv = this.inventory || [];
        const sales = this.recentSales || [];
        const prods = this.productions || [];
        const exps = this.expenses || [];

        const totalStock = inv.reduce((sum, item) => sum + (item.stock || 0), 0);
        const lowStockItems = inv.filter(item => (item.stock || 0) > 0 && (item.stock || 0) <= (item.critical_limit || 5)).length;
        
        const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const totalProductionCost = prods.reduce((sum, prod) => sum + (prod.cost || 0), 0);
        const totalMaterialCost = exps.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const totalExpense = totalProductionCost + totalMaterialCost;
        const totalProfit = totalRevenue - totalExpense;

        const totalPetits = inv.filter(i => i.name?.toLowerCase().includes('petit')).reduce((sum, i) => sum + (i.stock || 0), 0);
        const totalGrands = inv.filter(i => i.name?.toLowerCase().includes('grand')).reduce((sum, i) => sum + (i.stock || 0), 0);

        return {
            totalStock,
            lowStockItems,
            totalRevenue,
            totalExpense,
            totalProductionCost,
            totalMaterialCost,
            totalProfit,
            totalPetits,
            totalGrands
        };
    },

    getFilteredStats: function(timeframe = 'all', start = null, end = null) {
        const now = new Date();
        let startDate, endDate;

        if (timeframe === 'custom' && start && end) {
            startDate = new Date(start + 'T00:00:00');
            endDate = new Date(end + 'T23:59:59');
        } else if (timeframe === 'today') {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
        } else if (timeframe === 'week') {
            startDate = new Date();
            const day = startDate.getDay() || 7;
            startDate.setDate(startDate.getDate() - (day - 1));
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
        } else if (timeframe === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
        } else {
            startDate = new Date(0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
        }

        const filteredSales = (this.recentSales || []).filter(sale => {
            const d = new Date(sale.date);
            return d >= startDate && d <= endDate;
        });

        const filteredProds = (this.productions || []).filter(prod => {
            const d = new Date(prod.date);
            return d >= startDate && d <= endDate;
        });

        const filteredExpenses = (this.expenses || []).filter(exp => {
            const d = new Date(exp.date);
            return d >= startDate && d <= endDate;
        });

        const revenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const productionExpense = filteredProds.reduce((sum, prod) => sum + (prod.cost || 0), 0);
        const materialExpense = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const expense = productionExpense + materialExpense;

        return {
            revenue,
            expense,
            profit: revenue - expense,
            salesCount: filteredSales.length,
            productionsCount: filteredProds.length,
            expensesCount: filteredExpenses.length,
            sales: filteredSales,
            productions: filteredProds,
            rawExpenses: filteredExpenses
        };
    },

    updatePrice: async function(id, newPrice, newLimit) {
        const item = (this.inventory || []).find(i => i.id == id);
        if (item) {
            if (newPrice !== undefined) item.price = newPrice;
            if (newLimit !== undefined) item.critical_limit = newLimit;
            item.last_updated = new Date().toISOString();
            
            // Local update
            this.saveLocal('inventory', this.inventory);
            this.triggerUIRefresh();
            Utils.showToast("Paramètres produit mis à jour", "success");

            // Queue action
            this.queueAction('updatePrice', item);
        }
    },

    updateSettings: async function(key, value) {
        this.settings[key] = value;
        this.saveLocal('settings', this.settings);
        
        if (key === 'theme') {
            localStorage.setItem('terroir-theme', value);
            this.applyTheme(value);
        } else if (key === 'pin') {
            localStorage.setItem('terroir-pin', value);
        }
        
        // Queue settings write
        const payload = { 
            id: 'global_settings', 
            pin: this.settings.pin,
            use_biometrics: this.settings.useBiometrics,
            theme: this.settings.theme,
            updated_at: new Date().toISOString()
        };
        this.queueAction('updateSettings', payload);
    },

    applyTheme: function(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-mode');
            document.body.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.body.classList.remove('dark-mode');
        }
    },

    triggerUIRefresh: function() {
        if (window.renderView) {
            const activeView = document.querySelector('.nav-link.active-tab')?.getAttribute('data-view') || 'dashboard';
            window.renderView(activeView);
        }
    }
};

// Initialize State Engine
window.State = State;
State.init();
