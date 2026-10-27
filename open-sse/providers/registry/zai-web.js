export default {
  id: "zai-web",
  priority: 110,
  alias: "zw",
  passthroughModels: true,
  
  
  display: {
    name: "Z.ai Web",
    icon: "hub",
    color: "#84CC16",
    textIcon: "Z.",
    website: "https://chat.z.ai",
    notice: {
      desc: "Copy the \"token\" value from chat.z.ai → DevTools → Application → Local Storage. Do not copy cookies; OmniRoute handles the per-request CAPTCHA through its browser transport.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://chat.z.ai",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "glm-5.3-flash",
        "name": "GLM-5.3-Flash"
    },
    {
        "id": "glm-5.3",
        "name": "GLM-5.3"
    },
    {
        "id": "glm-5.2",
        "name": "GLM-5.2"
    }
],
  serviceKinds: ["llm"],
};
