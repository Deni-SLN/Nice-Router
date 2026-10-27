export default {
  id: "hcnsec",
  priority: 110,
  alias: "hcnsec",
  passthroughModels: true,
  
  
  display: {
    name: "Huancheng Public API",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "HU",
    website: "https://api.hcnsec.cn",
    notice: {
      desc: "Get API key at api.hcnsec.cn",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.hcnsec.cn/v1/chat/completions",
    validateUrl: "https://api.hcnsec.cn/v1/models",
    format: "claude",
    authHeader: "x-api-key",
  },
  models: [
    {
        "id": "default",
        "name": "Huancheng Public API Default Model"
    }
],
  serviceKinds: ["llm"],
};
