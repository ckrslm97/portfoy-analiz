"""Hafta içi sabah 11'de (TSİ) çalışan Piyasa Özeti maili — gerçek SMTP
gönderimi, taslak değil.

build_ozet.py ile aynı kaynak veriyi (app_data.json) kullanır, aynı özet
mantığını (Sat/Al sinyalleri, kategori önerileri) e-posta gövdesine uyarlar.
Kimlik bilgileri ortam değişkeninden okunur (GitHub Actions secret) — hiçbir
şifre kod içine yazılmaz.

Gerekli ortam değişkenleri:
  GMAIL_ADDRESS       gönderen/alıcı Gmail adresi
  GMAIL_APP_PASSWORD  Google hesabı "Uygulama Şifresi" (normal şifre DEĞİL —
                      2FA açık hesaplarda myaccount.google.com/apppasswords
                      üzerinden üretilir)
"""

import json
import os
import pathlib
import smtplib
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

DATA = pathlib.Path(os.environ.get("DATA_DIR", pathlib.Path(__file__).parent.parent / "site" / "data"))
SITE_BASE = os.environ.get("SITE_BASE", "https://ckrslm97.github.io/portfoy-analiz")


def esc(s):
    return (str(s if s is not None else "")
            .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def html_govde(db: dict) -> str:
    portfoy = db["portfoy"]
    sat = sorted([(k, r) for k, r in portfoy.items() if r.get("sinyal") == "SAT"],
                 key=lambda kv: kv[1].get("puan", 0))[:5]
    al = sorted([(k, r) for k, r in portfoy.items() if r.get("sinyal") == "AL"],
                key=lambda kv: -kv[1].get("puan", 0))[:5]
    dagilim = {"AL": 0, "SAT": 0, "BEKLE": 0}
    for r in portfoy.values():
        if r.get("sinyal") in dagilim:
            dagilim[r["sinyal"]] += 1

    def satir(kod, r):
        nedenler = "".join(f"<li>{esc(n)}</li>" for n in (r.get("nedenler") or [])[:2])
        return (f'<tr><td style="padding:6px 10px;font-family:monospace;font-weight:600">{esc(kod)}</td>'
                f'<td style="padding:6px 10px;font-size:13px;color:#555">{esc(r.get("ad",""))}'
                f'<ul style="margin:4px 0 0;padding-left:16px;font-size:12px;color:#777">{nedenler}</ul></td></tr>')

    sat_html = "".join(satir(k, r) for k, r in sat) or "<tr><td>SAT sinyali yok.</td></tr>"
    al_html = "".join(satir(k, r) for k, r in al) or "<tr><td>AL sinyali yok.</td></tr>"

    return f"""
    <div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;color:#222">
      <h2 style="font-family:Georgia,serif;margin-bottom:4px">Piyasa Özeti</h2>
      <p style="color:#777;font-size:13px;margin-top:0">Veri kesiti {esc(db['veri_tarihi'])} ·
        Referans portföy ({len(portfoy)} enstrüman)</p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr>
          <td style="text-align:center;padding:10px;background:#f5f6f9;border-radius:6px 0 0 6px">
            <div style="font-size:11px;color:#888;text-transform:uppercase">Al</div>
            <div style="font-size:22px;font-weight:700;color:#0e7256">{dagilim['AL']}</div></td>
          <td style="text-align:center;padding:10px;background:#f5f6f9">
            <div style="font-size:11px;color:#888;text-transform:uppercase">Sat</div>
            <div style="font-size:22px;font-weight:700;color:#a93520">{dagilim['SAT']}</div></td>
          <td style="text-align:center;padding:10px;background:#f5f6f9;border-radius:0 6px 6px 0">
            <div style="font-size:11px;color:#888;text-transform:uppercase">Bekle</div>
            <div style="font-size:22px;font-weight:700">{dagilim['BEKLE']}</div></td>
        </tr>
      </table>

      <h3 style="font-size:15px;margin-bottom:6px">Gözden geçir — Sat sinyali</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">{sat_html}</table>

      <h3 style="font-size:15px;margin:18px 0 6px">Öne çıkan — Al sinyali</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">{al_html}</table>

      <p style="margin-top:22px">
        <a href="{SITE_BASE}/ozet.html" style="color:#0b6b63">→ Tam günlük özet</a> ·
        <a href="{SITE_BASE}/index.html" style="color:#0b6b63">→ İnteraktif araç</a> ·
        <a href="{SITE_BASE}/rehber.html" style="color:#0b6b63">→ Kavram rehberi</a>
      </p>
      <p style="font-size:11px;color:#999;margin-top:20px;border-top:1px solid #eee;padding-top:10px">
        Yatırım tavsiyesi değildir. Sinyaller kamuya açık fiyat verisi üzerinde çalışan mekanik
        kurallardır. Bu mail her hafta içi sabahı otomatik gönderilir.
      </p>
    </div>
    """


def main():
    adres = os.environ.get("GMAIL_ADDRESS")
    sifre = os.environ.get("GMAIL_APP_PASSWORD")
    if not adres or not sifre:
        print("HATA: GMAIL_ADDRESS / GMAIL_APP_PASSWORD ortam değişkenleri eksik.")
        sys.exit(1)

    db = json.loads((DATA / "app_data.json").read_text())

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Piyasa Özeti · {db['veri_tarihi']}"
    msg["From"] = adres
    msg["To"] = adres
    msg.attach(MIMEText(html_govde(db), "html", "utf-8"))

    with smtplib.SMTP("smtp.gmail.com", 587) as s:
        s.starttls()
        s.login(adres, sifre)
        s.sendmail(adres, [adres], msg.as_string())

    print(f"Gönderildi: {adres} — Piyasa Özeti · {db['veri_tarihi']}")


if __name__ == "__main__":
    main()
