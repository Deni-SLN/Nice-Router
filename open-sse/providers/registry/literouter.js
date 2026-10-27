export default {
  id: "literouter",
  priority: 110,
  alias: "literouter",
  passthroughModels: true,
  
  
  display: {
    name: "LiteRouter",
    icon: "hub",
    color: "#6366F1",
    textIcon: "LI",
    website: "https://literouter.com",
    notice: {
      desc: "Free model variants use the :free suffix; daily credit limits vary by model and free input is capped at 5,000 tokens.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.literouter.com/v1/chat/completions",
    validateUrl: "https://api.literouter.com/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "LiteRouter Default Model"
    }
],
  serviceKinds: ["llm"],
};
