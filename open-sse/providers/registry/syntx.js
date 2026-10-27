export default {
  id: "syntx",
  priority: 110,
  alias: "stx",
  passthroughModels: true,
  
  
  display: {
    name: "SYNTX.ai (Unofficial/Experimental)",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "SY",
    website: "https://syntx.ai",
    notice: {
      desc: "Paste the Authorization Bearer JWT from syntx.ai (DevTools → Network → api.syntx.ai → Request Headers). Chat, models, Limits, and media use this token.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.syntx.ai/api/v1",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "SYNTX.ai (Unofficial/Experimental) Default Model"
    }
],
  serviceKinds: ["llm"],
};
