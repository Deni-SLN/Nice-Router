export default {
  id: "command-code",
  priority: 110,
  alias: "cmd",
  passthroughModels: true,
  
  
  display: {
    name: "Command Code",
    icon: "hub",
    color: "#F59E0B",
    textIcon: "CO",
    website: "https://commandcode.ai/",
    notice: {
      desc: "Use a Command Code API key. Requests are sent to Command Code's /provider/v1/chat/completions endpoint.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.commandcode.ai",
    
    
    authHeader: "Authorization",
  },
  models: [
    {
        "id": "claude-opus-4-7",
        "name": "Claude Opus 4.7 (CC)"
    },
    {
        "id": "claude-fable-5",
        "name": "Claude Fable 5 (CC)"
    },
    {
        "id": "claude-opus-4-6",
        "name": "Claude Opus 4.6 (CC)"
    },
    {
        "id": "claude-sonnet-5-5",
        "name": "Claude Sonnet 5.5 (CC)"
    },
    {
        "id": "claude-sonnet-4-6",
        "name": "Claude Sonnet 4.6 (CC)"
    },
    {
        "id": "claude-haiku-4-5-20251001",
        "name": "Claude Haiku 4.5 (CC)"
    },
    {
        "id": "gpt-5.5",
        "name": "GPT-5.5 (CC)"
    },
    {
        "id": "gpt-5.4",
        "name": "GPT-5.4 (CC)"
    },
    {
        "id": "gpt-5.3-codex",
        "name": "GPT-5.3 Codex (CC)"
    },
    {
        "id": "gpt-5.4-mini",
        "name": "GPT-5.4 Mini (CC)"
    },
    {
        "id": "deepseek/deepseek-v4-pro",
        "name": "DeepSeek V4 Pro (CC)"
    },
    {
        "id": "deepseek/deepseek-v4-flash",
        "name": "DeepSeek V4 Flash (CC)"
    },
    {
        "id": "deepseek/deepseek-v4-flash-vision-exp",
        "name": "DeepSeek V4 Flash Vision (exp) (CC)"
    },
    {
        "id": "moonshotai/Kimi-K2.6",
        "name": "Kimi K2.6 (CC)"
    },
    {
        "id": "moonshotai/Kimi-K2.5",
        "name": "Kimi K2.5 (CC)"
    }
],
  serviceKinds: ["llm"],
};
