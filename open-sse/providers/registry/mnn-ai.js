export default {
  id: "mnn-ai",
  priority: 110,
  alias: "mnn-ai",
  passthroughModels: true,
  
  
  display: {
    name: "MNN AI",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "MN",
    website: "https://mnnai.ru",
    notice: {
      desc: "Free plan: $1 monthly credits, 10 RPM and access only to models marked Free.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.mnnai.ru/v1/chat/completions",
    validateUrl: "https://api.mnnai.ru/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "MNN AI Default Model"
    }
],
  serviceKinds: ["llm"],
};
