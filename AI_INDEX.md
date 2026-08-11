# AI_INDEX — SmartScholar

Inventory of AI-related modules. Facts only.

## AI Providers

AgentRouter is the **only** AI provider in the active SmartScholar app. There is
no fallback chain.

| Provider | File | Purpose |
|----------|------|---------|
| AgentRouter | `src/lib/ai-review.ts` | The ONLY AI provider for document review (OpenAI-compatible gateway) |
| Embedding provider | `smartscholar-backend/scripts/generateEmbeddings.ts` | Generates scholarship vector embeddings (backend) |
| Deep-extract AI | `smartscholar-backend/src/deep-extract/ai.ts` | AI extraction for the ingestion pipeline (backend) |

## AI API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/documents/[id]/review` | Runs AI document review, stores result, counts against the free daily review quota |

## AI Services

| File | Function |
|------|----------|
| `src/lib/ai-review.ts` | `reviewDocument`, `callAgentRouter`, `buildReviewPrompt`, `calculateAverageScore`, `fingerprint` |
| `src/lib/scholarship-matcher.ts` | `matchScholarshipsToUser` (deterministic matching) |
| `src/lib/roadmap-generator.ts` | roadmap milestone generation (deterministic) |
| `smartscholar-backend/src/deep-extract/ai.ts` | AI-assisted field extraction |
| `smartscholar-backend/scripts/generateEmbeddings.ts` | embedding generation |

## AI Prompts

| File | Prompt purpose |
|------|----------------|
| `src/lib/ai-review.ts` | `REVIEW_PROMPT` — scores a CV/document on quality, ATS, competitiveness; returns JSON |
| `smartscholar-backend/src/deep-extract/ai.ts` | Extraction prompt for structured scholarship fields |

## AI Environment Variables

| Variable | Module |
|----------|--------|
| `AGENTROUTER_API_KEY` | `src/lib/ai-review.ts` |
| `AGENTROUTER_MODEL` | `src/lib/ai-review.ts` |
| `AGENTROUTER_ENDPOINT` | `src/lib/ai-review.ts` |
| `AGENTROUTER_ORIGINATOR` | `src/lib/ai-review.ts` |
| `AGENTROUTER_USER_AGENT` | `src/lib/ai-review.ts` |
| `AGENTROUTER_VERSION` | `src/lib/ai-review.ts` |
| `AI_DEBUG` | `src/lib/ai-review.ts` |
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
AI Provider (AgentRouter — the only provider, no fallback)
        ↓
Database (Review record, review quota updated)
        ↓
Frontend (score + feedback display)
```
