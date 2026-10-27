export default {
  id: "reka",
  priority: 110,
  alias: "reka",
  passthroughModels: true,
  
  
  display: {
    name: "Reka",
    icon: "hub",
    color: "#84CC16",
    textIcon: "RE",
    website: "https://docs.reka.ai/chat/overview",
    notice: {
      desc: "Use your Reka API key. OmniRoute supports the OpenAI-compatible base URL https://api.reka.ai/v1 and sends both Authorization and X-Api-Key headers for compatibility.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.reka.ai/v1/chat/completions",
    validateUrl: "https://api.reka.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "reka-flash-3",
        "name": "Reka Flash 3"
    },
    {
        "id": "reka-flash",
        "name": "Reka Flash"
    },
    {
        "id": "reka-edge-2603",
        "name": "Reka Edge 2603"
    }
],
  serviceKinds: ["llm"],
};
