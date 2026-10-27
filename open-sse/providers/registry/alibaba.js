export default {
  id: "alibaba",
  priority: 102,
  alias: "ali",
  passthroughModels: true,
  display: {
    name: "Alibaba Cloud (DashScope)",
    icon: "cloud_queue",
    color: "#FF6600",
    textIcon: "AL",
    website: "https://dashscope-intl.aliyuncs.com",
    notice: {
      apiKeyUrl: "https://dashscope.console.aliyun.com/apiKey",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
    validateUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models",
  },
  models: [
    { id: "qwen-max", name: "Qwen Max" },
    { id: "qwen-plus", name: "Qwen Plus" },
    { id: "qwen-turbo", name: "Qwen Turbo" },
    { id: "qwen3-coder-plus", name: "Qwen3 Coder Plus" },
    { id: "qwq-plus", name: "QwQ Plus (Reasoning)" },
    { id: "qwq-32b", name: "QwQ 32B" },
    { id: "qwen3-32b", name: "Qwen3 32B" },
    { id: "qwen3-235b-a22b", name: "Qwen3 235B A22B" },
  ],
  serviceKinds: ["llm"],
};
