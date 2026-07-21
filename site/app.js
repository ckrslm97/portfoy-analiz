/* Portföy aracı — istemci mantığı.
 *
 * İki katman kesinlikle ayrıdır:
 *   DB   = app_data.json (günlük build üretir; fiyat, metrik, sinyal, kategori)
 *   USER = localStorage  (pozisyonlar, kararlar, öneri geçmişi, izleme listesi)
 * USER katmanına asla DB alanı kopyalanmaz — yalnızca kod referansı ve o an
 * dondurulmuş tarihsel gerçekler (öneri anındaki fiyat gibi). Böylece günlük
 * güncelleme veriyi tazelerken kullanıcı geçmişi bozulmadan üstüne oturur.
 */
'use strict';

const KEY = 'portfoy-araci-v1';
const SCHEMA = 1;

let DB = null;
let S = null;          // kullanıcı durumu
let storageOK = true;  // localStorage yazılabiliyor mu

/* ---------------- durum ---------------- */

function bosDurum() {
  return {
    schemaVersion: SCHEMA,
    meta: { createdAt: new Date().toISOString(), lastModifiedAt: null, lastExportAt: null },
    positions: [],       // {code, status, addedAt, removedAt, source, note}
    decisions: {},       // code -> {override, note, decidedAt}
    recommendations: [], // {id, code, category, proposedAt, proposedDataDate, proposedPrice, status}
    queue: []            // {code, requestedAt, status}
  };
}

function yukle() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); }
  catch (e) { storageOK = false; }

  if (!raw) return bosDurum();
  try {
    const d = JSON.parse(raw);
    return gocEt(d);
  } catch (e) {
    // Bozuk veriyi SESSİZCE silme — kullanıcıya haber ver, ham hâlini kurtarmasına izin ver.
    console.error('Durum bozuk:', e);
    window.__bozukDurum = raw;
    toast('Kayıtlı veri okunamadı. Drawer’dan yedek alıp sıfırlayabilirsin.', 6000);
    return bosDurum();
  }
}

function gocEt(d) {
  if (!d || typeof d !== 'object') return bosDurum();
  const v = d.schemaVersion || 0;
  if (v > SCHEMA) {
    toast('Kayıtlı veri bu sürümden yeni. Salt okunur modda açıldı.', 6000);
    storageOK = false;
    return d;
  }
  // v0 -> v1: eksik alanları ekle (yalnızca ekleme, hiçbir alan silinmez)
  const b = bosDurum();
  return Object.assign(b, d, {
    schemaVersion: SCHEMA,
    meta: Object.assign(b.meta, d.meta || {}),
    positions: d.positions || [],
    decisions: d.decisions || {},
    recommendations: d.recommendations || [],
    queue: d.queue || []
  });
}

function kaydet() {
  S.meta.lastModifiedAt = new Date().toISOString();
  if (!storageOK) return;
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) {
    storageOK = false;
    toast('Tarayıcı hafızası kapalı — bu oturumda kayıt yapılamıyor. Yedek indir.', 7000);
  }
}

/* ---------------- yardımcılar ---------------- */

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

