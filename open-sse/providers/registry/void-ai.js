export default {
  id: "void-ai",
  priority: 110,
  alias: "void-ai",
  passthroughModels: true,
  
  
  display: {
    name: "Void AI",
    icon: "hub",
    color: "#10B981",
    textIcon: "VO",
    website: "https://voidai.app",
    notice: {
      desc: "The public model catalog marks some models with a free plan requirement, but access is conditional and no numeric quota is confirmed.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.voidai.app/v1/chat/completions",
    validateUrl: "https://api.voidai.app/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Void AI Default Model"
    }
],
  serviceKinds: ["llm"],
};
