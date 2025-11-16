// ===============================================
// J4R BOX - E-COMMERCE LOGIC
// ===============================================

// Basic helpers & config
const el = s => document.querySelector(s);
const els = s => Array.from(document.querySelectorAll(s));
const fmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

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

// Demo product list (local fallback)
const demoProducts = [
    // ... (Your 12 products remain here)
    { _id: uid(), name: 'Elden Ring (PC)', category: 'virtual', price: 2699, stock: 50, image: './images/elden.jpg', description: 'Award-winning ARPG. Steam key (instant delivery).' },
    { _id: uid(), name: 'God of War Ragnarok (PS5)', category: 'physical', price: 3495, stock: 20, image: './images/god.jpg', description: 'Physical disc for PS5. Brand new, sealed.' },
    { _id: uid(), name: 'Genshin Genesis Crystals 6480', category: 'currency', price: 4290, stock: 999, image: './images/genshin.jpg', description: 'In-game top-up.' },
    { _id: uid(), name: 'Razer BlackShark V2 X', category: 'accessory', price: 2499, stock: 35, image: './images/razer.png', description: 'Lightweight esports headset.' },
    { _id: uid(), name: 'Minecraft (Java & Bedrock)', category: 'virtual', price: 1599, stock: 100, image: './images/minecraft.jpeg', description: 'PC digital code.' },
    { _id: uid(), name: 'Nintendo Switch Pro Controller', category: 'accessory', price: 3495, stock: 15, image: './images/nintendo.jpeg', description: 'Official Pro Controller.' },
    { _id: uid(), name: 'NBA 2K24 (PS4)', category: 'physical', price: 1995, stock: 25, image: './images/nba.jpeg', description: 'Physical disc for PS4.' },
    { _id: uid(), name: 'Valorant Points 475', category: 'currency', price: 249, stock: 999, image: './images/valo.png', description: 'Direct top-up for Riot.' },
    { _id: uid(), name: 'Cyberpunk Expansion Pack', category: 'virtual', price: 1299, stock: 60, image: 'https://picsum.photos/seed/cp/600/400', description: 'DLC pack with skins and missions.' },
    { _id: uid(), name: 'Gaming Mouse Pro', category: 'accessory', price: 2599, stock: 40, image: 'https://picsum.photos/seed/mouse/600/400', description: 'High DPI programmable mouse.' },
    { _id: uid(), name: 'Steam Wallet ₱1000', category: 'currency', price: 1000, stock: 999, image: 'https://picsum.photos/seed/steam/600/400', description: 'Steam wallet code.' },
    { _id: uid(), name: 'VR Starter Kit', category: 'accessory', price: 8999, stock: 6, image: 'https://picsum.photos/seed/vr/600/400', description: 'Entry-level VR bundle.' }
];

if (!localStorage.getItem('products')) localStorage.setItem('products', JSON.stringify(demoProducts));

// --- API Helpers (Local Simulation) ---
async function apiGetProducts() { /* ... unchanged ... */ return JSON.parse(localStorage.getItem('products') || '[]'); }
async function apiCreateProduct(p) { /* ... unchanged ... */ }
async function apiUpdateProduct(id, p) { /* ... unchanged ... */ }
async function apiDeleteProduct(id) { /* ... unchanged ... */ }
async function apiRegister({ name, email, password }) { /* ... unchanged ... */ }
async function apiLogin({ email, password }) {
    // Local simulation
    const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
    const u = users.find(x => x.email === email && x.password === password);
    if (u) return { user: { name: u.name, email: u.email }, token: 'local-' + uid() };
    
    // Check for admin
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        return { user: { name: ADMIN_CREDENTIALS.name, email: ADMIN_CREDENTIALS.email, admin: true }, token: 'local-admin-' + uid() };
    }
    throw new Error('Invalid credentials');
}

