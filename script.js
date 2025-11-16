// ===============================================
// J4R BOX - E-COMMERCE LOGIC
// ===============================================

const el = s => document.querySelector(s);
const els = s => Array.from(document.querySelectorAll(s));
const fmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

const API = {
  base: localStorage.getItem('apiBase') || '',
  routes: {
    products() { return (API.base || '') + '/api/products'; },
    product(id) { return (API.base || '') + '/api/products/' + id; },
    register() { return (API.base || '') + '/api/auth/register'; },
    login() { return (API.base || '') + '/api/auth/login'; },
    me() { return (API.base || '') + '/api/auth/me'; }
  }
};

const ADMIN_CREDENTIALS = { name: "Jei Raido", email: "JeiRaido11254@gmail.com", password: "JayRide4" };

const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  adminMode: JSON.parse(localStorage.getItem('adminMode') || 'false'),
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

// YOUR UPDATED PRODUCT LIST
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

if (!localStorage.getItem('products')) localStorage.setItem('products', JSON.stringify(demoProducts));

// --- API Helpers (Local Simulation) ---
async function apiGetProducts() { return JSON.parse(localStorage.getItem('products') || '[]'); }
async function apiCreateProduct(p) {
    const local = JSON.parse(localStorage.getItem('products') || '[]');
    const withId = { ...p, _id: uid() };
    local.unshift(withId);
    localStorage.setItem('products', JSON.stringify(local));
    return withId;
}
async function apiUpdateProduct(id, p) {
    const local = JSON.parse(localStorage.getItem('products') || '[]');
    const idx = local.findIndex(x => x._id === id);
    if (idx >= 0) {
        local[idx] = { ...local[idx], ...p };
        localStorage.setItem('products', JSON.stringify(local));
        return local[idx];
    }
    return null;
}
async function apiDeleteProduct(id) {
    const local = JSON.parse(localStorage.getItem('products') || '[]');
    const filtered = local.filter(x => x._id !== id);
    localStorage.setItem('products', JSON.stringify(filtered));
    return true;
}
async function apiRegister({ name, email, password }) {
    const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
    if (users.find(u => u.email === email)) throw new Error('Email already exists (local)');
    const u = { id: uid(), name, email, password };
    users.push(u);
    localStorage.setItem('localUsers', JSON.stringify(users));
    return { user: { name, email }, token: 'local-' + uid() };
}
async function apiLogin({ email, password }) {
    const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
    const u = users.find(x => x.email === email && x.password === password);
    if (u) return { user: { name: u.name, email: u.email }, token: 'local-' + uid() };
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        return { user: { name: ADMIN_CREDENTIALS.name, email: ADMIN_CREDENTIALS.email, admin: true }, token: 'local-admin-' + uid() };
    }
    throw new Error('Invalid credentials (local)');
}

