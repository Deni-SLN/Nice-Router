export default {
  id: "agentrouter",
  priority: 110,
  alias: "agentrouter",
  passthroughModels: true,
  
  
  display: {
    name: "AgentRouter",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "AG",
    website: "https://agentrouter.org",
    notice: {
      desc: "$200 free credits on signup - multi-model routing gateway",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://agentrouter.org/v1/messages",
    
    format: "claude",
    authHeader: "x-api-key",
  },
  models: [
    {
        "id": "claude-opus-4-8",
        "name": "Claude Opus 4.8"
    },
    {
        "id": "claude-opus-5",
        "name": "Claude Opus 5"
    },
    {
        "id": "gpt-5.6-sol",
        "name": "GPT-5.6 Sol"
    }
],
  serviceKinds: ["llm"],
};
