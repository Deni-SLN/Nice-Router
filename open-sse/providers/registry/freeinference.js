export default {
  id: "freeinference",
  priority: 110,
  alias: "freeinference",
  passthroughModels: true,
  
  
  display: {
    name: "FreeInference",
    icon: "hub",
    color: "#10B981",
    textIcon: "FR",
    website: "https://freeinference.org",
    notice: {
      desc: "Free research access without a card; non-Harvard applicants require manual approval and no numeric quota is publicly guaranteed.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://freeinference.org/v1/chat/completions",
    validateUrl: "https://freeinference.org/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "FreeInference Default Model"
    }
],
  serviceKinds: ["llm"],
};
