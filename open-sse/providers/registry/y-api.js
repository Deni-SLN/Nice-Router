export default {
  id: "y-api",
  priority: 110,
  alias: "y-api",
  passthroughModels: true,
  
  
  display: {
    name: "Y-API",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "Y-",
    website: "https://y-api.bestvirtualgoods.com",
    notice: {
      desc: "4 of its 20 catalog models (deepseek/deepseek-v4-flash, minimax/minimax-m2.7, tencent/hy3, xiaomi/mimo-v2.5) are priced at 0 credit in the publisher's 2026-10-04 snapshot; the rest bill against prepaid credit, and signup grants a small credit whose amount is Y-API's to set. Y-API can withdraw a free model at any time — re-check https://y-api.bestvirtualgoods.com/pricing.json.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.y-api.bestvirtualgoods.com/v1/chat/completions",
    validateUrl: "https://api.y-api.bestvirtualgoods.com/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Y-API Default Model"
    }
],
  serviceKinds: ["llm"],
};
