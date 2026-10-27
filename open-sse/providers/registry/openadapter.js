export default {
  id: "openadapter",
  priority: 110,
  alias: "oad",
  passthroughModels: true,
  
  
  display: {
    name: "OpenAdapter",
    icon: "hub",
    color: "#10B981",
    textIcon: "OP",
    website: "https://openadapter.dev",
    notice: {
      desc: "Use your OpenAdapter API key in Authorization: Bearer sk-cv-<key>. Fully OpenAI-compatible. API base URL: https://api.openadapter.in/v1.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.openadapter.in/v1/chat/completions",
    validateUrl: "https://api.openadapter.in/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "glm-4.7",
        "name": "GLM 4.7 (OpenAdapter)"
    }
],
  serviceKinds: ["llm"],
};
