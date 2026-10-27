export default {
  id: "friendliai",
  priority: 110,
  alias: "friendli",
  passthroughModels: true,
  
  
  display: {
    name: "FriendliAI",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "FR",
    website: "https://friendli.ai",
    notice: {
      desc: "Free tier for serverless inference — no credit card required",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.friendli.ai/serverless/v1/chat/completions",
    validateUrl: "https://api.friendli.ai/serverless/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "meta-llama-3.1-70b-instruct",
        "name": "meta llama 3.1 70b instruct"
    },
    {
        "id": "meta-llama-3.1-8b-instruct",
        "name": "meta llama 3.1 8b instruct"
    }
],
  serviceKinds: ["llm"],
};
