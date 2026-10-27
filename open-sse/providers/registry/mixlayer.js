export default {
  id: "mixlayer",
  priority: 110,
  alias: "mixlayer",
  passthroughModels: true,
  
  
  display: {
    name: "Mixlayer",
    icon: "hub",
    color: "#10B981",
    textIcon: "MI",
    website: "https://www.mixlayer.com",
    notice: {
      desc: "The qwen/qwen3.5-4b-free model is free for prototyping and rate-limited; no fixed public RPM or daily quota is confirmed.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://models.mixlayer.ai/v1/chat/completions",
    validateUrl: "https://models.mixlayer.ai/v1/models",
    
    
  },
  models: [
    {
        "id": "qwen/qwen3.5-4b-free",
        "name": "Qwen 3.5 4B (free)"
    }
],
  serviceKinds: ["llm"],
};
