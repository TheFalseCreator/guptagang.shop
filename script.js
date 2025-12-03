// ---- Set this to your Apps Script Web App URL ----
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZ_GR310jAtdCVSOUeVu9DQgrYQUV0T_Oy92ojctZzm-1U3Le4LK7v8lCFrlF7gRLLyg/exec'; // <-- replace

/* helpers */
const popup = () => document.getElementById('quickOrderPopup');
const form = () => document.getElementById('quickOrderForm');
const successBox = () => document.getElementById('quickSuccess');
const closeBtn = () => document.getElementById('quickCloseBtn');
const cancelBtn = () => document.getElementById('quickCancel');
const closeAfterBtn = () => document.getElementById('quickCloseAfter');

function scrollToProduct(){ const el = document.getElementById('product'); if(el) el.scrollIntoView({behavior:'smooth'}); }

/* open popup and set product */
function openQuickOrder(productName=''){
  const p = popup(); if(!p) return;
  p.classList.add('open'); p.setAttribute('aria-hidden','false');
  const hidden = document.getElementById('quickProduct'); if(hidden) hidden.value = productName;
  const f = form(); if(f){ f.hidden = false; f.reset(); }
  const s = successBox(); if(s) s.hidden = true;
  document.body.style.overflow = 'hidden';
}

/* close popup */
function closeQuickOrder(){
  const p = popup(); if(!p) return;
  p.classList.remove('open'); p.setAttribute('aria-hidden','true');
  document.body.style.overflow = 'auto';
}

/* wire product order button */
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

/* phone validator */
function validPhone(phone){ const d = (phone||'').replace(/\D/g,''); return /^\d{10}$/.test(d); }

/* submit handler */
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

  try{
    // If Apps Script supports CORS, remove mode:'no-cors' to read response
    await fetch(GOOGLE_SCRIPT_URL, { method:'POST', mode:'no-cors', headers:{ 'Content-Type':'application/json'}, body: JSON.stringify(payload) });

    const f = form(); if(f) f.hidden = true;
    const s = successBox(); if(s) s.hidden = false;

    setTimeout(()=>{ if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='Place Order'; } }, 800);
    setTimeout(closeQuickOrder, 1400);

  }catch(err){
    console.error('Order error', err);
    alert('Could not place order now. Try again later.');
    if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='Place Order'; }
  }
}

/* on DOM ready */
document.addEventListener('DOMContentLoaded', ()=>{
  wireProductButtons();
  const f = form(); if(f) f.addEventListener('submit', handleSubmit);

  if(closeBtn()) closeBtn().addEventListener('click', closeQuickOrder);
  if(cancelBtn()) cancelBtn().addEventListener('click', closeQuickOrder);
  if(closeAfterBtn()) closeAfterBtn().addEventListener('click', closeQuickOrder);

  // nav anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click',(ev)=>{ ev.preventDefault(); const t = document.querySelector(a.getAttribute('href')); if(t) t.scrollIntoView({behavior:'smooth'}); });
  });

  // nav CTA opens popup for the single hoodie
  const navCta = document.querySelector('.nav-cta');
  if(navCta) navCta.addEventListener('click', ()=> openQuickOrder('SPS Front & Back Hoodie — ₹1,600'));
});
