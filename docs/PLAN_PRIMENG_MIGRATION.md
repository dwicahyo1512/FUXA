# Planning Upgrade UI: Angular Material → PrimeNG + @primeuix/themes

Dokumen perencanaan teknis migrasi komponen UI client FUXA dari `@angular/material` ke `primeng` + `@primeuix/themes` (preset **Lara / Nora**).

- **Scope**: Full migration (semua modul UI diganti).
- **Strategi**: Strangler Fig — migrasi bertahap per-modul/halaman, Material tetap jalan berdampingan sementara sampai cut-over penuh.
- **Prioritas Pertama**: Layout shell (`header`, `sidenav`, `toolbar`, `tabs`).

---

## 1. Status Saat Ini vs Target

| Aspek | Saat Ini (Material) | Target (PrimeNG + @primeuix/themes) |
|---|---|---|
| **Framework UI** | `@angular/material` 18.2.14 + `@angular/cdk` | `primeng` 18+ + `@primeuix/themes` |
| **Theming** | SCSS mixins custom (`src/theme.scss`, `material-overrides.scss`) | Token-based theming via `@primeuix/themes` (preset **Lara** / **Nora**) |
| **Icons** | Material Icons font (`<mat-icon>`) | PrimeIcons (`primeicons`) + tetap support Material Icons saat transisi |
| **Dark Mode** | `.dark-theme` class manual di `<body>` | Built-in PrimeNG theme toggler via CSS selector / class |
| **Layout Shell** | `MatToolbar`, `MatSidenav`, `MatMenu`, `MatTabs` | `p-toolbar` / custom header, `p-sidebar` / `p-panelmenu`, `p-menu`, `p-tabview` |
| **Dialog / Modal** | `MatDialog` + `MatDialogRef` imperatif | `p-dialog` / `DynamicDialog` (`DialogService`) |
| **Tabel Data** | `MatTable` + `MatPaginator` + `MatSort` + CDK | `p-table` (filter, sort, paginator, virtual scroll built-in) |
| **Form Controls** | `MatInput`, `MatSelect`, `MatCheckbox`, `MatRadio` | `p-inputtext`, `p-dropdown`/`p-select`, `p-checkbox`, `p-radiobutton` |
| **Notification** | `MatSnackBar` + `ngx-toastr` | `p-toast` (`MessageService`) |

---

## 2. Peta Komponen (Mapping Table)

Berikut acuan penggantian komponen di seluruh codebase:

| Komponen Material Lama | Komponen PrimeNG Baru | Modul PrimeNG | Catatan Perubahan API |
|---|---|---|---|
| `MatButton` | `pButton` / `<p-button>` | `ButtonModule` | `mat-raised-button` → `severity="primary"`, icon via `icon="pi pi-..."` |
| `MatIconButton` | `<p-button [rounded]="true" [text]="true">` | `ButtonModule` | Styling tombol bulat transparan |
| `MatIcon` | `<i class="pi pi-...">` / custom svg | `PrimeIcons` | Nama icon berbeda (`save` → `pi-save`, `settings` → `pi-cog`) |
| `MatMenu` + `matMenuTriggerFor` | `<p-menu [popup]="true">` / `p-tieredMenu` | `MenuModule` | Format data pakai model `MenuItem[]` |
| `MatToolbar` | `<p-toolbar>` | `ToolbarModule` | Struktur slot `#start`, `#center`, `#end` |
| `MatSidenav` | `<p-sidebar>` / `<p-drawer>` | `SidebarModule` / `DrawerModule` | Drawer model di PrimeNG 18 |
| `MatList` | `<p-listbox>` / `p-panelmenu` | `PanelMenuModule` / `MenuModule` | Untuk navigasi hierarkis sidenav |
| `MatTabs` | `<p-tabview>` / `<p-tabs>` | `TabViewModule` / `TabsModule` | Tab header & panel deklaratif |
| `MatDialog` | `DialogService` (`DynamicDialog`) / `<p-dialog>` | `DynamicDialogModule` / `DialogModule` | Perlu wrapper adapter untuk kompatibilitas `afterClosed()` |
| `MatTable` | `<p-table>` | `TableModule` | Template `#header`, `#body`, paginator langsung di atribut `[paginator]="true"` |
| `MatInput` / `MatFormField` | `<input pInputText>` + `<p-floatlabel>` | `InputTextModule`, `FloatLabelModule` | Floating label memakai wrapper terpisah |
| `MatSelect` | `<p-select>` (atau `p-dropdown`) | `SelectModule` / `DropdownModule` | Format data `options: [{label, value}]` |
| `MatAutocomplete` | `<p-autocomplete>` | `AutoCompleteModule` | Event `(completeMethod)` menggantikan RxJS pipe filter |
| `MatCheckbox` | `<p-checkbox [binary]="true">` | `CheckboxModule` | Binary flag untuk boolean biasa |
| `MatRadio` | `<p-radiobutton>` | `RadioButtonModule` | Value model binding langsung |
| `MatSlideToggle` | `<p-inputswitch>` / `<p-toggleswitch>` | `ToggleSwitchModule` | Komponen boolean toggle |
| `MatSlider` | `<p-slider>` | `SliderModule` | Range & step property |
| `MatProgressBar` / `Spinner` | `<p-progressbar>`, `<p-progressspinner>` | `ProgressBarModule`, `ProgressSpinnerModule` | Mirip secara fungsi |
| `MatSnackBar` | `MessageService` + `<p-toast>` | `ToastModule` | Bisa menggantikan `MatSnackBar` sekaligus `ngx-toastr` |
| `MatTooltip` | `[pTooltip]="..."` | `TooltipModule` | Directive drop-in |