// --- UI Renderers ---
function renderProducts() {
    const grid = el('#productGrid');
    let list = [...state.products];

    // Filtering and sorting logic remains the same...
    const q = state.filters.q.trim().toLowerCase();
    if (q) list = list.filter(p => (p.name + ' ' + (p.description||'')).toLowerCase().includes(q));
    if (state.filters.category !== 'all') list = list.filter(p => p.category === state.filters.category);

    switch(state.filters.sort) {
      case 'price-asc': list.sort((a,b)=>a.price-b.price); break;
      case 'price-desc': list.sort((a,b)=>b.price-a.price); break;
      case 'name-asc': list.sort((a,b)=>a.name.localeCompare(b.name)); break;
      case 'name-desc': list.sort((a,b)=>b.name.localeCompare(a.name)); break;
      default: break;
    }

    // UPDATED RENDERER FOR ALIGNMENT
    grid.innerHTML = list.map(p => {
        const thumb = p.image ? `<img src="${p.image}" alt="${escapeHtml(p.name)}" class="w-full h-44 object-cover rounded" />` :
            `<div class="h-44 img-fallback rounded text-sm">No image</div>`;
        const isAdmin = state.user && state.user.email === ADMIN_CREDENTIALS.email;

        return `
        <div class="card p-4 rounded-lg flex flex-col">
            <div class="mb-3">${thumb}</div>
            <div class="flex-grow">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <div class="font-semibold leading-tight line-clamp-2">${escapeHtml(p.name)}</div>
                        <div class="text-xs text-slate-400">${escapeHtml(p.description || '')}</div>
                    </div>
                    <div class="text-indigo-300 font-bold whitespace-nowrap">${fmt.format(p.price)}</div>
                </div>
            </div>
            <div class="mt-4 flex items-center justify-between">
                <span class="text-xs px-2 py-1 rounded border border-white/10 bg-white/5 text-slate-300 capitalize">${p.category}</span>
                <div class="flex items-center gap-2">
                    ${isAdmin ? `
                    <button class="px-2 py-1 rounded border border-white/10 text-xs" data-edit="${p._id}">Edit</button>
                    <button class="px-2 py-1 rounded border border-red-500/50 text-red-400 text-xs" data-del="${p._id}">Del</button>
                    ` : ''}
                    <button class="px-3 py-1.5 rounded bg-white/10 text-slate-100 text-sm hover:bg-white/20" data-add="${p._id}">Add to Cart</button>
                </div>
            </div>
        </div>
      `;
    }).join('');

    // Re-attach events
    grid.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', () => addToCart(btn.getAttribute('data-add'))));
    if (state.user && state.user.email === ADMIN_CREDENTIALS.email) {
        grid.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => loadProductIntoForm(btn.getAttribute('data-edit'))));
        grid.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-del');
            if (confirm('Are you sure you want to delete this product?')) {
                await apiDeleteProduct(id);
                await loadProducts();
                toast('Product deleted');
            }
        }));
    }
}
// Other renderers (renderAdminList, renderCart) remain mostly the same...
function renderAdminList() { /* ... unchanged ... */ }
function renderCart() { /* ... unchanged ... */ }

// --- Admin, Cart, Modal Helpers ---
function loadProductIntoForm(id) { /* ... unchanged ... */ }
function resetProductForm() { /* ... unchanged ... */ }
function addToCart(id) { /* ... unchanged ... */ }
function changeQty(id, delta) { /* ... unchanged ... */ }
function removeFromCart(id) { /* ... unchanged ... */ }
function openCart() { /* ... unchanged ... */ }
function closeCart() { /* ... unchanged ... */ }
function openModal(sel) { /* ... unchanged ... */ }
function closeModal(sel) { /* ... unchanged ... */ }

async function loadProducts() {
    const data = await apiGetProducts();
    state.products = data.map(p => ({ ...p, _id: p._id || p.id || uid() }));
    renderProducts();
    renderAdminList();
    renderCart();
}

// --- Auth & Account UI ---
function updateAccountUI() {
    const label = el('#accountLabel');
    if (state.user) {
        label.textContent = state.user.name || state.user.email;
        el('#logoutBtn')?.classList?.remove('hidden');
        el('#openAuthBtnSmall')?.classList?.add('hidden');
    } else {
        label.textContent = 'Login';
        el('#logoutBtn')?.classList?.add('hidden');
        el('#openAuthBtnSmall')?.classList?.remove('hidden');
    }
    // Automatically set admin mode based on user
    setAdminMode(state.user && state.user.email === ADMIN_CREDENTIALS.email);
}

function setAdminMode(isAdmin) {
    el('#adminPanel').classList.toggle('hidden', !isAdmin);
    renderProducts(); // Re-render products to show/hide admin buttons
}

