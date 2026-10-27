export default {
  id: "wandb",
  priority: 110,
  alias: "wandb",
  passthroughModels: true,
  
  
  display: {
    name: "Weights & Biases Inference",
    icon: "hub",
    color: "#EC4899",
    textIcon: "WE",
    website: "https://wandb.ai",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.inference.wandb.ai/v1/chat/completions",
    validateUrl: "https://api.inference.wandb.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "openai/gpt-oss-120b",
        "name": "gpt oss 120b"
    },
    {
        "id": "Qwen/Qwen3-Coder-480B-A35B-Instruct",
        "name": "Qwen3 Coder 480B A35B Instruct"
    },
    {
        "id": "deepseek-ai/DeepSeek-V3.1",
        "name": "DeepSeek V3.1"
    }
],
  serviceKinds: ["llm"],
};
