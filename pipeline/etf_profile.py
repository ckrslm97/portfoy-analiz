"""ETF künye toplayıcı: AUM, gider oranı, kuruluş tarihi, takip edilen endeks.

Kaynak: stockanalysis.com ETF özet sayfası. Sayfa "Assets Under Management",
"Expense Ratio", "Inception Date", "Index Tracked" gibi etiketleri anahtar/değer
çiftleri halinde yayınlar. Bulunamayan alan None döner — tahmin edilmez.
"""

import json
import os
import pathlib
import re
import time

import requests

from universe import ETFS, STOCKS

HERE = pathlib.Path(__file__).parent
DATA = pathlib.Path(os.environ.get("DATA_DIR", pathlib.Path(__file__).parent.parent / "site" / "data"))
DATA.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
}
_TAG = re.compile(r"<[^>]+>")

#: Sayfadaki etiket -> çıktı alanı
FIELDS = {
    "Assets": "aum",
    "Expense Ratio": "gider_orani",
    "Inception Date": "kurulus",
    "Index Tracked": "endeks",
    "Issuer": "ihracci",
    "Dividend Yield": "temettu_verimi",
    "Shares Outstanding": "pay_adedi",
}


def _clean(s: str) -> str:
    return _TAG.sub(" ", s).replace("&amp;", "&").replace("&nbsp;", " ").strip()


def fetch_profile(symbol: str, is_stock: bool = False) -> dict:
    base = "stocks" if is_stock else "etf"
    url = f"https://stockanalysis.com/{base}/{symbol.lower()}/"
    out = {"sembol": symbol, "kaynak": url, "cekim": time.strftime("%Y-%m-%d")}
    try:
        r = requests.get(url, headers=HEADERS, timeout=30, allow_redirects=True)
        if r.status_code != 200:
            out["_hata"] = f"HTTP {r.status_code}"
            return out
        html = r.text
    except requests.RequestException as exc:
        out["_hata"] = str(exc)
        return out

    # tam ad: <h1> ya da <title>
    m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
    if m:
        out["tam_ad"] = _clean(m.group(1))

    # etiket/değer: aynı satırda ya da komşu hücrelerde geçer
    for label, key in FIELDS.items():
        m = re.search(
            re.escape(label) + r"\s*</[^>]+>\s*(?:<[^>]+>\s*){0,3}([^<]{1,60})", html
        )
        if m:
            val = _clean(m.group(1))
            if val and val not in ("-", "n/a", "N/A"):
                out[key] = val
    return out


def main():
    onceki = {}
    p = DATA / "etf_profiles.json"
    if p.exists():
        try:
            onceki = json.loads(p.read_text())
        except json.JSONDecodeError:
            pass

    profiles = dict(onceki)
    for sym in ETFS + STOCKS:
        yeni = fetch_profile(sym, is_stock=sym in STOCKS)
        if yeni.get("_hata") and sym in onceki:
            # Bugün çekilemedi ama daha önce iyi veri vardı — sil, koru.
            print(f"  {sym:5} BAŞARISIZ ({yeni['_hata']}) — önceki veri korundu")
            continue
        profiles[sym] = yeni
        if sym in STOCKS:
            print(f"  {sym:5} [HİSSE] {str(yeni.get('tam_ad'))[:60]}")
        else:
            print(f"  {sym:5} AUM={yeni.get('aum','-'):>12}  ER={yeni.get('gider_orani','-'):>7}  "
                  f"kuruluş={yeni.get('kurulus','-'):>12}  {str(yeni.get('tam_ad'))[:45]}")
        time.sleep(1.0)

    (DATA / "etf_profiles.json").write_text(json.dumps(profiles, ensure_ascii=False, indent=1))
    print("\n->", DATA / "etf_profiles.json")


if __name__ == "__main__":
    main()
