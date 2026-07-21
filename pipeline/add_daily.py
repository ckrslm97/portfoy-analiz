"""app_data.json'a günlük fiyat serisi ekler — detay panelindeki 1H/1A/3A/6A/12A
aralık seçicileri bunu kullanır.

Son ~400 takvim günü (12 aylık en geniş aralığa güvenli tampon payıyla) USD
bazlı günlük fiyat. Boyutu düşürmek için:
  * tarihler epoch gün sayısına çevrilir ("g": 2020-01-01'den beri gün sayısı,
    "2026-07-21" gibi 10 karakterlik string yerine ~5 haneli tamsayı),
  * fiyatlar 4 basamağa yuvarlanır.

`spark` (2 yıl, haftalık, sparkline'lar için) alanından FARKLI ve ayrı bir
alandır — 1 haftalık aralığı anlamlı göstermek için günlük çözünürlük şart.
"""

import json
import os
import pathlib

import pandas as pd

from build_app_data import load_all

DATA = pathlib.Path(os.environ.get("DATA_DIR", pathlib.Path(__file__).parent.parent / "site" / "data"))
EPOCH = pd.Timestamp("2020-01-01")


def main():
    d = json.loads((DATA / "app_data.json").read_text())
    panel, _ = load_all()

    end = panel.index.max()
    start = end - pd.Timedelta(days=400)
    win = panel[panel.index >= start]

    gunluk = {}
    for kod in list(d["portfoy"]) + list(d["aday"]):
        if kod not in win.columns:
            continue
        s = win[kod].dropna()
        if len(s) < 5:
            continue
        gunluk[kod] = {
            "g": [int((t - EPOCH).days) for t in s.index],
            "f": [round(float(x), 4) for x in s.values],
        }

    d["gunluk"] = gunluk
    d["gunluk_epoch"] = EPOCH.strftime("%Y-%m-%d")
    (DATA / "app_data.json").write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")))
    print("günlük seri:", len(gunluk), "| dosya:", (DATA / "app_data.json").stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
