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
      label: "Vercel AI Gateway Key (Recommended)",
      type: "password",
      placeholder: "Your AI Gateway API key",
      configKey: "aiGatewayApiKey",
      envVar: "AI_GATEWAY_API_KEY",
      helpText: "Universal key for all providers via Vercel. Get it from ",
      helpLink: {
        text: "vercel.com/ai-gateway",
        url: "https://vercel.com/docs/ai-gateway/getting-started",
      },
    },
    {
      id: "openaiApiKey",
      label: "OpenAI API Key (Optional)",
      type: "password",
      placeholder: "sk-...",
      configKey: "openaiApiKey",
      envVar: "OPENAI_API_KEY",
      helpText: "Direct OpenAI access. Get it from ",
      helpLink: {
        text: "platform.openai.com/api-keys",
        url: "https://platform.openai.com/api-keys",
      },
    },
    {
      id: "anthropicApiKey",
      label: "Anthropic API Key (Optional)",
      type: "password",
      placeholder: "sk-ant-...",
      configKey: "anthropicApiKey",
      envVar: "ANTHROPIC_API_KEY",
      helpText: "Direct Claude access. Get it from ",
      helpLink: {
        text: "console.anthropic.com",
        url: "https://console.anthropic.com/settings/keys",
      },
    },
    {
      id: "googleApiKey",
      label: "Google AI API Key (Optional)",
      type: "password",
      placeholder: "AIza...",
      configKey: "googleApiKey",
      envVar: "GOOGLE_API_KEY",
      helpText: "Direct Gemini access. Get it from ",
      helpLink: {
        text: "aistudio.google.com",
        url: "https://aistudio.google.com/apikey",
      },
    },
    {
      id: "groqApiKey",
      label: "Groq API Key (Optional)",
      type: "password",
      placeholder: "gsk_...",
      configKey: "groqApiKey",
      envVar: "GROQ_API_KEY",
      helpText: "Fast inference for Llama/Mixtral. Get it from ",
      helpLink: {
        text: "console.groq.com",
        url: "https://console.groq.com/keys",
      },
    },
    {
      id: "mistralApiKey",
      label: "Mistral API Key (Optional)",
      type: "password",
      placeholder: "Your Mistral API key",
      configKey: "mistralApiKey",
      envVar: "MISTRAL_API_KEY",
      helpText: "Direct Mistral access. Get it from ",
      helpLink: {
        text: "console.mistral.ai",
        url: "https://console.mistral.ai/api-keys",
      },
    },
    {
      id: "xaiApiKey",
      label: "xAI API Key (Optional)",
      type: "password",
      placeholder: "xai-...",
      configKey: "xaiApiKey",
      envVar: "XAI_API_KEY",
      helpText: "Direct Grok access. Get it from ",
      helpLink: {
        text: "console.x.ai",
        url: "https://console.x.ai/",
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
            { value: "xai", label: "xAI (Grok)" },
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
          key: "agentModelXai",
          label: "Model",
          type: "select",
          defaultValue: "xai/grok-3",
          showWhen: { field: "agentProvider", equals: "xai" },
          options: [
            { value: "xai/grok-3", label: "Grok 3 (Best)" },
            { value: "xai/grok-3-fast", label: "Grok 3 Fast" },
            { value: "xai/grok-3-mini", label: "Grok 3 Mini" },
            { value: "xai/grok-3-mini-fast", label: "Grok 3 Mini Fast" },
            { value: "xai/grok-2", label: "Grok 2" },
            { value: "xai/grok-2-vision", label: "Grok 2 Vision" },
          ],
        },
        // Advanced Model Configuration
        {
          key: "agentShowAdvanced",
          label: "Show Advanced Settings",
          type: "select",
          defaultValue: "false",
          options: [
            { value: "false", label: "No - Use Defaults" },
            { value: "true", label: "Yes - Configure Parameters" },
          ],
        },
        {
          key: "agentTemperature",
          label: "Temperature (0.0 - 2.0)",
          type: "template-input",
          defaultValue: "0.7",
          placeholder: "0.7",
          showWhen: { field: "agentShowAdvanced", equals: "true" },
        },
        {
          key: "agentMaxTokens",
          label: "Max Output Tokens",
          type: "template-input",
          defaultValue: "4096",
          placeholder: "4096",
          showWhen: { field: "agentShowAdvanced", equals: "true" },
        },
        {
          key: "agentTopP",
          label: "Top P (0.0 - 1.0)",
          type: "template-input",
          defaultValue: "1.0",
          placeholder: "1.0",
          showWhen: { field: "agentShowAdvanced", equals: "true" },
        },
        {
          key: "agentFrequencyPenalty",
          label: "Frequency Penalty (-2.0 to 2.0)",
          type: "template-input",
          defaultValue: "0",
          placeholder: "0",
          showWhen: { field: "agentShowAdvanced", equals: "true" },
        },
        {
          key: "agentPresencePenalty",
          label: "Presence Penalty (-2.0 to 2.0)",
          type: "template-input",
          defaultValue: "0",
          placeholder: "0",
          showWhen: { field: "agentShowAdvanced", equals: "true" },
        },
        // Reasoning effort for o1/o3 models
        {
          key: "agentReasoningEffort",
          label: "Reasoning Effort",
          type: "select",
          defaultValue: "medium",
          showWhen: { field: "agentShowAdvanced", equals: "true" },
          options: [
            { value: "low", label: "Low - Faster, less thorough" },
            { value: "medium", label: "Medium - Balanced (Default)" },
            { value: "high", label: "High - Slower, more thorough" },
          ],
        },
        {
          key: "agentStopSequences",
          label: "Stop Sequences (comma-separated)",
          type: "template-input",
          placeholder: "\\n\\n,END,DONE",
          showWhen: { field: "agentShowAdvanced", equals: "true" },
        },
        {
          key: "agentResponseFormat",
          label: "Response Format",
          type: "select",
          defaultValue: "text",
          showWhen: { field: "agentShowAdvanced", equals: "true" },
          options: [
            { value: "text", label: "Text (Default)" },
            { value: "json", label: "JSON Mode" },
          ],
        },
        // Main goal field
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
              label: "Native: Search + Scrape + Calculate (Default)",
            },
            {
              value: "web_search,scrape_url,http_request,calculate",
              label: "Native: All Tools",
            },
            { value: "web_search", label: "Native: Web Search Only" },
            { value: "web_search,scrape_url", label: "Native: Search + Scrape" },
            { value: "http_request", label: "Native: HTTP Request Only" },
            {
              value: "firecrawl_search,firecrawl_scrape,calculate",
              label: "Firecrawl: Search + Scrape + Calculate (Requires Integration)",
            },
            {
              value: "web_search,firecrawl_scrape,calculate",
              label: "Hybrid: Native Search + Firecrawl Scrape + Calculate",
            },
            {
              value: "web_search,scrape_url,firecrawl_search,firecrawl_scrape,http_request,calculate",
              label: "All Tools (Native + Firecrawl)",
            },
          ],
        },
        {
          key: "agentFirecrawlIntegrationId",
          label: "Firecrawl Integration ID",
          type: "template-input",
          placeholder: "Integration ID from your Firecrawl setup (required for Firecrawl tools)",
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

