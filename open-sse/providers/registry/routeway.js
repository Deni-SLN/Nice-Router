export default {
  id: "routeway",
  priority: 110,
  alias: "routeway",
  passthroughModels: true,
  
  
  display: {
    name: "Routeway",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "RO",
    website: "https://routeway.ai",
    notice: {
      desc: "Create a free API key at routeway.ai, then paste it here as a Bearer token.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.routeway.ai/v1/chat/completions",
    validateUrl: "https://api.routeway.ai/v1/models",
    
    
  },
  models: [
    {
        "id": "llama-3.3-70b-instruct:free",
        "name": "Llama 3.3 70B Instruct (free)"
    },
    {
        "id": "nemotron-3-nano-30b-a3b:free",
        "name": "Nemotron 3 Nano 30B (free)"
    },
    {
        "id": "nemotron-nano-9b-v2:free",
        "name": "Nemotron Nano 9B v2 (free)"
    },
    {
        "id": "step-3.7-flash:free",
        "name": "Step 3.7 Flash (free)"
    },
    {
        "id": "step-3.5-flash:free",
        "name": "Step 3.5 Flash (free)"
    },
    {
        "id": "laguna-m.1:free",
        "name": "Laguna M.1 (free)"
    },
    {
        "id": "laguna-xs.2:free",
        "name": "Laguna XS.2 (free)"
    },
    {
        "id": "llama-3.2-3b-instruct:free",
        "name": "Llama 3.2 3B Instruct (free)"
    }
],
  serviceKinds: ["llm"],
};
