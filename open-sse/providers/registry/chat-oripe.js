export default {
  id: "chat-oripe",
  priority: 110,
  alias: "chat-oripe",
  passthroughModels: true,
  
  
  display: {
    name: "Chat Oripe",
    icon: "hub",
    color: "#EC4899",
    textIcon: "CH",
    website: "https://api.oriper.com",
    notice: {
      desc: "Official metadata advertises 2M tokens/month, but the public site and documentation were blocked during audit; treat the quota and brand mapping as unconfirmed.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.oriper.com/v1/chat/completions",
    validateUrl: "https://api.oriper.com/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Chat Oripe Default Model"
    }
],
  serviceKinds: ["llm"],
};
