var currentLang     = 'ar';
var currentCategory = 'all';
var searchQuery     = '';
var cart            = [];
var WHATSAPP        = '9647711888922';
var DELIVERY        = 5000;

// ── BOOT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() { setLang('ar'); });

// ── TRANSLATIONS HELPER ───────────────────────
function T(k) {
  var tr = TRANSLATIONS[currentLang];
  return (tr && tr[k]) ? tr[k] : (TRANSLATIONS.ar[k] || k);
}

// ── LANGUAGE ──────────────────────────────────
function setLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir  = lang === 'en' ? 'ltr' : 'rtl';
  document.querySelectorAll('[data-lang-btn]').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-lang-btn') === lang);
  });
  document.getElementById('site-name').textContent        = T('siteName');
  document.getElementById('tagline').textContent          = T('tagline');
  document.getElementById('search-input').placeholder     = T('searchPlaceholder');
  document.getElementById('cart-title').textContent       = T('cart');
  document.getElementById('cart-total-label').textContent = T('total');
  renderSidebar(); renderMobileBar(); renderProducts(); renderCart(); updateBadge();
}

// ── CATEGORIES – SIDEBAR ──────────────────────
function renderSidebar() {
  var w = document.getElementById('categories-container');
  w.innerHTML = '';
  CATEGORIES.forEach(function(c) {
    var b = document.createElement('button');
    b.className = 'cat-btn' + (currentCategory === c.id ? ' active' : '');
    b.innerHTML = '<span class="cat-icon">' + c.icon + '</span><span>' + c[currentLang] + '</span>';
    b.onclick = function() { pickCat(c.id); };
    w.appendChild(b);
  });
}

// ── CATEGORIES – MOBILE BAR ───────────────────
function renderMobileBar() {
  var bar = document.getElementById('mobile-cat-bar');
  if (!bar) return;
  bar.innerHTML = '';
  CATEGORIES.forEach(function(c) {
    var b = document.createElement('button');
    b.className = 'mob-cat-btn' + (currentCategory === c.id ? ' active' : '');
    b.innerHTML = '<span class="mob-cat-icon">' + c.icon + '</span><span>' + c[currentLang] + '</span>';
    b.onclick = function() { pickCat(c.id); };
    bar.appendChild(b);
  });
  var active = bar.querySelector('.active');
  if (active) active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}

function pickCat(id) {
  currentCategory = id;
  renderSidebar(); renderMobileBar(); renderProducts();
  var sec = document.getElementById('products-section');
  if (sec) window.scrollTo({ top: sec.getBoundingClientRect().top + window.pageYOffset - 120, behavior: 'smooth' });
}

// ── SEARCH ────────────────────────────────────
document.getElementById('search-input').addEventListener('input', function(e) {
  searchQuery = e.target.value.trim();
  renderProducts();
});

// ── PRODUCTS ──────────────────────────────────
function getFiltered() {
  var q = searchQuery.toLowerCase();
  return PRODUCTS.filter(function(p) {
    var mc = currentCategory === 'all' || p.category === currentCategory;
    var mq = !q || p.ar.toLowerCase().indexOf(q) > -1 || p.ku.toLowerCase().indexOf(q) > -1 || p.en.toLowerCase().indexOf(q) > -1;
    return mc && mq;
  });
}

function renderProducts() {
  var grid = document.getElementById('products-grid');
  var none = document.getElementById('no-results');
  var list = getFiltered();
  grid.innerHTML = '';
  if (!list.length) { none.style.display = 'flex'; return; }
  none.style.display = 'none';

  if (currentCategory === 'all' && !searchQuery) {
    var groups = {}, order = [];
    list.forEach(function(p) {
      if (!groups[p.category]) { groups[p.category] = []; order.push(p.category); }
      groups[p.category].push(p);
    });
    order.forEach(function(cid) {
      var cat = CATEGORIES.filter(function(c) { return c.id === cid; })[0];
      if (!cat) return;
      var sec = document.createElement('div'); sec.className = 'product-section';
      var h   = document.createElement('h2');  h.className   = 'section-title';
      h.innerHTML = '<span class="section-icon">' + cat.icon + '</span>' + cat[currentLang];
      var g = document.createElement('div'); g.className = 'product-grid';
      groups[cid].forEach(function(p) { g.appendChild(makeCard(p)); });
      sec.appendChild(h); sec.appendChild(g); grid.appendChild(sec);
    });
  } else {
    var cat = CATEGORIES.filter(function(c) { return c.id === currentCategory; })[0];
    if (cat && currentCategory !== 'all') {
      var h = document.createElement('h2'); h.className = 'section-title';
      h.innerHTML = '<span class="section-icon">' + cat.icon + '</span>' + cat[currentLang];
      grid.appendChild(h);
    }
    var g = document.createElement('div'); g.className = 'product-grid';
    list.forEach(function(p) { g.appendChild(makeCard(p)); });
    grid.appendChild(g);
  }
}

