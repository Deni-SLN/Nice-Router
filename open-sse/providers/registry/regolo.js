export default {
  id: "regolo",
  priority: 110,
  alias: "regolo",
  passthroughModels: true,
  
  
  display: {
    name: "Regolo AI",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "RE",
    website: "https://regolo.ai",
    notice: {
      desc: "Get your Regolo API key from regolo.ai, then paste it here as a Bearer token.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.regolo.ai/v1/chat/completions",
    validateUrl: "https://api.regolo.ai/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Regolo AI Default Model"
    }
],
  serviceKinds: ["llm"],
};
