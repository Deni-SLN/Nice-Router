export default {
  id: "xiaomi-mimo-token-plan",
  priority: 110,
  alias: "mimotp",
  passthroughModels: true,
  
  
  display: {
    name: "Xiaomi MiMo Token Plan",
    icon: "hub",
    color: "#06B6D4",
    textIcon: "XI",
    website: "https://mimo.mi.com",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "Xiaomi MiMo Token Plan Default Model"
    }
],
  serviceKinds: ["llm"],
};
