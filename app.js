/* Akade Finance — catatan keuangan pribadi (IDR + USD) */
(() => {
'use strict';

/* ---------- Konstanta ---------- */
const CATS = [
  { id: 'food',      name: 'Food',      color: '#5492df' },
  { id: 'transport', name: 'Transport', color: '#d66e48' },
  { id: 'belanja',   name: 'Shopping',   color: '#49a47d' },
  { id: 'tagihan',   name: 'Bills',   color: '#bf8737' },
  { id: 'hiburan',   name: 'Fun',   color: '#d3678b' },
  { id: 'kesehatan', name: 'Health', color: '#8f88d9' },
  { id: 'lainnya',   name: 'Others',   color: '#6f7f8c' },
];
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
const TYPES = {
  expense: { name: 'Spending' },
  saving:  { name: 'Saving' },
  give:    { name: 'Given' },
  income:  { name: 'Income' },
};
const VIEWS = [
  { id: 'ringkasan', name: 'Overview', icon: '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z"/>' },
  { id: 'transaksi', name: 'Transactions', short: 'Activity', icon: '<path d="M5 7h14M5 12h14M5 17h9"/>' },
  { id: 'tabungan',  name: 'Savings & transfer', short: 'Savings', icon: '<path d="M4 10l8-5 8 5M6 10v8M10 10v8M14 10v8M18 10v8M4 19h16"/>' },
  { id: 'riwayat',   name: 'History',   icon: '<path d="M4 19V9M10 19V5M16 19v-7M21 19H3"/>' },
  { id: 'project',   name: 'Akade Project', short: 'Project', icon: '<path d="M4 8h16v11H4zM9 8V5h6v3M4 13h16"/>' },
];

const DICT_SRC = {
  food: 'makan makanan sarapan nasi ayam bebek sate soto bakso mie mi indomie kentang goreng gorengan burger pizza kopi teh boba jus es susu roti kue snack cemilan camilan jajan warteg padang kfc mcd mcdonalds gofood grabfood shopeefood seblak martabak pecel rendang ikan seafood sushi ramen dimsum kebab geprek penyet nasgor rawon gado ketoprak bubur lontong tahu tempe telur sayur buah beras minyak gula garam bumbu air aqua galon minum minuman cokelat coklat donat cilok batagor siomay pempek cireng tekwan sop sup steak pasta salad katsu ricebowl dessert permen kerupuk keripik mixue starbucks janji kenangan fore chatime cafe kafe resto restoran warung kantin catering katering lauk',
  transport: 'gojek grab gocar goride grabcar grabbike maxim ojek ojol bensin pertamax pertalite solar shell parkir tol etoll taksi taxi bluebird angkot bus busway transjakarta mrt lrt krl kereta kai tiket pesawat travel damri bengkel servis oli ban motor mobil sim stnk',
  belanja: 'baju kaos celana jaket sepatu sandal tas dompet topi hijab skincare makeup kosmetik parfum sabun shampo sampo odol tisu deterjen shopee tokopedia lazada tiktokshop indomaret alfamart alfamidi supermarket minimarket belanja charger kabel casing headset earphone hp laptop mouse keyboard buku pulpen alat perabot kain bahan sablon aksesoris jam kacamata',
  tagihan: 'listrik pln token pdam wifi indihome internet kuota paket pulsa kos kost kontrakan sewa cicilan angsuran kredit pajak bpjs asuransi iuran langganan subscription tagihan pascabayar domain hosting icloud premium adobe capcut canva chatgpt claude',
  hiburan: 'nonton bioskop film cinema xxi cgv netflix spotify youtube disney vidio game steam topup diamond konser karaoke liburan wisata hotel staycation nongkrong hangout billiard bowling futsal badminton gym hobi mainan',
  kesehatan: 'obat apotek apotik dokter klinik puskesmas vitamin suplemen masker periksa checkup gigi kacamata terapi pijat urut lab vaksin',
};
const PHRASES = [
  ['es krim', 'food'], ['ice cream', 'food'], ['air mineral', 'food'], ['kopi kenangan', 'food'], ['nasi goreng', 'food'], ['mie ayam', 'food'],
  ['rumah sakit', 'kesehatan'], ['uang kos', 'tagihan'], ['bayar kos', 'tagihan'], ['top up', 'hiburan'], ['isi bensin', 'transport'],
];
const DICT = new Map();
for (const [cat, words] of Object.entries(DICT_SRC)) for (const w of words.split(' ')) if (!DICT.has(w)) DICT.set(w, cat);

const PREFIX = {
  saving: ['save', 'tabung', 'nabung', 'menabung', 'simpan', 'saving'],
  give:   ['give', 'send', 'kasih', 'ngasih', 'transfer', 'tf', 'kirim', 'beri'],
  income: ['salary', 'masuk', 'terima', 'dapat', 'dapet', 'pemasukan', 'income', 'gaji'],
};
const KEEP_AS_DESC = new Set(['gaji', 'salary']);

const LS_KEY = 'akade-finance-v1';
const RATE_KEY = 'akade-finance-rate';
const RATE_TTL = 15 * 1000;

/* ---------- Util ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ym = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const norm = s => String(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const fmtIDR = n => (n < 0 ? '−' : '') + 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');
const fmtUSDv = v => (v < 0 ? '−' : '') + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = n => {
  const a = Math.abs(n);
  if (a >= 1e6) return (a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.0', '').replace('.', ',') + ' jt';
  if (a >= 1e3) return Math.round(a / 1e3) + ' rb';
  return String(Math.round(a));
};
const monthName = (m, opt = { month: 'long', year: 'numeric' }) => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString('en-GB', opt);
};
const dayLabel = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
const shiftMonth = (m, by) => {
  const [y, mo] = m.split('-').map(Number);
  return ym(new Date(y, mo - 1 + by, 1));
};
const daysIn = m => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo, 0).getDate(); };

/* ---------- Parser input cepat ---------- */
function parseAmount(tok) {
  const s = String(tok).toLowerCase().replace(/^rp\.?/, '');
  const m = s.match(/^(\d+(?:[.,]\d+)*)(k|rb|ribu|jt|juta)?$/);
  if (!m) return null;
  const [, num, suf] = m;
  let val;
  if (!suf && /^\d{1,3}([.,]\d{3})+$/.test(num)) val = parseInt(num.replace(/[.,]/g, ''), 10);
  else if (suf && /^\d{1,3}(\.\d{3})+$/.test(num) === false) val = parseFloat(num.replace(',', '.'));
  else if (suf) val = parseInt(num.replace(/\./g, ''), 10);
  else if (/^\d+$/.test(num)) val = parseInt(num, 10);
  else val = parseFloat(num.replace(',', '.'));
  if (!isFinite(val)) return null;
  const mult = !suf ? 1 : (suf === 'jt' || suf === 'juta') ? 1e6 : 1e3;
  val = Math.round(val * mult);
  return val > 0 ? val : null;
}

function categorize(desc) {
  const n = norm(desc);
  if (!n) return 'lainnya';
  if (state.kw[n]) return state.kw[n].cat;
  const words = n.split(' ');
  for (const w of words) if (state.kw[w]) return state.kw[w].cat;
  for (const [p, c] of PHRASES) if (n.includes(p)) return c;
  for (const w of words) if (DICT.has(w)) return DICT.get(w);
  return 'lainnya';
}

function parseEntry(text) {
  const clean = String(text).trim().replace(/(\d)\s+(k|rb|ribu|jt|juta)\b/gi, '$1$2');
  if (!clean) return null;
  let toks = clean.split(/\s+/);
  let amt = null, idx = -1;
  for (let i = toks.length - 1; i >= 0; i--) {
    const a = parseAmount(toks[i]);
    if (a != null) { amt = a; idx = i; break; }
  }
  if (idx >= 0) toks.splice(idx, 1);
  let type = 'expense';
  const first = (toks[0] || '').toLowerCase();
  for (const [t, list] of Object.entries(PREFIX)) {
    if (list.includes(first)) {
      type = t;
      if (!KEEP_AS_DESC.has(first)) toks.shift();
      break;
    }
  }
  if ((type === 'saving' || type === 'give') && /^(ke|buat|untuk|kepada)$/i.test(toks[0] || '')) toks.shift();
  let desc = toks.join(' ').trim();
  let target = '';
  if (type === 'saving') { target = desc || 'Savings'; desc = target; }
  else if (type === 'give') { target = desc || 'No name'; desc = target; }
  else if (type === 'income') desc = desc || 'Income';
  else desc = desc || 'No note';
  const cat = type === 'expense' ? categorize(desc) : null;
  return { type, desc, amt, cat, target };
}

/* ---------- State ---------- */
const blank = () => ({ v: 1, tx: {}, months: {}, kw: {}, jobs: {}, del: {}, owner: null });
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (s && s.tx) return Object.assign(blank(), s);
  } catch (e) { /* abaikan */ }
  return blank();
}
let state = loadState();
let rate = (() => { try { return JSON.parse(localStorage.getItem(RATE_KEY) || 'null'); } catch (e) { return null; } })();
const ui = { view: 'ringkasan', month: ym(new Date()), filter: 'all', jobFilter: 'all', sel: new Set(), q: '', editStart: false, shown: null };

function saveLocal() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { toast('Storage browser penuh atau diblokir. Belum tersimpan.'); }
}
function commit() { saveLocal(); cloud.queue(); render(); }

const txList = () => Object.values(state.tx);
const txOfMonth = m => txList().filter(t => t.date.startsWith(m)).sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts);
const usdOf = t => { const r = t.rate || (rate && rate.v); return r ? t.amt / r : null; };
const toUSD = idr => (rate && rate.v) ? idr / rate.v : null;
const usdText = v => v == null ? '—' : fmtUSDv(v);

function stats(m) {
  const s = { expense: 0, saving: 0, give: 0, income: 0, usd: { expense: 0, saving: 0, give: 0, income: 0 }, cat: {}, day: {}, n: 0 };
  for (const t of txList()) {
    if (!t.date.startsWith(m)) continue;
    s.n++;
    s[t.type] += t.amt;
    s.usd[t.type] += usdOf(t) || 0;
    if (t.type === 'expense') {
      s.cat[t.cat] = (s.cat[t.cat] || 0) + t.amt;
      const d = Number(t.date.slice(8));
      s.day[d] = (s.day[d] || 0) + t.amt;
    }
  }
  s.start = state.months[m] ? state.months[m].start : null;
  s.out = s.expense + s.saving + s.give;
  s.remaining = (s.start || 0) + s.income - s.out;
  return s;
}

function addTx(p, when) {
  const now = new Date();
  let date = ymd(now);
  if (when && when !== ym(now)) date = `${when}-${pad(Math.min(now.getDate(), daysIn(when)))}`;
  const t = { id: uid(), type: p.type, desc: p.desc, amt: p.amt, cat: p.cat, target: p.target || '', rate: rate ? rate.v : null, date, ts: Date.now(), u: Date.now() };
  state.tx[t.id] = t;
  return t;
}
function removeTx(id) {
  const t = state.tx[id];
  if (!t) return null;
  delete state.tx[id];
  state.del[id] = Date.now();
  return t;
}
function learn(desc, cat) {
  const n = norm(desc), u = Date.now();
  if (!n) return;
  state.kw[n] = { cat, u };
  for (const w of n.split(' ')) if (w.length >= 3 && !/^\d+$/.test(w) && !DICT.has(w)) state.kw[w] = { cat, u };
}

/* ---------- Gabung data antar perangkat ---------- */
function merge(a, b) {
  const out = blank();
  out.owner = a.owner || b.owner || null;
  for (const src of [a.del || {}, b.del || {}]) for (const [id, ts] of Object.entries(src)) out.del[id] = Math.max(out.del[id] || 0, ts);
  for (const key of ['tx', 'months', 'kw', 'jobs']) {
    for (const src of [a[key] || {}, b[key] || {}]) {
      for (const [id, rec] of Object.entries(src)) {
        const cur = out[key][id];
        if (!cur || (rec.u || 0) > (cur.u || 0)) out[key][id] = rec;
      }
    }
  }
  for (const [id, ts] of Object.entries(out.del)) for (const k of ['tx', 'jobs']) if (out[k][id] && (out[k][id].u || 0) <= ts) delete out[k][id];
  return out;
}
const canon = o => Array.isArray(o) ? o.map(canon) : (o && typeof o === 'object') ? Object.keys(o).sort().reduce((r, k) => (r[k] = canon(o[k]), r), {}) : o;
const strip = s => ({ v: 1, tx: s.tx, months: s.months, kw: s.kw, jobs: s.jobs || {}, del: s.del });
const same = (a, b) => JSON.stringify(canon(strip(a))) === JSON.stringify(canon(strip(b)));

