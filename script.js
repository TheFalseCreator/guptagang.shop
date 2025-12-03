// script.js - drop into your repo (replace old file)
// Put your deployed web app URL here:
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZ_GR310jAtdCVSOUeVu9DQgrYQUV0T_Oy92ojctZzm-1U3Le4LK7v8lCFrlF7gRLLyg/exec'; // <-- replace this

/* helpers */
const popup = () => document.getElementById('quickOrderPopup');
const form = () => document.getElementById('quickOrderForm');
const successBox = () => document.getElementById('quickSuccess');
const closeBtn = () => document.getElementById('quickCloseBtn');
const cancelBtn = () => document.getElementById('quickCancel');
const closeAfterBtn = () => document.getElementById('quickCloseAfter');

function scrollToProduct(){ const el = document.getElementById('product'); if(el) el.scrollIntoView({behavior:'smooth'}); }

function openQuickOrder(productName=''){
  const p = popup(); if(!p) return;
  p.classList.add('open'); p.setAttribute('aria-hidden','false');
  const hidden = document.getElementById('quickProduct'); if(hidden) hidden.value = productName;
  const f = form(); if(f){ f.hidden = false; f.reset(); }
  const s = successBox(); if(s) s.hidden = true;
  document.body.style.overflow = 'hidden';
}

function closeQuickOrder(){
  const p = popup(); if(!p) return;
  p.classList.remove('open'); p.setAttribute('aria-hidden','true');
  document.body.style.overflow = 'auto';
}

function wireProductButtons(){
  document.querySelectorAll('.product-btn').forEach(btn => {
    btn.removeEventListener('click', onProductClick);
    btn.addEventListener('click', onProductClick);
  });
}
function onProductClick(e){
  const product = e.currentTarget.dataset.product || '';
  openQuickOrder(product);
}

function validPhone(phone){ const d = (phone||'').replace(/\D/g,''); return /^\d{10}$/.test(d); }

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

  // Developer safety checks
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
    alert('Set GOOGLE_SCRIPT_URL in script.js to your deployed Apps Script web app URL (step 2).');
    if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='Place Order'; }
    return;
  }

  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error('Server responded with status ' + res.status);
    }

    // parse JSON from server
    const data = await res.json();
    if (data && data.status === 'ok') {
      const f = form(); if(f) f.hidden = true;
      const s = successBox(); if(s) s.hidden = false;
      setTimeout(() => {
        if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='Place Order'; }
      }, 800);
      setTimeout(closeQuickOrder, 1400);
    } else {
      throw new Error(data && data.message ? data.message : 'Server rejected request');
    }

  } catch (err) {
    console.error('Order error', err);
    alert('Could not place order now. See console for details.');
    if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='Place Order'; }
  }
}

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
