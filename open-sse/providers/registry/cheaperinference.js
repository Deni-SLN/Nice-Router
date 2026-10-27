export default {
  id: "cheaperinference",
  priority: 110,
  alias: "cinf",
  passthroughModels: true,
  
  
  display: {
    name: "Cheaper Inference",
    icon: "hub",
    color: "#6366F1",
    textIcon: "CH",
    website: "https://cheaperinference.com/?utm_source=omniroute",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.cheaperinference.com/v1/chat/completions",
    validateUrl: "https://api.cheaperinference.com/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "aion-labs.aion-2-0",
        "name": "Aion 2.0"
    },
    {
        "id": "claude-fable-5",
        "name": "Claude Fable 5"
    },
    {
        "id": "claude-haiku-4.5",
        "name": "Claude Haiku 4.5"
    },
    {
        "id": "claude-opus-4-7-fast",
        "name": "Claude Opus 4.7 Fast"
    },
    {
        "id": "claude-opus-4-8-fast",
        "name": "Claude Opus 4.8 Fast"
    },
    {
        "id": "claude-opus-4.5",
        "name": "Claude Opus 4.5"
    },
    {
        "id": "claude-opus-4.6",
        "name": "Claude Opus 4.6"
    },
    {
        "id": "claude-opus-4.7",
        "name": "Claude Opus 4.7"
    },
    {
        "id": "claude-opus-4.8",
        "name": "Claude Opus 4.8"
    },
    {
        "id": "claude-opus-5",
        "name": "Claude Opus 5"
    },
    {
        "id": "claude-opus-5-fast",
        "name": "Claude Opus 5 Fast"
    },
    {
        "id": "claude-sonnet-4.5",
        "name": "Claude Sonnet 4.5"
    },
    {
        "id": "claude-sonnet-4.6",
        "name": "Claude Sonnet 4.6"
    },
    {
        "id": "claude-sonnet-5",
        "name": "Claude Sonnet 5"
    },
    {
        "id": "deepseek-v4-flash",
        "name": "DeepSeek V4 Flash"
    }
],
  serviceKinds: ["llm"],
};
