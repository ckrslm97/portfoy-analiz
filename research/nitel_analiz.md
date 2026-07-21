# Nitel Yatırım Sentezi — Tematik Portföy Analizi

**Yatırımcı profili:** 10-20 yıl yatırım ufku, uzun vadeli büyüme odaklı, küresel çeşitlendirme hedefi, Türkiye'de yaşayan ve TL harcayan bir yatırımcı.
**Ölçüt:** MSCI ACWI (haftalık beta hesaplamaları buna göre). **Veri tarihi:** 21.07.2026. **Para birimi:** Aksi belirtilmedikçe tüm getiri/risk metrikleri USD bazlıdır; TEFAS fonları için hem TL hem USD 1 yıllık getiri ayrıca verilmiştir.

Bu belge, daha önce tamamlanmış nicel analizin (getiri, oynaklık, Sharpe/Sortino, maksimum düşüş, beta, korelasyon, holding çakışması) üzerine inşa edilen **nitel sentez** bölümüdür. Hiçbir sayı burada yeniden hesaplanmamış, yalnızca yorumlanmıştır.

---

## Yönetici Özeti

1. Portföy **~40 ayrı enstrümandan** oluşuyor (19 TEFAS fonu + 19 ABD borsa yatırım aracı/hissesi + VCX + TBE), ancak gerçek risk faktörü çeşitliliği bu sayının çok altında. Aynı temaya (özellikle **yapay zekâ/büyük teknoloji**) doğrudan veya dolaylı olarak maruz kalan araç sayısı 12'yi buluyor.
2. **XLV ve VHT fiilen ikiz** (holding çakışması %72.5, korelasyon 0.991) — ikisini birlikte tutmanın çeşitlendirme faydası yok denecek kadar az.
3. **BOTZ ve ROBT de aynı bahsin tekrarı** (korelasyon 0.931); ikisi de on yıllık ufukta geniş piyasanın (QQQM Sharpe 0.59) çok gerisinde kalmış (Sharpe sırasıyla 0.22 ve 0.14).
4. **QBTS, veri setindeki en kötü risk profiline sahip varlık**: yıllık oynaklık %126, maksimum düşüş -%97, Sharpe 0.05. Aynı temaya çok daha sağlıklı bir risk profiliyle (oynaklık %27.6, maksimum düşüş -%38, Sharpe 0.81) maruziyet veren QTUM zaten portföyde mevcut.
5. **AFS bir sağlık fonu (bankacılık değil)** ve ~5 yıllık yaşamı boyunca USD bazında **negatif** risk-ayarlı getiri üretmiş (Sharpe -0.20, CAGR -%1.1) — sağlık kümesindeki tek sürekli değer kaybettiren araç.
6. Portföyde **saf bir bankacılık aracı yok**. XLF (ABD finans sektörü — bankalar+sigorta+sermaye piyasaları karışımı) tek finans maruziyeti; TI2 ve AFS kullanıcının varsaydığının aksine bankacılık fonu değil.
7. **Coğrafi ve sektörel boşluklar büyük**: Avrupa, Japonya, Hindistan, geniş gelişmekte olan ülkeler, REIT/gayrimenkul, temettü/değer, küçük ölçek, tüketim, endüstriyel, altyapı, sigorta, sigorta dışı sağlam bankacılık — hiçbiri portföyde yok. Portföy fiilen bir **"ABD teması + Türkiye" barbell** yapısında.
8. **PHE**, en büyük tekil pozisyon (~75,9 milyar TL, ~1,6 milyar USD), davranışsal olarak portföydeki hiçbir şeye benzemiyor: ACWI'ye karşı beta ≈ 0, Sharpe 2.03. Bu, ya çok değerli bir çeşitlendirici ya da yanlış sınıflandırılmış/kaldıraçlı bir ürün olabilir — kimliği bu veri setinde doğrulanamadı, öncelikli inceleme konusu.
9. **TBE, TEFAS'ın ne YAT ne EMK listesinde bulunamadı** — sağlık fonu varsayımı doğrulanamadı, bu analizde veri yok.
10. **TI2/MAC/GSP/YDI kümesi** küresel piyasalardan istatistiksel olarak gerçekten bağımsız (ρ≈0.03-0.06), ama bu "çeşitlendirme" TL harcayan/Türkiye'de yaşayan bir yatırımcının zaten taşıdığı ülke riskini portföyde büyütüyor olabilir — toplam bilanço perspektifiyle ayrıca değerlendirilmeli.

---

## 1. Tematik Maruziyet Haritası

### 1.1 Tema bazlı dağılım

| Tema | Doğrudan araçlar | Dolaylı / kısmi maruziyet | Yaklaşık toplam araç |
|---|---|---|---|
| Yapay zekâ / büyük teknoloji / bulut | QQQM, SPYM, CIBR | YAY, GUH, YJK, YTD, YZC (TL fonlar, ABD ETF'leriyle ρ 0.37-0.43), DRAM, LRCX, QTUM, BOTZ | ~12 |
| Yarı iletken | LRCX, DRAM | QQQM, SPYM (endeks içi ağırlık) | ~4 |
| Kuantum hesaplama | QTUM, QBTS | QQQM (%9.0 holding çakışması) | ~3 |
| Robotik / otomasyon | BOTZ, ROBT | QQQM (%12.5), SPYM (%11.9) | ~4 |
| Siber güvenlik | CIBR | QQQM (%9.6 çakışma) | ~2 |
| Uzay | RKLB, NASA | JEDI (NASA ile %18.1 çakışma) | ~3 |
| Savunma / dron | JEDI | NASA (kısmen) | ~2 |
| Sağlık (geniş sektör) | XLV, VHT | — (neredeyse ikiz: ρ 0.991) | 2 |
| Biyoteknoloji / genetik | XBI, ARKG | XLV/VHT içinde kısmen (ρ XBI-ARKG 0.849) | 2 |
| Sağlık (TL, yabancı hisse) | AFS | — | 1 |
| Finans / bankacılık | XLF | TI2 üzerinden dolaylı ve teyit edilmemiş (BIST'in tarihsel banka ağırlığı nedeniyle) | 1 (saf) |
| Enerji — nükleer/uranyum | URA | — | 1 |
| Enerji — geleneksel | XLE | — | 1 |
| Özel sermaye / girişim (VC) | VCX | — | 1 |
| Türk hisse senedi (genel) | TI2, MAC, GSP, YDI | — | 4 (yüksek iç korelasyon 0.877-0.983) |
| Kimliği bu analizde doğrulanamayan | PHE, CPU, GPT, KTJ, KPA, YHZ, NKP, PNU, PSH, TBE | — | 10 |

Not: Bir araç birden fazla temaya sayılabilir (ör. QQQM hem "AI/büyük teknoloji" hem "yarı iletken" hem "robotik" satırında dolaylı olarak geçiyor) — bu kasıtlı, çünkü asıl bulgu tam olarak budur: **aynı büyük teknoloji risk faktörü, farklı isimler altında tekrar tekrar satın alınıyor.**

### 1.2 Aşırı yoğunlaşma bulguları

**a) Yapay zekâ / büyük teknoloji tekrar tekrar satın alınıyor.** QQQM (Nasdaq-100) ve SPYM (S&P 500), holding düzeyinde %42.4 örtüşüyor ve korelasyonları 0.945 — S&P 500'ün kendisi zaten aynı mega-cap teknoloji isimlerine (ki bunlar Nasdaq-100'ün de çekirdeğini oluşturur) yüksek ağırlık veriyor. İkisini birlikte tutmak "iki farklı endeks" değil, aynı mega-cap teknoloji bahsinin dolaylı olarak ağırlığını artırmaktır. Bu çekirdeğin üzerine QTUM (QQQM ile ρ 0.870, holding çakışması %9.0), BOTZ (QQQM ile holding çakışması %12.5), CIBR (QQQM ile %9.6 çakışma) ve TL tarafında YAY/GUH/YJK/YTD/YZC kümesi (ABD ETF'leriyle ρ 0.37-0.43) ekleniyor. Sonuç: portföyün büyük bir dilimi — kabaca 12 araç — aynı makro risk faktörünün (ABD büyüme/teknoloji hisseleri, yüksek faiz-duyarlılığı, yüksek değerleme çarpanı) farklı ambalajlarda tekrarıdır.

**b) Sağlık teması 5 araçla temsil ediliyor ama ikisi fiilen aynı ürün.** XLV ve VHT arasındaki korelasyon (0.991) ve holding çakışması (%72.5, ilk 25 varlıkta) veri setindeki en yüksek ikilidir. Farklı sağlayıcılardan (State Street / Vanguard benzeri) gelmeleri dışında, portföy açısından ikisini birlikte tutmanın marjinal çeşitlendirme faydası neredeyse sıfırdır; ikisi birlikte fiilen tek, biraz daha büyük bir "sağlık sektörü" pozisyonu oluşturur.

