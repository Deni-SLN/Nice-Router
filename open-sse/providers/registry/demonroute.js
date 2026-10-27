export default {
  id: "demonroute",
  priority: 110,
  alias: "demonroute",
  passthroughModels: true,
  
  
  display: {
    name: "Demon Route",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "DE",
    website: "https://demonroute.com",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.demonroute.com/v1/chat/completions",
    validateUrl: "https://api.demonroute.com/v1/models",
    
    
  },
  models: [
    {
        "id": "dphn/Dolphin3.0-Llama3.1-8B",
        "name": "Dolphin 3.0 Llama 3.1 8B"
    },
    {
        "id": "dphn/Dolphin-Mistral-24B-Venice-Edition",
        "name": "Dolphin Mistral 24B Venice"
    },
    {
        "id": "TheDrummer/Artemis-31B-v1.2",
        "name": "Artemis 31B v1.2"
    },
    {
        "id": "TheDrummer/Cydonia-24B-v4.3",
        "name": "Cydonia 24B v4.3"
    },
    {
        "id": "huihui-ai/Huihui-Qwen3.6-35B-A3B-abliterated",
        "name": "Huihui Qwen 3.6 35B A3B Abliterated"
    },
    {
        "id": "huihui-ai/Huihui-gemma-4-31B-it-abliterated-v2",
        "name": "Huihui Gemma 4 31B Abliterated v2"
    },
    {
        "id": "dphn/dolphin-2.9.3-mistral-nemo-12b",
        "name": "Dolphin 2.9.3 Mistral Nemo 12B"
    }
],
  serviceKinds: ["llm"],
};
