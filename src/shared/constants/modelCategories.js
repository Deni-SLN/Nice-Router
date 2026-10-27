/**
 * Model Categories & Classification Utilities
 * Digunakan untuk filter pemilihan model, kombo tematik (Coding, Agent, Chat, Gambar, Suara),
 * dan sinkronisasi kombo otomatis.
 */

export const MODEL_CATEGORIES = [
  {
    id: "all",
    label: "Semua Model",
    shortLabel: "Semua",
    icon: "dataset",
    emoji: "🌐",
    desc: "Tampilkan seluruh model yang tersedia",
  },
  {
    id: "free",
    label: "Gratis / Free",
    shortLabel: "Gratis",
    icon: "lock_open",
    emoji: "🆓",
    desc: "Hanya model dengan akses gratis (tanpa biaya token)",
  },
  {
    id: "coding",
    label: "Coding & Pemrograman",
    shortLabel: "Coding",
    icon: "terminal",
    emoji: "💻",
    desc: "Model spesialis koding, software engineering, debugging, dan dev",
  },
  {
    id: "agent",
    label: "AI Agent & Reasoning",
    shortLabel: "AI Agent",
    icon: "smart_toy",
    emoji: "🤖",
    desc: "Model dengan kemampuan reasoning kuat, tool/function calling, dan autonomous agent",
  },
  {
    id: "chat",
    label: "Chat & Percakapan",
    shortLabel: "Chat",
    icon: "chat",
    emoji: "💬",
    desc: "Model percakapan umum, Q&A, asistensi teks, dan penulisan",
  },
  {
    id: "image",
    label: "Gambar & Vision",
    shortLabel: "Gambar",
    icon: "palette",
    emoji: "🎨",
    desc: "Model analisis visual (vision) dan pembuatan gambar (image generation)",
  },
  {
    id: "voice",
    label: "Suara & Audio",
    shortLabel: "Suara",
    icon: "mic",
    emoji: "🎙️",
    desc: "Model Text-to-Speech (TTS), Speech-to-Text (STT/Whisper), dan pemrosesan audio",
  },
];

const CODING_REGEX = /(code|coder|coding|dev|script|program|codex|copilot|codestral|starcoder|wizardcoder|deepseek-coder|qwen.*coder|claude-3|claude-sonnet|claude-opus|gpt-4|gpt-5|gemini-.*pro|deepseek-r1|deepseek-v3|command-r)/i;
const AGENT_REGEX = /(agent|reason|think|r1|o1|o3|sonar-deep|claude-3|claude-sonnet|claude-opus|gpt-4o|qwen-max|deepseek-r1|gemini-.*pro)/i;
const IMAGE_REGEX = /(vision|vl|image|flux|dall-e|sdxl|diffusion|imagen|midjourney|recraft|ideogram|moondream|cogvlm)/i;
const VOICE_REGEX = /(voice|tts|stt|speech|whisper|audio|sound|eleven|voicebox|bark)/i;

/**
 * Memeriksa apakah model cocok dengan kategori tertentu
 * @param {Object|string} model - Objek model ({ id, name, value, kind, ... }) atau string id
 * @param {string} categoryId - Kategori: "all" | "free" | "coding" | "agent" | "chat" | "image" | "voice"
 * @param {Object} options - { getCaps, isFree, providerId }
 * @returns {boolean}
 */
export function matchesModelCategory(model, categoryId, options = {}) {
  if (!categoryId || categoryId === "all") return true;

  const { getCaps, isFree = false } = options;
  if (categoryId === "free") return Boolean(isFree);

  const modelId = typeof model === "string" ? model : (model?.id || model?.value || "");
  const modelName = typeof model === "object" ? (model?.name || modelId) : modelId;
  const modelKind = typeof model === "object" ? (model?.kind || model?.type || "llm") : "llm";
  const str = `${modelId} ${modelName}`.toLowerCase();

  const caps = typeof getCaps === "function" ? (getCaps(model?.value || modelId) || {}) : (model?.caps || {});

  switch (categoryId) {
    case "coding":
      return CODING_REGEX.test(str);

    case "agent":
      if (caps.tools === true || caps.reasoning === true) return true;
      if (typeof caps.contextWindow === "number" && caps.contextWindow >= 128000) return true;
      return AGENT_REGEX.test(str);

    case "image":
      if (modelKind === "image" || modelKind === "imageToText") return true;
      if (caps.vision === true || caps.imageOutput === true) return true;
      return IMAGE_REGEX.test(str);

    case "voice":
      if (modelKind === "tts" || modelKind === "stt") return true;
      if (caps.audioInput === true) return true;
      return VOICE_REGEX.test(str);

    case "chat":
      // Chat adalah semua LLM umum yang bukan semata gambar/suara murni
      if (modelKind === "image" || modelKind === "tts" || modelKind === "stt") return false;
      return true;

    default:
      return true;
  }
}
