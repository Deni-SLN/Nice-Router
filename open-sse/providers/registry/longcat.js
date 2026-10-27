export default {
  id: "longcat",
  priority: 99,
  hasFree: true,
  alias: "lc",
  display: {
    name: "LongCat AI",
    icon: "auto_awesome",
    color: "#FF6B9D",
    textIcon: "LC",
    website: "https://longcat.chat",
    freeNote: "50M tokens/day (Flash-Lite) + 500K/day (Chat/Thinking) — 100% free while public beta",
    notice: {
      apiKeyUrl: "https://longcat.chat",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.longcat.chat/openai/v1/chat/completions",
  },
  models: [
    { id: "LongCat-Flash-Lite", name: "LongCat Flash Lite (Free)" },
    { id: "LongCat-Chat", name: "LongCat Chat" },
    { id: "LongCat-Thinking", name: "LongCat Thinking" },
  ],
  serviceKinds: ["llm"],
};
