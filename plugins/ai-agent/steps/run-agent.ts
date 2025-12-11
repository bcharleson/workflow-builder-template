import "server-only";

import { createGateway, generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";
import { getErrorMessageAsync } from "@/lib/utils";
import { type AiAgentCredentials, getProviderApiKey } from "../credentials";

type AgentStep = {
  type: "tool_call" | "tool_result" | "text";
  toolName?: string;
  input?: Record<string, unknown>;
  output?: string;
  text?: string;
};

type RunAgentResult =
  | {
      success: true;
      data: {
        result: string;
        steps: AgentStep[];
        toolCalls: number;
      };
    }
  | { success: false; error: { message: string } };

export type RunAgentCoreInput = {
  // Provider and model selection
  agentProvider?: string;
  agentModelOpenai?: string;
  agentModelAnthropic?: string;
  agentModelGoogle?: string;
  agentModelMeta?: string;
  agentModelMistral?: string;
  agentModelGroq?: string;

  // Advanced model configuration
  agentShowAdvanced?: string;
  agentTemperature?: string;
  agentMaxTokens?: string;
  agentTopP?: string;
  agentFrequencyPenalty?: string;
  agentPresencePenalty?: string;
  agentReasoningEffort?: string;
  agentStopSequences?: string;
  agentResponseFormat?: string;

  // Agent behavior
  agentGoal?: string;
  agentTools?: string;
  agentMaxSteps?: string;
  agentSystemPrompt?: string;
};

export type RunAgentInput = StepInput &
  RunAgentCoreInput & {
    integrationId?: string;
  };

// Tool implementations
async function webSearch(query: string): Promise<string> {
  // Use DuckDuckGo instant answer API (no auth required)
  const response = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
  );
  const data = await response.json();

  if (data.Abstract) {
    return `${data.Abstract}\nSource: ${data.AbstractURL}`;
  }
  if (data.RelatedTopics && data.RelatedTopics.length > 0) {
    const topics = data.RelatedTopics.slice(0, 3)
      .filter((t: { Text?: string }) => t.Text)
      .map((t: { Text: string }) => t.Text)
      .join("\n");
    return topics || "No results found. Try a more specific query.";
  }
  return "No results found. Try a different search query.";
}

async function scrapeUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WorkflowBot/1.0; +https://workflow.vercel.app)",
      },
    });
    const html = await response.text();
    // Basic HTML to text extraction
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);
    return text || "Could not extract content from URL";
  } catch (error) {
    return `Failed to fetch URL: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

async function httpRequest(
  url: string,
  method: string,
  body?: string
): Promise<string> {
  try {
    const options: RequestInit = {
      method: method.toUpperCase(),
      headers: { "Content-Type": "application/json" },
    };
    if (body && method.toUpperCase() !== "GET") {
      options.body = body;
    }
    const response = await fetch(url, options);
    const text = await response.text();
    return text.slice(0, 5000);
  } catch (error) {
    return `HTTP request failed: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

function calculate(expression: string): string {
  try {
    // Safe math evaluation using Function constructor with restricted scope
    const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "");
    if (!sanitized) return "Invalid expression";
    const result = new Function(`return (${sanitized})`)();
    return String(result);
  } catch {
    return "Could not evaluate expression";
  }
}

// Tool input schemas
const webSearchSchema = z.object({
  query: z.string().describe("The search query"),
});

const scrapeUrlSchema = z.object({
  url: z.string().url().describe("The URL to scrape"),
});

const httpRequestSchema = z.object({
  url: z.string().url().describe("The URL to request"),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]).describe("HTTP method"),
  body: z.string().optional().describe("Request body as JSON string"),
});

const calculateSchema = z.object({
  expression: z
    .string()
    .describe("Math expression to evaluate (e.g., 2+2, 100*0.15)"),
});

// Build tools based on user selection
function buildTools(selectedTools: string[]) {
  const allTools = {
    web_search: tool({
      description: "Search the web for information. Returns relevant results.",
      inputSchema: webSearchSchema,
      execute: async ({ query }: z.infer<typeof webSearchSchema>) =>
        webSearch(query),
    }),
    scrape_url: tool({
      description: "Fetch and extract text content from a URL.",
      inputSchema: scrapeUrlSchema,
      execute: async ({ url }: z.infer<typeof scrapeUrlSchema>) =>
        scrapeUrl(url),
    }),
    http_request: tool({
      description: "Make an HTTP request to any API endpoint.",
      inputSchema: httpRequestSchema,
      execute: async ({
        url,
        method,
        body,
      }: z.infer<typeof httpRequestSchema>) => httpRequest(url, method, body),
    }),
    calculate: tool({
      description: "Perform mathematical calculations.",
      inputSchema: calculateSchema,
      execute: async ({ expression }: z.infer<typeof calculateSchema>) =>
        calculate(expression),
    }),
  };

  const tools: typeof allTools = {} as typeof allTools;
  for (const name of selectedTools) {
    if (name in allTools) {
      (tools as Record<string, (typeof allTools)[keyof typeof allTools]>)[
        name
      ] = allTools[name as keyof typeof allTools];
    }
  }
  return tools;
}

const DEFAULT_SYSTEM_PROMPT = `You are an autonomous AI agent that accomplishes goals by using available tools.

Instructions:
- Break down complex goals into steps
- Use tools to gather information and take actions
- Be thorough but efficient - don't make unnecessary tool calls
- When you have enough information to answer, provide a clear final response
- If a tool fails, try an alternative approach`;