// --- Event Wiring ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Header & Nav
    el('#btnMobileMenu').addEventListener('click', () => el('#mobileNav').classList.toggle('hidden'));
    el('#btnCart').addEventListener('click', openCart);
    el('#closeCart').addEventListener('click', closeCart);
    el('#cartBackdrop').addEventListener('click', closeCart);

    // Cart Actions
    el('#clearCartBtn').addEventListener('click', () => {
        state.cart = [];
        localStorage.setItem('cart', '[]');
        renderCart();
    });

    el('#checkoutBtn').addEventListener('click', () => {
        if (!state.cart.length) return toast('Your cart is empty.');
        // NEW: Check if user is logged in
        if (!state.user) {
            toast('Please log in to check out.');
            closeCart();
            openAuth('login');
            return;
        }
        // If logged in, proceed
        toast('Checkout complete! Your order is on its way.');
        state.cart = [];
        localStorage.setItem('cart', '[]');
        renderCart();
        closeCart();
    });

    // Shop Controls
    el('#searchInput').addEventListener('input', (e) => { state.filters.q = e.target.value; renderProducts(); });
    el('#categoryFilter').addEventListener('change', (e) => { state.filters.category = e.target.value; renderProducts(); });
    el('#sortSelect').addEventListener('change', (e) => { state.filters.sort = e.target.value; renderProducts(); });

    // Admin Form
    el('#productForm').addEventListener('submit', async (e) => { /* ... unchanged ... */ });
    el('#resetProductBtn').addEventListener('click', resetProductForm);

    // Auth Modals
    function openAuth(mode = 'login') {
        el('#loginForm').classList.toggle('hidden', mode !== 'login');
        el('#registerForm').classList.toggle('hidden', mode !== 'register');
        el('#authTitle').textContent = mode === 'login' ? 'Login' : 'Register';
        openModal('#authModal');
    }
    el('#ctaLogin').addEventListener('click', () => openAuth('login'));
    el('#switchToRegister').addEventListener('click', () => openAuth('register'));
    el('#switchToLogin').addEventListener('click', () => openAuth('login'));
    el('#closeAuth').addEventListener('click', () => closeModal('#authModal'));

    // Auth Forms
    el('#loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = el('#loginEmail').value.trim();
        const password = el('#loginPassword').value;
        try {
            const { user } = await apiLogin({ email, password });
            state.user = user;
            localStorage.setItem('user', JSON.stringify(user));
            updateAccountUI();
            toast(`Welcome back, ${user.name || user.email}!`);
            closeModal('#authModal');
        } catch (err) {
            toast(err.message || 'Login failed');
        }
    });
    el('#registerForm').addEventListener('submit', async (e) => { /* ... unchanged ... */ });

    // Simplified Account Menu
    (function injectAccountMenu() {
        const wrapper = document.createElement('div');
        wrapper.id = 'accountMenu';
        wrapper.className = 'hidden absolute right-4 top-16 w-48 bg-[#071726] border border-white/10 rounded-md shadow-lg p-2 text-sm';
        wrapper.style.zIndex = 60;
        wrapper.innerHTML = `
            <button id="openAuthBtnSmall" class="w-full text-left px-3 py-2 rounded hover:bg-white/10">Login / Register</button>
            <button id="logoutBtn" class="w-full text-left px-3 py-2 rounded hover:bg-white/10 text-red-400 hidden">Logout</button>
        `;
        document.body.appendChild(wrapper);

        el('#btnAccount').addEventListener('click', (ev) => {
            wrapper.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#accountMenu') && !e.target.closest('#btnAccount')) {
                wrapper.classList.add('hidden');
            }
        });

        el('#openAuthBtnSmall').addEventListener('click', () => { openAuth('login'); wrapper.classList.add('hidden'); });
        el('#logoutBtn').addEventListener('click', () => {
            state.user = null;
            localStorage.removeItem('user');
            updateAccountUI();
            toast('You have been logged out.');
            wrapper.classList.add('hidden');
        });
    })();

    // Contact Form
    el('#contactForm').addEventListener('submit', (e) => { e.preventDefault(); toast('Message sent successfully!'); e.target.reset(); });
    
    function escapeHtml(str) { /* ... unchanged ... */ }

    // --- Init ---
    (function init() {
        el('#year').textContent = new Date().getFullYear();
        updateAccountUI();
        loadProducts();

        // Ensure admin simulated user exists locally
        const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
        if (!localUsers.find(u => u.email === ADMIN_CREDENTIALS.email)) {
            localUsers.push({ id: uid(), ...ADMIN_CREDENTIALS });
            localStorage.setItem('localUsers', JSON.stringify(localUsers));
        }
    })();
});

// ===============================================
// NEW MOUSE TRAIL EFFECT
// ===============================================
var canvas = document.querySelector('#c'),
    ctx = canvas.getContext('2d'),
    points = [],
    m = { x: null, y: null };

var a = 20; // how many dots
var b = 5; // how fast to spin
var c = 0.1; // how much to fade
var d = 100; // distance from mouse

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

m.x = canvas.width / 2;
m.y = canvas.height / 2;

window.addEventListener('mousemove', function (e) {
    TweenMax.to(m, 0.3, { x: e.clientX, y: e.clientY, ease: 'linear' });
});

for (var i = 0; i < a; i++) {
    points.push({
        r: 360 / a * i,
        p: { x: null, y: null },
        c: '#fff',
        d: Math.random() * (d + 5) - 5,
        s: Math.random() * (b + 5) - 5
    });
}

function render() {
    if (m.x == null || m.y == null) return;
    ctx.fillStyle = `rgba(5, 8, 11, ${c})`; // Match the --bg color for a seamless fade
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    for (var i = 0; i < points.length; i++) {
        var p = points[i];
        p.r += p.s;
        if (p.r >= 360) p.r = p.r - 360;
        var vel = {
            x: p.d * Math.cos(p.r * Math.PI / 180),
            y: p.d * Math.sin(p.r * Math.PI / 180)
        };
        if (p.p.x != null && p.p.y != null) {
            ctx.strokeStyle = p.c;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.p.x, p.p.y);
            ctx.lineTo(m.x + vel.x, m.y + vel.y);
            ctx.stroke();
            ctx.closePath();
        }
        p.p.x = m.x + vel.x;
        p.p.y = m.y + vel.y;
    }
}

window.requestAnimFrame = (() => {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) { window.setTimeout(callback, 1000 / 60); };
})();

(function animloop() {
    requestAnimFrame(animloop);
    render();
})();