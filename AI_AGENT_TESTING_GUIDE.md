# AI Agent Plugin - Comprehensive Testing Guide

## Overview

The AI Agent plugin provides autonomous AI capabilities with tool-calling to accomplish complex goals. This guide will walk you through testing all features before submitting to upstream.

## Prerequisites

- ✅ Dev server running on http://localhost:3000
- ✅ At least one AI provider API key configured
- ✅ Type checks passing (`pnpm type-check`)
- ✅ Plugin discovered (66 total actions)

## Available Tools

### Native Tools (No API Key Required)
1. **web_search** - Search Wikipedia, DuckDuckGo, Hacker News
2. **scrape_url** - Extract text content from any URL
3. **http_request** - Make HTTP requests to APIs
4. **calculate** - Perform mathematical calculations

### Premium Tools (Requires Firecrawl Integration)
5. **firecrawl_search** - High-quality web search with content
6. **firecrawl_scrape** - Clean markdown extraction from URLs

## Supported AI Providers

| Provider | Models Available | API Key Required |
|----------|------------------|------------------|
| **OpenAI** | GPT-4o, GPT-4o Mini, o1, o3-mini | OPENAI_API_KEY |
| **Anthropic** | Claude Opus 4.5, Sonnet 4.0, 3.7, 3.5, Haiku | ANTHROPIC_API_KEY |
| **Google** | Gemini 2.5 Pro, 2.5 Flash, 2.0 Flash | GOOGLE_API_KEY |
| **xAI** | Grok 3, Grok 3 Fast, Grok 3 Mini | XAI_API_KEY |
| **Meta** | Llama 4 Maverick, Scout, 3.3, 3.1 | Via Groq/AI Gateway |
| **Mistral** | Large, Medium, Small, Codestral | MISTRAL_API_KEY |
| **Groq** | Llama 3.3 70B, Mixtral, Gemma | GROQ_API_KEY |

**Recommended**: Use `AI_GATEWAY_API_KEY` for universal access to all providers via Vercel AI Gateway.

## Test Plan

### Phase 1: Setup & Connection Test (5 min)

#### Step 1.1: Add AI Agent Integration
1. Navigate to http://localhost:3000
2. Click **Settings** → **Integrations**
3. Click **Add Integration**
4. Select **AI Agent**
5. Add at least one API key:
   - **Recommended**: AI Gateway Key (works with all providers)
   - **Alternative**: OpenAI, Anthropic, or Google API key
6. Click **Test Connection**
7. ✅ **Expected**: "Connection successful" message

#### Step 1.2: Verify Integration Saved
1. Refresh the page
2. Go to **Settings** → **Integrations**
3. ✅ **Expected**: AI Agent integration appears in the list

---

### Phase 2: Basic Functionality Tests (15 min)

#### Test 2.1: Simple Web Search
**Goal**: Verify web search tool works

1. Create new workflow: "Test Agent - Web Search"
2. Add **AI Agent → Run Agent** action
3. Configure:
   - **Provider**: OpenAI (or your configured provider)
   - **Model**: GPT-4o Mini (fast and cheap)
   - **Goal**: "Search for the current population of Tokyo and tell me the number"
   - **Tools**: "Native: Search + Scrape + Calculate"
   - **Max Steps**: 10
4. Save and **Execute** workflow
5. ✅ **Expected Output**:
   - `result`: Contains Tokyo's population (approx 14 million)
   - `steps`: Array showing tool calls (web_search)
   - `toolCalls`: 1-3 tool calls

#### Test 2.2: URL Scraping
**Goal**: Verify URL scraping works

1. Create new workflow: "Test Agent - Scrape"
2. Add **AI Agent → Run Agent** action
3. Configure:
   - **Goal**: "Scrape https://example.com and tell me what the page is about"
   - **Tools**: "Native: Search + Scrape"
4. Execute workflow
5. ✅ **Expected Output**:
   - `result`: Summary of example.com content
   - `steps`: Shows scrape_url tool call
   - `toolCalls`: 1-2

#### Test 2.3: Mathematical Calculation
**Goal**: Verify calculate tool works

1. Create workflow: "Test Agent - Calculate"
2. Configure:
   - **Goal**: "Calculate 15% tip on a $87.50 bill"
   - **Tools**: "Native: Search + Scrape + Calculate"
