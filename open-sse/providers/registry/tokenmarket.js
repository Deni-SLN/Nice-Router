export default {
  id: "tokenmarket",
  priority: 110,
  alias: "tokenmarket",
  passthroughModels: true,
  
  
  display: {
    name: "Token Market",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "TO",
    website: "https://www.tokensmarket.ai",
    notice: {
      desc: "Create an API key in the Token Market console, then paste it here as a Bearer token.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.tokensmarket.ai/v1/chat/completions",
    validateUrl: "https://api.tokensmarket.ai/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Token Market Default Model"
    }
],
  serviceKinds: ["llm"],
};
