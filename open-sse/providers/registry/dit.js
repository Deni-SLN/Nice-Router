export default {
  id: "dit",
  priority: 110,
  alias: "dai",
  passthroughModels: true,
  
  
  display: {
    name: "DIT.ai",
    icon: "hub",
    color: "#10B981",
    textIcon: "DI",
    website: "https://dit.ai",
    notice: {
      desc: "Use your dit.ai API key in Authorization: Bearer <key>. Fully OpenAI-compatible — a drop-in replacement, just change the base URL to https://api.dit.ai/v1.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.dit.ai/v1/chat/completions",
    validateUrl: "https://api.dit.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "gpt-5.4",
        "name": "GPT-5.4 (DIT.ai)"
    },
    {
        "id": "claude-sonnet-4-6",
        "name": "Claude Sonnet 4.6 (DIT.ai)"
    }
],
  serviceKinds: ["llm"],
};