/* ---------- Kurs USD ---------- */
async function fetchRate(force) {
  if (!force && rate && Date.now() - rate.at < RATE_TTL) return;
  const sources = [
    async () => { const j = await (await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD', { cache: 'no-store' })).json(); return j.data.rates.IDR; },
    async () => { const j = await (await fetch('https://open.er-api.com/v6/latest/USD')).json(); return j.rates.IDR; },
    async () => { const j = await (await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=IDR')).json(); return j.rates.IDR; },
  ];
  for (const src of sources) {
    try {
      const v = Number(await src());
      if (v > 1000) {
        const changed = !rate || Math.round(rate.v) !== Math.round(v);
        rate = { v, at: Date.now() };
        localStorage.setItem(RATE_KEY, JSON.stringify(rate));
        let filled = false;
        for (const t of txList()) if (!t.rate) { t.rate = v; t.u = Date.now(); filled = true; }
        if (filled) { saveLocal(); cloud.queue(); }
        softRender(changed);
        return true;
      }
    } catch (e) { /* coba sumber berikutnya */ }
  }
  softRender(false);
  return false;
}
function isEditing() {
  const a = document.activeElement;
  if (a && a.matches('input, select, textarea') && a.closest('#view')) return true;
  if (document.querySelector('dialog[open]') || ui.sel.size) return true;
  return [...document.querySelectorAll('#jobForm input, #startInput')].some(i => i.value && i.id !== 'startInput');
}
function softRender(changed) {
  if ($('#app').hidden) return;
  if (changed && !isEditing()) render(); else renderRate();
  if (changed) for (const el of [$('#ratePill'), $('#rateBlock')]) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
}
const rateAge = () => {
  if (!rate) return '';
  const min = Math.round((Date.now() - rate.at) / 60000);
  const sec = Math.round((Date.now() - rate.at) / 1000);
  if (sec < 10) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

/* ---------- Sinkron (Supabase) ---------- */
const cfg = window.AKADE_CONFIG || {};
const cloud = {
  enabled: !!(cfg.supabaseUrl && cfg.supabaseKey),
  client: null, user: null, status: 'local', timer: null, busy: false, dirty: false,
  async init() {
    if (!this.enabled) return;
    try {
      if (!window.supabase) await new Promise((ok, no) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        s.onload = ok; s.onerror = no; document.head.appendChild(s);
      });
      this.client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
      const { data } = await this.client.auth.getSession();
      this.user = data && data.session ? data.session.user : null;
    } catch (e) {
      // Tanpa internet: kalau perangkat ini sudah pernah login, tetap buka data lokal.
      this.status = 'offline';
      if (state.owner) { showApp(); return; }
      $('#gateMsg').textContent = 'Nggak bisa connect ke server. Cek internet lalu reload.';
    }
    if (this.user) { this.adopt(); showApp(); this.sync(); } else showGate();
  },
  adopt() {
    if (state.owner && state.owner !== this.user.id) state = blank();
    state.owner = this.user.id;
    saveLocal();
  },
  queue() {
    if (!this.user) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.sync(), 1200);
  },
  async sync() {
    if (!this.user || !this.client) return;
    if (this.busy) { this.dirty = true; return; }
    this.busy = true; this.setStatus('syncing');
    try {
      const { data, error } = await this.client.from('finance_data').select('data').eq('user_id', this.user.id).maybeSingle();
      if (error) throw error;
      const remote = data && data.data ? data.data : null;
      const merged = remote ? merge(state, remote) : state;
      const localChanged = !same(merged, state);
      merged.owner = this.user.id;
      state = merged;
      saveLocal();
      if (localChanged) render();
      if (!remote || !same(merged, remote)) {
        const res = await this.client.from('finance_data').upsert({ user_id: this.user.id, data: strip(merged), updated_at: new Date().toISOString() });
        if (res.error) throw res.error;
      }
      this.setStatus('synced');
    } catch (e) {
      console.warn('Sinkron gagal:', e && e.message ? e.message : e);
      this.setStatus('offline');
    }
    this.busy = false;
    if (this.dirty) { this.dirty = false; this.queue(); }
  },
  setStatus(s) { this.status = s; renderSync(); },
  async signOut() {
    try { await this.client.auth.signOut(); } catch (e) { /* tetap keluar secara lokal */ }
    this.user = null;
    state = blank(); saveLocal();
    location.reload();
  },
};

function showApp() { $('#gate').hidden = true; $('#app').hidden = false; render(); fetchRate(); }
function showGate() { $('#app').hidden = true; $('#gate').hidden = false; }

/* ---------- Render ---------- */
const icon = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const I = {
  prev: '<path d="M15 6l-6 6 6 6"/>', next: '<path d="M9 6l6 6-6 6"/>',
  edit: '<path d="M4 20h4l10-10-4-4L4 16zM13.5 6.5l4 4"/>', trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
};

function renderNav() {
  const btn = (v, short) => `<button type="button" data-view="${v.id}" class="${ui.view === v.id ? 'is-on' : ''}" ${ui.view === v.id ? 'aria-current="page"' : ''}>${icon(v.icon)}<span>${esc(short && v.short ? v.short : v.name)}</span></button>`;
  for (const [sel, short] of [['#railNav', false], ['#tabbar', true]]) {
    const el = $(sel);
    if (!el.children.length) el.innerHTML = VIEWS.map(v => btn(v, short)).join('');
    else for (const b of el.children) { const on = b.dataset.view === ui.view; b.classList.toggle('is-on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
  }
}

function renderMonthNav() {
  const now = ym(new Date());
  const isNow = ui.month === now;
  $('#monthNav').innerHTML = `
    <button class="icon-btn" type="button" data-act="month-prev" aria-label="Previous month">${icon(I.prev)}</button>
    <div class="month-label"><strong>${esc(monthName(ui.month))}</strong>${isNow ? '' : `<button class="text-btn" type="button" data-act="month-now">Back to this month</button>`}</div>
    <button class="icon-btn" type="button" data-act="month-next" aria-label="Next month" ${ui.month >= now ? 'disabled' : ''}>${icon(I.next)}</button>`;
}

function renderRate() {
  const txt = rate ? `$1 = ${fmtIDR(rate.v)}` : 'Rate belum ada';
  $('#ratePill').innerHTML = `<span class="dot ${rate ? 'live' : 'dot--off'}"></span><span class="num">${esc(txt)}</span>${rate ? '<span class="live-tag">Live</span>' : ''}`;
  $('#rateBlock').innerHTML = `<span class="rate-k">USD rate</span><span class="rate-v num">${rate ? fmtIDR(rate.v) : '—'}</span><span class="rate-t">${rate ? 'Live, updated ' + rateAge() : 'Nunggu koneksi internet'}</span>`;
}

function renderSync() {
  const map = {
    local: ['Saved on this device only', ''],
    syncing: ['Syncing…', 'is-busy'],
    synced: ['Synced di semua device', 'is-ok'],
    offline: ['Offline. Changes aman di device ini.', 'is-warn'],
  };
  const [text, cls] = map[cloud.status] || map.local;
  const el = $('#syncRail');
  if (el) el.innerHTML = `<span class="dot ${cls}"></span><span>${esc(text)}</span>`;
}

function render() {
  if ($('#app').hidden) return;
  renderNav(); renderMonthNav(); renderRate(); renderSync();
  const v = $('#view');
  const fn = { ringkasan: viewRingkasan, transaksi: viewTransaksi, tabungan: viewTabungan, riwayat: viewRiwayat, project: viewProject }[ui.view];
  v.dataset.screen = ui.view;
  v.innerHTML = fn();
  v.style.setProperty('--t', `-${(performance.now() / 1000).toFixed(2)}s`);
  const rail = $('.sword');
  if (rail && rail.dataset.v !== ui.view) {
    rail.dataset.v = ui.view;
    rail.innerHTML = ui.view === 'ringkasan' || !ORN[ui.view] ? SWORD : ORN[ui.view].replace(/(#|id=")(m[A-D]g?)/g, '$1$2r');
  }
  const h1 = v.querySelector('.view-head h1');
  if (h1 && ORN[ui.view]) h1.insertAdjacentHTML('beforeend', ORN[ui.view]);
  afterRender();
}

/* ----- Ringkasan ----- */
function guilloche() {
  // Perisai berukir, helm Yunani kuno tampak samping, dan jubah yang tertiup angin. Semuanya garis kontur.
  let rings = '', ticks = '';
  for (const r of [58, 63, 108, 150, 155, 196]) rings += `<circle cx="200" cy="200" r="${r}"/>`;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2, c = Math.cos(a), n = Math.sin(a);
    ticks += `<line x1="${(200 + 114 * c).toFixed(1)}" y1="${(200 + 114 * n).toFixed(1)}" x2="${(200 + 144 * c).toFixed(1)}" y2="${(200 + 144 * n).toFixed(1)}"/>`;
  }
  const bez = (p, t) => { const u = 1 - t; return [0, 1].map(k => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]); };
  const base = [[80, 70], [104, 38], [180, 46], [189, 124]], outer = [[50, 66], [68, -62], [268, -38], [226, 152]];
  let hair = '';
  for (let i = 0; i <= 54; i++) {
    const t = i / 54, k = 0.9 + 0.1 * Math.sin(i * 2.3), a = bez(base, t), o = bez(outer, Math.min(1, t * 0.97 + 0.015));
    const b = [a[0] + (o[0] - a[0]) * k, a[1] + (o[1] - a[1]) * k];
    hair += `<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${((a[0] + b[0]) / 2 + 4).toFixed(1)} ${((a[1] + b[1]) / 2 - 3).toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}"/>`;
  }
  let cape = '';
  for (let i = 0; i < 9; i++) {
    cape += `<path class="${i === 8 ? 'cape-hem' : ''}" style="animation-delay:calc(var(--t, 0s) - ${i * 0.55}s)" d="M${238 + i * 1.5} ${246 + i * 6}C${286 + i * 3} ${226 + i * 15} ${330 + i * 2} ${306 + i * 7} ${410} ${252 + i * 17}"/>`;
  }
  const helm = `<g class="cape">${cape}</g>
    <g transform="translate(102 96) scale(.72)">
      <g class="hl-crest">${hair}</g>
      <path class="hl-wire" d="M80 70C104 38 180 46 189 124"/>
      <path class="hl-body" d="M58 130C56 84 92 54 132 58C170 62 188 96 186 136V180C186 194 191 205 197 214L152 220C142 220 136 214 134 204L130 242C114 256 92 252 76 234L70 220C74 206 74 192 68 182C78 180 88 176 96 168C88 154 72 150 60 160L54 190L45 191L50 148Z"/>
      <path class="hl-band" d="M84 72C108 46 174 54 185 122"/>
      <g class="hl-wire">
        <path d="M58 130C92 121 150 125 186 136"/><path d="M57 140C92 131 150 135 186 146"/>
        <path d="M100 66C92 86 88 106 88 126"/><path d="M124 58C120 82 120 104 122 126"/><path d="M150 63C154 86 156 108 156 129"/><path d="M172 81C176 98 178 116 178 134"/>
        <path d="M96 168C104 188 118 204 134 204"/><path d="M84 190C96 208 112 222 131 226"/><path d="M74 214C88 232 108 242 130 242"/>
        <path d="M186 160C176 178 164 196 152 220"/><path d="M186 180C180 192 172 206 168 218"/>
        <path d="M54 190C58 176 60 168 60 160"/><path d="M110 146C120 160 128 178 134 204"/><path d="M140 146C144 166 142 186 134 204"/>
      </g>
    </g>`;
  return `<svg class="shield" viewBox="0 0 400 400" aria-hidden="true"><g class="sh-ring">${rings}</g><circle class="sh-orbit" cx="200" cy="200" r="174"/><circle class="sh-orbit sh-orbit2" cx="200" cy="200" r="86"/><g class="sh-tick sh-spin">${ticks}</g><g class="sh-sweep"><path class="sh-rim" d="M61.4 61.4A196 196 0 0 1 200 4"/><path class="sh-rim" d="M93.9 93.9A150 150 0 0 1 200 50" opacity=".5"/><circle class="sh-dot" cx="200" cy="4" r="2.6"/></g>${helm}</svg>`;
}
const METAL = id => `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#07080a"/><stop offset=".62" stop-color="#4e5964"/><stop offset="1" stop-color="#161a1f"/></linearGradient><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ecd08c"/><stop offset="1" stop-color="#8e6a2c"/></linearGradient></defs>`;
const BLADE = 'M29.2 8 31 5.5C62 4.9 100 3.1 132 4.3L158.5 8 132 11.7C100 12.9 62 11.1 31 10.5Z';
const SWORD = `<svg viewBox="0 0 160 16" aria-hidden="true">${METAL('mS')}<clipPath id="swc"><path d="${BLADE}"/></clipPath>
  <g fill="url(#mS)" stroke="#c9a45c" stroke-width=".8" stroke-linejoin="round"><circle cx="5" cy="8" r="3.1"/><rect x="8.2" y="6.3" width="17.6" height="3.4" rx="1"/><rect x="25.8" y="1.6" width="3.2" height="12.8" rx="1.3"/>
  <g class="o-blade"><path d="${BLADE}"/><path d="M33 8H148" stroke-opacity=".45" stroke-width=".5" fill="none"/></g></g>
  <rect class="o-glint" clip-path="url(#swc)" x="-24" y="0" width="16" height="16" fill="#fff" opacity=".6" transform="skewX(-24)"/></svg>`;
const ORN = {
  transaksi: `<svg class="orn" viewBox="0 0 190 30" aria-hidden="true">${METAL('mA')}
    <path d="M22 2.5C40 8 40 22 22 27.5" fill="none" stroke="#c9a45c" stroke-width="2.2" stroke-linecap="round"/><path d="M22 2.5C40 8 40 22 22 27.5" fill="none" stroke="#1a1f24" stroke-width="1"/>
    <path class="o-string" d="M22 2.5L8 15L22 27.5" fill="none" stroke="#b4cbda" stroke-width=".9" vector-effect="non-scaling-stroke"/>
    <g class="o-arrow" fill="url(#mA)" stroke="#c9a45c" stroke-width=".8" stroke-linejoin="round"><path d="M8 15l5-4.4h9l-5 4.4z"/><path d="M8 15l5 4.4h9l-5-4.4z"/><rect x="8" y="14.3" width="142" height="1.4" rx=".7"/><path d="M148 15l9-4.6 12 4.6-12 4.6z"/></g></svg>`,
  tabungan: `<svg class="orn" viewBox="0 0 190 30" aria-hidden="true">${METAL('mB')}
    <g class="o-shield" fill="url(#mB)" stroke="#c9a45c" stroke-width=".9"><circle cx="15" cy="15" r="13"/><circle cx="15" cy="15" r="8.6" fill="none" stroke-opacity=".7"/><circle cx="15" cy="15" r="3"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle cx="${(15 + 10.8 * Math.cos(i * Math.PI / 4)).toFixed(1)}" cy="${(15 + 10.8 * Math.sin(i * Math.PI / 4)).toFixed(1)}" r=".7" fill="#c9a45c" stroke="none"/>`).join('')}</g>
    <g class="o-line" stroke="#c9a45c" stroke-width=".8" fill="url(#mB)"><path d="M34 15H160" stroke-opacity=".6"/><path d="M160 15l5-3 5 3-5 3z"/></g></svg>`,
  riwayat: `<svg class="orn" viewBox="0 0 190 30" aria-hidden="true">${METAL('mC')}
    <g fill="url(#mC)" stroke="#c9a45c" stroke-width=".9"><g class="o-paper"><rect x="14" y="6" width="124" height="18" rx="1.5"/><path d="M26 12H124M26 18H104" fill="none" stroke-opacity=".4" stroke-width=".7"/></g>
    <g><ellipse cx="12" cy="15" rx="5.4" ry="12"/><ellipse cx="12" cy="15" rx="2" ry="5" fill="none" stroke-opacity=".7"/></g>
    <g class="o-roll"><ellipse cx="140" cy="15" rx="5.4" ry="12"/><ellipse cx="140" cy="15" rx="2" ry="5" fill="none" stroke-opacity=".7"/></g></g></svg>`,
  project: `<svg class="orn orn--x" viewBox="0 0 130 46" aria-hidden="true">${METAL('mD')}
    <g fill="url(#mD)" stroke="#c9a45c" stroke-width="1.05" stroke-linejoin="round">
      <g class="o-sw o-sw1"><g transform="translate(5.8 17.1) scale(.74)"><circle cx="5" cy="8" r="3.1"/><rect x="8.2" y="6.3" width="17.6" height="3.4" rx="1"/><rect x="25.8" y="1.6" width="3.2" height="12.8" rx="1.3"/><path d="${BLADE}"/><path d="M33 8H148" stroke-opacity=".45" stroke-width=".5" fill="none"/></g></g>
      <g class="o-sw o-sw2"><g transform="translate(130 0) scale(-1 1)"><g transform="translate(5.8 17.1) scale(.74)"><circle cx="5" cy="8" r="3.1"/><rect x="8.2" y="6.3" width="17.6" height="3.4" rx="1"/><rect x="25.8" y="1.6" width="3.2" height="12.8" rx="1.3"/><path d="${BLADE}"/><path d="M33 8H148" stroke-opacity=".45" stroke-width=".5" fill="none"/></g></g></g>
    </g><circle class="o-spark" cx="65" cy="23" r="2.2" fill="#fff3cf"/></svg>`,
};
const HORSE = `<svg class="horse" viewBox="-4 -4 344 408" aria-hidden="true"><defs><clipPath id="hzc"><path d="M46.6 7.0C45.8 7.6 46.9 11.0 47.6 13.6C48.3 16.3 50.5 19.7 50.7 22.7C50.9 25.7 50.0 28.7 48.8 31.7C47.5 34.7 44.7 37.7 43.2 40.7C41.7 43.7 40.7 46.8 39.7 49.8C38.8 52.8 38.3 55.9 37.6 58.9C36.9 61.9 36.0 65.0 35.3 68.0C34.6 71.0 33.9 74.0 33.2 77.1C32.5 80.1 31.8 83.1 31.3 86.2C30.8 89.2 29.8 92.2 30.2 95.3C30.7 98.3 32.1 101.9 34.0 104.4C35.9 106.8 38.9 109.0 41.7 109.9C44.5 110.9 48.0 110.7 50.7 110.1C53.5 109.5 56.8 108.4 58.3 106.5C59.8 104.5 59.1 101.0 59.8 98.2C60.5 95.5 60.9 92.6 62.4 89.9C64.0 87.2 66.6 84.1 69.1 81.9C71.6 79.8 74.9 77.7 77.5 77.1C80.1 76.5 83.1 76.6 84.5 78.2C85.9 79.8 86.1 83.9 86.0 86.9C85.9 89.9 84.9 93.0 83.8 96.0C82.7 99.0 80.9 101.9 79.3 104.9C77.6 107.8 75.8 110.8 74.1 113.7C72.3 116.6 70.5 119.7 68.8 122.4C67.0 125.1 65.1 127.2 63.7 129.9C62.2 132.6 61.3 135.6 60.2 138.6C59.0 141.5 57.9 144.7 56.9 147.6C55.9 150.6 54.9 153.6 54.1 156.6C53.3 159.5 52.7 162.5 52.1 165.5C51.6 168.5 51.0 171.5 50.7 174.5C50.5 177.5 51.1 181.1 50.7 183.6C50.3 186.1 50.2 189.2 48.4 189.8C46.7 190.4 42.8 188.4 40.0 187.1C37.2 185.9 34.4 183.4 31.5 182.2C28.6 181.1 25.7 179.9 22.8 180.3C19.9 180.8 16.4 183.1 13.9 185.1C11.4 187.0 9.0 189.5 7.6 192.1C6.3 194.7 6.1 197.8 5.9 200.5C5.8 203.3 6.4 205.9 6.8 208.8C7.3 211.7 8.0 214.8 8.5 217.8C9.0 220.9 9.4 223.9 9.7 226.9C10.0 230.0 10.0 233.0 10.2 236.0C10.4 239.1 9.9 242.1 10.6 245.1C11.2 248.1 12.4 251.2 14.1 254.1C15.8 257.0 18.8 259.7 21.0 262.6C23.1 265.5 24.6 268.8 26.8 271.6C29.0 274.4 31.7 278.7 34.0 279.4C36.4 280.1 39.0 277.9 41.0 275.8C43.1 273.6 44.7 269.7 46.2 266.7C47.8 263.6 50.0 260.3 50.3 257.6C50.7 254.8 50.1 252.2 48.4 250.3C46.6 248.3 42.5 247.2 39.9 245.8C37.2 244.3 34.4 243.5 32.6 241.4C30.8 239.3 29.7 235.8 29.0 232.9C28.3 230.0 28.4 226.9 28.3 223.8C28.3 220.8 28.0 216.8 28.8 214.7C29.6 212.6 30.8 210.6 33.0 211.3C35.1 212.0 38.8 216.4 41.7 219.0C44.6 221.6 47.6 224.5 50.5 227.1C53.4 229.6 56.2 232.2 59.2 234.1C62.1 236.0 65.0 237.7 68.0 238.4C70.9 239.1 74.6 237.5 76.9 238.3C79.3 239.2 80.8 241.1 82.1 243.4C83.3 245.8 83.7 249.5 84.5 252.5C85.2 255.6 86.0 258.6 86.5 261.6C87.1 264.7 87.6 267.7 88.0 270.7C88.4 273.8 88.6 276.8 88.8 279.8C88.9 282.9 88.6 285.9 88.7 288.9C88.9 292.0 89.5 295.0 89.9 298.0C90.3 301.1 90.9 304.1 91.2 307.1C91.4 310.2 91.5 313.2 91.6 316.2C91.6 319.2 91.6 322.3 91.5 325.3C91.4 328.3 91.3 331.4 90.8 334.4C90.2 337.4 89.2 340.5 88.3 343.5C87.4 346.5 86.8 349.6 85.2 352.6C83.6 355.6 80.8 358.5 78.7 361.5C76.6 364.5 74.3 367.4 72.4 370.4C70.5 373.4 68.1 376.7 67.3 379.4C66.4 382.2 66.0 385.2 67.4 386.8C68.9 388.4 73.0 388.6 75.9 389.0C78.8 389.4 81.9 389.4 85.0 389.5C88.0 389.5 91.1 389.4 94.1 389.1C97.1 388.8 100.9 388.6 103.0 387.6C105.1 386.7 106.3 385.2 106.7 383.4C107.1 381.5 105.7 379.2 105.5 376.5C105.3 373.9 104.9 370.3 105.5 367.5C106.0 364.7 107.4 361.9 108.8 359.6C110.2 357.3 113.3 356.2 114.1 353.8C114.9 351.4 113.8 347.9 113.6 344.9C113.3 341.9 112.7 338.9 112.5 335.8C112.3 332.8 112.3 329.8 112.4 326.8C112.4 323.7 112.6 320.7 112.8 317.7C112.9 314.6 113.0 311.6 113.3 308.6C113.6 305.5 114.1 302.5 114.5 299.5C114.9 296.4 115.6 293.4 115.7 290.4C115.8 287.3 115.2 284.3 115.0 281.3C114.9 278.2 114.9 275.2 114.9 272.2C115.0 269.1 115.4 266.1 115.6 263.1C115.9 260.0 115.9 256.7 116.4 254.0C116.9 251.3 117.1 247.8 118.7 246.8C120.4 245.9 123.7 247.7 126.5 248.4C129.3 249.2 132.5 250.5 135.4 251.4C138.4 252.3 141.3 253.1 144.3 253.8C147.3 254.5 150.4 255.1 153.4 255.7C156.5 256.3 159.5 257.1 162.5 257.4C165.6 257.7 168.6 257.4 171.6 257.3C174.7 257.3 177.7 257.4 180.7 257.2C183.8 257.1 186.8 256.8 189.8 256.4C192.9 256.1 195.9 255.6 198.9 255.1C202.0 254.7 205.2 253.6 208.0 253.7C210.8 253.8 213.7 254.1 215.8 255.8C218.0 257.6 219.1 261.3 221.1 264.1C223.1 266.9 225.5 270.0 227.7 272.8C230.0 275.6 232.1 278.0 234.6 280.8C237.0 283.6 240.2 286.5 242.5 289.4C244.7 292.4 246.8 295.5 247.9 298.5C249.0 301.5 249.2 304.6 249.1 307.6C249.0 310.6 248.2 313.7 247.4 316.7C246.6 319.7 245.6 322.8 244.4 325.8C243.1 328.8 241.5 331.6 239.8 334.5C238.2 337.5 236.2 340.3 234.4 343.3C232.6 346.2 231.0 349.3 228.8 352.3C226.6 355.2 223.6 358.1 221.3 361.1C219.0 364.1 216.6 367.3 215.1 370.1C213.6 372.9 211.7 376.2 212.5 377.9C213.2 379.6 216.8 379.8 219.5 380.3C222.2 380.8 225.6 380.9 228.6 381.0C231.6 381.1 234.8 381.2 237.7 381.0C240.6 380.7 244.3 380.7 246.0 379.3C247.6 378.0 247.2 375.3 247.7 372.7C248.1 370.2 247.7 366.4 248.7 363.8C249.7 361.3 252.2 359.5 253.8 357.4C255.3 355.2 256.9 353.5 257.9 350.9C258.9 348.4 258.8 345.0 259.7 342.0C260.6 339.0 262.0 336.0 263.3 333.0C264.7 330.0 266.3 326.9 267.8 323.9C269.3 320.9 270.6 317.8 272.2 314.9C273.8 312.0 276.2 309.3 277.4 306.5C278.6 303.7 278.3 299.3 279.5 298.0C280.7 296.7 282.8 297.2 284.7 298.8C286.6 300.3 289.1 304.4 290.8 307.3C292.4 310.2 293.7 313.2 294.6 316.2C295.6 319.2 296.0 322.3 296.5 325.3C296.9 328.3 297.4 331.4 297.5 334.4C297.6 337.4 297.6 340.5 297.3 343.5C297.0 346.5 296.5 349.6 295.8 352.6C295.0 355.6 294.3 358.7 292.8 361.7C291.3 364.7 288.7 367.7 286.8 370.7C284.9 373.7 283.2 376.7 281.6 379.7C280.1 382.6 277.4 386.2 277.4 388.4C277.4 390.6 279.3 391.9 281.5 392.9C283.7 393.9 287.6 393.9 290.6 394.2C293.6 394.6 296.7 394.7 299.7 394.8C302.7 394.8 306.1 395.0 308.8 394.4C311.5 393.8 314.8 393.1 316.1 391.2C317.4 389.3 316.7 385.7 316.6 382.8C316.5 379.9 315.5 376.6 315.7 373.8C315.8 371.0 316.4 368.3 317.5 366.0C318.6 363.6 321.6 362.2 322.2 359.7C322.8 357.2 321.5 353.9 321.0 350.9C320.5 348.0 319.7 344.9 319.2 341.9C318.7 339.0 318.4 336.0 318.2 333.0C318.0 330.0 317.5 326.5 317.9 323.9C318.3 321.2 318.8 318.7 320.5 317.1C322.3 315.5 326.7 316.1 328.3 314.4C330.0 312.6 330.0 309.4 330.3 306.6C330.6 303.8 330.1 300.6 330.0 297.5C330.0 294.5 329.9 291.5 329.9 288.5C329.8 285.4 329.8 282.4 329.7 279.4C329.6 276.3 329.5 273.3 329.5 270.3C329.4 267.2 329.4 264.2 329.4 261.2C329.4 258.1 329.3 255.1 329.2 252.1C329.2 249.0 329.1 246.0 329.0 243.0C328.9 239.9 328.7 236.9 328.4 233.9C328.0 230.8 327.6 227.8 327.0 224.8C326.4 221.7 325.7 218.7 324.7 215.7C323.7 212.6 322.5 209.6 321.0 206.6C319.6 203.6 317.8 200.4 316.0 197.5C314.1 194.5 312.1 191.4 309.7 188.9C307.4 186.5 304.6 184.4 301.8 182.8C299.0 181.1 295.7 180.6 292.8 179.1C289.9 177.7 287.1 175.8 284.3 174.2C281.5 172.6 278.9 170.8 276.1 169.5C273.2 168.2 270.1 167.1 267.1 166.2C264.1 165.4 261.1 164.8 258.0 164.3C255.0 163.7 252.0 163.3 249.0 163.0C245.9 162.7 242.9 162.4 239.9 162.2C236.8 161.9 233.8 161.7 230.8 161.6C227.7 161.5 224.7 161.6 221.7 161.6C218.6 161.5 215.6 161.5 212.6 161.4C209.5 161.2 206.5 161.1 203.5 160.8C200.4 160.5 197.4 160.2 194.4 159.4C191.4 158.6 188.5 157.4 185.6 156.1C182.7 154.8 179.6 153.7 176.9 151.8C174.3 150.0 172.0 147.4 169.8 144.9C167.7 142.4 165.5 139.4 164.0 136.7C162.6 134.1 161.7 131.8 161.0 129.0C160.4 126.3 160.6 123.2 160.3 120.2C159.9 117.3 159.2 114.5 158.9 111.5C158.7 108.6 159.1 105.5 158.9 102.7C158.6 99.9 158.0 97.4 157.5 94.6C157.1 91.8 156.9 88.6 156.2 85.8C155.6 82.9 154.7 80.4 153.8 77.5C152.8 74.7 151.6 71.7 150.5 68.7C149.4 65.7 148.7 62.6 147.3 59.8C145.8 57.0 143.7 54.6 141.8 51.9C139.8 49.2 137.8 46.1 135.7 43.6C133.6 41.0 131.7 38.7 129.3 36.6C126.9 34.5 123.9 32.8 121.1 30.9C118.4 29.1 115.6 27.0 112.8 25.5C110.1 24.1 107.5 23.2 104.6 22.3C101.8 21.3 98.7 20.5 95.8 19.8C92.8 19.1 89.9 18.2 87.0 18.0C84.0 17.8 81.0 18.2 78.0 18.5C75.0 18.7 71.9 19.6 68.9 19.5C66.0 19.4 63.2 19.3 60.5 17.8C57.7 16.2 54.8 12.0 52.5 10.2C50.2 8.4 47.4 6.4 46.6 7.0Z"/></clipPath></defs>
  <path class="hz-line" pathLength="1" d="M46.6 7.0C45.8 7.6 46.9 11.0 47.6 13.6C48.3 16.3 50.5 19.7 50.7 22.7C50.9 25.7 50.0 28.7 48.8 31.7C47.5 34.7 44.7 37.7 43.2 40.7C41.7 43.7 40.7 46.8 39.7 49.8C38.8 52.8 38.3 55.9 37.6 58.9C36.9 61.9 36.0 65.0 35.3 68.0C34.6 71.0 33.9 74.0 33.2 77.1C32.5 80.1 31.8 83.1 31.3 86.2C30.8 89.2 29.8 92.2 30.2 95.3C30.7 98.3 32.1 101.9 34.0 104.4C35.9 106.8 38.9 109.0 41.7 109.9C44.5 110.9 48.0 110.7 50.7 110.1C53.5 109.5 56.8 108.4 58.3 106.5C59.8 104.5 59.1 101.0 59.8 98.2C60.5 95.5 60.9 92.6 62.4 89.9C64.0 87.2 66.6 84.1 69.1 81.9C71.6 79.8 74.9 77.7 77.5 77.1C80.1 76.5 83.1 76.6 84.5 78.2C85.9 79.8 86.1 83.9 86.0 86.9C85.9 89.9 84.9 93.0 83.8 96.0C82.7 99.0 80.9 101.9 79.3 104.9C77.6 107.8 75.8 110.8 74.1 113.7C72.3 116.6 70.5 119.7 68.8 122.4C67.0 125.1 65.1 127.2 63.7 129.9C62.2 132.6 61.3 135.6 60.2 138.6C59.0 141.5 57.9 144.7 56.9 147.6C55.9 150.6 54.9 153.6 54.1 156.6C53.3 159.5 52.7 162.5 52.1 165.5C51.6 168.5 51.0 171.5 50.7 174.5C50.5 177.5 51.1 181.1 50.7 183.6C50.3 186.1 50.2 189.2 48.4 189.8C46.7 190.4 42.8 188.4 40.0 187.1C37.2 185.9 34.4 183.4 31.5 182.2C28.6 181.1 25.7 179.9 22.8 180.3C19.9 180.8 16.4 183.1 13.9 185.1C11.4 187.0 9.0 189.5 7.6 192.1C6.3 194.7 6.1 197.8 5.9 200.5C5.8 203.3 6.4 205.9 6.8 208.8C7.3 211.7 8.0 214.8 8.5 217.8C9.0 220.9 9.4 223.9 9.7 226.9C10.0 230.0 10.0 233.0 10.2 236.0C10.4 239.1 9.9 242.1 10.6 245.1C11.2 248.1 12.4 251.2 14.1 254.1C15.8 257.0 18.8 259.7 21.0 262.6C23.1 265.5 24.6 268.8 26.8 271.6C29.0 274.4 31.7 278.7 34.0 279.4C36.4 280.1 39.0 277.9 41.0 275.8C43.1 273.6 44.7 269.7 46.2 266.7C47.8 263.6 50.0 260.3 50.3 257.6C50.7 254.8 50.1 252.2 48.4 250.3C46.6 248.3 42.5 247.2 39.9 245.8C37.2 244.3 34.4 243.5 32.6 241.4C30.8 239.3 29.7 235.8 29.0 232.9C28.3 230.0 28.4 226.9 28.3 223.8C28.3 220.8 28.0 216.8 28.8 214.7C29.6 212.6 30.8 210.6 33.0 211.3C35.1 212.0 38.8 216.4 41.7 219.0C44.6 221.6 47.6 224.5 50.5 227.1C53.4 229.6 56.2 232.2 59.2 234.1C62.1 236.0 65.0 237.7 68.0 238.4C70.9 239.1 74.6 237.5 76.9 238.3C79.3 239.2 80.8 241.1 82.1 243.4C83.3 245.8 83.7 249.5 84.5 252.5C85.2 255.6 86.0 258.6 86.5 261.6C87.1 264.7 87.6 267.7 88.0 270.7C88.4 273.8 88.6 276.8 88.8 279.8C88.9 282.9 88.6 285.9 88.7 288.9C88.9 292.0 89.5 295.0 89.9 298.0C90.3 301.1 90.9 304.1 91.2 307.1C91.4 310.2 91.5 313.2 91.6 316.2C91.6 319.2 91.6 322.3 91.5 325.3C91.4 328.3 91.3 331.4 90.8 334.4C90.2 337.4 89.2 340.5 88.3 343.5C87.4 346.5 86.8 349.6 85.2 352.6C83.6 355.6 80.8 358.5 78.7 361.5C76.6 364.5 74.3 367.4 72.4 370.4C70.5 373.4 68.1 376.7 67.3 379.4C66.4 382.2 66.0 385.2 67.4 386.8C68.9 388.4 73.0 388.6 75.9 389.0C78.8 389.4 81.9 389.4 85.0 389.5C88.0 389.5 91.1 389.4 94.1 389.1C97.1 388.8 100.9 388.6 103.0 387.6C105.1 386.7 106.3 385.2 106.7 383.4C107.1 381.5 105.7 379.2 105.5 376.5C105.3 373.9 104.9 370.3 105.5 367.5C106.0 364.7 107.4 361.9 108.8 359.6C110.2 357.3 113.3 356.2 114.1 353.8C114.9 351.4 113.8 347.9 113.6 344.9C113.3 341.9 112.7 338.9 112.5 335.8C112.3 332.8 112.3 329.8 112.4 326.8C112.4 323.7 112.6 320.7 112.8 317.7C112.9 314.6 113.0 311.6 113.3 308.6C113.6 305.5 114.1 302.5 114.5 299.5C114.9 296.4 115.6 293.4 115.7 290.4C115.8 287.3 115.2 284.3 115.0 281.3C114.9 278.2 114.9 275.2 114.9 272.2C115.0 269.1 115.4 266.1 115.6 263.1C115.9 260.0 115.9 256.7 116.4 254.0C116.9 251.3 117.1 247.8 118.7 246.8C120.4 245.9 123.7 247.7 126.5 248.4C129.3 249.2 132.5 250.5 135.4 251.4C138.4 252.3 141.3 253.1 144.3 253.8C147.3 254.5 150.4 255.1 153.4 255.7C156.5 256.3 159.5 257.1 162.5 257.4C165.6 257.7 168.6 257.4 171.6 257.3C174.7 257.3 177.7 257.4 180.7 257.2C183.8 257.1 186.8 256.8 189.8 256.4C192.9 256.1 195.9 255.6 198.9 255.1C202.0 254.7 205.2 253.6 208.0 253.7C210.8 253.8 213.7 254.1 215.8 255.8C218.0 257.6 219.1 261.3 221.1 264.1C223.1 266.9 225.5 270.0 227.7 272.8C230.0 275.6 232.1 278.0 234.6 280.8C237.0 283.6 240.2 286.5 242.5 289.4C244.7 292.4 246.8 295.5 247.9 298.5C249.0 301.5 249.2 304.6 249.1 307.6C249.0 310.6 248.2 313.7 247.4 316.7C246.6 319.7 245.6 322.8 244.4 325.8C243.1 328.8 241.5 331.6 239.8 334.5C238.2 337.5 236.2 340.3 234.4 343.3C232.6 346.2 231.0 349.3 228.8 352.3C226.6 355.2 223.6 358.1 221.3 361.1C219.0 364.1 216.6 367.3 215.1 370.1C213.6 372.9 211.7 376.2 212.5 377.9C213.2 379.6 216.8 379.8 219.5 380.3C222.2 380.8 225.6 380.9 228.6 381.0C231.6 381.1 234.8 381.2 237.7 381.0C240.6 380.7 244.3 380.7 246.0 379.3C247.6 378.0 247.2 375.3 247.7 372.7C248.1 370.2 247.7 366.4 248.7 363.8C249.7 361.3 252.2 359.5 253.8 357.4C255.3 355.2 256.9 353.5 257.9 350.9C258.9 348.4 258.8 345.0 259.7 342.0C260.6 339.0 262.0 336.0 263.3 333.0C264.7 330.0 266.3 326.9 267.8 323.9C269.3 320.9 270.6 317.8 272.2 314.9C273.8 312.0 276.2 309.3 277.4 306.5C278.6 303.7 278.3 299.3 279.5 298.0C280.7 296.7 282.8 297.2 284.7 298.8C286.6 300.3 289.1 304.4 290.8 307.3C292.4 310.2 293.7 313.2 294.6 316.2C295.6 319.2 296.0 322.3 296.5 325.3C296.9 328.3 297.4 331.4 297.5 334.4C297.6 337.4 297.6 340.5 297.3 343.5C297.0 346.5 296.5 349.6 295.8 352.6C295.0 355.6 294.3 358.7 292.8 361.7C291.3 364.7 288.7 367.7 286.8 370.7C284.9 373.7 283.2 376.7 281.6 379.7C280.1 382.6 277.4 386.2 277.4 388.4C277.4 390.6 279.3 391.9 281.5 392.9C283.7 393.9 287.6 393.9 290.6 394.2C293.6 394.6 296.7 394.7 299.7 394.8C302.7 394.8 306.1 395.0 308.8 394.4C311.5 393.8 314.8 393.1 316.1 391.2C317.4 389.3 316.7 385.7 316.6 382.8C316.5 379.9 315.5 376.6 315.7 373.8C315.8 371.0 316.4 368.3 317.5 366.0C318.6 363.6 321.6 362.2 322.2 359.7C322.8 357.2 321.5 353.9 321.0 350.9C320.5 348.0 319.7 344.9 319.2 341.9C318.7 339.0 318.4 336.0 318.2 333.0C318.0 330.0 317.5 326.5 317.9 323.9C318.3 321.2 318.8 318.7 320.5 317.1C322.3 315.5 326.7 316.1 328.3 314.4C330.0 312.6 330.0 309.4 330.3 306.6C330.6 303.8 330.1 300.6 330.0 297.5C330.0 294.5 329.9 291.5 329.9 288.5C329.8 285.4 329.8 282.4 329.7 279.4C329.6 276.3 329.5 273.3 329.5 270.3C329.4 267.2 329.4 264.2 329.4 261.2C329.4 258.1 329.3 255.1 329.2 252.1C329.2 249.0 329.1 246.0 329.0 243.0C328.9 239.9 328.7 236.9 328.4 233.9C328.0 230.8 327.6 227.8 327.0 224.8C326.4 221.7 325.7 218.7 324.7 215.7C323.7 212.6 322.5 209.6 321.0 206.6C319.6 203.6 317.8 200.4 316.0 197.5C314.1 194.5 312.1 191.4 309.7 188.9C307.4 186.5 304.6 184.4 301.8 182.8C299.0 181.1 295.7 180.6 292.8 179.1C289.9 177.7 287.1 175.8 284.3 174.2C281.5 172.6 278.9 170.8 276.1 169.5C273.2 168.2 270.1 167.1 267.1 166.2C264.1 165.4 261.1 164.8 258.0 164.3C255.0 163.7 252.0 163.3 249.0 163.0C245.9 162.7 242.9 162.4 239.9 162.2C236.8 161.9 233.8 161.7 230.8 161.6C227.7 161.5 224.7 161.6 221.7 161.6C218.6 161.5 215.6 161.5 212.6 161.4C209.5 161.2 206.5 161.1 203.5 160.8C200.4 160.5 197.4 160.2 194.4 159.4C191.4 158.6 188.5 157.4 185.6 156.1C182.7 154.8 179.6 153.7 176.9 151.8C174.3 150.0 172.0 147.4 169.8 144.9C167.7 142.4 165.5 139.4 164.0 136.7C162.6 134.1 161.7 131.8 161.0 129.0C160.4 126.3 160.6 123.2 160.3 120.2C159.9 117.3 159.2 114.5 158.9 111.5C158.7 108.6 159.1 105.5 158.9 102.7C158.6 99.9 158.0 97.4 157.5 94.6C157.1 91.8 156.9 88.6 156.2 85.8C155.6 82.9 154.7 80.4 153.8 77.5C152.8 74.7 151.6 71.7 150.5 68.7C149.4 65.7 148.7 62.6 147.3 59.8C145.8 57.0 143.7 54.6 141.8 51.9C139.8 49.2 137.8 46.1 135.7 43.6C133.6 41.0 131.7 38.7 129.3 36.6C126.9 34.5 123.9 32.8 121.1 30.9C118.4 29.1 115.6 27.0 112.8 25.5C110.1 24.1 107.5 23.2 104.6 22.3C101.8 21.3 98.7 20.5 95.8 19.8C92.8 19.1 89.9 18.2 87.0 18.0C84.0 17.8 81.0 18.2 78.0 18.5C75.0 18.7 71.9 19.6 68.9 19.5C66.0 19.4 63.2 19.3 60.5 17.8C57.7 16.2 54.8 12.0 52.5 10.2C50.2 8.4 47.4 6.4 46.6 7.0Z"/>
  <g clip-path="url(#hzc)"><g class="hz-slat"><path pathLength="1" d="M72 30C104 30 138 56 150 96"/><path pathLength="1" d="M76 42C100 44 126 66 138 104"/><path pathLength="1" d="M80 56C98 60 114 78 124 112"/><path pathLength="1" d="M84 70C94 78 102 94 108 122"/><path pathLength="1" d="M96 24L88 62"/><path pathLength="1" d="M118 34L100 74"/><path pathLength="1" d="M136 50L112 92"/><path pathLength="1" d="M148 72L120 108"/><path pathLength="1" d="M156 98L128 124"/><path pathLength="1" d="M158 122L132 138"/><path pathLength="1" d="M50 20L38 80"/><path pathLength="1" d="M60 26L50 96"/><path pathLength="1" d="M60 150C90 142 130 140 164 138"/><path pathLength="1" d="M54 168C90 158 130 156 168 150"/><path pathLength="1" d="M54 186C86 176 110 172 128 170"/><path pathLength="1" d="M62 204C86 196 104 192 122 190"/><path pathLength="1" d="M80 220C96 212 108 208 120 206"/><path pathLength="1" d="M128 164C122 184 120 206 118 232"/><path pathLength="1" d="M128 164C170 168 220 172 262 178"/><path pathLength="1" d="M124 184C170 190 220 194 240 196"/><path pathLength="1" d="M122 204C165 212 205 216 236 216"/><path pathLength="1" d="M120 222C160 234 200 238 232 234"/><path pathLength="1" d="M124 238C160 250 200 252 230 246"/><path pathLength="1" d="M236 172C232 200 232 226 240 250"/><path pathLength="1" d="M256 172C254 204 256 232 264 262"/><path pathLength="1" d="M276 176C278 208 280 240 284 272"/><path pathLength="1" d="M294 184C300 214 302 244 300 276"/><path pathLength="1" d="M308 200C314 228 314 254 310 280"/><path pathLength="1" d="M312 204C328 230 330 280 326 316"/><path pathLength="1" d="M318 220C326 250 326 290 322 318"/><path pathLength="1" d="M104 232C100 262 98 290 100 300"/><path pathLength="1" d="M100 302L94 340"/><path pathLength="1" d="M108 302L104 342"/><path pathLength="1" d="M96 344L88 372"/><path pathLength="1" d="M106 344L102 374"/><path pathLength="1" d="M14 196C30 190 46 190 60 192"/><path pathLength="1" d="M20 204L18 236"/><path pathLength="1" d="M30 206L30 240"/><path pathLength="1" d="M24 244L34 268"/><path pathLength="1" d="M36 246L46 262"/><path pathLength="1" d="M286 280C294 296 300 320 304 346"/><path pathLength="1" d="M298 284C306 300 312 322 316 348"/><path pathLength="1" d="M300 350L296 376"/><path pathLength="1" d="M312 350L312 378"/><path pathLength="1" d="M262 300C256 316 250 332 246 346"/><path pathLength="1" d="M252 298C246 314 240 330 236 344"/><path pathLength="1" d="M240 348L230 368"/></g><g class="hz-gold"><path pathLength="1" d="M32 84L62 93"/><path pathLength="1" d="M40 60L72 68"/><path pathLength="1" d="M60 93L64 64L66 26"/><path pathLength="1" d="M150 190C148 205 146 220 144 242"/><path pathLength="1" d="M194 196C194 212 192 230 190 252"/><path pathLength="1" d="M128 164C160 150 200 158 240 168"/><path pathLength="1" d="M86 270H118"/><path pathLength="1" d="M88 300H116"/><path pathLength="1" d="M84 338H114"/><path pathLength="1" d="M68 371H108"/><path pathLength="1" d="M8 238L34 242"/><path pathLength="1" d="M14 254L48 266"/><path pathLength="1" d="M268 276L308 268"/><path pathLength="1" d="M292 346L324 344"/><path pathLength="1" d="M278 372H324"/><path pathLength="1" d="M238 300L272 306"/><path pathLength="1" d="M228 344L258 348"/><path pathLength="1" d="M212 366L252 371"/><circle pathLength="1" cx="45" cy="48" r="3.4"/></g></g></svg>`;
const GUILLOCHE = guilloche();

function viewRingkasan() {
  const m = ui.month, s = stats(m);
  const prev = shiftMonth(m, -1), ps = stats(prev);
  const canCarry = (ps.start != null || ps.n > 0) && ps.remaining > 0;
  const needStart = s.start == null || ui.editStart;
  const base = (s.start || 0) + s.income;
  const usedPct = base > 0 ? Math.min(100, Math.round((s.out / base) * 100)) : 0;
  const over = s.remaining < 0;

  const startForm = `
    <form class="start-form" id="startForm">
      <label for="startInput">${s.start == null ? `Budget ${esc(monthName(m, { month: 'long' }))} berapa?` : 'Edit starting balance'}</label>
      <div class="start-row">
        <input id="startInput" type="text" inputmode="numeric" placeholder="5.000.000" value="${s.start != null ? s.start.toLocaleString('id-ID') : ''}">
        <button class="primary-btn" type="submit">Save</button>
        ${s.start != null ? '<button class="text-btn" type="button" data-act="start-cancel">Cancel</button>' : ''}
      </div>
      ${canCarry && s.start == null ? `<button class="text-btn" type="button" data-act="start-carry" data-amt="${ps.remaining}">Pakai sisa ${esc(monthName(prev, { month: 'long' }))} (${fmtIDR(ps.remaining)})</button>` : ''}
    </form>`;

  const balance = `
    <section class="note ${over ? 'is-over' : ''}" aria-label="Balance left">
      ${GUILLOCHE}
      <div class="note-body">
        <p class="note-k">${esc(monthName(m, { month: 'long' }))} balance</p>
        <p class="note-v num" id="heroNum" data-val="${s.remaining}">${fmtIDR(s.remaining)}</p>
        <p class="note-usd num">${usdText(toUSD(s.remaining))}</p>
        ${needStart ? startForm : `
        <div class="meter" role="img" aria-label="${usedPct} percent used"><span style="width:${usedPct}%"></span></div>
        <div class="note-foot">
          <span>${over ? `Over budget ${fmtIDR(-s.remaining)}` : `${usedPct}% used of ${fmtIDR(base)}`}</span>
          <button class="text-btn" type="button" data-act="start-edit">Edit starting balance</button>
        </div>`}
      </div>
    </section>`;

  const fig = (k, v, usd, cls = '') => `<div class="fig ${cls}"><span class="fig-k">${k}</span><span class="fig-v num">${fmtIDR(v)}</span><span class="fig-usd num">${usdText(usd)}</span></div>`;
  const flow = `
    <section class="flow" aria-label="This month flow">
      ${fig('Starting', s.start || 0, toUSD(s.start || 0))}
      ${fig('Spent', s.expense, rate || s.usd.expense ? s.usd.expense : null)}
      ${fig('Saved', s.saving, rate || s.usd.saving ? s.usd.saving : null)}
      ${fig('Given', s.give, rate || s.usd.give ? s.usd.give : null)}
      ${fig('Income', s.income, rate || s.usd.income ? s.usd.income : null, 'fig--in')}
    </section>`;

  const cats = CATS.map(c => ({ ...c, v: s.cat[c.id] || 0 })).filter(c => c.v > 0);
  const catPanel = `
    <section class="panel">
      <h2>Spending by category</h2>
      ${cats.length ? `<div class="donut-wrap">${donut(cats, s.expense)}
        <ul class="legend">${cats.map(c => `<li data-cat="${c.id}"><span class="sw" style="background:${c.color}"></span><span class="lg-n">${c.name}</span><span class="lg-v num">${fmtIDR(c.v)}</span><span class="lg-p num">${Math.round(c.v / s.expense * 100)}%</span></li>`).join('')}</ul></div>`
      : `<p class="empty">Belum ada spending bulan ini. Coba ketik <q>kopi 18rb</q>.</p>`}
    </section>`;

  const dayPanel = `
    <section class="panel">
      <h2>Daily spending</h2>
      ${s.expense > 0 ? `<div class="bars" id="dayBars" data-month="${m}"></div>` : `<p class="empty">Chart muncul setelah ada spending.</p>`}
    </section>`;

  const recent = txOfMonth(m).slice(0, 6);
  const recentPanel = `
    <section class="panel">
      <div class="panel-head"><h2>Latest</h2>${recent.length ? '<button class="text-btn" type="button" data-view="transaksi">See all</button>' : ''}</div>
      ${recent.length ? `<ul class="rows rows--lite">${recent.map(rowLite).join('')}</ul>` : `<p class="empty">Catatan terbaru muncul di sini.</p>`}
    </section>`;

  return `${balance}${flow}<div class="grid2">${catPanel}${dayPanel}</div>${recentPanel}`;
}

const badge = t => t.type === 'expense'
  ? `<span class="tag"><span class="sw" style="background:${CAT[t.cat] ? CAT[t.cat].color : CAT.lainnya.color}"></span>${esc((CAT[t.cat] || CAT.lainnya).name)}</span>`
  : `<span class="tag tag--${t.type}">${TYPES[t.type].name}</span>`;
const sign = t => t.type === 'income' ? '+' : '−';

function rowLite(t) {
  return `<li class="${ui.flash === t.id ? 'is-new' : ''}"><div class="r-main"><span class="r-desc">${esc(t.desc)}</span><span class="r-meta">${badge(t)}<span>${esc(dayLabel(t.date))}</span></span></div>
    <div class="r-amt"><span class="num ${t.type === 'income' ? 'pos' : ''}">${sign(t)}${fmtIDR(t.amt)}</span><span class="num r-usd">${usdText(usdOf(t))}</span></div></li>`;
}

/* ----- Grafik ----- */
function donut(cats, total) {
  const R = 62, C = 2 * Math.PI * R, gap = cats.length > 1 ? 3 : 0;
  let off = 0, segs = '';
  for (const c of cats) {
    const len = (c.v / total) * C;
    const dash = Math.max(1, len - gap);
    segs += `<circle class="seg" data-cat="${c.id}" data-tip="${esc(c.name)}|${fmtIDR(c.v)}|${Math.round(c.v / total * 100)}% of spending" cx="90" cy="90" r="${R}" stroke="${c.color}" stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"/>`;
    off += len;
  }
  return `<svg class="donut" viewBox="0 0 180 180" role="img" aria-label="Spending by category"><circle class="donut-track" cx="90" cy="90" r="${R}"/><g transform="rotate(-90 90 90)">${segs}</g>
    <text x="90" y="86" class="donut-k">Total</text><text x="90" y="106" class="donut-v">${fmtShort(total)}</text></svg>`;
}

function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const k of [1, 2, 2.5, 5, 10]) if (v <= k * p) return k * p;
  return 10 * p;
}

