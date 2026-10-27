export default {
  id: "monsterapi",
  priority: 110,
  alias: "monster",
  passthroughModels: true,
  
  
  display: {
    name: "MonsterAPI",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "MO",
    website: "https://monsterapi.ai",
    notice: {
      desc: "⚠️ **DEPRECATED.** Monster API shuttered operations on 2026-06-30. Use alternative OpenAI-compatible providers.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.monsterapi.ai/v1/chat/completions",
    validateUrl: "https://api.monsterapi.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "meta-llama/Meta-Llama-3.1-8B-Instruct",
        "name": "Llama 3.1 8B Instruct"
    },
    {
        "id": "meta-llama/Llama-3.3-70B-Instruct",
        "name": "Llama 3.3 70B Instruct"
    }
],
  serviceKinds: ["llm"],
};
