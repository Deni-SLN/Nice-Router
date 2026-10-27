export default {
  id: "uc",
  priority: 110,
  alias: "ucn",
  passthroughModels: true,
  
  
  display: {
    name: "UC (uncensored.com)",
    icon: "hub",
    color: "#14B8A6",
    textIcon: "UC",
    website: "https://uncensored.com",
    notice: {
      desc: "Sign in once with an email code to bootstrap a UC (uncensored.com) subscription session. OmniRoute mints a fresh short-lived token per request browserlessly, so the connection renews on its own; you only re-run the email login about once a month when the subscription session rolls over.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://internal-6.pubyar.com",
    
    
    authHeader: "none",
  },
  models: [
    {
        "id": "default",
        "name": "UC (uncensored.com) Default Model"
    }
],
  serviceKinds: ["llm"],
};