// --- UI Renderers ---
function renderProducts() {
  const grid = el('#productGrid');
  let list = [...state.products];
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
  grid.innerHTML = list.map(p => {
    const thumb = p.image ? `<img src="${p.image}" alt="${escapeHtml(p.name)}" class="w-full h-44 object-cover rounded" onerror="this.style.display='none'; this.nextSibling.style.display='grid';"/>` + `<div class="h-44 img-fallback rounded text-slate-300 text-sm" style="display:none;">No image</div>` :
      `<div class="h-44 img-fallback rounded text-slate-300 text-sm">No image</div>`;
    return `
      <div class="card p-4 rounded-lg flex flex-col">
        <div class="mb-3">${thumb}</div>
        <div class="flex items-start justify-between gap-3 flex-grow">
          <div class="min-w-0">
            <div class="font-semibold leading-tight line-clamp-2">${escapeHtml(p.name)}</div>
            <div class="text-xs text-slate-400">${escapeHtml(p.description || '')}</div>
          </div>
          <div class="text-indigo-300 font-bold">${fmt.format(p.price)}</div>
        </div>
        <div class="mt-3 flex items-center justify-between">
          <span class="text-xs px-2 py-1 rounded border text-slate-300">${p.category}</span>
          <div class="flex items-center gap-2">
            <button class="px-3 py-1.5 rounded bg-white/6 text-slate-100 text-sm" data-add="${p._id}">Add to Cart</button>
            ${state.adminMode ? `<button class="px-2 py-1 rounded border text-xs" data-edit="${p._id}">Edit</button>
                                <button class="px-2 py-1 rounded border text-red-500" data-del="${p._id}">Delete</button>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
  grid.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', ()=> addToCart(btn.getAttribute('data-add'))));
  if (state.adminMode) {
    grid.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', ()=> loadProductIntoForm(btn.getAttribute('data-edit'))));
    grid.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async ()=>{
      const id = btn.getAttribute('data-del');
      if (confirm('Delete this product?')) {
        await apiDeleteProduct(id); await loadProducts(); toast('Product deleted');
      }
    }));
  }
}
function renderAdminList() { /* ... This function remains the same as before ... */ }
function renderCart() { /* ... This function remains the same as before ... */ }

// --- Admin, Cart, and Modal Helpers ---
function loadProductIntoForm(id) { /* ... This function remains the same as before ... */ }
function resetProductForm() { /* ... This function remains the same as before ... */ }
function addToCart(id) { /* ... This function remains the same as before ... */ }
function changeQty(id, delta) { /* ... This function remains the same as before ... */ }
function removeFromCart(id) { /* ... This function remains the same as before ... */ }
function openCart() { /* ... This function remains the same as before ... */ }
function closeCart() { /* ... This function remains the same as before ... */ }
function openModal(sel) { /* ... This function remains the same as before ... */ }
function closeModal(sel) { /* ... This function remains the same as before ... */ }

// --- Load / Init ---
async function loadProducts() {
  const data = await apiGetProducts();
  state.products = data.map(p => ({ ...p, _id: p._id || p.id || uid() }));
  renderProducts();
  renderAdminList();
  renderCart();
}

// --- Auth & Account UI ---
function updateAccountUI() { /* ... This function remains the same as before ... */ }
function setAdminMode(on) { /* ... This function remains the same as before ... */ }

