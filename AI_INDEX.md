# AI_INDEX — SmartScholar

Inventory of AI-related modules. Facts only.

## AI Providers

| Provider | File | Purpose |
|----------|------|---------|
| Groq | `src/lib/ai-review.ts` | Primary provider for document review (OpenAI-compatible) |
| Google Gemini | `src/lib/ai-review.ts` | Fallback provider for document review (Google REST API) |
| BazaarLink | `src/lib/ai-review.ts` | Fallback provider (OpenAI-compatible gateway) |
| AgentRouter | `src/lib/ai-review.ts` | Final fallback provider (OpenAI-compatible gateway) |
| FreeModel | `src/app/api/chat/route.ts` | Primary provider for chat |
| AgentRouter | `src/app/api/chat/route.ts` | Fallback provider for chat (multi-model loop) |
| Embedding provider | `smartscholar-backend/scripts/generateEmbeddings.ts` | Generates scholarship vector embeddings |
| Deep-extract AI | `smartscholar-backend/src/deep-extract/ai.ts` | AI extraction for the ingestion pipeline |

## AI API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/documents/[id]/review` | Runs AI document review, stores result, consumes a credit |
| `POST /api/chat` | AI scholarship coaching chat with user context |

## AI Services

| File | Function |
|------|----------|
| `src/lib/ai-review.ts` | `reviewDocument`, `callAI`, `callGemini`, `callOpenAICompatible`, `calculateAverageScore` |
| `src/app/api/chat/route.ts` | `callAI` (chat provider chain) |
| `src/lib/scholarship-matcher.ts` | `matchScholarshipsToUser` (deterministic matching) |
| `src/lib/roadmap-generator.ts` | roadmap milestone generation (deterministic) |
| `smartscholar-backend/src/deep-extract/ai.ts` | AI-assisted field extraction |
| `smartscholar-backend/scripts/generateEmbeddings.ts` | embedding generation |

## AI Prompts

| File | Prompt purpose |
|------|----------------|
| `src/lib/ai-review.ts` | `REVIEW_PROMPT` — scores a CV/document on quality, ATS, competitiveness; returns JSON |
| `src/app/api/chat/route.ts` | `SYSTEM_PROMPT` — scholarship coach persona for Middle Eastern students |
| `smartscholar-backend/src/deep-extract/ai.ts` | Extraction prompt for structured scholarship fields |

## AI Environment Variables

| Variable | Module |
|----------|--------|
| `GROQ_API_KEY` | `src/lib/ai-review.ts` |
| `GROQ_MODEL` | `src/lib/ai-review.ts` |
| `GROQ_ENDPOINT` | `src/lib/ai-review.ts` |
| `GEMINI_API_KEY` | `src/lib/ai-review.ts` |
| `GEMINI_MODEL` | `src/lib/ai-review.ts` |
| `BAZAARLINK_API_KEY` | `src/lib/ai-review.ts` |
| `BAZAARLINK_ENDPOINT` | `src/lib/ai-review.ts` |
| `AGENTROUTER_API_KEY` | `src/lib/ai-review.ts`, `src/app/api/chat/route.ts` |
| `AGENTROUTER_ORIGINATOR` | `src/lib/ai-review.ts` |
| `AGENTROUTER_USER_AGENT` | `src/lib/ai-review.ts` |
| `AGENTROUTER_VERSION` | `src/lib/ai-review.ts` |
| `AI_DEBUG` | `src/lib/ai-review.ts` |
| `FREEMODEL_API_KEY` | `src/app/api/chat/route.ts` |
| `EMBEDDING_API_URL` | `smartscholar-backend/scripts/generateEmbeddings.ts` |
| `EMBEDDING_API_KEY` | `smartscholar-backend/scripts/generateEmbeddings.ts` |
| `EMBEDDING_MODEL` | `smartscholar-backend/scripts/generateEmbeddings.ts` |

## AI Flow

```
User Upload (document)
        ↓
Review API (/api/documents/[id]/review)
        ↓
AI Service (reviewDocument → callAI)
        ↓
AI Provider (Groq → Gemini → BazaarLink → AgentRouter)
        ↓
Database (Review record, credit consumed)
        ↓
Frontend (score + feedback display)
```

```
User Message
        ↓
Chat API (/api/chat)
        ↓
AI Service (callAI + user context)
        ↓
AI Provider (FreeModel → AgentRouter)
        ↓
Frontend (chat reply)
```
