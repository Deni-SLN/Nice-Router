export default {
  id: "requesty",
  priority: 110,
  alias: "requesty",
  passthroughModels: true,
  
  
  display: {
    name: "Requesty",
    icon: "hub",
    color: "#EC4899",
    textIcon: "RE",
    website: "https://requesty.ai",
    notice: {
      desc: "Free tier ~200 requests/day - multi-model routing gateway (300+ models)",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://router.requesty.ai/v1/chat/completions",
    validateUrl: "https://router.requesty.ai/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Requesty Default Model"
    }
],
  serviceKinds: ["llm"],
};
