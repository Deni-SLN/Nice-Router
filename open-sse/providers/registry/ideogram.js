export default {
  id: "ideogram",
  priority: 110,
  alias: "ideo",
  passthroughModels: true,
  
  
  display: {
    name: "Ideogram",
    icon: "hub",
    color: "#EC4899",
    textIcon: "ID",
    website: "https://ideogram.ai",
    notice: {
      desc: "Get API key at ideogram.ai/docs/api",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.ideogram.ai",
    
    
    authHeader: "Api-Key",
  },
  models: [
    {
        "id": "V_3",
        "name": "Ideogram V3"
    },
    {
        "id": "V_2A",
        "name": "Ideogram V2A"
    }
],
  serviceKinds: ["llm"],
};
