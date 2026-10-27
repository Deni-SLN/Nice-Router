export default {
  id: "promptql",
  priority: 110,
  alias: "pql",
  passthroughModels: true,
  
  
  display: {
    name: "PromptQL (Unofficial/Experimental)",
    icon: "hub",
    color: "#F97316",
    textIcon: "PR",
    website: "https://prompt.ql.app",
    notice: {
      desc: "Paste the Bearer JWT from prompt.ql.app DevTools → Network → graphql → Authorization (token only). Optional projectId + session Cookie for refresh.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://data.prompt.ql.app/promptql/playground-v2-hge/v1/graphql",
    
    
    authHeader: "authorization",
  },
  models: [
    {
        "id": "default",
        "name": "PromptQL (Unofficial/Experimental) Default Model"
    }
],
  serviceKinds: ["llm"],
};
