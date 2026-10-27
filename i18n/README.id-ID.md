# Nice Router (v1.0.0) 🚀
### Gateway AI Pintar, Perutean Cerdas & Penghemat Token

[![GitHub stars](https://img.shields.io/github/stars/Deni-SLN/Nice-Router.svg?style=social)](https://github.com/Deni-SLN/Nice-Router)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](../LICENSE)
[![Release](https://img.shields.io/badge/Release-v1.0.0-10b981.svg)](https://github.com/Deni-SLN/Nice-Router/releases)
[![Sponsor](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Ko--fi-ff5e5b.svg?logo=kofi&logoColor=white)](https://ko-fi.com/deni26)

**Nice Router** adalah platform AI Gateway cerdas berperforma tinggi berbasis arsitektur 9Router yang telah ditingkatkan secara menyeluruh. Menghubungkan semua developer tools AI coding Anda (**Claude Code, Cursor, Antigravity, Copilot, Codex, Gemini CLI, OpenCode, Cline, OpenClaw**) ke **330+ AI Providers** dengan kontrol biaya real-time, monitoring kesehatan provider aktual, dan perutean cerdas (*smart routing*).

---

## 🌟 Fitur Utama Nice Router v1.0.0

### 1. 🌐 Dukungan 330+ Penyedia AI (Integrasi OmniRoute)
- Hubungkan dan kelola **330+ provider AI** global dan lokal dalam satu dashboard terpadu:
  - **OpenRouter, Kiro AI, Gemini API, Mistral, Ollama Local/Cloud, Vertex AI, Anthropic, OpenAI, DeepSeek, Groq, NVIDIA NIM, Cloudflare AI, BytePlus, Alibaba Coding**, dan ratusan penyedia lainnya.
- **Filter "Terhubung"**: Tombol filter cepat di samping bilah pencarian penyedia untuk hanya menampilkan provider yang sudah aktif terhubung.

### 2. 🧠 Smart Routing Engine (Kecerdasan Backend)
Bukan sekadar pergantian tampilan, pemilihan model dilakukan secara deterministik dan cerdas di backend proxy:
- **`lowest-cost`**: Otomatis memilih model gratis (`FREE`) atau model berbiaya terendah yang mampu menangani request.
- **`lowest-latency`**: Memilih provider dengan latensi bergulir (p95 dan rata-rata) paling responsif.
- **`health-based`**: Otomatis mengisolasi dan mendepak provider yang sedang mengalami gangguan (`DEGRADED` / `UNAVAILABLE`).
- **`task-based`**: Pemetaan model optimal sesuai kategori tugas:
  - 💻 **Coding**: Claude 3.7 Sonnet, Codex, Qwen Coder, DeepSeek Coder.
  - 🧩 **Reasoning**: o1, o3-mini, DeepSeek R1, Claude Thinking.
  - 💬 **General Chat**: Gemini 2.0 Flash, GPT-4o-mini, Haiku.
  - 👁️ **Vision**, 🎙️ **Audio**, 🤖 **AI Agent**.
- **`capability-based`**: Verifikasi kepatuhan context window, tool calling (function calling), JSON mode, dan streaming.
- **Transparansi Perutean**: Setiap request dilengkapi header keputusan: `x-nice-router-selected-model`, `x-nice-router-policy`, dan `x-nice-router-selection-reason`.
- **Mode Simulasi Dry-Run**: Pratinjau keputusan router sebelum mengaktifkan kebijakan kombo baru.

### 3. 💰 Cost Intelligence & Konversi Rupiah (IDR)
- **Status Tarif Transparan**:
  - `FREE`: Terkonfirmasi gratis upstream atau free-tier (OpenRouter `:free`, Cline `cline-free/`).
  - `PRICED`: Harga per 1M token (input, output, cached) diketahui dan terhitung presisi.
  - `UNKNOWN_PRICE`: Model dikenali tetapi tarif belum terisi (tidak mengarang `$0.00`).
  - `UNMAPPED_MODEL`: Model kustom tanpa entri katalog.
  - `UNMETERED`: Provider tidak mengembalikan metrik token.
- **Pencegahan Double-Counting**:
  - Token input non-cached dihitung bersih tanpa membebankan cached token berulang.
  - Reasoning token diisolasi dari completion tokens agar tidak ditagih dobel.
- **Konversi Kurs USD ↔ IDR**:
  - Konversi dinamis ke Rupiah (`IDR`) dengan nilai tukar yang dapat diperbarui secara langsung dan disimpan di database SQLite.

### 4. 🛡️ Fallback & Retry Engine + Streaming Safeguards
- **Stateful Circuit Breaker**: Mengisolasi provider bermasalah secara sementara (`CLOSED`, `OPEN`, `HALF_OPEN`) setelah cooldown 30 detik guna mencegah penundaan timeout beruntun.
- **Exponential Backoff dengan Jitter**: Meredam thundering herd dengan jeda acak ±20% dan kepatuhan terhadap header `Retry-After`.
- **Streaming Safeguard**: Jika potongan stream pertama sudah dikirim ke klien, fallback otomatis dilarang agar framing SSE klien tidak rusak atau menghasilkan respons ganda.

### 5. 🚦 Budget Guard & Kontrol Risiko
- Batas biaya harian dan bulanan (global maupun per-API Key / Aplikasi).
- Ambang peringatan (*warning threshold*) yang dapat dikonfigurasi (default 80%).
- Kebijakan saat batas tercapai:
  - `warning`: Catat notifikasi tanpa memblokir request.
  - `block`: Tolak request dengan HTTP 429 / 402.
  - `downgrade`: Otomatis alihkan request ke model gratis (`FREE`) yang disetujui.

### 6. 🔄 Auto-Sync Model Gratis & Kategori Kombo
- Fitur sinkronisasi otomatis model gratis setiap hari agar kombo gratis selalu tersedia dan aktif.
- Filter kategori model: **Coding, Chat, Suara, Gambar, AI Agent, All Model (Gratis)**.

### 7. 📊 Observability & Alert Center
- **Request Inspector**: Pelacakan komprehensif ID request, model yang diminta vs model aktual, status pricing, latensi, dan token.
- **Alert Center Terdeduplikasi**: Jendela 5 menit untuk mencegah banjir notifikasi saat terjadi gangguan koneksi atau lonjakan HTTP 429.
- **App & Client Analytics**: Metrik penggunaan dan biaya dikelompokkan berdasarkan identitas API Key aktual.
- **AI Router Advisor**: Saran optimasi biaya dan performa secara *read-only* berdasarkan riwayat traffic riil.

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

## 🔌 Cara Menghubungkan ke Tool AI Coding

Arahkan endpoint AI coding tools favorit Anda ke Nice Router:

| Parameter | Nilai Konfigurasi |
| :--- | :--- |
| **Base URL / Endpoint** | `http://localhost:20127/v1` |
| **API Key** | Dapatkan dari menu *Titik Akhir & Kunci* di dashboard |
| **Model** | Nama model langsung (misal `kr/claude-sonnet-4.5`, `openrouter/google/gemini-2.0-flash-exp:free`) atau nama **Kombo** yang Anda buat |

---

## ☕ Dukung Pengembang

Jika Nice Router membantu menghemat biaya token dan memperlancar alur kerja ngoding Anda, dukung pengembangannya melalui:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Ko--fi-ff5e5b?style=for-the-badge&logo=kofi&logoColor=white)](https://ko-fi.com/deni26)

---

## 📄 Lisensi
Didistribusikan di bawah lisensi MIT. Lihat file [LICENSE](../LICENSE) untuk informasi lebih lanjut.
