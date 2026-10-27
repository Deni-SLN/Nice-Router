export default {
  id: "notion-web",
  priority: 110,
  alias: "nw",
  passthroughModels: true,
  
  
  display: {
    name: "Notion AI Web (Unofficial/Experimental)",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "NO",
    website: "https://www.notion.so",
    notice: {
      desc: "Paste only the token_v2 cookie VALUE from app.notion.com (DevTools → Application → Cookies → token_v2). Do not paste token_v2= or the full Cookie header. Workspace is auto-detected; space_id / notion_user_id are optional.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://app.notion.com/api/v3/runInferenceTranscript",
    
    
    authHeader: "cookie",
  },
  models: [
    {
        "id": "default",
        "name": "Notion AI Web (Unofficial/Experimental) Default Model"
    }
],
  serviceKinds: ["llm"],
};
