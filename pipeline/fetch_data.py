"""Dayanıklı fiyat toplayıcı: TEFAS (TL NAV) + Yahoo Finance (USD kapanış).

Tasarım ilkesi: **veri asla kaybolmaz.** Her çalışmada mevcut JSON okunur, yeni
gözlemler üzerine birleştirilir. Bir kaynak tamamen çökerse eski veri korunur ve
`health.json` durumu "stale" olarak işaretler — site bozulmaz, sadece tazelik
damgası eskir.

Bu, GitHub Actions'ta çalışacak şekilde yazılmıştır: TEFAS'ın WAF'ı veri merkezi
IP'lerini bloklayabilir, Yahoo rate-limit verebilir. Her iki durumda da kısmi
başarı normaldir ve akışı kesmez.
"""

from __future__ import annotations

import json
import os
import pathlib
import time

import requests

from universe import BENCHMARKS, ETFS, STOCKS, TEFAS

HERE = pathlib.Path(__file__).parent
DATA = pathlib.Path(os.environ.get("DATA_DIR", HERE.parent / "site" / "data"))
DATA.mkdir(parents=True, exist_ok=True)
WATCHLIST_PATH = HERE.parent / "watchlist.json"

TEFAS_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    ),
    "Content-Type": "application/json",
    "Referer": "https://www.tefas.gov.tr/tr/fon-verileri",
    "Origin": "https://www.tefas.gov.tr",
    "Accept": "application/json",
}
TEFAS_BASE = "https://www.tefas.gov.tr/api/funds"
YAHOO = "https://query1.finance.yahoo.com/v8/finance/chart/{}"

#: Bir kaynağın "sağlıklı" sayılması için gereken asgari başarı oranı.
MIN_BASARI = 0.5


def read_json(name: str, default):
    p = DATA / name
    if p.exists():
        try:
            return json.loads(p.read_text())
        except json.JSONDecodeError:
            print(f"  ! {name} bozuk, sıfırdan başlanıyor")
    return default


def write_json(name: str, obj):
    (DATA / name).write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))


def merge_series(eski: dict, yeni: dict) -> dict:
    """Yeni gözlemleri eskinin üzerine yazar; eskiyi asla silmez."""
    out = dict(eski)
    out.update(yeni)
    return out


def tefas_post(path: str, payload: dict, tries: int = 4):
    for i in range(tries):
        try:
            r = requests.post(f"{TEFAS_BASE}/{path}", headers=TEFAS_HEADERS,
                              json=payload, timeout=45)
            if r.status_code == 200:
                return r.json()
            if r.status_code in (403, 429, 500, 502, 503):
                time.sleep(3 * (i + 1))
                continue
            return None
        except requests.RequestException:
            if i == tries - 1:
                return None
            time.sleep(3 * (i + 1))
    return None


def fetch_tefas(kodlar: list[str]) -> tuple[dict, dict, dict]:
    prices = read_json("prices_tefas.json", {})
    meta = read_json("meta_tefas.json", {})
    basarili, basarisiz = [], []

    for code in kodlar:
        hist = tefas_post("fonFiyatBilgiGetir",
                          {"fonKodu": code, "dil": "TR", "periyod": 60})
        rows = (hist or {}).get("resultList") or []
        yeni = {r["tarih"]: r["fiyat"] for r in rows if r.get("fiyat")}

        if yeni:
            prices[code] = merge_series(prices.get(code, {}), yeni)
            basarili.append(code)
        else:
            basarisiz.append(code)

        info = tefas_post("fonBilgiGetir", {"dil": "TR", "fonKodu": code})
        res = (info or {}).get("resultList") or []
        if res:
            meta[code] = res[0]

        print(f"  TEFAS {code}: {'+' + str(len(yeni)) if yeni else 'BAŞARISIZ'}"
              f" (toplam {len(prices.get(code, {}))})")
        time.sleep(1.2)

    write_json("prices_tefas.json", prices)
    write_json("meta_tefas.json", meta)
    return prices, {"basarili": basarili, "basarisiz": basarisiz}, meta


