export default {
  id: "hyperagent",
  priority: 110,
  alias: "ha",
  passthroughModels: true,
  
  
  display: {
    name: "HyperAgent (Unofficial/Experimental)",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "HY",
    website: "https://hyperagent.com",
    notice: {
      desc: "Paste the full Cookie header from hyperagent.com (DevTools → Network → any request → Request Headers → Cookie). Session cookies power chat + billing usage.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://hyperagent.com/api/threads",
    
    
    authHeader: "cookie",
  },
  models: [
    {
        "id": "default",
        "name": "HyperAgent (Unofficial/Experimental) Default Model"
    }
],
  serviceKinds: ["llm"],
};
