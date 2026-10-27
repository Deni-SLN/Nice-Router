export default {
  id: "nscale",
  priority: 110,
  alias: "nscale",
  passthroughModels: true,
  
  
  display: {
    name: "nScale",
    icon: "hub",
    color: "#14B8A6",
    textIcon: "NS",
    website: "https://nscale.com",
    notice: {
      desc: "$5 free credits on signup for inference testing",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://inference.api.nscale.com/v1/chat/completions",
    validateUrl: "https://inference.api.nscale.com/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "moonshotai/Kimi-K2.5",
        "name": "Kimi K2.5"
    },
    {
        "id": "Qwen/Qwen3-235B-A22B-Instruct-2507",
        "name": "Qwen3 235B A22B Instruct 2507"
    },
    {
        "id": "openai/gpt-oss-120b",
        "name": "gpt oss 120b"
    },
    {
        "id": "openai/gpt-oss-20b",
        "name": "gpt oss 20b"
    },
    {
        "id": "meta-llama/Llama-4-Scout-17B-16E-Instruct",
        "name": "Llama 4 Scout 17B 16E Instruct"
    },
    {
        "id": "meta-llama/Llama-3.3-70B-Instruct",
        "name": "Llama 3.3 70B Instruct"
    }
],
  serviceKinds: ["llm"],
};
