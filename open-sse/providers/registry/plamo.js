export default {
  id: "plamo",
  priority: 110,
  alias: "plamo",
  passthroughModels: true,
  
  
  display: {
    name: "PLaMo",
    icon: "hub",
    color: "#F97316",
    textIcon: "PL",
    website: "https://plamo.preferredai.jp/api",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.platform.preferredai.jp/v1/chat/completions",
    validateUrl: "https://api.platform.preferredai.jp/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "plamo-3.0-prime",
        "name": "PLaMo 3.0 Prime"
    }
],
  serviceKinds: ["llm"],
};
