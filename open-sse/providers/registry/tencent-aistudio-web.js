export default {
  id: "tencent-aistudio-web",
  priority: 110,
  alias: "tasw",
  passthroughModels: true,
  
  
  display: {
    name: "Tencent AI Studio (Free)",
    icon: "hub",
    color: "#6366F1",
    textIcon: "TE",
    website: "https://aistudio.tencent.ai",
    notice: {
      desc: "Log in to aistudio.tencent.ai, open DevTools -> Network, copy any request Cookie header containing session tokens.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://aistudio.tencent.ai/api/chat",
    
    
    authHeader: "cookie",
  },
  models: [
    {
        "id": "hy3-g",
        "name": "HY3-G (via Tencent AI Studio)"
    },
    {
        "id": "hunyuan-default",
        "name": "Hunyuan Default (via Tencent AI Studio)"
    },
    {
        "id": "hunyuan-3d",
        "name": "Hunyuan 3D (via Tencent AI Studio)"
    }
],
  serviceKinds: ["llm"],
};