// --- Event Wiring ---
document.addEventListener('DOMContentLoaded', () => {
    // All event listeners from my first response go here
    el('#btnMobileMenu').addEventListener('click', ()=> el('#mobileNav').classList.toggle('hidden'));
    el('#btnCart').addEventListener('click', openCart);
    el('#closeCart').addEventListener('click', closeCart);
    el('#cartBackdrop').addEventListener('click', closeCart);
    el('#clearCartBtn').addEventListener('click', ()=>{ state.cart = []; localStorage.setItem('cart','[]'); renderCart(); });
    el('#checkoutBtn').addEventListener('click', ()=>{ if (!state.cart.length) return toast('Your cart is empty'); toast('Checkout complete — fake delivery incoming 🚚'); state.cart = []; localStorage.setItem('cart','[]'); renderCart(); closeCart(); });
    el('#searchInput').addEventListener('input', (e)=> { state.filters.q = e.target.value; renderProducts(); });
    el('#categoryFilter').addEventListener('change', (e)=> { state.filters.category = e.target.value; renderProducts(); });
    el('#sortSelect').addEventListener('change', (e)=> { state.filters.sort = e.target.value; renderProducts(); });
    el('#productForm').addEventListener('submit', async (e)=>{ /* ... */ });
    el('#resetProductBtn').addEventListener('click', resetProductForm);
    el('#seedMoreBtn').addEventListener('click', ()=>{ /* ... */ });
    el('#ctaLogin').addEventListener('click', ()=> openAuth('login'));
    el('#openGuideBtn').addEventListener('click', ()=> openModal('#guideModal'));
    el('#openGuideBtnMobile').addEventListener('click', ()=> openModal('#guideModal'));
    el('#closeGuide').addEventListener('click', ()=> closeModal('#guideModal'));
    el('#switchToRegister').addEventListener('click', ()=> openAuth('register'));
    el('#switchToLogin').addEventListener('click', ()=> openAuth('login'));
    el('#closeAuth').addEventListener('click', ()=> closeModal('#authModal'));
    el('#loginForm').addEventListener('submit', async (e)=>{ /* ... */ });
    el('#registerForm').addEventListener('submit', async (e)=>{ /* ... */ });
    injectAccountMenu();
    el('#closeSettings').addEventListener('click', ()=> closeModal('#settingsModal'));
    el('#saveApiBase').addEventListener('click', ()=>{ /* ... */ });
    el('#testApiBtn').addEventListener('click', async ()=>{ /* ... */ });
    el('#contactForm').addEventListener('submit', (e)=> { e.preventDefault(); toast('Message sent (demo)'); e.target.reset(); });
    
    function injectAccountMenu(){ /* ... */ }
    
    // Init function
    (function init(){
        setApiBase(localStorage.getItem('apiBase') || '');
        el('#year').textContent = new Date().getFullYear();
        state.adminMode = JSON.parse(localStorage.getItem('adminMode') || 'false');
        setAdminMode(state.adminMode);
        updateAccountUI();
        loadProducts();
        const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
        if (!localUsers.find(u=>u.email === ADMIN_CREDENTIALS.email)) {
            localUsers.push({ id: uid(), name: ADMIN_CREDENTIALS.name, email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });
            localStorage.setItem('localUsers', JSON.stringify(localUsers));
        }
    })();
});

// --- Mouse Trail Effect ---
var canvas = document.querySelector('#c'),
	ctx = canvas.getContext('2d'),
	points = [],
	m = {x: null, y: null};
var a = 20, b = 5, c = 0.1, d = 100;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
m.x = canvas.width / 2;
m.y = canvas.height / 2;
window.addEventListener('mousemove', function(e){
	TweenMax.to(m, 0.3, {x: e.clientX, y: e.clientY, ease: 'linear'})
	document.querySelector('.message').className = 'message hide';
});
for(var i=0;i<a;i++){
	points.push({
		r: 360 / a * i,
		p: {x: null, y: null},
		w: Math.random()*5,
		c: '#fff',
		d: Math.random() * (d + 5) - 5,
		s: Math.random() * (b + 5) - 5
	})
}
function render(){
	if(m.x == null || m.y == null) return;
	ctx.fillStyle = 'rgba(0,0,0,'+c+')';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.lineCap = 'round';
	for(var i=0; i<points.length; i++){
		var p = points[i];
		p.r += p.s;
		if(p.r >= 360) p.r = p.r - 360;
		var vel = {
			x: p.d * Math.cos(p.r * Math.PI / 180),
			y: p.d * Math.sin(p.r * Math.PI / 180)
		};
		if(p.p.x != null && p.p.y != null){
			ctx.strokeStyle = p.c;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(p.p.x, p.p.y);
			ctx.lineTo(m.x + vel.x, m.y + vel.y)
			ctx.stroke();
			ctx.closePath();
		}
		p.p.x = m.x + vel.x;
		p.p.y = m.y + vel.y;
	}
}
window.requestAnimFrame = (function(){
return  window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame    ||
	function(callback){ window.setTimeout(callback, 1000 / 60); };
})();
(function animloop(){
	requestAnimFrame(animloop);
	render();
})();

// Helper functions that were inside the DOMContentLoaded
function setApiBase(url) {
  API.base = (url || '').replace(/\/$/,'');
  localStorage.setItem('apiBase', API.base);
  el('#backendUrlLabel').textContent = API.base || 'local';
  el('#apiBaseInput').value = API.base || '';
}
function escapeHtml(str) {
  if (!str) return '';
  return (''+str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}