// Build a product card
function makeCard(p) {
  var ci = cartGet(p.id);
  var card = document.createElement('div');
  card.className = 'product-card'; card.id = 'card-' + p.id;

  var ctrl = '';
  if (p.price) {
    if (ci) {
      ctrl = qtyHTML(p.id, ci.qty);
    } else {
      ctrl = '<button class="add-btn" data-pid="' + p.id + '">'
           + '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
           + '</button>';
    }
  }

  var price = p.price ? p.price.toLocaleString() + ' ' + T('iqd') : '—';

  // Image: first try img/<id>.jpg; on error show emoji fallback
  card.innerHTML =
    '<div class="card-img-wrap">'
  +   '<img class="card-img" src="img/' + p.id + '.jpg" alt=""'
  +     ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
  +   '<div class="card-emoji-fb">' + p.emoji + '</div>'   // always in DOM, shown/hidden by CSS/JS
  + '</div>'
  + '<div class="card-body">'
  +   '<h3 class="card-name">' + p[currentLang] + '</h3>'
  +   '<p class="card-desc">'  + p.desc[currentLang] + '</p>'
  +   '<div class="card-footer">'
  +     '<span class="card-price">' + price + '</span>'
  +     '<div class="card-ctrl">' + ctrl + '</div>'
  +   '</div>'
  + '</div>';

  // If image loads successfully, hide emoji fb
  var img = card.querySelector('.card-img');
  img.onload = function() {
    card.querySelector('.card-emoji-fb').style.display = 'none';
  };
  img.onerror = function() {
    this.style.display = 'none';
    card.querySelector('.card-emoji-fb').style.display = 'flex';
  };

  return card;
}

function qtyHTML(pid, qty) {
  return '<div class="qty-control">'
       + '<button class="qty-btn qty-minus" data-pid="' + pid + '">−</button>'
       + '<span class="qty-num">' + qty + '</span>'
       + '<button class="qty-btn qty-plus"  data-pid="' + pid + '">+</button>'
       + '</div>';
}

// Refresh only the add/qty control inside a card
function refreshCard(pid) {
  var card = document.getElementById('card-' + pid);
  if (!card) return;
  var ctrl = card.querySelector('.card-ctrl');
  if (!ctrl) return;
  var p  = PRODUCTS.filter(function(x) { return x.id === pid; })[0];
  if (!p || !p.price) return;
  var ci = cartGet(pid);
  ctrl.innerHTML = ci ? qtyHTML(pid, ci.qty)
    : '<button class="add-btn" data-pid="' + pid + '">'
    + '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
    + '</button>';
}

// ── EVENT DELEGATION on grid ──────────────────
document.getElementById('products-grid').addEventListener('click', function(e) {
  var a = e.target.closest('.add-btn');
  var m = e.target.closest('.qty-minus');
  var p = e.target.closest('.qty-plus');
  if (a) { cartAdd(+a.getAttribute('data-pid')); return; }
  if (m) { cartChange(+m.getAttribute('data-pid'), -1); return; }
  if (p) { cartChange(+p.getAttribute('data-pid'), +1); return; }
});

// ── CART HELPERS ──────────────────────────────
function cartGet(id) {
  for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i];
  return null;
}
function cartAdd(pid) {
  var prod = PRODUCTS.filter(function(x) { return x.id === pid; })[0];
  if (!prod) return;
  var ci = cartGet(pid);
  if (ci) { ci.qty++; } else { var c = {}; for (var k in prod) c[k] = prod[k]; c.qty = 1; cart.push(c); }
  updateBadge(); renderCart(); refreshCard(pid);
  showToast(prod[currentLang]);
}
function cartChange(pid, d) {
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === pid) { cart[i].qty += d; if (cart[i].qty <= 0) cart.splice(i, 1); break; }
  }
  updateBadge(); renderCart(); refreshCard(pid);
}
function cartRemove(pid) {
  cart = cart.filter(function(x) { return x.id !== pid; });
  updateBadge(); renderCart(); refreshCard(pid);
}
function updateBadge() {
  var n = cart.reduce(function(s, i) { return s + i.qty; }, 0);
  var b = document.getElementById('cart-badge');
  b.textContent = n; b.style.display = n ? 'flex' : 'none';
}

