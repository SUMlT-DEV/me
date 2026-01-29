// --- Toast Notification System ---
const addToast = (message, type = 'success') => {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    const color = type === 'success' ? 'text-emerald-400' : (type === 'error' ? 'text-rose-400' : 'text-blue-400');
    const border = type === 'success' ? 'border-emerald-500/50' : (type === 'error' ? 'border-rose-500/50' : 'border-blue-500/50');
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-circle' : 'info');
    
    el.className = `pointer-events-auto glass-panel border ${border} backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up`;
    el.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 ${color}"></i><span class="text-sm font-medium">${message}</span>`;
    container.appendChild(el);
    if(window.lucide) lucide.createIcons();
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px)';
        setTimeout(() => el.remove(), 300);
    }, 3000);
};

// --- Logic Class ---
class ExpenseTracker {
    constructor() {
        this.storageKey = 'cyber_finance_v1';
        this.allTransactions = this.loadData();
        this.chart = null;
        this.deleteTransactionId = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.categoryIcons = {
            'Room Rent': '🏠', 'Rashan': '🍚', 'Food': '🍕', 'Transport': '🚌', 'Education': '📚',
            'Books': '📖', 'Entertainment': '🎮', 'Mobile & Data': '📱', 'Others': '🔧', 
            'Pocket Money': '💰', 'Borrow': '🤝', 'Savings': '💎'
        };
        this.monthNames = [
            'January','February','March','April','May','June',
            'July','August','September','October','November','December'
        ];
        
        this.init();
    }

