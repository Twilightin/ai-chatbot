# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Chatbot application built with Next.js 15, featuring real-time AI streaming responses, document artifacts (text/code/spreadsheets), multimodal input, and conversational memory. Originally based on Vercel's AI Chatbot template but modified for Azure OpenAI.

**Key Modification**: This fork uses **Azure OpenAI GPT-4o** instead of Vercel AI Gateway/xAI Grok models. Authentication is disabled for local development but original code is preserved via comments.

## Essential Commands

### Development
```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Run migrations then build (production)
pnpm start        # Start production server
pnpm lint         # Check code quality (ultracite/Biome)
pnpm format       # Auto-fix code issues
```

### Database (Drizzle ORM)
```bash
pnpm db:migrate   # Run pending migrations
pnpm db:generate  # Generate migration from schema changes
pnpm db:studio    # Open Drizzle Studio GUI
pnpm db:push      # Push schema to DB (dev only, skips migrations)
```

### Testing
```bash
pnpm test                                    # Run all Playwright tests
pnpm exec playwright test <file>            # Run specific test
pnpm exec playwright test --ui              # Interactive UI mode
```

## Architecture Overview

### AI Provider Setup
The app uses a **custom provider abstraction** ([lib/ai/providers.ts](lib/ai/providers.ts)) that maps model IDs to actual AI providers:

```typescript
myProvider.languageModel("chat-model")           // → Azure GPT-4o
myProvider.languageModel("chat-model-reasoning") // → Azure GPT-4o
myProvider.languageModel("title-model")          // → Azure GPT-4o (title generation)
myProvider.languageModel("artifact-model")       // → Azure GPT-4o (document generation)
```

**Environment Variables**:
- `AZURE_OPENAI_API_KEY` - Your Azure API key
- `AZURE_OPENAI_ENDPOINT` - Azure endpoint URL
- `AZURE_OPENAI_LLM_DEP_NAME` - Deployment name (e.g., "gpt-4o")

Original Vercel AI Gateway code is commented out with `// ORIGINAL:` markers for reference.

### Chat Streaming Flow
1. User sends message → `POST /api/chat` ([app/(chat)/api/chat/route.ts](app/(chat)/api/chat/route.ts))
2. Load chat history + user memories from database
3. Process message parts (convert PDF/TXT to text, images to vision format)
4. Stream AI response using `streamText()` from AI SDK
5. AI can invoke tools (weather, createDocument, updateDocument, requestSuggestions)
6. Save messages + extract memories on completion
7. Return SSE stream to client

**Important**: Azure OpenAI doesn't support `file` content type, so PDFs/TXTs are converted to text parts and images to image parts before sending to the model ([route.ts:162-192](app/(chat)/api/chat/route.ts#L162-L192)).

### File Upload Processing
Files are uploaded to `/public/uploads/` ([app/(chat)/api/files/upload/route.ts](app/(chat)/api/files/upload/route.ts)):
- **PDF/TXT**: Text extracted server-side using `pdf-parse`/`fs.readFile`, returned as `extractedText`
- **Images (PNG/JPG)**: Converted to base64 data URL for vision API
- Original Vercel Blob code is commented out

Client-side ([components/multimodal-input.tsx](components/multimodal-input.tsx)) sends files to `/api/files/upload` and receives back URLs with extracted text.

