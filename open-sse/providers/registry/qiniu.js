export default {
  id: "qiniu",
  priority: 110,
  alias: "qiniu",
  passthroughModels: true,
  
  
  display: {
    name: "Qiniu",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "QI",
    website: "https://www.qiniu.com",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.qnaigc.com/v1/chat/completions",
    validateUrl: "https://api.qnaigc.com/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "Qiniu Default Model"
    }
],
  serviceKinds: ["llm"],
};
