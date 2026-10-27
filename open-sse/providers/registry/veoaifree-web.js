export default {
  id: "veoaifree-web",
  priority: 110,
  alias: "veo-free",
  passthroughModels: true,
  hasFree: true,
  noAuth: true,
  display: {
    name: "Veo AI Free",
    icon: "hub",
    color: "#84CC16",
    textIcon: "VE",
    website: "https://veoaifree.com",
    notice: {
      desc: "No auth required. Rate limited to 6 requests/hour per IP.",
    },
  },
  category: "free",
  transport: {
    baseUrl: "https://veoaifree.com/wp-admin/admin-ajax.php",
    
    
    authHeader: "none",
  },
  models: [
    {
        "id": "veo",
        "name": "VEO 3.1"
    },
    {
        "id": "seedance",
        "name": "Seedance"
    }
],
  serviceKinds: ["llm"],
};
