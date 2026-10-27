export default {
  id: "baichuan",
  priority: 110,
  alias: "baichuan",
  passthroughModels: true,
  
  
  display: {
    name: "Baichuan",
    icon: "hub",
    color: "#84CC16",
    textIcon: "BA",
    website: "https://www.baichuan-ai.com/",
    notice: {
      desc: "Get API key at platform.baichuan-ai.com",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.baichuan-ai.com/v1/chat/completions",
    validateUrl: "https://api.baichuan-ai.com/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "Baichuan4-Turbo",
        "name": "Baichuan 4 Turbo"
    },
    {
        "id": "Baichuan4-Air",
        "name": "Baichuan 4 Air"
    },
    {
        "id": "Baichuan4",
        "name": "Baichuan 4"
    },
    {
        "id": "Baichuan3-Turbo",
        "name": "Baichuan 3 Turbo"
    },
    {
        "id": "Baichuan3-Turbo-128k",
        "name": "Baichuan 3 Turbo 128k"
    }
],
  serviceKinds: ["llm"],
};
