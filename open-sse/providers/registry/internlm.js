export default {
  id: "internlm",
  priority: 110,
  alias: "internlm",
  passthroughModels: true,
  
  
  display: {
    name: "InternLM (Intern-S1)",
    icon: "hub",
    color: "#84CC16",
    textIcon: "IN",
    website: "https://internlm.intern-ai.org.cn/",
    notice: {
      desc: "Free monthly quota ~1M input / 3M output tokens (~10 RPM)",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://chat.intern-ai.org.cn/api/v1/chat/completions",
    validateUrl: "https://chat.intern-ai.org.cn/api/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "intern-s1-pro",
        "name": "Intern-S1 Pro"
    },
    {
        "id": "intern-s1",
        "name": "Intern-S1"
    },
    {
        "id": "intern-s1-mini",
        "name": "Intern-S1 Mini"
    },
    {
        "id": "internvl3.5-latest",
        "name": "InternVL3.5 Latest"
    },
    {
        "id": "intern-latest",
        "name": "Intern Latest"
    }
],
  serviceKinds: ["llm"],
};
