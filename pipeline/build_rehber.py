"""Kavram rehberi: uygulamadaki her metriği GERÇEK, güncel portföy verisiyle
örnekleyen, sunucu tarafında önceden render edilmiş statik bir sayfa üretir.

ozet.html ile aynı ilke: JS/localStorage'a bağımlı değil, her gece yeniden
üretilir, örnek sayılar her zaman o günün gerçek verisinden gelir — uydurma
veya statik/donuk örnek yok. Eşikler (Sharpe/Sortino/beta/risk kademesi vb.)
build_app_data.py'deki KURALLARLA BİREBİR AYNI sayılardır; burada ayrıca
yazılmadı, oradan içe aktarılır ki iki yerde anlatım driftlemesin.
"""

import json
import os
import pathlib

DATA = pathlib.Path(os.environ.get("DATA_DIR", pathlib.Path(__file__).parent.parent / "site" / "data"))
OUT = pathlib.Path(os.environ.get("SITE_DIR", pathlib.Path(__file__).parent.parent / "site")) / "rehber.html"


def esc(s):
    return (str(s if s is not None else "")
            .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def pct(x, d=1):
    if x is None:
        return "—"
    return f"{'+' if x >= 0 else ''}{x * 100:.{d}f}%"


def num(x, d=2):
    return "—" if x is None else f"{x:.{d}f}"


def kur_etkisi_ornegi():
    """YZC üzerinden TL/USD getiri ayrıştırması — o günün gerçek fiyatlarından
    canlı hesaplanır, statik olarak yazılmaz."""
    import datetime

    pt = json.loads((DATA / "prices_tefas.json").read_text())
    py = json.loads((DATA / "prices_yahoo.json").read_text())
    yzc, usdtry = pt.get("YZC"), py.get("TRY=X")
    if not yzc or not usdtry:
        return None

    tarihler = sorted(yzc)
    son_gun = tarihler[-1]
    kesim = (datetime.date.fromisoformat(son_gun) - datetime.timedelta(days=365)).isoformat()
    baz_tarih = min([t for t in tarihler if t >= kesim], default=tarihler[0])

    def en_yakin(tarih, seri_tarihleri):
        uygun = [t for t in seri_tarihleri if t <= tarih]
        return max(uygun) if uygun else min(seri_tarihleri)

    uts = sorted(usdtry)
    tl_baz, tl_son = yzc[baz_tarih], yzc[son_gun]
    kur_baz, kur_son = usdtry[en_yakin(baz_tarih, uts)], usdtry[en_yakin(son_gun, uts)]
    usd_baz, usd_son = tl_baz / kur_baz, tl_son / kur_son

    return {
        "baz_tarih": baz_tarih, "son_tarih": son_gun,
        "tl_getiri": tl_son / tl_baz - 1,
        "usd_getiri": usd_son / usd_baz - 1,
        "kur_degisim": kur_son / kur_baz - 1,
    }


def gider_ornegi(dusuk_er, yuksek_er, yil=20, baslangic=10000, brut_getiri=0.10):
    """%0,02 ile %0,75 gider oranının 20 yılda 10.000$ üzerindeki bileşik
    maliyet farkını gösterir — gerçek matematik, yuvarlama yok."""
    net_dusuk = baslangic * (1 + brut_getiri - dusuk_er / 100) ** yil
    net_yuksek = baslangic * (1 + brut_getiri - yuksek_er / 100) ** yil
    return {"net_dusuk": net_dusuk, "net_yuksek": net_yuksek, "fark": net_dusuk - net_yuksek}


_TR_HARITA = str.maketrans({
    "ş": "s", "Ş": "s", "ı": "i", "İ": "i", "ğ": "g", "Ğ": "g",
    "ü": "u", "Ü": "u", "ö": "o", "Ö": "o", "ç": "c", "Ç": "c",
})


def kebab_tr(text: str) -> str:
    """Türkçe karakterleri ASCII'ye çevirip kebab-case üretir — TOC linkleri
    ile başlık id'leri AYNI fonksiyondan geçtiği için hep senkron kalır."""
    import re
    ascii_metin = text.lower().translate(_TR_HARITA)
    return re.sub(r"[^a-z0-9]+", "-", ascii_metin).strip("-")


def kavram(baslik, tanim, hesaplama, ornek_html, yorum):
    """(id, başlık, html) döner — TOC ve bölüm id'leri AYNI id'den geldiği
    için elle senkronize etmeye gerek kalmaz."""
    kid = kebab_tr(baslik)
    html = f"""
    <section class="ozet-sec">
      <h2 id="{kid}">{esc(baslik)}</h2>
      <p>{tanim}</p>
      <h4>Nasıl hesaplanır</h4>
      <p>{hesaplama}</p>
      <h4>Bu portföyden gerçek örnek</h4>
      {ornek_html}
      <h4>Nasıl okunur</h4>
      <p>{yorum}</p>
    </section>
    """
    return {"id": kid, "baslik": baslik, "html": html}


def main():
    db = json.loads((DATA / "app_data.json").read_text())
    p = db["portfoy"]

    xlv, vht = p.get("XLV", {}), p.get("VHT", {})
    arkg, qbts = p.get("ARKG", {}), p.get("QBTS", {})
    schd = db["aday"].get("SCHD", {})
    spym = p.get("SPYM", {})
    qtum = p.get("QTUM", {})

    kur = kur_etkisi_ornegi()
    gider = gider_ornegi(0.02, 0.75)

    bolumler = []

    # --- A. Getiri ölçütleri ---
    bolumler.append(kavram(
        "CAGR — Bileşik Yıllık Büyüme Oranı",
        "Bir enstrümanın, dönem içindeki iniş çıkışları yok sayıp \"her yıl sabit oranda büyüseydi\" "
        "hangi orana denk geldiğini gösterir. Tek yıllık bir getiri yüzdesi değil, tüm geçmişin "
        "yıllıklandırılmış özetidir.",
        "<code>(Son fiyat / İlk fiyat) ^ (1 / yıl sayısı) − 1</code>. Bir yıldan kısa geçmişte "
        "yıllıklandırma yapılmaz — 2-3 aylık bir getiriyi yıla yaymak yanıltıcı sonuç verir "
        "(uygulama bunu otomatik olarak engeller, bkz. \"Geçmiş yeterli mi\" kuralı aşağıda).",
        f'<div class="grid g3">'
        f'<div class="card stat"><div class="k">XLV · 10 yıl</div><div class="v pos">{pct(xlv.get("cagr"))}</div></div>'
        f'<div class="card stat"><div class="k">ARKG · 10 yıl</div><div class="v">{pct(arkg.get("cagr"))}</div></div>'
        f'<div class="card stat"><div class="k">SCHD · {num(schd.get("yil"),1)} yıl</div><div class="v pos">{pct(schd.get("cagr"))}</div></div>'
        f'</div>',
        "Yüksek CAGR tek başına \"iyi\" demek değildir — hangi risk seviyesinde elde edildiği "
        "önemlidir (aşağıdaki Sharpe/Sortino bölümlerine bakın)."
    ))

    if kur:
        bolumler.append(kavram(
            "Kur Etkisi — TL Getirisi Neden Yanıltabilir",
            "TEFAS fonları TL cinsinden fiyatlanır. TL, USD karşısında değer kaybettikçe TL getiri "
            "yapay şekilde şişer — fonun gerçek varlık performansıyla hiç ilgisi olmayan bir etki. "
            "Bu uygulama bu yüzden tüm karşılaştırmaları USD bazında yapar.",
            "<code>(1 + TL getirisi) = (1 + USD getirisi) × (1 + kur değişimi)</code>. Yani TL getiri, "
            "gerçek varlık performansı ile kur kaybının çarpımıdır — toplamı değil.",
            f'<div class="grid g3">'
            f'<div class="card stat"><div class="k">YZC · TL getiri (1y)</div><div class="v pos">{pct(kur["tl_getiri"])}</div></div>'
            f'<div class="card stat"><div class="k">YZC · USD getiri (1y)</div><div class="v pos">{pct(kur["usd_getiri"])}</div></div>'
            f'<div class="card stat"><div class="k">USD/TRY değişim (1y)</div><div class="v neg">{pct(kur["kur_degisim"])}</div></div>'
            f'</div>'
            f'<p style="font-size:12.5px;color:var(--muted);margin-top:8px">{kur["baz_tarih"]} → {kur["son_tarih"]} aralığı, '
            f'o günün gerçek TEFAS ve USD/TRY verisinden hesaplandı.</p>',
            f"YZC'nin \"%{kur['tl_getiri']*100:.0f} kazandırdı\" başlığı yanıltıcı — gerçek varlık "
            f"performansı %{kur['usd_getiri']*100:.0f}, geri kalanı TL'nin değer kaybı. TL bazlı "
            "getirilere hep şüpheyle yaklaşın, bu aracın gösterdiği USD rakamlarına bakın."
        ))

    # --- B. Risk ölçütleri ---
    bolumler.append(kavram(
        "Volatilite",
        "Getirilerin ortalama etrafında ne kadar sert salındığının ölçüsüdür — fiyatın ne kadar "
        "\"gürültülü\" hareket ettiğini gösterir, yön belirtmez (yükselirken de sert olabilir).",
        "Günlük getirilerin standart sapması, <code>√252</code> ile çarpılarak yıllıklandırılır "
        "(252 ≈ bir yıldaki işlem günü sayısı).",
        f'<div class="grid g3">'
        f'<div class="card stat"><div class="k">XLV — geniş sağlık sepeti</div><div class="v">{pct(xlv.get("vol"))}</div></div>'
        f'<div class="card stat"><div class="k">ARKG — konsantre tema</div><div class="v neg">{pct(arkg.get("vol"))}</div></div>'
        f'<div class="card stat"><div class="k">QBTS — tek hisse</div><div class="v neg">{pct(qbts.get("vol"))}</div></div>'
        f'</div>',
        "Uygulamadaki risk kademesi eşiği: <b>%12 altı Düşük, %12–25 Orta, %25 üstü Yüksek.</b> "
        "QBTS'in oynaklığı bu ölçekte sınırların çok dışında — tek hisseye yoğunlaşmanın bedeli budur."
    ))

    bolumler.append(kavram(
        "Maksimum Düşüş (Max Drawdown)",
        "Enstrümanın tüm geçmişindeki en yüksek noktadan en düşük noktaya kadar yaşadığı en sert "
        "değer kaybı. \"En kötü anda ne kadar kaybettirebilirdi\" sorusunun cevabı.",
        "Her gün için <code>(o günkü fiyat / o güne kadarki en yüksek fiyat) − 1</code> hesaplanır, "
        "en düşük (en negatif) değer alınır.",
        f'<div class="grid g3">'
        f'<div class="card stat"><div class="k">XLV</div><div class="v neg">{pct(xlv.get("maxdd"),0)}</div></div>'
        f'<div class="card stat"><div class="k">ARKG</div><div class="v neg">{pct(arkg.get("maxdd"),0)}</div></div>'
        f'<div class="card stat"><div class="k">QBTS</div><div class="v neg">{pct(qbts.get("maxdd"),0)}</div></div>'
        f'</div>',
        "Risk kademesi eşiği: <b>−%15'ten sığ Düşük, −%15…−%35 arası Orta, −%35'ten derin Yüksek.</b> "
        f"QBTS'in {pct(qbts.get('maxdd'),0)} düşüşü, o pozisyona konan paranın neredeyse tamamının "
        "bir dönem silinmiş olabileceği anlamına geliyor."
    ))

    bolumler.append(kavram(
        "Beta",
        "Enstrümanın, seçilen ölçüte (bu uygulamada MSCI ACWI) göre ne kadar duyarlı hareket "
        "ettiğini gösterir. Beta 1 = ölçütle aynı hareket. Beta 1'in üstü = ölçütten daha sert "
        "iniş-çıkış; altı = daha yumuşak.",
        "Haftalık getiriler üzerinden hesaplanır (günlük değil — TEFAS fonlarında NAV gecikmesi "
        "günlük veride betayı yapay olarak sıfıra çeker, bu yüzden bu uygulama haftalık kullanır).",
        f'<div class="grid g3">'
        f'<div class="card stat"><div class="k">XLV — defansif</div><div class="v">{num(xlv.get("beta"),2)}</div></div>'
        f'<div class="card stat"><div class="k">QTUM — agresif</div><div class="v">{num(qtum.get("beta"),2)}</div></div>'
        f'<div class="card stat"><div class="k">QBTS — çok agresif</div><div class="v">{num(qbts.get("beta"),2)}</div></div>'
        f'</div>',
        "Risk kademesi eşiği: <b>0,70 altı Düşük, 0,70–1,30 Orta, 1,30 üstü Yüksek.</b> Düşük beta, "
        "\"az kazandırır\" demek değil — küresel piyasa çöküşlerinde daha az birlikte düşer demektir."
    ))

    # --- C. Risk-ayarlı getiri ---
    bolumler.append(kavram(
        "Sharpe Oranı",
        "\"Alınan her birim riske karşılık ne kadar getiri elde edildi\" sorusunun cevabı. İki "
        "enstrüman aynı getiriyi verse bile, azıcık oynaklıkla verenin Sharpe'ı daha yüksektir — "
        "bu yüzden ham getiriden daha adil bir karşılaştırma aracıdır.",
        "<code>(Yıllık getiri − risksiz oran) / Yıllık volatilite</code>. Bu uygulamada risksiz "
        f"oran %{db.get('risksiz_oran',0.04)*100:.0f} varsayılıyor (ABD kısa vadeli hazine getirisi yaklaşımı).",
        f'<div class="grid g3">'
        f'<div class="card stat"><div class="k">SCHD — düşük gider, iyi Sharpe</div><div class="v pos">{num(schd.get("sharpe"))}</div></div>'
        f'<div class="card stat"><div class="k">ARKG — riski karşılıksız</div><div class="v neg">{num(arkg.get("sharpe"))}</div></div>'
        f'<div class="card stat"><div class="k">QBTS — riski hiç karşılıksız</div><div class="v neg">{num(qbts.get("sharpe"))}</div></div>'
        f'</div>',
        "Al/Sat/Bekle puanlamasında: <b>Sharpe &gt; 0,6 ise +2 puan (güçlü), Sharpe &lt; 0 ise −3 puan "
        "(risk karşılıksız), 0–0,25 arası −1 puan (zayıf).</b> ARKG ve QBTS'nin SAT sinyali almasının "
        "başlıca sebeplerinden biri budur."
    ))

    bolumler.append(kavram(
        "Sortino Oranı",
        "Sharpe'a çok benzer, ama tek farkla: yalnızca <em>aşağı yönlü</em> oynaklığı cezalandırır. "
        "Bir fon sert yükselişlerle oynaksa Sharpe'ı düşük görünebilir; Sortino bunu \"kötü risk\" "
        "saymaz.",
        "<code>(Yıllık getiri − risksiz oran) / Aşağı yönlü volatilite</code> — paydada yalnız "
        "negatif günlerin standart sapması kullanılır.",
        f'<div class="grid g2">'
        f'<div class="card stat"><div class="k">SCHD</div><div class="v pos">{num(schd.get("sortino"))}</div></div>'
        f'<div class="card stat"><div class="k">ARKG</div><div class="v neg">{num(arkg.get("sortino"))}</div></div>'
        f'</div>',
        "Sharpe ile Sortino arasında büyük fark varsa, fonun oynaklığının çoğu YUKARI yönlü demektir "
        "— bu genelde iyi bir işarettir, sert ama tek yönlü hareket eden fonlarda görülür."
    ))

    bolumler.append(kavram(
        "Alfa",
        "Enstrümanın, taşıdığı beta (piyasa duyarlılığı) hesaba katıldıktan SONRA, ölçütün üstünde "
        "mi altında mı kaldığının ölçüsü. \"Yönetim/seçim becerisi ölçüte değer kattı mı\" sorusunun "
        "cevabına en yakın rakam.",
        "<code>Gerçekleşen getiri − [risksiz oran + beta × (ölçüt getirisi − risksiz oran)]</code> "
        "— yani \"bu beta ile beklenen getiri neydi\" ile \"gerçekte ne oldu\" arasındaki fark.",
        f'<div class="grid g2">'
        f'<div class="card stat"><div class="k">SPYM — ölçütü hafif geçti</div><div class="v pos">{pct(spym.get("alpha"))}</div></div>'
        f'<div class="card stat"><div class="k">ARKG — ölçütün belirgin altında</div><div class="v neg">{pct(arkg.get("alpha"))}</div></div>'
        f'</div>',
        "Al/Sat/Bekle puanlamasında: <b>alfa &gt; %2 ise +2 puan, alfa &lt; −%3 ise −2 puan.</b> "
        "Pozitif alfa, ödenen gider oranını haklı çıkarır; negatif alfa + yüksek gider oranı bir arada "
        "görülüyorsa (ör. ARKG %0,75 gider + negatif alfa) bu ücretin karşılığının alınmadığı anlamına gelir."
    ))

    # --- D. Çeşitlendirme ---
    bolumler.append(kavram(
        "Korelasyon (ρ)",
        "İki enstrümanın fiyat hareketlerinin ne kadar \"birlikte\" gittiğinin ölçüsü. +1 = birebir "
        "aynı yönde hareket, 0 = ilişkisiz, −1 = tam ters yönde. Çeşitlendirmenin temel taşı: "
        "korelasyonu düşük iki varlık bir arada tutulduğunda toplam risk azalır.",
        "Haftalık getiriler üzerinden Pearson korelasyon katsayısı, en az 52 haftalık ortak "
        "pencerede hesaplanır. Bu uygulamada Karşılaştır sekmesinde Satır=Fon/ETF, Sütun=Fon/ETF "
        "seçip tam bir korelasyon matrisi görebilirsiniz.",
        f'<div class="grid g2">'
        f'<div class="card stat"><div class="k">XLV ↔ VHT — pratikte ikiz</div><div class="v neg">{num(xlv.get("en_yuksek_korelasyon"),3)}</div></div>'
        f'<div class="card stat"><div class="k">Emsal sayısı (XLV teması)</div><div class="v">{len(xlv.get("emsaller",[]))}</div></div>'
        f'</div>',
        "0,85 üstü korelasyon \"fiilen aynı pozisyon\" demektir — ikisini birden tutmak çeşitlendirme "
        "değil, aynı riski iki kez ödemektir. 0,3 altı korelasyon gerçek çeşitlendirme sağlar."
    ))

    bolumler.append(kavram(
        "Çakışma (Holdings Overlap)",
        "Korelasyondan farklı olarak, iki ETF'in GERÇEKTEN aynı hisseleri ne oranda taşıdığının "
        "doğrudan ölçüsü. İki fon farklı hisseler taşısa bile makro bir faktör yüzünden yüksek "
        "korelasyonlu olabilir — çakışma bunu ayırt eder.",
        "İki fonun ortak taşıdığı her hisse için <code>min(ağırlık_A, ağırlık_B)</code> toplanır. "
        "Yalnızca ilk ~25 varlık üzerinden hesaplandığı için sonuç bir ALT SINIRDIR.",
        f'<div class="grid g2">'
        f'<div class="card stat"><div class="k">XLV ↔ VHT çakışma</div><div class="v neg">%{num(xlv.get("en_yuksek_cakisma"),1)}</div></div>'
        f'<div class="card stat"><div class="k">XLV holdings kapsaması</div><div class="v">%{num(xlv.get("holdings_kapsama"),1)}</div></div>'
        f'</div>',
        "Al/Sat/Bekle puanlamasında: <b>çakışma %85 üstüyse −2 puan, %60–85 arası −1 puan.</b> "
        "Detay panelindeki \"İçerik\" bölümünden hangi hisselerin ortak olduğunu tek tek görebilirsiniz."
    ))

    # --- E. Maliyet ve likidite ---
    bolumler.append(kavram(
        "Gider Oranı (Expense Ratio) — Bileşik Etkisi",
        "Fonun yıllık yönetim/işletme maliyeti, varlık değerinden otomatik düşülür — hiçbir zaman "
        "ayrı bir fatura görmezsiniz ama getiriyi her yıl aşındırır. Küçük bir yüzde farkı, uzun "
        "vadede büyük bir paraya dönüşür.",
        "Basit görünse de etkisi BİLEŞİK büyür. Aşağıdaki örnek gerçek bir hesap:",
        f'<div class="grid g3">'
        f'<div class="card stat"><div class="k">10.000$, %10 brüt getiri, 20 yıl<br>%0,02 gider (SPYM gibi)</div>'
        f'<div class="v pos">${gider["net_dusuk"]:,.0f}</div></div>'
        f'<div class="card stat"><div class="k">Aynı senaryo<br>%0,75 gider (ARKG gibi)</div>'
        f'<div class="v">${gider["net_yuksek"]:,.0f}</div></div>'
        f'<div class="card stat"><div class="k">Fark — sadece gider yüzünden</div>'
        f'<div class="v neg">${gider["fark"]:,.0f}</div></div>'
        f'</div>',
        "Yüksek gider oranı yalnızca yüksek alfa (yönetim becerisi ölçütü aşıyorsa) ile "
        "savunulabilir. Bu uygulama gider oranını puanlamada tek başına değil, alfa ile birlikte "
        "değerlendirir — \"pahalı ama iyi\" ile \"pahalı ve kötü\" ayrımı buradan gelir."
    ))

    bolumler.append(kavram(
        "AUM ve Likidite",
        "Fonun toplam yönetilen varlık büyüklüğü. Çok küçük bir AUM, düşük işlem hacmi ve geniş "
        "alış-satış makas riski taşıyabilir; fon kapatılma riski de büyük fonlara göre daha yüksektir.",
        "ABD ETF'lerinde dolar cinsinden, TEFAS fonlarında TL cinsinden (\"portföy büyüklüğü\") "
        "kamuya açık verilerden alınır.",
        f'<div class="grid g2">'
        f'<div class="card stat"><div class="k">SCHD — büyük, likit</div><div class="v">{esc(schd.get("aum","—"))}</div></div>'
        f'<div class="card stat"><div class="k">ROBT — küçük ölçekli ETF</div><div class="v neg">{esc(p.get("ROBT",{}).get("aum","—"))}</div></div>'
        f'</div>',
        "Kesin bir alt sınır yoktur ama birkaç yüz milyon doların altındaki ETF'lerde ve birkaç yüz "
        "milyon TL'nin altındaki TEFAS fonlarında likidite ve kapanma riskini ayrıca sorgulayın."
    ))

    # --- F. Bu aracın mantığı ---
    bolumler.append(kavram(
        "Al / Sat / Bekle Sinyali Nasıl Üretiliyor",
        "Bu bir yatırım tavsiyesi değil, ölçülebilir kuralların mekanik özetidir. İki \"kapı\" önce "
        "çalışır ve puanlamayı tamamen devre dışı bırakabilir; kapılardan geçen enstrümanlar "
        "puanlanır.",
        "<b>Kapı 1 — Veri yeterliliği:</b> bir yıldan kısa geçmişte doğrudan BEKLE, puanlama "
        "yapılmaz. <b>Kapı 2 — Kimlik doğrulaması:</b> kullanıcının varsaydığı kategori ile resmi "
        "unvan çelişiyorsa (ör. bir fon bankacılık sanılıp aslında sağlık fonuysa) doğrudan BEKLE. "
        "Kapılardan geçenler alfa, Sharpe, maksimum düşüş, çakışma, korelasyon ve gider oranı "
        "üzerinden puanlanır; <b>puan ≥ +3 → AL, puan ≤ −3 → SAT, arası BEKLE.</b>",
        '<p style="font-size:13.5px;color:var(--ink-2)">Her enstrümanın detay panelindeki '
        '"Al / Sat / Bekle Sinyali" kartında, o enstrüman için hangi kuralın ne yönde çalıştığı '
        'tek tek listelenir — kara kutu değildir.</p>',
        "Sinyal, senin kararının yerine geçmez — Al/Sat/Bekle sekmesinde kendi kararını ayrı "
        "olarak kaydedebilir, kuralın önerdiğinden farklı bir yol seçebilirsin."
    ))

    bolumler.append(kavram(
        "Risk Kademesi (Düşük / Orta / Yüksek)",
        "Volatilite, maksimum düşüş ve beta'nın üçünün ortak (medyan) sonucudur — tek bir metriğe "
        "değil, üçüne birden bakar.",
        "Her bileşen kendi eşiğine göre 0 (Düşük), 1 (Orta) veya 2 (Yüksek) puan alır; üç puanın "
        "medyanı nihai kademeyi belirler. İlk 10 pozisyonun toplam ağırlığı %60'ı aşıyorsa "
        "(yoğunlaşma cezası) kademe bir seviye yükseltilir.",
        "",
        "Bu üçlü bakış, tek bir metriğin yanıltmasını engeller — ör. düşük volatiliteli ama yüksek "
        "beta'lı bir enstrüman yalnızca volatiliteye bakılsaydı \"Düşük\" görünebilirdi."
    ))

    html = f"""<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Yatırım Kavramları Rehberi — {esc(db['veri_tarihi'])}</title>
<meta name="description" content="Uygulamadaki her metriği bu portföyün gerçek verileriyle örnekleyen kavram rehberi.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📖</text></svg>">
<link rel="stylesheet" href="styles.css">
<style>
  .wrap {{ max-width: 880px; }}
  .ozet-head {{ padding: 44px 0 22px; border-bottom: 1px solid var(--rule-strong); margin-bottom: 28px; }}
  .ozet-head h1 {{ font-family: var(--serif); font-size: 30px; margin: 0 0 8px; letter-spacing: -.01em; }}
  .ozet-head p {{ color: var(--muted); font-size: 14px; margin: 0; max-width: 68ch; }}
  .ozet-sec {{ margin-bottom: 40px; padding-bottom: 8px; border-bottom: 1px solid var(--rule); }}
  .ozet-sec:last-of-type {{ border-bottom: none; }}
  .ozet-sec h2 {{ font-family: var(--serif); font-size: 20px; margin: 0 0 10px; letter-spacing: -.005em; }}
  .ozet-sec > p {{ font-size: 14.5px; color: var(--ink-2); max-width: 70ch; margin: 0 0 14px; }}
  .ozet-sec h4 {{
    font-size: 11px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
    color: var(--muted); margin: 18px 0 8px;
  }}
  .ozet-sec code {{ font-family: var(--mono); font-size: 12.5px; background: var(--surface-2); padding: 1px 5px; border-radius: 3px; }}
  .toc-guide {{ display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 32px; }}
  .toc-guide a {{
    font-family: var(--mono); font-size: 11.5px; padding: 5px 10px; border-radius: 100px;
    border: 1px solid var(--rule); color: var(--ink-2); text-decoration: none; background: var(--surface);
  }}
  .toc-guide a:hover {{ background: var(--surface-2); color: var(--ink); }}
</style>
</head>
<body>
<div class="wrap">
  <header class="ozet-head">
    <h1>Yatırım Kavramları Rehberi</h1>
    <p>Uygulamada gördüğün her metriğin ne anlama geldiğini, bu portföyün <strong>gerçek, güncel</strong>
       verileriyle örnekliyoruz — genel bir ders kitabı değil, senin fonlarından çıkan sayılar.
       Veri kesiti {esc(db['veri_tarihi'])} ·
       <a href="index.html" style="color:var(--accent)">→ İnteraktif araç</a> ·
       <a href="rapor.html" style="color:var(--accent)">→ Tam analiz raporu</a></p>
  </header>

  <nav class="toc-guide">
    {"".join(f'<a href="#{b["id"]}">{esc(b["baslik"])}</a>' for b in bolumler)}
  </nav>

  {"".join(b["html"] for b in bolumler)}

  <footer class="legal">
    <p><strong>Yatırım tavsiyesi değildir.</strong> Bu sayfa yalnızca eğitim amaçlıdır; burada
    anlatılan metrikler kamuya açık fiyat verisi üzerinde çalışan mekanik hesaplardır. Örnek sayılar
    {esc(db['veri_tarihi'])} tarihli gerçek veriden alınmıştır ve her gece otomatik güncellenir.</p>
  </footer>
</div>
</body>
</html>
"""
    OUT.write_text(html, encoding="utf-8")
    print(f"rehber sayfası: {OUT} ({OUT.stat().st_size // 1024} KB) — {len(bolumler)} kavram")


if __name__ == "__main__":
    main()
