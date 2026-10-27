export default {
  id: "ofoxai",
  priority: 110,
  alias: "ofoxai",
  passthroughModels: true,
  
  
  display: {
    name: "OfoxAI",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "OF",
    website: "https://ofox.ai",
    notice: {
      desc: "The current catalog advertises 10+ free models without a public numeric quota; review upstream provenance, retention and training terms before production use.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.ofox.ai/v1/chat/completions",
    validateUrl: "https://api.ofox.ai/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "OfoxAI Default Model"
    }
],
  serviceKinds: ["llm"],
};
