export default {
  id: "auriko",
  priority: 110,
  alias: "auriko",
  passthroughModels: true,
  
  
  display: {
    name: "Auriko",
    icon: "hub",
    color: "#6366F1",
    textIcon: "AU",
    website: "https://www.auriko.ai",
    notice: {
      desc: "Free plan publishes 1,000 Platform RPM and 10,000 BYOK RPM. Platform inference still passes through provider cost; this is not a free-token pool or unlimited free inference.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.auriko.ai/v1/chat/completions",
    validateUrl: "https://api.auriko.ai/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "Auriko Default Model"
    }
],
  serviceKinds: ["llm"],
};
