import type { IntegrationPlugin } from "../registry";
import { registerIntegration } from "../registry";
import { AiAgentIcon } from "./icon";

const aiAgentPlugin: IntegrationPlugin = {
  type: "ai-agent",
  label: "AI Agent",
  description: "Autonomous AI agent that can use tools to accomplish goals",

  icon: AiAgentIcon,

  formFields: [
    {
      id: "aiGatewayApiKey",
      label: "API Key",
      type: "password",
      placeholder: "Your AI Gateway API key",
      configKey: "apiKey",
      envVar: "AI_GATEWAY_API_KEY",
      helpText: "Get your API key from ",
      helpLink: {
        text: "vercel.com/ai-gateway",
        url: "https://vercel.com/docs/ai-gateway/getting-started",
      },
    },
  ],

  testConfig: {
    getTestFunction: async () => {
      const { testAiAgent } = await import("./test");
      return testAiAgent;
    },
  },

  actions: [
    {
      slug: "run-agent",
      label: "Run Agent",
      description:
        "Run an autonomous AI agent that uses tools to accomplish a goal",
      category: "AI Agent",
      stepFunction: "runAgentStep",
      stepImportPath: "run-agent",
      outputFields: [
        { field: "result", description: "The final result from the agent" },
        { field: "steps", description: "Array of steps the agent took" },
        { field: "toolCalls", description: "Number of tool calls made" },
      ],
      configFields: [
        {
          key: "agentModel",
          label: "Model",
          type: "select",
          defaultValue: "openai/gpt-4o",
          options: [
            { value: "openai/gpt-4o", label: "GPT-4o (Recommended)" },
            { value: "openai/gpt-4o-mini", label: "GPT-4o Mini (Faster)" },
            { value: "anthropic/claude-sonnet-4.0", label: "Claude Sonnet 4.0" },
            {
              value: "anthropic/claude-3.5-sonnet-20241022",
              label: "Claude 3.5 Sonnet",
            },
            { value: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash" },
          ],
        },
        {
          key: "agentGoal",
          label: "Goal / Objective",
          type: "template-textarea",
          placeholder:
            "Describe what you want the agent to accomplish. Use {{NodeName.field}} for dynamic values.",
          rows: 4,
          example:
            "Research the top 3 competitors of {{Input.company}} and summarize their pricing",
          required: true,
        },
        {
          key: "agentTools",
          label: "Available Tools",
          type: "select",
          defaultValue: "web_search,scrape_url,calculate",
          options: [
            {
              value: "web_search,scrape_url,calculate",
              label: "Search + Scrape + Calculate (Default)",
            },
            {
              value: "web_search,scrape_url,http_request,calculate",
              label: "All Tools",
            },
            { value: "web_search", label: "Web Search Only" },
            { value: "web_search,scrape_url", label: "Search + Scrape" },
            { value: "http_request", label: "HTTP Request Only" },
          ],
        },
        {
          key: "agentMaxSteps",
          label: "Max Steps (1-50)",
          type: "template-input",
          defaultValue: "10",
          placeholder: "10",
        },
        {
          key: "agentSystemPrompt",
          label: "System Prompt (Optional)",
          type: "template-textarea",
          placeholder: "Custom instructions for the agent behavior...",
          rows: 3,
        },
      ],
    },
  ],
};

// Auto-register on import
registerIntegration(aiAgentPlugin);

export default aiAgentPlugin;

