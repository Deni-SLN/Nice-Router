export default {
  id: "g4f-nvidia",
  priority: 110,
  alias: "g4fnv",
  passthroughModels: true,
  
  
  display: {
    name: "g4f.space — NVIDIA",
    icon: "hub",
    color: "#F97316",
    textIcon: "G4",
    website: "https://g4f.space",
    notice: {
      desc: "Bake anonymous cake credits at g4f.dev/chat, or use a g4f.dev member key (create one at g4f.dev/members.html).",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://g4f.space/api/nvidia/v1/chat/completions",
    validateUrl: "https://g4f.space/api/nvidia/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "nvidia/nemotron-3-nano-30b-a3b",
        "name": "Nemotron 3 Nano 30B (g4f/NVIDIA)"
    },
    {
        "id": "z-ai/glm-5.2",
        "name": "GLM 5.2 (g4f/NVIDIA)"
    },
    {
        "id": "minimaxai/minimax-m2.7",
        "name": "MiniMax M2.7 (g4f/NVIDIA)"
    }
],
  serviceKinds: ["llm"],
};
