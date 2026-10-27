export default {
  id: "nanogpt",
  priority: 110,
  alias: "nanogpt",
  passthroughModels: true,
  
  
  display: {
    name: "NanoGPT",
    icon: "hub",
    color: "#10B981",
    textIcon: "NA",
    website: "https://nano-gpt.com",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://nano-gpt.com/api/v1/chat/completions",
    validateUrl: "https://nano-gpt.com/api/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "chatgpt-4o-latest",
        "name": "chatgpt 4o latest"
    },
    {
        "id": "claude-3.5-sonnet",
        "name": "claude 3.5 sonnet"
    },
    {
        "id": "gpt-4o-mini",
        "name": "gpt 4o mini"
    }
],
  serviceKinds: ["llm"],
};
