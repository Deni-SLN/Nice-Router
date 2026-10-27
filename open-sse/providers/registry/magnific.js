export default {
  id: "magnific",
  priority: 110,
  alias: "freepik",
  passthroughModels: true,
  
  
  display: {
    name: "Magnific",
    icon: "hub",
    color: "#EC4899",
    textIcon: "MA",
    website: "https://www.magnific.com",
    notice: {
      desc: "Get an API key at magnific.com/user/api-keys (header x-magnific-api-key). Legacy Freepik developer keys still work.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.magnific.com/v1/ai/mystic",
    
    format: "magnific-image",
    authHeader: "x-magnific-api-key",
  },
  models: [
    {
        "id": "realism",
        "name": "Mystic Realism"
    },
    {
        "id": "fluid",
        "name": "Mystic Fluid (Imagen 3)"
    },
    {
        "id": "zen",
        "name": "Mystic Zen"
    },
    {
        "id": "flexible",
        "name": "Mystic Flexible"
    },
    {
        "id": "super_real",
        "name": "Mystic Super Real"
    },
    {
        "id": "editorial_portraits",
        "name": "Mystic Editorial Portraits"
    }
],
  serviceKinds: ["llm"],
};
