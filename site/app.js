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
//: Her yerde tekrar eden tıklanabilir fon kodu — detay panelini açar.
function tickBtn(kod, styleAttr) {
  return '<button type="button" class="tick tick-btn"' + (styleAttr ? ' style="' + styleAttr + '"' : '') +
    ' data-detail="' + esc(kod) + '">' + esc(kod) + '</button>';
}

//: Birden fazla enstrümanı tek tabloda yan yana gösterir. Hem "fonları serbest
//: karşılaştır" aracı hem de detay panelindeki "temandaki emsalleri" tablosu
//: BUNU kullanır — tek doğruluk kaynağı, iki farklı çağıran.
function karsilastirmaTabloHTML(kodlar, opts) {
  opts = opts || {};
  const satirlar = kodlar.map(kod => Object.assign({ kod }, kayit(kod) || {})).filter(r => r.ad !== undefined || r.kod);
  if (!satirlar.length) return '<p style="font-size:13px;color:var(--muted)">Henüz fon seçmedin.</p>';
  // Odak enstrüman (varsa, ör. emsal tablosunda "kendisi") hep ilk satır;
  // geri kalanı takip etmesi kolay olsun diye alfabetik.
  satirlar.sort((a, b) => {
    if (opts.merkez) {
      if (a.kod === opts.merkez) return -1;
      if (b.kod === opts.merkez) return 1;
    }
    return a.kod.localeCompare(b.kod);
  });
  // [anahtar, başlık, biçimleyici, hizalama('l'|''), renkli mi (diverging işaret rengi)]
  const kolonlar = [
    ['ad', 'Ad', r => r.ad || '—', 'l', false],
    ['tip', 'Tip', r => r.tip || '—', '', false],
    ['cagr', 'CAGR', r => pct(r.cagr), '', true],
    ['vol', 'Vol', r => pct(r.vol), '', false],
    ['sharpe', 'Sharpe', r => num(r.sharpe), '', false],
    ['maxdd', 'Maks. düşüş', r => pct(r.maxdd, 0), '', 'neg'],
    ['beta', 'Beta', r => num(r.beta), '', false],
    ['alpha', 'Alfa', r => pct(r.alpha), '', true],
    ['gider', 'Gider', r => r.gider != null ? '%' + num(r.gider) : '—', '', false],
    ['sinyal', 'Sinyal', r => r.sinyal
      ? '<span class="chip chip-' + r.sinyal.toLowerCase() + '">' + esc(r.sinyal) + '</span>' : '—', '', false],
  ];
  if (opts.korelasyonGoster) {
    kolonlar.push(['korelasyon', 'ρ (' + esc(opts.merkez || '') + ')', r => {
      const e = (kayit(opts.merkez) || {}).emsaller || [];
      const f = e.find(x => x.kod === r.kod);
      return f && f.korelasyon !== null && f.korelasyon !== undefined ? num(f.korelasyon, 3) : '—';
    }, '', false]);
  }
  const th = '<th class="l">Kod</th>' + kolonlar.map(k =>
    '<th' + (k[3] === 'l' ? ' class="l"' : '') + '>' + esc(k[1]) + '</th>').join('') +
    (opts.kaldirilabilir ? '<th></th>' : '');
  const tr = satirlar.map(r => {
    const kendisi = opts.merkez === r.kod;
    const hucreler = kolonlar.map(k => {
      const [anahtar, , bicim, hiza, renkli] = k;
      let cls = hiza === 'l' ? 'l' : 'num';
      if (renkli === true) cls += ' ' + signClass(r[anahtar]);
      else if (renkli === 'neg' && r[anahtar] != null) cls += ' neg';
      return '<td class="' + cls + '">' + bicim(r) + '</td>';
    }).join('');
    return '<tr' + (kendisi ? ' class="cmp-row-self"' : '') + '><td>' + tickBtn(r.kod) + '</td>' + hucreler +
      (opts.kaldirilabilir ? '<td><button type="button" class="cmp-remove" data-cmp-remove="' + esc(r.kod) + '" title="Kaldır">×</button></td>' : '') +
      '</tr>';
  }).join('');
  return '<div class="scroll"><table><thead><tr>' + th + '</tr></thead><tbody>' + tr + '</tbody></table></div>';
}
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

  const rows = akt.slice().sort().map(c => {
    const r = kayit(c) || {};
    const d = S.decisions[c];
    return '<tr><td>' + tickBtn(c) + '</td>' +
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

  // Önce sinyal grubu (gözden geçirmesi gereken SAT en üstte), grup İÇİNDE
  // alfabetik — böylece sıra günden güne puan değişse bile kararlı kalır,
  // aynı fonu her seferinde aynı yerde bulursun.
  const sira = { SAT: 0, AL: 1, BEKLE: 2 };
  liste.sort((a, b) => {
    const ra = kayit(a) || {}, rb = kayit(b) || {};
    const d = (sira[ra.sinyal] ?? 3) - (sira[rb.sinyal] ?? 3);
    return d !== 0 ? d : a.localeCompare(b);
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
        tickBtn(c, 'font-size:15px') +
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

/* ---------------- GitHub otomatik yazma ---------------- */
//: Jeton BİLEREK ayrı bir localStorage anahtarında tutulur — `S` nesnesinin
//: (ana durum) bir parçası DEĞİL. disaAktar() yalnızca `S`'yi serialize eder,
//: bu yüzden jeton "durumu indir"e asla karışmaz. Tek yazma/okuma/silme yolu
//: burasıdır — başka hiçbir fonksiyon bu anahtara dokunmaz.

const GH_KEY = KEY + ':gh';
const GH_OWNER = 'ckrslm97', GH_REPO = 'portfoy-analiz';
const GH_API = 'https://api.github.com';

function ghOku() {
  try { const raw = localStorage.getItem(GH_KEY); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
function ghKaydetToken(obj) {
  try { localStorage.setItem(GH_KEY, JSON.stringify(obj)); } catch (e) { /* sandbox kapalıysa sessiz düş */ }
}
function ghSil() { try { localStorage.removeItem(GH_KEY); } catch (e) { /* yok say */ } }

function ghDurumGoster() {
  const g = ghOku();
  const setup = $('#ghSetup'), conn = $('#ghConnected');
  if (!setup || !conn) return;
  if (g && g.token) { setup.hidden = true; conn.hidden = false; }
  else { setup.hidden = false; conn.hidden = true; }
}

async function ghDogrula(token) {
  try {
    const r = await fetch(GH_API + '/repos/' + GH_OWNER + '/' + GH_REPO, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' }
    });
    if (r.status === 200) return { ok: true };
    if (r.status === 401) return { ok: false, mesaj: 'Jeton geçersiz — doğru kopyaladığından emin ol.' };
    if (r.status === 403 || r.status === 404) {
      return { ok: false, mesaj: 'Jeton bu depoya erişemiyor — oluştururken "portfoy-analiz" deposunu seçtiğine emin ol.' };
    }
    return { ok: false, mesaj: 'Beklenmedik hata (HTTP ' + r.status + ')' };
  } catch (e) {
    return { ok: false, mesaj: 'Bağlantı hatası: ' + e.message };
  }
}

function b64EncodeUtf8(str) { return btoa(unescape(encodeURIComponent(str))); }
function b64DecodeUtf8(str) { return decodeURIComponent(escape(atob(str.replace(/\n/g, '')))); }

async function ghWatchlistOku(token) {
  const r = await fetch(GH_API + '/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/watchlist.json', {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' }
  });
  if (r.status === 401) { const e = new Error('Jeton geçersiz/süresi dolmuş'); e.gh401 = true; throw e; }
  if (!r.ok) throw new Error('watchlist.json okunamadı (HTTP ' + r.status + ')');
  const j = await r.json();
  return { icerik: JSON.parse(b64DecodeUtf8(j.content)), sha: j.sha };
}

async function ghWatchlistYaz(token, kod) {
  const { icerik, sha } = await ghWatchlistOku(token);
  const liste = icerik.ekle || [];
  if (liste.indexOf(kod) < 0) liste.push(kod);
  icerik.ekle = liste;
  const r = await fetch(GH_API + '/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/watchlist.json', {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'izleme listesi: ' + kod + ' eklendi (site)',
      content: b64EncodeUtf8(JSON.stringify(icerik, null, 2)),
      sha, branch: 'main'
    })
  });
  if (r.status === 401) { const e = new Error('Jeton geçersiz/süresi dolmuş'); e.gh401 = true; throw e; }
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error('Commit başarısız (HTTP ' + r.status + ') ' + t.slice(0, 200));
  }
}

async function ghActionsBaslat(token) {
  const r = await fetch(GH_API + '/repos/' + GH_OWNER + '/' + GH_REPO + '/actions/workflows/daily.yml/dispatches', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: 'main' })
  });
  return r.status === 204;
}

