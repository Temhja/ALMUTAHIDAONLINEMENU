// ═══════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════
var currentLang = 'ar';
var currentCategory = 'all';
var searchQuery = '';
var cart = [];          // [{id, qty, ...product}]

var WHATSAPP_NUMBER = '9647711888922';

// ═══════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  setLang('ar');
});

// ═══════════════════════════════════════════════
//  LANGUAGE
// ═══════════════════════════════════════════════
function setLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === 'en') ? 'ltr' : 'rtl';
  document.querySelectorAll('[data-lang-btn]').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-lang-btn') === lang);
  });
  // Update static text
  document.getElementById('site-name').textContent        = T('siteName');
  document.getElementById('tagline').textContent          = T('tagline');
  document.getElementById('search-input').placeholder     = T('searchPlaceholder');
  document.getElementById('cart-title').textContent       = T('cart');
  document.getElementById('cart-total-label').textContent = T('total');

  renderSidebarCats();
  renderMobileCats();
  renderProducts();
  renderCartDrawer();
  updateBadge();
}

function T(key) {
  var tr = TRANSLATIONS[currentLang];
  return (tr && tr[key]) ? tr[key] : (TRANSLATIONS['ar'][key] || key);
}

// ═══════════════════════════════════════════════
//  CATEGORIES — SIDEBAR
// ═══════════════════════════════════════════════
function renderSidebarCats() {
  var wrap = document.getElementById('categories-container');
  wrap.innerHTML = '';
  CATEGORIES.forEach(function(cat) {
    var btn = document.createElement('button');
    btn.className = 'cat-btn' + (currentCategory === cat.id ? ' active' : '');
    btn.innerHTML = '<span class="cat-icon">' + cat.icon + '</span><span>' + cat[currentLang] + '</span>';
    btn.onclick = function() { selectCat(cat.id); };
    wrap.appendChild(btn);
  });
}

// ═══════════════════════════════════════════════
//  CATEGORIES — MOBILE BAR
// ═══════════════════════════════════════════════
function renderMobileCats() {
  var bar = document.getElementById('mobile-cat-bar');
  if (!bar) return;
  bar.innerHTML = '';
  CATEGORIES.forEach(function(cat) {
    var btn = document.createElement('button');
    btn.className = 'mob-cat-btn' + (currentCategory === cat.id ? ' active' : '');
    btn.innerHTML = '<span class="mob-cat-icon">' + cat.icon + '</span><span class="mob-cat-label">' + cat[currentLang] + '</span>';
    btn.onclick = function() { selectCat(cat.id); };
    bar.appendChild(btn);
  });
  // Scroll active chip into view
  var active = bar.querySelector('.active');
  if (active) { active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }
}

function selectCat(id) {
  currentCategory = id;
  renderSidebarCats();
  renderMobileCats();
  renderProducts();
  var sec = document.getElementById('products-section');
  if (sec) {
    var top = sec.getBoundingClientRect().top + window.scrollY - 130;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }
}

// ═══════════════════════════════════════════════
//  SEARCH
// ═══════════════════════════════════════════════
document.getElementById('search-input').addEventListener('input', function(e) {
  searchQuery = e.target.value.trim();
  renderProducts();
});

// ═══════════════════════════════════════════════
//  PRODUCTS
// ═══════════════════════════════════════════════
function filtered() {
  return PRODUCTS.filter(function(p) {
    var matchCat  = (currentCategory === 'all') || (p.category === currentCategory);
    var q = searchQuery.toLowerCase();
    var matchQ = !q || p.ar.toLowerCase().includes(q) || p.ku.toLowerCase().includes(q) || p.en.toLowerCase().includes(q);
    return matchCat && matchQ;
  });
}

function renderProducts() {
  var grid = document.getElementById('products-grid');
  var none = document.getElementById('no-results');
  var list = filtered();
  grid.innerHTML = '';

  if (list.length === 0) { none.style.display = 'flex'; return; }
  none.style.display = 'none';

  if (currentCategory === 'all' && !searchQuery) {
    // Group by category
    var groups = {};
    var order  = [];
    list.forEach(function(p) {
      if (!groups[p.category]) { groups[p.category] = []; order.push(p.category); }
      groups[p.category].push(p);
    });
    order.forEach(function(catId) {
      var cat = CATEGORIES.find(function(c) { return c.id === catId; });
      if (!cat) return;
      var sec  = document.createElement('div');
      sec.className = 'product-section';
      var h2 = document.createElement('h2');
      h2.className = 'section-title';
      h2.innerHTML = '<span class="section-icon">' + cat.icon + '</span>' + cat[currentLang];
      var g = document.createElement('div');
      g.className = 'product-grid';
      groups[catId].forEach(function(p) { g.appendChild(buildCard(p)); });
      sec.appendChild(h2);
      sec.appendChild(g);
      grid.appendChild(sec);
    });
  } else {
    var cat = CATEGORIES.find(function(c) { return c.id === currentCategory; });
    if (cat && currentCategory !== 'all') {
      var h2 = document.createElement('h2');
      h2.className = 'section-title';
      h2.innerHTML = '<span class="section-icon">' + cat.icon + '</span>' + cat[currentLang];
      grid.appendChild(h2);
    }
    var g = document.createElement('div');
    g.className = 'product-grid';
    list.forEach(function(p) { g.appendChild(buildCard(p)); });
    grid.appendChild(g);
  }
}

