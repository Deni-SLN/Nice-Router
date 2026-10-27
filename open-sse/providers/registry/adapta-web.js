export default {
  id: "adapta-web",
  priority: 110,
  alias: "adp-web",
  passthroughModels: true,
  
  
  display: {
    name: "Adapta.org (Adapta One Web)",
    icon: "hub",
    color: "#EC4899",
    textIcon: "AD",
    website: "https://agent.adapta.one",
    notice: {
      desc: "Paste your __client cookie value from .clerk.agent.adapta.one (DevTools → Application → Cookies)",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://agent.adapta.one/api/chat/stream/v1",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "adapta-one",
        "name": "Adapta ONE (Auto)"
    },
    {
        "id": "adapta-gpt",
        "name": "GPT-5 (via Adapta)"
    },
    {
        "id": "adapta-claude",
        "name": "Claude Sonnet 4.6 (via Adapta)"
    },
    {
        "id": "adapta-gemini",
        "name": "Gemini 2.5 Pro (via Adapta)"
    },
    {
        "id": "adapta-grok",
        "name": "Grok 4 (via Adapta)"
    },
    {
        "id": "adapta-deepseek",
        "name": "DeepSeek R2 (via Adapta)"
    },
    {
        "id": "adapta-llama",
        "name": "Llama 4 (via Adapta)"
    }
],
  serviceKinds: ["llm"],
};
