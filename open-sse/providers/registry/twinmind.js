export default {
  id: "twinmind",
  priority: 110,
  alias: "tm",
  passthroughModels: true,
  
  
  display: {
    name: "Twinmind (Unofficial/Experimental)",
    icon: "hub",
    color: "#14B8A6",
    textIcon: "TW",
    website: "https://app.twinmind.com",
    notice: {
      desc: "Paste the stsTokenManager JSON from app.twinmind.com IndexedDB (accessToken + refreshToken). Chat uses accessToken; refreshToken mints a new JWT when it expires.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api2.twinmind.com/api/v3",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "Twinmind (Unofficial/Experimental) Default Model"
    }
],
  serviceKinds: ["llm"],
};