**c) Robotik/otomasyon teması da tekrar ediyor.** BOTZ ve ROBT arasındaki 0.931 korelasyon, bu ikisinin de pratikte aynı temayı temsil ettiğini gösteriyor; ayrıca her ikisi de QQQM ve SPYM ile holding düzeyinde örtüşüyor (%12.5 ve %11.9) — yani robotik teması zaten geniş piyasa ETF'leri içinde kısmen mevcut, üstüne iki ayrı (ve yüksek gider oranlı) sepet daha eklenmiş durumda.

**d) Kuantum hesaplama çift kat maruziyet taşıyor.** QTUM (çeşitlendirilmiş sepet) ve QBTS (tek hisse, D-Wave) aynı temaya iki farklı yoğunlukta bahis. QTUM'un QBTS'i bileşen olarak içerip içermediği bu veri setinde doğrulanmadı, ancak kuantum hesaplama sektörünün küçüklüğü göz önüne alındığında (halka açık saf-oyun şirket sayısı sınırlı) örtüşme olasılığı yüksektir — bu doğrulanmalı.

**e) Uzay/savunma üç ayrı araçla temsil ediliyor** (RKLB, NASA, JEDI) ama bunlar birbirinden nispeten bağımsız alt temalar (fırlatma hizmeti / geniş uzay sepeti / dron-savunma) olduğu için yoğunlaşma diğerleri kadar keskin değil — NASA-RKLB çakışması yalnızca %10.6, NASA-JEDI %18.1.

**f) Finans/bankacılık tarafında yoğunlaşma değil, tam tersine boşluk var.** Portföyde tek bir saf finans aracı (XLF) bulunuyor ve bu da bankalar, sigorta, sermaye piyasaları şirketlerinin karışımı — saf bankacılığa (faiz marjı, kredi döngüsü) odaklı hiçbir araç yok. Ayrıntı Bölüm 4'te.

### 1.3 Kimliği bu analizde doğrulanamayan varlıklar

Aşağıdaki TEFAS kodları için bu veri setinde sektör/tema kimliği doğrulanmadı; yalnızca davranışsal (beta, oynaklık, Sharpe) imzalarına dayanarak yorum yapılabilir, tema ataması yapılmamıştır:

