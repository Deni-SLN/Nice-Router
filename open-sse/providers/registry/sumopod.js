export default {
  id: "sumopod",
  priority: 110,
  alias: "sumopod",
  passthroughModels: true,
  
  
  display: {
    name: "SumoPod",
    icon: "hub",
    color: "#10B981",
    textIcon: "SU",
    website: "https://ai.sumopod.com",
    notice: {
      desc: "Use your SumoPod API key (sk-...) in Authorization: Bearer <key>. Fully OpenAI-compatible. API base URL: https://ai.sumopod.com/v1.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://ai.sumopod.com/v1/chat/completions",
    validateUrl: "https://ai.sumopod.com/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "SumoPod Default Model"
    }
],
  serviceKinds: ["llm"],
};