function buildCard(product) {
  var cartItem = getCartItem(product.id);
  var inCart   = !!cartItem;
  var qty      = inCart ? cartItem.qty : 0;

  var priceText = product.price
    ? product.price.toLocaleString() + ' ' + T('iqd')
    : '—';

  // Image: check if file exists via data attribute, fallback to emoji
  var imgSrc = 'img/' + product.id + '.jpg';

  var card = document.createElement('div');
  card.className   = 'product-card';
  card.id          = 'card-' + product.id;
  card.dataset.pid = product.id;

  var controlHTML = '';
  if (product.price) {
    if (inCart) {
      controlHTML = '<div class="qty-control">'
        + '<button class="qty-btn qty-minus" data-pid="' + product.id + '">−</button>'
        + '<span class="qty-num">' + qty + '</span>'
        + '<button class="qty-btn qty-plus"  data-pid="' + product.id + '">+</button>'
        + '</div>';
    } else {
      controlHTML = '<button class="add-btn" data-pid="' + product.id + '">'
        + '<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
        + '</button>';
    }
  }

  card.innerHTML =
    '<div class="card-img-wrap">'
    +   '<img class="card-img" src="' + imgSrc + '" alt="' + product[currentLang] + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
    +   '<div class="card-emoji-fb" style="display:none">' + product.emoji + '</div>'
    + '</div>'
    + '<div class="card-body">'
    +   '<h3 class="card-name">' + product[currentLang] + '</h3>'
    +   '<p class="card-desc">'  + product.desc[currentLang] + '</p>'
    +   '<div class="card-footer">'
    +     '<span class="card-price">' + priceText + '</span>'
    +     '<div class="card-ctrl">' + controlHTML + '</div>'
    +   '</div>'
    + '</div>';

  return card;
}

// ── Refresh only the control area of one card ──
function refreshCardControl(productId) {
  var card = document.getElementById('card-' + productId);
  if (!card) return;
  var product  = PRODUCTS.find(function(p) { return p.id === productId; });
  if (!product || !product.price) return;
  var ctrl     = card.querySelector('.card-ctrl');
  if (!ctrl) return;
  var cartItem = getCartItem(productId);
  var inCart   = !!cartItem;
  var qty      = inCart ? cartItem.qty : 0;

  if (inCart) {
    ctrl.innerHTML = '<div class="qty-control">'
      + '<button class="qty-btn qty-minus" data-pid="' + productId + '">−</button>'
      + '<span class="qty-num">' + qty + '</span>'
      + '<button class="qty-btn qty-plus"  data-pid="' + productId + '">+</button>'
      + '</div>';
  } else {
    ctrl.innerHTML = '<button class="add-btn" data-pid="' + productId + '">'
      + '<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
      + '</button>';
  }
}

// ═══════════════════════════════════════════════
//  EVENT DELEGATION — products grid
//  (catches clicks even after card re-renders)
// ═══════════════════════════════════════════════
document.getElementById('products-grid').addEventListener('click', function(e) {
  // Add button
  var addBtn = e.target.closest('.add-btn');
  if (addBtn) {
    var pid = parseInt(addBtn.getAttribute('data-pid'), 10);
    addItem(pid);
    return;
  }
  // Minus
  var minusBtn = e.target.closest('.qty-minus');
  if (minusBtn) {
    var pid = parseInt(minusBtn.getAttribute('data-pid'), 10);
    changeItem(pid, -1);
    return;
  }
  // Plus
  var plusBtn = e.target.closest('.qty-plus');
  if (plusBtn) {
    var pid = parseInt(plusBtn.getAttribute('data-pid'), 10);
    changeItem(pid, +1);
    return;
  }
});

// ═══════════════════════════════════════════════
//  CART HELPERS
// ═══════════════════════════════════════════════
function getCartItem(id) {
  return cart.find(function(i) { return i.id === id; }) || null;
}

