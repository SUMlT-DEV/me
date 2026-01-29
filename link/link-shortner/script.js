import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBI7p9Z7ddesuusrBhSDlTOJ-HTkZ4BsNA",
    authDomain: "link-shortner-7a8ca.firebaseapp.com",
    projectId: "link-shortner-7a8ca",
    storageBucket: "link-shortner-7a8ca.firebasestorage.app",
    messagingSenderId: "940692999616",
    appId: "1:940692999616:web:04e09c20d46f2560410c25"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const appId = 'link-shortner-7a8ca';

let currentUserId = null;
let linkToDelete = null;

const els = {
    form: document.getElementById('create-form'),
    submitBtn: document.getElementById('submit-btn'),
    longUrl: document.getElementById('long-url'),
    alias: document.getElementById('custom-alias'),
    resultCard: document.getElementById('result-card'),
    finalUrl: document.getElementById('final-url'),
    visitBtn: document.getElementById('visit-btn'),
    historyList: document.getElementById('history-list'),
    deleteModal: document.getElementById('delete-modal'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    redirectOverlay: document.getElementById('redirect-overlay'),
    redirectTarget: document.getElementById('redirect-target'),
    manualLink: document.getElementById('manual-link')
};

// --- LOCAL USER ID GENERATION ---
function getLocalUserId() {
    let id = localStorage.getItem('nebula_user_id');
    if (!id) {
        id = 'user_' + generateId(8);
        localStorage.setItem('nebula_user_id', id);
    }
    return id;
}

async function init() {
    // Set User ID from LocalStorage instead of Firebase Auth
    currentUserId = getLocalUserId();

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) startRedirect(id);

    try {
        // Directly load data without waiting for auth
        loadHistory();
        if (id) executeRedirect(id);
    } catch (e) {
        showError(e);
    }
}

function startRedirect(id) {
    els.redirectOverlay.classList.remove('hidden');
    els.redirectOverlay.classList.add('flex');
}

async function executeRedirect(id) {
    try {
        const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'links', id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            els.redirectTarget.textContent = `Traveling to ${new URL(data.longUrl).hostname}`;
            els.manualLink.href = data.longUrl;
            els.manualLink.classList.remove('hidden');
            
            setTimeout(() => { window.location.href = data.longUrl; }, 800);
        } else {
            els.redirectTarget.textContent = "Error: Invalid Coordinates";
            els.redirectTarget.classList.add('text-red-400');
            setTimeout(() => { els.redirectOverlay.classList.add('hidden'); showToast("Link not found"); }, 2000);
        }
    } catch (e) {
        console.error(e);
    }
}

els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnOriginal = els.submitBtn.innerHTML;
    els.submitBtn.innerHTML = '<div class="spinner"></div>';
    els.submitBtn.disabled = true;

    const long = els.longUrl.value.trim();
    let alias = els.alias.value.trim().replace(/[^a-zA-Z0-9-_]/g, '');
    if(!alias) alias = generateId(6);

    try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'links', alias);
        const exists = (await getDoc(docRef)).exists();
        
        if (exists) {
            showToast("Alias unavailable");
            els.submitBtn.innerHTML = btnOriginal;
            els.submitBtn.disabled = false;
            return;
        }

        const shortUrl = `${window.location.origin}${window.location.pathname}?id=${alias}`;
        await setDoc(docRef, {
            id: alias,
            longUrl: long,
            shortUrl: shortUrl,
            author: currentUserId, // Use LocalStorage ID
            createdAt: Date.now()
        });

        els.finalUrl.value = shortUrl;
        els.visitBtn.href = shortUrl;
        els.resultCard.classList.remove('hidden');
        els.longUrl.value = '';
        els.alias.value = '';
        showToast("Link Deployed");

    } catch (e) {
        console.error(e);
        showError(e);
    } finally {
        els.submitBtn.innerHTML = btnOriginal;
        els.submitBtn.disabled = false;
    }
});

function loadHistory() {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'links'), limit(20));
    
    onSnapshot(q, (snapshot) => {
        const links = [];
        snapshot.forEach(d => links.push(d.data()));
        links.sort((a,b) => b.createdAt - a.createdAt);

        els.historyList.innerHTML = '';
        if(links.length === 0) {
            els.historyList.innerHTML = `<div class="text-center py-10 text-slate-600 italic text-sm">Log is empty. Initiate first link.</div>`;
            return;
        }

        links.forEach(link => {
            // Compare with LocalStorage ID
            const isMine = link.author === currentUserId;
            let domain = '...';
            try { domain = new URL(link.longUrl).hostname; } catch {}

            const div = document.createElement('div');
            div.className = `glass-panel p-4 rounded-xl flex items-center justify-between group hover:border-white/20 transition-all ${isMine ? 'border-l-2 border-l-violet-500' : 'opacity-70'}`;
            
            div.innerHTML = `
                <div class="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-slate-400">
                        <i class="fa-solid fa-link"></i>
                    </div>
                    <div class="overflow-hidden">
                        <div class="flex items-center gap-2 mb-0.5">
                            <span class="text-sm font-bold text-white font-mono">${link.id}</span>
                            ${isMine ? '<span class="text-[10px] bg-violet-500/20 text-violet-300 px-1.5 rounded hidden sm:inline">YOU</span>' : ''}
                        </div>
                        <div class="text-xs text-slate-500 truncate font-mono max-w-[150px] sm:max-w-[200px]">${domain}</div>
                    </div>
                </div>
                
                <div class="flex items-center gap-1 sm:gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="copyToClip('${link.shortUrl}')" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-400 transition-colors flex items-center justify-center">
                        <i class="fa-regular fa-copy text-xs"></i>
                    </button>
                    ${isMine ? `
                    <button onclick="promptDelete('${link.id}')" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors flex items-center justify-center">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>` : ''}
                </div>
            `;
            els.historyList.appendChild(div);
        });
    });
}

// Attach global helpers to window
window.promptDelete = (id) => {
    linkToDelete = id;
    els.deleteModal.classList.remove('hidden');
    els.deleteModal.classList.add('flex');
};

window.closeDeleteModal = () => {
    linkToDelete = null;
    els.deleteModal.classList.add('hidden');
    els.deleteModal.classList.remove('flex');
};

els.confirmDeleteBtn.addEventListener('click', async () => {
    if(!linkToDelete) return;
    try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'links', linkToDelete));
        showToast("Entry Deleted");
        closeDeleteModal();
    } catch(e) {
        showToast("Delete Failed");
    }
});

window.copyToClip = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to Clipboard");
};

window.resetForm = () => {
    els.resultCard.classList.add('hidden');
    els.longUrl.value = '';
    els.alias.value = '';
};

function generateId(len) {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let res = "";
    for(let i=0; i<len; i++) res += chars[Math.floor(Math.random()*chars.length)];
    return res;
}

function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    t.classList.remove('translate-y-32', 'opacity-0');
    setTimeout(() => t.classList.add('translate-y-32', 'opacity-0'), 3000);
}

function showError(error) {
    const ov = document.getElementById('error-overlay');
    const txt = document.getElementById('error-text');
    const sol = document.getElementById('solution-box');
    
    txt.textContent = error.message;
    
    if(error.code === 'permission-denied') {
            sol.innerHTML = "<strong>Fix:</strong> Firestore Rules might be blocking public access. Set rules to Test Mode.";
    } else {
            sol.textContent = `Code: ${error.code}`;
    }
    
    ov.classList.remove('hidden');
    ov.classList.add('flex');
}

// Initialize on Load
init();
document.getElementById('copy-btn').onclick = () => copyToClip(els.finalUrl.value);
