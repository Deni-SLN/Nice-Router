export default {
  id: "llm-kiwi",
  priority: 110,
  alias: "llmkiwi",
  passthroughModels: true,
  
  
  display: {
    name: "LLM.Kiwi",
    icon: "hub",
    color: "#EC4899",
    textIcon: "LL",
    website: "https://llm.kiwi",
    notice: {
      desc: "Free plan exposes auto and hrLLM; the published 40 requests/hour limit applies to hrLLM.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.llm.kiwi/v1/chat/completions",
    validateUrl: "https://api.llm.kiwi/v1/models",
    
    
  },
  models: [
    {
        "id": "auto",
        "name": "Auto"
    },
    {
        "id": "hrLLM",
        "name": "hrLLM"
    }
],
  serviceKinds: ["llm"],
};
