"use client";

import { Card, Badge, Button } from "@/shared/components";
import { APP_CONFIG } from "@/shared/constants/config";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-main flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] text-primary">info</span>
          Tentang Nice Router
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Informasi sistem, asal-usul proyek, dan atribusi sumber terbuka.
        </p>
      </div>

      {/* Main Info Card */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-[var(--shadow-warm)] text-white">
              <span className="material-symbols-outlined text-[32px]">router</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-text-main">{APP_CONFIG.name}</h2>
                <Badge variant="success" className="text-xs">
                  v{APP_CONFIG.version}
                </Badge>
                <Badge variant="primary" className="text-xs">
                  Forked from 9Router
                </Badge>
              </div>
              <p className="text-xs text-text-muted mt-1">
                AI Smart Router, Smart Fallback & Token Saver Gateway
              </p>
            </div>
          </div>
        </div>

        {/* Fork Notice Alert */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5">
            fork_right
          </span>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-text-main">
              Asal-usul Proyek (Fork Notice)
            </p>
            <p className="text-text-muted text-xs leading-relaxed">
              Proyek ini adalah <strong>fork</strong> dari proyek sumber terbuka{" "}
              <a
                href="https://github.com/decolua/9router"
                target="_blank"
                rel="noreferrer"
                className="text-primary font-medium underline underline-offset-2 hover:opacity-80"
              >
                9Router (decolua/9router)
              </a>
              . Seluruh arsitektur perutean inti, sistem kompresi token RTK, dan manajemen multi-akun
              berakar dari pengembangan komunitas 9Router.
            </p>
          </div>
        </div>

        {/* Description Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-main">Apa itu Nice Router?</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            <strong>Nice Router</strong> adalah gateway lokal dan proksi pintar AI yang menghubungkan
            berbagai alat coding AI (seperti Claude Code, Cursor, Cline, Codex, Copilot, dan lainnya)
            ke lebih dari 40 penyedia AI melalui satu endpoint kompatibel OpenAI (<code>/v1</code>).
          </p>
        </div>

        {/* Key Features */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-main">Fitur Utama</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-border-subtle bg-surface-2/40 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-main">
                <span className="material-symbols-outlined text-primary text-[18px]">savings</span>
                RTK Token Saver
              </div>
              <p className="text-[11px] text-text-muted">
                Mengompres output tool yang panjang secara otomatis untuk menghemat 20–40% kuota token.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border-subtle bg-surface-2/40 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-main">
                <span className="material-symbols-outlined text-primary text-[18px]">alt_route</span>
                Smart Auto-Fallback
              </div>
              <p className="text-[11px] text-text-muted">
                Otomatis beralih ke provider cadangan (Langganan → Murah → Gratis) saat kuota habis atau limit.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border-subtle bg-surface-2/40 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-main">
                <span className="material-symbols-outlined text-primary text-[18px]">sync_alt</span>
                Multi-Account Routing
              </div>
              <p className="text-[11px] text-text-muted">
                Dukungan banyak akun per-provider dengan rotasi round-robin atau prioritas bertingkat.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border-subtle bg-surface-2/40 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-main">
                <span className="material-symbols-outlined text-primary text-[18px]">translate</span>
                Format Translation
              </div>
              <p className="text-[11px] text-text-muted">
                Menerjemahkan format request/response secara mulus antara standar OpenAI, Claude, dan provider lainnya.
              </p>
            </div>
          </div>
        </div>

        {/* Upstream & License Links */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
          <span>Lisensi: MIT License • Berdasarkan karya asli tim 9Router</span>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/decolua/9router"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-2 text-text-main transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
              Upstream (9Router)
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
