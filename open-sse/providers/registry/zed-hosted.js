export default {
  id: "zed-hosted",
  priority: 110,
  alias: "—",
  passthroughModels: true,
  
  
  display: {
    name: "Zed Hosted Models",
    icon: "hub",
    color: "#F97316",
    textIcon: "ZE",
    website: "https://zed.dev",
    notice: {
      desc: "Sign in with your Zed account (native-app sign-in). OmniRoute generates a one-time RSA keypair and opens zed.dev to authorize it — on a remote/headless install, copy the resulting 127.0.0.1 callback URL from your browser's address bar and paste it back here. Distinct from the 'Zed IDE' credential-import entry above: this proxies chat completions through Zed's own hosted model aggregator (cloud.zed.dev), fronting Anthropic/OpenAI/Google/xAI models under your Zed plan.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://cloud.zed.dev/completions",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "default",
        "name": "Zed Hosted Models Default Model"
    }
],
  serviceKinds: ["llm"],
};