async function ghRunBul(token, t0) {
  const r = await fetch(GH_API + '/repos/' + GH_OWNER + '/' + GH_REPO + '/actions/workflows/daily.yml/runs?event=workflow_dispatch&per_page=5', {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' }
  });
  if (!r.ok) return null;
  const j = await r.json();
  return (j.workflow_runs || []).find(x => new Date(x.created_at).getTime() >= t0 - 5000) || null;
}

async function ghRunDurum(token, runId) {
  const r = await fetch(GH_API + '/repos/' + GH_OWNER + '/' + GH_REPO + '/actions/runs/' + runId, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' }
  });
  return r.ok ? r.json() : null;
}

//: Dispatch sonrası gerçek Actions durumunu 10-12sn aralıklarla sorgular —
//: sahte bir "yükleniyor" animasyonu DEĞİL, GitHub'ın kendi run durumu.
async function ghDurumTakipEt(token, t0, kod, hintEl) {
  let run = null, deneme = 0;
  while (!run && deneme < 6) {
    await new Promise(res => setTimeout(res, 10000));
    run = await ghRunBul(token, t0).catch(() => null);
    deneme++;
  }
  if (!run) {
    hintEl.innerHTML = '<strong>' + esc(kod) + '</strong> kaydedildi — çalışmayı bulamadım ama gece 02:00\'de işlenecek. ' +
      '<a href="https://github.com/' + GH_OWNER + '/' + GH_REPO + '/actions" target="_blank" rel="noopener" style="color:var(--accent)">Actions\'ı kontrol et</a>.';
    return;
  }
  const runUrl = run.html_url;
  let durum = run, tur = 0;
  while (durum && durum.status !== 'completed' && tur < 30) {
    hintEl.innerHTML = '<strong>' + esc(kod) + '</strong> — GitHub Actions çalışıyor (' + esc(durum.status) + ')… ' +
      '<a href="' + esc(runUrl) + '" target="_blank" rel="noopener" style="color:var(--accent)">canlı log</a>';
    await new Promise(res => setTimeout(res, 12000));
    durum = await ghRunDurum(token, run.id).catch(() => durum);
    tur++;
  }
  if (durum && durum.status === 'completed') {
    if (durum.conclusion === 'success') {
      hintEl.innerHTML = '<strong>' + esc(kod) + '</strong> işlendi — sayfayı yenile, veri setinde olmalı. ' +
        '<a href="' + esc(runUrl) + '" target="_blank" rel="noopener" style="color:var(--accent)">çalışma logu</a>';
    } else {
      hintEl.innerHTML = '<strong>' + esc(kod) + '</strong> — otomatik çalışma hata verdi (kod bulunamamış olabilir). ' +
        '<a href="' + esc(runUrl) + '" target="_blank" rel="noopener" style="color:var(--accent)">logu incele</a>';
    }
  } else {
    hintEl.innerHTML = '<strong>' + esc(kod) + '</strong> kaydedildi, işleniyor — birkaç dakika sonra ' +
      '<a href="' + esc(runUrl) + '" target="_blank" rel="noopener" style="color:var(--accent)">çalışma logundan</a> kontrol edebilirsin.';
  }
}

