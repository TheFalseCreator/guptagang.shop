// script.js — JSONP client (replace the entire file in your repo)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxZY4Emg-pM4jYiwx3uFtpzmxTknHJ8qOXy9bxhEDj-2z0UoFkDkLz68vDJHChAQho0/exec';

/* helpers */
const popup = () => document.getElementById('quickOrderPopup');
const form = () => document.getElementById('quickOrderForm');
const successBox = () => document.getElementById('quickSuccess');
const closeBtn = () => document.getElementById('quickCloseBtn');
const cancelBtn = () => document.getElementById('quickCancel');
const closeAfterBtn = () => document.getElementById('quickCloseAfter');

function scrollToProduct(){ const el = document.getElementById('product'); if(el) el.scrollIntoView({behavior:'smooth'}); }
function openQuickOrder(productName=''){ const p = popup(); if(!p) return; p.classList.add('open'); p.setAttribute('aria-hidden','false'); const hidden = document.getElementById('quickProduct'); if(hidden) hidden.value = productName; const f = form(); if(f){ f.hidden = false; f.reset(); } const s = successBox(); if(s) s.hidden = true; document.body.style.overflow = 'hidden'; }
function closeQuickOrder(){ const p = popup(); if(!p) return; p.classList.remove('open'); p.setAttribute('aria-hidden','true'); document.body.style.overflow = 'auto'; }
function wireProductButtons(){ document.querySelectorAll('.product-btn').forEach(btn => { btn.removeEventListener('click', onProductClick); btn.addEventListener('click', onProductClick); }); }
function onProductClick(e){ const product = e.currentTarget.dataset.product || ''; openQuickOrder(product); }
function validPhone(phone){ const d = (phone||'').replace(/\D/g,''); return /^\d{10}$/.test(d); }

/* JSONP helper */
function submitViaJSONP(payload, cb) {
  const cbName = '__gup_order_cb_' + Date.now() + '_' + Math.floor(Math.random()*10000);
  window[cbName] = function(data) {
    try { cb(null, data); } catch(e) { cb(e); }
    try { delete window[cbName]; } catch(e) {}
    const el = document.getElementById(cbName);
    if (el) el.remove();
  };

  const urlBase = GOOGLE_SCRIPT_URL;
  const params = new URLSearchParams();
  params.append('callback', cbName);
  params.append('product', payload.product || '');
  params.append('name', payload.name || '');
  params.append('class', payload.class || '');
  params.append('admission', payload.admission || '');
  params.append('phone', payload.phone || '');
  params.append('_ts', Date.now());

  const fullUrl = urlBase + '?' + params.toString();

  const script = document.createElement('script');
  script.src = fullUrl;
  script.id = cbName;
  script.onerror = function(){ try{ delete window[cbName]; } catch(e){} script.remove(); cb(new Error('JSONP load error')); };
  document.body.appendChild(script);
}

/* Form submit handler */
async function handleSubmit(e){
  e.preventDefault();
  const submitBtn = document.getElementById('quickSubmit');
  if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Placing...'; }

  const payload = {
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    product: (document.getElementById('quickProduct')||{}).value || '',
    name: (document.getElementById('qName')||{}).value.trim(),
    class: (document.getElementById('qClass')||{}).value.trim(),
    admission: (document.getElementById('qAdmission')||{}).value.trim(),
    phone: (document.getElementById('qPhone')||{}).value.trim()
  };

  if(!payload.name || !payload.class || !payload.admission || !payload.phone){
    alert('Please fill all fields.');
    if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='Place Order'; }
    return;
  }
  if(!validPhone(payload.phone)){
    alert('Please enter a valid 10-digit phone.');
    if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='Place Order'; }
    return;
  }

  const last = Number(localStorage.getItem('lastQuickOrderAt')||0);
  if(Date.now()-last < 7000){ alert('Please wait a moment before another order.'); if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='Place Order'; } return; }
  localStorage.setItem('lastQuickOrderAt', Date.now());

  try {
    submitViaJSONP(payload, function(err, data){
      if (err) {
        console.error('JSONP submit error', err);
        alert('Could not place order now. Try again later.');
        if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='Place Order'; }
        return;
      }
      if (data && data.status === 'ok') {
        const f = form(); if(f) f.hidden = true;
        const s = successBox(); if(s) s.hidden = false;
        setTimeout(()=> { if (submitBtn) { submitBtn.disabled=false; submitBtn.textContent='Place Order'; } }, 800);
        setTimeout(closeQuickOrder, 1400);
        console.log('Order successful (JSONP)');
      } else {
        console.error('Server rejected JSONP response', data);
        alert('Server returned error. Try again later.');
        if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='Place Order'; }
      }
    });
  } catch (err) {
    console.error('Order error', err);
    alert('Could not place order now. See console for details.');
    if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='Place Order'; }
  }
}

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  wireProductButtons();
  const f = form(); if(f) f.addEventListener('submit', handleSubmit);
  if(closeBtn()) closeBtn().addEventListener('click', closeQuickOrder);
  if(cancelBtn()) cancelBtn().addEventListener('click', closeQuickOrder);
  if(closeAfterBtn()) closeAfterBtn().addEventListener('click', closeQuickOrder);

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const t = document.querySelector(a.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const navCta = document.querySelector('.nav-cta');
  if (navCta) navCta.addEventListener('click', () => openQuickOrder('SPS Front & Back Hoodie — ₹1,600'));
});
