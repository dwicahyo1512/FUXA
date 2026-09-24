# Git Workflow — Enterprise SCADA (Fork-based dari FUXA)

Dokumen ini adalah SOP Git untuk pengembangan produk SCADA enterprise berbasis FUXA.
Target: bisa menyerap bug fix upstream (frangoteam/FUXA) tanpa merusak kode custom.

## Struktur Remote

```
origin    = https://github.com/dwicahyo1512/FUXA.git   (repo private kita, push/pull utama)
upstream  = https://github.com/frangoteam/FUXA.git     (FUXA asli, FETCH SAJA, jangan pernah push)
```

Cek kapan saja: `git remote -v`

## Struktur Branch

```
[upstream/master]        FUXA asli (read-only)
       │  fetch + merge --ff-only
[upstream-sync]          Mirror murni FUXA — DILARANG commit custom di sini
       │  merge ke branch sync/* (isolasi konflik)
   [develop]             Integrasi harian — semua feature/* merge ke sini
       │  merge saat rilis
    [main/master]        Production + tag rilis (v1.0.0+fuxa1.3.3)
```

| Branch | Fungsi | Aturan |
|---|---|---|
| `upstream-sync` | Mirror `upstream/master` | Jangan pernah commit custom. Hanya fast-forward. |
| `master` | Production | Hanya menerima merge dari `develop` saat rilis. |
| `develop` | Integrasi harian | Semua fitur bermuara di sini. Harus selalu build-able. |
| `feature/*` | Satu fitur per branch | Dibuat dari `develop`, merge back via PR. |
| `sync/upstream-[tanggal]` | Branch temporer sync | Dihapus setelah merge ke `develop`. |

## Setup Awal (sudah dilakukan, referensi saja)

```bash
git remote remove origin
git remote add origin https://github.com/dwicahyo1512/FUXA.git
git remote add upstream https://github.com/frangoteam/FUXA.git

git branch upstream-sync upstream/master
git push -u origin upstream-sync
git checkout -b develop
git push -u origin develop
```

## Workflow Rutin: Fitur Baru

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nama-fitur
# ...coding, commit...
git add . && git commit -m "feat(scope): deskripsi"
git push -u origin feature/nama-fitur
# Buat PR di GitHub: feature/nama-fitur -> develop
```

## Workflow Sync Upstream (RUTIN: 1-2 bulan sekali, atau saat ada security fix)

```bash
# 1. Update mirror
git checkout upstream-sync
git fetch upstream
git merge --ff-only upstream/master
git push origin upstream-sync

# 2. Branch isolasi sync (JANGAN merge langsung ke develop)
git checkout develop
git pull origin develop
git checkout -b sync/upstream-$(Get-Date -Format yyyyMMdd)   # PowerShell
# (Linux/macOS: sync/upstream-$(date +%Y%m%d))

# 3. Merge & resolve konflik
git merge upstream-sync

# 4. Verifikasi build sebelum lanjut
npm install --prefix client
npm run build --prefix client
npm install --prefix server
npm run build --prefix server
npm test --prefix server

# 5. Push & PR
git add . && git commit -m "chore(sync): merge upstream FUXA $(Get-Date -Format yyyy-MM-dd)"
git push -u origin sync/upstream-20260924
# PR: sync/upstream-... -> develop, review, merge, hapus branch temporer.
```

## Menangani Konflik (kode sudah banyak dimodifikasi)

Konfigurasi sudah aktif:
- `rerere.enabled = true` — resolusi konflik yang sama diingat & diulang otomatis.
- `merge.conflictstyle = zdiff3` — konflik menampilkan versi BASE, lebih mudah dibaca.

Aturan praktis:
1. **`package-lock.json`** → `git checkout --theirs <file>` lalu `npm install` ulang. Jangan resolve manual.
2. **`client/dist/*`** → `git rm -rf client/dist` (build output, sudah di-ignore sekarang).
3. **File custom kita** (branding, enterprise modules) → pertahankan versi kita (`--ours`).
4. **File inti yang diedit dua pihak** (theme.scss, app.module.ts) → resolve manual, baca blok BASE untuk paham maksud upstream.

Pencegahan konflik jangka panjang:
- Kode custom ditaruh di modul/folder terpisah, bukan mengedit file upstream inline.
  - `client/src/app/enterprise/` untuk fitur custom.
  - `client/src/theme-custom.scss` untuk branding, di-import dari `angular.json` styles.
- I18n custom: simpan key di file terpisah, jangan edit `client/src/assets/i18n/en.json` upstream secara besar-besaran.

## Rilis & Tagging

Format: `v[MAJOR].[MINOR].[PATCH]+fuxa.[versi-upstream]`

```bash
git checkout master
git pull origin master
git merge --no-ff develop -m "release: v1.0.0 enterprise"
git tag -a v1.0.0+fuxa1.3.3 -m "Enterprise SCADA v1.0.0 (base FUXA v1.3.3)"
git push origin master
git push origin v1.0.0+fuxa1.3.3
```

## Kapan Fetch Upstream?

| Situasi | Aksi |
|---|---|
| Security advisory FUXA | Segera sync (patch release) |
| Bug fix driver (S7/OPC-UA/Modbus) | Saat sprint maintenance |
| Sedang ada feature besar jalan | Bekukan sync sampai fitur merge |
| Major version FUXA (1.3 → 1.4) | Sprint khusus, evaluasi breaking changes dulu |
