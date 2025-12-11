import { createGateway, generateText } from "ai";

export async function testAiAgent(credentials: Record<string, string>) {
  try {
    const apiKey = credentials.AI_GATEWAY_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: "AI_GATEWAY_API_KEY is required",
      };
    }

    // Test with a simple generation to verify the API key works
    const gateway = createGateway({ apiKey });

    await generateText({
      model: gateway("openai/gpt-4o-mini"),
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

