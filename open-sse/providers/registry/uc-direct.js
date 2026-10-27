export default {
  id: "uc-direct",
  priority: 110,
  alias: "ucd",
  passthroughModels: true,
  
  
  display: {
    name: "UC Direct (uncensored.com)",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "UC",
    website: "https://uncensored.com",
    notice: {
      desc: "Use your uncensored.com Developer API key (uai_sk_live_...). OmniRoute sends it as the X-api-key header to the OpenAI-compatible https://api.uncensored.com/api/v1 endpoint. The key never expires. This is the metered/credits surface; the un-metered subscription chat is the separate 'uc' provider.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.uncensored.com/api/v1",
    
    
    authHeader: "x-api-key",
  },
  models: [
    {
        "id": "claude-opus-5",
        "name": "Claude Opus 5"
    },
    {
        "id": "claude-opus-5-fast",
        "name": "Claude Opus 5 Fast"
    },
    {
        "id": "claude-fable-5",
        "name": "Claude Fable 5"
    },
    {
        "id": "claude-opus-4.8",
        "name": "Claude Opus 4.8"
    },
    {
        "id": "claude-opus-4.5",
        "name": "Claude Opus 4.5"
    },
    {
        "id": "claude-sonnet-4.5",
        "name": "Claude Sonnet 4.5"
    },
    {
        "id": "claude-haiku-4.5",
        "name": "Claude Haiku 4.5"
    },
    {
        "id": "claude-opus-4.7",
        "name": "Claude Opus 4.7"
    },
    {
        "id": "claude-opus-4.6",
        "name": "Claude Opus 4.6"
    },
    {
        "id": "claude-sonnet-4.6",
        "name": "Claude Sonnet 4.6"
    },
    {
        "id": "gpt-5.6-sol",
        "name": "GPT 5.6 Sol"
    },
    {
        "id": "gpt-5.6-terra",
        "name": "GPT 5.6 Terra"
    },
    {
        "id": "gpt-5.6-luna",
        "name": "GPT 5.6 Luna"
    },
    {
        "id": "gpt-4o",
        "name": "GPT 4o"
    },
    {
        "id": "gpt-4o-mini",
        "name": "GPT 4o Mini"
    }
],
  serviceKinds: ["llm"],
};
