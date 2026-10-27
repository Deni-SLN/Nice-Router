export default {
  id: "meganova-ai",
  priority: 110,
  alias: "meganova-ai",
  passthroughModels: true,
  
  
  display: {
    name: "MegaNova AI",
    icon: "hub",
    color: "#84CC16",
    textIcon: "ME",
    website: "https://meganova.ai",
    notice: {
      desc: "Free signup without a card. Published Tier 1 per-model quotas total 550 requests/day; they are not a shared global pool, and paid overage can apply if enabled.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.meganova.ai/v1/chat/completions",
    validateUrl: "https://api.meganova.ai/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "MegaNova AI Default Model"
    }
],
  serviceKinds: ["llm"],
};