function drawBars(el, items, opts = {}) {
  // items: [{label, value, tip, strong}]
  const W = Math.max(280, el.clientWidth), H = opts.h || 210;
  const L = 44, Rr = 8, T = opts.labels ? 22 : 10, B = 26;
  const max = niceMax(Math.max(...items.map(i => i.value), 1));
  const pw = W - L - Rr, ph = H - T - B, step = pw / items.length;
  const bw = Math.max(3, Math.min(opts.maxBar || 22, step - 2));
  let g = '';
  for (const f of [0, 0.5, 1]) {
    const y = T + ph - ph * f;
    g += `<line class="grid" x1="${L}" x2="${W - Rr}" y1="${y}" y2="${y}"/><text class="ax" x="${L - 8}" y="${y + 4}" text-anchor="end">${f === 0 ? '0' : fmtShort(max * f)}</text>`;
  }
  let b = '';
  items.forEach((it, i) => {
    const cx = L + step * i + step / 2;
    const h = it.value > 0 ? Math.max(2, (it.value / max) * ph) : 0;
    const y = T + ph - h, r = Math.min(4, bw / 2, h);
    if (h > 0) b += `<path class="bar ${it.strong ? 'is-strong' : ''}" d="M${cx - bw / 2} ${T + ph}V${y + r}q0 ${-r} ${r} ${-r}h${bw - 2 * r}q${r} 0 ${r} ${r}V${T + ph}z"/>`;
    if (opts.labels && it.value > 0) b += `<text class="val" x="${cx}" y="${y - 6}" text-anchor="middle">${fmtShort(it.value)}</text>`;
    if (it.label) b += `<text class="ax" x="${cx}" y="${H - 8}" text-anchor="middle">${esc(it.label)}</text>`;
    b += `<rect class="hit" x="${L + step * i}" y="${T}" width="${step}" height="${ph + B}" data-tip="${esc(it.tip)}" ${it.go ? `data-go="${it.go}"` : ''}/>`;
  });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(opts.aria || 'Bar chart')}">${g}${b}</svg>`;
}