/* ---------------- ekle / çıkar ---------------- */

function cizEkle() {
  ghDurumGoster();
  const bekleyen = S.queue.filter(x => x.status === 'queued');
  const q = S.queue.filter(x => x.status === 'queued' || x.status === 'sent');
  $('#queueCount').textContent = bekleyen.length;
  $('#queueList').innerHTML = q.length
    ? q.map(x => '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--rule)">' +
        '<span class="tick">' + esc(x.code) + '</span>' +
        (x.status === 'sent' ? '<span class="chip chip-al">GitHub\'a gönderildi</span>' : '') +
        '<span style="font-size:12px;color:var(--muted);margin-right:auto">' + trTarih(x.requestedAt) + '</span>' +
        '<button class="btn ghost sm" data-unqueue="' + esc(x.code) + '" type="button">sil</button></div>').join('')
    : '<p style="font-size:13px;color:var(--muted);margin:0">Kuyruk boş.</p>';

  const rem = S.positions.filter(p => p.status === 'removed').slice().sort((a, b) => a.code.localeCompare(b.code));
  $('#removedList').innerHTML = rem.length
    ? '<div class="scroll"><table><thead><tr><th>Kod</th><th class="l">Ad</th><th>Çıkarıldı</th><th></th></tr></thead><tbody>' +
      rem.map(p => { const r = kayit(p.code) || {};
        return '<tr><td>' + tickBtn(p.code) + '</td><td class="l">' + esc(r.ad || '—') + '</td>' +
        '<td class="num">' + trTarih(p.removedAt) + '</td>' +
        '<td><button class="btn ghost sm" data-restore="' + esc(p.code) + '" type="button">geri al</button></td></tr>';
      }).join('') + '</tbody></table></div>'
    : '<div class="empty">Henüz hiçbir pozisyonu çıkarmadın.</div>';
}

async function ekle(codeRaw) {
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
    return;
  }

  if (S.queue.some(x => x.code === code && (x.status === 'queued' || x.status === 'sent'))) {
    hint.innerHTML = '<span class="warnc">' + esc(code) + ' zaten izleme listesinde.</span>';
    return;
  }
  const kuyrukKaydi = { code, requestedAt: new Date().toISOString(), status: 'queued' };
  S.queue.push(kuyrukKaydi);
  kaydet(); ciz();
  $('#addInput').value = '';

  const g = ghOku();
  if (!g || !g.token) {
    hint.innerHTML = '<strong>' + esc(code) + '</strong> veri setinde yok — izleme listesine alındı. ' +
      'GitHub bağlantısı kurarsan (yukarıdaki kart) bu otomatik olur, ya da ' +
      '<code style="font-family:var(--mono)">watchlist.json</code> indirip elle commit\'leyebilirsin.';
    return;
  }

  hint.innerHTML = '<strong>' + esc(code) + '</strong> GitHub\'a kaydediliyor…';
  try {
    await ghWatchlistYaz(g.token, code);
    kuyrukKaydi.status = 'sent';
    kaydet(); ciz();
    hint.innerHTML = '<strong>' + esc(code) + '</strong> GitHub\'a kaydedildi.';

    const t0 = Date.now();
    const dispatchOk = await ghActionsBaslat(g.token).catch(() => false);
    if (dispatchOk) {
      hint.innerHTML += ' Otomatik güncelleme tetiklendi, izleniyor…';
      ghDurumTakipEt(g.token, t0, code, hint);
    } else {
      hint.innerHTML += ' Bu gece 02:00\'de otomatik işlenecek.';
    }
  } catch (e) {
    kuyrukKaydi.status = 'queued';
    kaydet();
    if (e.gh401) {
      ghSil(); ghDurumGoster();
      hint.innerHTML = '<strong>' + esc(code) + '</strong> — GitHub jetonun geçersiz veya süresi dolmuş, bağlantı kaldırıldı. ' +
        'Yeniden bağlanabilirsin (yukarıdaki kart) ya da izleme listesine alındı, elle commit\'leyebilirsin.';
    } else {
      hint.innerHTML = '<strong>' + esc(code) + '</strong> kaydedilemedi (' + esc(e.message) + '). ' +
        'İzleme listesine alındı — watchlist.json indirip elle commit\'leyebilirsin.';
    }
  }
}

function oner(codeRaw) {
  const q = String(codeRaw || '').trim().toUpperCase();
  if (!q) { $('#addResults').innerHTML = ''; return; }
  const akt = aktifKodlar();
  const hepsi = Object.assign({}, DB.portfoy, DB.aday);
  const hit = Object.keys(hepsi)
    .filter(c => c.indexOf(q) === 0 || (hepsi[c].ad || '').toUpperCase().indexOf(q) >= 0)
    .filter(c => akt.indexOf(c) < 0).sort().slice(0, 6);
  $('#addResults').innerHTML = hit.length
    ? hit.map(c => { const r = hepsi[c];
        return '<div style="display:flex;align-items:center;gap:9px;padding:6px 0;border-bottom:1px solid var(--rule)">' +
        tickBtn(c) +
        '<span style="font-size:12.5px;color:var(--muted);margin-right:auto;overflow:hidden;text-overflow:ellipsis">' + esc(r.ad || '') + '</span>' +
        (r.kategori ? '<span class="chip chip-n">' + esc(r.kategori) + '</span>' : '') +
        '<button class="btn sm" data-add="' + esc(c) + '" type="button">ekle</button></div>';
      }).join('')
    : '<p style="font-size:12.5px;color:var(--muted);margin:6px 0 0">Veri setinde eşleşme yok — ' +
      '“Ekle”ye basarsan izleme listesine alınır.</p>';
}

