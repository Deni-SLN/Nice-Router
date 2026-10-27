export default {
  id: "ai21",
  priority: 110,
  alias: "ai21",
  passthroughModels: true,
  
  
  display: {
    name: "AI21 Labs",
    icon: "hub",
    color: "#10B981",
    textIcon: "AI",
    website: "https://www.ai21.com",
    notice: {
      desc: "$10 trial credits on signup (valid 3 months), no credit card required",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.ai21.com/studio/v1/chat/completions",
    validateUrl: "https://api.ai21.com/studio/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "jamba-large-1.7",
        "name": "jamba large 1.7"
    },
    {
        "id": "jamba-mini-2",
        "name": "jamba mini 2"
    }
],
  serviceKinds: ["llm"],
};
