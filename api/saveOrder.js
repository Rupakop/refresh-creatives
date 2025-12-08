<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Refresh Elixer — Pay with GPay / UPI</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-r from-black to-pink-600 text-white min-h-screen">

  <div class="max-w-6xl mx-auto py-12 px-4">
    <header class="text-center mb-6">
      <h1 class="text-4xl font-bold">Refresh Elixer</h1>
      <p class="text-gray-200 mt-2">Pay via GPay / UPI — no gateway fees. Orders are saved to database for you to verify.</p>
    </header>

    <div class="flex justify-center gap-3 mb-6">
      <button id="openSelectorBtn" class="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded">Select Perfumes</button>
    </div>

    <div id="previewGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8"></div>

    <footer class="text-center text-sm text-gray-200">UPI payments are instant — verify receipts in your bank app. Orders saved to DB for your processing.</footer>
  </div>

  <!-- Modal -->
  <div id="modal" class="fixed inset-0 hidden z-50 flex items-start justify-center overflow-auto bg-black/70 p-4">
    <div class="bg-white text-black rounded-xl max-w-5xl w-full p-4 mt-8">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-xl font-semibold">Select Perfumes & Pay (GPay / UPI)</h2>
        <div class="flex items-center gap-3">
          <span id="stepIndicator" class="text-sm text-gray-600">Step: Selection</span>
          <button id="closeModal" class="text-sm text-gray-600">Close</button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <!-- Left: list -->
        <div>
          <div class="mb-2">
            <label class="text-sm">Default bottle size:</label>
            <select id="defaultSize" class="border rounded px-2 py-1 ml-2 text-sm">
              <option value="10">10 ml — ₹99</option>
              <option value="20">20 ml — ₹199</option>
              <option value="30" selected>30 ml — ₹320</option>
              <option value="60">60 ml — ₹499</option>
              <option value="100">100 ml — ₹749</option>
            </select>
          </div>

          <div id="perfumeList" class="max-h-[60vh] overflow-auto space-y-2 p-1 border rounded pr-2"></div>
        </div>

        <!-- Right: cart + address + UPI pay -->
        <div class="space-y-3">
          <div class="p-3 border rounded bg-gray-50 text-black">
            <h3 class="font-semibold">Cart</h3>
            <div id="cartItems" class="mt-2 space-y-2"></div>
            <div class="mt-3 flex items-center justify-between">
              <div class="font-semibold">Total: ₹<span id="cartTotal">0</span></div>
              <button id="clearCart" class="text-sm px-3 py-1 border rounded">Clear</button>
            </div>
          </div>

          <div class="p-3 border rounded bg-gray-50 text-black">
            <h3 class="font-semibold">Delivery Details</h3>
            <div class="mt-2 space-y-2">
              <input id="custName" placeholder="Full name" class="w-full border px-2 py-1 rounded text-sm" />
              <input id="custPhone" placeholder="Phone (include country code if outside India)" class="w-full border px-2 py-1 rounded text-sm" />
              <input id="addrLine" placeholder="Address line (street, house no.)" class="w-full border px-2 py-1 rounded text-sm" />
              <input id="addrLocality" placeholder="Locality (eg. Parel, Lalbaug)" class="w-full border px-2 py-1 rounded text-sm" />
              <input id="addrCity" placeholder="City" class="w-full border px-2 py-1 rounded text-sm" />
              <div class="text-xs text-gray-600">Note: UPI payments are instant. Check your bank app to confirm receipt.</div>
            </div>
          </div>

          <div class="p-3 border rounded bg-gray-50 text-black">
            <h3 class="font-semibold">Pay via GPay / UPI</h3>
            <div class="mt-2 space-y-2">
              <div class="flex gap-2">
                <button id="payUpiBtn" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">Open UPI / GPay</button>
                <button id="copyUpiBtn" class="flex-1 bg-gray-200 text-black py-2 rounded">Copy UPI ID</button>
              </div>
              <div class="text-sm text-gray-700">Or scan QR:</div>
              <div class="mt-2 flex items-center gap-3">
                <img id="qrImg" src="" alt="QR" class="w-36 h-36 bg-white/80 p-2 rounded" />
                <div class="text-sm">
                  <div>UPI ID: <b id="upiIdText" class="break-words"></b></div>
                  <div class="mt-2">Amount: ₹<span id="upiAmount">0</span></div>
                  <button id="iPaidBtn" class="mt-3 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded">I have paid — Save order</button>
                </div>
              </div>
            </div>
          </div>

          <div id="msg" class="text-sm text-red-600"></div>
        </div>
      </div>

      <!-- Order summary panel (hidden initially) -->
      <div id="orderSummaryPanel" class="mt-4 hidden bg-white/95 text-black p-4 rounded">
        <h3 class="text-lg font-semibold">Order Saved — Summary</h3>
        <div id="orderSummaryContent" class="mt-2 text-sm"></div>
        <div class="mt-3 text-sm text-green-700">Keep this info for verification. Verify the payment in your bank app before fulfilling.</div>
        <div class="mt-3">
          <button id="closeSummary" class="px-3 py-1 border rounded">Close</button>
        </div>
      </div>

    </div>
  </div>