function pct(x, d) {
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  return (x >= 0 ? '+' : '') + (x * 100).toFixed(d === undefined ? 1 : d) + '%';
}
function num(x, d) {
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  return Number(x).toFixed(d === undefined ? 2 : d);
}
function esc(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function signClass(x) { return x === null || x === undefined ? '' : (x >= 0 ? 'pos' : 'neg'); }
function gunFarki(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}
function trTarih(iso) {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

let toastT = null;
function toast(msg, ms) {
  const el = $('#toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { el.hidden = true; }, ms || 3000);
}

function kayit(code) { return (DB.portfoy && DB.portfoy[code]) || (DB.aday && DB.aday[code]) || null; }
function aktifKodlar() { return S.positions.filter(p => p.status === 'active').map(p => p.code); }

/* ---------------- sparkline ---------------- */

function sparkSVG(seri, w, h) {
  if (!seri || seri.length < 3) return '';
  const W = w || 260, H = h || 44, pad = 2;
  const lo = Math.min.apply(null, seri), hi = Math.max.apply(null, seri);
  const span = (hi - lo) || 1;
  const X = i => pad + (i / (seri.length - 1)) * (W - pad * 2);
  const Y = v => pad + (1 - (v - lo) / span) * (H - pad * 2);
  let d = '';
  seri.forEach((v, i) => { d += (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1) + ' '; });
  const area = d + 'L' + X(seri.length - 1).toFixed(1) + ' ' + (H - pad) + ' L' + pad + ' ' + (H - pad) + ' Z';
  const y100 = (lo <= 100 && hi >= 100) ? Y(100).toFixed(1) : null;
  return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
    '<path class="area" d="' + area + '"/>' +
    (y100 ? '<line class="base" x1="0" y1="' + y100 + '" x2="' + W + '" y2="' + y100 + '"/>' : '') +
    '<path class="line" d="' + d.trim() + '"/>' +
    '<circle class="end" cx="' + X(seri.length - 1).toFixed(1) + '" cy="' + Y(seri[seri.length - 1]).toFixed(1) + '" r="2.4"/>' +
    '</svg>';
}

/* ---------------- tazelik ---------------- */

function tazelikGuncelle() {
  const el = $('#freshness'), t = $('#freshText');
  const dd = DB.veri_tarihi;
  const gun = gunFarki(dd);
  const h = DB.health || null;

  // Hafta sonu, borsa kapalı olduğu için normaldir — arıza değil.
  const bugun = new Date().getDay(); // 0 Paz, 6 Cmt
  const haftaSonu = (bugun === 0 || bugun === 6);
  const beklenen = haftaSonu ? 4 : 2;

  let state = 'ok', msg = 'Veri güncel';
  if (h && h.durum === 'basarisiz') { state = 'broken'; msg = 'Son güncelleme başarısız'; }
  else if (gun > beklenen + 3) { state = 'broken'; msg = gun + ' gündür tazelenmedi'; }
  else if (gun > beklenen) { state = 'stale'; msg = gun + ' gündür tazelenmedi'; }
  else if (h && h.durum === 'kismi') { state = 'stale'; msg = 'Kısmi güncelleme'; }
  else if (gun <= 1) msg = 'Veri güncel';
  else msg = gun + ' gün önce' + (haftaSonu ? ' (borsa kapalı)' : '');

  el.dataset.state = state;
  t.textContent = trTarih(dd) + ' · ' + msg;
  el.title = 'Veri kesiti: ' + dd + (h ? ' · son çalışma: ' + h.calisma : '');

  $('#footMeta').textContent =
    'Veri kesiti ' + trTarih(dd) + '. Ölçüt ' + (DB.olcut || 'ACWI') +
    ', risksiz oran %' + ((DB.risksiz_oran || 0.04) * 100).toFixed(0) + ' (varsayım). ' +
    'Bu sayfa her gece otomatik güncellenir.';
}

/* ---------------- sekmeler ---------------- */

function sekme(ad) {
  $$('nav.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === ad)));
  $$('.panel').forEach(p => { p.hidden = p.id !== 'p-' + ad; });
  location.hash = ad;
  ciz();
}

/* ---------------- portföy ---------------- */

function seed() {
  const kodlar = Object.keys(DB.portfoy || {});
  let n = 0;
  kodlar.forEach(c => {
    if (!S.positions.some(p => p.code === c)) {
      S.positions.push({
        code: c, status: 'active', addedAt: new Date().toISOString(),
        removedAt: null, source: 'seed', note: ''
      });
      n++;
    }
  });
  kaydet(); ciz();
  toast(n + ' pozisyon yüklendi. Bunlar rapordaki portföyün — gerçek maliyet bazın değil.', 5000);
}

function cizPortfoy() {
  const akt = aktifKodlar();
  const kayitlar = akt.map(kayit).filter(Boolean);
  const sig = { AL: 0, SAT: 0, BEKLE: 0 };
  kayitlar.forEach(r => { if (r.sinyal) sig[r.sinyal]++; });

  const kats = DB.kategoriler || {};
  const katAdlar = Object.keys(kats);
  const dolu = katAdlar.filter(k => kats[k].some(c => akt.includes(c)));

  $('#portStats').innerHTML = [
    ['Pozisyon', akt.length, 'aktif enstrüman'],
    ['Al sinyali', sig.AL, 'kurallara göre'],
    ['Sat sinyali', sig.SAT, 'gözden geçir'],
    ['Kategori boşluğu', (katAdlar.length - dolu.length) + '/' + katAdlar.length, 'hiç maruziyet yok']
  ].map(x => '<div class="card stat"><div class="k">' + x[0] + '</div><div class="v">' +
    x[1] + '</div><div class="s">' + x[2] + '</div></div>').join('');

  $('#catCoverage').innerHTML = katAdlar.map(k => {
    const sahip = kats[k].filter(c => akt.includes(c));
    const ok = sahip.length > 0;
    return '<div class="card" style="display:flex;align-items:center;gap:10px">' +
      '<span class="chip ' + (ok ? 'chip-al' : 'chip-n') + '">' + (ok ? 'var' : 'yok') + '</span>' +
      '<div><div style="font-weight:600;font-size:13.5px">' + esc(k) + '</div>' +
      '<div style="font-size:12px;color:var(--muted)" class="num">' +
      (ok ? sahip.join(', ') : kats[k].length + ' aday hazır') + '</div></div></div>';
  }).join('');

  if (!akt.length) {
    $('#portList').innerHTML = '<div class="empty"><strong>Portföyün boş</strong>' +
      'Rapordaki 38 enstrümanı yüklemek için yukarıdaki düğmeyi kullan, ' +
      'ya da <em>Ekle / Çıkar</em> sekmesinden tek tek ekle.</div>';
    return;
  }

  const rows = akt.map(c => {
    const r = kayit(c) || {};
    const d = S.decisions[c];
    return '<tr><td class="tick">' + esc(c) + '</td>' +
      '<td class="l" style="max-width:280px">' + esc(r.ad || '—') + '</td>' +
      '<td><span class="chip chip-n">' + esc(r.tip || '—') + '</span></td>' +
      '<td class="num ' + signClass(r.cagr) + '">' + pct(r.cagr) + '</td>' +
      '<td class="num">' + num(r.sharpe) + '</td>' +
      '<td class="num neg">' + pct(r.maxdd, 0) + '</td>' +
      '<td><span class="chip chip-' + String(r.sinyal || 'n').toLowerCase() + '">' + esc(r.sinyal || '—') + '</span></td>' +
      '<td>' + (d && d.override ? '<span class="chip chip-acc">' + esc(d.override) + '</span>' : '<span style="color:var(--muted)">—</span>') + '</td>' +
      '</tr>';
  }).join('');

  $('#portList').innerHTML = '<div class="scroll"><table><thead><tr>' +
    '<th>Kod</th><th class="l">Ad</th><th>Tip</th><th>CAGR</th><th>Sharpe</th>' +
    '<th>Maks. düşüş</th><th>Sinyal</th><th>Kararın</th></tr></thead><tbody>' +
    rows + '</tbody></table></div>';
}

/* ---------------- karar ---------------- */

let kararFiltre = 'hepsi';

function cizKarar() {
  const akt = aktifKodlar();
  $('#bKarar').textContent = akt.filter(c => {
    const r = kayit(c); return r && (r.sinyal === 'AL' || r.sinyal === 'SAT');
  }).length;

  let liste = akt.slice();
  if (kararFiltre === 'ayrisan') {
    liste = liste.filter(c => {
      const r = kayit(c), d = S.decisions[c];
      return r && d && d.override && d.override !== r.sinyal;
    });
  } else if (kararFiltre !== 'hepsi') {
    liste = liste.filter(c => { const r = kayit(c); return r && r.sinyal === kararFiltre; });
  }

  const sira = { SAT: 0, AL: 1, BEKLE: 2 };
  liste.sort((a, b) => {
    const ra = kayit(a) || {}, rb = kayit(b) || {};
    const d = (sira[ra.sinyal] ?? 3) - (sira[rb.sinyal] ?? 3);
    return d !== 0 ? d : (ra.puan || 0) - (rb.puan || 0);
  });

  if (!liste.length) {
    $('#kararList').innerHTML = '<div class="empty"><strong>Bu filtrede pozisyon yok</strong>' +
      (akt.length ? 'Başka bir filtre dene.' : 'Önce portföyüne pozisyon ekle.') + '</div>';
    return;
  }

  $('#kararList').innerHTML = liste.map(c => {
    const r = kayit(c) || {};
    const d = S.decisions[c] || {};
    const kapi = r.kapi ? '<span class="chip chip-n">kapı: ' + esc(r.kapi) + '</span>' : '';
    const nedenler = (r.nedenler || []).map(n => '<li>' + esc(n) + '</li>').join('');
    const secili = o => 'aria-pressed="' + (d.override === o ? 'true' : 'false') + '"';
    return '<div class="decision" data-sig="' + esc(r.sinyal || '') + '">' +
      '<div><div class="hd">' +
        '<span class="tick" style="font-size:15px">' + esc(c) + '</span>' +
        '<span class="chip chip-' + String(r.sinyal || 'n').toLowerCase() + '">Kural: ' + esc(r.sinyal || '—') + '</span>' +
        (r.puan !== undefined && !r.kapi ? '<span class="chip chip-n">puan ' + (r.puan > 0 ? '+' : '') + r.puan + '</span>' : '') +
        kapi +
        (d.override ? '<span class="chip chip-acc">Senin kararın: ' + esc(d.override) + '</span>' : '') +
      '</div>' +
      '<div class="nm">' + esc(r.ad || '') + '</div>' +
      '<ul>' + nedenler + '</ul>' +
      (d.note ? '<div style="margin-top:8px;font-size:12.5px;color:var(--muted)"><em>Notun:</em> ' + esc(d.note) + '</div>' : '') +
      '</div>' +
      '<div class="actions">' +
        '<label>senin kararın</label>' +
        '<div class="seg" data-code="' + esc(c) + '">' +
          '<button type="button" data-o="AL" ' + secili('AL') + '>Al</button>' +
          '<button type="button" data-o="BEKLE" ' + secili('BEKLE') + '>Bekle</button>' +
          '<button type="button" data-o="SAT" ' + secili('SAT') + '>Sat</button>' +
        '</div>' +
        '<div class="row"><button class="btn ghost sm" data-note="' + esc(c) + '" type="button">not</button>' +
        '<button class="btn ghost sm" data-remove="' + esc(c) + '" type="button">çıkar</button></div>' +
      '</div></div>';
  }).join('');
}

/* ---------------- ekle / çıkar ---------------- */

function cizEkle() {
  const q = S.queue.filter(x => x.status === 'queued');
  $('#queueCount').textContent = q.length;
  $('#queueList').innerHTML = q.length
    ? q.map(x => '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--rule)">' +
        '<span class="tick">' + esc(x.code) + '</span>' +
        '<span style="font-size:12px;color:var(--muted);margin-right:auto">' + trTarih(x.requestedAt) + '</span>' +
        '<button class="btn ghost sm" data-unqueue="' + esc(x.code) + '" type="button">sil</button></div>').join('')
    : '<p style="font-size:13px;color:var(--muted);margin:0">Kuyruk boş.</p>';

  const rem = S.positions.filter(p => p.status === 'removed');
  $('#removedList').innerHTML = rem.length
    ? '<div class="scroll"><table><thead><tr><th>Kod</th><th class="l">Ad</th><th>Çıkarıldı</th><th></th></tr></thead><tbody>' +
      rem.map(p => { const r = kayit(p.code) || {};
        return '<tr><td class="tick">' + esc(p.code) + '</td><td class="l">' + esc(r.ad || '—') + '</td>' +
        '<td class="num">' + trTarih(p.removedAt) + '</td>' +
        '<td><button class="btn ghost sm" data-restore="' + esc(p.code) + '" type="button">geri al</button></td></tr>';
      }).join('') + '</tbody></table></div>'
    : '<div class="empty">Henüz hiçbir pozisyonu çıkarmadın.</div>';
}

function ekle(codeRaw) {
  const code = String(codeRaw || '').trim().toUpperCase();
  if (!code) return;
  const hint = $('#addHint');

  const mevcut = S.positions.find(p => p.code === code);
  if (mevcut && mevcut.status === 'active') {
    hint.innerHTML = '<span class="warnc">' + esc(code) + ' zaten portföyünde.</span>';
    return;
  }
  const r = kayit(code);
  if (r) {
    if (mevcut) { mevcut.status = 'active'; mevcut.removedAt = null; }
    else S.positions.push({ code, status: 'active', addedAt: new Date().toISOString(), removedAt: null, source: 'manual', note: '' });
    // Bu kod bir öneriyse, öneriyi "eklendi" olarak işaretle.
    S.recommendations.forEach(x => { if (x.code === code && x.status === 'pending') x.status = 'added'; });
    kaydet(); ciz();
    hint.innerHTML = '<span class="pos">' + esc(code) + ' eklendi.</span> ' + esc(r.ad || '');
    $('#addInput').value = '';
  } else {
    if (S.queue.some(x => x.code === code && x.status === 'queued')) {
      hint.innerHTML = '<span class="warnc">' + esc(code) + ' zaten izleme listesinde.</span>';
      return;
    }
    S.queue.push({ code, requestedAt: new Date().toISOString(), status: 'queued' });
    kaydet(); ciz();
    hint.innerHTML = '<strong>' + esc(code) + '</strong> veri setinde yok — izleme listesine alındı. ' +
      'Bu kodu depodaki <code style="font-family:var(--mono)">watchlist.json</code> dosyasına eklersen ' +
      'sonraki gece otomatik araştırılıp veri setine katılır.';
    $('#addInput').value = '';
  }
}

function oner(codeRaw) {
  const q = String(codeRaw || '').trim().toUpperCase();
  if (!q) { $('#addResults').innerHTML = ''; return; }
  const akt = aktifKodlar();
  const hepsi = Object.assign({}, DB.portfoy, DB.aday);
  const hit = Object.keys(hepsi)
    .filter(c => c.indexOf(q) === 0 || (hepsi[c].ad || '').toUpperCase().indexOf(q) >= 0)
    .filter(c => akt.indexOf(c) < 0).slice(0, 6);
  $('#addResults').innerHTML = hit.length
    ? hit.map(c => { const r = hepsi[c];
        return '<div style="display:flex;align-items:center;gap:9px;padding:6px 0;border-bottom:1px solid var(--rule)">' +
        '<span class="tick">' + esc(c) + '</span>' +
        '<span style="font-size:12.5px;color:var(--muted);margin-right:auto;overflow:hidden;text-overflow:ellipsis">' + esc(r.ad || '') + '</span>' +
        (r.kategori ? '<span class="chip chip-n">' + esc(r.kategori) + '</span>' : '') +
        '<button class="btn sm" data-add="' + esc(c) + '" type="button">ekle</button></div>';
      }).join('')
    : '<p style="font-size:12.5px;color:var(--muted);margin:6px 0 0">Veri setinde eşleşme yok — ' +
      '“Ekle”ye basarsan izleme listesine alınır.</p>';
}

/* ---------------- pivot / karşılaştırma ---------------- */

//: Satır/sütun için seçilebilir kategorik boyutlar.
const PDIMS = {
  tema:    { label: 'Tema',              get: r => r.tema || 'Diğer' },
  tip:     { label: 'Tip',               get: r => r.tip || '—' },
  sinyal:  { label: 'Sinyal',            get: r => r.sinyal || '—' },
  risk:    { label: 'Risk',              get: r => r.risk === 'dusuk' ? 'Düşük' : r.risk === 'orta' ? 'Orta' : r.risk === 'yuksek' ? 'Yüksek' : 'Veri yok' },
  kapsam:  { label: 'Kapsam',            get: r => r.__kapsam },
  yeterli: { label: 'Geçmiş yeterli mi', get: r => r.yillik_gecerli ? 'Evet' : 'Hayır' },
};
const PDIM_ORDER = ['tema', 'tip', 'sinyal', 'risk', 'kapsam', 'yeterli'];

//: Hücreye atanabilecek sayısal metrikler. polarity: diverging (0 merkezli,
//: yeşil/kırmızı) | sequential (0..maks, aksan tonu) | negonly (yalnız ≤0, kırmızı).
const PMETRICS = {
  cagr:   { label: 'CAGR (USD)',        get: r => r.cagr,          fmt: 'pct1',  polarity: 'diverging' },
  vol:    { label: 'Volatilite',        get: r => r.vol,           fmt: 'pct1',  polarity: 'sequential' },
  sharpe: { label: 'Sharpe',            get: r => r.sharpe,        fmt: 'num2',  polarity: 'diverging' },
  sortino:{ label: 'Sortino',           get: r => r.sortino,       fmt: 'num2',  polarity: 'diverging' },
  maxdd:  { label: 'Maks. düşüş',       get: r => r.maxdd,         fmt: 'pct0',  polarity: 'negonly' },
  beta:   { label: 'Beta (ACWI)',       get: r => r.beta,          fmt: 'num2',  polarity: 'sequential' },
  alpha:  { label: 'Alfa',              get: r => r.alpha,         fmt: 'pct1',  polarity: 'diverging' },
  gider:  { label: 'Gider oranı',       get: r => r.gider,         fmt: 'raw%',  polarity: 'sequential' },
  r1y:    { label: '1 yıl getiri',      get: r => r.r1y,           fmt: 'pct1',  polarity: 'diverging' },
  r3y:    { label: '3 yıl getiri',      get: r => r.r3y,           fmt: 'pct1',  polarity: 'diverging' },
  r5y:    { label: '5 yıl getiri',      get: r => r.r5y,           fmt: 'pct1',  polarity: 'diverging' },
  puan:   { label: 'Kural puanı',       get: r => r.puan,          fmt: 'int',   polarity: 'diverging' },
  oskor:  { label: 'Öneri skoru',       get: r => r.oneri_skoru,   fmt: 'num2',  polarity: 'sequential' },
  cakisma:{ label: 'En yüksek çakışma', get: r => r.en_yuksek_cakisma !== undefined ? r.en_yuksek_cakisma / 100 : null, fmt: 'pct1', polarity: 'sequential' },
  korel:  { label: 'En yüksek korelasyon', get: r => r.en_yuksek_korelasyon, fmt: 'num2', polarity: 'sequential' },
  adet:   { label: 'Adet',              get: () => 1,              fmt: 'int',   polarity: 'sequential', countOnly: true },
};
const PMETRIC_ORDER = ['adet', 'cagr', 'sharpe', 'sortino', 'vol', 'maxdd', 'beta', 'alpha',
  'r1y', 'r3y', 'r5y', 'gider', 'puan', 'oskor', 'cakisma', 'korel'];

//: Filtre durumu: her boyut için seçili değer kümesi. Boş küme = filtre yok.
const pvFilter = { tema: new Set(), tip: new Set(), sinyal: new Set(), risk: new Set(), kapsam: new Set() };
let pvRow = 'tema', pvCol = 'sinyal', pvVal = 'cagr', pvAgg = 'ort';
let pvSelected = null; // {rk, ck} — tıklanan hücre

function pivotEvren() {
  const akt = new Set(aktifKodlar());
  const A = Object.keys(DB.portfoy || {}).map(c => Object.assign({ code: c }, DB.portfoy[c], {
    __kapsam: akt.has(c) ? 'Portföyümde' : 'Portföyümde değil (rapor)'
  }));
  const seen = new Set(A.map(x => x.code));
  const B = Object.keys(DB.aday || {}).filter(c => !seen.has(c)).map(c => Object.assign({ code: c }, DB.aday[c], {
    __kapsam: akt.has(c) ? 'Portföyümde' : 'Aday'
  }));
  return A.concat(B);
}

function pivotFiltrele(items) {
  return items.filter(it =>
    Object.keys(pvFilter).every(d => {
      const s = pvFilter[d];
      if (!s.size) return true;
      return s.has(PDIMS[d].get(it));
    })
  );
}

function fmtDeger(v, fmt) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  if (fmt === 'pct1') return (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
  if (fmt === 'pct0') return (v >= 0 ? '+' : '') + (v * 100).toFixed(0) + '%';
  if (fmt === 'raw%') return v.toFixed(2) + '%';
  if (fmt === 'int') return String(Math.round(v));
  return v.toFixed(2);
}

function toplama(vals, agg) {
  if (!vals.length) return null;
  const s = vals.slice().sort((a, b) => a - b);
  if (agg === 'top') return vals.reduce((a, b) => a + b, 0);
  if (agg === 'min') return s[0];
  if (agg === 'mak') return s[s.length - 1];
  if (agg === 'med') { const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  return vals.reduce((a, b) => a + b, 0) / vals.length; // ortalama
}

function pivotHesapla() {
  const items = pivotFiltrele(pivotEvren());
  const rowGet = PDIMS[pvRow].get, colGet = pvCol === 'none' ? null : PDIMS[pvCol].get;
  const metrik = PMETRICS[pvVal];

  const rowKeys = [], colKeys = colGet ? [] : ['Tümü'];
  const cells = {}; // rk|ck -> {vals:[], codes:[]}

  items.forEach(it => {
    const rk = rowGet(it), ck = colGet ? colGet(it) : 'Tümü';
    if (rowKeys.indexOf(rk) < 0) rowKeys.push(rk);
    if (colGet && colKeys.indexOf(ck) < 0) colKeys.push(ck);
    const key = rk + '|' + ck;
    if (!cells[key]) cells[key] = { vals: [], codes: [] };
    const v = metrik.get(it);
    if (v !== null && v !== undefined && !Number.isNaN(v)) { cells[key].vals.push(v); cells[key].codes.push(it.code); }
    else if (metrik.countOnly) cells[key].codes.push(it.code);
  });

  rowKeys.sort(); colKeys.sort();

  const grid = {};
  let maxAbs = 0, maxMag = 0;
  rowKeys.forEach(rk => {
    grid[rk] = {};
    colKeys.forEach(ck => {
      const c = cells[rk + '|' + ck];
      const agg = metrik.countOnly ? c ? c.codes.length : 0 : (c && c.vals.length ? toplama(c.vals, pvAgg) : null);
      grid[rk][ck] = { agg, n: c ? c.codes.length : 0, codes: c ? c.codes : [] };
      if (agg !== null) { maxAbs = Math.max(maxAbs, Math.abs(agg)); maxMag = Math.max(maxMag, agg); }
    });
  });

  return { rowKeys, colKeys, grid, itemCount: items.length, maxAbs: maxAbs || 1, maxMag: maxMag || 1 };
}

function heatStyle(agg, polarity, maxAbs, maxMag) {
  if (agg === null || agg === undefined) return '';
  if (polarity === 'negonly') {
    const t = Math.min(1, Math.abs(agg) / (maxAbs || 1));
    return 'background:color-mix(in srgb, var(--neg-bg) ' + (t * 100).toFixed(0) + '%, var(--surface))';
  }
  if (polarity === 'sequential') {
    const t = Math.min(1, agg / (maxMag || 1));
    return 'background:color-mix(in srgb, var(--accent-soft) ' + (t * 100).toFixed(0) + '%, var(--surface))';
  }
  // diverging
  const t = Math.min(1, Math.abs(agg) / (maxAbs || 1));
  const tok = agg >= 0 ? '--pos-bg' : '--neg-bg';
  return 'background:color-mix(in srgb, var(' + tok + ') ' + (t * 100).toFixed(0) + '%, var(--surface))';
}

function pivotSecenekleriDoldur() {
  const rowSel = $('#pvRow'), colSel = $('#pvCol'), valSel = $('#pvVal');
  rowSel.innerHTML = PDIM_ORDER.map(d => '<option value="' + d + '">' + PDIMS[d].label + '</option>').join('');
  colSel.innerHTML = '<option value="none">— (tek sütun)</option>' +
    PDIM_ORDER.map(d => '<option value="' + d + '">' + PDIMS[d].label + '</option>').join('');
  valSel.innerHTML = PMETRIC_ORDER.map(m => '<option value="' + m + '">' + PMETRICS[m].label + '</option>').join('');
  rowSel.value = pvRow; colSel.value = pvCol; valSel.value = pvVal;
  $('#pvAgg').value = pvAgg;

  rowSel.addEventListener('change', () => { pvRow = rowSel.value; pvSelected = null; cizPivot(); });
  colSel.addEventListener('change', () => { pvCol = colSel.value; pvSelected = null; cizPivot(); });
  valSel.addEventListener('change', () => {
    pvVal = valSel.value;
    if (PMETRICS[pvVal].countOnly) { pvAgg = 'top'; $('#pvAgg').value = 'top'; }
    cizPivot();
  });
  $('#pvAgg').addEventListener('change', () => { pvAgg = $('#pvAgg').value; cizPivot(); });
  $('#pivotReset').addEventListener('click', () => {
    Object.keys(pvFilter).forEach(k => pvFilter[k].clear());
    pvSelected = null; cizPivot();
  });
}

function cizPivotFiltreler() {
  const items = pivotEvren();
  const box = $('#pivotFilters');
  box.innerHTML = ['tema', 'tip', 'sinyal', 'risk', 'kapsam'].map(d => {
    const sayim = {};
    items.forEach(it => { const k = PDIMS[d].get(it); sayim[k] = (sayim[k] || 0) + 1; });
    const anahtarlar = Object.keys(sayim).sort();
    const aktifSayi = pvFilter[d].size;
    return '<div class="filtergrp"><div class="fl2">' + PDIMS[d].label +
      (aktifSayi ? '<button type="button" data-clearf="' + d + '">temizle (' + aktifSayi + ')</button>' : '') +
      '</div><div class="chiprow">' +
      anahtarlar.map(k => '<button type="button" class="fchip" data-fd="' + d + '" data-fk="' + esc(k) + '" ' +
        'aria-pressed="' + pvFilter[d].has(k) + '">' + esc(k) + '<span class="n">' + sayim[k] + '</span></button>').join('') +
      '</div></div>';
  }).join('');
}

function cizPivot() {
  if (!DB) return;
  const items = pivotFiltrele(pivotEvren());
  $('#pivotTotal').textContent = items.length;
  $('#bPivot').textContent = items.length;

  cizPivotFiltreler();

  const { rowKeys, colKeys, grid, maxAbs, maxMag } = pivotHesapla();
  const metrik = PMETRICS[pvVal];

  if (!rowKeys.length) {
    $('#pivotTableWrap').innerHTML = '<div class="empty"><strong>Bu filtrede enstrüman yok</strong>Filtreleri gevşet.</div>';
    $('#pivotDrill').innerHTML = '';
    return;
  }

  let html = '<div class="scroll"><table class="pivot-table"><thead><tr><th class="corner rowhead">' +
    esc(PDIMS[pvRow].label) + ' \\ ' + esc(pvCol === 'none' ? metrik.label : PDIMS[pvCol].label) + '</th>';
  colKeys.forEach(ck => { html += '<th>' + esc(ck) + '</th>'; });
  html += '</tr></thead><tbody>';

  rowKeys.forEach(rk => {
    html += '<tr><th class="rowhead">' + esc(rk) + '</th>';
    colKeys.forEach(ck => {
      const cell = grid[rk][ck];
      const sec = pvSelected && pvSelected.rk === rk && pvSelected.ck === ck;
      if (cell.agg === null || cell.n === 0) {
        html += '<td><span class="pcell empty">—</span></td>';
      } else {
        html += '<td style="' + heatStyle(cell.agg, metrik.polarity, maxAbs, maxMag) + '">' +
          '<button type="button" class="pcell' + (sec ? ' selected' : '') + '" data-rk="' + esc(rk) + '" data-ck="' + esc(ck) + '">' +
          fmtDeger(cell.agg, metrik.fmt) +
          (metrik.countOnly ? '' : '<span class="n">n=' + cell.n + '</span>') +
          '</button></td>';
      }
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  $('#pivotTableWrap').innerHTML = html;

  if (pvSelected) cizDrill(pvSelected.rk, pvSelected.ck, grid);
  else $('#pivotDrill').innerHTML = '<p style="font-size:12.5px;color:var(--muted)">Bir hücreye tıkla — altındaki fonları listeleyeyim.</p>';
}

function cizDrill(rk, ck, grid) {
  const cell = grid && grid[rk] && grid[rk][ck];
  if (!cell || !cell.codes.length) { $('#pivotDrill').innerHTML = ''; return; }
  const metrik = PMETRICS[pvVal];
  const satirlar = cell.codes.map(c => {
    const r = kayit(c) || {};
    const v = metrik.get(r);
    return { c, ad: r.ad || '', v };
  }).sort((a, b) => (b.v || -Infinity) - (a.v || -Infinity));

  $('#pivotDrill').innerHTML =
    '<h4 style="font-size:12px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin:0 0 8px">' +
    esc(rk) + (ck !== 'Tümü' ? ' · ' + esc(ck) : '') + ' — ' + satirlar.length + ' fon</h4>' +
    '<div class="drill-list">' + satirlar.map(s =>
      '<div class="drill-row"><span class="tick">' + esc(s.c) + '</span>' +
      '<span class="nm">' + esc(s.ad) + '</span>' +
      '<span class="num ' + (metrik.polarity === 'diverging' ? signClass(s.v) : '') + '">' + fmtDeger(s.v, metrik.fmt) + '</span></div>'
    ).join('') + '</div>';
}

/* ---------------- öneri motoru ---------------- */

function bosluklar() {
  const akt = aktifKodlar();
  const kats = DB.kategoriler || {};
  return Object.keys(kats)
    .filter(k => !kats[k].some(c => akt.includes(c)))
    .map(k => {
      const gosterilen = S.recommendations.map(r => r.code);
      const adaylar = kats[k]
        .filter(c => DB.aday[c] && !akt.includes(c))
        .sort((a, b) => (DB.aday[b].oneri_skoru || 0) - (DB.aday[a].oneri_skoru || 0));
      return { kat: k, adaylar, kalan: adaylar.filter(c => gosterilen.indexOf(c) < 0) };
    });
}

function yeniOneri() {
  const bs = bosluklar().filter(b => b.kalan.length);
  if (!bs.length) {
    toast('Tüm kategorilerdeki adayları gösterdim. Yeni aday araştırılması gerekiyor.', 6000);
    const not = 'YENI_ADAY_ARASTIR';
    if (!S.queue.some(x => x.code === not)) {
      S.queue.push({ code: not, requestedAt: new Date().toISOString(), status: 'queued' });
      kaydet(); ciz();
    }
    return;
  }
  // En büyük boşluk önce: adayı en yüksek skorlu olan kategori
  bs.sort((a, b) => (DB.aday[b.kalan[0]].oneri_skoru || 0) - (DB.aday[a.kalan[0]].oneri_skoru || 0));
  const b = bs[0], code = b.kalan[0], r = DB.aday[code];
  S.recommendations.push({
    id: 'rec_' + DB.veri_tarihi + '_' + code,
    code, category: b.kat,
    proposedAt: new Date().toISOString(),
    proposedDataDate: DB.veri_tarihi,
    proposedPrice: r.son_fiyat,
    status: 'pending'
  });
  kaydet(); ciz();
  toast(code + ' önerildi — ' + b.kat + ' kategorisi.', 4000);
}

function cizOneri() {
  const bs = bosluklar();
  $('#bOneri').textContent = bs.length;

  const pend = S.recommendations.filter(r => r.status === 'pending');
  const son = pend[pend.length - 1];

  $('#recCurrent').innerHTML = son ? kartOneri(son, true)
    : '<div class="empty"><strong>Henüz öneri istemedin</strong>' +
      'Yukarıdaki <em>Yeni öneri getir</em> düğmesine bas — portföyünde en büyük boşluğu ' +
      'olan kategoriden en iyi adayı getireyim.</div>';

  $('#gapList').innerHTML = bs.length ? bs.map(b => {
    const ilk = b.kalan[0] || b.adaylar[0];
    const r = ilk ? DB.aday[ilk] : null;
    return '<div class="card">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
        '<strong style="font-size:14.5px;margin-right:auto">' + esc(b.kat) + '</strong>' +
        '<span class="chip chip-n">' + (b.adaylar.length - b.kalan.length) + '/' + b.adaylar.length + ' gösterildi</span>' +
      '</div>' +
      (r ? '<div style="display:flex;align-items:center;gap:9px">' +
        '<span class="tick">' + esc(ilk) + '</span>' +
        '<span style="font-size:12.5px;color:var(--muted);margin-right:auto">' + esc(r.ad || '') + '</span>' +
        '<button class="btn ghost sm" data-add="' + esc(ilk) + '" type="button">ekle</button></div>'
        : '<p style="margin:0;font-size:13px;color:var(--muted)">Aday kalmadı.</p>') +
      '</div>';
  }).join('') : '<div class="empty"><strong>Kategori boşluğun yok</strong>Tanımlı kategorilerin hepsinde en az bir pozisyonun var.</div>';
}

function kartOneri(rec, aktif) {
  const r = DB.aday[rec.code] || kayit(rec.code) || {};
  const bilesen = [
    ['Sharpe', num(r.sharpe), r.sharpe],
    ['Gider', r.gider !== null && r.gider !== undefined ? '%' + num(r.gider) : '—', null],
    ['Portföyle en yüksek ρ', num(r.en_yuksek_korelasyon), null],
    ['Alfa', pct(r.alpha), r.alpha]
  ].map(x => '<div><div style="font-family:var(--mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)">' +
    x[0] + '</div><div class="num ' + (x[2] !== null && x[2] !== undefined ? signClass(x[2]) : '') +
    '" style="font-size:16px;font-weight:600">' + x[1] + '</div></div>').join('');

  return '<div class="card hi" style="border-left:3px solid var(--accent)">' +
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">' +
      '<span class="tick" style="font-size:17px">' + esc(rec.code) + '</span>' +
      '<span class="chip chip-acc">' + esc(rec.category) + '</span>' +
      '<span class="chip chip-n">skor ' + num(r.oneri_skoru) + '</span>' +
      '<span style="margin-left:auto;font-size:12px;color:var(--muted)">' + trTarih(rec.proposedDataDate) + ' verisiyle önerildi</span>' +
    '</div>' +
    '<div style="font-size:13.5px;color:var(--ink-2);margin-bottom:12px">' + esc(r.ad || '') +
      (r.aum ? ' · AUM ' + esc(r.aum) : '') + '</div>' +
    '<div class="grid g4" style="margin-bottom:12px">' + bilesen + '</div>' +
    (aktif ? '<div style="display:flex;gap:8px">' +
      '<button class="btn" data-add="' + esc(rec.code) + '" type="button">Portföye ekle</button>' +
      '<button class="btn ghost" data-dismiss="' + esc(rec.id) + '" type="button">İlgilenmiyorum</button></div>' : '') +
    '</div>';
}

/* ---------------- öneri takibi ---------------- */

function cizTakip() {
  const izlenen = S.recommendations.filter(r => r.status === 'pending' || r.status === 'dismissed');
  $('#bTakip').textContent = izlenen.length;

  if (!izlenen.length) {
    $('#trackList').innerHTML = '<div class="empty"><strong>Takip edilecek öneri yok</strong>' +
      '<em>Tavsiye Motoru</em>’ndan öneri aldığında ve portföyüne eklemediğinde, ' +
      'o fonun gelişimi burada görünür.</div>';
    return;
  }

  $('#trackList').innerHTML = '<div class="grid g2">' + izlenen.slice().reverse().map(rec => {
    const r = DB.aday[rec.code] || kayit(rec.code) || {};
    const simdi = r.son_fiyat;
    const o = rec.proposedPrice;
    const ayniGun = rec.proposedDataDate === DB.veri_tarihi;
    const delta = (o && simdi && !ayniGun) ? (simdi / o - 1) : null;
    const seri = (DB.spark && DB.spark[rec.code]) || null;

    let perf;
    if (ayniGun) {
      // Aynı veri kesitinde öneri ve "güncel" fiyat aynı noktadır — sahte %0,0 gösterme.
      perf = '<div class="note" style="margin:0"><p style="font-size:12.5px">' +
        'Bu öneri bugünkü veriyle yapıldı. Karşılaştırma <strong>yarınki güncellemeden</strong> sonra anlamlı olur.</p></div>';
    } else {
      perf = '<div style="display:flex;align-items:baseline;gap:10px">' +
        '<span class="num ' + signClass(delta) + '" style="font-size:24px;font-weight:600">' + pct(delta) + '</span>' +
        '<span style="font-size:12px;color:var(--muted)" class="num">' + num(o) + ' → ' + num(simdi) + '</span></div>';
    }

    return '<div class="card">' +
      '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:8px">' +
        '<span class="tick" style="font-size:15px">' + esc(rec.code) + '</span>' +
        '<span class="chip chip-acc">' + esc(rec.category) + '</span>' +
        (rec.status === 'dismissed' ? '<span class="chip chip-n">ilgilenmedin</span>' : '') +
        '<span style="margin-left:auto;font-size:11.5px;color:var(--muted)">' + trTarih(rec.proposedDataDate) + '’den beri</span>' +
      '</div>' +
      perf +
      (seri ? '<div style="margin-top:10px">' + sparkSVG(seri) +
        '<div style="font-size:11px;color:var(--muted);margin-top:2px">son 2 yıl · ilk gözlem = 100</div></div>' : '') +
      '<div style="margin-top:11px;display:flex;gap:7px">' +
        '<button class="btn sm" data-add="' + esc(rec.code) + '" type="button">şimdi ekle</button>' +
        '<button class="btn ghost sm" data-forget="' + esc(rec.id) + '" type="button">takipten çıkar</button>' +
      '</div></div>';
  }).join('') + '</div>';
}

/* ---------------- dışa/içe aktarım ---------------- */

function indir(ad, icerik, tip) {
  const blob = new Blob([icerik], { type: tip || 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = ad;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function disaAktar() {
  S.meta.lastExportAt = new Date().toISOString();
  kaydet();
  indir('portfoy-durum-' + DB.veri_tarihi + '.json', JSON.stringify(S, null, 1));
  ciz();
  toast('Durum indirildi.');
}

function watchlistIndir() {
  const kodlar = S.queue.filter(x => x.status === 'queued' && x.code !== 'YENI_ADAY_ARASTIR').map(x => x.code);
  indir('watchlist.json', JSON.stringify({ ekle: kodlar }, null, 2));
  toast('watchlist.json indirildi — depodaki dosyayla değiştir ve commit’le.', 5000);
}

/* ---------------- olaylar ---------------- */

function baglaOlaylar() {
  $$('nav.tabs button').forEach(b => b.addEventListener('click', () => sekme(b.dataset.tab)));

  $('#themeBtn').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : (cur === 'light' ? '' : 'dark');
    if (next) document.documentElement.setAttribute('data-theme', next);
    else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem(KEY + ':theme', next); } catch (e) { /* yok say */ }
  });

  $('#drawerBtn').addEventListener('click', () => { $('#drawer').setAttribute('open', ''); });
  $('#drawerClose').addEventListener('click', () => { $('#drawer').removeAttribute('open'); });
  $('#drawer').addEventListener('click', e => { if (e.target.id === 'drawer') $('#drawer').removeAttribute('open'); });

  $('#seedBtn').addEventListener('click', seed);
  $('#addBtn').addEventListener('click', () => ekle($('#addInput').value));
  $('#addInput').addEventListener('input', e => oner(e.target.value));
  $('#addInput').addEventListener('keydown', e => { if (e.key === 'Enter') ekle(e.target.value); });
  $('#newRecBtn').addEventListener('click', yeniOneri);
  $('#queueExport').addEventListener('click', watchlistIndir);
  $('#queueCopy').addEventListener('click', () => {
    const k = S.queue.filter(x => x.status === 'queued').map(x => x.code);
    const metin = k.length
      ? 'Şu kodları araştırıp veri setine ekler misin: ' + k.join(', ')
      : 'İzleme listem boş.';
    navigator.clipboard.writeText(metin).then(
      () => toast('İstek metni kopyalandı.'),
      () => toast('Kopyalanamadı — metni elle al: ' + metin, 6000)
    );
  });

  $('#exportBtn').addEventListener('click', disaAktar);
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        S = gocEt(JSON.parse(rd.result));
        kaydet(); ciz();
        toast('Yedek yüklendi.');
      } catch (err) { toast('Dosya okunamadı: geçerli bir JSON değil.', 5000); }
    };
    rd.readAsText(f);
    e.target.value = '';
  });
  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Tüm pozisyonların, kararların ve öneri geçmişin silinecek. Emin misin?')) return;
    S = bosDurum(); kaydet(); ciz(); toast('Sıfırlandı.');
  });

  $('#karFilter').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    kararFiltre = b.dataset.f;
    $$('#karFilter button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    cizKarar();
  });

  // Panel içi delege olaylar
  document.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;

    if (t.dataset.add) { ekle(t.dataset.add); return; }

    if (t.dataset.fd) {
      const d = t.dataset.fd, k = t.dataset.fk;
      if (pvFilter[d].has(k)) pvFilter[d].delete(k); else pvFilter[d].add(k);
      pvSelected = null; cizPivot(); return;
    }
    if (t.dataset.clearf) {
      pvFilter[t.dataset.clearf].clear(); pvSelected = null; cizPivot(); return;
    }
    if (t.classList.contains('pcell') && t.dataset.rk !== undefined) {
      const rk = t.dataset.rk, ck = t.dataset.ck;
      pvSelected = (pvSelected && pvSelected.rk === rk && pvSelected.ck === ck) ? null : { rk, ck };
      cizPivot();
      return;
    }

    if (t.dataset.remove) {
      const c = t.dataset.remove;
      const p = S.positions.find(x => x.code === c && x.status === 'active');
      if (p) { p.status = 'removed'; p.removedAt = new Date().toISOString(); kaydet(); ciz(); toast(c + ' çıkarıldı — geri alınabilir.'); }
      return;
    }
    if (t.dataset.restore) {
      const p = S.positions.find(x => x.code === t.dataset.restore);
      if (p) { p.status = 'active'; p.removedAt = null; kaydet(); ciz(); toast(t.dataset.restore + ' geri alındı.'); }
      return;
    }
    if (t.dataset.unqueue) {
      S.queue = S.queue.filter(x => x.code !== t.dataset.unqueue);
      kaydet(); ciz(); return;
    }
    if (t.dataset.dismiss) {
      const r = S.recommendations.find(x => x.id === t.dataset.dismiss);
      if (r) { r.status = 'dismissed'; kaydet(); ciz(); toast('Takibe alındı — gelişimini Öneri Takibi’nde göreceksin.', 4000); }
      return;
    }
    if (t.dataset.forget) {
      S.recommendations = S.recommendations.filter(x => x.id !== t.dataset.forget);
      kaydet(); ciz(); return;
    }
    if (t.dataset.note) {
      const c = t.dataset.note;
      const d = S.decisions[c] || {};
      const v = prompt('Neden bu kararı verdin? (' + c + ')', d.note || '');
      if (v === null) return;
      S.decisions[c] = Object.assign({}, d, { note: v, decidedAt: new Date().toISOString() });
      kaydet(); ciz(); return;
    }
    // karar segmenti
    const seg = t.closest('.seg[data-code]');
    if (seg && t.dataset.o) {
      const c = seg.dataset.code;
      const d = S.decisions[c] || {};
      d.override = (d.override === t.dataset.o) ? null : t.dataset.o;
      d.decidedAt = new Date().toISOString();
      S.decisions[c] = d;
      kaydet(); cizKarar(); cizPortfoy();
    }
  });
}

