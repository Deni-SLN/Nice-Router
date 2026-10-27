export default {
  id: "arcee-ai",
  priority: 110,
  alias: "arcee",
  passthroughModels: true,
  
  
  display: {
    name: "Arcee AI",
    icon: "hub",
    color: "#F97316",
    textIcon: "AR",
    website: "https://arcee.ai",
    notice: {
      desc: "Get API key at arcee.ai",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.arcee.ai/api/v1/chat/completions",
    validateUrl: "https://api.arcee.ai/api/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Arcee AI Default Model"
    }
],
  serviceKinds: ["llm"],
};
