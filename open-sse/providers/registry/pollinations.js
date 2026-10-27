export default {
  id: "pollinations",
  priority: 15,
  hasFree: true,
  noAuth: true,
  alias: "pol",
  display: {
    name: "Pollinations AI",
    icon: "local_florist",
    color: "#4CAF50",
    textIcon: "PO",
    website: "https://pollinations.ai",
    freeNote: "No API key needed — access GPT-5, Claude, Gemini, DeepSeek, Llama 4 free (1 req/15s)",
    notice: {
      signupUrl: "https://pollinations.ai",
    },
  },
  category: "free",
  transport: {
    baseUrl: "https://text.pollinations.ai/openai/chat/completions",
  },
  models: [
    { id: "openai", name: "GPT-5 via Pollinations" },
    { id: "claude", name: "Claude via Pollinations" },
    { id: "gemini", name: "Gemini via Pollinations" },
    { id: "deepseek", name: "DeepSeek via Pollinations" },
    { id: "llama", name: "Llama 4 via Pollinations" },
    { id: "mistral", name: "Mistral via Pollinations" },
  ],
  serviceKinds: ["llm"],
};