/* ---------------- fonları serbest karşılaştır ---------------- */

//: "Karşılaştır" sekmesinde kullanıcının elle seçtiği fon listesi — ephemeral,
//: sayfa yenilenince sıfırlanır (kalıcı bir karar değil, geçici bir inceleme).
let cmpSecili = [];
const CMP_MAX = 6;

function cmpAra(q) {
  const box = $('#cmpDropdown');
  q = String(q || '').trim().toUpperCase();
  if (!q) { box.innerHTML = ''; return; }
  const hepsi = Object.assign({}, DB.portfoy, DB.aday);
  const hit = Object.keys(hepsi)
    .filter(c => cmpSecili.indexOf(c) < 0)
    .filter(c => c.indexOf(q) === 0 || (hepsi[c].ad || '').toUpperCase().indexOf(q) >= 0
      || (hepsi[c].tema || '').toUpperCase().indexOf(q) >= 0)
    .sort().slice(0, 8);
  box.innerHTML = hit.length
    ? '<div class="cmp-dropdown">' + hit.map(c => {
        const r = hepsi[c];
        return '<button type="button" class="item" data-cmp-add="' + esc(c) + '">' +
          '<span class="tick">' + esc(c) + '</span>' +
          '<span class="nm2">' + esc(r.ad || '') + '</span>' +
          '<span class="chip chip-n">' + esc(r.tema || '') + '</span></button>';
      }).join('') + '</div>'
    : '<div class="cmp-dropdown"><div class="item" style="color:var(--muted);cursor:default">Eşleşme yok</div></div>';
}

function cmpEkle(kod) {
  if (cmpSecili.length >= CMP_MAX || cmpSecili.indexOf(kod) >= 0) return;
  cmpSecili.push(kod);
  $('#cmpInput').value = '';
  $('#cmpDropdown').innerHTML = '';
  cizCmp();
}

function cmpCikar(kod) {
  cmpSecili = cmpSecili.filter(c => c !== kod);
  cizCmp();
}

function cizCmp() {
  $('#cmpCount').textContent = cmpSecili.length + '/' + CMP_MAX + ' seçili';
  $('#cmpInput').disabled = cmpSecili.length >= CMP_MAX;
  $('#cmpTable').innerHTML = cmpSecili.length
    ? karsilastirmaTabloHTML(cmpSecili, { kaldirilabilir: true })
    : '<div class="empty">Yukarıdan fon ara ve ekle — en fazla ' + CMP_MAX + ' tane.</div>';
}

/* ---------------- pivot / karşılaştırma ---------------- */

//: Satır/sütun için seçilebilir kategorik boyutlar. "kod" özel bir boyuttur:
//: her enstrüman kendi grubu olur — Satır=Fon VE Sütun=Fon seçilirse ve
//: Değer=Korelasyon (ikili) ise pivotHesapla() bunu tamamen farklı, ikili bir
//: yoldan hesaplar (bkz. aşağıda pkorel).
const PDIMS = {
  kod:     { label: 'Fon / ETF',         get: r => r.code },
  tema:    { label: 'Tema',              get: r => r.tema || 'Diğer' },
  tip:     { label: 'Tip',               get: r => r.tip || '—' },
  sinyal:  { label: 'Sinyal',            get: r => r.sinyal || '—' },
  risk:    { label: 'Risk',              get: r => r.risk === 'dusuk' ? 'Düşük' : r.risk === 'orta' ? 'Orta' : r.risk === 'yuksek' ? 'Yüksek' : 'Veri yok' },
  kapsam:  { label: 'Kapsam',            get: r => r.__kapsam },
  yeterli: { label: 'Geçmiş yeterli mi', get: r => r.yillik_gecerli ? 'Evet' : 'Hayır' },
};
const PDIM_ORDER = ['kod', 'tema', 'tip', 'sinyal', 'risk', 'kapsam', 'yeterli'];

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
  korel:  { label: 'En yüksek korelasyon (herhangi biriyle)', get: r => r.en_yuksek_korelasyon, fmt: 'num2', polarity: 'sequential' },
  // İkili (pairwise) korelasyon — TEK enstrümanın özelliği DEĞİL, bir ÇİFTİN
  // özelliği; bu yüzden get() burada anlamsız (null döner) ve pivotHesapla()
  // Satır=Fon + Sütun=Fon olduğunda bunu tamamen ayrı bir yoldan hesaplar.
  pkorel: { label: 'Korelasyon (ikili — Fon × Fon)', get: () => null, fmt: 'num2', polarity: 'korelasyon' },
  adet:   { label: 'Adet',              get: () => 1,              fmt: 'int',   polarity: 'sequential', countOnly: true },
};
const PMETRIC_ORDER = ['adet', 'cagr', 'sharpe', 'sortino', 'vol', 'maxdd', 'beta', 'alpha',
  'r1y', 'r3y', 'r5y', 'gider', 'puan', 'oskor', 'cakisma', 'korel', 'pkorel'];

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

