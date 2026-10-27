export default {
  id: "helyxai",
  priority: 110,
  alias: "helyxai",
  passthroughModels: true,
  
  
  display: {
    name: "Helyx AI",
    icon: "hub",
    color: "#EC4899",
    textIcon: "HE",
    website: "https://helyxai.space",
    notice: {
      desc: "Operational Free plan documents 100,000 tokens/day; the site's separate 2M+ marketing claim conflicts and is not treated as a quota guarantee.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://helyxai.space/v1/chat/completions",
    validateUrl: "https://helyxai.space/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Helyx AI Default Model"
    }
],
  serviceKinds: ["llm"],
};
