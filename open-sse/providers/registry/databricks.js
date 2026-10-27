export default {
  id: "databricks",
  priority: 110,
  alias: "databricks",
  passthroughModels: true,
  
  
  display: {
    name: "Databricks",
    icon: "hub",
    color: "#EC4899",
    textIcon: "DA",
    website: "https://www.databricks.com",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://adb-0000000000000000.0.azuredatabricks.net/serving-endpoints",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "databricks-gpt-5",
        "name": "databricks gpt 5"
    },
    {
        "id": "databricks-meta-llama-3-3-70b-instruct",
        "name": "databricks meta llama 3 3 70b instruct"
    },
    {
        "id": "databricks-claude-sonnet-4",
        "name": "databricks claude sonnet 4"
    },
    {
        "id": "databricks-gemini-2-5-pro",
        "name": "databricks gemini 2 5 pro"
    }
],
  serviceKinds: ["llm"],
};
