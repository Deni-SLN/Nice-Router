export default {
  id: "logfare",
  priority: 110,
  alias: "logfare",
  passthroughModels: true,
  
  
  display: {
    name: "Logfare",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "LO",
    website: "https://logfare.ai",
    notice: {
      desc: "Create a free account at https://logfare.ai/register (username/password, no email verification) to get an instant API key, then paste it here as a Bearer token.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://logfare.ai/v1/chat/completions",
    validateUrl: "https://logfare.ai/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Logfare Default Model"
    }
],
  serviceKinds: ["llm"],
};
