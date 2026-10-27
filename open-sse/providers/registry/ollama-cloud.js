export default {
  id: "ollama-cloud",
  priority: 98,
  alias: "ollamacloud",
  display: {
    name: "Ollama Cloud",
    icon: "cloud",
    color: "#58A6FF",
    textIcon: "OC",
    website: "https://ollama.com",
    notice: {
      apiKeyUrl: "https://ollama.com/settings/api-keys",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://ollama.com/v1/chat/completions",
    validateUrl: "https://ollama.com/api/tags",
  },
  models: [
    { id: "gemma3:27b", name: "Gemma 3 27B" },
    { id: "llama3.3:70b", name: "Llama 3.3 70B" },
    { id: "qwen3:72b", name: "Qwen3 72B" },
    { id: "devstral:24b", name: "Devstral 24B" },
  ],
  serviceKinds: ["llm"],
};
