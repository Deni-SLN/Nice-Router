export default {
  id: "xkiro",
  priority: 110,
  alias: "xkiro",
  passthroughModels: true,
  
  
  display: {
    name: "xKiro",
    icon: "hub",
    color: "#F97316",
    textIcon: "XK",
    website: "https://xkiro.com",
    notice: {
      desc: "Create a free account at xkiro.com and paste the key here (Bearer; x-api-key also accepted).",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.xkiro.com/v1/chat/completions",
    validateUrl: "https://api.xkiro.com/v1/models",
    
    
  },
  models: [
    {
        "id": "qwen/qwen3-vl-plus:free",
        "name": "Qwen3 VL Plus"
    },
    {
        "id": "sensenova/sensenova-6.8-flash-lite",
        "name": "SenseNova 6.8 Flash-Lite"
    },
    {
        "id": "minimax/minimax-m2.7:free",
        "name": "MiniMax M2.7"
    },
    {
        "id": "minimax/minimax-m2.7-highspeed:free",
        "name": "MiniMax M2.7 Highspeed"
    },
    {
        "id": "minimax/minimax-m2.5:free",
        "name": "MiniMax M2.5"
    },
    {
        "id": "minimax/minimax-m3:free",
        "name": "MiniMax M3"
    },
    {
        "id": "minimax/minimax-m2.1-highspeed:free",
        "name": "MiniMax M2.1 Highspeed"
    },
    {
        "id": "minimax/minimax-m2.5-highspeed:free",
        "name": "MiniMax M2.5 Highspeed"
    },
    {
        "id": "minimax/minimax-m2.1:free",
        "name": "MiniMax M2.1"
    },
    {
        "id": "minimax/minimax-m2:free",
        "name": "MiniMax M2"
    },
    {
        "id": "qwen/qwen3.5-flash:free",
        "name": "Qwen3.5 Flash"
    },
    {
        "id": "qwen/qwen3.6-plus:free",
        "name": "Qwen3.6 Plus"
    },
    {
        "id": "qwen/qwen3.5-397b-a17b:free",
        "name": "Qwen3.5 397B A17B"
    },
    {
        "id": "qwen/qwen3.5-omni-flash:free",
        "name": "Qwen3.5 Omni Flash"
    },
    {
        "id": "mistralai/mistral-large-2512",
        "name": "Mistral Large 3"
    }
],
  serviceKinds: ["llm"],
};