    loadData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch(e) {
            console.error('Load error', e);
            return [];
        }
    }

    saveData() {
        try { localStorage.setItem(this.storageKey, JSON.stringify(this.allTransactions)); }
        catch(e){ console.error('Save error', e); addToast('Unable to save data', 'error'); }
    }

    init() {
        this.bindEvents();
        this.setDefaultDates();
        this.updateMonthDisplay();
        this.updateAll();
        if(window.lucide) lucide.createIcons();
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('incomeDate').value = today;
        document.getElementById('expenseDate').value = today;
    }

    bindEvents() {
        document.getElementById('incomeForm').addEventListener('submit', (e) => { e.preventDefault(); this.addTransaction('income'); });
        document.getElementById('expenseForm').addEventListener('submit', (e) => { e.preventDefault(); this.addTransaction('expense'); });
        document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));
        document.getElementById('generateData').addEventListener('click', () => this.generateEnhancedPDF());
    }

    navigateMonth(dir) {
        this.currentMonth += dir;
        if(this.currentMonth > 11){ this.currentMonth = 0; this.currentYear++; }
        else if(this.currentMonth < 0){ this.currentMonth = 11; this.currentYear--; }
        this.updateMonthDisplay(); 
        this.updateAll();
    }

    updateMonthDisplay() {
        const monthDisplay = document.getElementById('currentMonthDisplay');
        const monthStats = document.getElementById('monthStats');
        monthDisplay.textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;

        const tx = this.getCurrentMonthTransactions();
        if(tx.length === 0) monthStats.textContent = 'No transactions';
        else {
            const inc = tx.filter(t=>t.type==='income').length;
            const exp = tx.filter(t=>t.type==='expense').length;
            monthStats.textContent = `${inc} Income • ${exp} Expenses`;
        }
    }

    getCurrentMonthKey() { 
        return `${this.currentYear}-${String(this.currentMonth+1).padStart(2,'0')}`; 
    }

    getCurrentMonthTransactions() {
        const key = this.getCurrentMonthKey();
        return this.allTransactions.filter(t => {
            const d = new Date(t.timestamp);
            const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            return k === key;
        });
    }

    addTransaction(type) {
        const formId = type === 'income' ? 'incomeForm' : 'expenseForm';
        const catId = type === 'income' ? 'incomeCategory' : 'expenseCategory';
        const amtId = type === 'income' ? 'incomeAmount' : 'expenseAmount';
        const dateId = type === 'income' ? 'incomeDate' : 'expenseDate';
        const descId = type === 'income' ? 'incomeDescription' : 'expenseDescription';

        const category = document.getElementById(catId).value;
        const amount = parseFloat(document.getElementById(amtId).value);
        const dateInput = document.getElementById(dateId).value;
        const description = document.getElementById(descId).value;

        if(!category || !amount || amount <= 0 || !dateInput) { 
            addToast('Please fill all required fields', 'error'); return; 
        }

        const d = new Date(dateInput + 'T00:00:00');
        const now = new Date(); 
        d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

        const tx = { 
            id: Date.now().toString(36) + Math.random().toString(36).slice(2), 
            type: type, 
            category: category,
            amount: amount, 
            description: description || '',
            date: d.toLocaleDateString('en-IN'), 
            timestamp: d.getTime() 
        };

        this.allTransactions.unshift(tx);
        this.saveData(); 
        this.updateAll();
        
        document.getElementById(formId).reset(); 
        this.setDefaultDates();
        addToast(`${type === 'income' ? 'Income' : 'Expense'} added successfully`);
    }

    updateAll() { 
        this.updateSummary(); 
        this.renderTransactions(); 
        this.updateChart(); 
        if(window.lucide) lucide.createIcons();
    }

    updateSummary() {
        const tx = this.getCurrentMonthTransactions();
        const totalIncome = tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
        const totalExpenses = tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
        const balance = totalIncome - totalExpenses;

        document.getElementById('totalIncome').textContent = `₹${totalIncome.toLocaleString('en-IN')}`;
        document.getElementById('totalExpenses').textContent = `₹${totalExpenses.toLocaleString('en-IN')}`;
        document.getElementById('balance').textContent = `₹${balance.toLocaleString('en-IN')}`;

        const statusEl = document.getElementById('balanceStatus');
        
        if(balance > 0){
            statusEl.textContent = 'Healthy';
            statusEl.className = 'text-[10px] font-bold px-2 py-1 rounded-lg inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
        } else if(balance === 0){
            statusEl.textContent = 'Balanced';
            statusEl.className = 'text-[10px] font-bold px-2 py-1 rounded-lg inline-block bg-blue-500/20 text-blue-300 border border-blue-500/30';
        } else {
            statusEl.textContent = 'Overspent';
            statusEl.className = 'text-[10px] font-bold px-2 py-1 rounded-lg inline-block bg-rose-500/20 text-rose-300 border border-rose-500/30';
        }

        const max = Math.max(totalIncome, totalExpenses) || 1;
        document.getElementById('incomeBar').style.width = `${(totalIncome/max)*100}%`;
        document.getElementById('expenseBar').style.width = `${(totalExpenses/max)*100}%`;
    }

    renderTransactions() {
        const list = document.getElementById('transactionsList');
        const count = document.getElementById('txCount');
        const tx = this.getCurrentMonthTransactions().sort((a,b) => b.timestamp - a.timestamp);

        count.textContent = `${tx.length} Items`;
        list.innerHTML = '';

        if(tx.length === 0) {
            list.innerHTML = `<div class="flex flex-col items-center justify-center py-10 text-gray-500 opacity-60"><i data-lucide="inbox" class="w-10 h-10 mb-2 text-gray-600"></i><p class="text-sm">No transactions yet</p></div>`;
            return;
        }

        tx.forEach(t => {
            const icon = this.categoryIcons[t.category] || '💠';
            const isInc = t.type === 'income';
            const colorClass = isInc ? 'text-emerald-400' : 'text-rose-400';
            const bgClass = isInc ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20';
            const sign = isInc ? '+' : '-';

            const div = document.createElement('div');
            div.className = `group flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-200`;
            div.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg border ${bgClass} shrink-0">
                        ${icon}
                    </div>
                    <div class="min-w-0">
                        <div class="font-bold text-sm text-gray-200 truncate">${t.category}</div>
                        <div class="text-xs text-gray-500 truncate flex items-center gap-1">
                            <span>${t.date}</span>
                            ${t.description ? `<span class="w-1 h-1 rounded-full bg-gray-600"></span> <span>${t.description}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3 pl-2">
                    <span class="font-mono font-bold text-sm ${colorClass}">${sign}₹${t.amount.toLocaleString('en-IN')}</span>
                    <button onclick="expenseTracker.showDeleteModal('${t.id}')" class="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-gray-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-all">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            list.appendChild(div);
        });
    }

    updateChart() {
        const tx = this.getCurrentMonthTransactions();
        const expenses = tx.filter(t => t.type === 'expense');
        const container = document.getElementById('expenseBreakdown');
        
        if(expenses.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-10 text-sm opacity-60">No expenses to analyze.</div>';
            if(this.chart) { this.chart.destroy(); this.chart = null; }
            return;
        }

        const byCat = {};
        expenses.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
        
        const totalExp = Object.values(byCat).reduce((a,b) => a+b, 0);
        const sortedCats = Object.entries(byCat).sort((a,b) => b[1] - a[1]);

        container.innerHTML = sortedCats.map(([cat, amt]) => {
            const pct = ((amt/totalExp)*100).toFixed(1);
            const icon = this.categoryIcons[cat] || '🏷️';
            return `
                <div class="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group">
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                        <span class="text-sm">${icon}</span>
                        <div class="flex-1 min-w-0">
                            <div class="text-xs font-bold text-gray-300 truncate">${cat}</div>
                            <div class="w-full bg-gray-700/50 h-1 rounded-full mt-1 overflow-hidden">
                                <div class="h-full bg-purple-500" style="width: ${pct}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="text-right pl-3">
                        <div class="text-xs font-bold text-white font-mono">₹${amt.toLocaleString('en-IN')}</div>
                        <div class="text-[10px] text-gray-500">${pct}%</div>
                    </div>
                </div>
            `;
        }).join('');

        const ctx = document.getElementById('expenseChart').getContext('2d');
        const labels = sortedCats.map(x => x[0]);
        const data = sortedCats.map(x => x[1]);
        const colors = [
            '#a855f7', '#3b82f6', '#10b981', '#f43f5e', '#f59e0b', 
            '#ec4899', '#6366f1', '#14b8a6', '#8b5cf6', '#64748b'
        ];

        if(this.chart) this.chart.destroy();
        
        Chart.defaults.color = '#9ca3af';
        Chart.defaults.borderColor = '#374151';
        Chart.defaults.font.family = "'JetBrains Mono', monospace";

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(20, 20, 25, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#e5e7eb',
                        padding: 12,
                        cornerRadius: 12,
                        displayColors: true,
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1
                    }
                }
            }
        });
    }

    showDeleteModal(id) {
        const t = this.allTransactions.find(x => x.id === id);
        if(!t) return;
        this.deleteTransactionId = id;
        document.getElementById('transactionDetails').innerHTML = `
            <div class="flex justify-between mb-1"><span class="text-gray-500">Category:</span> <span class="text-white">${t.category}</span></div>
            <div class="flex justify-between mb-1"><span class="text-gray-500">Amount:</span> <span class="text-white font-bold">₹${t.amount}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Date:</span> <span class="text-gray-300">${t.date}</span></div>
        `;
        document.getElementById('deleteModal').classList.remove('hidden');
    }

    hideDeleteModal() {
        document.getElementById('deleteModal').classList.add('hidden');
        this.deleteTransactionId = null;
    }

    performDelete() {
        if(!this.deleteTransactionId) return;
        this.allTransactions = this.allTransactions.filter(t => t.id !== this.deleteTransactionId);
        this.saveData();
        this.updateAll();
        this.hideDeleteModal();
        addToast('Transaction deleted', 'success');
    }

    getAllMonthsSummary() {
        const monthly = {};
        this.allTransactions.forEach(t => {
            const d = new Date(t.timestamp);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            if(!monthly[key]) {
                monthly[key] = {
                    month: `${this.monthNames[d.getMonth()]} ${d.getFullYear()}`,
                    monthKey: key,
                    income: 0, expenses: 0, balance: 0, transactionCount: 0,
                    incomeTransactions: [], expenseTransactions: [], categories: {}
                };
            }
            const m = monthly[key];
            m.transactionCount++;
            if(t.type === 'income') { 
                m.income += t.amount; 
                m.incomeTransactions.push(t); 
            } else { 
                m.expenses += t.amount; 
                m.expenseTransactions.push(t); 
                m.categories[t.category] = (m.categories[t.category] || 0) + t.amount; 
            }
            m.balance = m.income - m.expenses;
        });
        return Object.entries(monthly).sort(([a],[b]) => b.localeCompare(a)).map(([,v]) => v);
    }

    async getChartImage(labels, data) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 400; 
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            
            const chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            '#a855f7', '#3b82f6', '#10b981', '#f43f5e', '#f59e0b', 
                            '#ec4899', '#6366f1', '#14b8a6', '#8b5cf6', '#64748b'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    animation: false, 
                    responsive: false,
                    plugins: {
                        legend: { 
                            display: true, 
                            position: 'right',
                            labels: { font: { size: 14 } }
                        } 
                    }
                }
            });
            
            setTimeout(() => {
                const img = chart.toBase64Image();
                chart.destroy();
                resolve(img);
            }, 200);
        });
    }

    async generateEnhancedPDF() {
        const btn = document.getElementById('generateData');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<div class="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div> Generating...';
        btn.disabled = true;

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'pt', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const left = 40, right = 40, usableWidth = pageWidth - left - right;
            let y = 50;

            const allMonthsData = this.getAllMonthsSummary();
            const currentKey = this.getCurrentMonthKey();
            const monthlyData = allMonthsData.filter(m => m.monthKey === currentKey);

            // Title
            doc.setFont('helvetica', 'bold'); 
            doc.setFontSize(24); 
            doc.setTextColor(147, 51, 234);
            doc.text('Student Expense Manager', pageWidth/2, y, {align:'center'});

            y += 20; 
            doc.setFont('helvetica', 'normal'); 
            doc.setFontSize(12); 
            doc.setTextColor(156, 163, 175);
            doc.text('Financial Report', pageWidth/2, y, {align:'center'});

            y += 40;
            
            // Overall Summary Box
            doc.setDrawColor(147, 51, 234);
            doc.setLineWidth(1);
            doc.setFillColor(250, 250, 255);
            doc.roundedRect(left, y, usableWidth, 90, 8, 8, 'FD');

            const totalInc = monthlyData.reduce((s,m)=>s+m.income,0);
            const totalExp = monthlyData.reduce((s,m)=>s+m.expenses,0);
            const netBal = totalInc - totalExp;

            y += 25;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(31, 41, 55);
            doc.text('Executive Summary', pageWidth/2, y, {align:'center'});

            y += 25;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(55, 65, 81);
            doc.text(`Total Income: Rs. ${totalInc.toLocaleString('en-IN')}`, left + 30, y);
            doc.text(`Total Expenses: Rs. ${totalExp.toLocaleString('en-IN')}`, pageWidth - right - 30, y, {align:'right'});
            
            y += 20;
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(netBal >= 0 ? 16 : 225, netBal >= 0 ? 185 : 29, netBal >= 0 ? 129 : 72); 
            doc.text(`Net Balance: Rs. ${netBal.toLocaleString('en-IN')}`, pageWidth/2, y, {align:'center'});

            doc.addPage(); y = 50;

            // --- Charts ---
            doc.setFont('helvetica', 'bold'); 
            doc.setFontSize(16); 
            doc.setTextColor(147, 51, 234);
            doc.text('Monthly Spending Analysis', pageWidth/2, y, {align:'center'});
            y += 30;

            const allCats = {};
            monthlyData.forEach(m => {
                Object.entries(m.categories).forEach(([cat, amt]) => {
                    allCats[cat] = (allCats[cat] || 0) + amt;
                });
            });
            const sortedAllCats = Object.entries(allCats).sort((a,b) => b[1] - a[1]);
            const labels = sortedAllCats.map(x => x[0]);
            const data = sortedAllCats.map(x => x[1]);

            if(labels.length > 0) {
                const chartImg = await this.getChartImage(labels, data);
                const chartWidth = 300;
                const chartHeight = 150; 
                const xPos = (pageWidth - chartWidth) / 2;
                
                doc.addImage(chartImg, 'PNG', xPos, y, chartWidth, chartHeight);
                y += chartHeight + 30;

                doc.autoTable({
                    startY: y,
                    head: [['Category', 'Total Amount']],
                    body: sortedAllCats.map(([c, a]) => [c, `Rs. ${a.toLocaleString('en-IN')}`]),
                    theme: 'grid',
                    headStyles: { fillColor: [147, 51, 234], halign: 'center' },
                    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
                    margin: { left, right }
                });
                y = doc.lastAutoTable.finalY + 40;
            } else {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(12);
                doc.setTextColor(100);
                doc.text("No data available for this month.", pageWidth/2, y, {align:'center'});
                y += 40;
            }

            // --- Monthly Data ---
            monthlyData.forEach((m, idx) => {
                if(y > pageHeight - 100) { doc.addPage(); y = 50; }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.setTextColor(59, 130, 246);
                doc.text(m.month, left, y);
                
                doc.setFontSize(10);
                doc.setTextColor(107, 114, 128);
                doc.text(`Balance: Rs. ${m.balance.toLocaleString('en-IN')}`, pageWidth - right, y, {align:'right'});

                y += 15;

                if (m.incomeTransactions.length > 0) {
                    doc.autoTable({
                        startY: y,
                        head: [['Income Source', 'Description', 'Amount']],
                        body: m.incomeTransactions.map(t => [
                            t.category, 
                            t.description || '',
                            `Rs. ${t.amount.toLocaleString('en-IN')}`
                        ]),
                        theme: 'striped',
                        headStyles: { fillColor: [16, 185, 129] },
                        margin: { left, right }
                    });
                    y = doc.lastAutoTable.finalY + 15;
                }

                if (m.expenseTransactions.length > 0) {
                    doc.autoTable({
                        startY: y,
                        head: [['Expense', 'Description', 'Amount']],
                        body: m.expenseTransactions.map(t => [
                            t.category, 
                            t.description || '',
                            `Rs. ${t.amount.toLocaleString('en-IN')}`
                        ]),
                        theme: 'striped',
                        headStyles: { fillColor: [244, 63, 94] },
                        margin: { left, right }
                    });
                    y = doc.lastAutoTable.finalY + 30;
                }
            });

            doc.save(`Financial_Report_${currentKey}.pdf`);
            addToast('Report generated successfully');

        } catch (err) {
            console.error(err);
            addToast('Failed to generate PDF', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

function switchTab(tab) {
    const incForm = document.getElementById('incomeForm');
    const expForm = document.getElementById('expenseForm');
    const tabInc = document.getElementById('tabIncome');
    const tabExp = document.getElementById('tabExpense');

    if(tab === 'income') {
        incForm.classList.remove('hidden');
        expForm.classList.add('hidden');
        tabInc.className = 'flex-1 py-4 text-sm font-bold text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-500 transition-all hover:bg-emerald-500/20';
        tabExp.className = 'flex-1 py-4 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b-2 border-transparent';
    } else {
        incForm.classList.add('hidden');
        expForm.classList.remove('hidden');
        tabExp.className = 'flex-1 py-4 text-sm font-bold text-rose-400 bg-rose-500/10 border-b-2 border-rose-500 transition-all';
        tabInc.className = 'flex-1 py-4 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b-2 border-transparent';
    }
}

let expenseTracker;
document.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTracker();
    window.expenseTracker = expenseTracker;
});
