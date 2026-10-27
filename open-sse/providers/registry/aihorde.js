export default {
  id: "aihorde",
  priority: 110,
  alias: "horde",
  passthroughModels: true,
  hasFree: true,
  noAuth: true,
  display: {
    name: "AI Horde",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "AI",
    website: "https://aihorde.net",
    notice: {
      desc: "No API key required — uses AI Horde's documented anonymous key. Adding a free aihorde.net key is optional and only buys higher queue priority (kudos).",
    },
  },
  category: "free",
  transport: {
    baseUrl: "https://oai.aihorde.net/v1/chat/completions",
    validateUrl: "https://oai.aihorde.net/v1/models",
    
    
  },
  models: [
    {
        "id": "aphrodite/TheDrummer/Cydonia-24B-v4.3",
        "name": "Cydonia 24B (AI Horde)"
    },
    {
        "id": "aphrodite/TheDrummer/Skyfall-31B-v4.2",
        "name": "Skyfall 31B (AI Horde)"
    },
    {
        "id": "google/gemma-4-31b",
        "name": "Gemma 4 31B (AI Horde)"
    }
],
  serviceKinds: ["llm"],
};
