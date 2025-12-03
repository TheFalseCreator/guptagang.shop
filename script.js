// ----- Set your Apps Script web app URL here -----
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'; // <<-- replace

/* Element helpers */
const popup = () => document.getElementById('quickOrderPopup');
const form = () => document.getElementById('quickOrderForm');
const successBox = () => document.getElementById('quickSuccess');
const closeBtn = () => document.getElementById('quickCloseBtn');
const cancelBtn = () => document.getElementById('quickCancel');
const closeAfterBtn = () => document.getElementById('quickCloseAfter');

/* Show popup and populate product */
function openQuickOrder(productName = '') {
  const p = popup();
  if (!p) return;
  p.classList.add('open');
  p.setAttribute('aria-hidden', 'false');
  const hidden = document.getElementById('quickProduct');
  if (hidden) hidden.value = productName || '';
  // reset UI
  const f = form();
  if (f) { f.hidden = false; f.reset(); }
  const s = successBox();
  if (s) s.hidden = true;
  document.body.style.overflow = 'hidden';
}

/* Close popup */
function closeQuickOrder() {
  const p = popup();
  if (!p) return;
  p.classList.remove('open');
  p.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = 'auto';
}

/* Attach product button listeners */
function wireProductButtons() {
  document.querySelectorAll('.product-btn').forEach(btn => {
    btn.removeEventListener('click', productBtnClick); // safe
    btn.addEventListener('click', productBtnClick);
  });
}
function productBtnClick(e) {
  const product = e.currentTarget.dataset.product || '';
  openQuickOrder(product);
}

/* Validate phone */
function validPhone(phone) {
  const digits = (phone || '').replace(/\D/g,'');
  return /^\d{10}$/.test(digits);
}

/* Submit handler */
async function handleSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('quickSubmit');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Placing...'; }

  // collect
  const payload = {
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    product: document.getElementById('quickProduct').value || '',
    name: document.getElementById('qName').value.trim(),
    class: document.getElementById('qClass').value.trim(),
    admission: document.getElementById('qAdmission').value.trim(),
    phone: document.getElementById('qPhone').value.trim()
  };

  if (!payload.name || !payload.class || !payload.admission || !payload.phone) {
    alert('Please fill all fields.');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Place Order'; }
    return;
  }
  if (!validPhone(payload.phone)) {
    alert('Enter a valid 10-digit phone number.');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Place Order'; }
    return;
  }

  // simple client throttle
  const last = Number(localStorage.getItem('lastQuickOrderAt') || 0);
  if (Date.now() - last < 7000) { // 7s
    alert('Please wait a moment before placing another order.');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Place Order'; }
    return;
  }
  localStorage.setItem('lastQuickOrderAt', Date.now());

  try {
    // If your Apps Script allows CORS, remove 'mode: no-cors' to read JSON response.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // show success
    const f = form();
    if (f) f.hidden = true;
    const s = successBox();
    if (s) s.hidden = false;

    setTimeout(() => {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Place Order'; }
    }, 800);

    // auto close after a short pause so user sees the check
    setTimeout(closeQuickOrder, 1400);

  } catch (err) {
    console.error('Order error', err);
    alert('Could not place order now. Try again later.');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Place Order'; }
  }
}

/* DOM ready wiring */
document.addEventListener('DOMContentLoaded', () => {
  // wire product buttons
  wireProductButtons();

  // wire form submit
  const f = form();
  if (f) f.addEventListener('submit', handleSubmit);

  // close / cancel
  if (closeBtn()) closeBtn().addEventListener('click', closeQuickOrder);
  if (cancelBtn()) cancelBtn().addEventListener('click', closeQuickOrder);
  if (closeAfterBtn()) closeAfterBtn().addEventListener('click', closeQuickOrder);

  // nav anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const t = document.querySelector(a.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // nav order CTA opens general popup
  const navCta = document.querySelector('.nav-cta');
  if (navCta) navCta.addEventListener('click', () => openQuickOrder('General Preorder'));
});
