export default {
  id: "bigmodel",
  priority: 110,
  alias: "bigmodel",
  passthroughModels: true,
  
  
  display: {
    name: "BigModel.cn (Zhipu)",
    icon: "hub",
    color: "#6366F1",
    textIcon: "BI",
    website: "https://open.bigmodel.cn",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    validateUrl: "https://open.bigmodel.cn/api/paas/v4/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "glm-5.3",
        "name": "GLM 5.3"
    },
    {
        "id": "glm-5.3-flash",
        "name": "GLM 5.3 Flash"
    },
    {
        "id": "glm-5.2",
        "name": "GLM 5.2"
    },
    {
        "id": "glm-5.1",
        "name": "GLM 5.1"
    },
    {
        "id": "glm-5-turbo",
        "name": "GLM 5 Turbo"
    },
    {
        "id": "glm-5",
        "name": "GLM 5"
    },
    {
        "id": "glm-4.7",
        "name": "GLM 4.7"
    },
    {
        "id": "glm-4.7-flash",
        "name": "GLM 4.7 Flash"
    },
    {
        "id": "glm-4.7-flashx",
        "name": "GLM 4.7 FlashX"
    },
    {
        "id": "glm-4.6",
        "name": "GLM 4.6"
    },
    {
        "id": "glm-4.5-air",
        "name": "GLM 4.5 Air"
    },
    {
        "id": "glm-4.5-airx",
        "name": "GLM 4.5 AirX"
    },
    {
        "id": "glm-4.5-flash",
        "name": "GLM 4.5 Flash"
    },
    {
        "id": "glm-4-flash-250414",
        "name": "GLM 4 Flash 250414"
    },
    {
        "id": "glm-4-flashx-250414",
        "name": "GLM 4 FlashX 250414"
    }
],
  serviceKinds: ["llm"],
};
