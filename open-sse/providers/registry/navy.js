export default {
  id: "navy",
  priority: 110,
  alias: "navy",
  passthroughModels: true,
  
  
  display: {
    name: "NavyAI",
    icon: "hub",
    color: "#14B8A6",
    textIcon: "NA",
    website: "https://api.navy",
    notice: {
      desc: "Create a free API key from the NavyAI dashboard, then paste it here as a Bearer token.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.navy/v1/chat/completions",
    validateUrl: "https://api.navy/v1/models",
    
    
  },
  models: [
    {
        "id": "llama-3.3-70b-instruct",
        "name": "Llama 3.3 70B Instruct"
    },
    {
        "id": "gemma-4-31b-it",
        "name": "Gemma 4 31B IT"
    },
    {
        "id": "deepseek-v4-flash",
        "name": "DeepSeek V4 Flash"
    },
    {
        "id": "deepseek-chat",
        "name": "DeepSeek Chat"
    },
    {
        "id": "mistral-small-latest",
        "name": "Mistral Small"
    },
    {
        "id": "llama-4-scout",
        "name": "Llama 4 Scout"
    }
],
  serviceKinds: ["llm"],
};
