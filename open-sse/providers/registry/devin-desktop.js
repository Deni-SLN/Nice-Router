export default {
  id: "devin-desktop",
  priority: 110,
  alias: "—",
  passthroughModels: true,
  
  
  display: {
    name: "Devin Desktop",
    icon: "hub",
    color: "#84CC16",
    textIcon: "DE",
    website: "https://devin.ai",
    notice: {
      desc: "Paste an existing Devin API key from an authenticated Devin session. Key export availability and steps vary by Devin version and account.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://server.codeium.com",
    
    
    authHeader: "Authorization",
  },
  models: [
    {
        "id": "default",
        "name": "Devin Desktop Default Model"
    }
],
  serviceKinds: ["llm"],
};
