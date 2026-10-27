export default {
  id: "cloudcode-one",
  priority: 110,
  alias: "cloudcode-one",
  passthroughModels: true,
  
  
  display: {
    name: "CloudCode.ONE",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "CL",
    website: "https://cloudcode.one",
    notice: {
      desc: "Published free models include glm-4.7-flash and glm-4.6v-flash; no numeric quota is published, and key creation may require credit or a coupon.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.cloudcode.one/v1/chat/completions",
    validateUrl: "https://api.cloudcode.one/v1/models",
    
    
  },
  models: [
    {
        "id": "glm-4.7-flash",
        "name": "GLM 4.7 Flash"
    },
    {
        "id": "glm-4.6v-flash",
        "name": "GLM 4.6V Flash"
    }
],
  serviceKinds: ["llm"],
};
