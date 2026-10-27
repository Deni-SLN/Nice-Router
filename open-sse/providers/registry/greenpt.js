export default {
  id: "greenpt",
  priority: 110,
  alias: "greenpt",
  passthroughModels: true,
  
  
  display: {
    name: "GreenPT",
    icon: "hub",
    color: "#6366F1",
    textIcon: "GR",
    website: "https://greenpt.com",
    notice: {
      desc: "API subscription is free to create; inference is billed per token. No free inference allowance is published.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.greenpt.ai/v1/chat/completions",
    validateUrl: "https://api.greenpt.ai/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "GreenPT Default Model"
    }
],
  serviceKinds: ["llm"],
};
