const DELIVERY_FEE = 50;
const peso = n => '\u20B1' + n.toLocaleString('en-PH');
const $ = id => document.getElementById(id);

function getCart() {
  try { return JSON.parse(localStorage.getItem('nyxCart')) || []; } catch (e) { return []; }
}
function saveCart(cart) {
  try { localStorage.setItem('nyxCart', JSON.stringify(cart)); } catch (e) {}
  updateCartCount();
}
function updateCartCount() {
  const n = getCart().reduce((s, i) => s + i.qty, 0);
  const el = $('cart-count');
  if (el) el.textContent = n;
}
function toast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}
function addToCart(id, name, price, qty) {
  qty = Math.max(1, Math.min(20, parseInt(qty, 10) || 1));
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) item.qty += qty; else cart.push({ id, name, price, qty });
  saveCart(cart);
  toast(name + ' added to cart');
}
function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
  updateCart();
}
function increaseQuantity(id) {
  const cart = getCart(), i = cart.find(x => x.id === id);
  if (i) i.qty++;
  saveCart(cart); updateCart();
}
function decreaseQuantity(id) {
  const cart = getCart(), i = cart.find(x => x.id === id);
  if (i && i.qty > 1) i.qty--;
  saveCart(cart); updateCart();
}
function calculateSubtotal() {
  return getCart().reduce((s, i) => s + i.price * i.qty, 0);
}
function calculateTotal() {
  return getCart().length ? calculateSubtotal() + DELIVERY_FEE : 0;
}
function updateCart() {
  const list = $('cart-items');
  if (!list) return;
  const cart = getCart();
  const empty = $('cart-empty'), full = $('cart-full');
  if (empty) empty.classList.toggle('hidden', cart.length > 0);
  if (full) full.classList.toggle('hidden', cart.length === 0);
  list.innerHTML = cart.map(i => `
    <div class="cart-row">
      <h3>${i.name}</h3>
      <div>${peso(i.price)}</div>
      <div class="qty">
        <button type="button" data-act="dec" data-id="${i.id}" aria-label="Decrease quantity">&minus;</button>
        <span>${i.qty}</span>
        <button type="button" data-act="inc" data-id="${i.id}" aria-label="Increase quantity">+</button>
      </div>
      <div>${peso(i.price * i.qty)}</div>
      <button type="button" class="remove" data-act="rm" data-id="${i.id}">Remove</button>
    </div>`).join('');
  if ($('subtotal')) $('subtotal').textContent = peso(calculateSubtotal());
  if ($('delivery')) $('delivery').textContent = peso(cart.length ? DELIVERY_FEE : 0);
  if ($('total')) $('total').textContent = peso(calculateTotal());
  updateCartCount();
}
function setError(field, msg) {
  const el = $(field), err = $(field + '-error');
  if (el) el.classList.toggle('invalid', !!msg);
  if (err) err.textContent = msg || '';
  return !msg;
}
function checkout(e) {
  if (e) e.preventDefault();
  if (!getCart().length) return false;
  const v = id => ($(id) ? $(id).value.trim() : '');
  let ok = true;
  ok = setError('name', v('name').length < 2 ? 'Enter your full name.' : '') && ok;
  ok = setError('phone', !/^(\+63|0)?9\d{9}$/.test(v('phone').replace(/[\s-]/g, '')) ? 'Enter a valid mobile number, e.g. 0917 123 4567.' : '') && ok;
  ok = setError('address', v('address').length < 8 ? 'Enter your complete delivery address.' : '') && ok;
  ok = setError('payment', !v('payment') ? 'Choose a payment method.' : '') && ok;
  ok = setError('terms', !$('terms').checked ? 'You must agree to the Terms of Service and Privacy Policy.' : '') && ok;
  if (!ok) return false;
  const no = 'NYX-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  localStorage.removeItem('nyxCart');
  updateCartCount();
  $('cart-section').classList.add('hidden');
  $('order-no').textContent = no;
  $('confirmation').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return false;
}
function sendMessage(e) {
  if (e) e.preventDefault();
  const v = id => $(id).value.trim();
  let ok = true;
  ok = setError('c-name', v('c-name').length < 2 ? 'Enter your name.' : '') && ok;
  ok = setError('c-email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('c-email')) ? 'Enter a valid email address.' : '') && ok;
  ok = setError('c-message', v('c-message').length < 10 ? 'Write at least 10 characters.' : '') && ok;
  if (!ok) return false;
  $('contact-form').reset();
  $('contact-success').classList.remove('hidden');
  return false;
}
function toggleMenu() {
  const m = $('nav-links'), b = $('hamburger');
  if (!m) return;
  const open = m.classList.toggle('open');
  if (b) b.setAttribute('aria-expanded', open);
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  updateCart();
  const hb = $('hamburger'); if (hb) hb.addEventListener('click', toggleMenu);
  const co = $('checkout-form'); if (co) co.addEventListener('submit', checkout);
  const cf = $('contact-form'); if (cf) cf.addEventListener('submit', sendMessage);
  const items = $('cart-items');
  if (items) items.addEventListener('click', e => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.act === 'inc') increaseQuantity(id);
    else if (b.dataset.act === 'dec') decreaseQuantity(id);
    else removeFromCart(id);
  });
  document.querySelectorAll('.product-card').forEach(card => {
    const input = card.querySelector('.qty input');
    const get = () => [card.dataset.id, card.dataset.name, Number(card.dataset.price), input ? input.value : 1];
    card.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.q && input) input.value = Math.max(1, Math.min(20, (parseInt(input.value, 10) || 1) + Number(b.dataset.q)));
      if (b.dataset.act === 'add') addToCart(...get());
      if (b.dataset.act === 'buy') { addToCart(...get()); window.location.href = 'cart.html'; }
    });
  });
});