//: İkili korelasyon (pkorel) yalnızca Satır=Fon/ETF VE Sütun=Fon/ETF iken
//: anlamlıdır — DB.korelasyon_matrisi'nden doğrudan okur, item bazlı
//: toplama mantığının tamamen dışındadır.
function pivotHesaplaIkili(items) {
  const kodlar = Array.from(new Set(items.map(it => it.code)))
    .filter(c => DB.korelasyon_matrisi && DB.korelasyon_matrisi[c])
    .sort();
  const grid = {};
  let maxAbs = 0;
  kodlar.forEach(a => {
    grid[a] = {};
    kodlar.forEach(b => {
      const v = a === b ? 1 : (DB.korelasyon_matrisi[a] || {})[b];
      const agg = (v === undefined) ? null : v;
      grid[a][b] = { agg, n: agg === null ? 0 : 1, codes: [a, b] };
      if (agg !== null) maxAbs = Math.max(maxAbs, Math.abs(agg));
    });
  });
  return { rowKeys: kodlar, colKeys: kodlar, grid, itemCount: kodlar.length, maxAbs: maxAbs || 1, maxMag: maxAbs || 1 };
}

function pivotHesapla() {
  const items = pivotFiltrele(pivotEvren());

  if (pvVal === 'pkorel') {
    if (pvRow !== 'kod' || pvCol !== 'kod') {
      return { rowKeys: [], colKeys: [], grid: {}, itemCount: items.length, maxAbs: 1, maxMag: 1,
        hataMesaji: 'Korelasyon (ikili) yalnızca Satır = Fon/ETF ve Sütun = Fon/ETF seçiliyken hesaplanır.' };
    }
    return pivotHesaplaIkili(items);
  }

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
  if (polarity === 'korelasyon') {
    // Yüksek ρ = konsantrasyon riski (kırmızı), düşük/negatif ρ = çeşitlendirme (yeşil).
    // Getiri metriklerindeki "pozitif=iyi" mantığının TERSİ — burada pozitif
    // yüksek korelasyon istenmeyen bir şeydir.
    const t = Math.min(1, Math.abs(agg));
    const tok = agg >= 0.5 ? '--neg-bg' : (agg <= 0 ? '--pos-bg' : '--warn-bg');
    return 'background:color-mix(in srgb, var(' + tok + ') ' + (t * 100).toFixed(0) + '%, var(--surface))';
  }
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
    if (pvVal === 'pkorel') {
      pvRow = 'kod'; pvCol = 'kod'; rowSel.value = 'kod'; colSel.value = 'kod';
    }
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

  const { rowKeys, colKeys, grid, maxAbs, maxMag, hataMesaji } = pivotHesapla();
  const metrik = PMETRICS[pvVal];

  if (hataMesaji) {
    $('#pivotTableWrap').innerHTML = '<div class="empty"><strong>Bu kombinasyon desteklenmiyor</strong>' + esc(hataMesaji) + '</div>';
    $('#pivotDrill').innerHTML = '';
    return;
  }
  if (!rowKeys.length) {
    $('#pivotTableWrap').innerHTML = '<div class="empty"><strong>Bu filtrede enstrüman yok</strong>Filtreleri gevşet.</div>';
    $('#pivotDrill').innerHTML = '';
    return;
  }
  const buyukMatrisUyari = (pvRow === 'kod' && pvCol === 'kod' && rowKeys.length > 20 && !Object.values(pvFilter).some(s => s.size))
    ? '<div class="note warn" style="margin-bottom:14px"><p class="nt">Büyük matris</p>' +
      '<p>' + rowKeys.length + '×' + colKeys.length + ' hücre — okunması zor olabilir. Yukarıdan bir Tema veya Tip ' +
      'filtresi uygulayarak matrisi küçültmeni öneririm.</p></div>'
    : '';

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
  $('#pivotTableWrap').innerHTML = buyukMatrisUyari + html;

  if (pvSelected) cizDrill(pvSelected.rk, pvSelected.ck, grid);
  else $('#pivotDrill').innerHTML = '<p style="font-size:12.5px;color:var(--muted)">Bir hücreye tıkla — altındaki fonları listeleyeyim.</p>';
}

function cizDrill(rk, ck, grid) {
  const cell = grid && grid[rk] && grid[rk][ck];
  if (!cell || !cell.codes.length) { $('#pivotDrill').innerHTML = ''; return; }

  // İkili korelasyon hücresi: genel "grup içeriği" listesi değil, iki fonun
  // tam metrik karşılaştırması daha faydalı — mevcut karşılaştırma tablosunu kullan.
  if (pvVal === 'pkorel') {
    const ro = cell.agg !== null ? num(cell.agg, 3) : '—';
    $('#pivotDrill').innerHTML =
      '<h4 style="font-size:12px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin:0 0 8px">' +
      esc(rk) + ' × ' + esc(ck) + ' — ρ = ' + ro + '</h4>' +
      karsilastirmaTabloHTML(rk === ck ? [rk] : [rk, ck], {});
    return;
  }

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
      '<div class="drill-row">' + tickBtn(s.c) +
      '<span class="nm">' + esc(s.ad) + '</span>' +
      '<span class="num ' + (metrik.polarity === 'diverging' ? signClass(s.v) : '') + '">' + fmtDeger(s.v, metrik.fmt) + '</span></div>'
    ).join('') + '</div>';
}

/* ---------------- enstrüman detayı ---------------- */

//: 1H/1A/3A/6A/12A aralık seçici tanımları (takvim günü, geriye doğru).
const ARALIKLAR = {
  '1H': { gun: 7, ad: '1 Hafta' }, '1A': { gun: 30, ad: '1 Ay' },
  '3A': { gun: 91, ad: '3 Ay' }, '6A': { gun: 182, ad: '6 Ay' },
  '12A': { gun: 365, ad: '12 Ay' },
};

let detailKod = null;
let detailAralik = '1A';
let GUNLUK_EPOCH_MS = null; // init()'te DB yüklenince doldurulur

