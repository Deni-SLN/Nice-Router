export default {
  id: "deepai",
  priority: 110,
  alias: "deepai",
  passthroughModels: true,
  
  
  display: {
    name: "DeepAI",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "DE",
    website: "https://deepai.org",
    notice: {
      desc: "Use your DeepAI API key. Get one at deepai.org — requires a Pro subscription ($9.99/mo).",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.deepai.org",
    
    format: "custom",
    authHeader: "api-key",
  },
  models: [
    {
        "id": "text2img",
        "name": "Text to Image"
    }
],
  serviceKinds: ["llm"],
};
