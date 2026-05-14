// State management and Supabase Cloud Database Integration

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

    init: async function() {
        try {
            if (supabaseClient) {
                console.log("Supabase Client initialized. Fetching inventory...");
                
                // Fetch Inventory
                const { data: invData, error: invError } = await supabaseClient.from('inventory').select('*');
                
                if (invError) {
                    console.error("Supabase Inventory Error:", invError);
                    Utils.showToast("Erreur d'inventaire cloud", "error");
                }

                if (invData && invData.length > 0) {
                    this.inventory = invData;
                } else {
                    console.warn("Inventory is empty or not found. Using defaults.");
                    this.inventory = defaultInventory; 
                }

                // Fetch Sales
                const { data: salesData, error: salesError } = await supabaseClient.from('sales').select('*').order('date', { ascending: false }).limit(100);
                if (salesError) {
                    console.error("Supabase Sales Error:", salesError);
                    Utils.showToast("Impossible de charger les ventes récentes", "error");
                }
                if (salesData) this.recentSales = salesData;

                // Fetch Productions
                const { data: prodData } = await supabaseClient.from('productions').select('*').order('date', { ascending: false }).limit(100);
                if (prodData) this.productions = prodData;

                // Fetch Expenses
                const { data: expData } = await supabaseClient.from('expenses').select('*').order('date', { ascending: false }).limit(100);
                if (expData) this.expenses = expData;

                // Fetch App Settings
                try {
                    const { data: settingsArray, error: setError } = await supabaseClient.from('app_settings').select('*').limit(1);
                    if (setError) throw setError;
                    const settingsData = settingsArray && settingsArray.length > 0 ? settingsArray[0] : null;
                    if (settingsData) {
                        this.settings = { ...this.settings, ...settingsData };
                        if (this.settings.theme === 'dark') document.documentElement.className = 'dark-mode';
                    }
                } catch (settingsErr) {
                    console.warn("Could not fetch app_settings, using defaults:", settingsErr);
                }
            } else {
                console.warn("Supabase not available. Running in offline/mock mode.");
                this.inventory = defaultInventory;
            }
        } catch (e) {
            console.error("Critical Supabase Init Error:", e);
            Utils.showToast("Erreur de synchronisation initiale", "error");
            this.inventory = defaultInventory;
        }

        // Trigger UI Re-render
        if (window.renderView) {
            const activeView = document.querySelector('.nav-link.active-tab')?.getAttribute('data-view') || 'dashboard';
            window.renderView(activeView);
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
        
        // Optimistic UI update
        this.recentSales.unshift(sale); 
        if (this.recentSales.length > 100) this.recentSales.pop(); 
        
        // Save to Supabase Cloud
        try {
            if (supabaseClient) {
                const { error } = await supabaseClient.from('sales').insert([sale]);
                if (error) {
                    console.error("Supabase Sale Error:", error);
                    Utils.showToast("Échec de l'enregistrement de la vente", "error");
                }
            }
        } catch(e) { console.error("Critical Sale Error", e); }
    },

    addProduction: async function(flavorName, qtyPetit, qtyGrand, depense, prodDate) {
        const prod = {
            id: 'P-' + Math.floor(Math.random() * 1000000),
            date: prodDate ? new Date(prodDate).toISOString() : new Date().toISOString(),
            items: `${qtyPetit} Petits, ${qtyGrand} Grands (${flavorName})`,
            cost: depense || 0
        };
        
        // Optimistic UI update
        this.productions.unshift(prod);
        if (this.productions.length > 100) this.productions.pop();
        
        // Update Inventory Stock
        const petitItem = this.inventory.find(i => i.name.includes(flavorName) && i.name.toLowerCase().includes('petit'));
        const grandItem = this.inventory.find(i => i.name.includes(flavorName) && i.name.toLowerCase().includes('grand'));
        
        if (petitItem && qtyPetit > 0) await this.updateStock(petitItem.id, qtyPetit);
        if (grandItem && qtyGrand > 0) await this.updateStock(grandItem.id, qtyGrand);
        
        // Save to Supabase Cloud
        try {
            if (supabaseClient) {
                const { error } = await supabaseClient.from('productions').insert([prod]);
                if (error) {
                    console.error("Supabase Production Error:", error);
                    Utils.showToast("Échec de l'enregistrement de la production", "error");
                }
            }
        } catch(e) { console.error("Critical Production Error", e); }
    },

    addNewProduct: async function(flavorName, pricePetit, priceGrand, limit) {
        const idBase = Math.floor(Math.random() * 1000);
        const newItems = [
            { id: idBase + '_P', name: `${flavorName} (Petit)`, category: 'Jus', size: 'Petit', price: pricePetit, stock: 0, critical_limit: limit, last_updated: new Date().toISOString() },
            { id: idBase + '_G', name: `${flavorName} (Grand)`, category: 'Jus', size: 'Grand', price: priceGrand, stock: 0, critical_limit: limit, last_updated: new Date().toISOString() }
        ];

        this.inventory.push(...newItems);

        if (supabaseClient) {
            await supabaseClient.from('inventory').insert(newItems);
        }
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
        
        // Optimistic UI update
        this.expenses.unshift(expense);
        if (this.expenses.length > 100) this.expenses.pop();
        
        // Save to Supabase Cloud
        try {
            if (supabaseClient) await supabaseClient.from('expenses').insert([expense]);
        } catch(e) { console.error("Error saving expense", e); }
    },

    updateStock: async function(id, quantityChange) {
        const item = this.inventory.find(i => i.id === id);
        if (item) {
            item.stock += quantityChange;
            if(item.stock < 0) item.stock = 0;
            item.last_updated = new Date().toISOString();
            
            // Upsert to Supabase Cloud
            try {
                if (supabaseClient) {
                    const { error } = await supabaseClient.from('inventory').upsert([item]);
                    if (error) {
                        console.error("Supabase Stock Update Error:", error);
                        Utils.showToast("Erreur lors de la mise à jour des stocks", "error");
                    }
                }
            } catch(e) { console.error("Critical Stock Error", e); }
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

    getFilteredStats: function(timeframe = 'all', specificDate = null) {
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        let startDate = new Date(0); // Beginning of time
        let endDate = now;

        if (specificDate) {
            startDate = new Date(specificDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(specificDate);
            endDate.setHours(23, 59, 59, 999);
        } else if (timeframe === 'today') {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
        } else if (timeframe === 'yesterday') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setDate(endDate.getDate() - 1);
            endDate.setHours(23, 59, 59, 999);
        } else if (timeframe === 'week') {
            startDate = new Date();
            const day = startDate.getDay() || 7;
            if (day !== 1) startDate.setHours(-24 * (day - 1));
            startDate.setHours(0, 0, 0, 0);
        } else if (timeframe === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
        }

        const filteredSales = this.recentSales.filter(sale => {
            const d = new Date(sale.date);
            return d >= startDate && d <= endDate;
        });

        const filteredProds = this.productions.filter(prod => {
            const d = new Date(prod.date);
            return d >= startDate && d <= endDate;
        });

        const filteredExpenses = this.expenses.filter(exp => {
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
            try {
                if (supabaseClient) await supabaseClient.from('inventory').upsert([item]);
            } catch(e) { console.error("Error updating item settings", e); }
        }
    },

    settings: {
        theme: localStorage.getItem('terroir-theme') || 'light',
        notifications: true,
        businessName: 'Jus du Terroir'
    },

    updateSettings: async function(key, value) {
        this.settings[key] = value;
        if (key === 'theme') {
            localStorage.setItem('terroir-theme', value);
            document.documentElement.className = value === 'dark' ? 'dark-mode' : '';
        }
        
        // Sync to Cloud
        try {
            if (supabaseClient) {
                const payload = { 
                    id: 'global_settings', 
                    pin: this.settings.pin,
                    useBiometrics: this.settings.useBiometrics,
                    theme: this.settings.theme
                };
                await supabaseClient.from('app_settings').upsert([payload]);
            }
        } catch(e) { console.error("Error syncing settings", e); }
    }
};

// Initialize DB on load
window.State = State;
