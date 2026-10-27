export default {
  id: "helixmind",
  priority: 110,
  alias: "helixmind",
  passthroughModels: true,
  
  
  display: {
    name: "HelixMind",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "HE",
    website: "https://helixmind.online",
    notice: {
      desc: "Previously circulated 3 RPM/50 RPD and no-card claims were not confirmed during the 2026-08-02 audit; current quota and billing require account verification.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://helixmind.online/v1/chat/completions",
    validateUrl: "https://helixmind.online/v1/models",
    format: "claude",
    authHeader: "x-api-key",
  },
  models: [
    {
        "id": "default",
        "name": "HelixMind Default Model"
    }
],
  serviceKinds: ["llm"],
};