function afterRender() {
  const db = $('#dayBars');
  if (db) {
    const m = db.dataset.month, s = stats(m), n = daysIn(m), today = ymd(new Date());
    const items = [];
    for (let d = 1; d <= n; d++) {
      const iso = `${m}-${pad(d)}`;
      items.push({ label: (d === 1 || d % 5 === 0) ? String(d) : '', value: s.day[d] || 0, strong: iso === today, tip: `${dayLabel(iso)}|${fmtIDR(s.day[d] || 0)}|${s.day[d] ? '' : 'No spending'}` });
    }
    drawBars(db, items, { aria: 'Spending per day' });
  }
  const mb = $('#monthBars');
  if (mb) {
    const items = historyMonths().slice(-8).map(m => {
      const s = stats(m);
      return { label: monthName(m, { month: 'short' }), value: s.expense, strong: m === ui.month, go: m, tip: `${monthName(m)}|${fmtIDR(s.expense)}|${usdText(s.usd.expense || toUSD(s.expense))}` };
    });
    drawBars(mb, items, { labels: true, maxBar: 44, h: 240, aria: 'Spending per month' });
  }
  const hero = $('#heroNum');
  if (hero) {
    const to = Number(hero.dataset.val), from = ui.shown;
    ui.shown = to;
    if (from != null && from !== to && !reduceMotion()) {
      const t0 = performance.now(), dur = 420;
      const tick = now => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        hero.textContent = fmtIDR(from + (to - from) * e);
        if (k < 1 && hero.isConnected) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }
}

/* ----- Transaksi ----- */
function viewTransaksi() {
  const m = ui.month;
  const all = txOfMonth(m);
  const q = norm(ui.q);
  const list = all.filter(t => {
    if (ui.filter !== 'all') {
      if (TYPES[ui.filter] && ui.filter !== 'expense') { if (t.type !== ui.filter) return false; }
      else if (!(t.type === 'expense' && t.cat === ui.filter)) return false;
    }
    return !q || norm(t.desc + ' ' + (t.target || '')).includes(q);
  });
  const chip = (id, name) => `<button type="button" class="chip ${ui.filter === id ? 'is-on' : ''}" data-filter="${id}" aria-pressed="${ui.filter === id}">${esc(name)}</button>`;
  const chips = [chip('all', 'All'), ...CATS.map(c => chip(c.id, c.name)), chip('saving', 'Saving'), chip('give', 'Given'), chip('income', 'Income')].join('');
  for (const id of [...ui.sel]) if (!all.some(t => t.id === id)) ui.sel.delete(id);
  const total = list.reduce((a, t) => a + (t.type === 'income' ? 0 : t.amt), 0);

  const row = t => `
    <li data-id="${t.id}" class="${ui.sel.has(t.id) ? 'is-sel' : ''} ${ui.flash === t.id ? 'is-new' : ''}">
      <label class="c-sel"><input class="ck" type="checkbox" data-sel="${t.id}" ${ui.sel.has(t.id) ? 'checked' : ''} aria-label="Select ${esc(t.desc)}"></label>
      <span class="c-date">${esc(dayLabel(t.date))}</span>
      <span class="c-desc">${esc(t.desc)}</span>
      <span class="c-cat">${t.type === 'expense'
        ? `<span class="cat-pick"><span class="sw" style="background:${(CAT[t.cat] || CAT.lainnya).color}"></span><select data-cat-for="${t.id}" aria-label="Category ${esc(t.desc)}">${CATS.map(c => `<option value="${c.id}" ${c.id === t.cat ? 'selected' : ''}>${c.name}</option>`).join('')}</select></span>`
        : badge(t)}</span>
      <span class="c-idr num ${t.type === 'income' ? 'pos' : ''}">${sign(t)}${fmtIDR(t.amt)}</span>
      <span class="c-usd num">${usdText(usdOf(t))}</span>
      <span class="c-act">
        <button class="icon-btn" type="button" data-act="edit" data-id="${t.id}" aria-label="Edit ${esc(t.desc)}">${icon(I.edit)}</button>
        <button class="icon-btn" type="button" data-act="del" data-id="${t.id}" aria-label="Delete ${esc(t.desc)}">${icon(I.trash)}</button>
      </span>
    </li>`;

  return `
    <div class="view-head">
      <h1>Transactions</h1>
      <button class="ghost-btn" type="button" data-act="csv" ${all.length ? '' : 'disabled'}>Export CSV</button>
    </div>
    <div class="tools">
      <label class="sr" for="search">Search</label>
      <input id="search" type="search" placeholder="Search" value="${esc(ui.q)}">
      <div class="chips" role="group" aria-label="Filter">${chips}</div>
    </div>
    ${ui.sel.size ? `<div class="bulk" role="status"><span>${ui.sel.size} selected</span><button class="ghost-btn danger" type="button" data-act="del-sel">Delete selected</button><button class="text-btn" type="button" data-act="sel-clear">Clear</button></div>` : ''}
    <section class="panel panel--flush">
      ${list.length ? `
      <div class="thead"><label class="c-sel"><input class="ck" type="checkbox" data-sel-all ${list.length && list.every(t => ui.sel.has(t.id)) ? 'checked' : ''} aria-label="Select all"></label><span>Date</span><span>Note</span><span>Category</span><span class="ta-r">IDR</span><span class="ta-r">USD</span><span></span></div>
      <ul class="rows rows--table">${list.map(row).join('')}</ul>
      <div class="tfoot"><span>${list.length} ${list.length === 1 ? 'entry' : 'entries'}</span><span class="num">Money out ${fmtIDR(total)}</span></div>`
      : `<p class="empty">${all.length ? 'Nggak ada yang cocok.' : `Belum ada catatan di ${esc(monthName(m))}.`}</p>`}
    </section>`;
}

/* ----- Tabungan & transfer ----- */
function viewTabungan() {
  const m = ui.month;
  const group = type => {
    const g = {};
    for (const t of txList()) {
      if (t.type !== type) continue;
      const key = norm(t.target || t.desc) || 'tanpa nama';
      g[key] = g[key] || { name: t.target || t.desc, month: 0, all: 0 };
      g[key].all += t.amt;
      if (t.date.startsWith(m)) g[key].month += t.amt;
    }
    return Object.values(g).sort((a, b) => b.month - a.month || b.all - a.all);
  };
  const block = (title, type, emptyHint) => {
    const g = group(type);
    const sumM = g.reduce((a, x) => a + x.month, 0), sumA = g.reduce((a, x) => a + x.all, 0);
    const max = Math.max(...g.map(x => x.all), 1);
    return `<section class="panel">
      <div class="panel-head"><h2>${title}</h2><span class="num sum">${fmtIDR(sumM)}<small>${usdText(toUSD(sumM))} this month</small></span></div>
      ${g.length ? `<ul class="dest">${g.map(x => `<li>
          <div class="dest-top"><span class="dest-n">${esc(x.name)}</span><span class="num">${fmtIDR(x.month)}</span></div>
          <div class="dest-bar"><span style="width:${Math.max(2, x.all / max * 100)}%"></span></div>
          <div class="dest-sub">All time <span class="num">${fmtIDR(x.all)}</span></div>
        </li>`).join('')}</ul>
        <p class="panel-note">All time total: <span class="num">${fmtIDR(sumA)}</span></p>`
      : `<p class="empty">${emptyHint}</p>`}
    </section>`;
  };
  const list = txOfMonth(m).filter(t => t.type === 'saving' || t.type === 'give');
  return `
    <div class="view-head"><h1>Savings &amp; transfer</h1></div>
    <div class="grid2">
      ${block('Saved to', 'saving', 'Belum ada tabungan. Coba ketik <q>tabung 500rb bank jago</q>.')}
      ${block('Given to', 'give', 'Belum ada transfer. Coba ketik <q>kasih 200rb ibu</q>.')}
    </div>
    <section class="panel">
      <h2>Entries, ${esc(monthName(m, { month: 'long' }))}</h2>
      ${list.length ? `<ul class="rows rows--lite">${list.map(rowLite).join('')}</ul>` : '<p class="empty">Belum ada tabungan atau transfer bulan ini.</p>'}
    </section>`;
}

/* ----- Riwayat ----- */
function historyMonths() {
  const set = new Set([ym(new Date()), ...Object.keys(state.months), ...txList().map(t => t.date.slice(0, 7))]);
  const arr = [...set].sort();
  const out = [];
  for (let m = arr[0]; m <= arr[arr.length - 1]; m = shiftMonth(m, 1)) out.push(m);
  return out;
}
function viewRiwayat() {
  const months = historyMonths();
  const any = txList().length > 0;
  const rows = months.slice().reverse().map(m => {
    const s = stats(m);
    return `<li data-go="${m}" class="${m === ui.month ? 'is-on' : ''}">
      <button type="button" class="h-m" data-act="goto" data-m="${m}">${esc(monthName(m))}</button>
      <span class="num" data-k="Starting">${s.start == null ? '—' : fmtIDR(s.start)}</span>
      <span class="num" data-k="Spent">${fmtIDR(s.expense)}</span>
      <span class="num" data-k="Saved">${fmtIDR(s.saving)}</span>
      <span class="num" data-k="Given">${fmtIDR(s.give)}</span>
      <span class="num ${s.remaining < 0 ? 'neg' : ''}" data-k="Left">${fmtIDR(s.remaining)}</span>
    </li>`;
  }).join('');
  return `
    <div class="view-head"><h1>History</h1></div>
    <section class="panel">
      <h2>Spending per month</h2>
      ${any ? '<div class="bars" id="monthBars"></div>' : '<p class="empty">Perbandingan antar bulan muncul setelah ada catatan.</p>'}
    </section>
    <section class="panel panel--flush">
      <div class="hhead" aria-hidden="true"><span>Month</span><span>Starting</span><span>Spent</span><span>Saved</span><span>Given</span><span>Left</span></div>
      <ul class="hist">${rows}</ul>
    </section>`;
}

/* ----- Akade Project ----- */
const JOB_TYPES = ['Video + thread', 'Thread', 'Single post', 'Video + single post', 'Video'];
const jobList = () => Object.values(state.jobs || {}).sort((a, b) => a.ts - b.ts);
const safeUrl = u => {
  let s = String(u || '').trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try { const x = new URL(s); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; }
};
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const parseFee = v => { const n = parseFloat(String(v).replace(/[^0-9.,]/g, '').replace(/,(\d{3})\b/g, '$1').replace(',', '.')); return isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null; };
const idrOf = usd => (rate && rate.v) ? fmtIDR(usd * rate.v) : '—';

function viewProject() {
  const all = jobList();
  const numbered = all.map((j, i) => ({ ...j, no: i + 1 }));
  const f = ui.jobFilter;
  const list = numbered.filter(j => f === 'all' || (f === 'open' && !j.posted) || (f === 'unpaid' && !j.paid) || (f === 'paid' && j.paid));
  const sum = arr => arr.reduce((a, j) => a + (j.fee || 0), 0);
  const total = sum(all), paid = all.filter(j => j.paid), unpaid = all.filter(j => !j.paid), posted = all.filter(j => j.posted);
  const chip = (id, name) => `<button type="button" class="chip ${f === id ? 'is-on' : ''}" data-jobfilter="${id}" aria-pressed="${f === id}">${name}</button>`;
  const tick = (j, key, on, off) => `<label class="j-post ${j[key] ? 'is-on' : ''}"><input class="ck" type="checkbox" data-job-flag="${key}" data-job-id="${j.id}" ${j[key] ? 'checked' : ''}><span>${j[key] ? on : off}</span></label>`;
  const row = j => `
    <li data-id="${j.id}" class="${j.posted && j.paid ? 'is-done' : ''} ${ui.flash === j.id ? 'is-new' : ''}">
      <span class="j-no num">${j.no}</span>
      <span class="j-co">${esc(j.company)}</span>
      <span class="j-job">${esc(j.job)}</span>
      <span class="j-fee num"><b>${fmtUSDv(j.fee || 0)}</b><small>${idrOf(j.fee || 0)}</small></span>
      <span class="j-link">${j.link ? `<a href="${esc(j.link)}" target="_blank" rel="noopener noreferrer">${esc(hostOf(j.link) || 'Open draft')}</a>` : '<span class="j-none">No link</span>'}</span>
      <span class="j-status">${tick(j, 'posted', 'Posted', 'Not posted')}${tick(j, 'paid', 'Paid', 'Unpaid')}</span>
      <span class="j-act">
        <button class="icon-btn" type="button" data-act="job-edit" data-id="${j.id}" aria-label="Edit ${esc(j.company)}">${icon(I.edit)}</button>
        <button class="icon-btn" type="button" data-act="job-del" data-id="${j.id}" aria-label="Delete ${esc(j.company)}">${icon(I.trash)}</button>
      </span>
    </li>`;
  return `
    <div class="view-head"><h1>Akade Project</h1></div>
    <section class="note note--proj" aria-label="Fee summary">
      ${HORSE}
      <div class="note-body">
        <p class="note-k">Total fee, ${all.length} job${all.length === 1 ? '' : 's'}</p>
        <p class="note-v num">${fmtUSDv(total)}</p>
        <p class="note-usd num">${idrOf(total)}</p>
        <div class="proj-figs">
          <div><span class="fig-k">Paid</span><span class="fig-v num pos">${fmtUSDv(sum(paid))}</span><span class="fig-usd">${paid.length} job${paid.length === 1 ? '' : 's'}</span></div>
          <div><span class="fig-k">Unpaid</span><span class="fig-v num">${fmtUSDv(sum(unpaid))}</span><span class="fig-usd">${unpaid.length} job${unpaid.length === 1 ? '' : 's'}</span></div>
          <div><span class="fig-k">Posted</span><span class="fig-v num">${posted.length} of ${all.length}</span><span class="fig-usd">jobs</span></div>
        </div>
      </div>
    </section>
    <form class="panel job-form" id="jobForm" autocomplete="off">
      <h2>Add job</h2>
      <div class="job-fields">
        <label>Company<input name="company" required></label>
        <label>Job<input name="job" list="jobTypes" required></label>
        <label>Fee (USD)<input name="fee" inputmode="decimal" required></label>
        <label>Link draft<input name="link" inputmode="url"></label>
        <button class="primary-btn" type="submit">Add job</button>
      </div>
      <datalist id="jobTypes">${JOB_TYPES.map(t => `<option value="${t}">`).join('')}</datalist>
    </form>
    <div class="chips" role="group" aria-label="Filter jobs">${chip('all', 'All')}${chip('open', 'Not posted')}${chip('unpaid', 'Unpaid')}${chip('paid', 'Paid')}</div>
    <section class="panel panel--flush">
      ${list.length ? `
      <div class="jhead" aria-hidden="true"><span>No</span><span>Company</span><span>Job</span><span class="ta-r">Fee</span><span>Link draft</span><span>Status</span><span></span></div>
      <ul class="jobs">${list.map(row).join('')}</ul>`
      : `<p class="empty">${all.length ? 'Nggak ada job di filter ini.' : 'Belum ada job. Add yang pertama di form atas.'}</p>`}
    </section>`;
}

function openJobEdit(id) {
  const j = state.jobs[id];
  if (!j) return;
  const d = $('#editDlg');
  const yn = (name, val, on, off) => `<select name="${name}"><option value="0" ${val ? '' : 'selected'}>${off}</option><option value="1" ${val ? 'selected' : ''}>${on}</option></select>`;
  d.innerHTML = `
    <form method="dialog" id="jobEditForm">
      <h2>Edit job</h2>
      <label>Company<input name="company" value="${esc(j.company)}" required></label>
      <label>Job<input name="job" value="${esc(j.job)}" list="jobTypesDlg" required></label>
      <datalist id="jobTypesDlg">${JOB_TYPES.map(t => `<option value="${t}">`).join('')}</datalist>
      <label>Fee (USD)<input name="fee" inputmode="decimal" value="${j.fee}" required></label>
      <div class="f-2">
        <label>Posting status${yn('posted', j.posted, 'Posted', 'Not posted')}</label>
        <label>Payment status${yn('paid', j.paid, 'Paid', 'Unpaid')}</label>
      </div>
      <label>Link draft<input name="link" inputmode="url" value="${esc(j.link || '')}"></label>
      <p class="f-err" id="jobErr" role="alert"></p>
      <div class="f-act"><button class="text-btn" type="button" data-act="close-dlg">Cancel</button><button class="primary-btn" type="submit">Save changes</button></div>
    </form>`;
  const form = $('#jobEditForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fee = parseFee(form.fee.value);
    if (fee == null) { $('#jobErr').textContent = 'Fee belum kebaca. Tulis angka aja, misal 500 atau 1250.50.'; return; }
    Object.assign(j, { company: form.company.value.trim() || j.company, job: form.job.value.trim() || j.job, fee, link: safeUrl(form.link.value), posted: form.posted.value === '1', paid: form.paid.value === '1', u: Date.now() });
    d.close(); commit(); toast('Saved');
  });
  d.showModal();
}

