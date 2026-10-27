export default {
  id: "opper",
  priority: 110,
  alias: "opper",
  passthroughModels: true,
  
  
  display: {
    name: "Opper",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "OP",
    website: "https://opper.ai",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.opper.ai/v3/compat/chat/completions",
    validateUrl: "https://api.opper.ai/v3/compat/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Opper Default Model"
    }
],
  serviceKinds: ["llm"],
};
