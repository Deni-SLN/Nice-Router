export default {
  id: "ant-ling",
  priority: 110,
  alias: "ling",
  passthroughModels: true,
  
  
  display: {
    name: "Ant Ling / Ring (inclusionAI)",
    icon: "hub",
    color: "#8B5CF6",
    textIcon: "AN",
    website: "https://developer.ant-ling.com/en/docs/",
    notice: {
      desc: "Register and create an API key at the Ant Ling API console (https://chat.ant-ling.com/open), then paste it here. OmniRoute routes chat traffic to https://api.ant-ling.com/v1/chat/completions; the provider is OpenAI-compatible and also exposes an Anthropic-compatible surface.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.ant-ling.com/v1/chat/completions",
    validateUrl: "https://api.ant-ling.com/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "Ling-2.6-1T",
        "name": "Ling 2.6 1T"
    },
    {
        "id": "Ring-2.6-1T",
        "name": "Ring 2.6 1T"
    },
    {
        "id": "Ling-2.6-flash",
        "name": "Ling 2.6 Flash"
    }
],
  serviceKinds: ["llm"],
};
