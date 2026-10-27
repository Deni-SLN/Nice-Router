export default {
  id: "t3-web",
  priority: 110,
  alias: "t3chat",
  passthroughModels: true,
  
  
  display: {
    name: "t3.chat (Pro/Free)",
    icon: "hub",
    color: "#14B8A6",
    textIcon: "T3",
    website: "https://t3.chat",
    notice: {
      desc: "Open t3.chat in your browser, log in, then open DevTools → Application → Local Storage → https://t3.chat. Copy the value of 'convex-session-id'. Also open DevTools → Network, copy the Cookie header from any request. Paste both values here. See provider setup docs for a step-by-step guide.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://t3.chat/api/chat",
    
    
    authHeader: "cookie",
  },
  models: [
    {
        "id": "claude-opus-4",
        "name": "Claude Opus 4 (via t3.chat)"
    },
    {
        "id": "claude-sonnet-4",
        "name": "Claude Sonnet 4 (via t3.chat)"
    },
    {
        "id": "claude-haiku-4",
        "name": "Claude Haiku 4 (via t3.chat)"
    },
    {
        "id": "claude-3.7",
        "name": "Claude 3.7 Sonnet (via t3.chat)"
    },
    {
        "id": "gpt-5",
        "name": "GPT-5 (via t3.chat)"
    },
    {
        "id": "gpt-4o",
        "name": "GPT-4o (via t3.chat)"
    },
    {
        "id": "gpt-4.1",
        "name": "GPT-4.1 (via t3.chat)"
    },
    {
        "id": "o3",
        "name": "o3 (via t3.chat)"
    },
    {
        "id": "o4-mini",
        "name": "o4-mini (via t3.chat)"
    },
    {
        "id": "gemini-2.5-pro",
        "name": "Gemini 2.5 Pro (via t3.chat)"
    },
    {
        "id": "gemini-2.5-flash",
        "name": "Gemini 2.5 Flash (via t3.chat)"
    },
    {
        "id": "deepseek-r1",
        "name": "DeepSeek R1 (via t3.chat)"
    },
    {
        "id": "deepseek-v3",
        "name": "DeepSeek V3 (via t3.chat)"
    },
    {
        "id": "grok-3",
        "name": "Grok 3 (via t3.chat)"
    },
    {
        "id": "grok-3-mini",
        "name": "Grok 3 Mini (via t3.chat)"
    }
],
  serviceKinds: ["llm"],
};
