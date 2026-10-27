export default {
  id: "beatapi",
  priority: 110,
  alias: "beatapi",
  passthroughModels: true,
  
  
  display: {
    name: "BeatAPI",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "BE",
    website: "https://beatapi.io",
    notice: {
      desc: "Create an API key at https://beatapi.io/dashboard/apikeys, then paste it here.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.beatapi.io/v1/chat/completions",
    validateUrl: "https://api.beatapi.io/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "BeatAPI Default Model"
    }
],
  serviceKinds: ["llm"],
};
