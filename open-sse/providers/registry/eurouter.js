export default {
  id: "eurouter",
  priority: 110,
  alias: "eurouter",
  passthroughModels: true,
  
  
  display: {
    name: "EURouter",
    icon: "hub",
    color: "#F97316",
    textIcon: "EU",
    website: "https://eurouter.ai",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.eurouter.ai/v1/chat/completions",
    validateUrl: "https://api.eurouter.ai/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "EURouter Default Model"
    }
],
  serviceKinds: ["llm"],
};