<script>
/* ========== CONFIG ========== */
// Your actual UPI ID (already set as requested)
const UPI_ID = 'rupakmurkar41@oksbi';

// API endpoint to save orders (Vercel serverless)
const SAVE_ORDER_API = '/api/saveOrder';

/* ========== DATA ========== */
const PERFUMES = [
  { id:1, name:"Velvet Verse", inspired:"Poem", desc:"Warm floral blend with soft powdery notes and a romantic aura."},
  { id:2, name:"Pure Snow Musk", inspired:"White Musk", desc:"Clean, soft, airy musk with long-lasting freshness."},
  { id:3, name:"Midnight Dreamer", inspired:"Dream", desc:"Smooth and lightly sweet with a calm, dreamy aura."},
  { id:4, name:"Soft Dove Mist", inspired:"Dove", desc:"Fresh, clean, creamy fragrance with a comforting soap-like touch."},
  { id:5, name:"Golden Talon", inspired:"Golden Hawk", desc:"Sharp citrus opening with masculine woody depth."},
  { id:6, name:"Midnight Charlie", inspired:"Charlie Black", desc:"Warm spicy masculine scent with aromatic undertones."},
  { id:7, name:"Rider’s Edge", inspired:"Harley Davidson", desc:"Rugged leathery aroma with smoky, adventurous vibes."},
  { id:8, name:"Crystal Musk", inspired:"White Jovan Musk", desc:"Fresh musky aroma with a lightly floral clean finish."},
  { id:9, name:"Open Breeze", inspired:"Open", desc:"Herbal green freshness with a cool aromatic finish."},
  { id:10, name:"Brute Force", inspired:"Brut", desc:"Classic barbershop fougère with spice and musk."},
  { id:11, name:"Snow Nevia", inspired:"Nevia", desc:"Fresh, creamy, soft fragrance with a soothing feel."},
  { id:12, name:"Royal Mirage Essence", inspired:"Royal Mirage", desc:"Powdery, floral, elegant, and long-lasting scent."},
  { id:13, name:"Solo Legend", inspired:"One Man Show", desc:"Strong woody-aromatic with herbal sharpness."},
  { id:14, name:"Havoc Storm", inspired:"Havoc", desc:"Mild sweet freshness with a youthful energetic vibe."},
  { id:15, name:"Urban Hugo", inspired:"Hugo", desc:"Green, fresh, slightly spicy masculine scent."},
  { id:16, name:"Sweet Aura", inspired:"Sweet Heart", desc:"Soft floral sweetness balanced with musk."},
  { id:17, name:"Mars Fire", inspired:"Mars", desc:"Spicy, warm, bold scent with strong projection."},
  { id:18, name:"Cobra Strike", inspired:"Cobra", desc:"Sharp, spicy masculine scent with a punch."},
  { id:19, name:"Inferno Wood", inspired:"Fahrenheit", desc:"Smoky leather blended with violet leaf & warm spice."},
  { id:20, name:"Ocean Attar Mist", inspired:"Sea Seven Attarful", desc:"Fresh aquatic scent with crisp salty waves."},
  { id:21, name:"Azure Seven", inspired:"Sea Seven", desc:"Pure oceanic freshness with an airy cool finish."},
  { id:22, name:"Fresh Ponds Mist", inspired:"Ponds", desc:"Clean, powdery, creamy freshness."},
  { id:23, name:"Blue Velvet Lady", inspired:"Blue Lady", desc:"Floral-fruity feminine scent with soft sweetness."},
  { id:24, name:"Paso Legend", inspired:"El Paso", desc:"Woody spicy masculine fragrance with warm depth."},
  { id:25, name:"Kewda Bloom", inspired:"Kevda", desc:"Traditional fresh sweet floral attar."},
  { id:26, name:"Bold Belle", inspired:"Good Girl", desc:"Sweet, sensual floral with warm tonka & cocoa."},
  { id:27, name:"Nice Breeze", inspired:"Nice", desc:"Simple fresh floral-aquatic with soft pleasant notes."},
  { id:28, name:"Lomani Noir", inspired:"Lomani", desc:"Aromatic woody blend with citrus freshness."},
  { id:29, name:"Night Drakkar", inspired:"Drakkar Noir", desc:"Herbal spicy masculine fougère."},
  { id:30, name:"Aqua Wave", inspired:"Cool Water", desc:"Fresh oceanic notes with mint & lavender."},
  { id:31, name:"Scarlet Charlie", inspired:"Charlie Red", desc:"Warm floral sweetness with spicy feminine tones."},
  { id:32, name:"Sport Breeze", inspired:"Polo Sport", desc:"Clean sporty citrus with green notes."},
  { id:33, name:"Blue Charge", inspired:"Blue Challenge", desc:"Fresh blue aromatic masculine scent."},
  { id:34, name:"London Snow", inspired:"White London", desc:"Bright citrusy fragrance with soft musk."},
  { id:35, name:"Ocean Drift", inspired:"Cool Water", desc:"Minty aquatic freshness with a calm coastal vibe."}
];