- **PHE** — en büyük pozisyon (AUM ~75,9 milyar TL / ~1,6 milyar USD eşdeğeri, 158 bin yatırımcı, kategori pazar payı %30). Beta -0.01 (ACWI'den istatistiksel olarak bağımsız), USD CAGR %52.8, Sharpe 2.03. Bu risk/getiri imzası — yüksek getiri + küresel hisse senetlerinden bağımsızlık + yüksek Sharpe — portföydeki hiçbir başka varlığa benzemiyor. Ölçeği ve davranışsal tekilliği nedeniyle **kimlik doğrulaması öncelikli bir sonraki adım** olmalı.
- **KPA** — beta -0.01, PHE ile aynı düşük-sistematik-risk imzasını taşıyor ama çok daha küçük ölçek (473mn TL) ve çok daha mütevazı getiri (CAGR %12.2, Sharpe 0.39). Aynı kategori olup olmadığı belirsiz.
- **YHZ** — ABD ETF'leriyle ortalama korelasyonu ≈ **-0.006** (istatistiksel olarak sıfır) — veri setindeki en güçlü çeşitlendirici sinyal. Ancak yüksek oynaklık (32.5%) taşıyor ve kimliği doğrulanmadığından bu düşük korelasyonun yapısal mı (farklı bir varlık sınıfı) yoksa tesadüfi mi olduğu bilinmiyor.
- **CPU, GPT, KTJ, NKP, PNU, PSH** — korelasyon tablosunda yer almıyor, tema ataması yapılamıyor. NKP, tüm veri setindeki en zayıf performansı taşıyor (USD CAGR -%2.8, Sharpe -0.54, hatta TL bazında da negatif 1 yıllık getiri -%3.2 — TL'nin değer kaybettiği bir ortamda TL bazında da para kaybetmek nadir ve dikkat çekici bir bulgu). PNU'nun oynaklığı son derece düşük (%2.4) ve kısa geçmişi — nakit benzeri/para piyasası profiline işaret ediyor ama teyit edilmedi. PSH çok küçük (20mn TL, 418 yatırımcı) — önemsiz ölçek.
- **TBE** — TEFAS'ın YAT (1.038 fon) ve EMK (309 fon) listelerinde bulunamadı, web taramasında da doğrulanamadı. Bu analizde **hiçbir nicel veri yok**. Kod hatalı olabilir ya da fon kapanmış/birleşmiş olabilir — kullanıcı ile teyit edilmeli.

---

## 2. Gelecek Potansiyeli: 5 / 10 / 20 Yıl Ufku (Tema Bazında)

> Yöntem notu: Aşağıdaki senaryolar nokta tahmin değildir. Her biri **İyimser / Baz / Kötümser** çerçevesinde sunulmuş ve dayandığı örtük varsayım **"Varsayım:"** etiketiyle belirtilmiştir. Geçmiş performans (verilen CAGR/Sharpe/maxDD rakamları) gelecekteki sonuçların garantisi değildir; burada yalnızca mevcut risk profilinin hangi senaryolarla tutarlı olduğu tartışılmaktadır.

### 2.1 Yapay Zekâ, Bulut Altyapısı ve Büyük Teknoloji (QQQM, SPYM, CIBR + TL kümesi + dolaylı DRAM/LRCX/QTUM/BOTZ)

**Çerçeve:** Büyümenin sürücüsü hyperscaler sermaye harcaması döngüsü, büyük dil modeli eğitim/çıkarım talebi ve kurumsal yazılımın yapay zekâ-yerel mimarilere geçişidir. Toplam adreslenebilir pazar tahminleri kaynaktan kaynağa çok geniş bir aralıkta değişiyor; bu belirsizliğin kendisi bir risk unsuru.

- **5 yıl — İyimser:** Kurumsal yapay zekâ yatırımlarının somut verimlilik/gelir getirisi kanıtlanır, kâr marjları genişler. *Varsayım: 2024-2026 döneminin hyperscaler capex temposu büyük ölçüde korunur.* **Baz:** Büyüme sürer, ama marj baskısı ve bazı oyuncuların elenmesiyle konsolidasyon yaşanır. **Kötümser:** Aşırı yatırım düzeltmesi (2000 sonrası fiber-optik/telekom döngüsüne benzer bir örüntü riski) ve/veya faiz artışı büyüme çarpanlarını sıkıştırır.
- **10 yıl:** Yapay zekânın reel ekonomik verimliliğe yansıması ya netleşir ya da netleşmez — bu, temanın en büyük tek belirsizliğidir. Rekabet avantajı hyperscaler'ların ölçek + veri + sermaye erişimi hendeğinde yatıyor, ancak antitröst regülasyonu ve veri merkezi enerji kısıtları büyümeyi frenleyebilir.
- **20 yıl:** Teknoloji difüzyon eğrileri tarihsel olarak sektör liderliğinin uzun ufukta el değiştirdiğini gösteriyor. *Varsayım: Portföyün QQQM/SPYM üzerinden bugünkü mega-cap ağırlığı, bu isimlerin 20 yıl sonra da lider kalacağı varsayımına dayanıyor — bu, tarihsel taban oranına göre düşük olasılıklı bir varsayımdır.*
- **Riskler:** Endeks içi yoğunlaşma (az sayıda mega-cap hisseye aşırı ağırlık), yüksek değerleme çarpanları, faiz oranı duyarlılığı (beta'lar 1.02-1.23 aralığında, piyasa-üstü sistematik risk), antitröst/AI regülasyonu, enerji altyapı kısıtları.
- **Makro etkiler:** Fed faiz politikası, küresel sermaye harcaması döngüsü, Tayvan/yarı iletken tedarik zinciri jeopolitiği.

### 2.2 Kuantum Hesaplama (QTUM, QBTS)

**Çerçeve:** Ticarileşme erken aşamada; sektör hâlâ "gürültülü ara-ölçek kuantum" (NISQ) döneminde, hataya dayanıklı evrensel kuantum bilgisayar henüz yok.

- **5 yıl — İyimser:** Optimizasyon, malzeme bilimi, ilaç keşfi simülasyonu gibi niş alanlarda kanıtlanmış "kuantum avantajı" somut ticari sözleşmelere dönüşür. *Varsayım: En az bir donanım mimarisi (süperiletken, iyon tuzağı, fotonik, nötr atom) kritik hata-oranı eşiğini aşar.* **Baz:** Ar-Ge yatırımı sürer, gelir gerçekleşmesi 2030'ların ortasına kayar. **Kötümser:** Teknik duvarlar (dekoherans, ölçeklenebilirlik) aşılamaz, sermaye "kuantum kışı"na girer.
- **10 yıl:** Baz senaryoda ticari kırılma noktası bu pencerede beklenir, ama zamanlaması yüksek belirsizlik taşır. *Varsayım: Kamu ve hyperscaler Ar-Ge finansmanı kesintisiz sürer.*
- **20 yıl:** İyimser senaryoda kriptografi, ilaç keşfi ve lojistik optimizasyonunda yapısal dönüşüm; kötümser senaryoda klasik hesaplamanın (GPU/ASIC ilerlemesi) bazı kullanım alanlarını zaten çözmesi kuantumun ekonomik gerekçesini daraltır.
- **Rekabet avantajı:** QTUM, "kazananı önceden bilmeden" temaya sepet yoluyla maruziyet sağlıyor. QBTS ise tek bir mimariye (D-Wave'in kuantum tavlama yaklaşımı — evrensel kapı-modeli değil, niş bir teknik yol) yoğunlaşmış bahis; teknoloji-seçim riski çok daha yüksek.
- **Riskler:** QBTS'in gerçekleşmiş volatilitesi (%126) ve maksimum düşüşü (-%97) sermayenin pratikte sıfırlanma riskinin somut biçimde gerçekleştiğini gösteriyor. Sektör genelinde yüksek nakit yakma oranı ve seyreltme (hisse ihracıyla finansman) riski var.
- **Makro etkiler:** Devlet Ar-Ge sübvansiyonları ve jeopolitik rekabet (kriptografik kırılma riski nedeniyle ulusal güvenlik önceliği) büyümeyi hızlandırabilir, ama bunun hissedar getirisine dönüşmesi garanti değildir.

### 2.3 Robotik ve Otomasyon (BOTZ, ROBT)

**Çerçeve:** Endüstriyel robotik, insansı robot (humanoid) prototipleri ve otonom sistemler. Nüfus yaşlanması ve işgücü maliyeti artışı yapısal talep sürücüsü.

- **5 yıl — İyimser:** Humanoid robotların depo/üretim hattı pilot uygulamaları ticarileşmeye başlar. *Varsayım: Batarya/aktüatör/AI kontrol maliyetlerinde düşüş trendi sürer.* **Baz:** Endüstriyel otomasyon büyümeye devam eder, humanoid segment beklenenden yavaş ölçeklenir. **Kötümser:** Maliyet eğrisi düzleşir, somut ROI vakaları netleşmez, sermaye ilgisini kaybeder.
- **10 yıl:** Gelişmiş ekonomilerde işçi başına robot yoğunluğunun artması baz senaryo olarak makul, ama bu tema **son on yılda henüz finansal olarak karşılığını bulamadı** — BOTZ'un 10 yıllık CAGR'ı yalnızca %9.6 ve Sharpe 0.22, geniş teknoloji piyasasının (QQQM Sharpe 0.59) belirgin biçimde altında. "Hikaye ile finansal gerçekleşme arasındaki makas" bu temada somut biçimde kanıtlanmış durumda.
- **20 yıl:** İyimser senaryoda robotik+yapay zekâ birleşimi imalat/hizmet sektörünü yapısal olarak dönüştürür; kötümser senaryoda bugünkü saf-oyun şirketlerin çoğu büyük teknoloji/endüstriyel devler tarafından satın alınır veya marjinalleşir — endeks kendini yeniler ama bugünün hissedarları o değeri yakalamayabilir.
- **Riskler:** Yüksek gider oranları (%0.65-0.68) düşük getiriyle birleştiğinde net getiriyi daha da aşındırıyor; döngüsel endüstriyel harcamaya duyarlılık.
- **Makro etkiler:** Küresel imalat sermaye harcaması döngüsü, işçilik maliyeti enflasyonu, "reshoring" (üretimi yurda geri getirme) politikaları talebi artırabilir.

### 2.4 Uzay (RKLB, NASA)

**Çerçeve:** Yeniden kullanılabilir roket teknolojisiyle fırlatma maliyetlerinde yapısal düşüş, uydu takımyıldızları, ticari uzay istasyonları ve savunma harcaması artışı.

- **5 yıl — İyimser:** RKLB gibi oyuncular orbital fırlatma pazarında pay kazanır, gelir büyümesi hızlanır — nitekim RKLB'nin 5 yıllık CAGR'ı %41.4 ile bu momentumu şimdiden yansıtıyor. Ancak %79 yıllık oynaklık ve -%83 maksimum düşüş, bunun aşırı riskli bir yoldan geldiğini gösteriyor. *Varsayım: Ticari + devlet uydu talebi mevcut büyüme oranında sürer.* **Baz:** Büyüme sürer ama sermaye yoğun sektörde kâr marjına dönüşüm yavaş olur. **Kötümser:** Aşırı kapasite (çok sayıda fırlatma sağlayıcısı) fiyat rekabetini artırır; tek bir fırlatma başarısızlığı hisseye orantısız zarar verir (bu risk RKLB'nin -%83 düşüşünde zaten bir kez gerçekleşmiş görünüyor).
- **10-20 yıl:** Erken evre havacılık sektörlerinde tarihsel olarak yüksek konsolidasyon oranı (20. yüzyıl havacılık sektörü örneği) bu temada da beklenmeli — RKLB'yi tek hisse olarak tutmak "hayatta kalan seçilimi" riskini beraberinde getiriyor. NASA (sepet ETF) bu riski dağıtıyor ama 0.31 yıllık işlem geçmişiyle henüz değerlendirilemeyecek kadar genç.
- **Riskler:** Tek nokta hata riski, sermaye yoğunluğu/nakit yakma, devlet sözleşmelerine bağımlılık.
- **Makro etkiler:** Savunma bütçeleri, ticari geniş bant uydu talebi, NASA/ESA ve benzeri ajans bütçe döngüleri.

### 2.5 Savunma / Dron (JEDI)

**Çerçeve:** Jeopolitik gerilim (Ukrayna, Orta Doğu, Tayvan Boğazı) savunma bütçelerini artırdı; otonom/dron sistemleri modern savunma harcamasının büyüyen payı.

- **5 yıl — İyimser:** NATO/AB savunma bütçesi artış taahhütleri somut sipariş büyümesine dönüşür. *Varsayım: Mevcut jeopolitik gerilim seviyesi büyük ölçüde sürer veya artar (bu yalnızca finansal senaryo dilidir, normatif bir değerlendirme değildir).* **Baz:** Bütçe artışları kademeli, savunma sektörünün tipik uzun sözleşme/teslimat döngüleri nedeniyle yavaş yansır. **Kötümser:** Jeopolitik yumuşama savunma harcaması ivmesini keser.
- **10-20 yıl:** Otonom/AI-destekli savaş sistemlerine geçiş, devlet politikası ile teknoloji olgunlaşmasının örtüştüğü yapısal bir trend görünümünde. Ancak JEDI'nin 0.82 yıllık (~10 aylık) geçmişi bu değerlendirmeyi nicel olarak destekleyecek kadar uzun değil; mevcut rakamlar (oynaklık %52.6, maksimum düşüş -%45) yalnızca kısa ve volatil bir pencereyi yansıtıyor.
- **Riskler:** Bazı kurumsal yatırımcıların ESG politikaları gereği savunma sektörünü dışlaması (likidite/talep etkisi), tekli program/sözleşme kaybı riski, kısa operasyonel geçmiş.
- **Makro etkiler:** NATO bütçe taahhütleri, ABD savunma bütçesi döngüsü, Çin-Tayvan gerginliği.

### 2.6 Sağlık, Biyoteknoloji ve Genetik (XLV, VHT, XBI, ARKG, AFS)

**Çerçeve:** Küresel demografik yaşlanma, GLP-1/obezite ilaçları, gen tedavisi, hassas tıp ve yapay zekâ destekli ilaç keşfi büyümenin sürücüleri. (Detaylı risk karşılaştırması Bölüm 4'te.)

- **5 yıl — İyimser:** Onaylanan yeni tedaviler (GLP-1 sınıfı, onkoloji, gen tedavisi) gelir büyümesini hızlandırır; küçük/orta ölçek biyoteknolojide satın alma dalgası değerlemeyi destekler. *Varsayım: Büyük ilaç şirketlerinin nakit pozisyonu M&A iştahını sürdürür.* **Baz:** Büyüme sürer ama ilaç fiyatlandırma regülasyonu marjları sınırlar. **Kötümser:** Regülasyon sertleşir, klinik faz başarısızlıkları kümelenir — ARKG'nin son 5 yıldaki -%55 USD getirisi bu senaryonun kısmen gerçekleştiğinin somut kanıtı.
- **10 yıl:** Demografik talep yapısal olarak güçlü kalır (yüksek güvenilirlikli baz varsayım), ama *hangi* şirketlerin kazanan olacağı yüksek belirsizlik taşıyor — bu nedenle geniş sepet (XLV/VHT) dar/temalı sepetten (ARKG) daha güvenilir bir taşıyıcı.
- **20 yıl:** İyimser senaryoda gen düzenleme ve kişiselleştirilmiş tıbbın olgunlaşması sağlık harcamasının verimliliğini artırır (önleme > tedavi); kötümser senaryoda maliyet enflasyonu sürdürülemez hale gelir, kamu sağlık sistemleri fiyat kontrolüne gider.
- **Riskler:** Regülasyon (FDA onay süreçleri, fiyat kontrolü), patent uçurumu, klinik başarısızlık riski (özellikle XBI/ARKG gibi küçük-orta ölçek ağırlıklı sepetlerde yüksek — beta'ları 1.15 ve 1.62 ile piyasa-üstü sistematik risk taşıyorlar).
- **Makro etkiler:** Demografi (yapısal, yüksek güvenilirlik), ABD sağlık politikası seçim döngüleri, faiz oranları (küçük ölçek biyoteknoloji sermaye maliyetine duyarlı).

### 2.7 Siber Güvenlik (CIBR)

**Çerçeve:** Dijitalleşme, bulut geçişi ve devlet destekli siber saldırı artışı; abonelik bazlı tekrarlayan gelir modeli savunmacı büyüme sağlıyor.

- **5-10 yıl — İyimser:** AI destekli saldırılar savunma harcamasını da AI'ya kaydırır, sektör büyümesi hızlanır. **Baz:** İstikrarlı çift haneli büyüme — nitekim 10 yıllık CAGR zaten %18.1 ve Sharpe 0.60 ile temanın kanıtlanmış en istikrarlı büyüyenlerinden biri. **Kötümser:** Bütçe kısıtlaması dönemlerinde BT güvenlik harcaması ötelenebilir (düşük olasılık).
- **20 yıl:** Siber güvenlik, dijital ekonomi var olduğu sürece yapısal bir maliyet kalemi olmaya devam edecek (yüksek güvenilirlikli baz senaryo) — ama bugünün liderleri 20 yıl sonra aynı olmayabilir.
- **Rekabet avantajı:** Yüksek müşteri değiştirme maliyeti ve abonelik geliri, nispeten savunmacı bir büyüme profili sağlıyor.
- **Riskler:** Yüksek büyüme = yüksek değerleme çarpanı; yeni giren rakip mimarisinin eskiyi geçersiz kılma riski.
- **Makro etkiler:** Kurumsal BT bütçe döngüsü, devlet siber güvenlik regülasyonu.

### 2.8 Enerji: Nükleer/Uranyum (URA) ve Geleneksel (XLE)

**URA — 5 yıl İyimser:** Küçük modüler reaktör (SMR) onayları hızlanır, hyperscaler'ların nükleer güç alım anlaşmaları (PPA) çoğalır, arz kısıtı nedeniyle uranyum spot fiyatı yükselir. *Varsayım: Veri merkezi elektrik talebi mevcut büyüme projeksiyonlarında gerçekleşir.* **Baz:** Politika desteği sürer ama yeni reaktör inşaat süreleri (tipik 10+ yıl) getiriyi öteler. **Kötümser:** Büyük bir nükleer kaza veya politika geri adımı sektör ivmesini keser — URA'nın -%61 tarihsel maksimum düşüşü bu riskin daha önce somut biçimde gerçekleştiğini gösteriyor.
**10-20 yıl:** Nükleerin düşük karbonlu taban yük enerji ihtiyacının yapısal parçası olması baz senaryoda yüksek güvenilirlikli, ama uranyum madenciliği hisseleri emtia fiyat döngüselliğine tabi kalmaya devam edecek (URA'nın 10 yıllık oynaklığı %38 — sektördeki en yüksek volatilitelerden biri).

**XLE — 5-20 yıl:** Geleneksel enerji talebinin zirve yapıp yapmadığı tartışması sürüyor (elektrikli araç geçişi vs. gelişmekte olan ülke talep büyümesi). **İyimser:** Yıllarca süren düşük sermaye harcaması arz kısıtlığı yaratıp fiyatları yüksek tutar. **Baz:** Talep platoya ulaşır, şirketler nakit getirisine (temettü/geri alım) odaklanır — defansif nakit akışı teması. **Kötümser:** Enerji geçişi hızlanır, varlıklar "mahsur kalmış varlık" riskiyle karşılaşır.
**Riskler (her ikisi için):** Jeopolitik arz şokları (OPEC+, Rusya/Orta Doğu), emtia fiyat döngüselliği, politika riski her iki yönde de mevcut.
**Makro etkiler:** Küresel büyüme, USD gücü (emtia fiyatlarıyla ters ilişkili).

### 2.9 Finans (XLF)

**Çerçeve:** ABD finans sektörü — faiz marjı, kredi büyümesi ve sermaye piyasası aktivitesine duyarlı; bankalar, sigorta, sermaye piyasaları ve tüketici finansmanı karışımı, saf banka riski değil.

- **5 yıl İyimser:** Faiz ortamı normalleşir, kredi büyümesi ve sermaye piyasası aktivitesi (M&A, halka arz) canlanır. **Baz:** İstikrarlı ama orta düzey büyüme — 10 yıllık CAGR zaten %13.4, Sharpe 0.43. **Kötümser:** Kredi döngüsü kötüleşir, banka bilanço kalitesi bozulur (2023 bölgesel banka stresine benzer bir olay riski hâlâ mevcut).
- **10-20 yıl:** Finans sektörünün ekonomiyle birlikte döngüsel büyümesi beklenir — bu, agresif bir büyüme teması değil, geniş ekonomi vekili (proxy) olarak görülmeli.
- **Riskler:** Faiz oranı riski (net faiz marjı), kredi kalitesi döngüsü, sermaye yeterliliği regülasyonu, fintech disrupsiyonu.
- **Makro etkiler:** Fed politikası, işsizlik/kredi temerrüt oranları, verim eğrisi şekli.

### 2.10 Özel Sermaye / Girişim Sermayesi (VCX)

**Çerçeve:** Halka açık olmayan, yüksek büyüme potansiyelli teknoloji şirketlerine erişim — halka açık piyasalarda bulunmayan bir maruziyet türü, ama önemli yapısal risklerle birlikte.

- **Yapısal riskler (öne çıkanlar):** (1) Kapalı uçlu yapı nedeniyle piyasa fiyatı NAV'dan sapabiliyor — bir kaynak zaten yüksek bir NAV primi bildiriyor; (2) **19 Eylül 2026'da lockup bitişi** somut, yakın vadeli bir arz baskısı riski taşıyor; (3) özel şirket değerlemeleri halka açık piyasalara göre daha az sık ve daha az şeffaf güncelleniyor, gerçek zamanlı fiyat keşfi yok; (4) yüksek likidite riski.
- **5 yıl İyimser:** Portföydeki özel şirketlerden biri veya birkaçı halka arz/satın alma yoluyla değer gerçekleştirir, NAV primi doğrulanır. *Varsayım: Mevcut portföy şirketlerinin büyüme trayektorisi sürer.* **Baz:** Bazı gerçekleşmeler olur, bazı değer düşüşü (write-down) riskleri de gerçekleşir, net etki nötr-pozitif. **Kötümser:** Özel teknoloji değerlemelerinde geniş çaplı düzeltme (2021-2022 VC değerleme düzeltmesine benzer) ve lockup sonrası arz baskısı fiyatı NAV'ın altına iter.
- **10-20 yıl:** Erken evre teknoloji yatırımında güç yasası (power law) dağılımı geçerlidir — birkaç büyük kazanan getirinin çoğunu taşır, çoğu pozisyon vasat/kayıp getirir. Fon düzeyinde çeşitlendirme bu riski kısmen azaltır, ama kapalı uçlu yapı + NAV prim/iskonto dinamiği ayrı bir risk katmanı ekler.
- **Sonuç:** Bu enstrüman, portföyün geri kalanından yapısal olarak farklı bir risk profiline sahip (illikit, opak fiyatlama) — pozisyon büyüklüğü buna göre sınırlı tutulmalıdır.

### 2.11 Yarı İletken (LRCX, DRAM + dolaylı QQQM/SPYM)

**Çerçeve:** Yapay zekâ eğitim/çıkarım talebi ve genel dijitalleşme yarı iletken talebini yapısal olarak destekliyor, ama sektör tarihsel olarak son derece döngüsel.

- **5-10 yıl İyimser:** Yapay zekâ talebi döngüselliği yumuşatır, yapısal büyüme baskın hale gelir — LRCX'in 10 yıllık CAGR'ı zaten %45.1 ile olağanüstü, ama %45.7 oynaklık ve -%56 maksimum düşüş döngüselliğin hâlâ güçlü olduğunu gösteriyor. **Baz:** Döngüsellik sürer, AI talebi genel yarı iletken döngüsünün üzerine binen ek bir büyüme katmanı olur. **Kötümser:** AI sermaye harcaması döngüsü keskin düzeltme yaşar (donanım siparişleri iptal/ertelenir), envanter fazlası oluşur — sektör tarihinde defalarca yaşanmış bir örüntü.
- **20 yıl:** Yarı iletkenlerin dijital ekonominin temel girdisi olması yüksek güvenilirlikli bir baz varsayım, ama üretim liderliği coğrafi olarak kayabilir (ABD CHIPS Act, AB Chips Act, Çin'in kendi kendine yeterlilik hamlesi).
- **Riskler:** Aşırı döngüsellik, jeopolitik (Tayvan/TSMC bağımlılığı — LRCX ekipman tedarikçisi olarak dolaylı etkilenir), tek hisse yoğunlaşma riski (LRCX sektör ETF'i değil, tek şirket).
- **Makro etkiler:** Küresel sermaye harcaması döngüsü, Çin'e yarı iletken ekipmanı ihracat kısıtları (LRCX geliri için doğrudan risk).

### 2.12 Türk Hisse Senedi Teması (TI2, MAC, GSP, YDI kümesi)

**Çerçeve:** BIST'e (veya benzeri TL varlık sınıfına) maruziyet — gelişmekte olan piyasa risk primi + Türkiye'ye özgü makro risk (enflasyon, TL değer kaybı, siyasi risk).

- **İyimser:** Disinflasyon programı başarılı olur, reel faiz pozitif kalır, BIST yeniden değerleme (re-rating) yaşar. **Baz:** Mevcut yapısal enflasyon/devalüasyon örüntüsü sürer — nitekim TI2'nin USD CAGR'ı %26.2 iken TL 1 yıllık getirisi +%21, USD 1 yıllık getirisi yalnızca +%3.9: kur kaybının nominal getiriyi büyük ölçüde eritmesi somut olarak gözlemleniyor. **Kötümser:** Makro istikrarsızlık derinleşir.
- **Önemli gözlem:** Bu kümenin ABD ETF'leriyle korelasyonu son derece düşük (ρ≈0.03-0.06) — istatistiksel olarak gerçek bir çeşitlendirme kaynağı. Ancak bu faydanın, Türkiye'de yaşayan/TL harcayan bir yatırımcının **zaten** taşıdığı ülke riskiyle (gelir, gayrimenkul, iş) çakışıp çakışmadığı ayrıca değerlendirilmelidir — bu Bölüm 4'te ve kapanışta daha ayrıntılı ele alınıyor.

---

## 3. Eksik Alan Analizi

Portföyün ~40 aracı, esas olarak iki eksene sıkışmış durumda: **(i) ABD merkezli, büyüme/tema ağırlıklı hisse senedi maruziyeti** ve **(ii) Türkiye'ye özgü TL varlıklar**. Bu, ACWI ölçütüne göre çeşitlendirme iddiasıyla çelişen geniş boşluklar bırakıyor. Aşağıdaki alanların **hiçbiri** portföyde temsil edilmiyor.

| Eksik alan | Neden önemli | Somut ETF önerisi | Gerekçe |
|---|---|---|---|
| Saf bankacılık | XLF bankalar+sigorta+sermaye piyasalarının karışımı; faiz marjına/kredi döngüsüne saf maruziyet yok | **KBE** (SPDR S&P Bank ETF) veya **KRE** (SPDR S&P Regional Banking ETF) | KBE geniş banka endeksi (büyük+orta ölçek), KRE bölgesel bankalara odaklanır; faiz oranı ortamına XLF'den daha temiz bir maruziyet sağlar |
| Sigorta | Sigorta şirketleri farklı bir risk/getiri profiline sahip (prim geliri, faiz getirisi, katastrofik risk) — XLF içinde seyrelmiş durumda | **KIE** (SPDR S&P Insurance ETF) | XLF'nin karışık yapısından sigorta maruziyetini ayrıştırıp saflaştırır |
| Altyapı | Fiziksel altyapı (yol, liman, enerji nakil hattı) enflasyona karşı doğal koruma ve düşük korelasyon sağlar; portföyde hiç yok | **IGF** (iShares Global Infrastructure) veya **PAVE** (ABD altyapı/inşaat) | Uzun vadeli, nispeten düşük volatiliteli nakit akışı sağlayan bir varlık sınıfı tamamen eksik |
| Su | Su kıtlığı temaları, kamu hizmeti benzeri istikrarlı talep | **CGW** (Invesco S&P Global Water) veya **PHO** (Invesco Water Resources) | Defansif, düşük beta, iklim/kıtlık teması altında yapısal büyüme |
| Tüketim (temel + döngüsel) | Portföyde tek bir tüketici şirketi (gıda, perakende, kişisel bakım vb.) yok | **XLP** (Consumer Staples — defansif) ve **XLY** (Consumer Discretionary — döngüsel) | Portföy tamamen tematik/büyüme ağırlıklı; ekonomik döngünün her aşamasında talep gören klasik defansif çekirdek eksik |
| Endüstriyel | Geleneksel imalat, havacılık, lojistik — robotik/uzay temalarının "eski ekonomi" müşteri tabanı | **XLI** (Industrial Select Sector) | Otomasyon talebini yaratan asıl sanayi tabanına hiç maruziyet yok |
| REIT / gayrimenkul | Enflasyona karşı koruma, kira geliri üreten varlık sınıfı; portföyde hiç yok | **VNQ** (Vanguard Real Estate) veya **SCHH** | Faiz oranı döngüsünde farklı davranan, gelir üreten bir varlık sınıfı eksik |
| Temettü / değer | Portföy tamamen büyüme/tematik ağırlıklı; değer faktörü (düşük çarpan, olgun nakit akışı) yok | **VYM** (Vanguard High Dividend Yield), **SCHD** veya **DGRO** | Büyümeden değere piyasa rotasyonu senaryosunda portföy tek taraflı kalıyor |
| Küçük ölçek | Portföy neredeyse tamamen büyük/mega ölçek (S&P 500, Nasdaq-100, büyük sektör ETF'leri, tek büyük hisseler); küçük ölçek risk primi eksik | **IWM** (iShares Russell 2000) veya **VB** (Vanguard Small-Cap) | Tarihsel olarak pozitif ama son 15 yılda zayıflamış bir faktör — "ölmüş" değil, ama portföyde sıfır temsil |
| Gelişmekte olan ülkeler (Türkiye hariç) | Çin, Hindistan, Brezilya, Güneydoğu Asya gibi büyüyen ekonomiler tamamen eksik | **VWO** (Vanguard FTSE Emerging Markets) veya **IEMG** | 10-20 yıllık ufukta EM'in küresel GSYH payının artması beklenen yapısal tema; portföyde sıfır maruziyet. Çin'e özgü regülasyon/jeopolitik riski nedeniyle EM ex-China (**EMXC**) alternatifi de değerlendirilebilir |
| Avrupa | Gelişmiş piyasa çeşitlendirmesi, farklı para birimi/faiz rejimi, farklı sektör ağırlıkları (endüstriyel, lüks tüketim, sağlık) | **VGK** (Vanguard FTSE Europe) veya **IEUR** | ACWI'nin önemli bir dilimi portföyde hiç temsil edilmiyor |
| Japonya | Kurumsal reform teması (Tokyo Borsası'nın sermaye verimliliği baskısı), farklı demografi/para politikası rejimi | **EWJ** (iShares MSCI Japan) veya **BBJP** (düşük gider oranlı alternatif) | ABD dışında ikinci büyük gelişmiş ekonomiye hiç maruziyet yok |
| Hindistan | Hızlı büyüyen büyük ekonomilerden biri, demografik avantaj, "Çin+1" tedarik zinciri kaymasının faydalanıcısı | **INDA** (iShares MSCI India) veya **EPI** (WisdomTree India Earnings) | En güçlü tekil-ülke yapısal büyüme hikayelerinden biri, portföyde sıfır |

**Genel değerlendirme:** Portföy, ACWI ölçütüne göre performans karşılaştırılırken, ACWI'nin coğrafi/sektörel bileşiminin büyük bir kısmını (Avrupa, Japonya, gelişmekte olan Asya, REIT, finans-dışı defansif sektörler) hiç içermiyor. Bu, ölçüte göre "aktif bahis" olarak yorumlanabilir (bilinçli bir tercihse sorun değil), ama "küresel çeşitlendirme" hedefiyle tam örtüşmüyor — mevcut yapı küresel çeşitlendirmeden çok **"ABD teması + Türkiye" barbell'i**.

---

## 4. Bankacılık ve Sağlık: Derinlemesine Karşılaştırma

Kullanıcının başlangıç varsayımı — TI2 ve AFS'nin bankacılık fonu olduğu — **yanlıştı**. TI2 genel bir Türk hisse senedi fonu (TL bazlı), AFS ise yabancı hisse senedi bazlı bir **sağlık sektörü** fonu. Portföyde saf bankacılık maruziyeti sağlayan **hiçbir araç yok**; en yakın araç olan XLF de bankalar, sigorta ve sermaye piyasaları şirketlerinin karışımı olan geniş bir ABD finans sektörü fonu.

### 4.1 Risk profili karşılaştırması

| Araç | Tema | Ufuk (yıl) | CAGR (USD) | Oynaklık | Sharpe | maxDD | Beta (ACWI) | Alpha | 1y (USD) | 5y (USD) |
|---|---|---|---|---|---|---|---|---|---|---|
| **XLV** | Sağlık (geniş, büyük ölçek ağırlıklı) | 10 | %9.7 | %16.6 | 0.34 | -%28 | 0.74 | -%0.6 | +%24 | +%34 |
| **VHT** | Sağlık (geniş, XLV'nin neredeyse ikizi) | 10 | %9.8 | %17.0 | 0.34 | -%29 | 0.80 | -%0.9 | +%26 | +%29 |
| **XBI** | Biyoteknoloji (eşit ağırlıklı, küçük/orta ölçek) | 10 | %10.2 | %31.9 | 0.20 | -%64 | 1.15 | -%3.5 | +%80 | +%19 |
| **ARKG** | Genomik/genetik devrim (konsantre, tematik) | 10 | %8.9 | %41.4 | 0.12 | -%84 | 1.62 | -%8.9 | +%57 | **-%55** |
| **AFS** | Sağlık (TL, yabancı hisse, TEFAS) | ~5 | **-%1.1** | %25.6 | **-0.20** | -%41 | 0.49 | — | +%14 (USD) | — |
| **XLF** | Finans (geniş — banka+sigorta+sermaye piyasaları) | 10 | %13.4 | %22.1 | 0.43 | -%43 | 1.11 | +%0.1 | +%8.7 | +%67 |
| **TI2** | Türk hisse senedi (genel, banka değil) | ~5 | %26.2 | %30.7 | 0.72 | -%33 | 0.26 | — | +%3.9 (USD)| — |

### 4.2 Defansiflik sıralaması

Oynaklık, beta ve maksimum düşüşe göre en defansiften en agresife:

1. **XLV / VHT** — veri setindeki en düşük oynaklığa (%16.6-17.0) ve en sığ maksimum düşüşe (-%28/-%29) sahip iki araç; beta'ları da (0.74-0.80) piyasanın altında. Büyük, kârlı, temettü ödeyen ilaç/sağlık sigortası şirketlerinin ağırlıklı olduğu bir yapıya işaret ediyor. Bedeli: alpha hafif negatif (-%0.6/-%0.9) — defansiflik, piyasa-üstü getiri üretmeden geliyor; bu beklenen ve tutarlı bir değiş tokuş.
2. **XLF** — beta 1.11 ile piyasaya yakın/hafif üstü, oynaklık %22.1 orta düzey, maksimum düşüş -%43 orta-yüksek. "Defansif" değil, döngüsel-nötr bir sektör pozisyonu. 10 yıllık pozitif alpha (+%0.1) ve Sharpe 0.43 ile kümenin nispeten sağlıklı ucu.
3. **TI2** — standalone oynaklık yüksek (%30.7) ama ACWI'ye karşı beta çok düşük (0.26) — yani küresel piyasa çöküşlerinde TI2'nin "birlikte düşme" eğilimi zayıf. Bu düşük beta, Türkiye'ye özgü risklerin küresel döngüden bağımsız hareket etmesinden kaynaklanıyor; düşük sistematik risk, düşük toplam risk anlamına gelmiyor.
4. **AFS** — oynaklığı (%25.6) XBI/ARKG'den düşük, "orta risk" görünüyor, ama bu yanıltıcı: **sürekli negatif Sharpe (-0.20)** taşıyor, yani riskin karşılığı alınamıyor. Düşük-orta oynaklıkla birleşen kalıcı değer kaybı, "düşük risk" görüntüsü veren bir tuzak.
5. **XBI** — beta 1.15, oynaklık %31.9, maksimum düşüş -%64: piyasa-üstü sistematik risk taşıyan, orta-büyük ölçekli biyoteknoloji sepeti.
6. **ARKG** — kümenin en agresif ucu: beta 1.62, oynaklık %41.4, maksimum düşüş -%84 (QBTS ve RKLB'den sonra veri setindeki en derin düşüşlerden biri), alpha -%8.9 (belirgin negatif).

### 4.3 Kriz dayanıklılığı (maksimum düşüş sıralaması)

XLV (-%28) ≈ VHT (-%29) < TI2 (-%33) < XLF (-%43) < AFS (-%41, XLF'ye yakın) < XBI (-%64) < ARKG (-%84, kümenin en kırılganı)

Not: TI2'nin maksimum düşüşünün (-%33) XLF'den bile sığ olması dikkat çekici — ama bu, TI2'nin "daha güvenli" olduğu anlamına gelmiyor; farklı bir risk kaynağına (Türkiye makro riski, TL kur riski) maruz kalması, ABD finans/sağlık krizleriyle aynı anda düşmediği anlamına geliyor. Kendi krizleri (yüksek enflasyon, kur şoku) ayrı bir zaman diliminde gerçekleşiyor olabilir.

### 4.4 Büyüme mi, sürdürülebilirlik mi?

- **XLV/VHT**: Demografik yaşlanma yapısal, uzun soluklu bir talep sürücüsü; büyük, kârlı, çeşitlendirilmiş şirket portföyü iş riskini azaltıyor. En **sürdürülebilir** görünen sağlık maruziyeti — ama tanım gereği yüksek alpha üretmesi beklenmiyor.
- **XBI/ARKG**: Sektörün yenilikçi ucu; teorik olarak uzun vadede biyoteknolojik inovasyonun bileşik büyümesinden faydalanma potansiyeli var, ama gerçekleşen yol son derece pürüzlü. ARKG özelinde, 5 yıllık -%55 USD getiri, 2021 büyüme/ARK-fonları zirvesi sonrası yaşanan sert düzeltmenin doğrudan izini taşıyor — kamuoyunca bilinen bir örüntü. Bu, "büyüme teması" ile "gerçekleşen getiri" arasındaki farkın CFA analizinde ayrı ayrı değerlendirilmesi gereken iki şey olduğunu gösteren net bir örnek: stil maruziyeti (growth/biotech factor) doğru olabilir, ama gerçekleşen sonuç yatırımcıyı ödüllendirmemiş.
- **AFS**: ~5 yıllık yaşamı boyunca kalıcı negatif risk-ayarlı getiri (Sharpe -0.20), tek bir çöküş anıyla açıklanamıyor — sürekli bir zayıflık örüntüsüne işaret ediyor. Bu, ya zayıf hisse seçimi/yönetim performansı, ya TEFAS aktif fonlarına özgü yüksek toplam gider oranı, ya da kur/hedge sürtünmesinden kaynaklanabilir; eldeki veriyle kesin nedeni ayırt etmek mümkün değil, ancak sonuç nettir: bu pozisyon sağlık temasını **sürdürülebilir** biçimde temsil etmiyor.
- **XLF**: Finans sektörünün büyümesi yapısal olarak GSYH büyümesinden ayrışması beklenmeyen bir döngüsel sektördür — "büyüme teması" değil, geniş ekonomi vekili olarak değerlendirilmeli.

### 4.5 Sentez

Sağlık teması portföyde fiilen bir **barbell** (iki uçlu) yapıda: bir tarafta defansif çekirdek (XLV/VHT, birbirinin neredeyse kopyası), diğer tarafta yüksek riskli uçlar (XBI, ARKG). Ancak bu barbell'e üçüncü, zayıf gerekçeli bir kol daha eklenmiş: AFS, ne defansif çekirdeğin istikrarını ne de riskli ucun (en azından teorik) yukarı potansiyelini taşımadan, sürekli negatif getiri üretiyor. Finans tarafında ise "barbell" bile yok — tek, geniş, orta riskli bir araç (XLF) var; ne saf bankacılığın döngüsel yukarı/aşağı potansiyeli ne de sigorta gibi alt-sektörlerin farklılaşmış risk profili ayrı ayrı temsil ediliyor.

---

## 5. Alternatif Öneriler

Aşağıdaki tablo, zayıf risk-ayarlı performans gösteren pozisyonları, aynı temaya daha verimli maruziyet sağlayan alternatiflerle karşılaştırıyor. Karşılaştırma ölçütleri: getiri (CAGR/1y/5y), risk (Sharpe, maxDD, oynaklık), gider oranı, likidite (AUM) verilen veriye dayanmaktadır.

| Zayıf pozisyon | Sorun | Alternatif | Alternatifin gerekçesi |
|---|---|---|---|
| **ROBT** (10y CAGR %7.6, Sharpe 0.14, gider %0.65, AUM $704M) ve **BOTZ** (10y CAGR %9.6, Sharpe 0.22, gider %0.68, AUM $3.20B) | İkisi de aynı temayı temsil ediyor (ρ=0.931) — biri fazladan gider. İkisi de 10 yıllık ufukta geniş piyasanın (QQQM Sharpe 0.59) belirgin gerisinde | Tek bir araca konsolidasyon (daha büyük/likit **BOTZ**'u tercih edip **ROBT**'u kapatmak), ya da zaten portföyde olan **QQQM**'e (BOTZ ile %12.5 holding çakışması var) güvenmek | BOTZ, ROBT'a göre 4.5 kat daha büyük AUM ile daha likit; aynı gider oranı seviyesinde daha iyi tarihsel Sharpe. Temanın kendisi 10 yıldır finansal olarak zayıf performans gösterdiğinden, pozisyon büyüklüğünü küçültmek de ayrı bir seçenek |
| **ARKG** (10y CAGR %8.9 ama Sharpe 0.12, maxDD -%84, 5y **-%55**, gider %0.75 — kümenin en yüksek gideri, en kötü sonucu) | Konsantre, tematik bahis; 2021 zirvesi sonrası sert ve uzun süreli değer kaybı | **XBI** (aynı geniş biyoteknoloji temasına, gider %0.35 — yarı fiyatına, 10y Sharpe 0.20 vs 0.12, 5y getiri +%80 vs -%55, AUM $10.5B vs $1.62B — çok daha likit) | XBI, aynı "yenilikçi biyoteknoloji" risk primini daha düşük maliyetle ve önemli ölçüde daha iyi gerçekleşmiş sonuçla sunuyor. Daha da düşük volatilite isteyen yatırımcılar için büyük-ölçek ağırlıklı **IBB** (bu veri setinde nicel olarak test edilmedi, ayrıca değerlendirilmeli) bir sonraki adım olabilir |
| **AFS** (5y CAGR **-%1.1**, Sharpe **-0.20** — sağlık kümesindeki tek sürekli değer kaybettiren araç) | Kalıcı negatif risk-ayarlı getiri, muhtemelen yüksek TEFAS aktif yönetim gideri (veri setinde gider oranı verilmemiş) | **XLV** (gider %0.08) veya **VHT** (gider %0.09) | Her ikisi de 10 yıllık pozitif CAGR (%9.7-9.8), çok daha büyük/likit AUM ($41.8B / $18.2B vs AFS'nin ~803mn TL ≈ ~$17M eşdeğeri) ve on yılı aşkın kanıtlanmış geçmişe sahip. Not: TL'den USD'ye geçiş, Türkiye'de yaşayan bir yatırımcı için doğrudan ABD borsasında işlem gören ETF'lerin saklama/vergi (özellikle ABD "estate tax" — miras vergisi maruziyeti yabancı yatırımcılar için ayrı bir konu) boyutlarını gündeme getirir; geçiş tamamen sürtünmesiz değildir, ama getiri/risk farkı yönü tartışmasız net |
| **QBTS** (tek hisse, oynaklık %126, maxDD **-%97**, Sharpe 0.05, alpha -%9.6 — veri setindeki en kötü risk-ayarlı profil) | Tek teknoloji mimarisine (kuantum tavlama) yoğunlaşmış, sermaye pratikte sıfırlanma noktasına yaklaşmış | **QTUM** (aynı temaya çeşitlendirilmiş sepet: oynaklık %27.6, maxDD -%38, Sharpe 0.81) | Aynı temaya çok daha sağlıklı bir risk profiliyle maruziyet sağlıyor. QTUM'un QBTS'i bileşen olarak içerip içermediği doğrulanmalı — içeriyorsa, ikisini birlikte tutmak çeşitlendirme değil, aynı riski ikiletmektir |
| **RKLB** (tek hisse, oynaklık %79, maxDD -%83) | Olağanüstü getiri (10y CAGR %41.4, 5y +%542) ama tek şirkete yoğunlaşmış, sermaye yoğun/yürütme riski yüksek bir sektörde | Doğrudan ikame değil — zaten portföyde olan **NASA** (holding çakışması yalnızca %10.6, yani gerçek anlamda tamamlayıcı, tekrar değil) sektör-çeşitlendirilmiş bir tamamlayıcı sağlıyor | Öneri, RKLB'yi tamamen çıkarmak değil; pozisyon büyüklüğü disiplini (tek hisse ağırlığına üst sınır) uygulamak, çünkü NASA zaten farklı bir açıdan aynı temaya maruziyet veriyor |
| **NKP** (CAGR -%2.8, Sharpe -0.54 — tüm veri setindeki en zayıf performans; TL bazında da negatif 1y getiri -%3.2, ki TL değer kaybı ortamında nadir bir bulgu) | Hem USD hem TL bazında para kaybı — tema ne olursa olsun kırmızı bayrak | Kimlik/tema teyidi + yakın gözden geçirme (bu veri setinde alternatif önerilecek kadar tema bilgisi yok) | Getiri örüntüsü, temadan bağımsız olarak (yönetim/yapı sorunu olabilir) acil inceleme gerektiriyor |
| **PSH** (AUM yalnızca 20mn TL, 418 yatırımcı, kısa geçmiş, oynaklık %19.9) | Önemsiz ölçek, sınırlı veri, olası likidite sorunu | Kimlik/gerekçe teyidi; ölçek çok küçükse konsolidasyon/kapatma değerlendirilebilir | Portföy yönetimi açısından, izleme maliyetine değecek kadar büyük olmayan pozisyonların sadeleştirilmesi genel bir prensip |

**Genel gözlem:** Zayıf performans gösteren pozisyonların ortak paydası, çoğu durumda **aynı temaya çok daha düşük maliyetle ve çok daha büyük/likit bir araçla zaten portföyde maruziyet bulunması** (QQQM'in BOTZ/ROBT/QTUM/CIBR ile örtüşmesi, NASA'nın RKLB ile kısmi örtüşmesi gibi). Bu, "yeni bir şey almak" yerine "mevcut olanı sadeleştirmek"in çoğu durumda daha etkili bir ilk adım olduğunu gösteriyor.

---

## Sonuç ve Öncelik Sırası

Bu rapor bir öneri listesi değil, mevcut portföyün nitel bir haritasıdır. Yine de, verilerin işaret ettiği önceliklendirilmiş bir gündem şu şekilde özetlenebilir:

1. **Kimlik doğrulama önceliği:** PHE (en büyük pozisyon, davranışsal anomali), KPA (benzer beta anomalisi, küçük ölçek), TBE (TEFAS listelerinde bulunamadı), YHZ (istatistiksel olarak değerli ama kimliği belirsiz bir çeşitlendirici) ve CPU/GPT/KTJ/NKP/PNU/PSH için tema/mandate teyidi yapılmadan bu araçlar hakkında anlamlı bir risk yönetimi kararı almak zor.
2. **Yoğunlaşma sadeleştirmesi:** XLV/VHT (ρ 0.991), BOTZ/ROBT (ρ 0.931) ve QQQM/SPYM (ρ 0.945) çiftlerinin her biri, tek bir araca indirgenerek gider tasarrufu sağlanabilir, çeşitlendirme kaybı asgari düzeyde olur.
3. **Aşırı risk pozisyonlarının gözden geçirilmesi:** QBTS (maxDD -%97) ve AFS (kalıcı negatif Sharpe) veri setindeki en net "düzeltme gerektiren" iki pozisyon.
4. **Boşluk kapatma:** Küresel çeşitlendirme hedefiyle en çok çelişen eksiklikler — Avrupa, Japonya, Hindistan/geniş EM, REIT, temettü/değer, saf bankacılık — Bölüm 3'teki somut ETF önerileriyle değerlendirilmeli.
5. **Toplam bilanço perspektifi:** TL fonları kümesinin (TI2/MAC/GSP/YDI, YAY/GUH/YJK/YTD/YZC) toplam portföy içindeki ağırlığı, yatırımcının zaten Türkiye'de yaşayan/TL harcayan/muhtemelen TL gelirli olması nedeniyle taşıdığı ülke riskiyle birlikte (yatırım portföyü + insan sermayesi + varsa gayrimenkul) bütüncül olarak değerlendirilmelidir; salt portföy-içi korelasyon düşüklüğü tek başına yeterli bir çeşitlendirme kanıtı değildir.

---

## Yasal Uyarı

Bu belge yalnızca bilgilendirme ve eğitim amaçlıdır; bireysel yatırım tavsiyesi, aracılık teklifi veya portföy yönetimi hizmeti teşkil etmez. Burada sunulan senaryolar (İyimser/Baz/Kötümser) birer olasılık çerçevesidir, gelecekteki sonuçların tahmini veya garantisi değildir. Geçmiş performans, gelecekteki sonuçların güvenilir bir göstergesi değildir. Belirtilen ETF/fon örnekleri açıklayıcı amaçlıdır, alım-satım önerisi olarak yorumlanmamalıdır. Yatırım kararları verilmeden önce bağımsız, lisanslı bir yatırım danışmanına ve/veya vergi danışmanına başvurulması önerilir.

