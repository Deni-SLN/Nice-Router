export default {
  id: "yi",
  priority: 110,
  alias: "yi",
  passthroughModels: true,
  
  
  display: {
    name: "Yi (01.AI)",
    icon: "hub",
    color: "#14B8A6",
    textIcon: "YI",
    website: "https://01.ai",
    notice: {
      desc: "Get API key at platform.lingyiwanwu.com",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.lingyiwanwu.com/v1/chat/completions",
    validateUrl: "https://api.lingyiwanwu.com/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "yi-large",
        "name": "Yi Large"
    }
],
  serviceKinds: ["llm"],
};
