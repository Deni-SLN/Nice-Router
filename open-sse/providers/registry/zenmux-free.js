export default {
  id: "zenmux-free",
  priority: 110,
  alias: "zmf",
  passthroughModels: true,
  
  
  display: {
    name: "ZenMux Free (Web)",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "ZE",
    website: "https://zenmux.ai",
    notice: {
      desc: "Login at zenmux.ai, then export all cookies using EditThisCookie or Cookie-Editor and paste the full Cookie header string here. Refresh every ~30 days.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://zenmux.ai/api/anthropic/v1/messages",
    
    
    authHeader: "cookie",
  },
  models: [
    {
        "id": "deepseek/deepseek-chat",
        "name": "DeepSeek V3.2 (Non-thinking)"
    },
    {
        "id": "deepseek/deepseek-reasoner",
        "name": "DeepSeek V3.2 (Thinking)"
    },
    {
        "id": "deepseek/deepseek-v4-pro",
        "name": "DeepSeek V4 Pro"
    },
    {
        "id": "kuaishou/kat-coder-pro-v1-free",
        "name": "KAT Coder Pro V1 Free"
    },
    {
        "id": "z-ai/glm-4.7-flash-free",
        "name": "GLM 4.7 Flash Free"
    },
    {
        "id": "stepfun/step-3.5-flash-free",
        "name": "Step 3.5 Flash Free"
    },
    {
        "id": "inclusionai/ling-1t",
        "name": "Ling 1T"
    },
    {
        "id": "inclusionai/ling-mini-2.0",
        "name": "Ling Mini 2.0"
    },
    {
        "id": "inclusionai/ring-1t",
        "name": "Ring 1T"
    },
    {
        "id": "sapiens-ai/agnes-1.5-lite",
        "name": "Agnes 1.5 Lite"
    },
    {
        "id": "sapiens-ai/agnes-1.5-pro",
        "name": "Agnes 1.5 Pro"
    }
],
  serviceKinds: ["llm"],
};
