export default {
  id: "iflytek",
  priority: 110,
  alias: "iflytek",
  passthroughModels: true,
  
  
  display: {
    name: "iFlytek Spark",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "IF",
    website: "https://xinghuo.xfyun.cn",
    notice: {
      desc: "Get API key at console.xfyun.cn",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://spark-api-open.xf-yun.com/v1/chat/completions",
    validateUrl: "https://spark-api-open.xf-yun.com/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "4.0Ultra",
        "name": "Spark 4.0 Ultra"
    },
    {
        "id": "generalv3.5",
        "name": "Spark Max (V3.5)"
    },
    {
        "id": "max-32k",
        "name": "Spark Max 32K"
    },
    {
        "id": "generalv3",
        "name": "Spark Pro"
    },
    {
        "id": "pro-128k",
        "name": "Spark Pro 128K"
    },
    {
        "id": "lite",
        "name": "Spark Lite"
    }
],
  serviceKinds: ["llm"],
};
