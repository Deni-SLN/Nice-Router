export default {
  id: "moonshot",
  priority: 110,
  alias: "moonshot",
  passthroughModels: true,
  
  
  display: {
    name: "Kimi",
    icon: "hub",
    color: "#6366F1",
    textIcon: "KI",
    website: "https://platform.kimi.ai?aff=omniroute",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.moonshot.ai/v1/chat/completions",
    validateUrl: "https://api.moonshot.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "kimi-k3",
        "name": "Kimi K3"
    },
    {
        "id": "kimi-k2.7-code",
        "name": "Kimi K2.7 Code"
    },
    {
        "id": "kimi-k2.7-code-highspeed",
        "name": "Kimi K2.7 Code (High Speed)"
    },
    {
        "id": "kimi-k2.6",
        "name": "Kimi K2.6"
    }
],
  serviceKinds: ["llm"],
};
