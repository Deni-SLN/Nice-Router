import { CLAUDE_API_HEADERS } from "../shared.js";

export default {
  id: "bailian-coding-plan",
  priority: 85,
  alias: "bcp",
  display: {
    name: "Alibaba Coding Plan",
    icon: "code",
    color: "#FF6A00",
    textIcon: "BCP",
    website: "https://www.alibabacloud.com/help/en/model-studio/coding-plan",
    notice: {
      apiKeyUrl: "https://bailian.console.aliyun.com/",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://coding-intl.dashscope.aliyuncs.com/apps/anthropic/v1/messages",
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
      baseUrl: "https://coding-intl.dashscope.aliyuncs.com/apps/anthropic/v1/messages",
      urlSuffix: "?beta=true",
      headers: { ...CLAUDE_API_HEADERS },
      auth: { combined: true, header: "x-api-key", scheme: "raw" },
    },
  ],
  models: [
    { id: "qwen3.5-plus", name: "Qwen3.5 Plus" },
    { id: "qwen3-max-2026-01-23", name: "Qwen3 Max (2026-01-23)" },
    { id: "qwen3-coder-next", name: "Qwen3 Coder Next" },
    { id: "qwen3-coder-plus", name: "Qwen3 Coder Plus" },
    { id: "MiniMax-M2.5", name: "MiniMax M2.5" },
    { id: "glm-5", name: "GLM 5" },
    { id: "glm-4.7", name: "GLM 4.7" },
    { id: "kimi-k2.5", name: "Kimi K2.5" },
  ],
  serviceKinds: ["llm"],
};
