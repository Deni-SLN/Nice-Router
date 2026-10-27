export default {
  id: "ovhcloud",
  priority: 110,
  alias: "ovh",
  passthroughModels: true,
  
  
  display: {
    name: "OVHcloud AI",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "OV",
    website: "https://www.ovhcloud.com",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions",
    validateUrl: "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "Meta-Llama-3_3-70B-Instruct",
        "name": "Meta Llama 3_3 70B Instruct"
    },
    {
        "id": "Qwen2.5-Coder-32B-Instruct",
        "name": "Qwen2.5 Coder 32B Instruct"
    },
    {
        "id": "Mistral-Small-3.2-24B-Instruct-2506",
        "name": "Mistral Small 3.2 24B Instruct 2506"
    }
],
  serviceKinds: ["llm"],
};