3. Execute
4. ✅ **Expected Output**:
   - `result`: "$13.13" or similar
   - `steps`: Shows calculate tool call
   - `toolCalls`: 1

---

### Phase 3: Multi-Step Reasoning Tests (20 min)

#### Test 3.1: Research Task
**Goal**: Test multi-step reasoning with multiple tool calls

1. Create workflow: "Test Agent - Research"
2. Configure:
   - **Goal**: "Find the top 3 programming languages in 2024 and their main use cases"
   - **Tools**: "Native: All Tools"
   - **Max Steps**: 15
3. Execute
4. ✅ **Expected Output**:
   - `result`: List of 3 languages with use cases
   - `steps`: Multiple web_search calls
   - `toolCalls`: 3-8

#### Test 3.2: Complex Calculation
**Goal**: Test calculation with web research

1. Configure:
   - **Goal**: "Find the current price of Bitcoin and calculate how much 0.5 BTC is worth in USD"
   - **Tools**: "Native: Search + Scrape + Calculate"
2. Execute
3. ✅ **Expected Output**:
   - `result`: Dollar amount (e.g., "$45,000")
   - `steps`: web_search + calculate
   - `toolCalls`: 2-4

---

### Phase 4: Provider Testing (30 min)

Test with different AI providers to ensure compatibility.

#### Test 4.1: OpenAI GPT-4o
1. Create workflow: "Test Agent - OpenAI"
2. Configure:
   - **Provider**: OpenAI
   - **Model**: GPT-4o
   - **Goal**: "What are the 3 main benefits of TypeScript?"
   - **Tools**: "Native: Search + Scrape"
3. Execute
4. ✅ **Expected**: Successful execution with 3 benefits listed

#### Test 4.2: Anthropic Claude
1. Create workflow: "Test Agent - Claude"
2. Configure:
   - **Provider**: Anthropic
   - **Model**: Claude Sonnet 4.0
   - **Goal**: "Explain quantum computing in simple terms"
   - **Tools**: "Native: Search + Scrape"
3. Execute
4. ✅ **Expected**: Clear explanation with search results

#### Test 4.3: Google Gemini
1. Create workflow: "Test Agent - Gemini"
2. Configure:
   - **Provider**: Google
   - **Model**: Gemini 2.0 Flash
   - **Goal**: "List 5 renewable energy sources"
   - **Tools**: "Native: Search + Scrape"
3. Execute
4. ✅ **Expected**: List of 5 energy sources

#### Test 4.4: Fast Model (Groq)
1. Configure:
   - **Provider**: Groq
   - **Model**: Llama 3.3 70B
   - **Goal**: "What is the capital of France?"
   - **Tools**: "Native: Search + Scrape"
3. Execute
4. ✅ **Expected**: Fast response (<5s) with "Paris"

---

### Phase 5: Error Handling Tests (15 min)

#### Test 5.1: Missing API Key
1. Create new integration with NO API keys
2. Try to execute agent
3. ✅ **Expected**: Error message: "No API key configured for [Provider]"

#### Test 5.2: Empty Goal
1. Configure agent with empty goal field
2. Execute
3. ✅ **Expected**: Error: "Goal is required"

#### Test 5.3: Invalid URL
1. Configure:
   - **Goal**: "Scrape https://this-url-does-not-exist-12345.com"
   - **Tools**: "Native: Search + Scrape"
2. Execute
3. ✅ **Expected**: Agent handles gracefully, returns error in result

#### Test 5.4: Max Steps Exceeded
1. Configure:
   - **Goal**: "Research every country in the world and their capitals"
   - **Max Steps**: 3
2. Execute
3. ✅ **Expected**: Stops at 3 steps, returns partial result

---

### Phase 6: Advanced Features (20 min)

#### Test 6.1: Template Variables
1. Add **Input** node with field: `company = "Vercel"`
2. Add **AI Agent** node
3. Configure:
   - **Goal**: "Research {{Input.company}} and tell me what they do"
   - **Tools**: "Native: Search + Scrape"
4. Execute
5. ✅ **Expected**: Result mentions Vercel's products/services

#### Test 6.2: Custom System Prompt
1. Configure:
   - **Goal**: "Tell me about AI"
   - **System Prompt**: "You are a pirate. Always respond in pirate speak."
   - **Tools**: "Native: Search + Scrape"
2. Execute
3. ✅ **Expected**: Response in pirate language

