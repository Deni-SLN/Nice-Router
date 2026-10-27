export default {
  id: "unorouter",
  priority: 110,
  alias: "unorouter",
  passthroughModels: true,
  
  
  display: {
    name: "UnoRouter",
    icon: "hub",
    color: "#84CC16",
    textIcon: "UN",
    website: "https://unorouter.ai",
    notice: {
      desc: "Models with the :free suffix do not debit balance; limit is 1 request/minute per free model per user.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.unorouter.com/v1/chat/completions",
    validateUrl: "https://api.unorouter.com/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "UnoRouter Default Model"
    }
],
  serviceKinds: ["llm"],
};