const SIZES = [
  { code:10, label:"10 ml", price:99, image: 'images/SaveGram.App_566550326_17857770177537302_8578694020916593195_n-removebg-preview.png' },
  { code:20, label:"20 ml", price:199, image: 'images/19591-removebg-preview.png' },
  { code:30, label:"30 ml", price:320, image: 'images/generated-image__35_-removebg-preview.png' },
  { code:60, label:"60 ml", price:499, image: 'images/generated-image__34_-removebg-preview.png' },
  { code:100,label:"100 ml",price:749, image: 'images/generated-image__36_-removebg-preview.png' }
];

/* ========== State ========== */
let cart = []; // items: {perfumeId, sizeCode, qty}

/* ========== Helpers ========== */
function findPerfume(id){ return PERFUMES.find(p=>p.id===id); }
function findSize(code){ return SIZES.find(s=>s.code==code) || SIZES[2]; }
function calcTotal(){ return cart.reduce((sum,it)=> sum + (findSize(it.sizeCode).price * it.qty), 0); }
function formatRupees(n){ return Number(n).toLocaleString('en-IN'); }

/* ========== Render preview grid ========== */
const previewGrid = document.getElementById('previewGrid');
SIZES.forEach(size=>{
  const card = document.createElement('div');
  card.className = 'bg-white text-black rounded-2xl p-4 flex flex-col';
  card.innerHTML = `
    <div class="h-40 mb-3 flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden">
      <img src="${size.image}" alt="${size.label}" class="object-contain h-full w-full" />
    </div>
    <h3 class="text-lg font-semibold">${size.label} bottle</h3>
    <div class="text-sm text-gray-700">₹${size.price}</div>
    <div class="flex gap-2 mt-auto pt-3">
      <button data-size="${size.code}" class="open-modal buy-now bg-pink-600 hover:bg-pink-700 text-white py-2 px-3 rounded-lg text-sm font-medium w-full">Select & Buy</button>
    </div>
  `;
  previewGrid.appendChild(card);
});