// ── CART RENDER ───────────────────────────────
function renderCart() {
  var wrap     = document.getElementById('cart-items');
  var emptyEl  = document.getElementById('cart-empty');
  var totalEl  = document.getElementById('cart-total-amount');
  var sendBtn  = document.getElementById('send-whatsapp-btn');
  var delivRow = document.getElementById('delivery-row');
  var totalRow = document.getElementById('cart-total-row');

  // Remove previous cart-item divs (keep #cart-empty)
  Array.from(wrap.children).forEach(function(el) {
    if (el.id !== 'cart-empty') el.remove();
  });

  if (!cart.length) {
    emptyEl.style.display = 'flex';
    sendBtn.disabled = true;
    totalEl.textContent = '0 ' + T('iqd');
    if (delivRow) delivRow.style.display = 'none';
    if (totalRow) totalRow.style.display = 'none';
    return;
  }
  emptyEl.style.display = 'none';
  sendBtn.disabled = false;
  if (delivRow) delivRow.style.display = 'flex';
  if (totalRow) totalRow.style.display = 'flex';

  var sub = 0;
  cart.forEach(function(item) {
    var lt = (item.price || 0) * item.qty; sub += lt;
    var el = document.createElement('div'); el.className = 'cart-item';
    el.innerHTML =
      '<span class="cart-item-emoji">' + item.emoji + '</span>'
    + '<div class="cart-item-info">'
    +   '<span class="cart-item-name">'  + item[currentLang] + '</span>'
    +   '<span class="cart-item-price">' + lt.toLocaleString() + ' ' + T('iqd') + '</span>'
    + '</div>'
    + '<div class="cart-item-qty">'
    +   '<button onclick="cartChange(' + item.id + ',-1)">−</button>'
    +   '<span>' + item.qty + '</span>'
    +   '<button onclick="cartChange(' + item.id + ',1)">+</button>'
    + '</div>'
    + '<button class="cart-item-remove" onclick="cartRemove(' + item.id + ')">'
    +   '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    + '</button>';
    wrap.appendChild(el);
  });
  totalEl.textContent = (sub + DELIVERY).toLocaleString() + ' ' + T('iqd');
}

// ── OPEN / CLOSE CART ─────────────────────────
function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
  renderCart();
}
function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
}
document.getElementById('cart-overlay').addEventListener('click', closeCart);

// ── TOAST ─────────────────────────────────────
function showToast(name) {
  var t = document.getElementById('cart-toast');
  t.textContent = '✅ ' + name;
  t.classList.add('show');
  clearTimeout(t._tmr);
  t._tmr = setTimeout(function() { t.classList.remove('show'); }, 2000);
}

// ── WHATSAPP ──────────────────────────────────
function sendToWhatsApp() {
  if (!cart.length) return;
  var hdr = { ar:'🌿 *طلب جديد - الشركة المتحدة للتوابل*', ku:'🌿 *داواکاری نوێ - کۆمپانیای یەکگرتوو*', en:'🌿 *New Order - United Spices Co.*' };
  var dlv = { ar:'رسوم التوصيل', ku:'کرێی گەیاندن', en:'Delivery Fee' };
  var ttl = { ar:'المجموع الكلي', ku:'کۆی گشتی', en:'Grand Total' };
  var lines = [hdr[currentLang], ''];
  var sub = 0;
  cart.forEach(function(item, i) {
    var lt = (item.price||0)*item.qty; sub += lt;
    lines.push((i+1)+'. '+item.emoji+' '+item[currentLang]+' × '+item.qty+'   ➜   '+lt.toLocaleString()+' '+T('iqd'));
  });
  lines.push('');
  lines.push('🚚 '+dlv[currentLang]+': '+DELIVERY.toLocaleString()+' '+T('iqd'));
  lines.push('💰 *'+ttl[currentLang]+': '+(sub+DELIVERY).toLocaleString()+' '+T('iqd')+'*');
  window.open('https://wa.me/'+WHATSAPP+'?text='+encodeURIComponent(lines.join('\n')),'_blank');
}
