export default {
  id: "liquid",
  priority: 110,
  alias: "liquid",
  passthroughModels: true,
  
  
  display: {
    name: "Liquid AI",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "LI",
    website: "https://liquid.ai",
    notice: {
      desc: "Get API key at liquid.ai",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://inference.liquid.ai/v1/chat/completions",
    validateUrl: "https://inference.liquid.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "liquid-lfm-40b",
        "name": "Liquid LFM 40B"
    }
],
  serviceKinds: ["llm"],
};
