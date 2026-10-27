export default {
  id: "meta-llama",
  priority: 110,
  alias: "meta",
  passthroughModels: true,
  
  
  display: {
    name: "Meta Llama API",
    icon: "hub",
    color: "#F97316",
    textIcon: "ME",
    website: "https://llama.developer.meta.com",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.llama.com/compat/v1/chat/completions",
    validateUrl: "https://api.llama.com/compat/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "Meta Llama API Default Model"
    }
],
  serviceKinds: ["llm"],
};
