# NEXORA TJKT — Full Project Structure

Paket ini menyusun proyek frontend NEXORA dari file sumber yang diberikan. CSS, JavaScript, dan gambar disimpan dalam folder terpisah; urutan pemuatan kode dipertahankan di `index.html`.

## Menjalankan di VS Code

1. Ekstrak ZIP.
2. Buka folder `NEXORA-PROJECT-FULL` melalui **File → Open Folder** di VS Code.
3. Gunakan ekstensi **Live Server**, atau jalankan `python -m http.server 5500` dari terminal pada folder proyek.
4. Buka `http://localhost:5500`.
5. Internet dibutuhkan untuk Google Fonts serta GSAP, ScrollTrigger, dan Lenis yang masih menggunakan CDN.

## Struktur folder

```text
NEXORA-PROJECT-FULL/
├── index.html
├── README.md
├── .editorconfig
├── .gitignore
├── assets/
│   ├── styles/       # 31 stylesheet CSS
│   ├── scripts/      # 17 modul JavaScript
│   └── images/       # Logo aplikasi
├── data/             # Catatan penyimpanan data saat ini
├── docs/             # Arsitektur, inventaris aset, dan panduan uji
├── scripts/          # Utilitas pemeriksaan proyek
└── tests/            # Catatan pengujian manual
```

## Status teknis penting

- Ini adalah frontend statis; belum ada backend/API atau database online.
- Login dan penyimpanan progres mengikuti implementasi lokal browser pada kode sumber. Folder `data/` hanya dokumentasi, bukan database aktif.
- Jangan mengubah urutan stylesheet dan script pada `index.html` tanpa pengujian karena dapat memengaruhi tampilan/fungsi.
- Tiga gambar logo sumber ternyata identik, sehingga diringkas menjadi satu `assets/images/logo.png`.

## Pemeriksaan aset

Jalankan `python scripts/check_project.py` dari folder proyek.
