export default {
  id: "leonardo",
  priority: 110,
  alias: "leo",
  passthroughModels: true,
  
  
  display: {
    name: "Leonardo AI",
    icon: "hub",
    color: "#EC4899",
    textIcon: "LE",
    website: "https://leonardo.ai",
    notice: {
      desc: "Get API key at leonardo.ai/developer",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://cloud.leonardo.ai/api/rest/v1",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "phoenix",
        "name": "Phoenix"
    },
    {
        "id": "sdxl",
        "name": "SDXL"
    }
],
  serviceKinds: ["llm"],
};