---

## 3. Tahapan Eksekusi (Roadmap)

### Fase 0 — Fondasi & Setup Dual-Stack (1-2 hari)
Tujuan: Menginstal PrimeNG + preset Lara/Nora tanpa merusak Material yang sedang berjalan.

1. **Install dependencies** di `client/`:
   ```bash
   npm install primeng@^18 primeicons @primeuix/themes
   ```
2. **Setup Theme Provider**:
   - Konfigurasi `providePrimeNG` di `src/main.ts` / `src/app/app.module.ts`:
     ```ts
     import { providePrimeNG } from 'primeng/config';
     import Lara from '@primeuix/themes/lara';

     providers: [
       providePrimeNG({
         theme: {
           preset: Lara,
           options: {
             darkModeSelector: '.dark-theme'
           }
         }
       })
     ]
     ```
3. **Tambahkan primeicons** ke `angular.json`:
   ```json
   "styles": [
     "node_modules/primeicons/primeicons.css",
     ...
   ]
   ```
4. **Buat `primeng-shared.module.ts`**:
   - Barrel export modul-modul PrimeNG yang sering dipakai agar import tidak tercecer.
5. **Verifikasi Build**: Pastikan `npm run build --prefix client` lolos tanpa konflik CSS reset.

---

### Fase 1 — Layout Shell (Prioritas Utama) (2-3 hari)
Tujuan: Mengganti skeleton luar aplikasi sehingga look-and-feel utama sudah bertema Lara/Nora.

1. **Header Component (`src/app/header/`)**:
   - Ganti `mat-menu` + tombol header dengan `p-menu` (popup) dan `p-button`.
   - Konversi menu item model ke `MenuItem[]`.
   - Update help menu, theme toggle, project save/open trigger.
2. **Sidenav Component (`src/app/sidenav/`)**:
   - Ganti `mat-list` / sub-menu rekursif dengan `p-panelmenu` atau custom nav berbasis `p-button`.
   - Pertahankan dukungan 4 layout type FUXA (`icon`, `text`, `block`, `inline`).
3. **App Shell (`src/app/app.component.html`)**:
   - Migrasikan `mat-sidenav-container` ke layout flex / grid native atau `p-drawer`.
   - Tambahkan `<p-toast position="top-right"></p-toast>` global.
4. **Tabs (`src/app/editor/`, setting views)**:
   - Ganti `mat-tab-group` / `mat-tab` dengan `p-tabview` / `p-tabs`.
5. **Uji Fungsional**: Buka/tutup project, ganti theme (dark/light), buka panel editor.

---

### Fase 2 — Dialog & Notifikasi (2-3 hari)
Tujuan: Menyediakan compatibility layer untuk ratusan dialog settings yang ada di FUXA.

1. **Buat Adapter `DialogService`**:
   - Banyak komponen memanggil `this.dialog.open(SomeComponent, { data })` bertipe `MatDialog`.
   - Buat wrapper / adapter service `FuxaDialogService` yang membungkus PrimeNG `DialogService` agar method `open()` dan observable `afterClosed()` tetap kompatibel, meminimalisir refactor di 30+ dialog.
2. **Migrasi Global Notification**:
   - Ganti injeksi `MatSnackBar` ke `MessageService` PrimeNG.
   - Evaluasi apakah `ngx-toastr` bisa di-retire bertahap.
