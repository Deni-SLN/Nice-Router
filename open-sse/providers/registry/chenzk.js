export default {
  id: "chenzk",
  priority: 110,
  alias: "chenzk",
  passthroughModels: true,
  
  
  display: {
    name: "Chenzk API",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "CH",
    website: "https://chenzk.top",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://chenzk.top/v1/chat/completions",
    validateUrl: "https://chenzk.top/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "Chenzk API Default Model"
    }
],
  serviceKinds: ["llm"],
};
