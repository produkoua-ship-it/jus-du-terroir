/**
 * AI Assistant Engine for Jus du Terroir
 * Analyzes management data and provides real-time insights and advice.
 * Updated with Tailwind Coaching App Style
 */
const AIAssistant = {
    getInsights: function() {
        const todayStats = State.getFilteredStats('today');
        const weekStats = State.getFilteredStats('week');
        const inventory = State.inventory;
        
        let insights = [];

        // 1. Stock Analysis
        const criticalItems = inventory.filter(i => i.stock <= (i.critical_limit || 5));
        criticalItems.sort((a,b) => a.stock - b.stock);

        if (criticalItems.length > 0) {
            insights.push({
                type: 'warning',
                message: `Attention Alida, le stock de <strong>${criticalItems[0].name}</strong> est bas (${criticalItems[0].stock} btles). Vous devriez penser à lancer une production.`
            });
        }

        // 2. Sales Performance (Weekly)
        if (weekStats.sales && weekStats.sales.length > 0) {
            const bestSeller = this.getBestSeller(weekStats.sales);
            insights.push({
                type: 'success',
                message: `Votre produit phare cette semaine est <strong>${bestSeller}</strong>. Continuez sur cette belle lancée !`
            });
        }

        // 3. Profitability Insight (Weekly)
        const margin = weekStats.revenue > 0 ? (weekStats.profit / weekStats.revenue) * 100 : 0;
        if (weekStats.revenue > 0) {
            if (margin < 30) {
                insights.push({
                    type: 'danger',
                    message: "Vos marges de la semaine sont un peu faibles. Vérifiez vos dépenses récentes pour optimiser vos bénéfices."
                });
            } else if (margin >= 50) {
                insights.push({
                    type: 'success',
                    message: `Excellente rentabilité cette semaine ! Avec une marge de ${Math.round(margin)}%, votre gestion financière est parfaite.`
                });
            }
        }

        // 4. Activity Insight (Today)
        if (todayStats.revenue === 0 && todayStats.expense === 0) {
            insights.push({
                type: 'info',
                message: "La journée commence ! N'oubliez pas d'enregistrer chaque vente dès qu'elle est conclue pour un suivi précis."
            });
        } else if (todayStats.revenue > 0) {
            insights.push({
                type: 'info',
                message: `Belle journée en cours ! Vous avez déjà réalisé ${Utils.formatCurrency(todayStats.revenue)} de ventes aujourd'hui.`
            });
        }

        // Fallback si aucune insight n'est déclenchée
        if (insights.length === 0) {
            insights.push({
                type: 'info',
                message: "Tout semble en ordre ! Pensez à vérifier vos stocks régulièrement."
            });
        }

        return insights;
    },

    getBestSeller: function(sales) {
        const counts = {};
        sales.forEach(sale => {
            const name = sale.items.split('x ')[1] || sale.items;
            counts[name] = (counts[name] || 0) + 1;
        });
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, "Jus");
    },

    renderAssistantUI: function() {
        const insights = this.getInsights();
        if (insights.length === 0) return '';
        const current = insights[Math.floor(Math.random() * insights.length)];
        return this.generateHeroInsightHTML(current.message);
    },

    generateHeroInsightHTML: function(message) {
        return `
            <div class="mb-8 flex gap-4 items-center animate-pop bg-gradient-to-br from-terroir-secondary to-[#3D1A4D] p-6 rounded-[2.5rem] shadow-xl shadow-terroir-secondary/10 border border-white/5 relative overflow-hidden">
                <!-- Decorative background glow -->
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-terroir-primary/20 blur-[50px] rounded-full"></div>
                
                <div class="w-12 h-12 shrink-0 bg-gradient-to-tr from-terroir-primary to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-terroir-primary/20 relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                </div>
                <div class="flex-1 relative z-10">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-terroir-success animate-pulse"></span>
                        <p class="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">IA Insights</p>
                    </div>
                    <p class="text-white text-[13px] leading-relaxed font-semibold">
                        ${message}
                    </p>
                </div>
            </div>
        `;
    }
};

window.AIAssistant = AIAssistant;
