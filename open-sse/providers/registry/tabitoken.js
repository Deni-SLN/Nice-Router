export default {
  id: "tabitoken",
  priority: 110,
  alias: "tabitoken",
  passthroughModels: true,
  
  
  display: {
    name: "TabiToken",
    icon: "hub",
    color: "#84CC16",
    textIcon: "TA",
    website: "https://tabitoken.com",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://tabitoken.com/v1/messages",
    
    format: "claude",
    authHeader: "x-api-key",
  },
  models: [
    {
        "id": "claude-opus-5",
        "name": "Claude Opus 5"
    },
    {
        "id": "claude-opus-5-thinking",
        "name": "Claude Opus 5 (Thinking)"
    },
    {
        "id": "claude-opus-4-8",
        "name": "Claude Opus 4.8"
    },
    {
        "id": "claude-opus-4-8-thinking",
        "name": "Claude Opus 4.8 (Thinking)"
    }
],
  serviceKinds: ["llm"],
};
