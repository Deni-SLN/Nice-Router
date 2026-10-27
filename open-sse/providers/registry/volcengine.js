export default {
  id: "volcengine",
  priority: 110,
  alias: "volcengine",
  passthroughModels: true,
  
  
  display: {
    name: "Volcengine",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "VO",
    website: "https://www.volcengine.com",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    validateUrl: "https://ark.cn-beijing.volces.com/api/v3/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "deepseek-v3-2-251201",
        "name": "deepseek v3 2 251201"
    },
    {
        "id": "doubao-seed-2-0-pro-260215",
        "name": "doubao seed 2 0 pro 260215"
    },
    {
        "id": "doubao-seed-2-0-code-preview-260215",
        "name": "doubao seed 2 0 code preview 260215"
    },
    {
        "id": "kimi-k2-5-260127",
        "name": "kimi k2 5 260127"
    },
    {
        "id": "glm-4-7-251222",
        "name": "glm 4 7 251222"
    },
    {
        "id": "DeepSeek-V4-Flash",
        "name": "DeepSeek V4 Flash"
    },
    {
        "id": "DeepSeek-V4-Pro",
        "name": "DeepSeek V4 Pro"
    }
],
  serviceKinds: ["llm"],
};
