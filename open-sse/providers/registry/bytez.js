export default {
  id: "bytez",
  priority: 110,
  alias: "bytez",
  passthroughModels: true,
  
  
  display: {
    name: "Bytez",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "BY",
    website: "https://bytez.com",
    notice: {
      desc: "$1 free credits, refreshes every 4 weeks",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.bytez.com/models/v2/openai/v1/chat/completions",
    validateUrl: "https://api.bytez.com/models/v2/openai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "meta-llama/Llama-3.3-70B-Instruct",
        "name": "Llama 3.3 70B Instruct"
    },
    {
        "id": "mistralai/Mistral-7B-Instruct-v0.3",
        "name": "Mistral 7B Instruct v0.3"
    },
    {
        "id": "Qwen/Qwen2.5-72B-Instruct",
        "name": "Qwen2.5 72B Instruct"
    }
],
  serviceKinds: ["llm"],
};
