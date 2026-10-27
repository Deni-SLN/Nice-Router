export default {
  id: "deepinfra",
  priority: 110,
  alias: "deepinfra",
  passthroughModels: true,
  
  
  display: {
    name: "DeepInfra",
    icon: "hub",
    color: "#14B8A6",
    textIcon: "DE",
    website: "https://deepinfra.com",
    notice: {
      desc: "Free signup credits for API testing and model exploration",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.deepinfra.com/v1/openai/chat/completions",
    validateUrl: "https://api.deepinfra.com/v1/openai/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "anthropic/claude-4-opus",
        "name": "claude 4 opus"
    },
    {
        "id": "anthropic/claude-4-sonnet",
        "name": "claude 4 sonnet"
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
        "id": "google/gemma-4-31B-it",
        "name": "gemma 4 31B it"
    },
    {
        "id": "google/gemma-4-26B-A4B-it",
        "name": "gemma 4 26B A4B it"
    },
    {
        "id": "nvidia/NVIDIA-Nemotron-3-Super-120B-A12B",
        "name": "NVIDIA Nemotron 3 Super 120B A12B"
    },
    {
        "id": "nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning",
        "name": "Nemotron 3 Nano Omni 30B A3B Reasoning"
    },
    {
        "id": "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
        "name": "Llama 4 Maverick 17B 128E Instruct FP8"
    },
    {
        "id": "meta-llama/Llama-4-Scout-17B-16E-Instruct",
        "name": "Llama 4 Scout 17B 16E Instruct"
    },
    {
        "id": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        "name": "Llama 3.3 70B Instruct Turbo"
    },
    {
        "id": "NousResearch/Hermes-3-Llama-3.1-405B",
        "name": "Hermes 3 Llama 3.1 405B"
    },
    {
        "id": "deepseek-ai/DeepSeek-V4-Pro",
        "name": "DeepSeek V4 Pro"
    },
    {
        "id": "deepseek-ai/DeepSeek-V4-Flash",
        "name": "DeepSeek V4 Flash"
    },
    {
        "id": "zai-org/GLM-5.1",
        "name": "GLM 5.1"
    }
],
  serviceKinds: ["llm"],
};
