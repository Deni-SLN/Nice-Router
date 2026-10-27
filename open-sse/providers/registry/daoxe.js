export default {
  id: "daoxe",
  priority: 110,
  alias: "daoxe",
  passthroughModels: true,
  
  
  display: {
    name: "DaoXE",
    icon: "hub",
    color: "#84CC16",
    textIcon: "DA",
    website: "https://daoxe.com",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.daoxe.com/v1/chat/completions",
    validateUrl: "https://api.daoxe.com/v1/models",
    
    
  },
  models: [
    {
        "id": "claude-sonnet-4-6",
        "name": "Claude Sonnet 4.6"
    },
    {
        "id": "claude-opus-4-8",
        "name": "Claude Opus 4.8"
    },
    {
        "id": "claude-haiku-4-5-20251001",
        "name": "Claude Haiku 4.5"
    },
    {
        "id": "gpt-5.5",
        "name": "GPT-5.5"
    },
    {
        "id": "gpt-5.4",
        "name": "GPT-5.4"
    },
    {
        "id": "gemini-3.1-pro-preview",
        "name": "Gemini 3.1 Pro Preview"
    },
    {
        "id": "grok-4.5",
        "name": "Grok 4.5"
    },
    {
        "id": "grok-4.3",
        "name": "Grok 4.3"
    },
    {
        "id": "kimi-k2.5",
        "name": "Kimi K2.5"
    }
],
  serviceKinds: ["llm"],
};
