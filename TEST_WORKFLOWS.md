# Quick Test Workflows for AI Agent

Copy these workflow configurations for rapid testing.

## Test 1: Simple Calculation (2 min)
**Purpose**: Verify basic tool calling works

**Configuration:**
- Provider: OpenAI
- Model: GPT-4o Mini
- Goal: `What is 15% of $87.50?`
- Tools: Native: Search + Scrape + Calculate
- Max Steps: 5

**Expected Result:**
```json
{
  "result": "$13.13",
  "toolCalls": 1,
  "steps": [{"type": "tool_call", "toolName": "calculate"}]
}
```

---

## Test 2: Web Search (3 min)
**Purpose**: Verify web search tool works

**Configuration:**
- Provider: OpenAI
- Model: GPT-4o Mini
- Goal: `What is the population of Tokyo, Japan?`
- Tools: Native: Search + Scrape + Calculate
- Max Steps: 10

**Expected Result:**
```json
{
  "result": "Approximately 14 million (or 37 million metro area)",
  "toolCalls": 1-3,
  "steps": [{"type": "tool_call", "toolName": "web_search"}]
}
```

---

## Test 3: URL Scraping (3 min)
**Purpose**: Verify URL scraping works

**Configuration:**
- Provider: OpenAI
- Model: GPT-4o Mini
- Goal: `Scrape https://example.com and tell me what it's about`
- Tools: Native: Search + Scrape
- Max Steps: 5

**Expected Result:**
```json
{
  "result": "Example Domain - a simple example website for documentation",
  "toolCalls": 1,
  "steps": [{"type": "tool_call", "toolName": "scrape_url"}]
}
```

---

## Test 4: Multi-Step Research (5 min)
**Purpose**: Verify complex reasoning with multiple tool calls

**Configuration:**
- Provider: OpenAI
- Model: GPT-4o
- Goal: `Find the top 3 programming languages in 2024 and their primary use cases`
- Tools: Native: All Tools
- Max Steps: 15

**Expected Result:**
```json
{
  "result": "1. Python - AI/ML, data science\n2. JavaScript - Web development\n3. TypeScript - Enterprise web apps",
  "toolCalls": 3-8,
  "steps": [multiple web_search calls]
}
```

---

## Test 5: Template Variables (4 min)
**Purpose**: Verify template variable resolution

**Setup:**
1. Add Input node with field: `company = "Vercel"`
2. Add AI Agent node

**Configuration:**
- Provider: OpenAI
- Model: GPT-4o Mini
- Goal: `What does {{Input.company}} do?`
- Tools: Native: Search + Scrape
- Max Steps: 10

**Expected Result:**
```json
{
  "result": "Vercel is a cloud platform for frontend developers...",
  "toolCalls": 1-3
}
```

---

## Test 6: Error Handling (2 min)
**Purpose**: Verify graceful error handling

**Configuration:**
- Provider: OpenAI
- Model: GPT-4o Mini
- Goal: `Scrape https://this-does-not-exist-12345.com`
- Tools: Native: Search + Scrape
- Max Steps: 5

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "result": "Failed to scrape URL: [error message]",
    "toolCalls": 1
  }
}
```

---

## Test 7: Custom System Prompt (3 min)
**Purpose**: Verify custom system prompts work

**Configuration:**
- Provider: OpenAI
- Model: GPT-4o Mini
- Goal: `Tell me about artificial intelligence`
- System Prompt: `You are a pirate. Always respond in pirate speak with "arr" and "matey".`
- Tools: Native: Search + Scrape
- Max Steps: 10

**Expected Result:**
```json
{
  "result": "Arr matey! Artificial intelligence be...",
  "toolCalls": 1-3
}
```

---

## Test 8: HTTP Request (4 min)
**Purpose**: Verify HTTP request tool works

**Configuration:**
- Provider: OpenAI
- Model: GPT-4o Mini
- Goal: `Make a GET request to https://api.github.com/users/vercel and tell me their follower count`
- Tools: Native: All Tools
- Max Steps: 5

**Expected Result:**
```json
{
  "result": "Vercel has [number] followers on GitHub",
  "toolCalls": 1-2,
  "steps": [{"type": "tool_call", "toolName": "http_request"}]
}
```

---

## Test 9: Advanced Settings (3 min)
**Purpose**: Verify advanced model configuration works

**Configuration:**
- Provider: OpenAI
- Model: GPT-4o Mini
- Show Advanced Settings: Yes
- Temperature: 0.1
- Max Tokens: 200
- Goal: `List 3 facts about Mars`
- Tools: Native: Search + Scrape
- Max Steps: 10

**Expected Result:**
```json
{
  "result": "1. Mars is red\n2. Has two moons\n3. Fourth planet from sun",
  "toolCalls": 1-2
}
```
(Response should be concise due to low temperature and token limit)

---

## Test 10: Provider Comparison (10 min)
**Purpose**: Verify all providers work

Run the same goal with different providers:

**Goal:** `What is the capital of France?`
**Tools:** Native: Search + Scrape
**Max Steps:** 5

Test with:
1. ✅ OpenAI GPT-4o Mini
2. ✅ Anthropic Claude 3 Haiku
3. ✅ Google Gemini 2.0 Flash
4. ✅ Groq Llama 3.1 8B

**Expected:** All return "Paris" successfully

---

## Rapid Smoke Test (1 min)

**Fastest way to verify plugin works:**

1. Add AI Agent integration with any API key
2. Create workflow with goal: `What is 2 + 2?`
3. Tools: Native: Search + Scrape + Calculate
4. Execute
5. ✅ Expected: `result = "4"`

If this works, plugin is functional!