function epochToDate(g) { return new Date(GUNLUK_EPOCH_MS + g * 86400000); }
function trTarihKisa(d) { return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }); }

//: Günlük seriyi seçili aralığa göre diler; baz nokta = kesim tarihine en
//: yakın (≥) ilk gözlem. Seri kısaysa (ör. yeni kurulmuş fon) elindekiyle yetinir.
function aralikDilimle(kod, ak) {
  const s = DB.gunluk && DB.gunluk[kod];
  if (!s || !s.g || s.g.length < 2) return null;
  const sonGun = s.g[s.g.length - 1];
  const istenenGun = ARALIKLAR[ak].gun;
  const kesim = sonGun - istenenGun;
  let baz = s.g.findIndex(g => g >= kesim);
  if (baz < 0) baz = 0;
  const g = s.g.slice(baz), f = s.f.slice(baz);
  if (f.length < 2) return null;
  const bazF = f[0], sonF = f[f.length - 1];
  const kapsananGun = g[g.length - 1] - g[0];
  return {
    g, f, delta: bazF > 0 ? (sonF / bazF - 1) : null,
    bazTarih: epochToDate(g[0]), sonTarih: epochToDate(g[g.length - 1]),
    // 5 günlük tolerans (haftasonu/tatil kaymaları) sonrası hâlâ istenen aralığın
    // gerisindeyse, bu "yetersiz geçmiş" demektir — sessizce kısa aralığı
    // "12A" diye sunmak yanıltıcı olur (ör. 4 aylık NASA için "12A" göstermek gibi).
    kisitli: kapsananGun < istenenGun - 5,
  };
}

//: Sparkline'dan daha büyük, ızgaralı ve pozitif/negatife göre renklenen çizgi grafiği.
function detailChartSVG(fiyatlar, neg) {
  const W = 640, H = 150, pad = 6;
  const lo = Math.min.apply(null, fiyatlar), hi = Math.max.apply(null, fiyatlar);
  const span = (hi - lo) || 1;
  const X = i => pad + (i / (fiyatlar.length - 1)) * (W - pad * 2);
  const Y = v => pad + (1 - (v - lo) / span) * (H - pad * 2);
  let d = '';
  fiyatlar.forEach((v, i) => { d += (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1) + ' '; });
  const area = d + 'L' + X(fiyatlar.length - 1).toFixed(1) + ' ' + (H - pad) + ' L' + pad + ' ' + (H - pad) + ' Z';
  let grid = '';
  for (let i = 1; i <= 2; i++) {
    const y = (pad + (H - pad * 2) * i / 3).toFixed(1);
    grid += '<line class="grid-line" x1="0" y1="' + y + '" x2="' + W + '" y2="' + y + '"/>';
  }
  const c1 = neg ? ' neg-line' : '', c2 = neg ? ' neg-area' : '', c3 = neg ? ' neg-end' : '';
  return '<svg class="detail-chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
    grid + '<path class="area' + c2 + '" d="' + area + '"/>' +
    '<path class="line' + c1 + '" d="' + d.trim() + '"/>' +
    '<circle class="end' + c3 + '" cx="' + X(fiyatlar.length - 1).toFixed(1) + '" cy="' + Y(fiyatlar[fiyatlar.length - 1]).toFixed(1) + '" r="3.2"/>' +
    '</svg>';
}

function statCard(k, v, colorVal) {
  return '<div class="stat"><div class="k">' + k + '</div><div class="v" style="font-size:19px' +
    '"><span class="' + (colorVal !== undefined && colorVal !== null ? signClass(colorVal) : '') + '">' + v + '</span></div></div>';
}

function detailSinyalHTML(kod) {
  const r = kayit(kod);
  if (!r || !r.sinyal) return '';
  const d = S.decisions[kod] || {};
  const nedenler = (r.nedenler || []).map(n => '<li>' + esc(n) + '</li>').join('');
  return '<div class="decision" data-sig="' + esc(r.sinyal) + '" style="margin-bottom:22px">' +
    '<div><div class="hd">' +
      '<span class="chip chip-' + r.sinyal.toLowerCase() + '">Kural: ' + esc(r.sinyal) + '</span>' +
      (r.puan !== undefined && !r.kapi ? '<span class="chip chip-n">puan ' + (r.puan > 0 ? '+' : '') + r.puan + '</span>' : '') +
      (r.kapi ? '<span class="chip chip-n">kapı: ' + esc(r.kapi) + '</span>' : '') +
      (d.override ? '<span class="chip chip-acc">Senin kararın: ' + esc(d.override) + '</span>' : '') +
    '</div><ul>' + nedenler + '</ul></div></div>';
}

//: "Hangisiyle kıyaslandığını görebileyim" isteğine cevap: aynı temadaki
//: emsaller, gider oranı dahil, tek tabloda. Gider oranı en yüksekse ayrıca uyarır.
function detailEmsalHTML(kod) {
  const r = kayit(kod);
  const emsaller = (r && r.emsaller) || [];
  if (!emsaller.length) {
    return '<p style="font-size:13px;color:var(--muted)">Bu temada karşılaştırılacak başka enstrüman bulunamadı.</p>';
  }
  const kodlar = [kod].concat(emsaller.map(e => e.kod));
  let uyari = '';
  if (r.gider != null) {
    const digerGiderler = emsaller.filter(e => e.gider != null).map(e => e.gider);
    if (digerGiderler.length && r.gider > Math.max.apply(null, digerGiderler)) {
      uyari = '<p class="fee-flag">Bu enstrüman temandaki emsaller arasında en yüksek gider oranına sahip ' +
        '(%' + num(r.gider) + ' — diğerleri: %' + digerGiderler.map(g => num(g)).join(', %') + ').</p>';
    }
  }
  return karsilastirmaTabloHTML(kodlar, { merkez: kod, korelasyonGoster: true }) + uyari;
}

