export default {
  id: "g4f-pollinations",
  priority: 110,
  alias: "g4fpol",
  passthroughModels: true,
  
  
  display: {
    name: "g4f.space — Pollinations",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "G4",
    website: "https://g4f.space",
    notice: {
      desc: "Bake anonymous cake credits at g4f.dev/chat, or use a g4f.dev member key (create one at g4f.dev/members.html).",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://g4f.space/api/pollinations/v1/chat/completions",
    validateUrl: "https://g4f.space/api/pollinations/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "openai",
        "name": "OpenAI (g4f/Pollinations)"
    },
    {
        "id": "openai-fast",
        "name": "OpenAI Fast (g4f/Pollinations)"
    }
],
  serviceKinds: ["llm"],
};
