export default {
  id: "udio",
  priority: 110,
  alias: "udio",
  passthroughModels: true,
  
  
  display: {
    name: "Udio",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "UD",
    website: "https://udio.com",
    notice: {
      desc: "Paste session cookie from udio.com (Supabase auth)",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://www.udio.com/api/generate-proxy",
    
    
    authHeader: "cookie",
  },
  models: [
    {
        "id": "udio-default",
        "name": "Udio Default"
    }
],
  serviceKinds: ["llm"],
};
