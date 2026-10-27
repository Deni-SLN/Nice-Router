export default {
  id: "cloudflare-playground",
  priority: 110,
  alias: "cfp",
  passthroughModels: true,
  hasFree: true,
  noAuth: true,
  display: {
    name: "Cloudflare AI Playground",
    icon: "hub",
    color: "#84CC16",
    textIcon: "CL",
    website: "https://playground.ai.cloudflare.com",
    notice: {
      desc: "No credentials required — anonymous browser sessions over a reverse-engineered cf_agent WebSocket protocol (Playwright transport).",
    },
  },
  category: "free",
  transport: {
    baseUrl: "https://playground.ai.cloudflare.com",
    
    
    authHeader: "none",
  },
  models: [
    {
        "id": "zai-org/glm-5.2",
        "name": "GLM 5.2 (Z.ai)"
    },
    {
        "id": "moonshotai/kimi-k2.7-code",
        "name": "Kimi K2.7 Code (Moonshot)"
    },
    {
        "id": "moonshotai/kimi-k2.6",
        "name": "Kimi K2.6 (Moonshot)"
    },
    {
        "id": "deepseek-ai/deepseek-v4-pro-0813",
        "name": "DeepSeek V4 Pro (DeepSeek)"
    },
    {
        "id": "deepseek-ai/deepseek-v4-flash-0731",
        "name": "DeepSeek V4 Flash (DeepSeek)"
    },
    {
        "id": "zai-org/glm-4.7-flash",
        "name": "GLM 4.7 Flash (Z.ai)"
    },
    {
        "id": "openai/gpt-oss-120b",
        "name": "GPT-OSS 120B (OpenAI)"
    },
    {
        "id": "openai/gpt-oss-20b",
        "name": "GPT-OSS 20B (OpenAI)"
    },
    {
        "id": "meta-llama/llama-3.3-70b-instruct-fp8-fast",
        "name": "Llama 3.3 70B Instruct (Meta)"
    },
    {
        "id": "meta/llama-3.1-8b-instruct-fp8",
        "name": "Llama 3.1 8B Instruct (Meta)"
    },
    {
        "id": "meta/llama-4-scout-17b-16e-instruct",
        "name": "Llama 4 Scout 17B (Meta)"
    },
    {
        "id": "nvidia/nemotron-3-120b-a12b",
        "name": "Nemotron 3 120B (NVIDIA)"
    },
    {
        "id": "qwen/qwen2.5-coder-32b-instruct",
        "name": "Qwen2.5 Coder 32B (Qwen)"
    },
    {
        "id": "qwen/qwen3-30b-a3b-fp8",
        "name": "Qwen3 30B A3B (Qwen)"
    },
    {
        "id": "qwen/qwq-32b",
        "name": "QwQ 32B (Qwen)"
    }
],
  serviceKinds: ["llm"],
};