/* ----- Konfirmasi hapus ----- */
function confirmDelete(ids) {
  const items = ids.map(id => state.tx[id]).filter(Boolean);
  if (!items.length) return;
  const n = items.length, d = $('#editDlg');
  const total = items.reduce((a, t) => a + t.amt, 0);
  d.innerHTML = `
    <form method="dialog" id="delForm">
      <h2>Delete ${n} ${n > 1 ? 'entries' : 'entry'}?</h2>
      <p class="f-note">Ini bakal hilang dari Transactions, Overview, dan History.</p>
      <ul class="del-list">${items.slice(0, 6).map(t => `<li><span>${esc(t.desc)}</span><span class="num">${fmtIDR(t.amt)}</span></li>`).join('')}${n > 6 ? `<li class="more"><span>and ${n - 6} more</span><span></span></li>` : ''}</ul>
      ${n > 1 ? `<p class="del-total"><span>Total</span><span class="num">${fmtIDR(total)}</span></p>` : ''}
      <div class="f-act"><button class="text-btn" type="button" data-act="close-dlg">Cancel</button><button class="primary-btn danger" type="submit">Delete ${n}</button></div>
    </form>`;
  $('#delForm').addEventListener('submit', e => {
    e.preventDefault();
    const gone = items.map(t => removeTx(t.id)).filter(Boolean);
    ui.sel.clear(); d.close(); commit();
    toast(`${gone.length} deleted`, () => { for (const t of gone) { delete state.del[t.id]; t.u = Date.now(); state.tx[t.id] = t; } commit(); });
  });
  d.showModal();
}
function confirmJobDelete(id) {
  const j = state.jobs[id];
  if (!j) return;
  const d = $('#editDlg');
  d.innerHTML = `
    <form method="dialog" id="delForm">
      <h2>Delete this job?</h2>
      <ul class="del-list"><li><span>${esc(j.company)}, ${esc(j.job)}</span><span class="num">${fmtUSDv(j.fee || 0)}</span></li></ul>
      <div class="f-act"><button class="text-btn" type="button" data-act="close-dlg">Cancel</button><button class="primary-btn danger" type="submit">Delete job</button></div>
    </form>`;
  $('#delForm').addEventListener('submit', e => {
    e.preventDefault();
    delete state.jobs[j.id]; state.del[j.id] = Date.now(); d.close(); commit();
    toast(`Deleted: ${j.company}`, () => { delete state.del[j.id]; j.u = Date.now(); state.jobs[j.id] = j; commit(); });
  });
  d.showModal();
}

