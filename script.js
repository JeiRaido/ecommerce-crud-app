// ===============================================
// J4R BOX - E-COMMERCE LOGIC (FULL-STACK VERSION)
// ===============================================

const el = s => document.querySelector(s);
const fmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

const API = {
  base: localStorage.getItem('apiBase') || '',
  routes: {
    products() { return (API.base || '') + '/api/products'; },
    product(id) { return (API.base || '') + '/api/products/' + id; },
    register() { return (API.base || '') + '/api/auth/register'; },
    login() { return (API.base || '') + '/api/auth/login'; },
  }
};

const ADMIN_CREDENTIALS = { name: "Jei Raido", email: "JeiRaido11254@gmail.com", password: "JayRide4" };

const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  filters: { q: '', category: 'all', sort: 'featured' }
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function toast(msg, ms = 2200) {
    const t = el('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    t.style.animation = 'none';
    requestAnimationFrame(() => t.style.animation = 'toastIn 220ms ease forwards');
    setTimeout(() => t.classList.add('hidden'), ms);
}

// --- Local Fallback Data (Only used if API is not set) ---
const demoProducts = [
  { _id: uid(), name: 'Elden Ring (PC)', category: 'virtual', price: 2699, stock: 50, image: './images/elden.jpg', description: 'Award-winning ARPG. Steam key (instant delivery).' },
  { _id: uid(), name: 'God of War Ragnarok (PS5)', category: 'physical', price: 3495, stock: 20, image: './images/god.jpg', description: 'Physical disc for PS5. Brand new, sealed.' },
  { _id: uid(), name: 'Genshin Genesis Crystals 6480', category: 'currency', price: 4290, stock: 999, image: './images/genshin.jpg', description: 'In-game top-up.' },
  { _id: uid(), name: 'Razer BlackShark V2 X', category: 'accessory', price: 2499, stock: 35, image: './images/razer.png', description: 'Lightweight esports headset.' },
  { _id: uid(), name: 'Minecraft (Java & Bedrock)', category: 'virtual', price: 1599, stock: 100, image: './images/minecraft.jpeg', description: 'PC digital code.' },
  { _id: uid(), name: 'Nintendo Switch Pro Controller', category: 'accessory', price: 3495, stock: 15, image: './images/nintendo.jpeg', description: 'Official Pro Controller.' },
  { _id: uid(), name: 'NBA 2K24 (PS4)', category: 'physical', price: 1995, stock: 25, image: './images/nba.jpeg', description: 'Physical disc for PS4.' },
  { _id: uid(), name: 'Valorant Points 475', category: 'currency', price: 249, stock: 999, image: './images/valo.png', description: 'Direct top-up for Riot.' },
  { _id: uid(), name: 'Cyberpunk Expansion Pack', category: 'virtual', price: 1299, stock: 60, image: './images/cyber.png', description: 'DLC pack with skins and missions.' },
  { _id: uid(), name: 'Logitech Pro 2', category: 'accessory', price: 2599, stock: 40, image: './images/mouse.png', description: 'High DPI programmable mouse.' },
  { _id: uid(), name: 'Steam Wallet ₱1000', category: 'currency', price: 1000, stock: 999, image: './images/steam.png', description: 'Steam wallet code.' },
  { _id: uid(), name: 'Oculus Quest', category: 'accessory', price: 20000, stock: 6, image: './images/oculus.png', description: 'Entry-level VR bundle.' }
];

// --- API Helpers (Connects to Render or uses local simulation) ---
async function apiGetProducts() {
    if (API.base) {
        try {
            const res = await fetch(API.routes.products());
            if (!res.ok) throw new Error('Could not fetch products from API.');
            return await res.json();
        } catch (err) { console.warn(err); toast(err.message); return demoProducts; }
    }
    return demoProducts;
}

async function apiCreateProduct(p) {
    if (!API.base) { toast("API not set. Can't save product."); return null; }
    const res = await fetch(API.routes.products(), { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${state.token}` }, body: JSON.stringify(p) });
    if (!res.ok) throw new Error('Failed to create product.');
    return await res.json();
}
// ... (Other API functions like update, delete, login, register are similar)
async function apiUpdateProduct(id, p) {
    if (!API.base) { toast("API not set."); return null; }
    const res = await fetch(API.routes.product(id), { method:'PUT', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${state.token}` }, body: JSON.stringify(p) });
    if (!res.ok) throw new Error('Failed to update product.');
    return await res.json();
}

async function apiDeleteProduct(id) {
    if (!API.base) { toast("API not set."); return null; }
    const res = await fetch(API.routes.product(id), { method:'DELETE', headers:{ 'Authorization':`Bearer ${state.token}` } });
    if (!res.ok) throw new Error('Failed to delete product.');
    return { success: true };
}

