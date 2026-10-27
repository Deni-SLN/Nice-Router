export default {
  id: "unifically",
  priority: 110,
  alias: "unifically",
  passthroughModels: true,
  
  
  display: {
    name: "Unifically",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "UN",
    website: "https://unifically.com",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.unifically.com/v1/chat/completions",
    validateUrl: "https://api.unifically.com/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Unifically Default Model"
    }
],
  serviceKinds: ["llm"],
};
