export default {
  id: "x5lab",
  priority: 110,
  alias: "x5lab",
  passthroughModels: true,
  
  
  display: {
    name: "X5Lab",
    icon: "hub",
    color: "#14B8A6",
    textIcon: "X5",
    website: "https://x5lab.dev",
    notice: {
      desc: "Use your X5Lab API key (x5-...) in Authorization: Bearer <key>. Fully OpenAI-compatible. API base URL: https://api.x5lab.dev/v1.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.x5lab.dev/v1/chat/completions",
    validateUrl: "https://api.x5lab.dev/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "X5Lab Default Model"
    }
],
  serviceKinds: ["llm"],
};
