export default {
  id: "dxnt",
  priority: 110,
  alias: "dxnt",
  passthroughModels: true,
  
  
  display: {
    name: "DXNT / DX Token",
    icon: "hub",
    color: "#14B8A6",
    textIcon: "DX",
    website: "https://www.dxnt.com",
    notice: {
      desc: "Free accounts are documented at 100 calls/day; the quota may increase through invitations and can vary by account.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://www.dxnt.com/v1/chat/completions",
    validateUrl: "https://www.dxnt.com/v1/models",
    
    
  },
  models: [
    {
        "id": "default",
        "name": "DXNT / DX Token Default Model"
    }
],
  serviceKinds: ["llm"],
};
