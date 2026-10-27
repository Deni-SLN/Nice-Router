export default {
  id: "dgrid",
  priority: 110,
  alias: "dgrid",
  passthroughModels: true,
  
  
  display: {
    name: "DGrid",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "DG",
    website: "https://dgrid.ai",
    notice: {
      desc: "DGrid Free Models Router: 10 requests/minute and 100 requests/day. A $5 lifetime top-up unlocks up to 20 requests/minute and 1,000 requests/day.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.dgrid.ai/v1/chat/completions",
    validateUrl: "https://api.dgrid.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "dgridai/free",
        "name": "DGrid Free Models Router"
    }
],
  serviceKinds: ["llm"],
};
