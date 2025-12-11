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
          key: "agentProvider",
          label: "Provider",
          type: "select",
          defaultValue: "openai",
          options: [
            { value: "openai", label: "OpenAI" },
            { value: "anthropic", label: "Anthropic" },
            { value: "google", label: "Google" },
            { value: "meta", label: "Meta (Llama)" },
            { value: "mistral", label: "Mistral" },
            { value: "groq", label: "Groq" },
          ],
        },
        {
          key: "agentModelOpenai",
          label: "Model",
          type: "select",
          defaultValue: "openai/gpt-4o",
          showWhen: { field: "agentProvider", equals: "openai" },
          options: [
            { value: "openai/gpt-4o", label: "GPT-4o (Recommended)" },
            { value: "openai/gpt-4o-mini", label: "GPT-4o Mini (Fast)" },
            { value: "openai/gpt-4-turbo", label: "GPT-4 Turbo" },
            { value: "openai/gpt-3.5-turbo", label: "GPT-3.5 Turbo (Cheapest)" },
            { value: "openai/o1", label: "o1 (Reasoning)" },
            { value: "openai/o1-mini", label: "o1 Mini" },
            { value: "openai/o3-mini", label: "o3 Mini (Latest)" },
          ],
        },
        {
          key: "agentModelAnthropic",
          label: "Model",
          type: "select",
          defaultValue: "anthropic/claude-sonnet-4.0",
          showWhen: { field: "agentProvider", equals: "anthropic" },
          options: [
            { value: "anthropic/claude-opus-4.5", label: "Claude Opus 4.5 (Best)" },
            { value: "anthropic/claude-sonnet-4.0", label: "Claude Sonnet 4.0" },
            { value: "anthropic/claude-3.7-sonnet", label: "Claude 3.7 Sonnet" },
            {
              value: "anthropic/claude-3.5-sonnet-20241022",
              label: "Claude 3.5 Sonnet",
            },
            { value: "anthropic/claude-3-haiku", label: "Claude 3 Haiku (Fast)" },
          ],
        },
        {
          key: "agentModelGoogle",
          label: "Model",
          type: "select",
          defaultValue: "google/gemini-2.0-flash",
          showWhen: { field: "agentProvider", equals: "google" },
          options: [
            { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (Best)" },
            { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
            { value: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash" },
            { value: "google/gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
          ],
        },
        {
          key: "agentModelMeta",
          label: "Model",
          type: "select",
          defaultValue: "meta/llama-4-scout",
          showWhen: { field: "agentProvider", equals: "meta" },
          options: [
            { value: "meta/llama-4-maverick", label: "Llama 4 Maverick (Best)" },
            { value: "meta/llama-4-scout", label: "Llama 4 Scout" },
            { value: "meta/llama-3.3-70b", label: "Llama 3.3 70B" },
            { value: "meta/llama-3.1-8b", label: "Llama 3.1 8B (Fast)" },
          ],
        },
        {
          key: "agentModelMistral",
          label: "Model",
          type: "select",
          defaultValue: "mistral/mistral-large",
          showWhen: { field: "agentProvider", equals: "mistral" },
          options: [
            { value: "mistral/mistral-large", label: "Mistral Large" },
            { value: "mistral/mistral-medium", label: "Mistral Medium" },
            { value: "mistral/mistral-small", label: "Mistral Small" },
            { value: "mistral/codestral", label: "Codestral (Code)" },
          ],
        },
        {
          key: "agentModelGroq",
          label: "Model",
          type: "select",
          defaultValue: "groq/llama-3.3-70b",
          showWhen: { field: "agentProvider", equals: "groq" },
          options: [
            { value: "groq/llama-3.3-70b", label: "Llama 3.3 70B (Fast)" },
            { value: "groq/llama-3.1-8b", label: "Llama 3.1 8B (Fastest)" },
            { value: "groq/mixtral-8x7b", label: "Mixtral 8x7B" },
            { value: "groq/gemma2-9b", label: "Gemma 2 9B" },
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

