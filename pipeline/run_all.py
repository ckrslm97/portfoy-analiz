"""Günlük veri hattı orkestratörü — GitHub Actions'ta tek komutla çalışır.

Sıra bilinçli: önce fiyatlar (kritik, TEFAS/Yahoo), sonra aday enstrüman
fiyatları (Tavsiye Motoru için kritik), sonra künye/holdings (daha az kritik —
başarısızlıkta eski veri korunur), en son deterministik derleme adımları.

fetch_data ve fetch_candidates TAMAMEN başarısız olursa (her iki kaynak da
çöker) SystemExit(1) fırlatır ve burada YAKALANMAZ — akış kasıtlı olarak durur.
Bu durumda git'e hiçbir şey commit'lenmez, site bir önceki günün verisiyle
kalmaya devam eder; Actions çalışması kırmızıya düşerek durumu bildirir.
"""

import importlib
import sys


ADIMLAR = [
    ("fetch_data", "1/6 — TEFAS + Yahoo Finance (portföy fiyatları)"),
    ("fetch_candidates", "2/6 — Aday enstrüman fiyatları ve künyeleri"),
    ("holdings_overlap", "3/6 — ETF içerik / çakışma"),
    ("etf_profile", "4/6 — Portföy ETF/hisse künyeleri"),
    ("build_app_data", "5/6 — Uygulama veri paketi (app_data.json)"),
    ("add_sparks", "6/6 — Sparkline serileri"),
]


def main():
    for modname, baslik in ADIMLAR:
        print(f"\n{'=' * 64}\n{baslik}\n{'=' * 64}")
        mod = importlib.import_module(modname)
        mod.main()
    print("\nTüm adımlar tamamlandı.")


if __name__ == "__main__":
    try:
        main()
    except SystemExit as exc:
        print(f"\n! Hat durduruldu (çıkış kodu {exc.code}) — önceki veri korunuyor.")
        sys.exit(exc.code)
