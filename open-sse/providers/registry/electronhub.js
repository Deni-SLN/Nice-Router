export default {
  id: "electronhub",
  priority: 110,
  alias: "electronhub",
  passthroughModels: true,
  
  
  display: {
    name: "Electron Hub",
    icon: "hub",
    color: "#84CC16",
    textIcon: "EL",
    website: "https://www.electronhub.ai",
    notice: {
      desc: "Free plan: 5 RPM, $0.25 weekly credits and 10 Neutrinos/day for :free models; family budgets also apply.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.electronhub.ai/v1/chat/completions",
    validateUrl: "https://api.electronhub.ai/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Electron Hub Default Model"
    }
],
  serviceKinds: ["llm"],
};
