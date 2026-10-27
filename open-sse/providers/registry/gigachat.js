export default {
  id: "gigachat",
  priority: 110,
  alias: "gigachat",
  passthroughModels: true,
  
  
  display: {
    name: "GigaChat (Sber)",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "GI",
    website: "https://developers.sber.ru",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://gigachat.devices.sberbank.ru/api/v1",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "GigaChat-2-Max",
        "name": "GigaChat 2 Max"
    },
    {
        "id": "GigaChat-2-Pro",
        "name": "GigaChat 2 Pro"
    },
    {
        "id": "GigaChat-2-Lite",
        "name": "GigaChat 2 Lite"
    }
],
  serviceKinds: ["llm"],
};
