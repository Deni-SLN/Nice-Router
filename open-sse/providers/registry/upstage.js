export default {
  id: "upstage",
  priority: 110,
  alias: "upstage",
  passthroughModels: true,
  
  
  display: {
    name: "Upstage",
    icon: "hub",
    color: "#84CC16",
    textIcon: "UP",
    website: "https://www.upstage.ai",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.upstage.ai/v1/chat/completions",
    validateUrl: "https://api.upstage.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "solar-pro3",
        "name": "solar pro3"
    },
    {
        "id": "solar-mini",
        "name": "solar mini"
    }
],
  serviceKinds: ["llm"],
};
