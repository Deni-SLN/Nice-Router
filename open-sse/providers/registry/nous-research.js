export default {
  id: "nous-research",
  priority: 110,
  alias: "nous",
  passthroughModels: true,
  
  
  display: {
    name: "Nous Research",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "NO",
    website: "https://portal.nousresearch.com/help",
    notice: {
      desc: "Use your Nous Portal API key. OmniRoute targets the official OpenAI-compatible inference endpoint at https://inference-api.nousresearch.com/v1.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://inference-api.nousresearch.com/v1/chat/completions",
    validateUrl: "https://inference-api.nousresearch.com/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "Hermes-4-405B",
        "name": "Hermes 4 405B (Nous Research)"
    },
    {
        "id": "Hermes-4-70B",
        "name": "Hermes 4 70B (Nous Research)"
    }
],
  serviceKinds: ["llm"],
};
