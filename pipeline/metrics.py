"""Risk/getiri metrik motoru.

Metodoloji kararları (raporda açıkça belirtilir):
  * Birincil karşılaştırma bazı USD'dir. TEFAS fonlarının TL NAV serisi USD/TRY
    ile bölünerek USD'ye çevrilir; böylece TL değer kaybı kaynaklı yapay yüksek
    nominal getiri, gerçek varlık performansından ayrışır.
  * Getiri ayrıştırması: (1+TL getiri) = (1+USD getiri) x (1+kur etkisi)
  * Beta/alpha/TE/IR HAFTALIK getirilerle hesaplanır. TEFAS NAV'ı gecikmeli
    açıklanır ve BIST/NYSE takvimleri farklıdır; günlük veride bu, betayı
    sistematik olarak sıfıra çeker (eşzamansız işlem yanlılığı).
  * 1 yıldan kısa geçmişte yıllıklandırılmış metrik (CAGR/Sharpe/Sortino/alpha)
    ÜRETİLMEZ — 74 günlük %30 getiri yıllıklanınca %800 CAGR gibi görünür.
"""

import json
import os
import pathlib

import numpy as np
import pandas as pd

HERE = pathlib.Path(__file__).parent
DATA = pathlib.Path(os.environ.get("DATA_DIR", pathlib.Path(__file__).parent.parent / "site" / "data"))
TRADING_DAYS = 252
WEEKS = 52

#: Yıllıklandırılmış metrikler için asgari geçmiş (yıl).
MIN_YEARS_FOR_ANNUALIZED = 1.0
#: Korelasyon matrisine girmek için asgari haftalık gözlem.
MIN_HAFTA = 52
#: "Uzun geçmiş" matrisi eşiği (~3 yıl haftalık).
UZUN_ESIK = 150


def load_panel():
    """TL ve USD fiyat serilerini tek bir USD-bazlı panelde birleştirir."""
    tefas = json.loads((DATA / "prices_tefas.json").read_text())
    yahoo = json.loads((DATA / "prices_yahoo.json").read_text())

    def to_series(d):
        s = pd.Series(d, dtype=float)
        s.index = pd.to_datetime(s.index)
        return s.sort_index()

    fx = to_series(yahoo["TRY=X"])  # 1 USD kaç TL

    local, usd = {}, {}
    for code, d in tefas.items():
        s = to_series(d)
        local[code] = s
        fx_aligned = fx.reindex(s.index.union(fx.index)).ffill().reindex(s.index)
        usd[code] = s / fx_aligned
    for sym, d in yahoo.items():
        if sym == "TRY=X":
            continue
        s = to_series(d)
        local[sym] = s
        usd[sym] = s  # zaten USD

    return pd.DataFrame(local).sort_index(), pd.DataFrame(usd).sort_index(), fx, set(tefas)


def cagr(s: pd.Series) -> float:
    s = s.dropna()
    if len(s) < 30:
        return np.nan
    yrs = (s.index[-1] - s.index[0]).days / 365.25
    if yrs <= 0 or s.iloc[0] <= 0:
        return np.nan
    return (s.iloc[-1] / s.iloc[0]) ** (1 / yrs) - 1


def max_drawdown(s: pd.Series) -> float:
    s = s.dropna()
    return float((s / s.cummax() - 1).min()) if not s.empty else np.nan