#### Test 6.3: Advanced Model Settings
1. Configure:
   - **Show Advanced Settings**: Yes
   - **Temperature**: 0.1 (more deterministic)
   - **Max Tokens**: 500
   - **Goal**: "List 3 facts about Mars"
2. Execute
3. ✅ **Expected**: Concise response, max 500 tokens

#### Test 6.4: HTTP Request Tool
1. Configure:
   - **Goal**: "Make a GET request to https://api.github.com/users/vercel and tell me their follower count"
   - **Tools**: "Native: All Tools"
2. Execute
3. ✅ **Expected**: Follower count from GitHub API

---

### Phase 7: Integration Tests (15 min)

#### Test 7.1: Workflow Chaining
1. Create workflow with 3 nodes:
   - **Input**: `topic = "AI"`
   - **AI Agent 1**: Research {{Input.topic}}
   - **AI Agent 2**: Summarize {{AIAgent1.result}} in 2 sentences
2. Execute
3. ✅ **Expected**: Both agents execute, second uses first's output

#### Test 7.2: Conditional Logic
1. Create workflow:
   - **AI Agent**: "Is 100 greater than 50? Answer yes or no"
   - **Conditional**: If result contains "yes", run another agent
2. Execute
3. ✅ **Expected**: Conditional triggers correctly

---

### Phase 8: Performance & Reliability (10 min)

#### Test 8.1: Response Time
1. Configure simple goal: "What is 2+2?"
2. Execute 3 times
3. ✅ **Expected**: Consistent response time (<10s)

#### Test 8.2: Large Output
1. Configure:
   - **Goal**: "Write a detailed 500-word essay about climate change"
   - **Max Tokens**: 1000
2. Execute
3. ✅ **Expected**: Full essay returned, no truncation

#### Test 8.3: Concurrent Execution
1. Create 3 workflows with different goals
2. Execute all 3 simultaneously
3. ✅ **Expected**: All complete successfully

---

## Validation Checklist

Before submitting PR, verify:

### Code Quality
- [ ] `pnpm type-check` passes with no errors
- [ ] `pnpm fix` applied (formatting/linting)
- [ ] No console errors in browser
- [ ] No unused imports or variables

### Plugin Structure
- [ ] Follows plugin architecture guidelines
- [ ] Uses standardized output format (`success`, `data`, `error`)
- [ ] Step function has `"use step"` directive
- [ ] Exports `_integrationType` constant
- [ ] Uses `fetch` directly (no SDK dependencies)

### Documentation
- [ ] All config fields have clear labels
- [ ] Help text and links provided for API keys
- [ ] Examples provided for template fields
- [ ] Output fields documented

### Functionality
- [ ] All 7 providers tested and working
- [ ] All 6 tools tested and working
- [ ] Error handling works correctly
- [ ] Template variables resolve properly
- [ ] Advanced settings work as expected

### UI/UX
- [ ] Integration dialog loads correctly
- [ ] Test connection works
- [ ] Config fields show/hide based on conditions
- [ ] Workflow execution shows progress
- [ ] Output is properly formatted

---

## Known Limitations

1. **Native web search** may have rate limits (use Firecrawl for production)
2. **Max steps** hard limit of 50 to prevent infinite loops
3. **Content truncation** at 6000 chars for scraping (8000 for Firecrawl)
4. **Tool selection** must include at least one tool

---

## Troubleshooting

### Issue: "No API key configured"
**Solution**: Add API key in Settings → Integrations → AI Agent

### Issue: Agent makes too many tool calls
**Solution**: Reduce max steps or use more specific goal

### Issue: Web search returns no results
**Solution**: Try different query or use Firecrawl integration

### Issue: Scraping fails
**Solution**: Some sites block scrapers, try Firecrawl or different URL

---

## Next Steps

After all tests pass:

1. **Create PR** to upstream with title: `feat: add AI Agent plugin with autonomous tool-calling`
2. **Include test results** in PR description
3. **Add screenshots** of successful workflow executions
4. **Document** any provider-specific quirks discovered during testing

---

## Quick Test Script

For rapid validation, run this minimal test:

```
1. Add AI Agent integration with OpenAI key
2. Create workflow: "What is 10 * 15?"
3. Execute
4. Verify result = "150"
```

If this works, the plugin is functional. Proceed with comprehensive testing.