function acDetay(kod) {
  const r = kayit(kod);
  if (!r) { toast(kod + ' veri setinde yok.', 3000); return; }
  detailKod = kod;
  detailAralik = '1A';

  $('#detailHead').innerHTML =
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span class="tick" style="font-size:22px">' + esc(kod) + '</span>' +
      '<span class="chip chip-n">' + esc(r.tip || '') + '</span>' +
      (r.tema ? '<span class="chip chip-acc">' + esc(r.tema) + '</span>' : '') +
    '</div>' +
    '<div style="font-size:14px;color:var(--muted);margin-top:5px">' + esc(r.ad || '') +
      (r.aum ? ' · AUM ' + esc(r.aum) : (r.aum_try ? ' · AUM ' + Math.round(r.aum_try / 1e6).toLocaleString('tr-TR') + ' mn ₺' : '')) +
      '</div>';

  renderDetailBody(kod);
  $('#detailDrawer').setAttribute('open', '');
}

//: "Hangi hisselere yatırım yapıyor, dağılımı nasıl" isteğine cevap.
//: ABD ETF'leri için stockanalysis.com'dan çekilmiş gerçek holdings; TEFAS
//: fonları için TEFAS sitesinden (yalnızca tarayıcı navigasyonuyla erişilebilen,
//: kamuya açık API'si olmayan) varlık türü dağılımı. İkisi de yoksa nedenini
//: açıkça söyler — sessizce boş bırakmaz veya veri uydurmaz.
function detailIcerikHTML(kod) {
  const r = kayit(kod);
  if (r.holdings && r.holdings.length) {
    const satirlar = r.holdings.map(h =>
      '<tr><td class="tick">' + esc(h.kod) + '</td><td class="l">' + esc(h.ad) + '</td>' +
      '<td class="num">%' + num(h.agirlik, 2) + '</td></tr>'
    ).join('');
    return '<div class="scroll"><table><thead><tr><th class="l">Kod</th><th class="l">Şirket</th><th>Ağırlık</th></tr></thead>' +
      '<tbody>' + satirlar + '</tbody></table></div>' +
      '<p style="font-size:12px;color:var(--muted);margin-top:8px">İlk ' + r.holdings.length +
      ' pozisyon, fonun toplam ağırlığının yaklaşık %' + num(r.holdings_kapsama, 1) +
      '\'ini kapsıyor (stockanalysis.com, resmi tam portföy değil).</p>';
  }
  if (r.varlik_dagilim) {
    const toplam = Object.values(r.varlik_dagilim).reduce((a, b) => a + b, 0);
    const satirlar = Object.entries(r.varlik_dagilim)
      .sort((a, b) => b[1] - a[1])
      .map(([tur, oran]) => '<tr><td class="l">' + esc(tur) + '</td><td class="num">%' + num(oran, 2) + '</td></tr>')
      .join('');
    return '<div class="scroll"><table><thead><tr><th class="l">Varlık Türü</th><th>Oran</th></tr></thead>' +
      '<tbody>' + satirlar + '</tbody></table></div>' +
      '<p style="font-size:12px;color:var(--muted);margin-top:8px">Toplam %' + num(toplam, 1) +
      '. Kaynak: TEFAS — bu veri kamuya açık bir API\'de yayınlanmıyor, ' +
      (r.varlik_dagilim_tarih ? trTarih(r.varlik_dagilim_tarih) + ' tarihinde' : 'periyodik olarak') +
      ' elle/tarayıcı ile çekildi. Her gece otomatik tazelenmez.</p>';
  }
  const neden = r.tip === 'TEFAS'
    ? 'TEFAS, fon içeriğini (hangi hisseler, hangi ağırlık) kamuya açık bir API\'de yayınlamıyor.'
    : 'Bu enstrümanın içerik verisi henüz çekilmedi — bir sonraki güncellemede eklenebilir.';
  return '<p style="font-size:13px;color:var(--muted)">İçerik verisi yok. ' + neden + '</p>';
}

function renderDetailBody(kod) {
  const r = kayit(kod);
  const akt = aktifKodlar().indexOf(kod) >= 0;
  const metrikler =
    statCard('CAGR', pct(r.cagr), r.cagr) + statCard('Volatilite', pct(r.vol)) +
    statCard('Sharpe', num(r.sharpe)) + statCard('Sortino', num(r.sortino)) +
    statCard('Maks. düşüş', pct(r.maxdd, 0), r.maxdd) + statCard('Beta', num(r.beta)) +
    statCard('Alfa', pct(r.alpha), r.alpha) +
    statCard('Gider', r.gider != null ? '%' + num(r.gider) : '—');
  const eylem = akt
    ? '<button class="btn ghost" data-remove="' + esc(kod) + '" type="button">Portföyden çıkar</button>'
    : '<button class="btn" data-add="' + esc(kod) + '" type="button">Portföye ekle</button>';
  const h4 = 'style="font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin:0 0 10px"';

  $('#detailBody').innerHTML =
    '<div class="range-headline" id="detailHeadline"></div>' +
    '<div id="detailChartArea"></div>' +
    '<div class="seg" id="detailRangeSeg" style="margin:12px 0 24px">' +
      Object.keys(ARALIKLAR).map(a => '<button type="button" data-range="' + a + '" aria-pressed="' +
        (a === detailAralik) + '">' + a + '</button>').join('') +
    '</div>' +
    '<h4 ' + h4 + '>Risk ve getiri (tüm geçmiş, USD)</h4>' +
    '<div class="grid g4" style="margin-bottom:24px">' + metrikler + '</div>' +
    '<h4 ' + h4 + '>İçerik — hangi hisselere yatırım yapıyor</h4>' +
    '<div style="margin-bottom:24px">' + detailIcerikHTML(kod) + '</div>' +
    (r.sinyal ? '<h4 ' + h4 + '>Al / Sat / Bekle sinyali</h4>' + detailSinyalHTML(kod) : '') +
    '<h4 ' + h4 + '>Temandaki emsalleri</h4>' + detailEmsalHTML(kod) +
    '<div style="margin-top:22px">' + eylem + '</div>';

  detailAralikCiz(detailAralik);
}