def metrics_for(s: pd.Series, bench: pd.Series, rf: float) -> dict:
    """Tek enstrüman için tam metrik seti (USD bazlı)."""
    s = s.dropna()
    if len(s) < 60:
        return {"veri_yetersiz": True, "gun": len(s)}

    yrs = (s.index[-1] - s.index[0]).days / 365.25
    yeterli = yrs >= MIN_YEARS_FOR_ANNUALIZED

    r = s.pct_change().dropna()
    ann_vol = float(r.std() * np.sqrt(TRADING_DAYS))
    g = cagr(s) if yeterli else np.nan
    donem = float(s.iloc[-1] / s.iloc[0] - 1)

    downside = r[r < 0]
    dvol = float(downside.std() * np.sqrt(TRADING_DAYS)) if len(downside) > 5 else np.nan

    # --- ölçüte göre duyarlılık: HAFTALIK ---
    sw = s.resample("W-FRI").last().pct_change().dropna()
    bw = bench.resample("W-FRI").last().pct_change().dropna()
    common = sw.index.intersection(bw.index)
    beta = alpha = te = ir = np.nan
    if len(common) >= WEEKS:
        rr, bb = sw.loc[common], bw.loc[common]
        var_b = float(bb.var())
        if var_b > 0:
            beta = float(np.cov(rr, bb)[0, 1] / var_b)
            bench_cagr = cagr(bench.loc[common[0]:common[-1]])
            if yeterli and not np.isnan(bench_cagr) and not np.isnan(g):
                alpha = g - (rf + beta * (bench_cagr - rf))
        diff = rr - bb
        te = float(diff.std() * np.sqrt(WEEKS))
        ir = float(diff.mean() * WEEKS / te) if te > 0 else np.nan

    def rnd(x, n=4):
        return round(float(x), n) if x is not None and not np.isnan(x) else None

    return {
        "gun": int(len(s)),
        "ilk_tarih": s.index[0].strftime("%Y-%m-%d"),
        "son_tarih": s.index[-1].strftime("%Y-%m-%d"),
        "yil": round(yrs, 2),
        "yillik_metrik_gecerli": bool(yeterli),
        "donem_getirisi": rnd(donem),
        "cagr": rnd(g),
        "volatilite": rnd(ann_vol),
        "sharpe": rnd((g - rf) / ann_vol, 3) if yeterli and ann_vol > 0 and not np.isnan(g) else None,
        "sortino": rnd((g - rf) / dvol, 3) if yeterli and dvol and dvol > 0 and not np.isnan(g) else None,
        "max_drawdown": rnd(max_drawdown(s)),
        "beta": rnd(beta, 3),
        "alpha": rnd(alpha),
        "tracking_error": rnd(te),
        "information_ratio": rnd(ir, 3),
        "not": None
        if yeterli
        else f"Geçmiş {yrs:.2f} yıl — yıllıklandırılmış metrikler üretilmedi; "
             "yalnızca dönem getirisi ve volatilite anlamlıdır.",
    }


def window_returns(usd: pd.DataFrame, local: pd.DataFrame, tefas_codes: set) -> dict:
    """1/3/5 yıl ve başlangıçtan beri getiriler; TEFAS için TL/USD/kur ayrıştırması."""
    out = {}
    end = usd.index.max()
    for col in usd.columns:
        su, sl = usd[col].dropna(), local[col].dropna()
        if su.empty:
            continue
        row = {}
        for label, days in [("1y", 365), ("3y", 1095), ("5y", 1826)]:
            start = end - pd.Timedelta(days=days)
            w = su[su.index >= start]
            row[f"usd_{label}"] = (
                round(float(w.iloc[-1] / w.iloc[0] - 1), 4)
                if len(w) > 20 and w.index[0] <= start + pd.Timedelta(days=20)
                else None
            )
        row["usd_baslangictan"] = round(float(su.iloc[-1] / su.iloc[0] - 1), 4)

        if col in tefas_codes:
            for label, days in [("1y", 365), ("3y", 1095), ("5y", 1826)]:
                start = end - pd.Timedelta(days=days)
                wl, wu = sl[sl.index >= start], su[su.index >= start]
                if len(wl) > 20 and len(wu) > 20 and wl.index[0] <= start + pd.Timedelta(days=20):
                    tl_ret = float(wl.iloc[-1] / wl.iloc[0] - 1)
                    usd_ret = float(wu.iloc[-1] / wu.iloc[0] - 1)
                    row[f"tl_{label}"] = round(tl_ret, 4)
                    row[f"kur_etkisi_{label}"] = round((1 + tl_ret) / (1 + usd_ret) - 1, 4)
        out[col] = row
    return out


