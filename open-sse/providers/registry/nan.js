export default {
  id: "nan",
  priority: 110,
  alias: "nan",
  passthroughModels: true,
  
  
  display: {
    name: "NaN.Builders",
    icon: "hub",
    color: "#F97316",
    textIcon: "NA",
    website: "https://nan.builders",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.nan.builders/v1/chat/completions",
    validateUrl: "https://api.nan.builders/v1/models",
    
    
  },
  models: [
    {
        "id": "deepseek-v4-flash",
        "name": "DeepSeek V4 Flash"
    },
    {
        "id": "mimo-v2.5",
        "name": "MiMo V2.5"
    },
    {
        "id": "mimo-v2.6-flash",
        "name": "MiMo V2.6 Flash"
    },
    {
        "id": "qwen3.8-flash",
        "name": "Qwen3.8 Flash"
    },
    {
        "id": "qwen3.6",
        "name": "Qwen3.6"
    },
    {
        "id": "glm5.3",
        "name": "GLM 5.3"
    },
    {
        "id": "glm5.3-flash",
        "name": "GLM 5.3 Flash"
    },
    {
        "id": "gemma4",
        "name": "Gemma 4"
    }
],
  serviceKinds: ["llm"],
};
