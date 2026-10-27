export default {
  id: "chatgpt-web",
  priority: 110,
  alias: "—",
  passthroughModels: true,
  
  
  display: {
    name: "ChatGPT Web (Clean Room)",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "CH",
    website: "https://chatgpt.com",
    notice: {
      desc: "Paste Playwright-compatible storage-state JSON exported from a logged-in chatgpt.com browser context. Cookie headers and individual token values are not accepted.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://chatgpt.com",
    
    
    authHeader: "cookie",
  },
  models: [
    {
        "id": "gpt-5-6",
        "name": "GPT-5.6 Sol — Instant"
    },
    {
        "id": "gpt-5-6-thinking",
        "name": "GPT-5.6 Sol — Thinking"
    },
    {
        "id": "gpt-5-6-pro",
        "name": "GPT-5.6 Sol — Pro"
    },
    {
        "id": "gpt-5.6-luna-free",
        "name": "GPT-5.6 Luna — Free"
    },
    {
        "id": "gpt-5.6-luna-free-thinking",
        "name": "GPT-5.6 Luna — Free Thinking"
    },
    {
        "id": "gpt-5-5-instant",
        "name": "GPT-5.5 — Instant"
    },
    {
        "id": "gpt-5-5-thinking",
        "name": "GPT-5.5 — Thinking"
    },
    {
        "id": "gpt-5-5-pro",
        "name": "GPT-5.5 — Pro"
    }
],
  serviceKinds: ["llm"],
};
