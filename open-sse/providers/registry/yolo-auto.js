export default {
  id: "yolo-auto",
  priority: 110,
  alias: "yolo-auto",
  passthroughModels: true,
  
  
  display: {
    name: "Yolo-Auto",
    icon: "hub",
    color: "#6366F1",
    textIcon: "YO",
    website: "https://yolo-auto.com",
    notice: {
      desc: "Free API access is request-limited and intended for testing; no numeric daily quota is published and free access is not promised indefinitely.",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://yolo-auto.com/v1/chat/completions",
    validateUrl: "https://yolo-auto.com/v1/models",
    
    
  },
  models: [
    {
        "id": "qwen3.6-35b-a3b",
        "name": "Qwen 3.6 35B A3B"
    }
],
  serviceKinds: ["llm"],
};
