export default {
  id: "lambda-ai",
  priority: 110,
  alias: "lambda",
  passthroughModels: true,
  
  
  display: {
    name: "Lambda AI",
    icon: "hub",
    color: "#3B82F6",
    textIcon: "LA",
    website: "https://lambda.ai",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.lambda.ai/v1/chat/completions",
    validateUrl: "https://api.lambda.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "Lambda AI Default Model"
    }
],
  serviceKinds: ["llm"],
};
