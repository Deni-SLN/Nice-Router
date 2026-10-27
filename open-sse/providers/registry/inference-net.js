export default {
  id: "inference-net",
  priority: 110,
  alias: "inet",
  passthroughModels: true,
  
  
  display: {
    name: "Inference.net",
    icon: "hub",
    color: "#F97316",
    textIcon: "IN",
    website: "https://inference.net",
    notice: {
      desc: "$25 free credits on signup plus research grants available",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.inference.net/v1/chat/completions",
    validateUrl: "https://api.inference.net/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "Inference.net Default Model"
    }
],
  serviceKinds: ["llm"],
};