/* ---------------- çizim ---------------- */

function ciz() {
  cizPortfoy(); cizKarar(); cizEkle(); cizOneri(); cizTakip(); cizPivot();
  const le = $('#lastExport');
  if (le) {
    le.innerHTML = S.meta.lastExportAt
      ? '<span style="font-size:12px;color:var(--muted)">Son yedek: ' + trTarih(S.meta.lastExportAt) + '</span>'
      : '<span style="font-size:12px;color:var(--warn)">Henüz hiç yedek almadın.</span>';
  }
  if (!storageOK) {
    const f = $('#freshness');
    f.dataset.state = 'broken';
    $('#freshText').textContent = 'Tarayıcı hafızası kapalı — kayıt yapılamıyor';
  }
}

function cizSaglik() {
  const h = DB.health;
  if (!h) { $('#healthBox').innerHTML = ''; return; }
  const sat = (ad, o) => '<tr><td class="l">' + ad + '</td>' +
    '<td class="num">' + o.basarili.length + '/' + (o.basarili.length + o.basarisiz.length) + '</td>' +
    '<td class="num">' + esc(o.son_veri || '—') + '</td></tr>';
  $('#healthBox').innerHTML = '<div class="scroll" style="margin-top:8px"><table>' +
    '<thead><tr><th class="l">Kaynak</th><th>Başarılı</th><th>Son veri</th></tr></thead><tbody>' +
    sat('Yahoo Finance', h.yahoo) + sat('TEFAS', h.tefas) +
    '</tbody></table></div>' +
    '<p style="font-size:12px;color:var(--muted);margin-top:6px">Son çalışma: ' + esc(h.calisma) +
    ' · durum: <strong>' + esc(h.durum) + '</strong></p>';
}

