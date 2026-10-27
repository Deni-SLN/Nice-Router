import { CLAUDE_API_HEADERS } from "../shared.js";

export default {
  id: "zai",
  priority: 141,
  alias: "zai",
  display: {
    name: "Z.AI",
    icon: "code",
    color: "#2563EB",
    textIcon: "ZA",
    website: "https://z.ai",
    notice: {
      apiKeyUrl: "https://z.ai",
      signupUrl: "https://chat.z.ai",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.z.ai/api/anthropic/v1/messages",
    format: "claude",
    urlSuffix: "?beta=true",
    headers: { ...CLAUDE_API_HEADERS },
    auth: {
      combined: true,
      header: "x-api-key",
      scheme: "raw",
    },
  },
  transports: [
    {
      format: "claude",
      baseUrl: "https://api.z.ai/api/anthropic/v1/messages",
      urlSuffix: "?beta=true",
      headers: { ...CLAUDE_API_HEADERS },
      auth: { combined: true, header: "x-api-key", scheme: "raw" },
    },
    {
      format: "openai",
      baseUrl: "https://api.z.ai/api/coding/paas/v4/chat/completions",
      auth: { combined: true, header: "Authorization", scheme: "bearer" },
    },
  ],
  models: [
    { id: "glm-5", name: "GLM 5" },
    { id: "glm-5-turbo", name: "GLM 5 Turbo" },
    { id: "glm-4.7", name: "GLM 4.7" },
  ],
  serviceKinds: ["llm"],
};
