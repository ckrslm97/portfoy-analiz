"""ETF içerik (holdings) toplayıcı + çakışma (overlap) hesabı.

Kaynak: stockanalysis.com — ilk ~25 varlığı sembol/isim/ağırlık ile verir.
Ağırlık toplamı %100 olmadığından hesaplanan overlap bir ALT SINIRDIR; raporda
"kapsama %" ile birlikte sunulur.

Overlap tanımı (standart): sum_i min(w_A_i, w_B_i)
"""

import itertools
import json
import os
import pathlib
import re
import time

import requests

from universe import ETFS, STOCKS


def _aday_etf_kodlari() -> list[str]:
    """Kategori genişletme adaylarının ETF sembolleri (fetch_candidates.py'nin
    yazdığı categories.json'dan) — böylece Tavsiye Motoru'nda önerilen
    ETF'lerin de gerçek holdings verisi olur, yalnızca portföy ETF'leri değil.
    Modül yüklenirken değil, main() çalışırken çağrılır (DATA o an tanımlı)."""
    p = DATA / "categories.json"
    if not p.exists():
        return []
    cats = json.loads(p.read_text())
    return sorted({s for v in cats.values() for s in v})

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

_TR = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S)
_CELL = re.compile(r"<t[dh][^>]*>(.*?)</t[dh]>", re.S)
_TAG = re.compile(r"<[^>]+>")


def _text(c: str) -> str:
    return _TAG.sub("", c).replace("&amp;", "&").strip()


def fetch_holdings(symbol: str):
    """(sembol, isim, ağırlık%) listesi. Boş liste = veri yok."""
    url = f"https://stockanalysis.com/etf/{symbol.lower()}/holdings/"
    try:
        r = requests.get(url, headers=HEADERS, timeout=30, allow_redirects=True)
        if r.status_code != 200:
            return []
        html = r.text
    except requests.RequestException:
        return []

    rows = []
    for tr in _TR.findall(html):
        cells = [_text(c) for c in _CELL.findall(tr)]
        if len(cells) < 4:
            continue
        sym = cells[1].upper()
        # Uluslararası (Avrupa/Japonya/vb.) holdings "BORSA: KOD" biçiminde gelir
        # (ör. "AMS: ASML", "LON: HSBA") — düz ABD ticker deseninden farklı,
        # ayrıca kabul edilmezse bu ETF'lerin holdings'i tamamen boş kalır.
        duz = re.fullmatch(r"[A-Z][A-Z.\-]{0,6}", sym)
        borsali = re.fullmatch(r"[A-Z]{2,5}:\s*[A-Z0-9.\-]{1,10}", sym)
        if not (duz or borsali):
            continue
        pct = None
        for c in cells[2:5]:
            m = re.fullmatch(r"(-?\d+(?:\.\d+)?)%", c.strip())
            if m:
                pct = float(m.group(1))
                break
        if pct is None:
            continue
        rows.append((sym, cells[2], pct))
    return rows


def overlap(a, b) -> tuple[float, int]:
    da = {s: w for s, _, w in a}
    db = {s: w for s, _, w in b}
    ortak = set(da) & set(db)
    return round(sum(min(da[s], db[s]) for s in ortak), 2), len(ortak)


def main():
    # Önceki başarılı sonucu koru — bir sembol bugün 0 satır dönerse (geçici
    # ağ hatası, sayfa yapısı değişikliği) eski holdings'i SİLME.
    onceki = {}
    p = DATA / "holdings.json"
    if p.exists():
        try:
            onceki = json.loads(p.read_text())
        except json.JSONDecodeError:
            pass

    holdings = dict(onceki)
    hedef_etfler = sorted(set(ETFS) | set(_aday_etf_kodlari()))
    print(f"  {len(hedef_etfler)} ETF için holdings çekiliyor "
          f"({len(ETFS)} portföy + {len(hedef_etfler) - len(ETFS)} aday)")
    for sym in hedef_etfler:
        h = fetch_holdings(sym)
        if h:
            holdings[sym] = h
            print(f"  {sym}: {len(h)} varlık, kapsama %{round(sum(w for _, _, w in h), 1)}")
        else:
            print(f"  {sym}: BAŞARISIZ — {'önceki veri korundu' if sym in onceki else 'veri yok'}")
        time.sleep(1.0)

    # tek hisseler: kendisi %100 — overlap hesabına girsin
    for sym in STOCKS:
        holdings[sym] = [(sym, sym, 100.0)]

    (DATA / "holdings.json").write_text(json.dumps(holdings, ensure_ascii=False, indent=1))

    pairs = {}
    keys = [k for k, v in holdings.items() if v]
    for a, b in itertools.combinations(keys, 2):
        ov, n = overlap(holdings[a], holdings[b])
        if ov > 0:
            pairs[f"{a}|{b}"] = {"overlap_pct": ov, "ortak_hisse": n}

    top = sorted(pairs.items(), key=lambda kv: -kv[1]["overlap_pct"])
    (DATA / "overlap.json").write_text(
        json.dumps(
            {
                "yontem": "sum_i min(w_A_i, w_B_i), ilk ~25 varlık üzerinden — ALT SINIR",
                "kapsama": {k: round(sum(w for _, _, w in v), 1) for k, v in holdings.items() if v},
                "ciftler": dict(top),
            },
            ensure_ascii=False,
            indent=1,
        )
    )

    print("\n=== En yüksek çakışan çiftler (alt sınır) ===")
    for k, v in top[:25]:
        print(f"  {k:16} %{v['overlap_pct']:5.1f}  ({v['ortak_hisse']} ortak hisse)")


if __name__ == "__main__":
    main()
