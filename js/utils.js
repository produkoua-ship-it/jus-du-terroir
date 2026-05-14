// Utilities for formatting and DOM manipulation

const Utils = {
    // Format number as currency (FCFA)
    formatCurrency: (amount) => {
        const val = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
        }).format(val).replace('XOF', 'FCFA');
    },

    // Format date
    formatDate: (dateString) => {
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    },

    // Calculate stock status badge
    getStockStatus: (quantity, threshold = 20) => {
        if (quantity === 0) return '<span class="badge danger">Rupture</span>';
        if (quantity <= threshold) return '<span class="badge warning">Faible</span>';
        return '<span class="badge success">En stock</span>';
    },

    // Visual Stock Progress Bar
    getStockProgressBar: (quantity, maxStock = 200) => {
        const percentage = Math.min((quantity / maxStock) * 100, 100);
        let color = 'var(--success-color)';
        if (quantity === 0) color = 'var(--danger-color)';
        else if (quantity <= 20) color = 'var(--warning-color)';

        return `
            <div class="stock-progress-container">
                <div class="stock-progress-bar" style="width: ${percentage}%; background-color: ${color};"></div>
            </div>
        `;
    },

    showToast: function(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'success' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6CA742" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8265A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

        toast.innerHTML = `${icon} <span>${message}</span>`;
        
        container.appendChild(toast);

        // Auto-remove after animation
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 3000);
    }
};

window.Utils = Utils;
