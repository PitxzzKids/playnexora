from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"
source = HTML.read_text(encoding="utf-8")
references = re.findall(r"(?:src|href)=[\"'](assets/[^\"']+)[\"']", source, flags=re.I)
missing = [ref for ref in references if not (ROOT / ref).is_file()]
print(f"Referensi aset lokal diperiksa: {len(references)}")
if missing:
    print("Aset tidak ditemukan:")
    for item in missing:
        print(f" - {item}")
    raise SystemExit(1)
print("OK: semua referensi aset lokal ditemukan.")
for folder in ("assets/styles", "assets/scripts", "assets/images", "data", "docs", "scripts", "tests"):
    if not (ROOT / folder).is_dir():
        raise SystemExit(f"Folder tidak ditemukan: {folder}")
print("OK: struktur folder lengkap.")
