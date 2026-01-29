// --- ELEMENTS ---
const form = document.getElementById('shorten-form');
const input = document.getElementById('url-input');
const resultArea = document.getElementById('result-area');
const output = document.getElementById('short-url-output');
const copyBtn = document.getElementById('copy-btn');
const openBtn = document.getElementById('open-btn');
const qrImage = document.getElementById('qr-image');

const overlay = document.getElementById('redirect-overlay');
const manualLink = document.getElementById('manual-link');
const debugUrl = document.getElementById('debug-url');
const statusText = document.getElementById('status-text');

const historySection = document.getElementById('history-section');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');

// --- 1. INITIALIZATION & ROUTING ---
window.addEventListener('DOMContentLoaded', () => {
    // Detect URL Parameters for redirect
    const fullUrl = window.location.href;
    const searchMatch = fullUrl.match(/[?&]go=([^&#]*)/);
    const code = searchMatch ? searchMatch[1] : null;

    if (code) {
        initRedirect(code);
    } else {
        loadDashboard();
    }
});

// --- 2. REDIRECT LOGIC ---
function initRedirect(code) {
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');

    try {
        const safeCode = code.replace(/ /g, '+');
        const originalUrl = LZString.decompressFromEncodedURIComponent(safeCode);

        if (originalUrl && /^https?:\/\//i.test(originalUrl)) {
            debugUrl.textContent = originalUrl;
            manualLink.href = originalUrl;
            statusText.textContent = "Initiating jump...";

            // Reduced delay to 100ms for instant feel
            setTimeout(() => {
                window.location.href = originalUrl;
                
                // Fallback if redirect takes too long or is blocked
                setTimeout(() => {
                        statusText.textContent = "Autopilot blocked. Please click 'Open Link Now' below.";
                }, 1000);
            }, 100);

        } else {
            throw new Error("Corrupted coordinates");
        }
    } catch (e) {
        statusText.innerHTML = "<span class='text-red-400'>Error: Invalid Signal.</span>";
        debugUrl.textContent = "Data Corrupted";
    }
}

// --- 3. GENERATION LOGIC ---
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const longUrl = input.value.trim();
    if (!longUrl) return;

    try { new URL(longUrl); } catch (err) {
        showToast("Invalid URL format. Must start with http/https");
        return;
    }

    // 1. Compress
    const compressed = LZString.compressToEncodedURIComponent(longUrl);
    
    // 2. Build Link
    const baseUrl = window.location.href.split(/[?#]/)[0];
    const magicLink = `${baseUrl}?go=${compressed}`;

    // 3. Update Result UI
    output.value = magicLink;
    openBtn.href = magicLink;
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(magicLink)}&bgcolor=ffffff`;

    resultArea.classList.remove('hidden');
    
    // 4. Save & Reload Dashboard
    addToHistory(longUrl, magicLink);
    
    // 5. Scroll
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast("Link Generated Successfully");
});

// --- 4. DASHBOARD / HISTORY MANAGER ---
function addToHistory(long, short) {
    let history = JSON.parse(localStorage.getItem('nebulaHistory') || '[]');
    const newItem = {
        id: Date.now(),
        long: long,
        short: short,
        date: new Date().toLocaleDateString()
    };
    history.unshift(newItem);
    localStorage.setItem('nebulaHistory', JSON.stringify(history));
    loadDashboard();
}

function deleteItem(id) {
    let history = JSON.parse(localStorage.getItem('nebulaHistory') || '[]');
    history = history.filter(item => item.id !== id);
    localStorage.setItem('nebulaHistory', JSON.stringify(history));
    loadDashboard();
    showToast("Entry Deleted");
}

function loadDashboard() {
    const history = JSON.parse(localStorage.getItem('nebulaHistory') || '[]');
    historyList.innerHTML = '';

    if (history.length > 0) {
        historySection.classList.remove('hidden');
        
        history.forEach(item => {
            let domain = 'Unknown Space';
            try { domain = new URL(item.long).hostname; } catch(e){}
            const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

            const card = document.createElement('div');
            card.className = 'glass-card p-4 rounded-xl group hover:border-indigo-500/40 transition-all duration-300 flex flex-col';
            card.innerHTML = `
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <img src="${favicon}" class="w-8 h-8 rounded-lg bg-white/10 p-1" onerror="this.src='https://placehold.co/32/indigo/white?text=URL'">
                        <div class="overflow-hidden">
                            <h4 class="font-bold text-white text-sm truncate w-full">${domain}</h4>
                            <p class="text-xs text-slate-400">${item.date}</p>
                        </div>
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="deleteItem(${item.id})" class="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </div>
                
                <div class="bg-black/20 rounded-lg p-2 mb-3 border border-white/5">
                    <p class="text-xs text-slate-500 truncate font-mono">${item.short}</p>
                </div>

                <div class="mt-auto flex gap-2">
                    <button onclick="copyText('${item.short}')" class="flex-1 py-2 rounded-lg bg-white/5 hover:bg-indigo-600 hover:text-white text-slate-300 text-xs font-bold transition-all">
                        Copy
                    </button>
                    <a href="${item.short}" target="_blank" class="flex-1 py-2 rounded-lg bg-white/5 hover:bg-emerald-600 hover:text-white text-slate-300 text-xs font-bold transition-all text-center flex items-center justify-center">
                        Visit
                    </a>
                </div>
            `;
            historyList.appendChild(card);
        });
    } else {
        historySection.classList.add('hidden');
    }
}

// --- 5. UTILITIES ---

copyBtn.addEventListener('click', () => copyText(output.value));

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("Link Copied to Clipboard");
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-msg');
    msgEl.innerText = msg;
    toast.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-24', 'opacity-0');
    }, 3000);
}

function downloadQR() {
    const url = qrImage.src;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nebula-qr.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

clearHistoryBtn.addEventListener('click', () => {
    if(confirm("Clear all mission logs?")) {
        localStorage.removeItem('nebulaHistory');
        loadDashboard();
        showToast("History Cleared");
    }
});