/**
 * Core agent logic
 */
async function stepHandler(
  input: RunAgentCoreInput,
  credentials: AiAgentCredentials
): Promise<RunAgentResult> {
  // Get model based on selected provider
  const provider = input.agentProvider || "openai";
  const modelId =
    (provider === "openai" && input.agentModelOpenai) ||
    (provider === "anthropic" && input.agentModelAnthropic) ||
    (provider === "google" && input.agentModelGoogle) ||
    (provider === "meta" && input.agentModelMeta) ||
    (provider === "mistral" && input.agentModelMistral) ||
    (provider === "groq" && input.agentModelGroq) ||
    "openai/gpt-4o";

  // Get the appropriate API key for the selected provider
  const apiKey = getProviderApiKey(credentials, provider);

  if (!apiKey) {
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    return {
      success: false,
      error: {
        message: `No API key configured for ${providerName}. Please add either a ${providerName} API key or an AI Gateway key in Project Integrations.`,
      },
    };
  }

  const goal = input.agentGoal?.trim();
  if (!goal) {
    return {
      success: false,
      error: { message: "Goal is required for the agent" },
    };
  }

  const maxSteps = Math.min(
    50,
    Math.max(1, Number.parseInt(input.agentMaxSteps || "10", 10) || 10)
  );
  const selectedTools = (
    input.agentTools || "web_search,scrape_url,calculate"
  ).split(",");
  const systemPrompt = input.agentSystemPrompt || DEFAULT_SYSTEM_PROMPT;

  // Parse advanced configuration options
  const showAdvanced = input.agentShowAdvanced === "true";
  const temperature = showAdvanced
    ? Math.max(0, Math.min(2, Number.parseFloat(input.agentTemperature || "0.7")))
    : 0.7;
  const maxTokens = showAdvanced
    ? Math.max(1, Number.parseInt(input.agentMaxTokens || "4096", 10))
    : 4096;
  const topP = showAdvanced
    ? Math.max(0, Math.min(1, Number.parseFloat(input.agentTopP || "1.0")))
    : 1.0;
  const frequencyPenalty = showAdvanced
    ? Math.max(-2, Math.min(2, Number.parseFloat(input.agentFrequencyPenalty || "0")))
    : 0;
  const presencePenalty = showAdvanced
    ? Math.max(-2, Math.min(2, Number.parseFloat(input.agentPresencePenalty || "0")))
    : 0;
  const reasoningEffort = input.agentReasoningEffort || "medium";
  const stopSequences = input.agentStopSequences
    ? input.agentStopSequences.split(",").map((s) => s.trim())
    : undefined;
  const responseFormat = input.agentResponseFormat || "text";

  // Check if this is a reasoning model (o1, o3)
  const isReasoningModel = modelId.includes("/o1") || modelId.includes("/o3");

  const tools = buildTools(selectedTools);
  const agentSteps: AgentStep[] = [];
  let toolCallCount = 0;

  try {
    const gateway = createGateway({ apiKey });

    // Build provider options for reasoning models and JSON mode
    // biome-ignore lint/suspicious/noExplicitAny: Provider-specific options vary by model
    let providerOptions: Record<string, any> | undefined;

    if (isReasoningModel) {
      providerOptions = {
        openai: {
          reasoningEffort: reasoningEffort as "low" | "medium" | "high",
        },
      };
    }

    if (responseFormat === "json") {
      providerOptions = {
        ...providerOptions,
        openai: {
          ...(providerOptions?.openai || {}),
          responseFormat: { type: "json_object" },
        },
      };
    }

    const result = await generateText({
      model: gateway(modelId),
      system: systemPrompt,
      prompt: goal,
      tools,
      stopWhen: stepCountIs(maxSteps),
      maxOutputTokens: maxTokens,
      // Only include standard parameters for non-reasoning models
      ...(isReasoningModel
        ? {}
        : {
            temperature,
            topP,
            frequencyPenalty,
            presencePenalty,
          }),
      // Include stop sequences if configured
      ...(stopSequences && stopSequences.length > 0 ? { stopSequences } : {}),
      // Include provider options if any
      ...(providerOptions ? { providerOptions } : {}),
      onStepFinish: ({ toolCalls, toolResults, text }) => {
        if (toolCalls && toolResults) {
          for (let i = 0; i < toolCalls.length; i++) {
            const tc = toolCalls[i];
            const tr = toolResults[i];
            agentSteps.push({
              type: "tool_call",
              toolName: tc.toolName,
              input: tc.input as Record<string, unknown>,
            });
            agentSteps.push({
              type: "tool_result",
              toolName: tc.toolName,
              output: String(tr.output),
            });
            toolCallCount++;
          }
        }
        if (text) {
          agentSteps.push({ type: "text", text });
        }
      },
    });

    return {
      success: true,
      data: {
        result: result.text || "Agent completed without a final response",
        steps: agentSteps,
        toolCalls: toolCallCount,
      },
    };
  } catch (error) {
    const message = await getErrorMessageAsync(error);
    return {
      success: false,
      error: { message: `Agent execution failed: ${message}` },
    };
  }
}

/**
 * App entry point - fetches credentials and wraps with logging
 */
export async function runAgentStep(
  input: RunAgentInput
): Promise<RunAgentResult> {
  "use step";

  const credentials = input.integrationId
    ? await fetchCredentials(input.integrationId)
    : {};

  return withStepLogging(input, () => stepHandler(input, credentials));
}
runAgentStep.maxRetries = 0;

export const _integrationType = "ai-agent";

