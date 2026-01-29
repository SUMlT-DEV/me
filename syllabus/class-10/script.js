// --- DATA ---
const SYLLABUS = {
    maths: {
        id: "maths",
        title: "Mathematics",
        icon: "calculator",
        theme: "blue",
        colors: { bg: "bg-blue-50", text: "text-blue-600", accent: "bg-blue-500", border: "border-blue-200" },
        chapters: ["Real Numbers", "Polynomials", "Linear Equations", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Trigonometry Intro", "Trigonometry Apps", "Circles", "Areas Related to Circles", "Surface Areas & Volumes", "Statistics", "Probability"]
    },
    science: {
        id: "science",
        title: "Science",
        icon: "flask-conical",
        theme: "emerald",
        colors: { bg: "bg-emerald-50", text: "text-emerald-600", accent: "bg-emerald-500", border: "border-emerald-200" },
        chapters: ["Chemical Reactions", "Acids, Bases & Salts", "Metals & Non-metals", "Carbon Compounds", "Life Processes", "Control & Coordination", "Reproduction", "Heredity", "Light Reflection/Refraction", "Human Eye", "Electricity", "Magnetic Effects", "Our Environment"]
    },
    history: {
        id: "history",
        title: "History",
        icon: "landmark",
        theme: "amber",
        colors: { bg: "bg-amber-50", text: "text-amber-600", accent: "bg-amber-500", border: "border-amber-200" },
        chapters: ["Rise of Nationalism in Europe", "Nationalism in India", "The Making of a Global World", "The Age of Industrialization", "Print Culture and the Modern World"]
    },
    geography: {
        id: "geography",
        title: "Geography",
        icon: "globe-2",
        theme: "cyan",
        colors: { bg: "bg-cyan-50", text: "text-cyan-600", accent: "bg-cyan-500", border: "border-cyan-200" },
        chapters: ["Resources and Development", "Forest and Wildlife Resources", "Water Resources", "Agriculture", "Minerals and Energy Resources", "Manufacturing Industries", "Lifelines of National Economy"]
    },
    civics: {
        id: "civics",
        title: "Pol. Science",
        icon: "scale",
        theme: "red",
        colors: { bg: "bg-red-50", text: "text-red-600", accent: "bg-red-500", border: "border-red-200" },
        chapters: ["Power Sharing", "Federalism", "Gender, Religion and Caste", "Political Parties", "Outcomes of Democracy"]
    },
    economics: {
        id: "economics",
        title: "Economics",
        icon: "trending-up",
        theme: "indigo",
        colors: { bg: "bg-indigo-50", text: "text-indigo-600", accent: "bg-indigo-500", border: "border-indigo-200" },
        chapters: ["Development", "Sectors of the Indian Economy", "Money and Credit", "Globalisation and the Indian Economy", "Consumer Rights"]
    },
    english: {
        id: "english",
        title: "English",
        icon: "feather",
        theme: "rose",
        colors: { bg: "bg-rose-50", text: "text-rose-600", accent: "bg-rose-500", border: "border-rose-200" },
        chapters: ["A Letter to God", "Nelson Mandela", "Two Stories about Flying", "From the Diary of Anne Frank", "Glimpses of India", "Mijbil the Otter", "Madam Rides the Bus", "Sermon at Benares", "The Proposal", "Dust of Snow", "Fire and Ice", "A Tiger in the Zoo", "How to Tell Wild Animals", "The Ball Poem", "Amanda!", "The Trees", "Fog", "Tale of Custard the Dragon", "For Anne Gregory", "Triumph of Surgery", "The Thief's Story", "Midnight Visitor", "Question of Trust", "Footprints without Feet", "Making of a Scientist", "The Necklace", "Bholi", "Book That Saved the Earth"]
    },
    hindi: {
        id: "hindi",
        title: "Hindi Course A",
        icon: "languages",
        theme: "violet",
        colors: { bg: "bg-violet-50", text: "text-violet-600", accent: "bg-violet-500", border: "border-violet-200" },
        chapters: ["Netaji Ka Chashma", "Balgobin Bhagat", "Lakhnavi Andaz", "Ek Kahani Yeh Bhi", "Naubatkhane Mein Ibadat", "Sanskriti", "Surdas Ke Pad", "Ram-Lakshman-Parashuram", "Atmakathya", "Utsah & At Nahi Rahi Hai", "Yeh Danturit Muskan", "Sangatkar", "Mata Ka Aanchal", "Sana Sana Hath Jodi", "Main Kyon Likhta Hoon"]
    }
};

const app = {
    state: {
        activeTab: 'overview',
        userName: null,
        progress: {},
        charts: {}
    },

    init() {
        const savedProgress = localStorage.getItem('c10_tracker_v3_progress');
        if (savedProgress) this.state.progress = JSON.parse(savedProgress);
        
        const savedName = localStorage.getItem('c10_tracker_name');
        this.state.userName = savedName;

        if (!this.state.userName) {
            document.getElementById('welcome-modal').classList.remove('hidden');
            document.getElementById('welcome-modal').classList.add('flex');
        } else {
            this.render();
        }
    },

    saveName(e) {
        e.preventDefault();
        const name = document.getElementById('username-input').value.trim();
        if (name) {
            this.state.userName = name;
            localStorage.setItem('c10_tracker_name', name);
            document.getElementById('welcome-modal').classList.add('hidden');
            this.render();
        }
    },

    updateName(el) {
        const newName = el.innerText.trim();
        if (newName && newName !== this.state.userName) {
            this.state.userName = newName;
            localStorage.setItem('c10_tracker_name', newName);
            this.render(); 
        } else {
            el.innerText = this.state.userName;
        }
    },

    // Handles both flat and nested structure toggling
    // secIdx is null for flat subjects (Maths/Science)
    toggleChapter(subId, secIdx, idx) {
        const key = secIdx === null 
            ? `${subId}-${idx}` 
            : `${subId}-s${secIdx}-${idx}`;
        
        if (this.state.progress[key]) delete this.state.progress[key];
        else this.state.progress[key] = true;
        
        localStorage.setItem('c10_tracker_v3_progress', JSON.stringify(this.state.progress));
        this.render();
    },

    resetProgress() {
        if(confirm("Reset all progress? This cannot be undone.")) {
            this.state.progress = {};
            localStorage.setItem('c10_tracker_v3_progress', JSON.stringify({}));
            this.render();
        }
    },

    setTab(tab) {
        this.state.activeTab = tab;
        this.render();
    },

    getStats(subId) {
        const sub = SYLLABUS[subId];
        let total = 0;
        let done = 0;

        if (sub.sections) {
            // Nested structure (SST)
            sub.sections.forEach((sec, sIdx) => {
                sec.chapters.forEach((_, cIdx) => {
                    total++;
                    if(this.state.progress[`${subId}-s${sIdx}-${cIdx}`]) done++;
                });
            });
        } else {
            // Flat structure (Maths, Science, etc.)
            total = sub.chapters.length;
            sub.chapters.forEach((_, i) => { 
                if(this.state.progress[`${subId}-${i}`]) done++; 
            });
        }
        
        return { total, done, pct: total ? Math.round((done/total)*100) : 0 };
    },

    getAllStats() {
        let total = 0, done = 0;
        Object.keys(SYLLABUS).forEach(id => {
            const s = this.getStats(id);
            total += s.total;
            done += s.done;
        });
        return { total, done, pct: total ? Math.round((done/total)*100) : 0 };
    },

    renderNav() {
        const container = document.getElementById('nav-container');
        let html = '';
        
        // Overview Link
        const isOverview = this.state.activeTab === 'overview';
        html += `
            <button onclick="app.setTab('overview')" 
                class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap md:w-full text-left
                ${isOverview ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}">
                <i data-lucide="layout-grid" class="w-5 h-5"></i>
                <span class="font-semibold text-sm">Dashboard</span>
            </button>
            <div class="h-6 w-px bg-slate-200 md:hidden"></div>
            <div class="hidden md:block h-px w-full bg-slate-100 my-1"></div>
        `;

        Object.values(SYLLABUS).forEach(sub => {
            const isActive = this.state.activeTab === sub.id;
            const stats = this.getStats(sub.id);
            html += `
                <button onclick="app.setTab('${sub.id}')" 
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap md:w-full text-left group
                    ${isActive ? `${sub.colors.bg} ${sub.colors.text} font-bold` : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}">
                    <i data-lucide="${sub.icon}" class="w-5 h-5 ${isActive ? '' : 'text-slate-400 group-hover:text-slate-600'}"></i>
                    <span class="text-sm flex-grow">${sub.title}</span>
                    ${isActive ? `<span class="text-xs bg-white/50 px-2 py-0.5 rounded-md">${stats.pct}%</span>` : ''}
                </button>
            `;
        });

        container.innerHTML = html;
        
        // Update Sidebar Footer
        const name = this.state.userName || 'Student';
        document.getElementById('footer-name').textContent = name;
        document.getElementById('avatar-initial').textContent = name.charAt(0).toUpperCase();
    },

    renderOverview() {
        const allStats = this.getAllStats();
        const name = this.state.userName || 'Student';
        const date = new Date();
        const hour = date.getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

        return `
            <div class="animate-fade-in space-y-8">
                <div class="flex flex-col md:flex-row justify-between md:items-end gap-4">
                    <div>
                        <p class="text-slate-400 font-semibold mb-1 uppercase text-xs tracking-wider">${greeting},</p>
                        <h2 class="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-2">
                            <span contenteditable="true" spellcheck="false" onblur="app.updateName(this)" 
                                class="hover:text-brand-600 transition-colors cursor-text border-b-2 border-transparent hover:border-brand-200 focus:border-brand-600">${name}</span>
                        </h2>
                    </div>
                    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div class="relative w-12 h-12">
                            <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path class="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="4" />
                                <path class="text-brand-500 transition-all duration-1000" stroke-dasharray="${allStats.pct}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
                            </svg>
                            <div class="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">${allStats.pct}%</div>
                        </div>
                        <div>
                            <p class="text-sm font-bold text-slate-900">Overall Progress</p>
                            <p class="text-xs text-slate-500">${allStats.done} / ${allStats.total} Chapters</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    ${Object.values(SYLLABUS).map(sub => {
                        const stats = this.getStats(sub.id);
                        return `
                            <div onclick="app.setTab('${sub.id}')" 
                                class="bento-card bg-white p-6 rounded-3xl border border-slate-100 shadow-sm cursor-pointer relative overflow-hidden group">
                                <div class="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                    <i data-lucide="${sub.icon}" class="w-24 h-24 ${sub.colors.text}"></i>
                                </div>
                                
                                <div class="relative z-10">
                                    <div class="w-12 h-12 rounded-2xl ${sub.colors.bg} ${sub.colors.text} flex items-center justify-center mb-4">
                                        <i data-lucide="${sub.icon}" class="w-6 h-6"></i>
                                    </div>
                                    <h3 class="text-xl font-bold text-slate-800 mb-1">${sub.title}</h3>
                                    <div class="flex items-center gap-2 mb-6">
                                        <span class="text-2xl font-bold text-slate-900">${stats.pct}%</span>
                                        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Complete</span>
                                    </div>
                                    
                                    <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div class="h-full rounded-full transition-all duration-700 ${sub.colors.accent}" style="width: ${stats.pct}%"></div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <i data-lucide="bar-chart-2" class="w-5 h-5 text-brand-500"></i>
                            Subject Breakdown
                        </h3>
                        <div class="h-64 w-full">
                            <canvas id="mainChart"></canvas>
                        </div>
                    </div>
                    <div class="bg-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden flex flex-col justify-between">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                        
                        <div class="relative z-10">
                            <h3 class="text-lg font-bold text-white mb-2">Study Focus</h3>
                            <p class="text-slate-400 text-sm mb-6">Based on your current progress.</p>
                            
                            <div class="space-y-4">
                                ${this.getFocusSuggestion()}
                            </div>
                        </div>
                        <div class="relative z-10 mt-6 pt-6 border-t border-white/10">
                            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Remaining</div>
                            <div class="text-3xl font-bold">${allStats.total - allStats.done} <span class="text-lg font-medium text-slate-500">Chapters</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Helper to render a list of chapters
    renderChapterList(chapters, subId, colors, secIdx = null) {
        return chapters.map((chap, idx) => {
            const isDone = secIdx === null
                ? this.state.progress[`${subId}-${idx}`]
                : this.state.progress[`${subId}-s${secIdx}-${idx}`];
            
            return `
                <div onclick="app.toggleChapter('${subId}', ${secIdx}, ${idx})" 
                    class="group flex items-start gap-4 p-5 cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <div class="mt-1 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300
                        ${isDone ? `${colors.accent} border-transparent` : 'border-slate-300 group-hover:border-slate-400 bg-white'}">
                        <i data-lucide="check" class="w-4 h-4 text-white ${isDone ? 'scale-100' : 'scale-0'} transition-transform duration-200"></i>
                    </div>
                    <div class="flex-grow">
                        <p class="text-lg font-medium transition-all ${isDone ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800'}">
                            ${chap}
                        </p>
                        ${isDone ? '<span class="inline-block mt-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-wide">Completed</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderSubject(subId) {
        const sub = SYLLABUS[subId];
        const stats = this.getStats(subId);
        
        let contentHtml = '';
        
        if (sub.sections) {
            // Render Sections (SST)
            contentHtml = sub.sections.map((sec, sIdx) => `
                <div class="mb-8 last:mb-0">
                    <div class="flex items-center gap-3 mb-4 px-2">
                        <div class="h-px flex-grow bg-slate-200"></div>
                        <h3 class="text-lg font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 px-4 py-1 rounded-full border border-slate-200">${sec.title}</h3>
                        <div class="h-px flex-grow bg-slate-200"></div>
                    </div>
                    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        ${this.renderChapterList(sec.chapters, subId, sub.colors, sIdx)}
                    </div>
                </div>
            `).join('');
        } else {
            // Render Flat List (Maths, Science, etc)
            contentHtml = `
                <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    ${this.renderChapterList(sub.chapters, subId, sub.colors, null)}
                </div>
            `;
        }

        return `
            <div class="animate-fade-in max-w-4xl mx-auto pb-10">
                <div class="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm py-4 mb-4 border-b border-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <button onclick="app.setTab('overview')" class="p-2 -ml-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors md:hidden">
                            <i data-lucide="arrow-left" class="w-6 h-6"></i>
                        </button>
                        <div>
                            <h2 class="text-2xl md:text-3xl font-bold text-slate-900">${sub.title}</h2>
                            <p class="text-slate-500 text-sm font-medium">Class 10 NCERT</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                        <div class="text-right">
                            <p class="text-xs font-bold text-slate-400 uppercase">Progress</p>
                            <p class="text-lg font-bold ${sub.colors.text}">${stats.done}/${stats.total}</p>
                        </div>
                        <div class="w-12 h-12 relative">
                            <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path class="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="4" />
                                <path class="${sub.colors.text.replace('text-', 'text-')} transition-all duration-500" stroke-dasharray="${stats.pct}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
                            </svg>
                        </div>
                    </div>
                </div>

                ${contentHtml}
            </div>
        `;
    },

    getFocusSuggestion() {
        let lowest = { id: null, pct: 101, title: '' };
        Object.values(SYLLABUS).forEach(sub => {
            const stats = this.getStats(sub.id);
            if (stats.pct < lowest.pct) {
                lowest = { id: sub.id, pct: stats.pct, title: sub.title };
            }
        });

        if (lowest.pct === 100) return `<p class="text-emerald-400 font-bold">You're a legend! Syllabus complete.</p>`;

        return `
            <div class="bg-white/10 p-4 rounded-xl border border-white/5">
                <p class="text-xs text-brand-200 font-bold uppercase mb-1">Needs Attention</p>
                <p class="text-white font-bold text-lg">${lowest.title}</p>
                <div class="w-full bg-black/20 rounded-full h-1.5 mt-2">
                    <div class="bg-brand-400 h-full rounded-full" style="width: ${lowest.pct}%"></div>
                </div>
                <p class="text-right text-xs text-slate-400 mt-1">${lowest.pct}% Done</p>
            </div>
        `;
    },

    initChart() {
        const ctx = document.getElementById('mainChart');
        if (!ctx) return;
        
        if (this.state.charts.main) this.state.charts.main.destroy();

        const labels = Object.values(SYLLABUS).map(s => s.title);
        const data = Object.values(SYLLABUS).map(s => this.getStats(s.id).pct);
        const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#06b6d4', 
            '#f43f5e', '#6366f1', '#f43f5e', '#8b5cf6'
        ];

        this.state.charts.main = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Progress (%)',
                    data: data,
                    backgroundColor: colors,
                    borderRadius: 8,
                    barThickness: 30,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Plus Jakarta Sans' } } },
                    x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } } }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    },

    render() {
        this.renderNav();
        const content = document.getElementById('app-content');
        
        if (this.state.activeTab === 'overview') {
            content.innerHTML = this.renderOverview();
            setTimeout(() => this.initChart(), 0);
        } else {
            content.innerHTML = this.renderSubject(this.state.activeTab);
        }
        
        lucide.createIcons();
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