function detailAralikCiz(aralik) {
  detailAralik = aralik;
  const seg = $('#detailRangeSeg');
  if (seg) $$('button', seg).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.range === aralik)));

  const dilim = aralikDilimle(detailKod, aralik);
  const hl = $('#detailHeadline'), ca = $('#detailChartArea');
  if (!hl || !ca) return;
  if (!dilim) {
    hl.innerHTML = '<span style="font-size:13px;color:var(--muted)">' + ARALIKLAR[aralik].ad +
      ' için yeterli veri yok.</span>';
    ca.innerHTML = '';
    return;
  }
  const neg = dilim.delta !== null && dilim.delta < 0;
  hl.innerHTML =
    '<span class="big ' + (dilim.delta !== null ? signClass(dilim.delta) : '') + '">' +
    (dilim.delta !== null ? pct(dilim.delta) : '—') + '</span>' +
    '<span class="lbl">' + trTarihKisa(dilim.bazTarih) + ' → ' + trTarihKisa(dilim.sonTarih) +
    (dilim.kisitli ? ' · yetersiz geçmiş, kuruluştan beri gösteriliyor' : '') + '</span>';
  ca.innerHTML = detailChartSVG(dilim.f, neg);
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
        tickBtn(ilk) +
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
      tickBtn(rec.code, 'font-size:17px') +
      '<span class="chip chip-acc">' + esc(rec.category) + '</span>' +
      '<span class="chip chip-n">skor ' + num(r.oneri_skoru) + '</span>' +
      '<span style="margin-left:auto;font-size:12px;color:var(--muted)">' + trTarih(rec.proposedDataDate) + ' verisiyle önerildi</span>' +
    '</div>' +
    '<div style="font-size:13.5px;color:var(--ink-2);margin-bottom:12px">' + esc(r.ad || '') +
      (r.aum ? ' · AUM ' + esc(r.aum) : '') + '</div>' +
    '<div class="grid g4" style="margin-bottom:12px">' + bilesen + '</div>' +
    '<ul style="margin:0 0 14px;padding-left:18px;font-size:13px;color:var(--ink-2)">' +
      (r.oneri_nedenleri || []).map(n => '<li>' + esc(n) + '</li>').join('') +
    '</ul>' +
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
        tickBtn(rec.code, 'font-size:15px') +
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
  $('#ghSaveBtn').addEventListener('click', async () => {
    const inp = $('#ghTokenInput'), status = $('#ghStatus'), btn = $('#ghSaveBtn');
    const token = inp.value.trim();
    if (!token) return;
    btn.disabled = true;
    status.textContent = 'Doğrulanıyor…'; status.style.color = 'var(--muted)';
    const sonuc = await ghDogrula(token);
    btn.disabled = false;
    if (sonuc.ok) {
      ghKaydetToken({ token, owner: GH_OWNER, repo: GH_REPO, savedAt: new Date().toISOString() });
      inp.value = ''; status.textContent = '';
      ghDurumGoster();
      toast('GitHub bağlantısı kuruldu.');
    } else {
      status.textContent = sonuc.mesaj; status.style.color = 'var(--neg)';
    }
  });
  $('#ghDisconnectBtn').addEventListener('click', () => {
    ghSil(); ghDurumGoster();
    toast('Bağlantı bu tarayıcıdan kaldırıldı — GitHub\'daki jeton hâlâ geçerli, iptal etmek için jeton ayarlarına git.', 6000);
  });
  $('#addInput').addEventListener('input', e => oner(e.target.value));
  $('#addInput').addEventListener('keydown', e => { if (e.key === 'Enter') ekle(e.target.value); });
  $('#newRecBtn').addEventListener('click', yeniOneri);
  $('#cmpInput').addEventListener('input', e => cmpAra(e.target.value));
  $('#cmpInput').addEventListener('focus', e => { if (e.target.value) cmpAra(e.target.value); });
  document.addEventListener('click', e => {
    if (!e.target.closest('.cmp-results')) $('#cmpDropdown').innerHTML = '';
  });
  $('#detailClose').addEventListener('click', () => { $('#detailDrawer').removeAttribute('open'); });
  $('#detailDrawer').addEventListener('click', e => { if (e.target.id === 'detailDrawer') $('#detailDrawer').removeAttribute('open'); });
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

    if (t.dataset.detail) { acDetay(t.dataset.detail); return; }
    if (t.dataset.cmpAdd) { cmpEkle(t.dataset.cmpAdd); return; }
    if (t.dataset.cmpRemove) { cmpCikar(t.dataset.cmpRemove); return; }
    if (t.dataset.range) { detailAralikCiz(t.dataset.range); return; }

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
  cizPortfoy(); cizKarar(); cizEkle(); cizOneri(); cizTakip(); cizPivot(); cizCmp();
  // Detay paneli açıksa (ör. içeriden ekle/çıkar yapıldıysa) senkron kal —
  // ama seçili aralığı sıfırlamadan (acDetay değil, renderDetailBody).
  if ($('#detailDrawer').hasAttribute('open') && detailKod && kayit(detailKod)) {
    renderDetailBody(detailKod);
  }
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
  GUNLUK_EPOCH_MS = new Date((DB.gunluk_epoch || '2020-01-01') + 'T00:00:00Z').getTime();
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
