export default {
  id: "apmix",
  priority: 110,
  alias: "apmix",
  passthroughModels: true,
  
  
  display: {
    name: "Apmix",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "AP",
    website: "https://apmix.ai",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.apmix.ai/v1/chat/completions",
    validateUrl: "https://api.apmix.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "claude-haiku-4-5",
        "name": "claude haiku 4 5"
    },
    {
        "id": "claude-sonnet-5",
        "name": "claude sonnet 5"
    },
    {
        "id": "claude-opus-5",
        "name": "claude opus 5"
    },
    {
        "id": "claude-opus-4-8",
        "name": "claude opus 4 8"
    },
    {
        "id": "claude-opus-4-7",
        "name": "claude opus 4 7"
    },
    {
        "id": "claude-opus-4-6",
        "name": "claude opus 4 6"
    },
    {
        "id": "claude-fable-5",
        "name": "claude fable 5"
    },
    {
        "id": "claude-sonnet-4-6",
        "name": "claude sonnet 4 6"
    },
    {
        "id": "gpt-5.6-terra",
        "name": "gpt 5.6 terra"
    },
    {
        "id": "gpt-5.6-sol",
        "name": "gpt 5.6 sol"
    },
    {
        "id": "gpt-5.6-luna",
        "name": "gpt 5.6 luna"
    },
    {
        "id": "gpt-5.5",
        "name": "gpt 5.5"
    },
    {
        "id": "gpt-6-astra",
        "name": "gpt 6 astra"
    },
    {
        "id": "gpt-6-sol",
        "name": "gpt 6 sol"
    },
    {
        "id": "gpt-6-luna",
        "name": "gpt 6 luna"
    }
],
  serviceKinds: ["llm"],
};
