export default {
  id: "publicai",
  priority: 110,
  alias: "publicai",
  passthroughModels: true,
  
  
  display: {
    name: "PublicAI",
    icon: "hub",
    color: "#84CC16",
    textIcon: "PU",
    website: "https://publicai.co",
    notice: {
      desc: "Requires an API key — one-time signup credit, then paid",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.publicai.co/v1/chat/completions",
    validateUrl: "https://api.publicai.co/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "swiss-ai/apertus-70b-instruct",
        "name": "apertus 70b instruct"
    },
    {
        "id": "swiss-ai/Apertus-8B-Instruct-2509",
        "name": "Apertus 8B Instruct 2509"
    },
    {
        "id": "aisingapore/Qwen-SEA-LION-v4-32B-IT",
        "name": "Qwen SEA LION v4 32B IT"
    },
    {
        "id": "aisingapore/Gemma-SEA-LION-v4-27B-IT",
        "name": "Gemma SEA LION v4 27B IT"
    },
    {
        "id": "allenai/Olmo-3-32B-Think",
        "name": "Olmo 3 32B Think"
    },
    {
        "id": "allenai/Olmo-3-7B-Instruct",
        "name": "Olmo 3 7B Instruct"
    },
    {
        "id": "utter-project/EuroLLM-22B-Instruct-2512",
        "name": "EuroLLM 22B Instruct 2512"
    }
],
  serviceKinds: ["llm"],
};
