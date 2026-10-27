export default {
  id: "notrack-web",
  priority: 110,
  alias: "ntw",
  passthroughModels: true,
  
  
  display: {
    name: "NoTrack Web (Free)",
    icon: "hub",
    color: "#10B981",
    textIcon: "NO",
    website: "https://notrack.ai",
    notice: {
      desc: "Log in to notrack.ai, then paste the full Cookie header (DevTools → Network → any /api request → Request Headers → Cookie). It must contain uid, si_usr_id, and si_ses_id.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://notrack.ai/api/dispatch",
    
    
    authHeader: "cookie",
  },
  models: [
    {
        "id": "notrack-c",
        "name": "NoTrack C"
    }
],
  serviceKinds: ["llm"],
};
