export default {
  id: "qianfan",
  priority: 110,
  alias: "qianfan",
  passthroughModels: true,
  
  
  display: {
    name: "Baidu Qianfan",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "BA",
    website: "https://cloud.baidu.com/product-s/qianfan_home",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://qianfan.baidubce.com/v2/chat/completions",
    validateUrl: "https://qianfan.baidubce.com/v2/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "ernie-5.1",
        "name": "ERNIE 5.1"
    },
    {
        "id": "ernie-5.0-thinking-latest",
        "name": "ERNIE 5.0 Thinking Latest"
    },
    {
        "id": "ernie-x1.1",
        "name": "ERNIE X1.1"
    }
],
  serviceKinds: ["llm"],
};
