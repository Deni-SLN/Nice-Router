export default {
  id: "factory",
  priority: 110,
  alias: "factory",
  passthroughModels: true,
  
  
  display: {
    name: "Factory",
    icon: "hub",
    color: "#EC4899",
    textIcon: "FA",
    website: "https://factory.ai",
    notice: {
      desc: "Bearer API key for the Factory OpenAI-compatible gateway.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.factory.ai/v1/chat/completions",
    validateUrl: "https://api.factory.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "auto",
        "name": "Factory Auto (best model)"
    }
],
  serviceKinds: ["llm"],
};