/* ---------- Dialog ---------- */
function openEdit(id) {
  const t = state.tx[id];
  if (!t) return;
  const d = $('#editDlg');
  d.innerHTML = `
    <form method="dialog" id="editForm">
      <h2>Edit entry</h2>
      <label>Note<input name="desc" value="${esc(t.desc)}" required></label>
      <div class="f-2">
        <label>Amount (Rp)<input name="amt" inputmode="numeric" value="${t.amt.toLocaleString('id-ID')}" required></label>
        <label>Date<input name="date" type="date" value="${t.date}" required></label>
      </div>
      <div class="f-2">
        <label>Type<select name="type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${k === t.type ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label>
        <label>Category<select name="cat">${CATS.map(c => `<option value="${c.id}" ${c.id === (t.cat || 'lainnya') ? 'selected' : ''}>${c.name}</option>`).join('')}</select></label>
      </div>
      <p class="f-note">Rate when recorded: ${t.rate ? '$1 = ' + fmtIDR(t.rate) : 'belum ada'}</p>
      <p class="f-err" id="editErr" role="alert"></p>
      <div class="f-act"><button class="text-btn" type="button" data-act="close-dlg">Cancel</button><button class="primary-btn" type="submit" value="save">Save changes</button></div>
    </form>`;
  const form = $('#editForm');
  const syncCat = () => { form.cat.disabled = form.type.value !== 'expense'; };
  form.type.addEventListener('change', syncCat); syncCat();
  form.addEventListener('submit', e => {
    e.preventDefault();
    const amt = parseAmount(form.amt.value.replace(/\s/g, ''));
    if (!amt) { $('#editErr').textContent = 'Nominal belum kebaca. Tulis misal 16000 atau 16rb.'; return; }
    const type = form.type.value, desc = form.desc.value.trim() || t.desc;
    const cat = type === 'expense' ? form.cat.value : null;
    if (type === 'expense' && (cat !== t.cat || desc !== t.desc)) learn(desc, cat);
    Object.assign(t, { desc, amt, type, cat, date: form.date.value || t.date, target: (type === 'saving' || type === 'give') ? desc : '', u: Date.now() });
    d.close(); commit(); toast('Saved');
  });
  d.showModal();
}

