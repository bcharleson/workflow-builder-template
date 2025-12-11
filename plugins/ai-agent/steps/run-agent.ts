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
  agentModelXai?: string;

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
  // Integration IDs
  agentFirecrawlIntegrationId?: string;
};

export type RunAgentInput = StepInput &
  RunAgentCoreInput & {
    integrationId?: string;
  };

// Tool implementations

/**
 * Native web search using multiple free sources
 * Priority: 1) Wikipedia API, 2) DuckDuckGo Instant Answer API
 * No API key required
 */
async function webSearch(query: string): Promise<string> {
  try {
    const results: { title: string; snippet: string; url: string }[] = [];

    // Strategy 1: Wikipedia API - reliable and no CAPTCHA
    try {
      const wikiResponse = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=3&origin=*`
      );
      const wikiData = await wikiResponse.json();

      if (wikiData.query?.search?.length > 0) {
        for (const result of wikiData.query.search.slice(0, 3)) {
          results.push({
            title: result.title,
            snippet: result.snippet.replace(/<[^>]*>/g, ""),
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, "_"))}`,
          });
        }
      }
    } catch {
      // Wikipedia failed, continue to next source
    }

    // Strategy 2: DuckDuckGo Instant Answer API
    try {
      const ddgResponse = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
      );
      const ddgData = await ddgResponse.json();

      // Add abstract if available
      if (ddgData.Abstract && ddgData.AbstractURL) {
        results.push({
          title: ddgData.Heading || query,
          snippet: ddgData.Abstract,
          url: ddgData.AbstractURL,
        });
      }

      // Add related topics
      if (ddgData.RelatedTopics?.length > 0) {
        for (const topic of ddgData.RelatedTopics.slice(0, 3)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(" - ")[0] || topic.Text.slice(0, 50),
              snippet: topic.Text,
              url: topic.FirstURL,
            });
          }
        }
      }
    } catch {
      // DuckDuckGo failed, continue
    }

    // Strategy 3: Hacker News Algolia API for tech queries
    if (
      results.length < 3 &&
      /tech|programming|software|startup|ai|machine learning|javascript|python|react|node/i.test(
        query
      )
    ) {
      try {
        const hnResponse = await fetch(
          `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=3`
        );
        const hnData = await hnResponse.json();

        if (hnData.hits?.length > 0) {
          for (const hit of hnData.hits.slice(0, 3)) {
            if (hit.title && hit.url) {
              results.push({
                title: `[HN] ${hit.title}`,
                snippet: `${hit.points || 0} points, ${hit.num_comments || 0} comments`,
                url: hit.url,
              });
            }
          }
        }
      } catch {
        // HN failed, continue
      }
    }

    if (results.length === 0) {
      return `No search results found for "${query}". Try rephrasing your query or using more specific terms.`;
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const uniqueResults = results.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    // Format results
    return uniqueResults
      .map(
        (r, i) =>
          `${i + 1}. ${r.title}\n${r.snippet ? `   ${r.snippet}\n` : ""}   URL: ${r.url}`
      )
      .join("\n\n");
  } catch (error) {
    return `Search failed: ${error instanceof Error ? error.message : "Unknown error"}. Try a different query.`;
  }
}

/**
 * Native URL scraping with improved HTML-to-text extraction
 * Extracts meaningful content from web pages
 */
