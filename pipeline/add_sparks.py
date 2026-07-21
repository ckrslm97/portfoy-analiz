"""app_data.json'a kompakt fiyat serisi ekler (inline SVG grafikler için).

Son 2 yıl, haftalık kapanış, normalize edilmiş (ilk gözlem = 100).
Boyutu düşük tutmak için 1 ondalık.
"""
import json, os, pathlib
import pandas as pd
from build_app_data import load_all

DATA = pathlib.Path(os.environ.get("DATA_DIR", pathlib.Path(__file__).parent.parent/"site"/"data"))
d = json.loads((DATA/"app_data.json").read_text())
panel, _ = load_all()

end = panel.index.max()
start = end - pd.Timedelta(days=730)
wk = panel[panel.index >= start].resample("W-FRI").last()

sparks, dates = {}, None
for kod in list(d["portfoy"]) + list(d["aday"]):
    if kod not in wk.columns: continue
    s = wk[kod].dropna()
    if len(s) < 8: continue
    base = s.iloc[0]
    if not base or base <= 0: continue
    sparks[kod] = [round(float(x/base*100), 1) for x in s]
    if dates is None or len(s) > len(dates):
        dates = [t.strftime("%Y-%m-%d") for t in s.index]

d["spark"] = sparks
d["spark_not"] = "Son 2 yıl, haftalık kapanış, ilk gözlem = 100. Seriler farklı uzunlukta olabilir (kuruluş tarihi farklı)."
(DATA/"app_data.json").write_text(json.dumps(d, ensure_ascii=False, separators=(",",":")))
print("seri:", len(sparks), "| dosya:", (DATA/"app_data.json").stat().st_size//1024, "KB")
print("ornek ARKG:", sparks.get("ARKG", [])[:6], "...")
