export default {
  id: "digitalocean",
  priority: 110,
  alias: "digitalocean",
  passthroughModels: true,
  
  
  display: {
    name: "DigitalOcean",
    icon: "hub",
    color: "#14B8A6",
    textIcon: "DI",
    website: "https://docs.digitalocean.com/products/ai-platform/",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://inference.do-ai.run/v1/chat/completions",
    validateUrl: "https://inference.do-ai.run/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "DigitalOcean Default Model"
    }
],
  serviceKinds: ["llm"],
};
