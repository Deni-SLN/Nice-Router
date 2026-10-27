export default {
  id: "freemodel-dev",
  priority: 110,
  alias: "fmd",
  passthroughModels: true,
  
  
  display: {
    name: "FreeModel.dev",
    icon: "hub",
    color: "#84CC16",
    textIcon: "FR",
    website: "https://freemodel.dev",
    notice: {
      desc: "$300 free credits on signup — no credit card required. Access GPT-5.4 and GPT-5.5 (OpenAI's latest flagship models) through an OpenAI-compatible API.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.freemodel.dev/v1/chat/completions",
    validateUrl: "https://api.freemodel.dev/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "gpt-5.5",
        "name": "GPT-5.5"
    },
    {
        "id": "gpt-5.4",
        "name": "GPT-5.4"
    },
    {
        "id": "gpt-5.4-mini",
        "name": "GPT-5.4 Mini"
    },
    {
        "id": "gpt-5.3-codex",
        "name": "GPT-5.3 Codex"
    }
],
  serviceKinds: ["llm"],
};
