export default {
  id: "openvecta",
  priority: 110,
  alias: "openvecta",
  passthroughModels: true,
  
  
  display: {
    name: "OpenVecta",
    icon: "hub",
    color: "#6366F1",
    textIcon: "OP",
    website: "https://openvecta.com",
    notice: {
      desc: "Free credits on signup for OpenAI-compatible inference across LLMs, embeddings, and reasoning models",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.openvecta.com/v1/chat/completions",
    validateUrl: "https://api.openvecta.com/v1/models",
    
    
  },
  models: [
    {
        "id": "glm-4.7-flash",
        "name": "GLM 4.7 Flash"
    },
    {
        "id": "claude-sonnet-4.6",
        "name": "Claude Sonnet 4.6"
    },
    {
        "id": "deepseek-v4-flash",
        "name": "DeepSeek V4 Flash"
    },
    {
        "id": "gpt-oss-120b",
        "name": "GPT OSS 120B"
    },
    {
        "id": "gemma-4-31b",
        "name": "Gemma 4 31B"
    },
    {
        "id": "kimi-k2.6",
        "name": "Kimi K2.6"
    },
    {
        "id": "llama-3.3-70b-instruct",
        "name": "Llama 3.3 70B Instruct"
    },
    {
        "id": "llama-4-maverick",
        "name": "Llama 4 Maverick"
    },
    {
        "id": "nemotron-3-super-120b",
        "name": "Nemotron 3 Super 120B"
    }
],
  serviceKinds: ["llm"],
};
