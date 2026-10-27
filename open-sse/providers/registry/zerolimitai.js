export default {
  id: "zerolimitai",
  priority: 110,
  alias: "zerolimitai",
  passthroughModels: true,
  
  
  display: {
    name: "ZeroLimitAI",
    icon: "hub",
    color: "#10B981",
    textIcon: "ZE",
    website: "https://www.zerolimitai.com",
    notice: {
      desc: "Temporary free trial is advertised, but official pages conflict between 3 and 7 days; a 100-calls/day claim is not treated as permanent.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://www.zerolimitai.com/api/v1/chat/completions",
    validateUrl: "https://www.zerolimitai.com/api/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "ZeroLimitAI Default Model"
    }
],
  serviceKinds: ["llm"],
};
