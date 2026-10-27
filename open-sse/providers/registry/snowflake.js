export default {
  id: "snowflake",
  priority: 110,
  alias: "snowflake",
  passthroughModels: true,
  
  
  display: {
    name: "Snowflake Cortex",
    icon: "hub",
    color: "#14B8A6",
    textIcon: "SN",
    website: "https://www.snowflake.com",
    notice: {
      desc: "—",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://{account}.snowflakecomputing.com/api/v2",
    
    
    authHeader: "bearer",
  },
  models: [
    {
        "id": "llama3.1-70b",
        "name": "llama3.1 70b"
    },
    {
        "id": "llama3.3-70b",
        "name": "llama3.3 70b"
    },
    {
        "id": "deepseek-r1",
        "name": "deepseek r1"
    },
    {
        "id": "claude-3-5-sonnet",
        "name": "claude 3 5 sonnet"
    }
],
  serviceKinds: ["llm"],
};