/* ========== Build perfume list in modal ========== */
const perfumeListEl = document.getElementById('perfumeList');
PERFUMES.forEach(p=>{
  const item = document.createElement('div');
  item.className = 'p-3 border rounded-lg bg-white/90 text-black';
  item.innerHTML = `
    <div class="flex items-start gap-3">
      <input type="checkbox" data-id="${p.id}" class="perf-checkbox mt-1" />
      <div>
        <div class="font-semibold">${p.name}</div>
        <div class="text-xs text-gray-600">Inspired by ${p.inspired}</div>
        <div class="text-xs text-gray-700 mt-1">${p.desc}</div>
        <div class="mt-2 flex items-center gap-2">
          <label class="text-xs">Size</label>
          <select data-id="${p.id}" class="size-select border px-2 py-1 text-xs rounded">
            ${SIZES.map(s=>`<option value="${s.code}" ${s.code===30?'selected':''}>${s.label} — ₹${s.price}</option>`).join('')}
          </select>
          <label class="text-xs ml-2">Qty</label>
          <input data-id="${p.id}" type="number" min="1" value="1" class="qty-input w-14 border px-2 py-1 text-xs rounded" />
        </div>
      </div>
    </div>
  `;
  perfumeListEl.appendChild(item);
});

/* ========== DOM refs ========== */
const openSelectorBtn = document.getElementById('openSelectorBtn');
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('closeModal');
const defaultSizeEl = document.getElementById('defaultSize');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const clearCartBtn = document.getElementById('clearCart');
const payUpiBtn = document.getElementById('payUpiBtn');
const copyUpiBtn = document.getElementById('copyUpiBtn');
const qrImg = document.getElementById('qrImg');
const upiAmountEl = document.getElementById('upiAmount');
const upiIdText = document.getElementById('upiIdText');
const iPaidBtn = document.getElementById('iPaidBtn');
const msgEl = document.getElementById('msg');
const orderSummaryPanel = document.getElementById('orderSummaryPanel');
const orderSummaryContent = document.getElementById('orderSummaryContent');
const closeSummary = document.getElementById('closeSummary');

/* ========== Modal open/close ========== */
openSelectorBtn.addEventListener('click', openModal);
document.querySelectorAll('.open-modal').forEach(btn=>btn.addEventListener('click', openModal));
closeModalBtn.addEventListener('click', closeModal);
clearCartBtn.addEventListener('click', ()=>{ cart=[]; updateCartUI(); });

function openModal(){ modal.classList.remove('hidden'); attachPerfumeControls(); cart.forEach(it=> syncInputs(it)); updateCartUI(); }
function closeModal(){ modal.classList.add('hidden'); }

/* ========== Attach controls ========== */
function attachPerfumeControls(){
  document.querySelectorAll('.perf-checkbox').forEach(chk=>{
    chk.onchange = ()=>{
      const id = Number(chk.dataset.id);
      const sizeSel = document.querySelector(`.size-select[data-id="${id}"]`);
      const qtyInput = document.querySelector(`.qty-input[data-id="${id}"]`);
      if(chk.checked){
        const sizeCode = Number(sizeSel.value);
        const qty = Math.max(1, Number(qtyInput.value)||1);
        cart.push({ perfumeId: id, sizeCode, qty });
      } else {
        cart = cart.filter(i=>i.perfumeId !== id);
      }
      updateCartUI();
    };
  });

  document.querySelectorAll('.size-select').forEach(sel=>{
    sel.onchange = ()=>{
      const id = Number(sel.dataset.id);
      const item = cart.find(i=>i.perfumeId===id);
      if(item){ item.sizeCode = Number(sel.value); updateCartUI(); }
    };
  });
  document.querySelectorAll('.qty-input').forEach(inp=>{
    inp.onchange = ()=>{
      const id = Number(inp.dataset.id);
      const item = cart.find(i=>i.perfumeId===id);
      const v = Math.max(1, Number(inp.value)||1);
      if(item){ item.qty = v; updateCartUI(); }
    };
  });
}

