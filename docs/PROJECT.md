# FUXA — Project Documentation

Web-based **SCADA / HMI / Dashboard / IIoT** visualization tool. Runtime + editor all in one Node.js process, frontend in Angular.

- Repo: https://github.com/frangoteam/FUXA
- License: MIT
- Versions (this checkout): server `1.3.3-2843`, client `1.3.3-2843`
- Public docs site (mkdocs material): https://frangoteam.github.io/FUXA/

---

## 1. Apa itu FUXA

FUXA adalah software berbasis web untuk membangun dan menjalankan visualisasi proses industri (SCADA/HMI/Dashboard/IIoT). Editor dan runtime memakai basis kode yang sama — buka di browser, rancang view, langsung jadi aplikasi runtime. Tidak ada biaya lisensi runtime.

## 2. Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Angular 18 SPA)  ───── WebSocket / Socket.IO ─┐
│   - FUXA Editor (desain)                                │
│   - FUXA View   (runtime)                               │
└─────────────────────────────────────────────────────────┘
                            │ HTTP/REST + WS
┌─────────────────────────────────────────────────────────┐
│  Node.js Server  (Express + Socket.IO, TypeScript)      │
│   ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐  │
│   │ Devices Mgr │ │ Project Mgr │ │ Alarms / Scripts │  │
│   └─────────────┘ └─────────────┘ └──────────────────┘  │
│   ┌──────────────────────────────────────────────────┐  │
│   │  Driver Layer (protocols)                        │  │
│   │  Modbus TCP/RTU · S7 · OPC UA · MQTT · BACnet    │  │
│   │  EtherNet/IP · WebAPI · ODBC · SerialPort · ...  │  │
│   └──────────────────────────────────────────────────┘  │
│   Storage: SQLite (`_db`) + filesystem (`_appdata`,     │
│             `_images`, `_logs`)                         │
└─────────────────────────────────────────────────────────┘
```

Tiga view besar:
- **FUXA-Editor** — merancang project (devices, tags, views, scripts, alarms).
- **FUXA-View** — runtime viewer untuk operator.
- **FUXA-Client** — thinner client mode (lihat konfigurasi `ng serve -c client`).

## 3. Struktur Repo

| Path         | Isi                                                                |
| ------------ | ------------------------------------------------------------------ |
| `server/`    | Backend Node.js (Express + Socket.IO + driver protocol). TS source. |
| `client/`    | Frontend Angular 18 (editor + view). Material + SVG.                |
| `app/`       | Build output / shared runtime artefacts (dipakai Docker image).     |
| `node-red/`  | Bundled Node-RED runtime yang di-embed ke FUXA.                    |
| `odbc/`      | Konfigurasi & driver ODBC opsional.                                |
| `docs/`      | Dokumentasi mkdocs (file `.md` sudah ada, lihat bagian 9).         |
| `screenshot/`| Aset screenshot untuk README / docs.                                |
| `Dockerfile` | Build image `frangoteam/fuxa`.                                     |
| `compose.yml`| Contoh `docker compose` untuk deploy lokal.                         |

## 4. Tech Stack

**Server (`server/package.json`)**
- Runtime: Node 18 LTS, TypeScript 5
- HTTP: Express 4, body-parser, morgan, express-rate-limit
- Realtime: Socket.IO 4
- DB: SQLite (`sqlite3`), Postgres (`pg`) untuk history/ODBC
- Drivers: `mqtt`, `serialport`, `modbus` clients (lihat `server/runtime/devices`), `node-s7` (S7), `node-opcua` (OPC UA), BACnet, EtherNet/IP
- Time-series: InfluxDB, QuestDB, TDengine
- Lainnya: `ws`, `axios`, `jsonwebtoken`, `bcryptjs`, `nodemailer`, `node-schedule`, `pdfmake`, `swagger-ui-express`, `winston`

**Client (`client/package.json`)**
- Angular 18 (standalone-friendly), Angular Material 18, CDK
- SVG editor, `leaflet` (maps), `chart.js`, `monaco-editor`, `codemirror`, `qrcode`, `signature_pad`, `html2canvas`
- WebSocket & Socket.IO client untuk runtime
- SCSS, TypeScript 5.4, ESLint

**Bundled:** Node-RED (diprogram sebagai internal flow runtime), optional ODBC bridge.

## 5. Fitur Inti

- **Protokol komunikasi**: Siemens S7 (S7-200/300/400/1200/1500), OPC UA, Modbus RTU/TCP, BACnet IP, MQTT, EtherNet/IP (Allen-Bradley), WebAPI, ODBC, Serial.
- **Editor view drag-and-drop** dengan shape kustom (SVG), kontrol bind ke tag, animasi level/kecepatan/warna.
- **Tag & device manager** — sumber data dipetakan ke properti shape (warna, nilai, visibilitas, posisi).
- **Alarm system** (level, ack, history, notifikasi email).
- **Scheduler** (cron-like, node-schedule).
- **Scripting** (JS, event-driven).
- **Chart / trend** (real-time + history dari Influx/QuestDB/TDengine/Postgres).
- **Reports** PDF (`pdfmake`).
- **Multi-user auth** (JWT, bcrypt).
- **WebSocket publikasi data** untuk integrasi eksternal.
- **Node-RED internal** untuk logika flow & IoT pipeline.
- **Project save/load** ke filesystem; import/export project.
- **Cross-platform**: Linux, Windows, macOS, container (Docker).

## 6. Menjalankan Lokal

### 6.1 Prasyarat
- Node.js 18 LTS (atau yang dicocokkan Dockerfile).
- npm.
- Untuk driver native: `serialport`, `sqlite3`, `pg` butuh build tools (Windows: `windows-build-tools` / VS Build Tools; Linux: `build-essential` python3).
- Opsional: Node-RED deps sudah termasuk; ODBC butuh driver sistem operasi.

### 6.2 Dari source (dev)
```bash
# install semua (root + server + client)
npm install --prefix server
npm install --prefix client