function openSettings() {
  const d = $('#settingsDlg');
  const acct = cloud.enabled
    ? (cloud.user ? `<p>Signed in as <strong>${esc(cloud.user.email || '')}</strong>. Catatanmu synced di semua device dengan akun ini.</p><button class="ghost-btn" type="button" data-act="signout">Sign out</button>`
                  : '<p>Sync aktif tapi server belum kejangkau. Data tetap aman di device ini.</p>')
    : '<p>Sekarang catatan cuma ada di device ini. Buat sync HP dan laptop, ikuti langkah di <strong>CARA PAKAI.md</strong>.</p>';
  d.innerHTML = `
    <div class="set">
      <h2>Settings</h2>
      <section><h3>USD rate</h3>
        <p>${rate ? `$1 = <span class="num">${fmtIDR(rate.v)}</span>, updated ${rateAge()}.` : 'Rate belum keambil.'} Auto update tiap 20 detik. Tiap catatan pakai rate saat dicatat.</p>
        <button class="ghost-btn" type="button" data-act="rate-refresh">Refresh rate</button></section>
      <section><h3>Data</h3>
        <p>Export bulan ini, atau backup semua data.</p>
        <div class="set-row">
          <button class="ghost-btn" type="button" data-act="csv">Export CSV</button>
          <button class="ghost-btn" type="button" data-act="backup">Download backup</button>
          <label class="ghost-btn file-btn">Restore backup<input type="file" id="restoreFile" accept="application/json,.json"></label>
        </div></section>
      <section><h3>Account &amp; sync</h3>${acct}</section>
      <div class="f-act"><button class="primary-btn" type="button" data-act="close-dlg">Done</button></div>
    </div>`;
  d.showModal();
}

/* ---------- Toast & tooltip ---------- */
let toastTimer;
function toast(msg, undo) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button type="button" class="text-btn" id="undoBtn">Undo</button>' : ''}`;
  el.hidden = false;
  if (undo) $('#undoBtn').onclick = () => { undo(); el.hidden = true; };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, undo ? 6000 : 2600);
}
function showTip(target, x, y) {
  const [a, b, c] = (target.dataset.tip || '').split('|');
  const tip = $('#tip');
  tip.innerHTML = `<span class="tip-k">${esc(a)}</span><span class="tip-v num">${esc(b || '')}</span>${c ? `<span class="tip-s">${esc(c)}</span>` : ''}`;
  tip.hidden = false;
  const r = tip.getBoundingClientRect();
  tip.style.left = Math.max(8, Math.min(innerWidth - r.width - 8, x - r.width / 2)) + 'px';
  tip.style.top = Math.max(8, y - r.height - 14) + 'px';
}

/* ---------- Ekspor ---------- */
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function exportCSV() {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Date', 'Type', 'Note', 'Category', 'IDR', 'Rate', 'USD']];
  for (const t of txOfMonth(ui.month).reverse()) {
    const usd = usdOf(t);
    rows.push([t.date, TYPES[t.type].name, t.desc, t.type === 'expense' ? (CAT[t.cat] || CAT.lainnya).name : '', t.amt, t.rate ? Math.round(t.rate) : '', usd == null ? '' : usd.toFixed(2)]);
  }
  download(`akade-finance-${ui.month}.csv`, '﻿' + rows.map(r => r.map(q).join(',')).join('\n'), 'text/csv;charset=utf-8');
}

/* ---------- Event ---------- */
let enterTimer;
function animateView() {
  const v = $('#view');
  v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
  clearTimeout(enterTimer);
  enterTimer = setTimeout(() => v.classList.remove('enter'), 1500);
  const sw = $('.sword');
  if (sw) { sw.classList.remove('swing'); void sw.offsetWidth; sw.classList.add('swing'); }
}
function setView(v) {
  const changed = ui.view !== v;
  if (changed) ui.sel.clear();
  ui.view = v; ui.editStart = false; render();
  if (changed) { window.scrollTo({ top: 0 }); animateView(); }
}

