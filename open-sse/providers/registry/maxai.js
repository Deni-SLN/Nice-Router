export default {
  id: "maxai",
  priority: 110,
  alias: "mx",
  passthroughModels: true,
  
  
  display: {
    name: "MaxAI",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "MA",
    website: "https://www.maxai.co",
    notice: {
      desc: "Sign in once (email code or browser) to mint a MaxAI access token. OmniRoute signs each request, routes it through residential egress, and refreshes the token browserlessly, so a connection stays valid for about a year without re-login.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.maxai.me",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "MaxAI Default Model"
    }
],
  serviceKinds: ["llm"],
};
