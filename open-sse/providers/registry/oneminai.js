export default {
  id: "oneminai",
  priority: 110,
  alias: "1min",
  passthroughModels: true,
  
  
  display: {
    name: "1min.AI",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "1M",
    website: "https://1min.ai",
    notice: {
      desc: "Create an API key at https://docs.1min.ai/docs/api/create-api-key, then paste it here.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.1min.ai/api/chat-with-ai",
    
    
    authHeader: "api-key",
  },
  models: [
    {
        "id": "gpt-4o-mini",
        "name": "GPT-4o Mini"
    }
],
  serviceKinds: ["llm"],
};
