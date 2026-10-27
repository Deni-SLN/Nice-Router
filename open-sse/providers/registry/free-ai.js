export default {
  id: "free-ai",
  priority: 110,
  alias: "free-ai",
  passthroughModels: true,
  
  
  display: {
    name: "Free.ai",
    icon: "hub",
    color: "#F97316",
    textIcon: "FR",
    website: "https://free.ai",
    notice: {
      desc: "30,000 tokens/day cover self-hosted models after email verification. Usage beyond the pool can bill at raw cost, and premium external models are paid.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.free.ai/v1/chat/",
    
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Free.ai Default Model"
    }
],
  serviceKinds: ["llm"],
};
