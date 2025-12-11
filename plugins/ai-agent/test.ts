import { createGateway, generateText } from "ai";
import type { AiAgentCredentials } from "./credentials";
import { getProviderApiKey } from "./credentials";

export async function testAiAgent(credentials: Record<string, string>) {
  try {
    // Cast to typed credentials
    const typedCredentials = credentials as AiAgentCredentials;

    // Check if any API key is available
    const hasAnyKey =
      typedCredentials.AI_GATEWAY_API_KEY ||
      typedCredentials.OPENAI_API_KEY ||
      typedCredentials.ANTHROPIC_API_KEY ||
      typedCredentials.GOOGLE_API_KEY ||
      typedCredentials.GROQ_API_KEY ||
      typedCredentials.MISTRAL_API_KEY ||
      typedCredentials.XAI_API_KEY;

    if (!hasAnyKey) {
      return {
        success: false,
        error:
          "At least one API key is required. Add an AI Gateway key or a provider-specific key.",
      };
    }

    // Test with OpenAI if available, otherwise use whatever key we have
    const testProvider = typedCredentials.OPENAI_API_KEY
      ? "openai"
      : typedCredentials.AI_GATEWAY_API_KEY
        ? "openai" // AI Gateway can use any model
        : typedCredentials.ANTHROPIC_API_KEY
          ? "anthropic"
          : typedCredentials.GOOGLE_API_KEY
            ? "google"
            : typedCredentials.GROQ_API_KEY
              ? "groq"
              : typedCredentials.XAI_API_KEY
                ? "xai"
                : "mistral";

    const apiKey = getProviderApiKey(typedCredentials, testProvider);

    if (!apiKey) {
      return {
        success: false,
        error: "Could not find a valid API key to test",
      };
    }

    const gateway = createGateway({ apiKey });

    // Use appropriate model based on provider
    const testModel =
      testProvider === "anthropic"
        ? "anthropic/claude-3-haiku"
        : testProvider === "google"
          ? "google/gemini-2.0-flash"
          : testProvider === "groq"
            ? "groq/llama-3.1-8b"
            : testProvider === "mistral"
              ? "mistral/mistral-small"
              : testProvider === "xai"
                ? "xai/grok-3-mini-fast"
                : "openai/gpt-4o-mini";

    await generateText({
      model: gateway(testModel),
      prompt: "Say 'agent ready' if you can read this.",
    });

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