/* ========== Cart UI ========== */
function updateCartUI(){
  cartItemsEl.innerHTML = '';
  if(cart.length===0){
    cartItemsEl.innerHTML = '<div class="text-sm text-gray-600">Cart is empty</div>';
    cartTotalEl.textContent = '0';
    upiAmountEl.textContent = '0';
    upiIdText.textContent = UPI_ID;
    qrImg.src = generateQr('upi://pay?pa=' + encodeURIComponent(UPI_ID));
    return;
  }
  cart.forEach((it, idx)=>{
    const p = findPerfume(it.perfumeId);
    const s = findSize(it.sizeCode);
    const row = document.createElement('div');
    row.className = 'flex items-start justify-between gap-3 bg-white/90 p-2 rounded';
    row.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-20 h-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
          <img src="${s.image}" alt="${s.label}" class="object-contain w-full h-full" />
        </div>
        <div>
          <div class="font-medium">${p.name} <span class="text-xs text-gray-600">(${s.label})</span></div>
          <div class="text-xs text-gray-600">${p.desc}</div>
          <div class="mt-1 text-xs">Qty: ${it.qty}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="font-medium">₹${formatRupees(s.price * it.qty)}</div>
        <div class="mt-2 flex gap-1 justify-end">
          <button data-idx="${idx}" class="dec text-xs px-2 py-1 border rounded">-</button>
          <button data-idx="${idx}" class="inc text-xs px-2 py-1 border rounded">+</button>
          <button data-idx="${idx}" class="rem text-xs px-2 py-1 text-red-600">Remove</button>
        </div>
      </div>
    `;
    cartItemsEl.appendChild(row);
  });

  // attach inc/dec/remove
  cartItemsEl.querySelectorAll('.inc').forEach(btn=> btn.onclick = ()=>{ const i=Number(btn.dataset.idx); cart[i].qty++; syncInputs(cart[i]); updateCartUI(); });
  cartItemsEl.querySelectorAll('.dec').forEach(btn=> btn.onclick = ()=>{ const i=Number(btn.dataset.idx); cart[i].qty = Math.max(1, cart[i].qty-1); syncInputs(cart[i]); updateCartUI(); });
  cartItemsEl.querySelectorAll('.rem').forEach(btn=> btn.onclick = ()=>{ const i=Number(btn.dataset.idx); const removed = cart.splice(i,1)[0]; const cb = document.querySelector(`.perf-checkbox[data-id="${removed.perfumeId}"]`); if(cb) cb.checked=false; updateCartUI(); });

  cartTotalEl.textContent = formatRupees(calcTotal());
  upiAmountEl.textContent = calcTotal();
  upiIdText.textContent = UPI_ID;

  // update QR for the exact amount
  const upiLink = buildUpiLink(UPI_ID, 'Refresh Elixer', calcTotal(), 'Order from Refresh Elixer');
  qrImg.src = generateQr(upiLink);
}

/* ========== Sync inputs ========== */
function syncInputs(item){
  const sizeSel = document.querySelector(`.size-select[data-id="${item.perfumeId}"]`);
  const qtyInput = document.querySelector(`.qty-input[data-id="${item.perfumeId}"]`);
  if(sizeSel) sizeSel.value = item.sizeCode;
  if(qtyInput) qtyInput.value = item.qty;
}

/* ========== UPI helpers ========== */
function buildUpiLink(pa, pn, amount, tn){
  const a = Number(amount).toFixed(2);
  const base = `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&tn=${encodeURIComponent(tn)}&am=${encodeURIComponent(a)}&cu=INR`;
  return base;
}
function generateQr(data){
  return `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(data)}`;
}

/* ========== Actions: pay / copy / confirm (save to DB) ========== */
payUpiBtn.addEventListener('click', ()=>{
  if(cart.length===0){ showMsg('Cart is empty.'); return; }
  const amount = calcTotal();
  const upiLink = buildUpiLink(UPI_ID, 'Refresh Elixer', amount, 'Perfume order');
  window.location.href = upiLink;
  qrImg.src = generateQr(upiLink);
});

copyUpiBtn.addEventListener('click', ()=>{
  navigator.clipboard.writeText(UPI_ID).then(()=> showMsg('UPI ID copied to clipboard.')).catch(()=> showMsg('Unable to copy — please copy manually.'));
});

iPaidBtn.addEventListener('click', async ()=>{
  // validate
  if(cart.length===0){ showMsg('Cart is empty.'); return; }
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const line = document.getElementById('addrLine').value.trim();
  const locality = document.getElementById('addrLocality').value.trim();
  const city = document.getElementById('addrCity').value.trim();
  if(!name || !phone || (!line && !locality)){ showMsg('Please fill name, phone and address (line or locality).'); return; }

  // build payload
  const itemsPayload = cart.map(it=>{
    const p = findPerfume(it.perfumeId);
    const s = findSize(it.sizeCode);
    return { id: p.id, name: p.name, inspired: p.inspired, size: s.label, qty: it.qty, unit_price: s.price };
  });
  const payload = {
    name,
    phone,
    address: line,
    city: city || '',
    items: itemsPayload,
    amount: calcTotal(), // rupees as integer
    upi_id: UPI_ID
  };

  // send to server
  showMsg('Saving order...');
  try {
    const res = await fetch(SAVE_ORDER_API, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    if(res.ok && j.success){
      // show full order summary returned (if server returns id)
      const orderId = j.insertId || j.orderId || null;
      showOrderSummary({ orderId, ...payload, created_at: j.created_at || new Date().toISOString() });
      // clear cart
      cart = [];
      document.querySelectorAll('.perf-checkbox').forEach(cb=> cb.checked=false);
      updateCartUI();
      showMsg('Order saved.');
    } else {
      showMsg(j.error || 'Failed to save order.');
    }
  } catch(err){
    console.error(err);
    showMsg('Network error while saving order.');
  }
});

/* ========== display order summary ========== */
function showOrderSummary(order){
  orderSummaryPanel.classList.remove('hidden');
  let html = '';
  if(order.orderId) html += `<div><strong>Order ID:</strong> ${order.orderId}</div>`;
  html += `<div><strong>Name:</strong> ${escapeHtml(order.name)}</div>`;
  html += `<div><strong>Phone:</strong> ${escapeHtml(order.phone)}</div>`;
  html += `<div><strong>Address:</strong> ${escapeHtml(order.address)} ${escapeHtml(order.city||'')}</div>`;
  html += `<div class="mt-2"><strong>Items:</strong><ul class="list-disc pl-5">`;
  order.items.forEach(it=>{
    html += `<li>${escapeHtml(it.name)} — ${escapeHtml(it.size)} x${it.qty} — ₹${it.unit_price * it.qty}</li>`;
  });
  html += `</ul></div>`;
  html += `<div class="mt-2"><strong>Total:</strong> ₹${order.amount}</div>`;
  html += `<div class="mt-2 text-xs text-gray-700">Saved at: ${order.created_at}</div>`;
  orderSummaryContent.innerHTML = html;
}

closeSummary.addEventListener('click', ()=> orderSummaryPanel.classList.add('hidden'));

/* ========== messaging & helpers ========== */
function showMsg(txt){ msgEl.textContent = txt; setTimeout(()=> msgEl.textContent = '', 5000); }
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ========== init ========== */
function init(){
  upiIdText.textContent = UPI_ID;
  qrImg.src = generateQr('upi://pay?pa=' + encodeURIComponent(UPI_ID));
  document.getElementById('defaultSize').addEventListener('change', (e)=>{
    const code = Number(e.target.value);
    document.querySelectorAll('.size-select').forEach(sel=> sel.value = code);
    cart = cart.map(it => ({ ...it, sizeCode: it.sizeCode || code }));
    updateCartUI();
  });
}
init();

</script>
</body>
</html>