### Memory System
**Location**: [lib/db/memory.ts](lib/db/memory.ts), schema in [lib/db/schema.ts:175-194](lib/db/schema.ts#L175-L194)

Stores user context across conversations:
- **Categories**: `preference`, `personal`, `context`, `fact`
- **Importance scoring**: 1-10 (only ≥5 loaded for context)
- **Access tracking**: `lastAccessedAt`, `accessCount` for decay algorithms
- **Automatic extraction**: Pattern-based extraction in chat route ([route.ts:363-384](app/(chat)/api/chat/route.ts#L363-L384))

Memories are formatted and injected into system prompt ([lib/ai/prompts.ts:53-76](lib/ai/prompts.ts#L53-L76)).

### Artifacts System
Artifacts are AI-generated documents displayed in a side panel. Flow:

1. AI calls `createDocument` tool with `kind: "text" | "code" | "sheet" | "image"`
2. Tool streams metadata to UI, generates content via AI, saves to `Document` table
3. Documents use composite primary key `(id, createdAt)` for versioning
4. Each edit creates a new version with same `id` but different `createdAt`
5. UI can diff versions, switch between them, or manually edit

**Tool Implementations**: [lib/ai/tools/](lib/ai/tools/)
- `createDocument`: Generates new artifact
- `updateDocument`: Modifies existing artifact (creates new version)
- `requestSuggestions`: AI-powered inline suggestions

**Editors**:
- Text: ProseMirror ([components/text-editor.tsx](components/text-editor.tsx))
- Code: CodeMirror with Python/JS support ([components/code-editor.tsx](components/code-editor.tsx))
- Sheet: react-data-grid ([components/sheet-editor.tsx](components/sheet-editor.tsx))

### Database Schema Patterns

**Versioned Tables**: `Message_v2`, `Vote_v2` are current. `Message`, `Vote` are deprecated but kept for migration compatibility. Always use the `_v2` tables.

**Composite Keys**: `Document` uses `(id, createdAt)` to store multiple versions of the same document.

**Foreign Key Cascades**: `Memory` table uses `onDelete: "cascade"` for `userId` and `onDelete: "set null"` for `chatId`.

## Code Quality Rules

This project uses **ultracite** (Biome-based linter) with strict rules. See [.cursor/rules/ultracite.mdc](.cursor/rules/ultracite.mdc) for full list.

### Critical Rules
- **No `any` type** - Use proper TypeScript types
- **No TypeScript enums** - Use unions or objects instead
- **Import types with `import type`** - Separate type imports
- **Use `export type` for types** - Explicit type exports
- **Arrow functions preferred** - Use `() =>` over `function`
- **No `.forEach()`** - Use `for...of` loops instead
- **Use `const` by default** - Only `let` when reassigning
- **No console statements** - Remove before commit (allowed in server code)
- **React hooks**: Must be top-level, correct dependencies

### Next.js Specific
- Never use `<img>` - Use `next/image` `<Image>` component
- Never use `<head>` - Use `next/head` or metadata API
- Server components by default - Use `"use client"` only when needed

## Important Patterns

### Authentication (Currently Disabled)
Authentication is **commented out** for local development. Search for `// ORIGINAL:` to find preserved code. Mock session is used:
```typescript
const session = await auth(); // This works but middleware allows all requests
```

To re-enable: Uncomment auth logic in [middleware.ts](middleware.ts), [route.ts](app/(chat)/api/chat/route.ts), and page files.

### Server Actions
Located in `actions.ts` files:
- [app/(chat)/actions.ts](app/(chat)/actions.ts) - Chat title generation, visibility updates
- [app/(auth)/actions.ts](app/(auth)/actions.ts) - Login/register (currently unused)

Use Server Actions for mutations, API routes for streaming responses.

### Rate Limiting
Original implementation in [route.ts:134-142](app/(chat)/api/chat/route.ts#L134-L142):
- Guest users: 10 messages/day
- Regular users: 50 messages/day
- Currently commented out

### Error Handling
Use `ChatSDKError` class ([lib/errors.ts](lib/errors.ts)) for consistent error responses:
```typescript
return new ChatSDKError("bad_request:api").toResponse();
```

Error codes: `bad_request:api`, `unauthorized:chat`, `forbidden:chat`, `rate_limit:chat`, `offline:chat`, `not_found:database`

## Testing Notes

- Tests use mock AI models ([lib/ai/models.mock.ts](lib/ai/models.mock.ts)) to avoid API calls
- `PLAYWRIGHT=True` env var required
- Dev server auto-starts via Playwright config
- Health check endpoint: `GET /ping` returns `"pong"`

## Common Gotchas

1. **Message schema migration**: Always use `Message_v2`, not `Message` table
2. **File content types**: Azure OpenAI needs images as `image` parts, not `file` parts
3. **Build command**: Runs migrations automatically before building (`tsx lib/db/migrate && next build`)
4. **Provider abstraction**: Don't call Azure directly - use `myProvider.languageModel(modelId)`
5. **Streaming context**: Resumable streams require Redis (currently optional via `REDIS_URL`)
6. **Memory extraction**: Currently basic pattern matching - placeholder for AI-based extraction

## Environment Setup

Required in `.env.local`:
```bash
POSTGRES_URL=postgresql://...
AZURE_OPENAI_API_KEY=sk-...
AZURE_OPENAI_ENDPOINT=https://....openai.azure.com
AZURE_OPENAI_LLM_DEP_NAME=gpt-4o
```

Optional:
```bash
REDIS_URL=redis://...                    # For resumable streams
BLOB_READ_WRITE_TOKEN=...               # Not used (local storage)
AUTH_SECRET=...                          # Not used (auth disabled)
```

## Documentation Files

Several markdown docs exist with detailed information:
- [CODE_STRUCTURE.md](CODE_STRUCTURE.md) - Comprehensive architecture guide
- [MODIFICATIONS.md](MODIFICATIONS.md) - Changes from original template
- [LLM_MEMORY_SYSTEM.md](LLM_MEMORY_SYSTEM.md) - Memory system details
- Various fix documentation (artifact fixes, PDF handling, etc.)

These are reference documents and should not be modified without good reason.
