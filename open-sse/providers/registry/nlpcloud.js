export default {
  id: "nlpcloud",
  priority: 110,
  alias: "nlpc",
  passthroughModels: true,
  
  
  display: {
    name: "NLP Cloud",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "NL",
    website: "https://docs.nlpcloud.com",
    notice: {
      desc: "Use your NLP Cloud API key in Authorization: Token <key>. OmniRoute targets the chatbot endpoint on https://api.nlpcloud.io/v1/gpu/<model>/chatbot by default.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.nlpcloud.io/v1/gpu",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "chatdolphin",
        "name": "ChatDolphin"
    },
    {
        "id": "dolphin",
        "name": "Dolphin"
    },
    {
        "id": "finetuned-llama-3-70b",
        "name": "Fine-tuned LLaMA 3.3 70B"
    },
    {
        "id": "llama-3-1-405b",
        "name": "LLaMA 3.1 405B"
    },
    {
        "id": "llama-3-8b-instruct",
        "name": "Llama 3 8B"
    }
],
  serviceKinds: ["llm"],
};
