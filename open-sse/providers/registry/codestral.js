export default {
  id: "codestral",
  priority: 110,
  alias: "codestral",
  passthroughModels: true,
  
  
  display: {
    name: "Codestral",
    icon: "hub",
    color: "#10B981",
    textIcon: "CO",
    website: "https://mistral.ai",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://codestral.mistral.ai/v1/chat/completions",
    validateUrl: "https://codestral.mistral.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "codestral-2508",
        "name": "codestral 2508"
    },
    {
        "id": "codestral-latest",
        "name": "codestral latest"
    }
],
  serviceKinds: ["llm"],
};
