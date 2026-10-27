export default {
  id: "llmgateway",
  priority: 110,
  alias: "llmgateway",
  passthroughModels: true,
  
  
  display: {
    name: "LLM Gateway",
    icon: "hub",
    color: "#10B981",
    textIcon: "LL",
    website: "https://llmgateway.io",
    notice: {
      desc: "Hosted Free plan: free-priced models are limited to 5 requests per 10 minutes when the account has no credits.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.llmgateway.io/v1/chat/completions",
    validateUrl: "https://api.llmgateway.io/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "LLM Gateway Default Model"
    }
],
  serviceKinds: ["llm"],
};
