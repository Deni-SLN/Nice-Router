export default {
  id: "gitlawb",
  priority: 110,
  alias: "glb",
  passthroughModels: true,
  
  
  display: {
    name: "Gitlawb Opengateway (MiMo)",
    icon: "hub",
    color: "#EC4899",
    textIcon: "GI",
    website: "https://opengateway.gitlawb.com",
    notice: {
      desc: "Free MiMo (xiaomi/mimo-v2.5) revoked 2026-05 — Opengateway is now a pay-as-you-go credit gateway; no recurring free model.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://opengateway.gitlawb.com/v1/xiaomi-mimo",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "mimo-v2.5-pro",
        "name": "mimo v2.5 pro"
    },
    {
        "id": "MiMo-V2.5-Pro",
        "name": "MiMo V2.5 Pro"
    },
    {
        "id": "mimo-v2.5",
        "name": "mimo v2.5"
    },
    {
        "id": "MiMo-V2.5",
        "name": "MiMo V2.5"
    },
    {
        "id": "mimo-v2-pro",
        "name": "mimo v2 pro"
    },
    {
        "id": "MiMo-V2-Pro",
        "name": "MiMo V2 Pro"
    },
    {
        "id": "mimo-v2-omni",
        "name": "mimo v2 omni"
    },
    {
        "id": "MiMo-V2-Omni",
        "name": "MiMo V2 Omni"
    },
    {
        "id": "mimo-v2-flash",
        "name": "mimo v2 flash"
    },
    {
        "id": "MiMo-V2-Flash",
        "name": "MiMo V2 Flash"
    }
],
  serviceKinds: ["llm"],
};
