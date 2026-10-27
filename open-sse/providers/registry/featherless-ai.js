export default {
  id: "featherless-ai",
  priority: 110,
  alias: "featherless",
  passthroughModels: true,
  
  
  display: {
    name: "Featherless AI",
    icon: "hub",
    color: "#84CC16",
    textIcon: "FE",
    website: "https://featherless.ai",
    notice: {
      desc: "Free tier available — no credit card required",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.featherless.ai/v1/chat/completions",
    validateUrl: "https://api.featherless.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "Featherless AI Default Model"
    }
],
  serviceKinds: ["llm"],
};
