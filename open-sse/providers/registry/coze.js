export default {
  id: "coze",
  priority: 110,
  alias: "coze",
  passthroughModels: true,
  
  
  display: {
    name: "Coze",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "CO",
    website: "https://coze.com",
    notice: {
      desc: "Get API key at coze.com/open/api",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.coze.com/v1/chat/completions",
    validateUrl: "https://api.coze.com/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "claude-3-7-sonnet-20250514",
        "name": "Claude 3.7 Sonnet"
    }
],
  serviceKinds: ["llm"],
};
