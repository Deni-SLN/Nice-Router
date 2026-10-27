export default {
  id: "g4f-ollama",
  priority: 110,
  alias: "g4foll",
  passthroughModels: true,
  
  
  display: {
    name: "g4f.space — Ollama",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "G4",
    website: "https://g4f.space",
    notice: {
      desc: "Bake anonymous cake credits at g4f.dev/chat, or use a g4f.dev member key (create one at g4f.dev/members.html).",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://g4f.space/api/ollama/v1/chat/completions",
    validateUrl: "https://g4f.space/api/ollama/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "gemma3:4b",
        "name": "Gemma 3 4B (g4f/Ollama)"
    }
],
  serviceKinds: ["llm"],
};
