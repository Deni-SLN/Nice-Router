export default {
  id: "freebuff",
  priority: 110,
  alias: "fb",
  passthroughModels: true,
  
  
  display: {
    name: "Freebuff",
    icon: "hub",
    color: "#10B981",
    textIcon: "FR",
    website: "https://freebuff.com",
    notice: {
      desc: "Enter your Freebuff / Codebuff auth token from the CLI login.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://www.codebuff.com/api/v1",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "deepseek/deepseek-v4-flash",
        "name": "DeepSeek V4 Flash"
    },
    {
        "id": "deepseek/deepseek-v4-pro",
        "name": "DeepSeek V4 Pro"
    },
    {
        "id": "openai/gpt-5.6-luna",
        "name": "GPT-5.6 Luna"
    },
    {
        "id": "minimax/minimax-m3",
        "name": "MiniMax M3"
    },
    {
        "id": "mimo/mimo-v2.5",
        "name": "MiMo v2.5"
    },
    {
        "id": "z-ai/glm-5.2",
        "name": "GLM 5.2"
    },
    {
        "id": "crof/kimi-k3-eco",
        "name": "Kimi K3 Eco"
    },
    {
        "id": "anthropic/claude-fable-5",
        "name": "Claude Fable 5"
    },
    {
        "id": "meta/muse-spark-1.2-contributor",
        "name": "Meta Muse Spark 1.2 Contributor"
    }
],
  serviceKinds: ["llm"],
};
