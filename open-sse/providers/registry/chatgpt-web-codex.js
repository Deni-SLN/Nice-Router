export default {
  id: "chatgpt-web-codex",
  priority: 110,
  alias: "cgpt-codex",
  passthroughModels: true,
  
  
  display: {
    name: "ChatGPT Web (Codex)",
    icon: "hub",
    color: "#EC4899",
    textIcon: "CH",
    website: "https://chatgpt.com",
    notice: {
      desc: "Paste the full ChatGPT Cookie header. OmniRoute verifies it in an isolated headless browser profile.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://chatgpt.com",
    
    format: "openai-responses",
    authHeader: "cookie",
  },
  models: [
    {
        "id": "luna",
        "name": "ChatGPT Web — Luna"
    },
    {
        "id": "think",
        "name": "ChatGPT Web — Think"
    },
    {
        "id": "instant",
        "name": "ChatGPT Web — Instant"
    },
    {
        "id": "medium",
        "name": "ChatGPT Web — Medium"
    },
    {
        "id": "high",
        "name": "ChatGPT Web — High"
    },
    {
        "id": "extra-high",
        "name": "ChatGPT Web — Extra High"
    },
    {
        "id": "pro",
        "name": "ChatGPT Web — Pro"
    }
],
  serviceKinds: ["llm"],
};
