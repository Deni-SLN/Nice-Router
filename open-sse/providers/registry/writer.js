export default {
  id: "writer",
  priority: 110,
  alias: "writer",
  passthroughModels: true,
  
  
  display: {
    name: "Writer",
    icon: "hub",
    color: "#F97316",
    textIcon: "WR",
    website: "https://dev.writer.com",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.writer.com/v1/chat/completions",
    validateUrl: "https://api.writer.com/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "palmyra-x5",
        "name": "Palmyra X5"
    },
    {
        "id": "palmyra-x4",
        "name": "Palmyra X4"
    }
],
  serviceKinds: ["llm"],
};
