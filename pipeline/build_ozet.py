"""Günlük e-posta/paylaşım için AYRI, statik bir özet sayfası üretir.

site/ozet.html — interaktif uygulamadan (index.html) farklı olarak JS/localStorage'a
bağımlı değildir; sunucu tarafında (bu script) tamamen önceden render edilir.
Böylece bir e-postaya link olarak yapıştırılabilir ve tıklandığında anında,
tarayıcı geçmişi olmadan doğru içerikle açılır.

Kapsam notu: burada gösterilen "portföy" DB'deki REFERANS portföydür (raporun
38 enstrümanı) — kullanıcının tarayıcısındaki kişisel pozisyonlar (localStorage)
sunucu tarafından görülemez. Sayfa bunu açıkça belirtir, kişiselmiş gibi sunmaz.
"""

import json
import os
import pathlib

DATA = pathlib.Path(os.environ.get("DATA_DIR", pathlib.Path(__file__).parent.parent / "site" / "data"))
OUT = pathlib.Path(os.environ.get("SITE_DIR", pathlib.Path(__file__).parent.parent / "site")) / "ozet.html"

SINYAL_ETIKET = {"AL": "chip-al", "SAT": "chip-sat", "BEKLE": "chip-bekle"}


def esc(s):
    return (str(s if s is not None else "")
            .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def pct(x, d=1):
    if x is None:
        return "—"
    return f"{'+' if x >= 0 else ''}{x * 100:.{d}f}%"


def num(x, d=2):
    if x is None:
        return "—"
    return f"{x:.{d}f}"


def sinyal_karti(kod, r):
    nedenler = "".join(f"<li>{esc(n)}</li>" for n in (r.get("nedenler") or [])[:2])
    chip = SINYAL_ETIKET.get(r.get("sinyal"), "chip-n")
    return (
        '<div class="decision" data-sig="' + esc(r.get("sinyal", "")) + '">'
        '<div><div class="hd">'
        f'<span class="tick" style="font-size:14px">{esc(kod)}</span>'
        f'<span class="chip {chip}">{esc(r.get("sinyal", "—"))}</span>'
        f'<span class="chip chip-n">puan {r.get("puan", 0):+d}</span>'
        "</div>"
        f'<div class="nm">{esc(r.get("ad", ""))}</div>'
        f"<ul>{nedenler}</ul></div></div>"
    )


def main():
    db = json.loads((DATA / "app_data.json").read_text())
    portfoy = db["portfoy"]
    aday = db["aday"]
    kategoriler = db["kategoriler"]

    sat = sorted(
        [(k, r) for k, r in portfoy.items() if r.get("sinyal") == "SAT"],
        key=lambda kv: kv[1].get("puan", 0),
    )[:6]
    al = sorted(
        [(k, r) for k, r in portfoy.items() if r.get("sinyal") == "AL"],
        key=lambda kv: -kv[1].get("puan", 0),
    )[:6]
    dagilim = {"AL": 0, "SAT": 0, "BEKLE": 0}
    for r in portfoy.values():
        if r.get("sinyal") in dagilim:
            dagilim[r["sinyal"]] += 1

    kat_satirlari = []
    for kat, kodlar in sorted(kategoriler.items()):
        adaylar = sorted(
            [c for c in kodlar if c in aday],
            key=lambda c: -(aday[c].get("oneri_skoru") or 0),
        )
        if not adaylar:
            continue
        top = aday[adaylar[0]]
        kat_satirlari.append(
            "<tr>"
            f'<td class="l">{esc(kat)}</td>'
            f'<td><span class="tick">{esc(adaylar[0])}</span></td>'
            f'<td class="l">{esc(top.get("ad", ""))}</td>'
            f'<td class="num">{num(top.get("sharpe"))}</td>'
            f'<td class="num">{"%" + num(top.get("gider")) if top.get("gider") is not None else "—"}</td>'
            "</tr>"
        )

    sat_html = "".join(sinyal_karti(k, r) for k, r in sat) or '<p style="color:var(--muted);font-size:13.5px">SAT sinyali yok.</p>'
    al_html = "".join(sinyal_karti(k, r) for k, r in al) or '<p style="color:var(--muted);font-size:13.5px">AL sinyali yok.</p>'

    html = f"""<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Günlük Fon Özeti — {esc(db['veri_tarihi'])}</title>
<meta name="description" content="Referans portföyün günlük al/sat/bekle sinyal özeti ve kategori boşluğu önerileri.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📨</text></svg>">
<link rel="stylesheet" href="styles.css">
<style>
  .wrap {{ max-width: 880px; }}
  .ozet-head {{ padding: 44px 0 22px; border-bottom: 1px solid var(--rule-strong); margin-bottom: 28px; }}
  .ozet-head h1 {{ font-family: var(--serif); font-size: 30px; margin: 0 0 8px; letter-spacing: -.01em; }}
  .ozet-head p {{ color: var(--muted); font-size: 14px; margin: 0; }}
  .ozet-sec {{ margin-bottom: 34px; }}
  .ozet-sec h2 {{ font-family: var(--serif); font-size: 19px; margin: 0 0 14px; }}
</style>
</head>
<body>
<div class="wrap">
  <header class="ozet-head">
    <h1>Günlük Fon Özeti</h1>
    <p>Veri kesiti {esc(db['veri_tarihi'])} · Referans portföy (rapordaki {len(portfoy)} enstrüman) ·
       <a href="index.html" style="color:var(--accent)">→ İnteraktif araç, kendi portföyün için</a></p>
  </header>

  <div class="ozet-sec">
    <div class="grid g4">
      <div class="card stat"><div class="k">Al sinyali</div><div class="v">{dagilim['AL']}</div></div>
      <div class="card stat"><div class="k">Sat sinyali</div><div class="v">{dagilim['SAT']}</div></div>
      <div class="card stat"><div class="k">Bekle sinyali</div><div class="v">{dagilim['BEKLE']}</div></div>
      <div class="card stat"><div class="k">Toplam</div><div class="v">{len(portfoy)}</div></div>
    </div>
  </div>

  <div class="ozet-sec">
    <h2>Gözden geçir — Sat sinyali</h2>
    <div class="grid">{sat_html}</div>
  </div>

  <div class="ozet-sec">
    <h2>Öne çıkan — Al sinyali</h2>
    <div class="grid">{al_html}</div>
  </div>

  <div class="ozet-sec">
    <h2>Kategori boşlukları — bugünün en iyi adayı</h2>
    <div class="scroll"><table>
      <thead><tr><th class="l">Kategori</th><th>Kod</th><th class="l">Ad</th><th>Sharpe</th><th>Gider</th></tr></thead>
      <tbody>{''.join(kat_satirlari)}</tbody>
    </table></div>
  </div>

  <footer class="legal">
    <p><strong>Yatırım tavsiyesi değildir.</strong> Bu sayfa kamuya açık fiyat verisi üzerinde çalışan
    mekanik kurallardan üretilmiştir; bir yatırım danışmanının görüşü değildir. Gösterilen sinyaller
    referans portföye aittir — kendi portföyünü <a href="index.html" style="color:var(--accent)">interaktif araçta</a>
    oluşturup kişisel kararlarını orada takip edebilirsin. Bu sayfa her gece otomatik güncellenir.</p>
  </footer>
</div>
</body>
</html>
"""
    OUT.write_text(html, encoding="utf-8")
    print(f"özet sayfası: {OUT} ({OUT.stat().st_size // 1024} KB) — {len(sat)} sat, {len(al)} al, "
          f"{len(kat_satirlari)} kategori önerisi")


if __name__ == "__main__":
    main()
