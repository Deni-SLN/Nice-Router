export default {
  id: "conol-web",
  priority: 110,
  alias: "cnl",
  passthroughModels: true,
  
  
  display: {
    name: "Conol (Unofficial/Experimental)",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "CO",
    website: "https://conol.ai",
    notice: {
      desc: "Use browser sign-in, or paste the full Cookie header from conol.ai. The __Secure-better-auth.session_token cookie is required.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://conol.ai/api/sessions",
    
    
    authHeader: "cookie",
  },
  models: [
    {
        "id": "default",
        "name": "Conol (Unofficial/Experimental) Default Model"
    }
],
  serviceKinds: ["llm"],
};
