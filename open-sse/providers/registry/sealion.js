export default {
  id: "sealion",
  priority: 110,
  alias: "sealion",
  passthroughModels: true,
  
  
  display: {
    name: "SEA-LION",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "SE",
    website: "https://sea-lion.ai",
    notice: {
      desc: "Sign in at sea-lion.ai with Google (no card, no region wall), create an API key, then paste it here.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.sea-lion.ai/v1/chat/completions",
    validateUrl: "https://api.sea-lion.ai/v1/models",
    
    
  },
  models: [
    {
        "id": "aisingapore/Llama-SEA-LION-v3.5-70B-R",
        "name": "Llama SEA-LION v3.5 70B R"
    },
    {
        "id": "aisingapore/Llama-SEA-LION-v3-70B-IT",
        "name": "Llama SEA-LION v3 70B IT"
    },
    {
        "id": "aisingapore/Gemma-SEA-LION-v4-27B-IT",
        "name": "Gemma SEA-LION v4 27B IT"
    },
    {
        "id": "aisingapore/Qwen-SEA-LION-v4.5-27B-IT",
        "name": "Qwen SEA-LION v4.5 27B IT"
    },
    {
        "id": "aisingapore/Qwen-SEA-LION-v4-32B-IT",
        "name": "Qwen SEA-LION v4 32B IT"
    }
],
  serviceKinds: ["llm"],
};