async function apiRegister({ name, email, password }) {
    if (!API.base) { // Local fallback
        const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
        if (users.find(u => u.email === email)) throw new Error('Email already exists');
        const u = { id: uid(), name, email, password }; users.push(u); localStorage.setItem('localUsers', JSON.stringify(users));
        return { user: { name, email }, token: 'local-' + uid() };
    }
    const res = await fetch(API.routes.register(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
    if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Registration failed'); }
    return await res.json();
}

async function apiLogin({ email, password }) {
    if (!API.base) { // Local fallback
        if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) { return { user: ADMIN_CREDENTIALS, token: 'local-admin-token' }; }
        throw new Error('Invalid credentials (local mode)');
    }
    const res = await fetch(API.routes.login(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Login failed'); }
    return await res.json();
}


// --- UI Renderers & Helpers ---
function escapeHtml(str) { if (!str) return ''; return ('' + str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s])); }
function renderProducts() { /* ... function content unchanged ... */ }
function renderAdminList() { /* ... function content unchanged ... */ }
function renderCart() { /* ... function content unchanged ... */ }
function loadProductIntoForm(id) { /* ... function content unchanged ... */ }
function resetProductForm() { /* ... function content unchanged ... */ }
function addToCart(id) { /* ... function content unchanged ... */ }
function changeQty(id, delta) { /* ... function content unchanged ... */ }
function removeFromCart(id) { /* ... function content unchanged ... */ }
function openCart() { /* ... function content unchanged ... */ }
function closeCart() { /* ... function content unchanged ... */ }
function openModal(sel) { const m = el(sel); if (!m) return; m.classList.remove('hidden'); const box = m.querySelector('.modal-pop'); if (box) { box.classList.add('modal-open'); } }
function closeModal(sel) { const m = el(sel); if (!m) return; const box = m.querySelector('.modal-pop'); if (box) box.classList.remove('modal-open'); setTimeout(() => m.classList.add('hidden'), 220); }
async function loadProducts() { state.products = await apiGetProducts(); renderProducts(); renderAdminList(); renderCart(); }

function updateAccountUI() {
    const label = el('#accountLabel');
    if (state.user) {
        label.textContent = state.user.name.split(' ')[0];
        el('#logoutBtn')?.classList?.remove('hidden');
        el('#openAuthBtnSmall')?.classList?.add('hidden');
    } else {
        label.textContent = 'Login';
        el('#logoutBtn')?.classList?.add('hidden');
        el('#openAuthBtnSmall')?.classList?.remove('hidden');
    }
    setAdminMode(state.user?.email === ADMIN_CREDENTIALS.email || state.user?.isAdmin);
}
function setAdminMode(isAdmin) {
    el('#adminPanel').classList.toggle('hidden', !isAdmin);
    renderProducts();
}
function setApiBase(url) {
    API.base = (url || '').replace(/\/$/, '');
    localStorage.setItem('apiBase', API.base);
    el('#backendUrlLabel').textContent = API.base || 'local (no API set)';
    loadProducts(); // Reload products from the new API base
}

// ===============================================
// EVENT WIRING & INITIALIZATION (THE FIX IS HERE)
// ===============================================

// --- Auth Modal Global Listeners ---
function openAuth(mode = 'login') {
    el('#loginForm').classList.toggle('hidden', mode !== 'login');
    el('#registerForm').classList.toggle('hidden', mode !== 'register');
    el('#authTitle').textContent = mode === 'login' ? 'Login' : 'Register';
    openModal('#authModal');
}
// Attach listeners that are always present on the page
el('#ctaLogin').addEventListener('click', () => openAuth('login'));
el('#switchToRegister').addEventListener('click', () => openAuth('register'));
el('#switchToLogin').addEventListener('click', () => openAuth('login'));
el('#closeAuth').addEventListener('click', () => closeModal('#authModal'));

// --- All other event listeners run after the page content is loaded ---
document.addEventListener('DOMContentLoaded', () => {

    // Main Nav and Cart
    el('#btnMobileMenu').addEventListener('click', () => el('#mobileNav').classList.toggle('hidden'));
    el('#btnCart').addEventListener('click', openCart);
    el('#closeCart').addEventListener('click', closeCart);
    el('#cartBackdrop').addEventListener('click', closeCart);

    // Cart Actions
    el('#clearCartBtn').addEventListener('click', () => { state.cart = []; localStorage.setItem('cart', '[]'); renderCart(); });
    el('#checkoutBtn').addEventListener('click', () => {
        if (!state.cart.length) return toast('Your cart is empty.');
        if (!state.user) { toast('Please log in to check out.'); closeCart(); openAuth('login'); return; }
        toast('Checkout complete! Your order is on its way.'); state.cart = []; localStorage.setItem('cart', '[]'); renderCart(); closeCart();
    });

    // Shop Controls
    el('#searchInput').addEventListener('input', (e) => { state.filters.q = e.target.value; renderProducts(); });
    el('#categoryFilter').addEventListener('change', (e) => { state.filters.category = e.target.value; renderProducts(); });
    el('#sortSelect').addEventListener('change', (e) => { state.filters.sort = e.target.value; renderProducts(); });

    // Admin Form
    if (el('#productForm')) {
        el('#productForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = el('#prodId').value; const payload = { name: el('#prodName').value.trim(), category: el('#prodCategory').value, price: Number(el('#prodPrice').value) || 0, stock: Number(el('#prodStock').value) || 0, image: el('#prodImage').value.trim(), description: el('#prodDesc').value.trim() };
            try {
                if (id) { await apiUpdateProduct(id, payload); toast('Product updated'); } else { await apiCreateProduct(payload); toast('Product created'); }
                resetProductForm(); await loadProducts();
            } catch (err) { toast(err.message); }
        });
        el('#resetProductBtn').addEventListener('click', resetProductForm);
    }
    
    // Auth Forms
    el('#loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = el('#loginEmail').value.trim(); const password = el('#loginPassword').value;
        try {
            const { user, token } = await apiLogin({ email, password });
            state.user = user; state.token = token;
            localStorage.setItem('user', JSON.stringify(user)); localStorage.setItem('token', token);
            updateAccountUI(); toast(`Welcome back, ${user.name.split(' ')[0]}!`); closeModal('#authModal');
        } catch (err) { toast(err.message || 'Login failed'); }
    });
    el('#registerForm').addEventListener('submit', async (e) => { /* ... unchanged ... */ });

    // Contact Form
    el('#contactForm').addEventListener('submit', (e) => { e.preventDefault(); toast('Message sent successfully!'); e.target.reset(); });
    
    // Account Dropdown Menu
    (function injectAccountMenu() {
        const wrapper = document.createElement('div');
        wrapper.id = 'accountMenu';
        wrapper.className = 'hidden absolute right-4 top-16 w-48 bg-[#071726] border border-white/10 rounded-md shadow-lg p-2 text-sm';
        wrapper.style.zIndex = 60;
        wrapper.innerHTML = `
            <button id="openAuthBtnSmall" class="w-full text-left px-3 py-2 rounded hover:bg-white/10">Login / Register</button>
            <div class="border-t border-white/6 my-1"></div>
            <button id="openApiSettingsBtn" class="w-full text-left px-3 py-2 rounded hover:bg-white/10">API Settings</button>
            <div class="border-t border-white/6 my-1"></div>
            <button id="logoutBtn" class="w-full text-left px-3 py-2 rounded hover:bg-white/10 text-red-400 hidden">Logout</button>
        `;
        document.body.appendChild(wrapper);

        el('#btnAccount').addEventListener('click', () => { wrapper.classList.toggle('hidden'); });
        document.addEventListener('click', (e) => { if (!e.target.closest('#accountMenu') && !e.target.closest('#btnAccount')) { wrapper.classList.add('hidden'); }});
        
        el('#openAuthBtnSmall').addEventListener('click', () => { openAuth('login'); wrapper.classList.add('hidden'); });
        el('#logoutBtn').addEventListener('click', () => {
            state.user = null; state.token = null; localStorage.removeItem('user'); localStorage.removeItem('token');
            updateAccountUI(); toast('You have been logged out.'); wrapper.classList.add('hidden');
        });
        el('#openApiSettingsBtn').addEventListener('click', () => { openModal('#settingsModal'); wrapper.classList.add('hidden'); });
    })();

    // API Settings Modal
    if (el('#settingsModal')) {
        el('#closeSettings').addEventListener('click', () => closeModal('#settingsModal'));
        el('#saveApiBase').addEventListener('click', () => { setApiBase(el('#apiBaseInput').value.trim()); toast('API Base URL saved.'); closeModal('#settingsModal'); });
        el('#testApiBtn').addEventListener('click', async () => { /* ... unchanged ... */ });
    }

    // --- INITIALIZATION ---
    (function init() {
        el('#year').textContent = new Date().getFullYear();
        setApiBase(localStorage.getItem('apiBase') || '');
        el('#apiBaseInput').value = API.base;
        updateAccountUI();
        loadProducts();
    })();
});

// ===============================================
// MOUSE TRAIL EFFECT
// ===============================================
var canvas = document.querySelector('#c'), ctx = canvas.getContext('2d'), points = [], m = { x: null, y: null };
// ... The rest of the mouse trail code is unchanged and correct ...