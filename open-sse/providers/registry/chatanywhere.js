export default {
  id: "chatanywhere",
  priority: 110,
  alias: "chatanywhere",
  passthroughModels: true,
  
  
  display: {
    name: "ChatAnywhere",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "CH",
    website: "https://chatanywhere.tech",
    notice: {
      desc: "Personal, educational or research use only: public documentation cites 10,000 points/day and 200 requests/day per IP/key; do not use for commercial traffic.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.chatanywhere.org/v1/chat/completions",
    validateUrl: "https://api.chatanywhere.org/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "ChatAnywhere Default Model"
    }
],
  serviceKinds: ["llm"],
};
