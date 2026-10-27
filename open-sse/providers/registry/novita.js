export default {
  id: "novita",
  priority: 103,
  alias: "novita",
  passthroughModels: true,
  display: {
    name: "Novita AI",
    icon: "auto_awesome",
    color: "#FF4081",
    textIcon: "NV",
    website: "https://novita.ai",
    notice: {
      apiKeyUrl: "https://novita.ai/settings/key-management",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.novita.ai/v3/openai/chat/completions",
    validateUrl: "https://api.novita.ai/v3/openai/models",
  },
  models: [
    { id: "deepseek/deepseek-r1", name: "DeepSeek R1" },
    { id: "deepseek/deepseek-v3", name: "DeepSeek V3" },
    { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B" },
    { id: "mistralai/mistral-nemo", name: "Mistral Nemo" },
  ],
  serviceKinds: ["llm"],
};
