export default {
  id: "inner-ai",
  priority: 110,
  alias: "in-ai",
  passthroughModels: true,
  
  
  display: {
    name: "Inner.ai (Subscription)",
    icon: "hub",
    color: "#6366F1",
    textIcon: "IN",
    website: "https://app.innerai.com",
    notice: {
      desc: "Paste your token cookie and email separated by a space: open DevTools → Application → Cookies → .innerai.com, copy the token value, then append a space and your Inner.ai login email. Example: eyJhbG... user@example.com",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://chatapi.innerai.com/chat",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "gpt-4o",
        "name": "GPT-4o (via Inner.ai)"
    },
    {
        "id": "gpt-4.1",
        "name": "GPT-4.1 (via Inner.ai)"
    },
    {
        "id": "gpt-4.1-mini",
        "name": "GPT-4.1 Mini (via Inner.ai)"
    },
    {
        "id": "o3",
        "name": "o3 (via Inner.ai)"
    },
    {
        "id": "o4-mini",
        "name": "o4-mini (via Inner.ai)"
    },
    {
        "id": "claude-opus-4-5",
        "name": "Claude Opus 4.5 (via Inner.ai)"
    },
    {
        "id": "claude-sonnet-4-5",
        "name": "Claude Sonnet 4.5 (via Inner.ai)"
    },
    {
        "id": "claude-3-7-sonnet-20250219",
        "name": "Claude 3.7 Sonnet (via Inner.ai)"
    },
    {
        "id": "claude-3-5-sonnet-20241022",
        "name": "Claude 3.5 Sonnet (via Inner.ai)"
    },
    {
        "id": "gemini-2.5-pro",
        "name": "Gemini 2.5 Pro (via Inner.ai)"
    },
    {
        "id": "gemini-2.5-flash",
        "name": "Gemini 2.5 Flash (via Inner.ai)"
    },
    {
        "id": "gemini-2.0-flash",
        "name": "Gemini 2.0 Flash (via Inner.ai)"
    },
    {
        "id": "deepseek-r1",
        "name": "DeepSeek R1 (via Inner.ai)"
    },
    {
        "id": "deepseek-v3",
        "name": "DeepSeek V3 (via Inner.ai)"
    },
    {
        "id": "grok-3",
        "name": "Grok 3 (via Inner.ai)"
    }
],
  serviceKinds: ["llm"],
};
