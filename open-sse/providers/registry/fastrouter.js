export default {
  id: "fastrouter",
  priority: 110,
  alias: "fastrouter",
  passthroughModels: true,
  
  
  display: {
    name: "FastRouter",
    icon: "hub",
    color: "#84CC16",
    textIcon: "FA",
    website: "https://fastrouter.ai",
    notice: {
      desc: "Models with the :free suffix allow 10 requests/day per organization and model; availability may change.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.fastrouter.ai/api/v1/chat/completions",
    validateUrl: "https://api.fastrouter.ai/api/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "FastRouter Default Model"
    }
],
  serviceKinds: ["llm"],
};
