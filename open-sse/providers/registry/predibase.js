export default {
  id: "predibase",
  priority: 110,
  alias: "predibase",
  passthroughModels: true,
  
  
  display: {
    name: "Predibase",
    icon: "hub",
    color: "#10B981",
    textIcon: "PR",
    website: "https://predibase.com",
    notice: {
      desc: "⚠️ **DEPRECATED.** serving.app.predibase.com no longer resolves (sweep 2026-06-19); the managed serving API appears discontinued.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://serving.app.predibase.com/v1/chat/completions",
    validateUrl: "https://serving.app.predibase.com/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "llama-3.3-70b",
        "name": "llama 3.3 70b"
    }
],
  serviceKinds: ["llm"],
};
