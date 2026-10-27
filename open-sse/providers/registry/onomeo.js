export default {
  id: "onomeo",
  priority: 110,
  alias: "onomeo",
  passthroughModels: true,
  
  
  display: {
    name: "onomeo",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "ON",
    website: "https://onomeo.com",
    notice: {
      desc: "Sign in (email code, Google or GitHub, no card). About 30 free models are metered by calls: 30 calls per 5 hours per account and 12 requests/min per key, within a site-wide pool shared by all accounts. Claude, GPT and other large models are paid from a USD balance at per-model prices; during the beta an account can spend at most $0.50/day on them. Optional top-up from $5 (balance never expires, no auto-renewal) raises the free-model limit to 90 calls per 5 hours for 35 days.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://onomeo.com/v1/chat/completions",
    validateUrl: "https://onomeo.com/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "onomeo Default Model"
    }
],
  serviceKinds: ["llm"],
};
