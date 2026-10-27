export default {
  id: "duckduckgo-web",
  priority: 110,
  alias: "ddgw",
  passthroughModels: true,
  hasFree: true,
  noAuth: true,
  display: {
    name: "DuckDuckGo AI Chat",
    icon: "hub",
    color: "#F97316",
    textIcon: "DU",
    website: "https://duckduckgo.com/duckchat",
    notice: {
      desc: "No credentials required — DuckDuckGo AI Chat is anonymous and free.",
    },
  },
  category: "free",
  transport: {
    baseUrl: "https://duck.ai/duckchat/v1/chat",
    
    
    authHeader: "none",
  },
  models: [
    {
        "id": "gpt-5.4-mini",
        "name": "GPT-5.4 Mini"
    },
    {
        "id": "gpt-5.6-luna",
        "name": "GPT-5.6 Luna"
    },
    {
        "id": "claude-haiku-4-5",
        "name": "Claude Haiku 4.5"
    },
    {
        "id": "mistral-small-2603",
        "name": "Mistral Small 4"
    },
    {
        "id": "tinfoil/gpt-oss-120b",
        "name": "gpt-oss 120B"
    },
    {
        "id": "tinfoil/gemma4-31b",
        "name": "Gemma 4 31B"
    }
],
  serviceKinds: ["llm"],
};