async function scrapeUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract meta description
    const metaDescMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
    );
    const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : "";

    // Remove unwanted elements
    let content = html
      // Remove scripts, styles, and other non-content elements
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");

    // Try to extract main content areas first
    const mainMatch =
      content.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
      content.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
      content.match(
        /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i
      );

    if (mainMatch) {
      content = mainMatch[1];
    }

    // Convert block elements to newlines
    content = content
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n• ")
      .replace(/<\/li>/gi, "");

    // Remove remaining tags
    content = content.replace(/<[^>]+>/g, " ");

    // Clean up whitespace
    content = content
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Build output
    let output = "";
    if (title) output += `Title: ${title}\n\n`;
    if (metaDesc) output += `Summary: ${metaDesc}\n\n`;
    output += `Content:\n${content.slice(0, 6000)}`;

    if (content.length > 6000) {
      output += "\n\n[Content truncated...]";
    }

    return output || "Could not extract meaningful content from URL";
  } catch (error) {
    return `Failed to scrape URL: ${error instanceof Error ? error.message : "Unknown error"}`;
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

const firecrawlSearchSchema = z.object({
  query: z.string().describe("Search query to find relevant web pages"),
});

const firecrawlScrapeSchema = z.object({
  url: z.string().url().describe("URL to scrape with Firecrawl"),
});

/**
 * Firecrawl search - requires API key
 */
async function firecrawlSearch(
  query: string,
  apiKey: string
): Promise<string> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        limit: 5,
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Firecrawl API error: ${error}`);
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      return "No search results found.";
    }

    // Format results
    return result.data
      .slice(0, 5)
      .map(
        (item: { url?: string; title?: string; markdown?: string }, i: number) =>
          `${i + 1}. ${item.title || "Untitled"}\n   URL: ${item.url || "N/A"}\n   ${item.markdown?.slice(0, 500) || ""}`
      )
      .join("\n\n");
  } catch (error) {
    return `Firecrawl search failed: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Firecrawl scrape - requires API key
 */
async function firecrawlScrape(url: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Firecrawl API error: ${error}`);
    }

    const result = await response.json();

    if (!result.success || !result.data?.markdown) {
      return "Could not scrape URL.";
    }

    const markdown = result.data.markdown.slice(0, 8000);
    const metadata = result.data.metadata || {};

    let output = "";
    if (metadata.title) output += `Title: ${metadata.title}\n`;
    if (metadata.description) output += `Description: ${metadata.description}\n`;
    output += `\nContent:\n${markdown}`;

    if (result.data.markdown.length > 8000) {
      output += "\n\n[Content truncated...]";
    }

    return output;
  } catch (error) {
    return `Firecrawl scrape failed: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

// Build tools based on user selection
function buildTools(selectedTools: string[], firecrawlApiKey?: string) {
  // biome-ignore lint/suspicious/noExplicitAny: Tool types are complex
  const allTools: Record<string, any> = {
    web_search: tool({
      description:
        "Search the web for information using native search. Returns titles, snippets, and URLs.",
      inputSchema: webSearchSchema,
      execute: async ({ query }: z.infer<typeof webSearchSchema>) =>
        webSearch(query),
    }),
    scrape_url: tool({
      description:
        "Fetch and extract text content from a URL using native scraping.",
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

  // Add Firecrawl tools if API key is available
  if (firecrawlApiKey) {
    allTools.firecrawl_search = tool({
      description:
        "Search the web using Firecrawl (premium). Returns high-quality results with page content.",
      inputSchema: firecrawlSearchSchema,
      execute: async ({ query }: z.infer<typeof firecrawlSearchSchema>) =>
        firecrawlSearch(query, firecrawlApiKey),
    });
    allTools.firecrawl_scrape = tool({
      description:
        "Scrape a URL using Firecrawl (premium). Returns clean markdown content.",
      inputSchema: firecrawlScrapeSchema,
      execute: async ({ url }: z.infer<typeof firecrawlScrapeSchema>) =>
        firecrawlScrape(url, firecrawlApiKey),
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: Tool types are complex
  const tools: Record<string, any> = {};
  for (const name of selectedTools) {
    if (name in allTools) {
      tools[name] = allTools[name];
    } else if (
      (name === "firecrawl_search" || name === "firecrawl_scrape") &&
      !firecrawlApiKey
    ) {
      // Skip Firecrawl tools if no API key - will use native fallback
      if (name === "firecrawl_search") {
        tools.web_search = allTools.web_search;
      } else if (name === "firecrawl_scrape") {
        tools.scrape_url = allTools.scrape_url;
      }
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
  credentials: AiAgentCredentials,
  firecrawlApiKey?: string
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
    (provider === "xai" && input.agentModelXai) ||
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

  const tools = buildTools(selectedTools, firecrawlApiKey);
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

  // Fetch Firecrawl credentials if integration ID is provided
  let firecrawlApiKey: string | undefined;
  if (input.agentFirecrawlIntegrationId) {
    try {
      const fcCreds = await fetchCredentials(input.agentFirecrawlIntegrationId);
      firecrawlApiKey = fcCreds.FIRECRAWL_API_KEY;
    } catch {
      // Firecrawl not configured, will use native tools as fallback
    }
  }

  return withStepLogging(input, () =>
    stepHandler(input, credentials, firecrawlApiKey)
  );
}
runAgentStep.maxRetries = 0;

export const _integrationType = "ai-agent";

