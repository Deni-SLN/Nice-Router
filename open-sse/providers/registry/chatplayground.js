export default {
  id: "chatplayground",
  priority: 110,
  alias: "cpl",
  passthroughModels: true,
  
  
  display: {
    name: "ChatPlayground",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "CH",
    website: "https://web.chatplayground.ai",
    notice: {
      desc: "Paste your Clerk session token or full cookie export containing __client and __session from web.chatplayground.ai. OmniRoute auto-mints fresh short-lived Clerk session JWTs.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://app.chatplayground.ai/api/chat",
    
    
    authHeader: "cookie",
  },
  models: [
    {
        "id": "default",
        "name": "ChatPlayground Default Model"
    }
],
  serviceKinds: ["llm"],
};
