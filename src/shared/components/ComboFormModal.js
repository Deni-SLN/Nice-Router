"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import ModelSelectModal from "./ModelSelectModal";
import CapacityBadges from "./CapacityBadges";
import { useModelCaps } from "@/shared/hooks/useModelCaps";
import { MODEL_CATEGORIES } from "@/shared/constants/modelCategories";

const VALID_NAME_REGEX = /^[a-zA-Z0-9_.\-]+$/;

const QUICK_CATEGORY_PRESETS = [
  { id: "free", label: "Semua Model Gratis", emoji: "🆓", category: "free", freeOnly: true, defaultName: "free-models", desc: "Seluruh model gratis dari semua provider aktif" },
  { id: "hermes-free", label: "Hermes Agent (Gratis)", emoji: "⚡", category: "hermes", freeOnly: true, defaultName: "hermes-free", desc: "Model gratis yang kompatibel & optimal untuk Hermes Agent" },
  { id: "hermes-all", label: "Semua Model Hermes Agent", emoji: "⚡", category: "hermes", freeOnly: false, defaultName: "hermes-combo", desc: "Semua model dengan tool calling & konteks optimal untuk Hermes Agent" },
  { id: "coding-free", label: "Model Coding (Gratis)", emoji: "💻", category: "coding", freeOnly: true, defaultName: "coding-free", desc: "Model pemrograman & developer yang 100% gratis" },
  { id: "coding-all", label: "Semua Model Coding", emoji: "💻", category: "coding", freeOnly: false, defaultName: "coding-combo", desc: "Semua model spesialis koding & rekayasa perangkat lunak" },
  { id: "agent-free", label: "AI Agent & Reasoning (Gratis)", emoji: "🤖", category: "agent", freeOnly: true, defaultName: "agent-free", desc: "Model agent & reasoning yang gratis tanpa biaya token" },
  { id: "agent-all", label: "Semua AI Agent & Reasoning", emoji: "🤖", category: "agent", freeOnly: false, defaultName: "agent-combo", desc: "Model reasoning mendalam & kemampuan tool calling" },
  { id: "chat-free", label: "Chat & Percakapan (Gratis)", emoji: "💬", category: "chat", freeOnly: true, defaultName: "chat-free", desc: "Model percakapan umum & penulisan teks gratis" },
  { id: "chat-all", label: "Semua Model Chat", emoji: "💬", category: "chat", freeOnly: false, defaultName: "chat-combo", desc: "Seluruh model percakapan & general LLM" },
  { id: "image", label: "Gambar & Vision", emoji: "🎨", category: "image", freeOnly: false, defaultName: "vision-combo", desc: "Model analisis visual & pembuatan gambar" },
  { id: "voice", label: "Suara & Audio", emoji: "🎙️", category: "voice", freeOnly: false, defaultName: "voice-combo", desc: "Model TTS, transkripsi audio, dan suara" },
];

// Inline editable model item
function ModelItem({ index, model, isFirst, isLast, onEdit, onMoveUp, onMoveDown, onRemove, caps }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(model);
  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== model) onEdit(trimmed);
    else setDraft(model);
    setEditing(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") { setDraft(model); setEditing(false); }
  };
  return (
    <div className="group flex min-w-0 items-center gap-1.5 rounded-md bg-black/[0.02] px-2 py-1 transition-colors hover:bg-black/[0.04] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
      <span className="text-[10px] font-medium text-text-muted w-3 text-center shrink-0">{index + 1}</span>
      {editing ? (
        <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 rounded border border-primary/40 bg-white px-1.5 py-0.5 font-mono text-xs text-text-main outline-none dark:bg-black/20" />
      ) : (
        <div className="min-w-0 flex-1 cursor-text truncate rounded px-1.5 py-0.5 font-mono text-xs text-text-main hover:bg-black/5 dark:hover:bg-white/5"
          onClick={() => setEditing(true)} title="Click to edit">{model}</div>
      )}
      <div className="flex shrink-0 items-center gap-0.5">
        <button onClick={onMoveUp} disabled={isFirst}
          className={`p-0.5 rounded ${isFirst ? "text-text-muted/20 cursor-not-allowed" : "text-text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"}`} title="Move up">
          <span className="material-symbols-outlined text-[12px]">arrow_upward</span>
        </button>
        <button onClick={onMoveDown} disabled={isLast}
          className={`p-0.5 rounded ${isLast ? "text-text-muted/20 cursor-not-allowed" : "text-text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"}`} title="Move down">
          <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
        </button>
      </div>
      <button onClick={onRemove} className="p-0.5 hover:bg-red-500/10 rounded text-text-muted hover:text-red-500 transition-all" title="Remove">
        <span className="material-symbols-outlined text-[12px]">close</span>
      </button>
    </div>
  );
}

