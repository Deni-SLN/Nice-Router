export default {
  id: "baseten",
  priority: 110,
  alias: "baseten",
  passthroughModels: true,
  
  
  display: {
    name: "Baseten",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "BA",
    website: "https://baseten.co",
    notice: {
      desc: "$30 free trial credits for GPU inference",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://inference.baseten.co/v1/chat/completions",
    validateUrl: "https://inference.baseten.co/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "zai-org/GLM-5.3",
        "name": "GLM 5.3"
    },
    {
        "id": "GLM 5.3",
        "name": "GLM 5.3"
    },
    {
        "id": "zai-org/GLM-5.3-Fast",
        "name": "GLM 5.3 Fast"
    },
    {
        "id": "GLM 5.3 Fast",
        "name": "GLM 5.3 Fast"
    },
    {
        "id": "zai-org/GLM-5.3-Flash",
        "name": "GLM 5.3 Flash"
    },
    {
        "id": "GLM 5.3 Flash",
        "name": "GLM 5.3 Flash"
    },
    {
        "id": "zai-org/GLM-5.2",
        "name": "GLM 5.2"
    },
    {
        "id": "GLM 5.2",
        "name": "GLM 5.2"
    },
    {
        "id": "zai-org/GLM-5.2-Fast",
        "name": "GLM 5.2 Fast"
    },
    {
        "id": "GLM 5.2 Fast",
        "name": "GLM 5.2 Fast"
    },
    {
        "id": "zai-org/GLM-4.7",
        "name": "GLM 4.7"
    },
    {
        "id": "GLM 4.7",
        "name": "GLM 4.7"
    },
    {
        "id": "deepseek-ai/DeepSeek-V4-Pro",
        "name": "DeepSeek V4 Pro"
    },
    {
        "id": "DeepSeek V4 Pro",
        "name": "DeepSeek V4 Pro"
    },
    {
        "id": "deepseek-ai/DeepSeek-V4-Pro-0813",
        "name": "DeepSeek V4 Pro 0813"
    }
],
  serviceKinds: ["llm"],
};
