export default {
  id: "huggingchat",
  priority: 110,
  alias: "huggingchat",
  passthroughModels: true,
  
  
  display: {
    name: "HuggingChat (Free)",
    icon: "hub",
    color: "#F97316",
    textIcon: "HU",
    website: "https://huggingface.co/chat",
    notice: {
      desc: "Paste the full Cookie header from huggingface.co/chat (DevTools → Network → /chat/conversation → Request Headers → Cookie). It should include hf-chat and may also include token / aws-waf-token.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://huggingface.co/chat/conversation",
    
    
    authHeader: "cookie",
  },
  models: [
    {
        "id": "baidu/ERNIE-4.5-VL-424B-A47B-Base-PT",
        "name": "ERNIE 4.5 VL 424B A47B Base PT"
    },
    {
        "id": "CohereLabs/c4ai-command-r7b-12-2024",
        "name": "Command R7B 12-2024"
    },
    {
        "id": "CohereLabs/command-a-reasoning-08-2025",
        "name": "Command A Reasoning 08-2025"
    },
    {
        "id": "CohereLabs/command-a-vision-07-2025",
        "name": "Command A Vision 07-2025"
    },
    {
        "id": "deepseek-ai/DeepSeek-V4-Pro",
        "name": "DeepSeek V4 Pro"
    },
    {
        "id": "deepseek-ai/DeepSeek-V4-Flash",
        "name": "DeepSeek V4 Flash"
    },
    {
        "id": "google/gemma-4-31B-it",
        "name": "Gemma 4 31B"
    },
    {
        "id": "google/gemma-4-26B-A4B-it",
        "name": "Gemma 4 26B A4B"
    },
    {
        "id": "inclusionAI/Ling-2.6-1T",
        "name": "Ling 2.6 1T"
    },
    {
        "id": "meta-llama/Llama-4-Scout-17B-16E-Instruct",
        "name": "Llama 4 Scout 17B 16E Instruct"
    },
    {
        "id": "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
        "name": "Llama 4 Maverick 17B 128E Instruct FP8"
    },
    {
        "id": "MiniMaxAI/MiniMax-M3",
        "name": "MiniMax M3"
    },
    {
        "id": "moonshotai/Kimi-K2.7-Code",
        "name": "Kimi K2.7 Code"
    },
    {
        "id": "moonshotai/Kimi-K2.6",
        "name": "Kimi K2.6"
    },
    {
        "id": "nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-NVFP4",
        "name": "NVIDIA Nemotron 3 Ultra 550B A55B NVFP4"
    }
],
  serviceKinds: ["llm"],
};