3. **Migrasikan 5 Dialog Kunci**:
   - `Project Open/Save Dialog`
   - `Device Property Dialog`
   - `Tag Property Dialog`
   - `Alarm Property Dialog`
   - `Settings Dialog`

---

### Fase 3 — Forms & Editor Controls (3-4 hari)
Tujuan: Mengganti input controls di panel kanan editor dan form konfigurasi.

1. **Form Controls Utama**:
   - Ganti `mat-form-field` + `matInput` → `<input pInputText>` / `<p-floatlabel>`.
   - Ganti `mat-select` → `<p-select>` / `<p-dropdown>`.
   - Ganti `mat-checkbox` & `mat-slide-toggle` → `<p-checkbox>`, `<p-toggleswitch>`.
2. **Custom Select-Search**:
   - Refactor `src/app/gui-helpers/mat-select-search/` menjadi native `p-select [filter]="true"`. Ini akan mengeliminasi banyak code custom!
3. **Autocomplete**:
   - Migrasi binding tag/address autocomplete ke `<p-autocomplete>`.

---

### Fase 4 — Data Tables & Lists (3-4 hari)
Tujuan: Halaman list berat (Tags, Devices, Alarms, Logs, API Keys).

1. **Komponen Target**:
   - `src/app/device/` (Device & Tags table)
   - `src/app/alarms/` (Alarm list & history)
   - `src/app/logs-view/` (Logs table)
   - `src/app/apikeys/` (API Keys list)
   - `src/app/users/` (Users list)
2. **Penggantian**:
   - Ganti `mat-table` + `cdk-table` + `mat-paginator` + `mat-sort` dengan `<p-table [paginator]="true" [rows]="10" [sortField]="...">`.
   - Hapus `CustomMatPaginatorIntl` (`src/app/paginator/paginator-intl.ts`) dan ganti dengan i18n config bawaan PrimeNG.

---

### Fase 5 — Cleanup, Retire Material, & Polish (2 hari)
Tujuan: Membuang total `@angular/material` dan merapikan bundle.

1. **Hapus `MaterialModule`** (`src/app/material.module.ts`).
2. **Hapus stylesheet lama**:
   - `src/material-overrides.scss`
   - Bagian `@use '@angular/material'` di `src/theme.scss`.
3. **Uninstall packages**:
   ```bash
   npm uninstall @angular/material @angular/cdk @angular/material-moment-adapter
   ```
4. **Verifikasi bundle size** dan pastikan build production lolos (`npm run build`).

---

## 4. Analisis Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| **Canvas Editor Break** | High | Editor FUXA banyak memakai manipulasi SVG/DOM langsung dan dragging (`angular2-draggable`, `panzoom`). Jangan sentuh modul `src/app/gauges/` dan core canvas saat Fase 1; migrasi fokus ke chrome/wrapper-nya saja. |
| **Banyak Dialog Terdampak** | High | Buat `DialogAdapter` di Fase 2 yang mempertahankan signature `afterClosed(): Observable<any>` agar 30+ komponen dialog tidak perlu di-rewrite sekaligus. |
| **CSS Leakage / Selector Clash** | Med | `@primeuix/themes` pakai CSS custom properties scoped. Pastikan `material-overrides.scss` tidak menyentuh class global `p-*`. |
| **i18n Translation Binding** | Low | FUXA pakai `@ngx-translate`. PrimeNG komponen mendukung pipe translate di properti label/placeholder (`[placeholder]="'key' | translate"`). |
| **Dark Theme Desync** | Med | Sinkronkan class `.dark-theme` yang di-toggle FUXA dengan `darkModeSelector: '.dark-theme'` pada opsi `providePrimeNG`. |

---

## 5. Estimasi Effort

- **Total waktu pengerjaan**: ~11 - 15 hari kerja (1 developer).
- **Fase 1 (Layout Shell)**: 2-3 hari (bisa langsung dimulai).
- **Hasil akhir**: UI lebih modern, performa form/tabel lebih kencang, codebase berkurang ratusan baris CSS override Material.

---

## 6. Langkah Pertama yang Siap Dijalankan

Jika Anda siap memulai, langkah pertama yang akan dieksekusi adalah:
1. `npm install primeng primeicons @primeuix/themes` di direktori `client`.
2. Setup theme **Lara** di `client/src/app/app.module.ts` / bootstrap.
3. Migrasi `HeaderComponent` (`src/app/header/`) sebagai bukti konsep awal.