/* ---------------- açılış ---------------- */

(async function init() {
  try {
    const th = localStorage.getItem(KEY + ':theme');
    if (th) document.documentElement.setAttribute('data-theme', th);
  } catch (e) { /* yok say */ }

  try {
    const res = await fetch('data/app_data.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    DB = await res.json();
  } catch (e) {
    document.querySelector('.wrap').innerHTML =
      '<div class="note crit" style="margin-top:30px"><p class="nt">Veri yüklenemedi</p>' +
      '<p>Fon veri dosyası okunamadı (' + esc(e.message) + '). ' +
      'Sayfayı yenilemeyi dene; sorun sürerse deponun son otomatik çalışmasının başarılı olup ' +
      'olmadığını kontrol et.</p></div>';
    return;
  }

  try {
    const hr = await fetch('data/health.json', { cache: 'no-cache' });
    if (hr.ok) DB.health = await hr.json();
  } catch (e) { /* sağlık dosyası yoksa sorun değil */ }

  S = yukle();
  $('#drawerMeta').textContent = 'Veri kesiti ' + trTarih(DB.veri_tarihi) +
    ' · ' + Object.keys(DB.portfoy || {}).length + ' portföy, ' +
    Object.keys(DB.aday || {}).length + ' aday enstrüman';

  baglaOlaylar();
  pivotSecenekleriDoldur();
  tazelikGuncelle();
  cizSaglik();

  const h = (location.hash || '').replace('#', '');
  sekme(['portfoy', 'karar', 'ekle', 'oneri', 'takip', 'pivot'].indexOf(h) >= 0 ? h : 'portfoy');
})();
