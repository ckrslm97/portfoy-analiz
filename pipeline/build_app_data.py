"""Uygulamaya gömülecek veri paketini üretir.

Çıktı: data/app_data.json — tek dosya, rapor uygulamasının içine gömülür.
İçerik: portföy enstrümanları + aday havuzu, her biri için metrikler,
kategori eşlemesi, korelasyon/çakışma özeti ve al/sat/bekle sinyalleri.
"""

import json
import os
import pathlib

import numpy as np
import pandas as pd

from metrics import MIN_YEARS_FOR_ANNUALIZED, cagr, max_drawdown
from universe import ETFS, MISMATCH, STOCKS, TEFAS, THEMES, US

HERE = pathlib.Path(__file__).parent
DATA = pathlib.Path(os.environ.get("DATA_DIR", HERE.parent / "site" / "data"))
WATCHLIST_PATH = HERE.parent / "watchlist.json"
TRADING_DAYS = 252
WEEKS = 52
RF = 0.04


def read_watchlist() -> list[str]:
    """Kullanıcının Ekle/Çıkar ekranından indirip repoya commit'lediği kod listesi.

    fetch_data.py bu kodların fiyatını zaten çekmiş olmalı (aynı dosyayı okur).
    Burada yalnızca fiyatı gerçekten gelmiş olanlar aday havuzuna eklenir —
    geçersiz/bulunamayan kodlar sessizce atlanır, kullanıcı kuyruğunda kalır.
    """
    if WATCHLIST_PATH.exists():
        try:
            return json.loads(WATCHLIST_PATH.read_text()).get("ekle", [])
        except json.JSONDecodeError:
            return []
    return []


def load_all():
    """Portföy + aday serilerini tek USD panelinde birleştirir."""
    py = json.loads((DATA / "prices_yahoo.json").read_text())
    pt = json.loads((DATA / "prices_tefas.json").read_text())
    pc = json.loads((DATA / "prices_cand.json").read_text())

    def ser(d):
        s = pd.Series(d, dtype=float)
        s.index = pd.to_datetime(s.index)
        return s.sort_index()

    fx = ser(py["TRY=X"])
    usd = {}
    for code, d in pt.items():
        s = ser(d)
        fxa = fx.reindex(s.index.union(fx.index)).ffill().reindex(s.index)
        usd[code] = s / fxa
    for src in (py, pc):
        for sym, d in src.items():
            if sym == "TRY=X" or sym in usd:
                continue
            usd[sym] = ser(d)
    return pd.DataFrame(usd).sort_index(), set(pt)


def metrics(s: pd.Series, bench: pd.Series) -> dict:
    s = s.dropna()
    if len(s) < 60:
        return {"yetersiz": True, "gun": int(len(s))}
    yrs = (s.index[-1] - s.index[0]).days / 365.25
    ok = yrs >= MIN_YEARS_FOR_ANNUALIZED
    r = s.pct_change().dropna()
    vol = float(r.std() * np.sqrt(TRADING_DAYS))
    g = cagr(s) if ok else np.nan
    dn = r[r < 0]
    dvol = float(dn.std() * np.sqrt(TRADING_DAYS)) if len(dn) > 5 else np.nan

    sw = s.resample("W-FRI").last().pct_change().dropna()
    bw = bench.resample("W-FRI").last().pct_change().dropna()
    com = sw.index.intersection(bw.index)
    beta = alpha = np.nan
    if len(com) >= WEEKS:
        rr, bb = sw.loc[com], bw.loc[com]
        if float(bb.var()) > 0:
            beta = float(np.cov(rr, bb)[0, 1] / bb.var())
            bc = cagr(bench.loc[com[0]:com[-1]])
            if ok and not np.isnan(bc) and not np.isnan(g):
                alpha = g - (RF + beta * (bc - RF))

    def R(x, n=4):
        return round(float(x), n) if x is not None and not np.isnan(x) else None

    end = s.index[-1]
    win = {}
    for lab, d in [("1y", 365), ("3y", 1095), ("5y", 1826)]:
        st = end - pd.Timedelta(days=d)
        w = s[s.index >= st]
        win[lab] = R(w.iloc[-1] / w.iloc[0] - 1) if len(w) > 20 and w.index[0] <= st + pd.Timedelta(days=20) else None

    return {
        "gun": int(len(s)), "yil": round(yrs, 2), "yillik_gecerli": bool(ok),
        "son_fiyat": R(s.iloc[-1], 4), "son_tarih": end.strftime("%Y-%m-%d"),
        "cagr": R(g), "vol": R(vol),
        "sharpe": R((g - RF) / vol, 3) if ok and vol > 0 and not np.isnan(g) else None,
        "sortino": R((g - RF) / dvol, 3) if ok and dvol and dvol > 0 and not np.isnan(g) else None,
        "maxdd": R(max_drawdown(s)), "beta": R(beta, 3), "alpha": R(alpha),
        "r1y": win["1y"], "r3y": win["3y"], "r5y": win["5y"],
    }


