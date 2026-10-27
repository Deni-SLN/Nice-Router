export default {
  id: "qwen-cloud-token-plan",
  priority: 110,
  alias: "qct",
  passthroughModels: true,
  
  
  display: {
    name: "Qwen Cloud Token Plan",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "QW",
    website: "https://www.qwencloud.com/pricing/token-plan",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions",
    validateUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "qwen3.8-max",
        "name": "Qwen3.8 Max"
    },
    {
        "id": "qwen3.7-max",
        "name": "Qwen3.7 Max"
    },
    {
        "id": "qwen3.7-plus",
        "name": "Qwen3.7 Plus"
    },
    {
        "id": "qwen3.8-flash",
        "name": "Qwen3.8 Flash"
    },
    {
        "id": "qwen3.6-flash",
        "name": "Qwen3.6 Flash"
    },
    {
        "id": "glm-5.2",
        "name": "GLM 5.2"
    },
    {
        "id": "deepseek-v4-pro",
        "name": "DeepSeek V4 Pro"
    },
    {
        "id": "deepseek-v4.1-flash",
        "name": "DeepSeek V4.1 Flash"
    },
    {
        "id": "deepseek-v4-flash-0731",
        "name": "DeepSeek V4 Flash"
    }
],
  serviceKinds: ["llm"],
};
