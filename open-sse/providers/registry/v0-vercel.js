export default {
  id: "v0-vercel",
  priority: 110,
  alias: "v0",
  passthroughModels: true,
  
  
  display: {
    name: "v0 (Vercel)",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "V0",
    website: "https://v0.dev",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.v0.dev/v1/chat/completions",
    validateUrl: "https://api.v0.dev/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "v0 (Vercel) Default Model"
    }
],
  serviceKinds: ["llm"],
};