def main():
    local, usd, fx, tefas_codes = load_panel()

    rf = 0.04
    rf_kaynak = "Varsayım: %4 yıllık USD risksiz oran (ABD kısa vadeli hazine getirisi yaklaşımı)"
    bench = usd["ACWI"].dropna()

    instruments = [c for c in usd.columns if c not in ("SPY", "ACWI", "QQQ", "XU100.IS")]
    weekly = usd[instruments].resample("W-FRI").last()
    wr = weekly.pct_change()

    coverage = wr.notna().sum()
    dahil = [c for c in instruments if coverage[c] >= MIN_HAFTA]
    haric = {c: int(coverage[c]) for c in instruments if coverage[c] < MIN_HAFTA}
    long_history = [c for c in instruments if coverage[c] >= UZUN_ESIK]

    corr_all = wr[dahil].dropna(how="any").corr().round(3)
    corr_long = wr[long_history].dropna(how="any").corr().round(3)

    fxd = fx.dropna()
    fx_1y_start = fxd[fxd.index >= fxd.index[-1] - pd.Timedelta(days=365)].iloc[0]

    results = {
        "uretim_tarihi": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M"),
        "metodoloji": {
            "baz_para_birimi": "USD",
            "risksiz_oran": rf,
            "risksiz_oran_kaynak": rf_kaynak,
            "olcut": "ACWI (MSCI All Country World)",
            "korelasyon_frekansi": "haftalık (Cuma)",
            "beta_frekansi": "haftalık (eşzamansız işlem yanlılığını azaltmak için)",
            "yillik_metrik_asgari_gecmis_yil": MIN_YEARS_FOR_ANNUALIZED,
        },
        "metrikler": {c: metrics_for(usd[c], bench, rf) for c in usd.columns},
        "getiriler": window_returns(usd, local, tefas_codes),
        "korelasyon_tam_evren": {
            "pencere_hafta": int(len(wr[dahil].dropna(how="any"))),
            "enstrumanlar": dahil,
            "matris": corr_all.to_dict(),
            "haric_tutulanlar": haric,
            "haric_gerekce": f"{MIN_HAFTA} haftadan kısa geçmişli enstrümanlar matrise alınmadı.",
        },
        "korelasyon_uzun_gecmis": {
            "pencere_hafta": int(len(wr[long_history].dropna(how="any"))),
            "enstrumanlar": long_history,
            "matris": corr_long.to_dict(),
        },
        "kur": {
            "usdtry_son": round(float(fxd.iloc[-1]), 4),
            "usdtry_1y_degisim": round(float(fxd.iloc[-1] / fx_1y_start - 1), 4),
        },
    }

    (DATA / "metrics.json").write_text(json.dumps(results, ensure_ascii=False, indent=1))

    print(f"USD/TRY son: {results['kur']['usdtry_son']}  "
          f"1y değişim: %{results['kur']['usdtry_1y_degisim']*100:.1f}")
    print(f"Tam evren korelasyon: {results['korelasyon_tam_evren']['pencere_hafta']} hafta "
          f"({len(dahil)} enstrüman); hariç: {list(haric)}")
    print(f"Uzun geçmiş: {results['korelasyon_uzun_gecmis']['pencere_hafta']} hafta "
          f"({len(long_history)} enstrüman)")

    rows = [
        (k, m.get("cagr"), m.get("volatilite"), m.get("sharpe"),
         m.get("max_drawdown"), m.get("beta"), m.get("gun"))
        for k, m in results["metrikler"].items()
    ]
    df = pd.DataFrame(rows, columns=["kod", "CAGR", "Vol", "Sharpe", "MaxDD", "Beta", "gun"])
    print("\n=== USD bazlı metrikler (tüm geçmiş) ===")
    print(df.sort_values("Sharpe", ascending=False, na_position="last").to_string(index=False))


if __name__ == "__main__":
    main()
