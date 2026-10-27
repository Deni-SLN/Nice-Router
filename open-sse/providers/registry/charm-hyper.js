export default {
  id: "charm-hyper",
  priority: 110,
  alias: "charm-hyper",
  passthroughModels: true,
  
  
  display: {
    name: "Charm Hyper",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "CH",
    website: "https://hyper.charm.land",
    notice: {
      desc: "100 free monthly Hypercredits on signup",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://hyper.charm.land/v1/chat/completions",
    validateUrl: "https://hyper.charm.land/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "hyper/auto",
        "name": "Charm Hyper Auto"
    }
],
  serviceKinds: ["llm"],
};