def fetch_yahoo(semboller: list[str]) -> tuple[dict, dict]:
    prices = read_json("prices_yahoo.json", {})
    meta = read_json("meta_yahoo.json", {})
    basarili, basarisiz = [], []

    for sym in semboller:
        yeni, m = {}, None
        for attempt in range(3):
            try:
                r = requests.get(YAHOO.format(sym),
                                 params={"range": "10y", "interval": "1d",
                                         "events": "div,split"},
                                 headers={"User-Agent": "Mozilla/5.0"}, timeout=40)
                if r.status_code == 429:
                    time.sleep(5 * (attempt + 1))
                    continue
                res = (r.json().get("chart") or {}).get("result")
                if not res:
                    break
                res = res[0]
                ts = res.get("timestamp") or []
                adj = res["indicators"].get("adjclose")
                closes = (adj[0]["adjclose"] if adj
                          else res["indicators"]["quote"][0]["close"])
                yeni = {time.strftime("%Y-%m-%d", time.gmtime(t)): round(float(c), 6)
                        for t, c in zip(ts, closes) if c is not None}
                m = res.get("meta", {})
                break
            except (requests.RequestException, ValueError, KeyError, IndexError):
                time.sleep(3 * (attempt + 1))

        if yeni:
            prices[sym] = merge_series(prices.get(sym, {}), yeni)
            basarili.append(sym)
            if m:
                meta[sym] = {
                    "longName": m.get("longName") or m.get("shortName"),
                    "quoteType": m.get("instrumentType"),
                    "currency": m.get("currency"),
                    "exchange": m.get("fullExchangeName"),
                    "firstTradeDate": (time.strftime("%Y-%m-%d", time.gmtime(m["firstTradeDate"]))
                                       if m.get("firstTradeDate") else None),
                    "price": m.get("regularMarketPrice"),
                }
        else:
            basarisiz.append(sym)

        print(f"  Yahoo {sym}: {'+' + str(len(yeni)) if yeni else 'BAŞARISIZ'}"
              f" (toplam {len(prices.get(sym, {}))})")
        time.sleep(0.4)

    write_json("prices_yahoo.json", prices)
    write_json("meta_yahoo.json", meta)
    return prices, {"basarili": basarili, "basarisiz": basarisiz}


def son_tarih(prices: dict) -> str | None:
    tarihler = [max(v) for v in prices.values() if v]
    return max(tarihler) if tarihler else None


def main():
    watch = {}
    if WATCHLIST_PATH.exists():
        try:
            watch = json.loads(WATCHLIST_PATH.read_text())
        except json.JSONDecodeError:
            print(f"  ! {WATCHLIST_PATH.name} bozuk, izleme listesi atlandı")
    ek_tefas = [k for k in watch.get("ekle", []) if len(k) == 3 and k.isalpha()]

    tefas_kodlar = list(TEFAS) + [k for k in ek_tefas if k not in TEFAS]
    yahoo_semboller = ETFS + STOCKS + list(BENCHMARKS)
    cand = read_json("categories.json", {})
    yahoo_semboller += [s for v in cand.values() for s in v if s not in yahoo_semboller]
    watch_us = [k for k in watch.get("ekle", []) if k not in yahoo_semboller]
    yahoo_semboller += watch_us

    print("== Yahoo Finance ==")
    py, hy = fetch_yahoo(yahoo_semboller)
    print("\n== TEFAS ==")
    pt, ht, _ = fetch_tefas(tefas_kodlar)

    def oran(h):
        n = len(h["basarili"]) + len(h["basarisiz"])
        return len(h["basarili"]) / n if n else 0.0

    health = {
        "calisma": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "yahoo": {**hy, "oran": round(oran(hy), 3), "son_veri": son_tarih(py)},
        "tefas": {**ht, "oran": round(oran(ht), 3), "son_veri": son_tarih(pt)},
    }
    health["durum"] = ("saglikli" if oran(hy) >= MIN_BASARI and oran(ht) >= MIN_BASARI
                       else ("kismi" if oran(hy) >= MIN_BASARI or oran(ht) >= MIN_BASARI
                             else "basarisiz"))
    write_json("health.json", health)

    print(f"\nDurum: {health['durum']}")
    print(f"  Yahoo  {len(hy['basarili'])}/{len(yahoo_semboller)} — son veri {health['yahoo']['son_veri']}")
    print(f"  TEFAS  {len(ht['basarili'])}/{len(tefas_kodlar)} — son veri {health['tefas']['son_veri']}")
    if ht["basarisiz"]:
        print(f"  TEFAS başarısız: {', '.join(ht['basarisiz'][:12])}")
    if hy["basarisiz"]:
        print(f"  Yahoo başarısız: {', '.join(hy['basarisiz'][:12])}")

    # Tamamen başarısızsa çıkış kodu 1 — Actions kırmızıya düşer ama site bozulmaz.
    if health["durum"] == "basarisiz":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
