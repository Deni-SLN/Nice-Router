export default {
  id: "sparkdesk",
  priority: 110,
  alias: "sparkdesk",
  passthroughModels: true,
  
  
  display: {
    name: "SparkDesk",
    icon: "hub",
    color: "#EC4899",
    textIcon: "SP",
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
