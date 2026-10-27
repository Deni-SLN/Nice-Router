export default {
  id: "modal",
  priority: 110,
  alias: "modal",
  passthroughModels: true,
  
  
  display: {
    name: "Modal",
    icon: "hub",
    color: "#6366F1",
    textIcon: "MO",
    website: "https://modal.com/docs",
    notice: {
      desc: "Use the bearer token that protects your Modal deployment, if enabled. Base URL should point to your OpenAI-compatible Modal app, for example https://<workspace>--<app>.modal.run/v1.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.modal.ai/v1/chat/completions",
    validateUrl: "https://api.modal.ai/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "google/gemini-2.0-flash",
        "name": "Gemini 2.0 Flash"
    }
],
  serviceKinds: ["llm"],
};
