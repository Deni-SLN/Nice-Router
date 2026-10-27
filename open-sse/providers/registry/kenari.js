export default {
  id: "kenari",
  priority: 110,
  alias: "kenari",
  passthroughModels: true,
  
  
  display: {
    name: "Kenari",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "KE",
    website: "https://kenari.id",
    notice: {
      desc: "Use your Kenari API key (kn-...) in Authorization: Bearer <key>. Fully OpenAI-compatible. API base URL: https://kenari.id/v1.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://kenari.id/v1/chat/completions",
    validateUrl: "https://kenari.id/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "Kenari Default Model"
    }
],
  serviceKinds: ["llm"],
};
