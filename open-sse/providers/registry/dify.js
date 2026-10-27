export default {
  id: "dify",
  priority: 110,
  alias: "dify",
  passthroughModels: true,
  
  
  display: {
    name: "Dify",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "DI",
    website: "https://dify.ai",
    notice: {
      desc: "Get API key from your Dify instance.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.dify.ai",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "auto",
        "name": "Auto"
    }
],
  serviceKinds: ["llm"],
};
