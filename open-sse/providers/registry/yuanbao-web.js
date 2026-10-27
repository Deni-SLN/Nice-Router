export default {
  id: "yuanbao-web",
  priority: 110,
  alias: "ybw",
  passthroughModels: true,
  
  
  display: {
    name: "Tencent Yuanbao (Free)",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "TE",
    website: "https://yuanbao.tencent.com",
    notice: {
      desc: "Log in to yuanbao.tencent.com, then paste the full Cookie header (DevTools → Network → any /api request → Request Headers → Cookie). It must contain hy_user and hy_token.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://yuanbao.tencent.com/api/chat",
    
    
    authHeader: "cookie",
  },
  models: [
    {
        "id": "deepseek-v3",
        "name": "DeepSeek V3 (via Yuanbao)"
    },
    {
        "id": "deepseek-r1",
        "name": "DeepSeek R1 (via Yuanbao)"
    },
    {
        "id": "hunyuan",
        "name": "Hunyuan (via Yuanbao)"
    },
    {
        "id": "hunyuan-t1",
        "name": "Hunyuan T1 (via Yuanbao)"
    },
    {
        "id": "deepseek-v3-search",
        "name": "DeepSeek V3 + Web Search (via Yuanbao)"
    },
    {
        "id": "deepseek-r1-search",
        "name": "DeepSeek R1 + Web Search (via Yuanbao)"
    },
    {
        "id": "hunyuan-search",
        "name": "Hunyuan + Web Search (via Yuanbao)"
    },
    {
        "id": "hunyuan-t1-search",
        "name": "Hunyuan T1 + Web Search (via Yuanbao)"
    }
],
  serviceKinds: ["llm"],
};