document.addEventListener('click', e => {
  const vb = e.target.closest('[data-view]');
  if (vb) { setView(vb.dataset.view); return; }
  const jf = e.target.closest('[data-jobfilter]');
  if (jf) { ui.jobFilter = jf.dataset.jobfilter; render(); return; }
  const fb = e.target.closest('[data-filter]');
  if (fb) { ui.filter = fb.dataset.filter; render(); return; }
  const go = e.target.closest('rect[data-go]');
  if (go) { ui.month = go.dataset.go; ui.shown = null; setView('ringkasan'); return; }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  if (act === 'month-prev') { ui.month = shiftMonth(ui.month, -1); ui.shown = null; ui.editStart = false; render(); animateView(); }
  else if (act === 'month-next') { ui.month = shiftMonth(ui.month, 1); ui.shown = null; ui.editStart = false; render(); animateView(); }
  else if (act === 'month-now') { ui.month = ym(new Date()); ui.shown = null; ui.editStart = false; render(); animateView(); }
  else if (act === 'goto') { ui.month = b.dataset.m; ui.shown = null; setView('ringkasan'); }
  else if (act === 'start-edit') { ui.editStart = true; render(); const i = $('#startInput'); if (i) { i.focus(); i.select(); } }
  else if (act === 'start-cancel') { ui.editStart = false; render(); }
  else if (act === 'start-carry') { state.months[ui.month] = { start: Number(b.dataset.amt), u: Date.now() }; ui.editStart = false; commit(); toast('Balance saved'); }
  else if (act === 'edit') openEdit(b.dataset.id);
  else if (act === 'del') confirmDelete([b.dataset.id]);
  else if (act === 'del-sel') confirmDelete([...ui.sel]);
  else if (act === 'sel-clear') { ui.sel.clear(); render(); }
  else if (act === 'settings') openSettings();
  else if (act === 'close-dlg') b.closest('dialog').close();
  else if (act === 'csv') exportCSV();
  else if (act === 'backup') download(`akade-finance-cadangan-${ymd(new Date())}.json`, JSON.stringify(strip(state)), 'application/json');
  else if (act === 'rate-refresh') { b.disabled = true; b.textContent = 'Fetching…'; fetchRate(true).then(ok => { toast(ok ? 'Rate updated' : 'Rate gagal diambil. Cek koneksi internet.'); if ($('#settingsDlg').open) openSettingsRefresh(); }); }
  else if (act === 'job-edit') openJobEdit(b.dataset.id);
  else if (act === 'job-del') confirmJobDelete(b.dataset.id);
  else if (act === 'signout') cloud.signOut();
});
function openSettingsRefresh() { $('#settingsDlg').close(); openSettings(); }

document.addEventListener('change', e => {
  const jf = e.target.closest('input[data-job-flag]');
  if (jf) {
    const j = state.jobs[jf.dataset.jobId], key = jf.dataset.jobFlag;
    if (j) {
      j[key] = jf.checked; j.u = Date.now(); commit();
      const word = key === 'paid' ? (j.paid ? 'paid' : 'unpaid') : (j.posted ? 'posted' : 'not posted');
      toast(`${j.company} marked ${word}`);
    }
    return;
  }
  const sa = e.target.closest('input[data-sel-all]');
  if (sa) { for (const c of document.querySelectorAll('input[data-sel]')) { if (sa.checked) ui.sel.add(c.dataset.sel); else ui.sel.delete(c.dataset.sel); } render(); return; }
  const sc = e.target.closest('input[data-sel]');
  if (sc) { if (sc.checked) ui.sel.add(sc.dataset.sel); else ui.sel.delete(sc.dataset.sel); render(); return; }
  const sel = e.target.closest('select[data-cat-for]');
  if (sel) {
    const t = state.tx[sel.dataset.catFor];
    if (t) { t.cat = sel.value; t.u = Date.now(); learn(t.desc, t.cat); commit(); toast(`“${t.desc}” now in ${CAT[t.cat].name}`); }
    return;
  }
  if (e.target.id === 'restoreFile' && e.target.files[0]) {
    e.target.files[0].text().then(txt => {
      const data = JSON.parse(txt);
      if (!data || typeof data.tx !== 'object') throw new Error('format');
      state = Object.assign(merge(state, data), { owner: state.owner });
      $('#settingsDlg').close(); commit(); toast('Backup restored dan digabung');
    }).catch(() => toast('File ini bukan backup Akade Finance.'));
  }
});

document.addEventListener('input', e => {
  if (e.target.id === 'search') {
    ui.q = e.target.value;
    const pos = e.target.selectionStart;
    render();
    const s = $('#search'); s.focus(); s.setSelectionRange(pos, pos);
  }
});

document.addEventListener('submit', e => {
  if (e.target.id === 'jobForm') {
    e.preventDefault();
    const f = e.target, fee = parseFee(f.fee.value);
    if (fee == null) { toast('Fee belum kebaca. Tulis angka aja, misal 500 atau 1250.50.'); f.fee.focus(); return; }
    const id = uid();
    state.jobs[id] = { id, company: f.company.value.trim(), job: f.job.value.trim(), fee, link: safeUrl(f.link.value), posted: false, paid: false, ts: Date.now(), u: Date.now() };
    flash(id); commit(); bump(); toast(`${state.jobs[id].company} added`);
    const c = $('#jobForm [name=company]'); if (c && matchMedia('(min-width: 900px)').matches) c.focus();
    return;
  }
  if (e.target.id === 'startForm') {
    e.preventDefault();
    const amt = parseAmount($('#startInput').value.replace(/\s/g, ''));
    if (!amt) { toast('Saldo belum kebaca. Tulis misal 5.000.000 atau 5jt.'); return; }
    state.months[ui.month] = { start: amt, u: Date.now() };
    ui.editStart = false; commit(); bump(); toast('Balance saved');
  }
});

/* Input cepat */
const qi = $('#quickInput'), qp = $('#quickPreview');
const PROMPTS = ['Hari ini jajan apa?', 'Nabung berapa hari ini?', 'Abis buat apa aja?', 'Ada uang masuk?', 'Transfer ke siapa?'];
let promptI = 0;
qi.placeholder = PROMPTS[0];
setInterval(() => { if (!qi.value) { promptI = (promptI + 1) % PROMPTS.length; qi.placeholder = PROMPTS[promptI]; } }, 3600);
qi.addEventListener('focus', () => previewQuick());
qi.addEventListener('blur', () => setTimeout(previewQuick, 120));
function previewQuick() {
  const p = parseEntry(qi.value);
  if (!p) {
    if (document.activeElement === qi) { qp.className = 'quick-preview is-on'; qp.innerHTML = '<span class="qp-hint">Ketik nama + nominal, misal <b>kopi 18rb</b>. Bisa juga <b>tabung</b>, <b>kasih</b>, <b>masuk</b>.</span>'; }
    else { qp.innerHTML = ''; qp.className = 'quick-preview'; }
    return;
  }
  if (!p.amt) { qp.className = 'quick-preview is-on'; qp.innerHTML = `<span class="qp-hint">Tambah nominalnya di akhir: <b>16000</b>, <b>16rb</b>, atau <b>1,5jt</b></span>`; return; }
  const label = p.type === 'expense' ? `<span class="sw" style="background:${CAT[p.cat].color}"></span>${CAT[p.cat].name}` : TYPES[p.type].name;
  qp.className = 'quick-preview is-on';
  qp.innerHTML = `<span class="qp-cat">${label}</span><span class="qp-desc">${esc(p.desc)}</span><span class="qp-amt num">${fmtIDR(p.amt)}</span><span class="qp-usd num">${usdText(toUSD(p.amt))}</span>`;
}
qi.addEventListener('input', () => { previewQuick(); replay($('.quick-row'), 'type'); });
$('#quick').addEventListener('submit', e => {
  e.preventDefault();
  const p = parseEntry(qi.value);
  if (!p) { qi.focus(); return; }
  if (!p.amt) { previewQuick(); qi.focus(); return; }
  const t = addTx(p, ui.month);
  qi.value = ''; previewQuick();
  flash(t.id); commit(); bump(); replay($('.quick-row'), 'sent');
  const where = p.type === 'expense' ? CAT[p.cat].name : TYPES[p.type].name;
  toast(`Noted, ${where}: ${fmtIDR(p.amt)}`, () => { removeTx(t.id); commit(); });
  if (matchMedia('(min-width: 900px)').matches) qi.focus();
});

/* Efek sentuh, kursor, dan kirim */
function replay(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
let flashTimer;
function flash(id) { ui.flash = id; clearTimeout(flashTimer); flashTimer = setTimeout(() => { ui.flash = null; }, 1800); }
function bump() { requestAnimationFrame(() => replay($('.note'), 'bump')); }
const TAPPABLE = 'button, a, select, summary, input[type="checkbox"], label.file-btn, .rows li, .jobs li, .hist li, .legend li';
document.addEventListener('pointerdown', e => {
  if (reduceMotion() || !(e.target.closest && e.target.closest(TAPPABLE))) return;
  const r = document.createElement('i');
  r.className = 'tap-ring';
  r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
  document.body.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
}, { passive: true });
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion()) {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, on = false;
  addEventListener('pointermove', e => {
    tx = e.clientX; ty = e.clientY;
    if (!on) { on = true; glow.classList.add('is-on'); requestAnimationFrame(step); }
    const card = e.target.closest && e.target.closest('.panel, .note, .quick-row, .rate-block');
    if (card) { const b = card.getBoundingClientRect(); card.style.setProperty('--mx', (e.clientX - b.left) + 'px'); card.style.setProperty('--my', (e.clientY - b.top) + 'px'); }
  }, { passive: true });
  document.addEventListener('pointerleave', () => { glow.classList.remove('is-on'); });
  function step() {
    gx += (tx - gx) * 0.14; gy += (ty - gy) * 0.14;
    glow.style.transform = `translate3d(${gx - 190}px, ${gy - 190}px, 0)`;
    if (Math.abs(tx - gx) + Math.abs(ty - gy) > 0.4) requestAnimationFrame(step); else on = false;
  }
}

/* Tooltip grafik */
document.addEventListener('pointermove', e => {
  const t = e.target.closest && e.target.closest('[data-tip]');
  if (t) showTip(t, e.clientX, e.clientY); else $('#tip').hidden = true;
});
document.addEventListener('pointerdown', e => {
  const t = e.target.closest && e.target.closest('[data-tip]');
  if (t) showTip(t, e.clientX, e.clientY);
});
addEventListener('scroll', () => { $('#tip').hidden = true; }, { passive: true });

let rz;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (!$('#app').hidden) afterRenderCharts(); }, 150); });
function afterRenderCharts() { const keep = ui.shown; afterRender(); ui.shown = keep; }

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const now = ym(new Date());
  if (cloud.user) cloud.sync();
  fetchRate();
  if (ui.lastSeenMonth && ui.lastSeenMonth !== now && ui.month === ui.lastSeenMonth) { ui.month = now; ui.shown = null; render(); }
  ui.lastSeenMonth = now;
});
ui.lastSeenMonth = ym(new Date());
setInterval(() => { if (document.visibilityState === 'visible') { if (cloud.user) cloud.sync(); } }, 60000);
setInterval(() => { if (document.visibilityState === 'visible') fetchRate(); }, 20000);
setInterval(() => { if (!$('#app').hidden && document.visibilityState === 'visible') renderRate(); }, 10000);

/* Layar masuk */
let gateMode = 'in';
$('#gateSignup').addEventListener('click', () => {
  gateMode = gateMode === 'in' ? 'up' : 'in';
  $('#gateForm .primary-btn').textContent = gateMode === 'in' ? 'Sign in' : 'Create account';
  $('#gateSignup').textContent = gateMode === 'in' ? 'Create account' : 'Sudah punya akun? Sign in';
  $('#gatePass').autocomplete = gateMode === 'in' ? 'current-password' : 'new-password';
  $('#gateMsg').textContent = '';
});
$('#gateForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#gateEmail').value.trim(), password = $('#gatePass').value, msg = $('#gateMsg');
  if (!cloud.client) { msg.textContent = 'Nggak bisa connect ke server. Cek internet lalu reload.'; return; }
  msg.textContent = gateMode === 'in' ? 'Checking…' : 'Creating…';
  try {
    const res = gateMode === 'in'
      ? await cloud.client.auth.signInWithPassword({ email, password })
      : await cloud.client.auth.signUp({ email, password, options: { emailRedirectTo: location.href.split('#')[0].split('?')[0] } });
    if (res.error) throw res.error;
    const user = res.data && (res.data.session ? res.data.session.user : null);
    if (!user) { msg.textContent = 'Akun dibuat. Confirm lewat email dari Supabase, lalu sign in.'; return; }
    cloud.user = user; cloud.adopt(); showApp(); cloud.sync();
  } catch (err) {
    const m = String(err && err.message || '');
    msg.textContent = /invalid login/i.test(m) ? 'Email atau password salah.' : /already registered/i.test(m) ? 'Email ini sudah terdaftar. Sign in aja.' : /confirm/i.test(m) ? 'Email belum confirmed. Buka link di email dari Supabase dulu.' : 'Gagal: ' + (m || 'coba lagi.');
  }
});

/* ---------- Mulai ---------- */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
if (/error_code=otp_expired|error=access_denied/.test(location.hash)) {
  $('#gateMsg').textContent = 'Link konfirmasi sudah kedaluwarsa atau sudah dipakai. Coba Sign in; kalau belum bisa, Create account lagi.';
  history.replaceState(null, '', location.pathname + location.search);
}
if (cloud.enabled) cloud.init(); else showApp();

// Untuk pengujian
window.AkadeFinance = { parseEntry, parseAmount, merge, stats, get state() { return state; }, cloud };
})();
