export default {
  id: "uncloseai",
  priority: 110,
  alias: "unc",
  passthroughModels: true,
  hasFree: true,
  noAuth: true,
  display: {
    name: "UncloseAI",
    icon: "hub",
    color: "#84CC16",
    textIcon: "UN",
    website: "https://uncloseai.com",
    notice: {
      desc: "No auth required. API accepts any non-empty string as key for identification. If older built-in models return 404, use Available Models → Import from /models or Auto-Sync; verified live model: turboderp/Qwen3.8-27B-exl3.",
    },
  },
  category: "free",
  transport: {
    baseUrl: "https://hermes.ai.unturf.com/v1/chat/completions",
    validateUrl: "https://hermes.ai.unturf.com/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "turboderp/Qwen3.8-27B-exl3",
        "name": "Qwen3.8 27B exl3 (🆓 Free)"
    }
],
  serviceKinds: ["llm"],
};
