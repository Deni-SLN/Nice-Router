export default {
  id: "scaleway",
  priority: 95,
  hasFree: true,
  alias: "scw",
  display: {
    name: "Scaleway AI",
    icon: "cloud",
    color: "#4F0599",
    textIcon: "SCW",
    website: "https://www.scaleway.com/en/ai/generative-apis/",
    freeNote: "1M free tokens for new accounts — EU/GDPR compliant (Paris)",
    notice: {
      apiKeyUrl: "https://console.scaleway.com/iam/api-keys",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.scaleway.ai/v1/chat/completions",
    validateUrl: "https://api.scaleway.ai/v1/models",
  },
  models: [
    { id: "qwen3-235b-a22b-instruct-2507", name: "Qwen3 235B A22B (1M free tok)" },
    { id: "llama-3.1-70b-instruct", name: "Llama 3.1 70B (EU)" },
    { id: "llama-3.1-8b-instruct", name: "Llama 3.1 8B (EU)" },
    { id: "mistral-small-3.2-24b-instruct-2506", name: "Mistral Small 3.2 (EU)" },
    { id: "deepseek-v3-0324", name: "DeepSeek V3 (EU)" },
    { id: "gpt-oss-120b", name: "GPT-OSS 120B (EU)" },
  ],
  serviceKinds: ["llm"],
};
