export default {
  id: "g4f-groq",
  priority: 110,
  alias: "g4fgroq",
  passthroughModels: true,
  
  
  display: {
    name: "g4f.space — Groq",
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
    baseUrl: "https://g4f.space/api/groq/v1/chat/completions",
    validateUrl: "https://g4f.space/api/groq/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "llama-3.3-70b-versatile",
        "name": "Llama 3.3 70B (g4f/Groq)"
    },
    {
        "id": "llama-3.1-8b-instant",
        "name": "Llama 3.1 8B Instant (g4f/Groq)"
    }
],
  serviceKinds: ["llm"],
};
