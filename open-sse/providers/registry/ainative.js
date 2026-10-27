export default {
  id: "ainative",
  priority: 110,
  alias: "ainative",
  passthroughModels: true,
  
  
  display: {
    name: "AINative Studio",
    icon: "hub",
    color: "#10B981",
    textIcon: "AI",
    website: "https://ainative.studio",
    notice: {
      desc: "Create a free API key at ainative.studio (no card), then paste it here as a Bearer token.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.ainative.studio/api/v1/chat/completions",
    validateUrl: "https://api.ainative.studio/api/v1/models",
    
    
  },
  models: [
    {
        "id": "qwen3-235b-cerebras",
        "name": "Qwen3 235B (Cerebras)"
    },
    {
        "id": "qwen3-32b",
        "name": "Qwen3 32B"
    },
    {
        "id": "qwen3-14b",
        "name": "Qwen3 14B"
    },
    {
        "id": "qwen3-8b",
        "name": "Qwen3 8B"
    },
    {
        "id": "llama-4-maverick",
        "name": "Llama 4 Maverick"
    },
    {
        "id": "llama3.1-8b-cerebras",
        "name": "Llama 3.1 8B (Cerebras)"
    },
    {
        "id": "deepseek-r1",
        "name": "DeepSeek R1"
    },
    {
        "id": "nous-coder",
        "name": "Nous Coder"
    },
    {
        "id": "gemini-flash",
        "name": "Gemini Flash"
    }
],
  serviceKinds: ["llm"],
};
