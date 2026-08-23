# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

Plugin internasionalisasi yang berkelanjutan untuk DeepSeek Harness Web UI. Versi 0.2.0 mendaftarkan **20 locale** dari satu registry sekaligus mempertahankan integrasi client ModuleLoader DSH yang sudah ada, layanan locale, migrasi preferensi, dan perilaku fallback runtime.

## Locale

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย, dan Svenska.

- Locale Tionghoa Tradisional (zh-HK, zh-TW) melakukan fallback ke kamus Tionghoa Sederhana bawaan melalui konverter karakter yang sudah ada.
- Bahasa Arab menetapkan bahasa dan arah dokumen ke `ar` / `rtl`; locale terkelola lainnya menggunakan `ltr`.
- Nilai non-Tionghoa yang belum diterjemahkan melakukan fallback ke bahasa Inggris.

## Fitur

- Menambahkan semua 20 locale ke **Settings → General → Language**, di samping 中文 / English bawaan.
- Terjemahan yang dipoles secara manual untuk setiap bahasa pada setiap namespace locale resmi (masing-masing 715 string), dari baseline bahasa Inggris.
- Fallback runtime: string baru/diperbarui/pihak ketiga melakukan fallback ke bahasa Inggris (atau konversi Sederhana→Tradisional untuk zh-HK/zh-TW), sehingga pembaruan UI upstream dan plugin lain tercakup tanpa harus menerjemahkan ulang setiap bahasa.
- Preferensi bahasa disimpan di `localStorage` peramban; tahan terhadap muat ulang.
- Tanpa intrusi: plugin klien murni, tanpa perubahan paket upstream, degradasi senyap jika layanan locale tidak tersedia.

## Instalasi

Instal ke profil yang benar-benar digunakan host Anda saat boot, dan kunci commit-nya:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

Untuk DSH Desktop, profil aktif adalah nilai `active` di
`%APPDATA%/DSH Desktop/profile-selection/state.json` (biasanya `desktop`). Shim per-profil
`host-commands/<profile>/bin/dsh.cmd` memasukkan nama profilnya sendiri ke dalam perintah, sehingga menjalankan
shim `web` akan menginstal ke profil `web` meskipun Desktop menampilkan `desktop` — instalasi
berhasil tetapi plugin tidak pernah dimuat. Sertakan `--profile` secara eksplisit untuk memastikan.

Jalur instalasi Market DSH Desktop hanya menerima versi npm yang telah dipublikasikan secara persis, sehingga spesifikasi GitHub harus
melalui terminal bawaan `dsh plugin add`, yang meneruskan specifier tersebut ke pnpm tanpa validasi.

Mulai ulang host, lalu pilih bahasa di **Settings → General → Language**. Hapus dengan
`dsh plugin --profile <active-profile> remove dsh-i18n`.

## Pipeline pemeliharaan

Registry locale adalah `scripts/locales.mjs`. Data terjemahan tetap berada di `src/<locale>/`; kode peramban yang dihasilkan adalah `lib/client.js`.

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

Ekstraksi menerima root DSH yang terinstal, direktori paket `@deepseek-ai`-nya, atau path aplikasi desktop yang telah di-unpack.

## Publikasi

Paket npm mencakup entri runtime, klien yang dihasilkan, data locale, dan registry locale. Repositori sumber: https://github.com/mimateinn/dsh-i18n

## Keamanan dan privasi

Plugin ini tidak memiliki dependensi runtime, panggilan jaringan, telemetri, atau akses filesystem. Plugin ini hanya menyimpan id locale yang dipilih di localStorage peramban.

## Lisensi

MIT
