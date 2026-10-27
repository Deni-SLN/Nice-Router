export default {
  id: "token-kiosk",
  priority: 110,
  alias: "tk",
  passthroughModels: true,
  
  
  display: {
    name: "Token Kiosk",
    icon: "hub",
    color: "#10B981",
    textIcon: "TO",
    website: "https://agent-router.gaib.ai",
    notice: {
      desc: "Use your Token Kiosk API key in Authorization: Bearer <key>. Fully OpenAI-compatible gateway. API base URL: https://agent-router.gaib.ai/v1.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://agent-router.gaib.ai/v1/chat/completions",
    validateUrl: "https://agent-router.gaib.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "claude-3-5-sonnet",
        "name": "Claude 3.5 Sonnet (Token Kiosk)"
    },
    {
        "id": "deepseek-v3",
        "name": "DeepSeek V3 (Token Kiosk)"
    },
    {
        "id": "deepseek-r1",
        "name": "DeepSeek R1 (Token Kiosk)"
    },
    {
        "id": "kimi-k1.5",
        "name": "Kimi K1.5 (Token Kiosk)"
    },
    {
        "id": "minimax-m6",
        "name": "MiniMax M6 (Token Kiosk)"
    }
],
  serviceKinds: ["llm"],
};
