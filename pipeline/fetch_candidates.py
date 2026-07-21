"""Kategori genişletme adaylarının fiyat ve künye verisi.

Rapordaki eksik alan analizinde önerilen ETF'ler + bazı ek adaylar.
Çıktı: data/prices_cand.json, data/meta_cand.json, data/profiles_cand.json,
data/categories.json

Dayanıklılık: bir sembol bugün çekilemezse önceki başarılı veri korunur —
fetch_data.py'deki "veri asla kaybolmaz" ilkesiyle aynı.
"""

import json
import os
import pathlib
import time

import requests

from etf_profile import fetch_profile

HERE = pathlib.Path(__file__).parent
DATA = pathlib.Path(os.environ.get("DATA_DIR", pathlib.Path(__file__).parent.parent / "site" / "data"))
DATA.mkdir(parents=True, exist_ok=True)
YAHOO = "https://query1.finance.yahoo.com/v8/finance/chart/{}"

#: kategori -> adaylar. Rapordaki "Eksik Alanlar" bölümüyle birebir.
CAND = {
    "Avrupa": ["VGK", "IEUR", "IEV"],
    "Japonya": ["EWJ", "BBJP", "DXJ"],
    "Hindistan": ["INDA", "EPI", "INDY"],
    "Gelişmekte olan": ["VWO", "IEMG", "EMXC"],
    "REIT": ["VNQ", "SCHH", "REET"],
    "Temettü/değer": ["SCHD", "VYM", "DGRO", "VTV"],
    "Bankacılık": ["KBE", "KRE", "IAT"],
    "Sigorta": ["KIE"],
    "Tüketim": ["XLP", "XLY"],
    "Endüstriyel": ["XLI", "PAVE"],
    "Altyapı": ["IGF", "NFRA"],
    "Su": ["CGW", "PHO", "FIW"],
    "Küçük ölçek": ["IWM", "VB", "AVUV"],
    "Biyoteknoloji": ["IBB"],
    "Küresel Çekirdek": ["VT", "VXUS", "ACWI"],
}


def read_json(name: str, default):
    p = DATA / name
    if p.exists():
        try:
            return json.loads(p.read_text())
        except json.JSONDecodeError:
            pass
    return default


def fetch_prices(symbols: list[str]) -> tuple[dict, dict, list[str]]:
    prices = read_json("prices_cand.json", {})
    meta = read_json("meta_cand.json", {})
    basarisiz = []
    for sym in symbols:
        try:
            r = requests.get(YAHOO.format(sym),
                             params={"range": "10y", "interval": "1d", "events": "div,split"},
                             headers={"User-Agent": "Mozilla/5.0"}, timeout=40)
            res = (r.json().get("chart") or {}).get("result")
            if not res:
                print(f"  {sym}: VERİ YOK"); basarisiz.append(sym); continue
            res = res[0]
            ts = res.get("timestamp") or []
            adj = res["indicators"].get("adjclose")
            closes = adj[0]["adjclose"] if adj else res["indicators"]["quote"][0]["close"]
            yeni = {time.strftime("%Y-%m-%d", time.gmtime(t)): round(float(c), 6)
                    for t, c in zip(ts, closes) if c is not None}
            if yeni:
                prices[sym] = dict(prices.get(sym, {}), **yeni)
                m = res.get("meta", {})
                meta[sym] = {
                    "longName": m.get("longName") or m.get("shortName"),
                    "currency": m.get("currency"),
                    "firstTradeDate": (time.strftime("%Y-%m-%d", time.gmtime(m["firstTradeDate"]))
                                       if m.get("firstTradeDate") else None),
                    "price": m.get("regularMarketPrice"),
                }
                print(f"  {sym}: {len(prices[sym])} gün — {meta[sym]['longName']}")
            else:
                basarisiz.append(sym)
        except Exception as e:  # noqa: BLE001 - toplayıcı, tek sembol hatası akışı kesmemeli
            print(f"  {sym}: HATA {e}")
            basarisiz.append(sym)
        time.sleep(0.35)
    return prices, meta, basarisiz


def fetch_profiles(symbols: list[str]) -> dict:
    onceki = read_json("profiles_cand.json", {})
    prof = dict(onceki)
    for sym in symbols:
        yeni = fetch_profile(sym)
        if yeni.get("_hata") and sym in onceki:
            print(f"  {sym:6} BAŞARISIZ — önceki künye korundu")
            continue
        prof[sym] = yeni
        print(f"  {sym:6} AUM={yeni.get('aum','-'):>10} ER={yeni.get('gider_orani','-'):>7} "
              f"{str(yeni.get('tam_ad'))[:48]}")
        time.sleep(0.8)
    return prof


def main():
    syms = sorted({s for v in CAND.values() for s in v})
    prices, meta, basarisiz = fetch_prices(syms)
    (DATA / "prices_cand.json").write_text(json.dumps(prices))
    (DATA / "meta_cand.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))
    (DATA / "categories.json").write_text(json.dumps(CAND, ensure_ascii=False, indent=1))

    prof = fetch_profiles(syms)
    (DATA / "profiles_cand.json").write_text(json.dumps(prof, ensure_ascii=False, indent=1))

    print(f"\nBitti: {len(prices)} fiyat serisi, {len(prof)} künye"
          + (f" — başarısız: {', '.join(basarisiz)}" if basarisiz else ""))


if __name__ == "__main__":
    main()
