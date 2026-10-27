export default {
  id: "muse-spark-web",
  priority: 110,
  alias: "ms-web",
  passthroughModels: true,
  
  
  display: {
    name: "Muse Spark Web (Meta AI)",
    icon: "hub",
    color: "#6366F1",
    textIcon: "MU",
    website: "https://www.meta.ai",
    notice: {
      desc: "Paste your ecto_1_sess cookie AND the ecto1:... WS auth token from meta.ai. Capture the ecto1: token in DevTools → Network → WS → the clippy request's Authorization query param. Example: ecto_1_sess=4240a308...NVDg0; ecto1:ABCD...",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://www.meta.ai/api/graphql",
    
    
    authHeader: "cookie",
  },
  models: [
    {
        "id": "muse-spark",
        "name": "Muse Spark"
    },
    {
        "id": "muse-spark-thinking",
        "name": "Muse Spark Thinking"
    },
    {
        "id": "muse-spark-contemplating",
        "name": "Muse Spark Contemplating"
    }
],
  serviceKinds: ["llm"],
};
