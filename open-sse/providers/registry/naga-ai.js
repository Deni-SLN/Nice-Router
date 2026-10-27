export default {
  id: "naga-ai",
  priority: 110,
  alias: "naga-ai",
  passthroughModels: true,
  
  
  display: {
    name: "Naga AI",
    icon: "hub",
    color: "#14B8A6",
    textIcon: "NA",
    website: "https://naga.ac",
    notice: {
      desc: "Models marked :free are publicly listed, but no numeric quota is confirmed. Naga's policy warns that free-tier prompts and outputs may be collected or used for training.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.naga.ac/v1/chat/completions",
    validateUrl: "https://api.naga.ac/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Naga AI Default Model"
    }
],
  serviceKinds: ["llm"],
};
