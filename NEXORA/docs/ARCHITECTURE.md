# Arsitektur NEXORA

1. Browser membuka `index.html`.
2. Halaman memuat 31 file CSS lokal dari `assets/styles/` sesuai urutan yang ditulis pada HTML.
3. Halaman menjalankan 17 modul JavaScript dari `assets/scripts/` sesuai urutan sumber.
4. GSAP, ScrollTrigger, Lenis, dan Google Fonts masih dimuat dari CDN.
5. Penyimpanan aplikasi mengikuti kode frontend lokal; belum tersedia API/backend/database online.

## Direktori

- `assets/styles/`: stylesheet aplikasi.
- `assets/scripts/`: modul JavaScript aplikasi.
- `assets/images/`: gambar/logo lokal.
- `data/`: catatan status penyimpanan data.
- `docs/`: dokumentasi proyek.
- `scripts/`: utilitas validasi aset.
- `tests/`: catatan pengujian manual.
