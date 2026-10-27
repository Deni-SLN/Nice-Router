export default {
  id: "wafer",
  priority: 110,
  alias: "wafer",
  passthroughModels: true,
  
  
  display: {
    name: "Wafer AI",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "WA",
    website: "https://wafer.ai",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://pass.wafer.ai/v1/messages",
    
    format: "claude",
    authHeader: "bearer",
  },
  models: [
    {
        "id": "DeepSeek-V4-Pro",
        "name": "DeepSeek V4 Pro"
    },
    {
        "id": "MiniMax-M2.7",
        "name": "MiniMax M2.7"
    },
    {
        "id": "Qwen3.5-397B-A17B",
        "name": "Qwen3.5 397B A17B"
    },
    {
        "id": "GLM-5.1",
        "name": "GLM 5.1"
    }
],
  serviceKinds: ["llm"],
};