// Reusable Combo create/edit modal. forcePrefix auto-prepends to name.
export default function ComboFormModal({ isOpen, combo, onClose, onSave, activeProviders, kindFilter = null, forcePrefix = "", title }) {
  const { getCaps } = useModelCaps();
  // Strip prefix when editing existing combo so user only edits suffix
  const initialName = combo?.name
    ? (forcePrefix && combo.name.startsWith(forcePrefix) ? combo.name.slice(forcePrefix.length) : combo.name)
    : "";
  const [name, setName] = useState(initialName);
  const [models, setModels] = useState(combo?.models || []);
  const [autoSyncFree, setAutoSyncFree] = useState(combo?.autoSyncFree || false);
  const [autoSyncCategory, setAutoSyncCategory] = useState(combo?.autoSyncCategory || (combo?.autoSyncFree ? "free" : ""));
  const [loadingPreset, setLoadingPreset] = useState(null);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [modelAliases, setModelAliases] = useState({});
  const presetMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (presetMenuRef.current && !presetMenuRef.current.contains(e.target)) {
        setShowPresetMenu(false);
      }
    };
    if (showPresetMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPresetMenu]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/models/alias").then((r) => r.ok ? r.json() : null).then((d) => d && setModelAliases(d.aliases || {})).catch(() => {});
  }, [isOpen]);

  const validateName = (value) => {
    if (!value.trim()) { setNameError("Name is required"); return false; }
    const full = forcePrefix + value;
    if (!VALID_NAME_REGEX.test(full)) { setNameError("Only letters, numbers, -, _ and . allowed"); return false; }
    setNameError("");
    return true;
  };

  const handleNameChange = (e) => {
    let value = e.target.value;
    // If user types prefix manually, strip it (we always prepend)
    if (forcePrefix && value.startsWith(forcePrefix)) value = value.slice(forcePrefix.length);
    setName(value);
    if (value) validateName(value); else setNameError("");
  };

  const handleAddModel = (model) => {
    if (!models.includes(model.value)) setModels([...models, model.value]);
  };
  const handleDeselectModel = (model) => {
    setModels(models.filter((m) => m !== model.value));
  };
  const handleRemoveModel = (i) => setModels(models.filter((_, idx) => idx !== i));
  const handleMoveUp = (i) => {
    if (i === 0) return;
    const a = [...models]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; setModels(a);
  };
  const handleMoveDown = (i) => {
    if (i === models.length - 1) return;
    const a = [...models]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; setModels(a);
  };

  const handleSelectPreset = async (preset) => {
    setLoadingPreset(preset.id);
    setShowPresetMenu(false);
    try {
      const url = `/api/combos/sync-free?category=${preset.category}&freeOnly=${preset.freeOnly ? "true" : "false"}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const incoming = Array.isArray(data.models) ? data.models : (Array.isArray(data.freeModels) ? data.freeModels : []);
        if (incoming.length > 0) {
          const existing = new Set(models);
          const next = [...models];
          for (const m of incoming) {
            if (!existing.has(m)) {
              next.push(m);
              existing.add(m);
            }
          }
          setModels(next);
          setAutoSyncCategory(preset.category);
          setAutoSyncFree(Boolean(preset.freeOnly));
          if (!name) setName(preset.defaultName);
        }
      }
    } catch (err) {
      console.error(`Failed to load preset ${preset.id}:`, err);
    } finally {
      setLoadingPreset(null);
    }
  };

  const handleSave = async () => {
    if (!validateName(name)) return;
    setSaving(true);
    await onSave({
      name: forcePrefix + name.trim(),
      models,
      autoSyncFree,
      autoSyncCategory: autoSyncCategory || (autoSyncFree ? "free" : null),
    });
    setSaving(false);
  };

  const isEdit = !!combo;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" title={title || (isEdit ? "Edit Combo" : "Create Combo")}>
        <div className="flex flex-col gap-3">
          <div>
            {forcePrefix ? (
              <>
                <label className="text-sm font-medium mb-1 block">Combo Name</label>
                <div className="flex items-stretch">
                  <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.04] text-text-muted font-mono text-sm">{forcePrefix}</span>
                  <input value={name} onChange={handleNameChange} placeholder="my-combo"
                    className="flex-1 min-w-0 rounded-r border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-2 py-1.5 font-mono text-sm outline-none focus:border-primary" />
                </div>
                {nameError && <p className="text-[11px] text-red-500 mt-0.5">{nameError}</p>}
              </>
            ) : (
              <Input label="Combo Name" value={name} onChange={handleNameChange} placeholder="my-combo" error={nameError} />
            )}
            <p className="text-[10px] text-text-muted mt-0.5">
              {forcePrefix ? `Auto-prefixed with "${forcePrefix}". ` : ""}Only letters, numbers, -, _ and . allowed
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 relative">
              <label className="text-sm font-medium">Models ({models.length})</label>
              
              <div className="relative" ref={presetMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowPresetMenu(!showPresetMenu)}
                  disabled={loadingPreset !== null}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all cursor-pointer shadow-xs"
                  title="Otomatis pilih model berdasarkan kategori (Coding, Agent, Chat, Gambar, Suara, Gratis)"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {loadingPreset ? "progress_activity" : "auto_awesome"}
                  </span>
                  <span>{loadingPreset ? "Memuat..." : "✨ Auto-Pilih Kategori"}</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
                </button>

                {/* Dropdown Menu Preset */}
                {showPresetMenu && (
                  <div className="absolute right-0 top-full mt-1 w-64 rounded-xl border border-border bg-surface shadow-xl z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider border-b border-border/50">
                      Preset Kategori Cepat
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {QUICK_CATEGORY_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className="w-full text-left px-3 py-2 hover:bg-primary/10 flex items-start gap-2 transition-colors cursor-pointer group"
                        >
                          <span className="text-sm shrink-0 mt-0.5">{preset.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-text-main group-hover:text-primary transition-colors">
                              {preset.label}
                            </div>
                            <div className="text-[10px] text-text-muted truncate">
                              {preset.desc}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {models.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-black/10 dark:border-white/10 rounded-lg bg-black/[0.01] dark:bg-white/[0.01]">
                <span className="material-symbols-outlined text-text-muted text-xl mb-1">layers</span>
                <p className="text-xs text-text-muted">Belum ada model ditambahkan</p>
              </div>
            ) : (
              <div className="flex max-h-[55vh] min-w-0 flex-col gap-1 overflow-y-auto sm:max-h-[350px]">
                {models.map((model, index) => (
                  <ModelItem key={index} index={index} model={model}
                    isFirst={index === 0} isLast={index === models.length - 1}
                    onEdit={(v) => { const a = [...models]; a[index] = v; setModels(a); }}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                    onRemove={() => handleRemoveModel(index)} caps={getCaps(model)} />
                ))}
              </div>
            )}
            <button onClick={() => setShowModelSelect(true)}
              className="w-full mt-2 py-2 border border-dashed border-black/10 dark:border-white/10 rounded-lg text-xs text-primary font-medium hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-1 cursor-pointer">
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add Model (Kategori & Filter)
            </button>
          </div>

          {/* Daily Auto-Refresh Models Toggle */}
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSyncFree || Boolean(autoSyncCategory)}
                onChange={(e) => {
                  setAutoSyncFree(e.target.checked);
                  if (!e.target.checked) setAutoSyncCategory("");
                }}
                className="mt-0.5 accent-emerald-500 size-4 rounded"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-500 text-[15px]">sync</span>
                  Auto-Refresh & Impor Model {autoSyncCategory && autoSyncCategory !== "free" ? `${autoSyncCategory.toUpperCase()}` : "Gratis"} Setiap Hari
                </span>
                <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                  Sistem Nice Router akan otomatis mengimpor dan menyinkronkan model-model {autoSyncCategory && autoSyncCategory !== "free" ? autoSyncCategory : "gratis"} terbaru yang sehat setiap hari ke dalam kombo ini, sehingga selalu siap digunakan.
                </p>
              </div>
            </label>
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <Button onClick={onClose} variant="ghost" fullWidth size="sm">Cancel</Button>
            <Button onClick={handleSave} fullWidth size="sm" disabled={!name.trim() || !!nameError || saving}>
              {saving ? "Saving..." : isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {showModelSelect && (
        <ModelSelectModal isOpen={showModelSelect} onClose={() => setShowModelSelect(false)}
          onSelect={handleAddModel} onDeselect={handleDeselectModel}
          onSelectBatch={(items) => {
            const vals = items.map((m) => m?.value || m?.name || m).filter(Boolean);
            setModels((prev) => [...new Set([...prev, ...vals])]);
            setAutoSyncFree(true);
          }}
          onDeselectBatch={(items) => {
            const vals = new Set(items.map((m) => m?.value || m?.name || m).filter(Boolean));
            setModels((prev) => prev.filter((m) => !vals.has(m)));
          }}
          activeProviders={activeProviders} modelAliases={modelAliases}
          title="Add Model to Combo" kindFilter={kindFilter}
          addedModelValues={models} closeOnSelect={false} />
      )}
    </>
  );
}
