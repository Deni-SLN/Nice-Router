export default {
  id: "speka",
  priority: 110,
  alias: "speka",
  passthroughModels: true,
  
  
  display: {
    name: "Speka AI",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "SP",
    website: "https://speka.me",
    notice: {
      desc: "Free plan: $1 monthly usage, 10 RPM, one API key and access to open models and the playground; no card required.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://speka.me/v1/chat/completions",
    validateUrl: "https://speka.me/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Speka AI Default Model"
    }
],
  serviceKinds: ["llm"],
};
