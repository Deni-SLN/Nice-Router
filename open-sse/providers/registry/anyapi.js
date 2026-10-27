export default {
  id: "anyapi",
  priority: 110,
  alias: "anyapi",
  passthroughModels: true,
  
  
  display: {
    name: "AnyAPI AI",
    icon: "hub",
    color: "#EC4899",
    textIcon: "AN",
    website: "https://anyapi.ai",
    notice: {
      desc: "Free plan: 100,000 ANY Tokens/day and 100 RPM for eligible Free/Basic models; no credit card required.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.anyapi.ai/v1/chat/completions",
    validateUrl: "https://api.anyapi.ai/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "AnyAPI AI Default Model"
    }
],
  serviceKinds: ["llm"],
};
