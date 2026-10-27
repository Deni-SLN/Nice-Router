export default {
  id: "lyceum",
  priority: 110,
  alias: "lyceum",
  passthroughModels: true,
  
  
  display: {
    name: "Lyceum",
    icon: "hub",
    color: "#10B981",
    textIcon: "LY",
    website: "https://lyceum.technology",
    notice: {
      desc: "Includes monthly free credits toward serverless inference usage.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.lyceum.technology/openai/v1/chat/completions",
    validateUrl: "https://api.lyceum.technology/openai/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Lyceum Default Model"
    }
],
  serviceKinds: ["llm"],
};
