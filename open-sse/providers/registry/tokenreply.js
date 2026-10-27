export default {
  id: "tokenreply",
  priority: 110,
  alias: "tokenreply",
  passthroughModels: true,
  
  
  display: {
    name: "TokenReply",
    icon: "hub",
    color: "#F97316",
    textIcon: "TO",
    website: "https://www.tokenreply.com",
    notice: {
      desc: "Free-tagged models have model- and campaign-specific daily limits; no fixed global free quota is published.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.tokenreply.com/v1/chat/completions",
    validateUrl: "https://api.tokenreply.com/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "TokenReply Default Model"
    }
],
  serviceKinds: ["llm"],
};
