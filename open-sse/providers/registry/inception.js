export default {
  id: "inception",
  priority: 110,
  alias: "inception",
  passthroughModels: true,
  
  
  display: {
    name: "Inception",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "IN",
    website: "https://docs.inceptionlabs.ai",
    notice: {
      desc: "10M free tokens on signup, no credit card required.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.inceptionlabs.ai/v1/chat/completions",
    validateUrl: "https://api.inceptionlabs.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "mercury-2",
        "name": "Mercury 2"
    },
    {
        "id": "mercury-2.5",
        "name": "Mercury 2.5"
    }
],
  serviceKinds: ["llm"],
};
