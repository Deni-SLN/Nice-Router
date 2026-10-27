export default {
  id: "modelscope",
  priority: 110,
  alias: "ms",
  passthroughModels: true,
  
  
  display: {
    name: "ModelScope",
    icon: "hub",
    color: "#F97316",
    textIcon: "MO",
    website: "https://modelscope.cn",
    notice: {
      desc: "Free tier via ModelScope API-Inference — Alibaba account required.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api-inference.modelscope.cn/v1/chat/completions",
    validateUrl: "https://api-inference.modelscope.cn/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "ModelScope Default Model"
    }
],
  serviceKinds: ["llm"],
};
