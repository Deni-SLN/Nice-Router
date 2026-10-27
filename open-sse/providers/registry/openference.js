export default {
  id: "openference",
  priority: 110,
  alias: "of",
  passthroughModels: true,
  
  
  display: {
    name: "Openference",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "OP",
    website: "https://openference.com",
    notice: {
      desc: "Sign in with your Openference account to route requests through api.openference.com. Includes free-tier access to Qwen3.8 27b and Llama 3.2 3B — see openference.com/pricing for current plan terms.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.openference.com/v1/chat/completions",
    validateUrl: "https://api.openference.com/v1/models",
    
    authHeader: "bearer",
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
