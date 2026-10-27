export default {
  id: "seekai",
  priority: 110,
  alias: "ska",
  passthroughModels: true,
  
  
  display: {
    name: "SeekAi",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "SE",
    website: "https://seekai.cc",
    notice: {
      desc: "Create an API key at https://seekai.cc, then paste it here as a Bearer token.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://seekai.cc/v1/chat/completions",
    validateUrl: "https://seekai.cc/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "SeekAi Default Model"
    }
],
  serviceKinds: ["llm"],
};
