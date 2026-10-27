export default {
  id: "openference-api",
  priority: 110,
  alias: "ofa",
  passthroughModels: true,
  
  
  display: {
    name: "Openference API",
    icon: "hub",
    color: "#F97316",
    textIcon: "OP",
    website: "https://openference.com",
    notice: {
      desc: "Free tier: includes Qwen3.8 27b and Llama 3.2 3B — see openference.com/pricing for current terms",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.openference.com/v1/chat/completions",
    validateUrl: "https://api.openference.com/v1/models",
    
    
  },
  models: [
    {
        "id": "GLM-5.2",
        "name": "GLM 5.2"
    },
    {
        "id": "Qwen3.8 27b",
        "name": "Qwen3.8 27B"
    },
    {
        "id": "Llama 3.2 3B",
        "name": "Llama 3.2 3B"
    }
],
  serviceKinds: ["llm"],
};
