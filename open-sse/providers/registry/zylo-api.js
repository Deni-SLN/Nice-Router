export default {
  id: "zylo-api",
  priority: 110,
  alias: "zylo",
  passthroughModels: true,
  
  
  display: {
    name: "Zylo API",
    icon: "hub",
    color: "#84CC16",
    textIcon: "ZY",
    website: "https://zyloai.net",
    notice: {
      desc: "Basic plan: 10 RPM, 7,200 requests/day and 200,000 tokens/day; limited to Basic text models.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.zyloai.net/v1/chat/completions",
    validateUrl: "https://api.zyloai.net/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Zylo API Default Model"
    }
],
  serviceKinds: ["llm"],
};
