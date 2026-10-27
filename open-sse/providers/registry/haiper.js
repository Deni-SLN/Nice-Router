export default {
  id: "haiper",
  priority: 110,
  alias: "hp",
  passthroughModels: true,
  
  
  display: {
    name: "Haiper",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "HA",
    website: "https://haiper.ai",
    notice: {
      desc: "Get API key at haiper.ai/haiper-api",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.haiper.ai/v1",
    
    
    authHeader: "HAIPER_KEY",
  },
  models: [
    {
        "id": "gen2",
        "name": "Gen 2 Video"
    },
    {
        "id": "gen2-image",
        "name": "Gen 2 Image"
    }
],
  serviceKinds: ["llm"],
};
