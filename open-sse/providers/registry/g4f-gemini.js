export default {
  id: "g4f-gemini",
  priority: 110,
  alias: "g4fgem",
  passthroughModels: true,
  
  
  display: {
    name: "g4f.space — Gemini",
    icon: "hub",
    color: "#84CC16",
    textIcon: "G4",
    website: "https://g4f.space",
    notice: {
      desc: "Bake anonymous cake credits at g4f.dev/chat, or use a g4f.dev member key (create one at g4f.dev/members.html).",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://g4f.space/api/gemini/v1/chat/completions",
    validateUrl: "https://g4f.space/api/gemini/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "models/gemini-2.5-flash",
        "name": "Gemini 2.5 Flash (g4f)"
    },
    {
        "id": "models/gemini-2.5-pro",
        "name": "Gemini 2.5 Pro (g4f)"
    }
],
  serviceKinds: ["llm"],
};
