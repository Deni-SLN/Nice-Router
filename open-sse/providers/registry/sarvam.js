export default {
  id: "sarvam",
  priority: 110,
  alias: "sarvam",
  passthroughModels: true,
  
  
  display: {
    name: "Sarvam AI",
    icon: "hub",
    color: "#14B8A6",
    textIcon: "SA",
    website: "https://docs.sarvam.ai",
    notice: {
      desc: "₹1,000 in free signup credits — never expire",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.sarvam.ai/v1/chat/completions",
    validateUrl: "https://api.sarvam.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "sarvam-105b",
        "name": "Sarvam 105B"
    },
    {
        "id": "sarvam-30b",
        "name": "Sarvam 30B"
    }
],
  serviceKinds: ["llm"],
};
