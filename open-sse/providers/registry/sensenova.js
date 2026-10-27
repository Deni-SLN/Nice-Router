export default {
  id: "sensenova",
  priority: 110,
  alias: "sensenova",
  passthroughModels: true,
  
  
  display: {
    name: "SenseNova",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "SE",
    website: "https://platform.sensenova.cn",
    notice: {
      desc: "Get API key at platform.sensenova.cn",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://token.sensenova.cn/v1/chat/completions",
    validateUrl: "https://token.sensenova.cn/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "sensenova-6.7-flash-lite",
        "name": "SenseNova 6.7 Flash-Lite"
    },
    {
        "id": "deepseek-v4-flash",
        "name": "DeepSeek V4 Flash"
    },
    {
        "id": "glm-5.2",
        "name": "GLM 5.2"
    }
],
  serviceKinds: ["llm"],
};
