export default {
  id: "workbuddy",
  priority: 110,
  alias: "wb",
  passthroughModels: true,
  
  
  display: {
    name: "WorkBuddy",
    icon: "hub",
    color: "#10B981",
    textIcon: "WO",
    website: "https://www.workbuddy.ai",
    notice: {
      desc: "Tencent WorkBuddy (www.workbuddy.ai). Authorize the CLI device flow in the popup; OmniRoute then polls for the token and attaches the required X-Product: SaaS header. The model roster is served by the authenticated catalogue, so it is discovered live rather than listed here. WorkBuddy only accepts streaming requests, which OmniRoute accumulates back into a JSON response for non-streaming callers.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://www.workbuddy.ai/v2/chat/completions",
    validateUrl: "https://www.workbuddy.ai/v2/models",
    
    authHeader: "Authorization",
  },
  models: [
    {
        "id": "default",
        "name": "WorkBuddy Default Model"
    }
],
  serviceKinds: ["llm"],
};