def risk_kademe(m: dict) -> str:
    if m.get("yetersiz") or m.get("vol") is None:
        return "veri-yok"
    p = [0 if m["vol"] < 0.12 else (1 if m["vol"] <= 0.25 else 2)]
    if m.get("maxdd") is not None:
        p.append(0 if m["maxdd"] > -0.15 else (1 if m["maxdd"] >= -0.35 else 2))
    if m.get("beta") is not None:
        p.append(0 if m["beta"] < 0.7 else (1 if m["beta"] <= 1.3 else 2))
    return ["dusuk", "orta", "yuksek"][int(round(float(np.median(p))))]


def sinyal(kod: str, m: dict, ov_max: float, corr_max: float, er: float | None) -> dict:
    """Kural tabanlı AL/SAT/BEKLE sinyali. Her kural gerekçesiyle döner.

    İki sert kapı puanlamadan önce gelir: yetersiz geçmiş ve doğrulanamamış kimlik.
    Bunlar puanla telafi edilemez — güvenilmez girdiyle üretilen sinyal, sinyal değildir.
    """
    # Kapı 1 — veri yeterliliği
    if m.get("yetersiz") or not m.get("yillik_gecerli"):
        return {"sinyal": "BEKLE", "puan": 0, "kapi": "veri",
                "nedenler": ["Bir yıldan kısa geçmiş — güvenilir sinyal üretilemez"]}

    # Kapı 2 — kimlik doğrulaması
    if kod in MISMATCH:
        return {"sinyal": "BEKLE", "puan": 0, "kapi": "kimlik",
                "nedenler": [f"Kimlik uyuşmazlığı: {MISMATCH[kod]}",
                             "Kimlik doğrulanmadan sinyal üretilmez"]}

    puan, nedenler = 0, []

    a = m.get("alpha")
    if a is not None:
        if a > 0.02:
            puan += 2; nedenler.append(f"Ölçüt üstü alfa (+%{a*100:.1f})")
        elif a < -0.03:
            puan -= 2; nedenler.append(f"Kalıcı negatif alfa (%{a*100:.1f})")

    sh = m.get("sharpe")
    if sh is not None:
        if sh > 0.6:
            puan += 2; nedenler.append(f"Güçlü risk-ayarlı getiri (Sharpe {sh})")
        elif sh < 0:
            puan -= 3; nedenler.append(f"Negatif Sharpe ({sh}) — risk karşılıksız")
        elif sh < 0.25:
            puan -= 1; nedenler.append(f"Zayıf Sharpe ({sh})")

    if m.get("maxdd") is not None and m["maxdd"] < -0.70:
        puan -= 2; nedenler.append(f"Aşırı düşüş geçmişi (%{m['maxdd']*100:.0f})")

    if ov_max >= 60:
        puan -= 3; nedenler.append(f"Portföyde %{ov_max:.0f} çakışan bir pozisyon var — tekrar")
    elif ov_max >= 40:
        puan -= 1; nedenler.append(f"Portföyde %{ov_max:.0f} çakışma var")

    if corr_max >= 0.95:
        puan -= 3; nedenler.append(f"Başka bir pozisyonla ρ={corr_max:.2f} — fiilen aynı varlık")
    elif corr_max >= 0.88:
        puan -= 1; nedenler.append(f"Yüksek korelasyon (ρ={corr_max:.2f})")

    if er is not None:
        if er > 0.60 and (a is None or a < 0):
            puan -= 2; nedenler.append(f"Yüksek gider (%{er:.2f}) + alfa üretmiyor")
        elif er <= 0.10:
            puan += 1; nedenler.append(f"Çok düşük gider (%{er:.2f})")

    if corr_max < 0.3 and sh is not None and sh > 0.3:
        puan += 2; nedenler.append(f"Gerçek çeşitlendirici (en yüksek ρ={corr_max:.2f})")

    s = "AL" if puan >= 3 else ("SAT" if puan <= -3 else "BEKLE")
    return {"sinyal": s, "puan": puan, "nedenler": nedenler or ["Belirgin sinyal yok"]}


