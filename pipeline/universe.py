"""Analiz evreni: enstrüman tanımları ve sınıflandırma.

Kod eşleşmeleri TEFAS API'sinden ve Yahoo Finance meta'sından doğrulanmıştır
(2026-07-20/21). Kullanıcının verdiği etiketlerle resmi unvanlar arasındaki
uyuşmazlıklar MISMATCH alanında işaretlenir.
"""

# --- TEFAS fonları: kod -> resmi unvan (TEFAS API, 2026-07-20) ---
TEFAS = {
    "YZC": "Yapı Kredi Fintech ve Blockchain Teknolojileri Değişken",
    "YJK": "Yapı Kredi Robotik ve Yarı İletken Teknolojileri Fon Sepeti",
    "YHZ": "Yapı Kredi BIST Teknoloji Ağırlık Sınırlamalı Endeksi",
    "CPU": "Aktif Portföy Teknoloji Katılım",
    "GPT": "Aktif Portföy Robotik Teknolojileri Değişken",
    "GSP": "Azimut Kar Payı Ödeyen Hisse Senedi",
    "GUH": "Garanti Yabancı Teknoloji Hisse Senedi",
    "KPA": "Kuveyt Türk Kar Payı Ödeyen Katılım Hisse Senedi",
    "KTJ": "Kuveyt Türk Teknoloji Katılım",
    "NKP": "Neo Kar Payı Ödeyen Değişken",
    "PHE": "Pusula Hisse Senedi",
    "PNU": "Pusula İkinci Para Piyasası (TL)",
    "PSH": "Deniz Perakende Sektörü Hisse Senedi",
    "YDI": "Yapı Kredi Model Portföy Hisse Senedi",
    "YAY": "Yapı Kredi Yabancı Teknoloji Sektörü Hisse Senedi",
    "YTD": "Yapı Kredi Yabancı Fon Sepeti",
    # --- eklenmek istenenler ---
    "AFS": "Ak Portföy SAĞLIK Sektörü Yabancı Hisse Senedi",
    "TI2": "İş Portföy Hisse Senedi (TL)",
    "MAC": "Marmara Capital Hisse Senedi (TL)",
    # TBE: TEFAS YAT ve EMK listelerinde BULUNAMADI (2026-07-20)
}

#: Kullanıcının etiketi ile resmi unvanın çeliştiği kodlar
MISMATCH = {
    "AFS": "Kullanıcı BANKACILIK sanıyor; resmi unvan SAĞLIK sektörü yabancı hisse fonu.",
    "TI2": "Kullanıcı BANKACILIK sanıyor; genel TR hisse senedi fonu, bankacılık teması yok.",
    "TBE": "TEFAS YAT/EMK listelerinde bulunamadı — kod doğrulanamadı.",
}

# --- ABD tarafı: sembol -> (tür, not); Yahoo meta ile doğrulandı ---
US = {
    "QQQM": ("ETF", "Invesco Nasdaq-100"),
    "QTUM": ("ETF", "Defiance Quantum"),
    "XLE": ("ETF", "Energy Select Sector SPDR"),
    "SPYM": ("ETF", "SPDR Portfolio S&P 500"),
    "CIBR": ("ETF", "First Trust Nasdaq Cybersecurity"),
    "URA": ("ETF", "Global X Uranium"),
    "BOTZ": ("ETF", "Global X Robotics & AI"),
    "ROBT": ("ETF", "First Trust Nasdaq AI & Robotics"),
    "XBI": ("ETF", "SPDR S&P Biotech"),
    "ARKG": ("ETF", "ARK Genomic Revolution"),
    "NASA": ("ETF", "Tema Space Innovators — 2026-03 kuruldu, çok kısa geçmiş"),
    "DRAM": ("ETF", "Roundhill Memory — 2026-04 kuruldu, çok kısa geçmiş"),
    "JEDI": ("ETF", "Defiance Drone & Modern Warfare — JEDI.L (VanEck) ile ad çakışması"),
    # --- eklenmek istenen ABD ETF ---
    "XLV": ("ETF", "Health Care Select Sector SPDR"),
    "VHT": ("ETF", "Vanguard Health Care"),
    "XLF": ("ETF", "Financial Select Sector SPDR"),
    # --- ETF SANILAN AMA TEK HİSSE OLANLAR ---
    "QBTS": ("STOCK", "D-Wave Quantum Inc. — ETF DEĞİL, tek hisse"),
    "LRCX": ("STOCK", "Lam Research Corp. — ETF DEĞİL, tek hisse"),
    "RKLB": ("STOCK", "Rocket Lab Corp. — ETF DEĞİL, tek hisse"),
    "VCX": ("UNKNOWN", "Yahoo'da isimsiz EQUITY döndü — kimlik doğrulanamadı"),
}

#: Karşılaştırma ölçütleri ve makro seriler
BENCHMARKS = {
    "SPY": "S&P 500 (ABD geniş)",
    "ACWI": "MSCI ACWI (küresel)",
    "QQQ": "Nasdaq-100 (teknoloji ölçütü)",
    "XU100.IS": "BIST 100",
    "TRY=X": "USD/TRY kuru",
}

STOCKS = [k for k, v in US.items() if v[0] == "STOCK"]
ETFS = [k for k, v in US.items() if v[0] == "ETF"]

# --- Tema etiketleri: rapordaki "Tematik Maruziyet Haritası" (bölüm 7) ile
# birebir aynı sınıflandırma. Pivot/karşılaştırma görünümünün satır-sütun
# boyutu olarak kullanılır. Bir enstrümanın birincil teması tektir — bu
# kasıtlı bir basitleştirme, çok temalılık raporda ayrıca ele alınıyor.
THEMES = {
    "QQQM": "YZ / Büyük Teknoloji", "SPYM": "Küresel Çekirdek", "CIBR": "Siber Güvenlik",
    "YAY": "YZ / Büyük Teknoloji", "GUH": "YZ / Büyük Teknoloji", "YJK": "Yarı İletken",
    "YTD": "YZ / Büyük Teknoloji", "YZC": "YZ / Büyük Teknoloji",
    "DRAM": "Yarı İletken", "LRCX": "Yarı İletken", "QTUM": "Kuantum", "QBTS": "Kuantum",
    "BOTZ": "Robotik", "ROBT": "Robotik", "GPT": "Robotik",
    "RKLB": "Uzay", "NASA": "Uzay", "JEDI": "Savunma / Dron",
    "XLV": "Sağlık", "VHT": "Sağlık", "AFS": "Sağlık",
    "XBI": "Biyoteknoloji", "ARKG": "Biyoteknoloji",
    "XLF": "Finans", "URA": "Nükleer / Uranyum", "XLE": "Geleneksel Enerji",
    "VCX": "Özel Sermaye / VC",
    "PHE": "TR Hisse (Genel)", "TI2": "TR Hisse (Genel)", "MAC": "TR Hisse (Genel)",
    "GSP": "TR Hisse (Genel)", "YDI": "TR Hisse (Genel)",
    "YHZ": "TR Teknoloji", "KPA": "Katılım (İslami)", "CPU": "Katılım (İslami)",
    "KTJ": "Katılım (İslami)", "PSH": "TR Perakende / Tüketim", "PNU": "Nakit / Para Piyasası",
    "NKP": "TR Hisse (Genel)",
}
