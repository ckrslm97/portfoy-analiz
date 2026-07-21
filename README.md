# Portföy Aracı

TEFAS fonları ve ABD ETF/hisselerinden oluşan bir portföy için kural tabanlı
al/sat/bekle sinyalleri, kategori genişletme önerileri ve öneri performans
takibi. Veriler her gece otomatik olarak tazelenir.

**Canlı site:** `https://<kullanıcı>.github.io/<repo>/`
**Günlük özet (maile link için):** `https://<kullanıcı>.github.io/<repo>/ozet.html`
**Sabit analiz raporu:** `https://<kullanıcı>.github.io/<repo>/rapor.html`

## Nasıl çalışıyor

```
pipeline/          Python veri hattı — her gece GitHub Actions ile çalışır
  fetch_data.py       TEFAS + Yahoo Finance fiyat/künye (kritik, dayanıklı)
  fetch_candidates.py Kategori genişletme adaylarının fiyat/künye verisi
  holdings_overlap.py ETF içerik çakışması (stockanalysis.com)
  etf_profile.py      AUM / gider oranı (stockanalysis.com)
  build_app_data.py   Hepsini tek app_data.json'da birleştirir, sinyalleri +
                       aynı temadaki emsal karşılaştırma listelerini üretir
  add_sparks.py       Öneri Takibi grafikleri için 2 yıllık haftalık seri
  add_daily.py        Detay panelindeki 1H/1A/3A/6A/12A aralıkları için
                       ~400 günlük günlük fiyat serisi
  build_ozet.py       Sunucu tarafında önceden render edilmiş günlük özet
                       sayfası (ozet.html) — JS/localStorage'a bağımlı değil
  run_all.py          Yukarıdakileri sırayla çalıştıran orkestratör

site/               Statik site — GitHub Pages'te yayınlanan tam olarak bu klasör
  index.html           Uygulama: Portföyüm / Al-Sat-Bekle / Ekle-Çıkar /
                        Tavsiye Motoru / Öneri Takibi / Karşılaştır. Herhangi
                        bir fon koduna tıklamak geçmişini, aralık seçicili
                        grafiğini ve aynı temadaki emsallerini gösteren bir
                        detay paneli açar.
  ozet.html             Her gece yeniden üretilen, statik günlük özet — bir
                        e-postaya link olarak yapıştırılabilir, tıklandığında
                        anında (JS state'e bağlı olmadan) doğru içerikle açılır.
  rapor.html            21 Temmuz 2026 tarihli sabit analiz raporu
  app.js, styles.css    Uygulama mantığı ve tasarımı
  data/*.json           Pipeline'ın ürettiği veri — bu dosyalar commit'lenir

.github/workflows/daily.yml   Her gece 02:00 TSİ'de pipeline'ı çalıştırır,
                               değişen JSON'ları commit'ler, siteyi yeniden yayınlar
```

## Veri dayanıklılığı

TEFAS'ın WAF'ı veya Yahoo Finance rate-limit bir günlük çalışmayı bozabilir.
Pipeline bunun için tasarlandı: her toplayıcı önce mevcut JSON'u okur, yeni
gözlemleri üzerine yazar — **asla sıfırdan başlamaz**. Bir kaynak o gün hiç
veri döndürmezse önceki gün korunur ve `site/data/health.json` durumu
`kismi`/`basarisiz` olarak işaretler; uygulama üst şeritte bunu gösterir.
Site hiçbir zaman boş veriyle açılmaz.

## Bir fon/ETF eklemek

Uygulamadaki **Ekle/Çıkar** sekmesinden bir kod girildiğinde, veri setinde
varsa anında eklenir. Yoksa "izleme listesi"ne düşer. Bu listeyi
`watchlist.json` olarak indirip depodaki kök dizindeki dosyayla değiştirip
commit'lersen, bir sonraki gece otomatik çalışma o kodu araştırır: fiyatı
bulunursa (TEFAS 3 harfli kod ya da Yahoo sembolü) ertesi gün "İzleme Listem"
kategorisiyle uygulamada belirir.

```json
{ "ekle": ["VGK", "TI2", "SCHD"] }
```

## Yerelde çalıştırma

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd pipeline && python run_all.py
cd ../site && python3 -m http.server 8000
# http://localhost:8000
```

## Kısıtlar ve dürüstlük notları

- TEFAS fonlarının **gider oranları ve hisse bazlı içerikleri** kamuya açık
  API'de yayınlanmıyor. Bu fonlarda maliyet kuralı sinyale girmez.
- ETF çakışma yüzdeleri yalnızca ilk ~25 varlık üzerinden hesaplanır — **alt
  sınırdır**.
- Kullanıcı durumu (portföy, kararlar, öneri geçmişi) yalnızca tarayıcıda
  (localStorage) tutulur; sunucuya gönderilmez.
- Bu araç **yatırım tavsiyesi değildir**. Sinyaller kamuya açık fiyat verisi
  üzerinde çalışan mekanik kurallardır.
