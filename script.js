// script.js - hidden-form submission (with JSONP fallback)
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

/* Hidden form submit helper (preferred) */
function submitViaHiddenForm(payload, onDone) {
  const hfProduct = document.getElementById('hf_product');
  const hfName = document.getElementById('hf_name');
  const hfClass = document.getElementById('hf_class');
  const hfAdmission = document.getElementById('hf_admission');
  const hfPhone = document.getElementById('hf_phone');
  const hiddenForm = document.getElementById('hiddenOrderForm');
  const iframe = document.getElementById('hidden_iframe');

  // if hidden form or iframe missing, fallback to JSONP
  if (!hiddenForm || !iframe || !hfProduct || !hfName) {
    onDone(false, 'hidden_form_missing');
    return;
  }

  hfProduct.value = payload.product || '';
  hfName.value = payload.name || '';
  hfClass.value = payload.class || '';
  hfAdmission.value = payload.admission || '';
  hfPhone.value = payload.phone || '';

  let finished = false;
  const finish = (ok, info) => {
    if (finished) return;
    finished = true;
    try { iframe.removeEventListener('load', onLoad); } catch(e){}
    clearTimeout(timeoutId);
    onDone(ok, info);
  };

  function onLoad(){
    // iframe loaded => server responded; treat as success
    finish(true, 'loaded');
  }

  iframe.addEventListener('load', onLoad);

  const timeoutId = setTimeout(()=> {
    finish(false, 'timeout');
  }, 10000); // 10s

  // Submit the hidden form (navigates the iframe)
  try {
    hiddenForm.submit();
  } catch(e) {
    finish(false, 'submit_error');
  }
}

/* JSONP fallback (keeps previous behavior if hidden form unavailable) */
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

/* Unified submit that prefers hidden form, else JSONP */
function submitOrder(payload, callback) {
  // prefer hidden form (no CORS)
  submitViaHiddenForm(payload, function(success, info){
    if (success) {
      callback(null, {status:'ok', method:'hiddenForm'});
      return;
    }
    // hidden form failed or missing — try JSONP fallback
    submitViaJSONP(payload, function(err, data){
      if (err) return callback(err);
      callback(null, {status: data && data.status ? data.status : 'unknown', method: 'jsonp', raw: data});
    });
  });
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
    submitOrder(payload, function(err, result){
      if (err) {
        console.error('Order submit error', err);
        alert('Could not place order now. Try again later.');
        if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent='Place Order'; }
        return;
      }

      // success handling: treat status 'ok' as success
      if (result && (result.status === 'ok' || result.status === 'OK')) {
        const f = form(); if(f) f.hidden = true;
        const s = successBox(); if(s) s.hidden = false;
        setTimeout(()=> { if (submitBtn) { submitBtn.disabled=false; submitBtn.textContent='Place Order'; } }, 800);
        setTimeout(closeQuickOrder, 1400);
        console.log('Order successful via', result.method || 'unknown', result);
      } else {
        console.error('Server rejected order', result);
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
