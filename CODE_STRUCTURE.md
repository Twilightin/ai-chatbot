# AI Chatbot - Code Structure Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Architecture](#project-architecture)
4. [Directory Structure](#directory-structure)
5. [Core Components](#core-components)
6. [Authentication System](#authentication-system)
7. [Database Schema](#database-schema)
8. [AI Integration](#ai-integration)
9. [API Routes](#api-routes)
10. [State Management](#state-management)
11. [Artifacts System](#artifacts-system)
12. [Testing](#testing)

---

## Project Overview

**Name**: AI Chatbot (Chat SDK)  
**Version**: 3.1.0  
**Type**: Next.js AI-powered chatbot application  
**Package Manager**: pnpm (v9.12.3)

A modern, full-stack AI chatbot application built with Next.js 15, featuring real-time streaming responses, document artifacts, multi-model support, and comprehensive user authentication.

---

## Technology Stack

### Frontend

- **Framework**: Next.js 15.3.0-canary.31 (App Router, React Server Components)
- **React**: 19.0.0-rc (Release Candidate)
- **UI Library**: Radix UI components + shadcn/ui
- **Styling**: Tailwind CSS 4.1.13
- **Animations**: Framer Motion 11.3.19
- **Fonts**: Geist & Geist Mono (Google Fonts)
- **Theming**: next-themes (dark/light mode)

### Backend & AI

- **AI Framework**: Vercel AI SDK 5.0.26
- **AI Gateway**: Vercel AI Gateway (routing to multiple providers)
- **Default Model**: xAI Grok models
  - `grok-2-vision-1212` (multimodal)
  - `grok-3-mini` (reasoning with chain-of-thought)
- **Authentication**: NextAuth.js 5.0.0-beta.25
- **Database ORM**: Drizzle ORM 0.34.0
- **Database**: PostgreSQL (via postgres.js)
- **Caching**: Redis 5.0.0 (optional, for resumable streams)

### Code Editors & Tools

- **Code Editor**: CodeMirror 6.0.1 (JavaScript, Python support)
- **Text Editor**: ProseMirror (rich text editing)
- **Spreadsheet**: react-data-grid 7.0.0-beta.47
- **Syntax Highlighting**: Shiki 3.12.2
- **Math Rendering**: KaTeX 0.16.25
- **File Storage**: Vercel Blob Storage

### Development Tools

- **TypeScript**: 5.6.3
- **Linter/Formatter**: Biome 2.2.2 (via ultracite)
- **Testing**: Playwright 1.50.1
- **Build Tool**: Turbopack (via Next.js --turbo)
- **Telemetry**: OpenTelemetry (Vercel OTEL)

---

## Project Architecture

### Architectural Pattern

- **Hybrid**: Server-Side Rendering (SSR) + Client-Side Rendering (CSR)
- **Partial Pre-Rendering (PPR)**: Enabled experimentally
- **Route Groups**: Organized by feature (`(auth)`, `(chat)`)
- **Server Actions**: Used for mutations and database operations
- **Streaming**: AI responses streamed via Server-Sent Events (SSE)

### Data Flow

```
User Input → Client Component → API Route → AI Model → Streaming Response → UI Update
                ↓                                              ↓
            Server Action                                  Database
                ↓
            PostgreSQL
```

### Key Design Patterns

1. **Server Components First**: Default to RSC for better performance
2. **Progressive Enhancement**: Client components only when needed
3. **Optimistic Updates**: UI updates before server confirmation
4. **Resumable Streams**: Support for long-running AI responses
5. **Real-time Collaboration**: Multi-document versioning system

---

## Directory Structure

```
ai-chatbot/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (theme, fonts, providers)
│   ├── globals.css              # Global styles
│   ├── (auth)/                  # Authentication route group
│   │   ├── auth.ts              # NextAuth configuration
│   │   ├── auth.config.ts       # Auth config (providers, callbacks)
│   │   ├── actions.ts           # Login/register server actions
│   │   ├── login/               # Login page
│   │   ├── register/            # Register page
│   │   └── api/                 # Auth API routes
│   └── (chat)/                  # Chat route group
│       ├── page.tsx             # Main chat page
│       ├── layout.tsx           # Chat layout (sidebar, providers)
│       ├── actions.ts           # Chat server actions
│       ├── chat/[id]/           # Individual chat routes
│       └── api/                 # Chat API routes
│           ├── chat/            # Main chat endpoint
│           ├── document/        # Document CRUD
│           ├── history/         # Chat history
│           ├── vote/            # Message voting
│           ├── suggestions/     # AI suggestions
│           └── files/           # File upload
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui base components
│   ├── elements/                # Reusable chat elements
│   ├── chat.tsx                 # Main chat component
│   ├── messages.tsx             # Message list
│   ├── message.tsx              # Individual message
│   ├── artifact.tsx             # Artifact container
│   ├── code-editor.tsx          # CodeMirror integration
│   ├── text-editor.tsx          # ProseMirror integration
│   ├── sheet-editor.tsx         # Spreadsheet editor
│   ├── image-editor.tsx         # Image editor
│   ├── multimodal-input.tsx     # Input with file upload
│   ├── app-sidebar.tsx          # Navigation sidebar
│   ├── model-selector.tsx       # AI model selector
│   └── visibility-selector.tsx  # Public/private toggle
│
├── artifacts/                    # Artifact type implementations
│   ├── actions.ts               # Artifact server actions
│   ├── text/                    # Text documents
│   │   ├── client.tsx           # Client component
│   │   └── server.ts            # Server logic
│   ├── code/                    # Code editor
│   │   ├── client.tsx
│   │   └── server.ts
│   ├── sheet/                   # Spreadsheets
│   │   ├── client.tsx
│   │   └── server.ts
│   └── image/                   # Images
│       └── client.tsx
│
├── lib/                          # Utility libraries
│   ├── ai/                      # AI-related utilities
│   │   ├── models.ts            # Model definitions
│   │   ├── providers.ts         # AI provider configuration
│   │   ├── prompts.ts           # System prompts
│   │   ├── entitlements.ts      # User limits & permissions
│   │   └── tools/               # AI tools/functions
│   │       ├── get-weather.ts   # Weather tool
│   │       ├── create-document.ts
│   │       ├── update-document.ts
│   │       └── request-suggestions.ts
│   ├── db/                      # Database layer
│   │   ├── schema.ts            # Drizzle schema
│   │   ├── queries.ts           # Database queries
│   │   ├── migrate.ts           # Migration runner
│   │   ├── utils.ts             # DB utilities
│   │   ├── migrations/          # SQL migrations
│   │   └── helpers/             # Query helpers
│   ├── artifacts/               # Artifact handlers
│   │   └── server.ts            # Server-side artifact logic
│   ├── editor/                  # Editor utilities
│   ├── types.ts                 # TypeScript types
│   ├── utils.ts                 # General utilities
│   ├── constants.ts             # App constants
│   ├── errors.ts                # Error handling
│   └── usage.ts                 # Token usage tracking
│
├── hooks/                        # Custom React hooks
│   ├── use-artifact.ts          # Artifact state management
│   ├── use-auto-resume.ts       # Auto-resume chat streams
│   ├── use-chat-visibility.ts   # Chat visibility state
│   ├── use-messages.tsx         # Message utilities
│   ├── use-mobile.ts            # Mobile detection
│   └── use-scroll-to-bottom.tsx # Auto-scroll behavior
│
├── public/                       # Static assets
│   └── images/                  # Image files
│
├── tests/                        # Test suite
│   ├── e2e/                     # End-to-end tests
│   ├── pages/                   # Page tests
│   ├── routes/                  # Route tests
│   ├── prompts/                 # Prompt tests
│   ├── fixtures.ts              # Test fixtures
│   └── helpers.ts               # Test helpers
│
├── drizzle.config.ts            # Drizzle ORM config
├── next.config.ts               # Next.js config
├── tsconfig.json                # TypeScript config
├── tailwind.config.ts           # Tailwind config
├── biome.jsonc                  # Biome linter config
├── playwright.config.ts         # Playwright config
├── middleware.ts                # Next.js middleware
├── instrumentation.ts           # OpenTelemetry setup
├── package.json                 # Dependencies
└── pnpm-lock.yaml              # Lock file
```

---

## Core Components

### 1. Chat Component (`components/chat.tsx`)

**Purpose**: Main chat interface with message streaming and AI interaction

**Key Features**:

- Real-time message streaming via AI SDK
- Multimodal input (text + file attachments)
- Message regeneration
- Auto-resume interrupted streams
- Visibility control (public/private)
- Token usage tracking

**State Management**:

```typescript
- messages: ChatMessage[]          // Conversation history
- input: string                    // Current input
- status: "idle" | "streaming"     // Chat status
- usage: AppUsage                  // Token usage metrics
- currentModelId: string           // Selected AI model
```

**Key Methods**:

- `sendMessage()` - Send user message to AI
- `regenerate()` - Regenerate last AI response
- `resumeStream()` - Resume interrupted stream
- `stop()` - Stop current generation

### 2. Messages Component (`components/messages.tsx`)

**Purpose**: Renders list of chat messages with virtualization

**Features**:

- Message grouping by role
- Vote system (thumbs up/down)
- Message editing
- Reasoning display (for reasoning models)
- Syntax highlighting for code blocks
- LaTeX math rendering

### 3. Artifact Component (`components/artifact.tsx`)

**Purpose**: Side panel for displaying and editing documents/code

**Supported Artifact Types**:

1. **Text** - Rich text documents (ProseMirror)
2. **Code** - Python/JavaScript code (CodeMirror)
3. **Sheet** - Spreadsheets (react-data-grid)
4. **Image** - Image generation/editing

**Features**:

- Real-time streaming content
- Version history
- Diff view (compare versions)
- Collaborative editing
- Auto-save with debouncing
- Fullscreen mode

### 4. Multimodal Input (`components/multimodal-input.tsx`)

**Purpose**: Input field with file upload support

**Capabilities**:

- Text input with auto-resize
- File drag-and-drop
- File upload to Vercel Blob
- Attachment preview
- Suggested actions (quick prompts)

### 5. App Sidebar (`components/app-sidebar.tsx`)

**Purpose**: Navigation and chat history

**Features**:

- Chat history list
- Infinite scroll pagination
- Search/filter chats
- Create new chat
- Delete chats
- User profile menu
- Theme switcher

---

## Authentication System

### Configuration (`app/(auth)/auth.ts`)

**Providers**:

1. **Credentials Provider** - Email/password login
2. **Guest Provider** - Anonymous user creation

**User Types**:

```typescript
type UserType = "guest" | "regular";
```

**Session Extension**:

```typescript
interface Session {
  user: {
    id: string;
    email: string;
    type: UserType; // Added
  };
}
```

### Authentication Flow

1. **Guest Users**:

   ```
   Redirect to /api/auth/guest → Create temp user → Sign in → Redirect back
   ```

2. **Regular Users**:

   ```
   /login → Submit credentials → Validate → Create session → Redirect to chat
   ```

3. **Registration**:
   ```
   /register → Validate email → Hash password → Create user → Auto sign-in
   ```

### Middleware (`middleware.ts`)

**Protection Rules**:

- All routes require authentication (except `/api/auth`)
- Unauthenticated users → redirect to guest creation
- Authenticated users can't access `/login` or `/register`

**Special Routes**:

- `/ping` - Health check for Playwright tests
- `/api/auth/*` - Public auth endpoints

---

## Database Schema

### Tables

#### 1. **User** (`user`)

```typescript
{
  id: uuid(PK); // Unique user ID
  email: varchar(64); // User email
  password: varchar(64); // Hashed password (bcrypt)
}
```

#### 2. **Chat** (`chat`)

```typescript
{
  id: uuid(PK); // Chat ID
  createdAt: timestamp; // Creation time
  title: text; // Chat title
  userId: uuid(FK); // Owner user ID
  visibility: "public" | "private"; // Visibility
  lastContext: jsonb; // Last usage metrics
}
```

#### 3. **Message** (`message` / `Message_v2`)

```typescript
{
  id: uuid(PK); // Message ID
  chatId: uuid(FK); // Parent chat
  role: varchar; // "user" | "assistant" | "system"
  parts: json; // Message parts (text, tool calls)
  attachments: json; // File attachments
  createdAt: timestamp; // Creation time
}
```

**Note**: `Message_v2` is the current schema. `Message` (deprecated) is kept for migration.

#### 4. **Vote** (`vote` / `Vote_v2`)

```typescript
{
  chatId: uuid (FK)          // Chat ID
  messageId: uuid (FK)       // Message ID
  isUpvoted: boolean         // True = upvote, False = downvote
  PRIMARY KEY (chatId, messageId)
}
```

#### 5. **Document** (`document`)

```typescript
{
  id: uuid                   // Document ID
  createdAt: timestamp       // Version timestamp
  title: text                // Document title
  content: text              // Document content
  kind: "text" | "code" | "image" | "sheet"
  userId: uuid (FK)          // Owner user ID
  PRIMARY KEY (id, createdAt)  // Composite key for versioning
}
```

#### 6. **Suggestion** (`suggestion`)

```typescript
{
  id: uuid(PK); // Suggestion ID
  documentId: uuid(FK); // Target document
  documentCreatedAt: timestamp; // Document version
  originalText: text; // Original text
  suggestedText: text; // Suggested replacement
  description: text; // Explanation
  isResolved: boolean; // Accepted/rejected
  userId: uuid(FK); // Creator user ID
  createdAt: timestamp; // Creation time
}
```

#### 7. **Stream** (`stream`)

```typescript
{
  id: uuid(PK); // Stream ID
  chatId: uuid(FK); // Associated chat
  createdAt: timestamp; // Creation time
}
```

### Database Queries (`lib/db/queries.ts`)

**Key Functions**:

- `getUser(email)` - Find user by email
- `createUser(email, password)` - Register new user
- `createGuestUser()` - Create anonymous user
- `saveChat()` - Create new chat
- `getChatById()` - Retrieve chat
- `getChatsByUserId()` - Paginated chat history
- `deleteChatById()` - Delete chat & associated data
- `saveMessages()` - Batch insert messages
- `getMessagesByChatId()` - Get chat messages
- `getMessageCountByUserId()` - Rate limiting check
- `saveDocument()` - Create document version
- `getDocumentById()` - Get document with versions
- `saveSuggestions()` - Save AI suggestions

---

## AI Integration

### Provider Configuration (`lib/ai/providers.ts`)

```typescript
const myProvider = customProvider({
  languageModels: {
    "chat-model": gateway.languageModel("xai/grok-2-vision-1212"),
    "chat-model-reasoning": wrapLanguageModel({
      model: gateway.languageModel("xai/grok-3-mini"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": gateway.languageModel("xai/grok-2-1212"),
    "artifact-model": gateway.languageModel("xai/grok-2-1212"),
  },
});
```

### Models (`lib/ai/models.ts`)

**Available Models**:

1. **Grok Vision** (`chat-model`)

   - Multimodal (text + images)
   - Vision capabilities
   - Tool calling support

2. **Grok Reasoning** (`chat-model-reasoning`)
   - Advanced chain-of-thought reasoning
   - Outputs reasoning process in `<think>` tags
   - No tool calling

### System Prompts (`lib/ai/prompts.ts`)

**Base Prompt**:

```
"You are a friendly assistant! Keep your responses concise and helpful."
```

**Artifacts Prompt** (for non-reasoning models):

- Instructions for creating/updating documents
- When to use artifacts vs inline responses
- Document update strategies

**Code Prompt**:

- Python code generation guidelines
- Best practices for executable snippets

**Sheet Prompt**:

- CSV spreadsheet creation

### AI Tools (`lib/ai/tools/`)

#### 1. **getWeather** (`get-weather.ts`)

**Purpose**: Fetch weather data for a location

**Input**:

```typescript
{
  latitude?: number,
  longitude?: number,
  city?: string  // e.g., "San Francisco"
}
```

**Output**: Weather data from Open-Meteo API

#### 2. **createDocument** (`create-document.ts`)

**Purpose**: Create a new artifact (text/code/sheet/image)

**Input**:

```typescript
{
  title: string,
  kind: "text" | "code" | "sheet" | "image"
}
```

**Process**:

1. Generate unique document ID
2. Stream metadata to UI
3. Call appropriate document handler
4. Save to database
5. Return confirmation

#### 3. **updateDocument** (`update-document.ts`)

**Purpose**: Modify existing document

**Input**:

```typescript
{
  id: string,           // Document ID
  description: string   // Update instructions
}
```

**Process**:

1. Fetch current document
2. Generate updated content via AI
3. Stream changes to UI
4. Save new version
5. Return confirmation

#### 4. **requestSuggestions** (`request-suggestions.ts`)

**Purpose**: Generate AI-powered edit suggestions

**Input**:

```typescript
{
  documentId: string;
}
```

**Output**: List of suggestions with diff information

---

## API Routes

### Chat API (`app/(chat)/api/chat/route.ts`)

**Endpoint**: `POST /api/chat`

**Request Body**:

```typescript
{
  id: string,                    // Chat ID
  message: ChatMessage,          // User message
  selectedChatModel: string,     // Model ID
  selectedVisibilityType: "public" | "private"
}
```

**Response**: Server-Sent Events (SSE) stream

**Flow**:

1. Authenticate user
2. Check rate limits
3. Load or create chat
4. Fetch message history
5. Generate AI response (streaming)
6. Save messages to database
7. Update usage metrics

**Streaming Format**:

```
data: {"type":"text-delta","data":"Hello"}
data: {"type":"tool-call","data":{...}}
data: {"type":"data-usage","data":{...}}
```

**Rate Limiting**:

- Guest users: 10 messages/day
- Regular users: 50 messages/day

### Document API (`app/(chat)/api/document/route.ts`)

**Endpoints**:

- `GET /api/document?id={id}` - Get document versions
- `POST /api/document` - Create document
- `PATCH /api/document` - Update document (new version)
- `DELETE /api/document?id={id}` - Delete document

### History API (`app/(chat)/api/history/route.ts`)

**Endpoint**: `GET /api/history`

**Query Parameters**:

```
?limit=20
&startingAfter={chatId}    // For pagination
&endingBefore={chatId}
```

**Response**:

```typescript
{
  chats: Chat[],
  hasMore: boolean,
  nextCursor: string | null
}
```

### Vote API (`app/(chat)/api/vote/route.ts`)

**Endpoints**:

- `GET /api/vote?chatId={id}` - Get votes for chat
- `PATCH /api/vote` - Submit vote (upvote/downvote)

### Suggestions API (`app/(chat)/api/suggestions/route.ts`)

**Endpoints**:

- `GET /api/suggestions?documentId={id}` - Get suggestions
- `POST /api/suggestions` - Create suggestion
- `PATCH /api/suggestions` - Resolve suggestion

### Files API (`app/(chat)/api/files/route.ts`)

**Endpoint**: `POST /api/files`

**Purpose**: Upload files to Vercel Blob Storage

**Request**: `multipart/form-data`

**Response**:

```typescript
{
  url: string,          // Blob URL
  name: string,
  contentType: string
}
```

---

## State Management

### Global State

**1. Data Stream Provider** (`components/data-stream-provider.tsx`)

- Context for AI streaming data
- Broadcasts stream updates to all subscribers

**2. Artifact Context** (`hooks/use-artifact.ts`)

- Current artifact state
- Metadata (id, title, kind)
- Visibility toggle

**3. SWR Cache** (via `swr` library)

- Chat history
- Document versions
- Votes
- Suggestions

### Local State (Chat Component)

```typescript
const [input, setInput] = useState<string>("");
const [usage, setUsage] = useState<AppUsage>();
const [currentModelId, setCurrentModelId] = useState<string>();
const [attachments, setAttachments] = useState<Attachment[]>([]);
```

### Server State (SWR)

```typescript
const { data: votes } = useSWR<Vote[]>(`/api/vote?chatId=${id}`, fetcher);
const { data: documents } = useSWR<Document[]>(
  `/api/document?id=${docId}`,
  fetcher
);
const { data: chats } = useSWRInfinite(getChatHistoryPaginationKey, fetcher);
```

---

## Artifacts System

### Architecture

```
Artifact Definition (client.tsx)
     ↓
Artifact Handler (server.ts)
     ↓
Database (document table)
     ↓
UI Component (editor/viewer)
```

### Artifact Lifecycle

1. **Creation**:

   ```
   AI calls createDocument tool →
   Generate ID/title →
   Stream to UI →
   Call onCreateDocument handler →
   Save to DB →
   Render in artifact panel
   ```

2. **Update**:

   ```
   AI calls updateDocument tool →
   Fetch current content →
   Generate diff →
   Stream changes →
   Call onUpdateDocument handler →
   Save new version →
   Update UI
   ```

3. **Manual Edit**:
   ```
   User edits in editor →
   Debounce changes →
   PATCH /api/document →
   Save new version →
   Update version list
   ```

### Text Artifact (`artifacts/text/`)

**Editor**: ProseMirror with Markdown support

**Features**:

- Rich text editing
- Markdown syntax
- Auto-save
- Version history
- Export to Markdown

**Server Handler**:

```typescript
onCreateDocument: async ({ dataStream, ... }) => {
  // Generate text content via AI
  // Stream to UI
  // Save to database
}
```

### Code Artifact (`artifacts/code/`)

**Editor**: CodeMirror 6

**Features**:

- Python/JavaScript syntax highlighting
- Code execution (Python via Pyodide)
- Console output display
- Line numbers
- Auto-completion

**Execution Environment**:

- Python: Pyodide (WebAssembly)
- JavaScript: Native browser

### Sheet Artifact (`artifacts/sheet/`)

**Editor**: react-data-grid

**Features**:

- CSV import/export
- Cell editing
- Formula support (basic)
- Sorting/filtering
- Column resizing

### Image Artifact (`artifacts/image/`)

**Features**:

- Image display
- URL-based images
- Responsive sizing

---

## Testing

### Test Framework

- **E2E**: Playwright
- **Config**: `playwright.config.ts`

### Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── chat.spec.ts       # Chat functionality
│   ├── auth.spec.ts       # Authentication flows
│   └── artifacts.spec.ts  # Artifact creation/editing
├── pages/                  # Page object models
├── routes/                 # API route tests
├── prompts/                # Prompt engineering tests
├── fixtures.ts             # Test data
└── helpers.ts              # Test utilities
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm exec playwright test tests/e2e/chat.spec.ts

# Run in UI mode
pnpm exec playwright test --ui

# Debug mode
pnpm exec playwright test --debug
```

### Environment Setup

Tests require:

- `PLAYWRIGHT=True` environment variable
- Test database connection
- Mock AI providers (via `models.mock.ts`)

---

## Error Handling

### Error System (`lib/errors.ts`)

**ChatSDKError Class**:

```typescript
class ChatSDKError {
  code: ErrorCode;
  cause?: string;

  toResponse(): Response {
    return new Response(
      JSON.stringify({
        code: this.code,
        cause: this.cause,
      }),
      {
        status: this.getStatusCode(),
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
```

**Error Codes**:

- `bad_request:api` - Invalid request
- `bad_request:database` - DB operation failed
- `unauthorized:chat` - Not authenticated
- `forbidden:chat` - No permission
- `rate_limit:chat` - Too many requests
- `offline:chat` - No internet connection
- `not_found:database` - Resource not found

### Error Handling Flow

```typescript
try {
  // Operation
} catch (error) {
  if (error instanceof ChatSDKError) {
    return error.toResponse();
  }

  // Log unexpected errors
  console.error(error);

  return new Response("Internal Server Error", { status: 500 });
}
```

---

## Usage Tracking

### TokenLens Integration (`lib/usage.ts`)

**Purpose**: Track AI token usage and costs

**Data Collected**:

```typescript
type AppUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number; // USD
  modelId?: string;
};
```

**Integration**:

1. Fetch model catalog (cached 24h)
2. Calculate usage from AI response
3. Enrich with cost data
4. Save to chat.lastContext
5. Display in UI

**Cost Calculation**:

```typescript
const catalog = await getTokenlensCatalog();
const usage = getUsage({
  modelId: "xai/grok-2-vision-1212",
  usage: { promptTokens, completionTokens },
  providers: catalog,
});
```

---

## Environment Variables

### Required Variables

```bash
# Database
POSTGRES_URL=postgresql://...

# Authentication
AUTH_SECRET=your-secret-key

# AI (for non-Vercel deployments)
AI_GATEWAY_API_KEY=your-key

# Storage (optional)
BLOB_READ_WRITE_TOKEN=your-token

# Redis (optional, for resumable streams)
REDIS_URL=redis://...
```

### Environment Files

- `.env.local` - Local development
- `.env.production` - Production (via Vercel)

---

## Deployment

### Vercel Deployment

**Steps**:

1. Connect GitHub repository
2. Configure environment variables
3. Deploy

**Automatic**:

- Database provisioning (Neon Postgres)
- Blob storage setup
- OpenTelemetry integration
- AI Gateway authentication (OIDC)

### Self-Hosted Deployment

**Requirements**:

- PostgreSQL database
- Redis (optional)
- Node.js 18+
- AI Gateway API key

**Build**:

```bash
pnpm install
pnpm db:migrate
pnpm build
pnpm start
```

---

## Scripts

### Development

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Build for production
pnpm start        # Start production server
```

### Database

```bash
pnpm db:generate  # Generate migration from schema
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio (GUI)
pnpm db:push      # Push schema to DB (dev only)
pnpm db:pull      # Pull schema from DB
```

### Code Quality

```bash
pnpm lint         # Run linter (Biome via ultracite)
pnpm format       # Format code
```

### Testing

```bash
pnpm test         # Run Playwright tests
```

---

## Performance Optimizations

### 1. **Partial Pre-Rendering (PPR)**

- Static shell + dynamic content
- Faster initial load

### 2. **Turbopack**

- Faster dev server (vs Webpack)
- Incremental compilation

### 3. **Server Components**

- Reduced client bundle size
- Better SEO

### 4. **Streaming**

- Progressive rendering
- Lower Time to First Byte (TTFB)

### 5. **SWR Caching**

- Optimistic updates
- Background revalidation
- Reduced API calls

### 6. **Database Indexing**

- Indexed foreign keys
- Composite indexes for pagination

### 7. **Image Optimization**

- Next.js Image component
- Automatic WebP conversion
- Remote pattern allowlist

---

## Security Features

### 1. **Authentication**

- Session-based auth (NextAuth.js)
- Bcrypt password hashing
- CSRF protection

### 2. **Authorization**

- User ownership checks
- Role-based access (guest vs regular)

### 3. **Rate Limiting**

- Message limits per user type
- Prevents abuse

### 4. **Input Validation**

- Zod schemas for all inputs
- SQL injection prevention (Drizzle ORM)

### 5. **Content Security**

- Sanitized user inputs
- Safe HTML rendering
- XSS prevention

### 6. **Environment Isolation**

- Separate dev/production configs
- Secure cookie settings

---

## Key Dependencies Explained

### AI & Streaming

- `ai` (5.0.26) - Vercel AI SDK core
- `@ai-sdk/react` (2.0.26) - React hooks for AI
- `@ai-sdk/gateway` (1.0.15) - AI Gateway integration
- `resumable-stream` (2.0.0) - Long-running stream support
- `streamdown` (1.3.0) - Markdown streaming

### Database & ORM

- `drizzle-orm` (0.34.0) - Type-safe ORM
- `postgres` (3.4.4) - PostgreSQL client
- `drizzle-kit` (0.25.0) - Migration toolkit

### UI Components

- `@radix-ui/*` - Headless UI primitives
- `lucide-react` (0.446.0) - Icon library
- `framer-motion` (11.3.19) - Animations
- `sonner` (1.5.0) - Toast notifications

### Editors

- `codemirror` (6.0.1) - Code editor
- `prosemirror-*` - Rich text editor
- `react-data-grid` (7.0.0-beta.47) - Spreadsheet

### Authentication

- `next-auth` (5.0.0-beta.25) - Auth framework
- `bcrypt-ts` (5.0.2) - Password hashing

### Utilities

- `date-fns` (4.1.0) - Date formatting
- `zod` (3.25.76) - Schema validation
- `nanoid` (5.0.8) - ID generation
- `swr` (2.2.5) - Data fetching

---

## Future Enhancements (Based on Code)

1. **Resumable Streams** - Redis-based stream resumption (partially implemented)
2. **Multi-language Code Support** - Currently Python-focused
3. **Advanced Formulas** - Spreadsheet calculations
4. **Image Generation** - AI-powered image creation
5. **Collaborative Editing** - Real-time multi-user editing
6. **Voice Input** - Speech-to-text
7. **PDF Export** - Document export functionality
8. **Plugin System** - Custom tool/artifact extensions

---

## Contributing Guidelines

### Code Style

- Follow Biome rules (ultracite preset)
- Use TypeScript strict mode
- Prefer server components
- Document complex logic

### Git Workflow

1. Create feature branch
2. Make changes
3. Run linter: `pnpm lint`
4. Run tests: `pnpm test`
5. Commit with descriptive message
6. Create pull request

### Naming Conventions

- Components: PascalCase (`ChatHeader.tsx`)
- Utilities: camelCase (`generateUUID.ts`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_CHAT_MODEL`)
- Database tables: PascalCase (`User`, `Chat`)

---

## Troubleshooting

### Common Issues

**1. Database Connection Failed**

```bash
# Check POSTGRES_URL in .env.local
# Ensure database is running
pnpm db:push  # Sync schema
```

**2. AI Requests Failing**

```bash
# For non-Vercel deployments, set AI_GATEWAY_API_KEY
# Check network connectivity
# Verify model IDs in providers.ts
```

**3. Build Errors**

```bash
# Clear cache
rm -rf .next
pnpm install
pnpm build
```

**4. Test Failures**

```bash
# Ensure PLAYWRIGHT=True is set
# Check test database connection
# Update snapshots if needed
pnpm exec playwright test --update-snapshots
```

---

## Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Vercel AI SDK](https://ai-sdk.dev/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [NextAuth.js](https://authjs.dev)
- [Tailwind CSS](https://tailwindcss.com)

### Project Links

- [Live Demo](https://chat.vercel.ai)
- [GitHub](https://github.com/vercel/ai-chatbot)
- [Chat SDK Docs](https://chat-sdk.dev)

---

## License

This project is licensed under the terms specified in the LICENSE file.

---

**Last Updated**: November 7, 2025  
**Version**: 3.1.0
