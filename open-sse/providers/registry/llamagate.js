export default {
  id: "llamagate",
  priority: 110,
  alias: "llamagate",
  passthroughModels: true,
  
  
  display: {
    name: "LlamaGate",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "LL",
    website: "https://llamagate.ai",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://llamagate.ai/v1/chat/completions",
    validateUrl: "https://llamagate.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "qwen2.5-coder-7b",
        "name": "qwen2.5 coder 7b"
    },
    {
        "id": "deepseek-coder-6.7b",
        "name": "deepseek coder 6.7b"
    },
    {
        "id": "qwen3-vl-8b",
        "name": "qwen3 vl 8b"
    }
],
  serviceKinds: ["llm"],
};
