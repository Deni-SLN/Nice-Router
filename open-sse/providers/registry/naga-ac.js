export default {
  id: "naga-ac",
  priority: 110,
  alias: "naga",
  passthroughModels: true,
  
  
  display: {
    name: "Naga.ac",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "NA",
    website: "https://naga.ac",
    notice: {
      desc: "Get API key at naga.ac — Google/GitHub/Discord signup available.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.naga.ac/v1/chat/completions",
    validateUrl: "https://api.naga.ac/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "Naga.ac Default Model"
    }
],
  serviceKinds: ["llm"],
};