function addItem(productId) {
  var product = PRODUCTS.find(function(p) { return p.id === productId; });
  if (!product) return;
  var existing = getCartItem(productId);
  if (existing) {
    existing.qty += 1;
  } else {
    // Clone product, add qty
    var clone = {};
    for (var k in product) { clone[k] = product[k]; }
    clone.qty = 1;
    cart.push(clone);
  }
  updateBadge();
  renderCartDrawer();
  refreshCardControl(productId);
  showToast(product[currentLang]);
}

function changeItem(productId, delta) {
  var idx = cart.findIndex(function(i) { return i.id === productId; });
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) { cart.splice(idx, 1); }
  updateBadge();
  renderCartDrawer();
  refreshCardControl(productId);
}

function removeItem(productId) {
  cart = cart.filter(function(i) { return i.id !== productId; });
  updateBadge();
  renderCartDrawer();
  refreshCardControl(productId);
}

function updateBadge() {
  var total = cart.reduce(function(s, i) { return s + i.qty; }, 0);
  var badge = document.getElementById('cart-badge');
  badge.textContent   = total;
  badge.style.display = total > 0 ? 'flex' : 'none';
}

// ═══════════════════════════════════════════════
//  CART DRAWER RENDER
// ═══════════════════════════════════════════════
function renderCartDrawer() {
  var container = document.getElementById('cart-items');
  var emptyEl   = document.getElementById('cart-empty');
  var totalEl   = document.getElementById('cart-total-amount');
  var sendBtn   = document.getElementById('send-whatsapp-btn');

  // Clear existing items (keep #cart-empty inside)
  Array.from(container.children).forEach(function(child) {
    if (child.id !== 'cart-empty') child.remove();
  });

  if (cart.length === 0) {
    emptyEl.style.display = 'flex';
    totalEl.textContent   = '0 ' + T('iqd');
    sendBtn.disabled      = true;
    return;
  }

  emptyEl.style.display = 'none';
  sendBtn.disabled       = false;

  var grandTotal = 0;
  cart.forEach(function(item) {
    var lineTotal = (item.price || 0) * item.qty;
    grandTotal   += lineTotal;

    var el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML =
      '<span class="cart-item-emoji">' + item.emoji + '</span>'
      + '<div class="cart-item-info">'
      +   '<span class="cart-item-name">'  + item[currentLang] + '</span>'
      +   '<span class="cart-item-price">' + lineTotal.toLocaleString() + ' ' + T('iqd') + '</span>'
      + '</div>'
      + '<div class="cart-item-qty">'
      +   '<button onclick="changeItem(' + item.id + ', -1)">−</button>'
      +   '<span>' + item.qty + '</span>'
      +   '<button onclick="changeItem(' + item.id + ', 1)">+</button>'
      + '</div>'
      + '<button class="cart-item-remove" onclick="removeItem(' + item.id + ')">'
      +   '<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button>';

    container.appendChild(el);
  });

  totalEl.textContent = grandTotal.toLocaleString() + ' ' + T('iqd');
}

// ═══════════════════════════════════════════════
//  CART DRAWER OPEN / CLOSE
// ═══════════════════════════════════════════════
function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
  renderCartDrawer();
}
function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
}
document.getElementById('cart-overlay').addEventListener('click', closeCart);

// ═══════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════
function showToast(name) {
  var toast = document.getElementById('cart-toast');
  toast.textContent = '✅  ' + name;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

// ═══════════════════════════════════════════════
//  WHATSAPP
// ═══════════════════════════════════════════════
function sendToWhatsApp() {
  if (cart.length === 0) return;

  var header = {
    ar: '🌿 *طلب جديد - الشركة المتحدة للتوابل*',
    ku: '🌿 *داواکاری نوێ - کۆمپانیای یەکگرتوو بۆ بهارات*',
    en: '🌿 *New Order - United Spices Company*'
  };

  var lines = [header[currentLang], ''];
  cart.forEach(function(item, i) {
    var lineTotal = ((item.price || 0) * item.qty).toLocaleString();
    lines.push((i + 1) + '. ' + item.emoji + ' ' + item[currentLang] + ' × ' + item.qty + '   ➜   ' + lineTotal + ' ' + T('iqd'));
  });

  var grandTotal = cart.reduce(function(s, i) { return s + (i.price || 0) * i.qty; }, 0);
  var totalWord  = { ar: 'المجموع الكلي', ku: 'کۆی گشتی', en: 'Grand Total' };
  lines.push('');
  lines.push('💰 *' + totalWord[currentLang] + ':* ' + grandTotal.toLocaleString() + ' ' + T('iqd'));

  var msg = encodeURIComponent(lines.join('\n'));
  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg, '_blank');
}
