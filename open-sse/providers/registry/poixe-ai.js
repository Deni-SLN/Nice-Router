export default {
  id: "poixe-ai",
  priority: 110,
  alias: "poixe-ai",
  passthroughModels: true,
  
  
  display: {
    name: "Poixe AI",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "PO",
    website: "https://poixe.com",
    notice: {
      desc: "Current public free limits are small and model-group specific: 2 RPM/5 RPD for large-cup models and 20 RPM/50 RPD for small-cup models.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.poixe.com/v1/chat/completions",
    validateUrl: "https://api.poixe.com/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Poixe AI Default Model"
    }
],
  serviceKinds: ["llm"],
};
