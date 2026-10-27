export default {
  id: "typhoon",
  priority: 110,
  alias: "typhoon",
  passthroughModels: true,
  
  
  display: {
    name: "Typhoon",
    icon: "hub",
    color: "#6366F1",
    textIcon: "TY",
    website: "https://docs.opentyphoon.ai",
    notice: {
      desc: "Free API key with a 5 req/s and 200 req/m rate limit.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.opentyphoon.ai/v1/chat/completions",
    validateUrl: "https://api.opentyphoon.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "typhoon-v2.5-30b-a3b-instruct",
        "name": "Typhoon v2.5 30B A3B Instruct"
    }
],
  serviceKinds: ["llm"],
};
