export default {
  id: "lmarena",
  priority: 110,
  alias: "lma",
  passthroughModels: true,
  
  
  display: {
    name: "Arena (Free)",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "AR",
    website: "https://arena.ai",
    notice: {
      desc: "Paste the full Cookie header from arena.ai (DevTools → Network → request → Cookie). Include arena-auth-prod-v1.0/.1… and cf_clearance/__cf_bm when present. OmniRoute uses Chrome TLS impersonation; if Arena still 403s, set providerSpecificData.recaptchaV3Token from a live browser session.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://arena.ai/nextjs-api/stream/create-evaluation",
    
    
    authHeader: "cookie",
  },
  models: [
    {
        "id": "default",
        "name": "Arena (Free) Default Model"
    }
],
  serviceKinds: ["llm"],
};
