export default {
  id: "galadriel",
  priority: 110,
  alias: "galadriel",
  passthroughModels: true,
  
  
  display: {
    name: "Galadriel",
    icon: "hub",
    color: "#6366F1",
    textIcon: "GA",
    website: "https://galadriel.com",
    notice: {
      desc: "⚠️ **DEPRECATED.** api.galadriel.ai no longer resolves (sweep 2026-06-19); the inference API appears discontinued.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.galadriel.ai/v1/chat/completions",
    validateUrl: "https://api.galadriel.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "galadriel-latest",
        "name": "galadriel latest"
    }
],
  serviceKinds: ["llm"],
};
