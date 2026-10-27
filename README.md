# Nice Router (v1.0.0) 🚀
### Intelligent AI Gateway, Smart Routing & Token Saver

[![GitHub stars](https://img.shields.io/github/stars/Deni-SLN/Nice-Router.svg?style=social)](https://github.com/Deni-SLN/Nice-Router)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Release](https://img.shields.io/badge/Release-v1.0.0-10b981.svg)](https://github.com/Deni-SLN/Nice-Router/releases)
[![Sponsor](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Ko--fi-ff5e5b.svg?logo=kofi&logoColor=white)](https://ko-fi.com/deni26)

**Nice Router** adalah platform AI Gateway cerdas berperforma tinggi berbasis arsitektur 9Router yang ditingkatkan secara ekstensif. Menghubungkan semua developer tools AI coding Anda (**Claude Code, Cursor, Antigravity, Copilot, Codex, Gemini CLI, OpenCode, Cline, OpenClaw**) ke **330+ AI Providers** dengan kontrol biaya real-time, monitoring kesehatan provider aktual, dan perutean cerdas (*smart routing*).

---

## 🌟 Fitur Unggulan Nice Router v1.0.0

### 1. 🌐 Dukungan 330+ AI Providers (Integrasi OmniRoute)
- Hubungkan dan kelola **330+ provider AI** global dan lokal dalam satu dashboard terpadu:
  - **OpenRouter, Kiro AI, Gemini API, Mistral, Ollama Local/Cloud, Vertex AI, Anthropic, OpenAI, DeepSeek, Groq, NVIDIA NIM, Cloudflare AI, BytePlus, Alibaba Coding**, dan ratusan provider lainnya.
- **Filter "Terhubung / Connected"**: Filter cepat satu klik di samping bilah pencarian penyedia untuk hanya menampilkan provider yang aktif terhubung.

### 2. 🧠 Smart Routing Engine (Backend Intelligence)
Bukan sekadar rotasi tampilan, pemilihan model dilakukan secara deterministik dan cerdas di backend proxy:
- **`lowest-cost`**: Otomatis memilih model gratis (`FREE`) atau model berbiaya terendah yang mampu menangani request.
- **`lowest-latency`**: Memilih provider dengan latensi bergulir (p95 dan average) paling responsif.
- **`health-based`**: Otomatis mengisolasi dan mendepak provider yang sedang mengalami gangguan (`DEGRADED` / `UNAVAILABLE`).
- **`task-based`**: Pemetaan model optimal sesuai kategori tugas:
  - 💻 **Coding**: Claude 3.7 Sonnet, Codex, Qwen Coder, DeepSeek Coder.
  - 🧩 **Reasoning**: o1, o3-mini, DeepSeek R1, Claude Thinking.
  - 💬 **General Chat**: Gemini 2.0 Flash, GPT-4o-mini, Haiku.
  - 👁️ **Vision**, 🎙️ **Audio**, 🤖 **AI Agent**.
- **`capability-based`**: Verifikasi kepatuhan context window, tool calling (function calling), JSON mode, dan streaming.
- **Routing Transparency**: Setiap request dilengkapi header keputusan: `x-nice-router-selected-model`, `x-nice-router-policy`, dan `x-nice-router-selection-reason`.
- **Mode Dry-Run Simulation**: Pratinjau keputusan router sebelum mengaktifkan kebijakan kombo baru.

### 3. 💰 Cost Intelligence & Multi-Currency Converter
- **Klasifikasi Status Harga Eksplisit**:
  - `FREE`: Terkonfirmasi gratis upstream atau free-tier (OpenRouter `:free`, Cline `cline-free/`).
  - `PRICED`: Harga per 1M token (input, output, cached) diketahui dan terhitung presisi.
  - `UNKNOWN_PRICE`: Model dikenali tetapi tarif belum terisi (tidak mengarang `$0.00`).
  - `UNMAPPED_MODEL`: Model kustom tanpa entri katalog.
  - `UNMETERED`: Provider tidak mengembalikan metrik token.
- **Anti Double-Counting**:
  - Token input non-cached dihitung bersih tanpa membebankan cached token berulang.
  - Reasoning token diisolasi dari completion tokens agar tidak ditagih dobel.
- **Konversi Kurs USD ↔ IDR**:
  - Konversi dinamis ke Rupiah (`IDR`) dengan nilai tukar yang dapat diperbarui secara runtime dan disimpan di database SQLite.

### 4. 🛡️ Fallback & Retry Engine + Streaming Safeguards
- **Stateful Circuit Breaker**: Mengisolasi provider bermasalah secara sementara (`CLOSED`, `OPEN`, `HALF_OPEN`) setelah cooldown 30 detik guna mencegah penundaan timeout beruntun.
- **Exponential Backoff dengan Jitter**: Meredam thundering herd dengan jeda acak ±20% dan kepatuhan terhadap header `Retry-After`.
- **Streaming Safeguard**: Jika potongan stream pertama sudah dikirim ke klien, fallback otomatis dilarang agar framing SSE klien tidak rusak atau menghasilkan respons duplikat.

### 5. 🚦 Budget Guard & Kontrol Risiko
- Batas biaya harian dan bulanan (global maupun per-API Key / Aplikasi).
- Ambang peringatan (*warning threshold*) yang dapat dikonfigurasi (default 80%).
- Kebijakan saat limit tercapai:
  - `warning`: Catat notifikasi tanpa memblokir request.
  - `block`: Tolak request dengan HTTP 429 / 402.
  - `downgrade`: Otomatis alihkan request ke model gratis (`FREE`) yang disetujui.

### 6. 🔄 Auto-Sync Model Gratis & Kategori Kombo
- Fitur sinkronisasi otomatis model gratis setiap hari agar kombo gratis selalu tersedia dan aktif.
- Filter kategori model: **Coding, Chat, Suara, Gambar, AI Agent, All Model (Gratis)**.

### 7. 📊 Observability & Alert Center
- **Request Inspector**: Pelacakan komprehensif ID request, model yang diminta vs model aktual, status pricing, latensi, dan token.
- **Alert Center Terdeduplikasi**: Jendela 5 menit untuk mencegah banjir notifikasi saat terjadi downtime atau burst HTTP 429.
- **App & Client Analytics**: Metrik penggunaan dan biaya dikelompokkan berdasarkan identitas API Key aktual.
- **AI Router Advisor**: Saran optimasi biaya dan performa secara *read-only* berdasarkan riwayat traffic aktual.

### 8. 🔌 Server MCP Terbawa (Model Context Protocol)
- Integrasi asli protokol MCP JSON-RPC 2.0 tanpa dependensi eksternal berat.
- Menyediakan 8 tools *read-only* aman untuk asisten AI (Claude Desktop, Cursor, Antigravity, Roo Code):
  - `get_router_status`, `get_provider_health`, `get_usage_summary`, `get_cost_summary`
  - `get_budget_status`, `list_available_models`, `simulate_routing`, `get_recent_alerts`
- Dukungan transport **stdio** (`scripts/mcp-server.mjs`) dan transport **HTTP** (`/api/mcp/router`).
- Panduan koneksi lengkap tersedia di [Panduan Integrasi MCP](docs/MCP_INTEGRATION.md).

### 9. 🪝 Outbound Webhook Engine & Keamanan Anti-SSRF
- Sistem webhook berbasis event real-time untuk integrasi otomasi (Discord, Slack, n8n, Zapier, server internal).
- 9 tipe event: `request.completed`, `request.failed`, `provider.unhealthy`, `provider.recovered`, `budget.warning`, `budget.exceeded`, `pricing.stale`, `fallback.triggered`, `circuit_breaker.opened`.
- Tanda tangan **HMAC-SHA256** (`x-nice-signature`) dengan verifikasi timestamp untuk mencegah serangan replay.
- Proteksi **Anti-SSRF** tingkat enterprise: memblokir akses ke loopback (localhost), IP privat (RFC 1918), link-local, dan endpoint metadata cloud (AWS/GCP/Azure).
- Riwayat pengiriman (*delivery logs*) dan pengujian ping langsung dari antarmuka Dashboard Webhooks.
- Panduan integrasi dan verifikasi payload tersedia di [Panduan Integrasi Webhook](docs/WEBHOOK_INTEGRATION.md).

### 10. 🔒 Release Gate & Autentikasi Terproteksi
- **Password Awal Default**: `123456` disediakan untuk inisialisasi awal.
- **Gerbang Wajib Ganti Password (Release Gate)**: Sesi terbatas (`setupOnly`) memblokir akses dashboard dan API hingga admin mengganti password awal dengan password baru yang kuat (minimal 8 karakter, bukan `123456`, di-hash dengan `bcrypt`).
- **Pembersihan Rahasia (*Secret Redaction*)**: API key, token sesi, dan header otorisasi otomatis disamarkan dari log dan status kesehatan.

---

## ⚡ Panduan Instalasi & Menjalankan

### Persyaratan Sistem
- **Node.js**: v18.0.0 atau lebih baru (Direkomendasikan v20+ / v22+ / v26)
- **Sistem Operasi**: Windows, macOS, atau Linux

### 1. Clone Repository
```bash
git clone https://github.com/Deni-SLN/Nice-Router.git
cd Nice-Router
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Jalankan Server Pengembangan
```bash
npm run dev
```

Dashboard Nice Router akan otomatis terbuka di browser pada:
👉 **`http://localhost:20127`**

---

## 🔌 Cara Menghubungkan ke AI Tools

Arahkan endpoint AI coding tools favorit Anda ke Nice Router:

| Parameter | Nilai Konfigurasi |
| :--- | :--- |
| **Base URL / Endpoint** | `http://localhost:20127/v1` |
| **API Key** | Dapatkan dari menu *Titik Akhir & Kunci* di dashboard |
| **Model** | Nama model langsung (misal `kr/claude-sonnet-4.5`, `openrouter/google/gemini-2.0-flash-exp:free`) atau nama **Kombo** yang Anda buat |

### Contoh Penggunaan pada Claude Code:
```bash
export ANTHROPIC_BASE_URL="http://localhost:20127/v1"
export ANTHROPIC_API_KEY="your-nice-router-key"
claude
```

### Contoh Penggunaan pada Cursor / VS Code:
- Masuk ke **Settings → OpenAI API Key / Base URL**
- Masukkan Base URL: `http://localhost:20127/v1`
- Masukkan API Key dari Nice Router.

---

## 🧪 Menjalankan Pengujian (Testing)

Nice Router dilengkapi dengan test suite komprehensif berbasis **Vitest**:

```bash
# Menjalankan seluruh pengujian inteligensi baru
npm --prefix tests test -- cost-intelligence.test.js provider-health-monitor.test.js smart-routing.test.js fallback-budget.test.js advisor-alerts.test.js intelligence-routes.test.js phase-f-verification.test.js release-gate-security.test.js mcp-and-webhooks.test.js

# Menjalankan semua test
npm --prefix tests test
```

---

## ☕ Dukung Pengembangan

Jika Nice Router membantu menghemat biaya token dan meningkatkan produktivitas ngoding Anda, dukung pengembangannya melalui:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Ko--fi-ff5e5b?style=for-the-badge&logo=kofi&logoColor=white)](https://ko-fi.com/deni26)

---

## 📄 Lisensi
Didistribusikan di bawah lisensi MIT. Lihat file [LICENSE](LICENSE) untuk informasi lebih lanjut.
