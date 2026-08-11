# AI_INDEX — SmartScholar

Inventory of AI-related modules. Facts only.

## AI Providers

AgentRouter is the **only** AI provider, reached through an isolated review
service on Railway (`AI_REVIEW_SERVICE_URL`). SmartScholar never calls
AgentRouter directly and holds no AgentRouter credentials — the API key lives
only in Railway. There is no fallback chain.

| Provider | File | Purpose |
|----------|------|---------|
| AgentRouter | Railway review service (not in this repo) | The ONLY AI provider for document review, called server-side by the review service |
| Review service client | `src/lib/ai-review.ts` | SmartScholar's client that POSTs `{ documentType, text }` to the Railway review service |
| Embedding provider | `smartscholar-backend/scripts/generateEmbeddings.ts` | Generates scholarship vector embeddings (backend) |
| Deep-extract AI | `smartscholar-backend/src/deep-extract/ai.ts` | AI extraction for the ingestion pipeline (backend) |

## AI API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/documents/[id]/review` | Runs AI document review, stores result, counts against the free daily review quota |

## AI Services

| File | Function |
|------|----------|
| `src/lib/ai-review.ts` | `reviewDocument`, `getReviewServiceUrl`, `calculateAverageScore`, `fingerprint`, `AiConfigError`, `AiCapacityError`, `AiWafBlockError` |
| `src/lib/scholarship-matcher.ts` | `matchScholarshipsToUser` (deterministic matching) |
| `src/lib/roadmap-generator.ts` | roadmap milestone generation (deterministic) |
| `smartscholar-backend/src/deep-extract/ai.ts` | AI-assisted field extraction |
| `smartscholar-backend/scripts/generateEmbeddings.ts` | embedding generation |

## AI Prompts

| File | Prompt purpose |
|------|----------------|
| Railway review service (not in this repo) | Prompt that scores a CV/document on quality, ATS, competitiveness; returns JSON — the prompt lives server-side in Railway, not in SmartScholar |
| `smartscholar-backend/src/deep-extract/ai.ts` | Extraction prompt for structured scholarship fields |

## AI Environment Variables

| Variable | Module |
|----------|--------|
| `AI_REVIEW_SERVICE_URL` | `src/lib/ai-review.ts` (base URL of the Railway review service; no API key in SmartScholar) |
| `AI_REVIEW_TIMEOUT_MS` | `src/lib/ai-review.ts` (optional, default 60s) |
| `AGENTROUTER_MODEL` | `src/lib/ai-review.ts` (metadata only — which model the review service used) |
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
AI Service (reviewDocument → POST {documentType, text} to AI_REVIEW_SERVICE_URL)
        ↓
Railway review service (owns AGENTROUTER_API_KEY, builds the prompt)
        ↓
AI Provider (AgentRouter — the only provider, no fallback)
        ↓
Database (Review record, review quota updated)
        ↓
Frontend (score + feedback display)
```