def main():
    panel, tefas_kod = load_all()
    bench = panel["ACWI"].dropna()

    ov = json.loads((DATA / "overlap.json").read_text())
    prof_p = json.loads((DATA / "etf_profiles.json").read_text())
    prof_c = json.loads((DATA / "profiles_cand.json").read_text())
    meta_t = json.loads((DATA / "meta_tefas.json").read_text())
    cats = json.loads((DATA / "categories.json").read_text())
    profiles = {**prof_p, **prof_c}

    portfoy = list(TEFAS) + ETFS + STOCKS
    aday = sorted({s for v in cats.values() for s in v} - set(portfoy))

    # Kullanıcının izleme listesinden gelen, fiyatı başarıyla çekilmiş kodlar.
    watch = read_watchlist()
    watch_yeni = [k for k in watch if k not in portfoy and k not in aday and k in panel.columns]
    aday += watch_yeni

    # haftalık korelasyon (ortak pencere, en az 52 hafta)
    wr = panel.resample("W-FRI").last().pct_change()
    cov = wr.notna().sum()
    kolon = [c for c in panel.columns if cov[c] >= 52 and c not in ("SPY", "QQQ", "XU100.IS")]
    corr = wr[kolon].dropna(how="any").corr()

    def er_of(kod):
        p = profiles.get(kod, {})
        v = p.get("gider_orani")
        if not v:
            return None
        try:
            return float(str(v).replace("%", "").strip())
        except ValueError:
            return None

    def en_yuksek_ov(kod, karsi):
        best = 0.0
        for k, v in ov["ciftler"].items():
            a, b = k.split("|")
            if a == kod and b in karsi:
                best = max(best, v["overlap_pct"])
            elif b == kod and a in karsi:
                best = max(best, v["overlap_pct"])
        return best

    def en_yuksek_corr(kod, karsi):
        if kod not in corr.columns:
            return 0.0
        o = [c for c in karsi if c in corr.columns and c != kod]
        return float(corr.loc[kod, o].max()) if o else 0.0

    out = {"uretim": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M"),
           "veri_tarihi": panel.index.max().strftime("%Y-%m-%d"),
           "olcut": "ACWI", "risksiz_oran": RF,
           "portfoy": {}, "aday": {}, "kategoriler": cats,
           "uyusmazlik": MISMATCH}

    for kod in portfoy:
        if kod not in panel.columns:
            out["portfoy"][kod] = {"yetersiz": True, "not": "fiyat serisi yok"}
            continue
        m = metrics(panel[kod], bench)
        digerleri = [c for c in portfoy if c != kod]
        o, c = en_yuksek_ov(kod, digerleri), en_yuksek_corr(kod, digerleri)
        e = er_of(kod)
        m["risk"] = risk_kademe(m)
        m.update(sinyal(kod, m, o, c, e))
        m["en_yuksek_cakisma"] = round(o, 1)
        m["en_yuksek_korelasyon"] = round(c, 3)
        m["gider"] = e
        m["ad"] = (TEFAS.get(kod) or (US.get(kod) or ("", ""))[1]
                   or (profiles.get(kod, {}).get("tam_ad")))
        m["tip"] = "TEFAS" if kod in tefas_kod else (US.get(kod, ("ETF",))[0])
        m["tema"] = THEMES.get(kod, "Diğer")
        if kod in meta_t:
            m["aum_try"] = meta_t[kod].get("portBuyukluk")
            m["yatirimci"] = meta_t[kod].get("yatirimciSayi")
        elif kod in profiles:
            m["aum"] = profiles[kod].get("aum")
        out["portfoy"][kod] = m

    for kod in aday:
        if kod not in panel.columns:
            continue
        m = metrics(panel[kod], bench)
        o, c = en_yuksek_ov(kod, portfoy), en_yuksek_corr(kod, portfoy)
        m["risk"] = risk_kademe(m)
        m["en_yuksek_cakisma"] = round(o, 1)
        m["en_yuksek_korelasyon"] = round(c, 3)
        m["gider"] = er_of(kod)
        m["ad"] = profiles.get(kod, {}).get("tam_ad") or kod
        m["tip"] = "TEFAS" if kod in tefas_kod else "ETF"
        m["aum"] = profiles.get(kod, {}).get("aum")
        m["kategori"] = (next((k for k, v in cats.items() if kod in v), None)
                         or ("İzleme Listem" if kod in watch_yeni else None))
        # Pivot boyutu portföy ve aday kayıtlarında aynı alan adını kullansın:
        # adaylarda "tema" = boşluk kategorisi (Avrupa, Bankacılık, ...) ya da
        # kullanıcının kendi eklediği bir kodsa "İzleme Listem".
        m["tema"] = m["kategori"] or "Diğer"
        # öneri skoru: ucuz + likit + iyi Sharpe + portföye düşük korelasyon
        sk = 0.0
        if m.get("sharpe"): sk += min(m["sharpe"], 1.5) * 2
        if m.get("gider") is not None: sk += max(0, 1 - m["gider"] / 0.5)
        sk += (1 - min(c, 1.0)) * 3
        if m.get("alpha"): sk += max(-2, min(2, m["alpha"] * 20))
        m["oneri_skoru"] = round(sk, 2)
        out["aday"][kod] = m

    (DATA / "app_data.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))

    print(f"portföy: {len(out['portfoy'])} | aday: {len(out['aday'])}")
    print(f"veri tarihi: {out['veri_tarihi']}\n")
    sig = collections_count(out["portfoy"])
    print("Sinyal dağılımı:", sig)
    print("\n-- SAT sinyali --")
    for k, v in out["portfoy"].items():
        if v.get("sinyal") == "SAT":
            print(f"  {k:5} puan={v['puan']:+d}  {v['nedenler'][0]}")
    print("\n-- AL sinyali --")
    for k, v in out["portfoy"].items():
        if v.get("sinyal") == "AL":
            print(f"  {k:5} puan={v['puan']:+d}  {v['nedenler'][0]}")
    print("\n-- En iyi adaylar (kategori bazında) --")
    for kat, syms in cats.items():
        c = [(s, out["aday"][s]["oneri_skoru"]) for s in syms if s in out["aday"]]
        if c:
            c.sort(key=lambda x: -x[1])
            print(f"  {kat:20} {' > '.join(f'{s}({p})' for s, p in c)}")


def collections_count(d):
    from collections import Counter
    return dict(Counter(v.get("sinyal", "yok") for v in d.values()))


if __name__ == "__main__":
    main()
