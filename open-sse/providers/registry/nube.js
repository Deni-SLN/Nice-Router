export default {
  id: "nube",
  priority: 110,
  alias: "nube",
  passthroughModels: true,
  
  
  display: {
    name: "Nube.sh",
    icon: "hub",
    color: "#14B8A6",
    textIcon: "NU",
    website: "https://nube.sh",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://ai.nube.sh/api/v1/chat/completions",
    validateUrl: "https://ai.nube.sh/api/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "Nube.sh Default Model"
    }
],
  serviceKinds: ["llm"],
};