# jalankan server (port 1881 default)
npm start --prefix server

# di terminal lain: jalankan frontend dev server
npm start --prefix client          # mode editor
npm run start:lan --prefix client  # expose ke LAN
npm run demo    --prefix client    # mode demo
npm run client  --prefix client    # mode client only
```

Buka:
- Editor:  http://localhost:4200
- Server API & runtime: http://localhost:1881

### 6.3 Docker (production-like)
```bash
docker compose up -d
```
Mount point dari `compose.yml`:
- `./appdata` → `server/_appdata` (project, settings)
- `./db`      → `server/_db`
- `./logs`    → `server/_logs`
- `./images`  → `server/_images`
- Port `1881` di-publish.

### 6.4 Build artefak
```bash
npm run build --prefix server   # tsc -> server/dist atau output konfigurasi
npm run build --prefix client   # ng build -> client/dist
```

## 7. Konfigurasi & Data

Folder runtime (di-mount di Docker):
- `_appdata/` — project files, settings, users, scripts.
- `_db/`      — SQLite databases (projects, alarms, history).
- `_images/`  — aset gambar yang di-upload ke project.
- `_logs/`    — log file (winston).

Pengaturan utama: lihat `docs/Settings.md`.

## 8. API & Protocol Cepat

- **REST**: Express router di `server/` (lihat `swagger-ui-express`, dokumentasi interaktif di `/api-docs` bila diaktifkan).
- **Realtime**: Socket.IO events untuk device value updates, alarm, script.
- **WebSocket publikasi**: lihat `docs/HowTo-WebSockets.md`.

## 9. Dokumentasi yang Sudah Ada

Daftar halaman di `docs/` (mkdocs material) — sumber lengkap untuk user:

- `index.md` — landing.
- `Getting-Started.md` — mulai pakai.
- `Installing-and-Running.md` — install & run (termasuk Docker).
- `Settings.md` — opsi konfigurasi.
- `HowTo-View.md`, `HowTo-UI-Layout.md`, `HowTo-Widgets.md` — view & layout editor.
- `HowTo-define-Shapes.md`, `HowTo-bind-Shapes.md`, `HowTo-bind-Controls.md`, `HowTo-animate-Pipe.md`, `HowTo-Chart-Control.md` — shape & kontrol.
- `HowTo-Devices-and-Tags.md` — device/tag.
- `HowTo-setup-Alarms.md` — alarm.
- `HowTo-Scheduler.md` — scheduler.
- `HowTo-configure-Script.md` — scripting.
- `HowTo-configure-events.md` — event binding.
- `HowTo-Node-Red.md` — Node-RED internal.
- `HowTo-ODBC.md` — ODBC bridge.
- `HowTo-WebSockets.md` — WS publishing.
- `HowTo-save-load-Project.md` — project lifecycle.
- `HowTo-use-same-view.md` — reuse view.
- `Tips-and-Tricks.md` — tips.
- `ar-mode.md` — mode AR (eksperimen).

Lokal serve docs:
```bash
pip install mkdocs-material
mkdocs serve   # http://localhost:8000
```

## 10. Alur Kerja Singkat (end-to-end)

1. **Tambah Device** → pilih protokol (mis. Modbus TCP), masukkan host/port, scan atau daftarkan tag.
2. **Buat View** → drag shape dari library ke canvas, beri nama, simpan.
3. **Bind** shape ↔ tag: warna, nilai, animasi, event klik.
4. **Konfigurasikan Alarm** untuk tag tertentu.
5. **Tambahkan Script/Scheduler/Node-RED flow** bila perlu logika.
6. **Simpan Project** ke `_appdata`.
7. **Switch ke View mode** → jalankan runtime untuk operator.
8. **Deploy** via Docker dengan folder `_appdata` di-mount (persistent).

## 11. Testing

```bash
npm test --prefix server   # mocha + chai + sinon
```
Lokasi test: `server/test/**` (cek dengan `ls`/`grep` bila perluasan).

## 12. Kontribusi & Komunitas

- `CONTRIBUTING.md` di root.
- `SECURITY.md` untuk pelaporan kerentanan.
- Discord: https://discord.gg/WZhxz9uHh4
- Kontak: info@frangoteam.org

## 13. Catatan untuk Pemula

Mulai dari urutan ini:
1. `docs/Getting-Started.md`
2. `docs/Installing-and-Running.md`
3. `docs/HowTo-Devices-and-Tags.md`
4. `docs/HowTo-View.md` & `docs/HowTo-Widgets.md`
5. `docs/HowTo-bind-Shapes.md`
6. `docs/HowTo-bind-Controls.md`
7. Lanjut ke alarm / script / scheduler sesuai kebutuhan.