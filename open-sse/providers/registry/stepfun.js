export default {
  id: "stepfun",
  priority: 110,
  alias: "stepfun",
  passthroughModels: true,
  
  
  display: {
    name: "StepFun",
    icon: "hub",
    color: "#84CC16",
    textIcon: "ST",
    website: "https://stepfun.com",
    notice: {
      desc: "Get API key at platform.stepfun.com",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.stepfun.com/v1/chat/completions",
    validateUrl: "https://api.stepfun.com/v1/models",
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "step-5-preview",
        "name": "Step 5 Preview"
    },
    {
        "id": "step-3.7-flash",
        "name": "Step 3.7 Flash"
    },
    {
        "id": "step-3.5-flash",
        "name": "Step 3.5 Flash"
    },
    {
        "id": "step-3.5-flash-2603",
        "name": "Step 3.5 Flash 2603"
    },
    {
        "id": "step-1o-turbo-vision",
        "name": "Step 1o Turbo Vision"
    },
    {
        "id": "step-1v",
        "name": "Step 1V"
    }
],
  serviceKinds: ["llm"],
};
