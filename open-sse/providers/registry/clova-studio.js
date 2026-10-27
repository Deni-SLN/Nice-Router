export default {
  id: "clova-studio",
  priority: 110,
  alias: "clova",
  passthroughModels: true,
  
  
  display: {
    name: "Naver CLOVA Studio",
    icon: "hub",
    color: "#EC4899",
    textIcon: "NA",
    website: "https://api.ncloud-docs.com/docs/en/ai-naver-clovastudio-summary",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://clovastudio.stream.ntruss.com/v3/chat-completions",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "HCX-007",
        "name": "HCX-007"
    },
    {
        "id": "HCX-005",
        "name": "HCX-005"
    },
    {
        "id": "HCX-DASH-002",
        "name": "HCX-DASH-002"
    }
],
  serviceKinds: ["llm"],
};
