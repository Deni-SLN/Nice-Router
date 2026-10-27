export default {
  id: "freetheai",
  priority: 110,
  alias: "fta",
  passthroughModels: true,
  
  
  display: {
    name: "FreeTheAi",
    icon: "hub",
    color: "#10B981",
    textIcon: "FR",
    website: "https://freetheai.org",
    notice: {
      desc: "Sign up at https://freetheai.org/signup for a free API key. A daily check-in unlocks the free models; linking Discord is optional and only raises the daily limit.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.freetheai.org/v1/chat/completions",
    validateUrl: "https://api.freetheai.org/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "fta/zai/glm-5.3",
        "name": "GLM 5.3 (zai)"
    },
    {
        "id": "fta/kimi/k3",
        "name": "Kimi K3"
    }
],
  serviceKinds: ["llm"],
};
