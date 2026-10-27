import { CLAUDE_API_HEADERS } from "../shared.js";

export default {
  id: "kimi-coding-apikey",
  priority: 171,
  alias: "kmca",
  display: {
    name: "Kimi Coding (API Key)",
    icon: "psychology",
    color: "#1E40AF",
    textIcon: "KC",
    website: "https://kimi.moonshot.cn",
    notice: {
      apiKeyUrl: "https://platform.moonshot.ai/console/api-keys",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.kimi.com/coding/v1/messages",
    format: "claude",
    urlSuffix: "?beta=true",
    headers: { ...CLAUDE_API_HEADERS },
    auth: {
      combined: true,
      header: "x-api-key",
      scheme: "raw",
      hooks: ["kimiHeaders"],
    },
  },
  transports: [
    {
      format: "claude",
      baseUrl: "https://api.kimi.com/coding/v1/messages",
      urlSuffix: "?beta=true",
      headers: { ...CLAUDE_API_HEADERS },
      auth: { combined: true, header: "x-api-key", scheme: "raw", hooks: ["kimiHeaders"] },
    },
    {
      format: "openai",
      baseUrl: "https://api.kimi.com/coding/v1/chat/completions",
      auth: { combined: true, header: "Authorization", scheme: "bearer", hooks: ["kimiHeaders"] },
    },
  ],
  models: [
    { id: "kimi-k2.5", name: "Kimi K2.5" },
    { id: "kimi-k2.5-thinking", name: "Kimi K2.5 Thinking" },
    { id: "kimi-latest", name: "Kimi Latest" },
  ],
  serviceKinds: ["llm"],
};
