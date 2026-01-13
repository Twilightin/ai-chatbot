# LLM Memory System

## Overview

This AI chatbot now includes a **long-term memory system** that allows the LLM to remember important information about users across conversations. The memory system automatically extracts and stores key facts, preferences, and context from conversations.

## Features

### ✨ Core Capabilities

1. **Automatic Memory Extraction** - Learns from conversations
2. **Categorized Storage** - Organizes memories by type
3. **Importance Scoring** - Prioritizes relevant information
4. **Cross-Chat Memory** - Remembers across all conversations
5. **Context Injection** - Automatically includes relevant memories in prompts

### 📊 Memory Categories

| Category       | Description                     | Example                            |
| -------------- | ------------------------------- | ---------------------------------- |
| **preference** | User preferences and likes      | "I prefer Python over JavaScript"  |
| **personal**   | Personal information            | "My name is John, I live in Tokyo" |
| **context**    | Background and situational info | "Working on a Next.js project"     |
| **fact**       | Known facts and knowledge       | "Uses VS Code as main editor"      |

## Database Schema

```sql
CREATE TABLE "Memory" (
  "id" UUID PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "chatId" UUID REFERENCES "Chat"("id"),
  "category" VARCHAR(50) NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "importance" TEXT NOT NULL DEFAULT '5', -- 1-10
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  "lastAccessedAt" TIMESTAMP NOT NULL,
  "accessCount" TEXT NOT NULL DEFAULT '1',
  "metadata" JSONB
);

-- Unique constraint: one memory key per user
CREATE UNIQUE INDEX "idx_memory_user_key" ON "Memory"("userId", "key");
```

## API Endpoints

### GET /api/memory

Get all memories for the current user.

**Query Parameters:**

- `category` (optional): Filter by category (`preference`, `personal`, `context`, `fact`)
- `key` (optional): Get specific memory by key
- `minImportance` (optional): Filter by minimum importance (1-10)

**Example:**

```bash
# Get all memories
curl http://localhost:3000/api/memory

# Get personal memories only
curl http://localhost:3000/api/memory?category=personal

# Get specific memory
curl http://localhost:3000/api/memory?key=name

# Get high importance memories
curl http://localhost:3000/api/memory?minImportance=7
```

**Response:**

```json
{
  "memories": [
    {
      "id": "uuid",
      "userId": "uuid",
      "chatId": "uuid",
      "category": "personal",
      "key": "name",
      "value": "John",
      "importance": "8",
      "createdAt": "2025-01-08T...",
      "updatedAt": "2025-01-08T...",
      "lastAccessedAt": "2025-01-08T...",
      "accessCount": "5",
      "metadata": {}
    }
  ],
  "count": 1
}
```

### POST /api/memory

Create or update a memory.

**Request Body:**

```json
{
  "category": "preference",
  "key": "favorite_color",
  "value": "blue",
  "importance": 7,
  "metadata": {
    "source": "manual",
    "note": "User explicitly stated"
  }
}
```

**Response:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "category": "preference",
  "key": "favorite_color",
  "value": "blue",
  "importance": "7",
  ...
}
```

### DELETE /api/memory

Delete a memory or all memories.

**Query Parameters:**

- `id`: Memory ID to delete
- `all=true`: Delete all memories for the user

**Examples:**

```bash
# Delete specific memory
curl -X DELETE http://localhost:3000/api/memory?id=<memory-id>

# Delete all memories
curl -X DELETE http://localhost:3000/api/memory?all=true
```

## How It Works

### 1. Memory Loading (Before Chat)

```typescript
// In app/(chat)/api/chat/route.ts
const memories = await getMemoriesByUserId(userId, {
  minImportance: 5, // Only important memories
  limit: 20, // Prevent token overflow
});

const userMemoriesContext = formatMemoriesForContext(memories);
```

### 2. Context Injection (System Prompt)

```typescript
// In lib/ai/prompts.ts
export const systemPrompt = ({
  selectedChatModel,
  requestHints,
  userMemories, // ← New parameter
}) => {
  let basePrompt = `${regularPrompt}\n\n${requestPrompt}`;

  if (userMemories) {
    basePrompt += `\n\n${userMemories}`;
  }

  return basePrompt;
};
```

### 3. Formatted Memory Context

```markdown
## User Memory

### Personal Information

- name: John
- location: Tokyo
- job: Software Engineer

### Preferences

- favorite_color: blue
- preferred_language: Python

### Context & Background

- current_project: Next.js AI Chatbot
- editor: VS Code
```

### 4. Automatic Extraction (After Chat)

```typescript
// In app/(chat)/api/chat/route.ts (onFinish)
await extractMemoriesFromConversation({
  userId,
  chatId,
  userMessage: "My name is John",
  aiResponse: "Nice to meet you, John!",
});
```

**Current Pattern Matching:**

- "my name is X" → saves as `name`
- "I live in X" → saves as `location`
- "I work as X" → saves as `job`
- "I prefer X" → saves as `preference`

## Usage Examples

### Example 1: Manual Memory Management

```typescript
import { saveMemory, getMemoryByKey } from "@/lib/db/memory";

// Save a memory
await saveMemory({
  userId: "user-id",
  category: "preference",
  key: "coding_style",
  value: "functional programming with TypeScript",
  importance: 8,
});

// Get a memory
const memory = await getMemoryByKey("user-id", "coding_style");
console.log(memory.value); // "functional programming with TypeScript"
```

### Example 2: Conversation with Memory

```
User: "My name is Alice and I'm learning Python"

🤖 AI Response: (AI saves: name=Alice, learning=Python)

[Next conversation, hours later...]

User: "Can you help me with some code?"

🤖 AI: "Of course, Alice! Since you're learning Python,
       let me write this in Python for you..."
```

## Configuration

### Importance Scoring

| Score | Priority | Usage                                    |
| ----- | -------- | ---------------------------------------- |
| 1-3   | Low      | Temporary context, rarely used           |
| 4-6   | Medium   | Regular preferences, moderate importance |
| 7-8   | High     | Key personal info, frequently referenced |
| 9-10  | Critical | Essential facts, always included         |

### Memory Limits

```typescript
const memories = await getMemoriesByUserId(userId, {
  minImportance: 5, // Only score ≥ 5
  limit: 20, // Max 20 memories
});
```

**Prevents:**

- Token overflow in system prompt
- Excessive API costs
- Slow response times

## Advanced Features

### Access Tracking

- `lastAccessedAt`: When memory was last used
- `accessCount`: How many times accessed
- Helps identify frequently used memories

### Metadata Storage

```typescript
await saveMemory({
  userId: "user-id",
  category: "fact",
  key: "api_key",
  value: "sk-...",
  importance: 10,
  metadata: {
    service: "OpenAI",
    expiresAt: "2025-12-31",
    createdBy: "admin",
  },
});
```

### Chat-Specific Memories

```typescript
await saveMemory({
  userId: "user-id",
  chatId: "specific-chat-id", // ← Links to specific chat
  category: "context",
  key: "current_bug",
  value: "IndexError on line 42",
  importance: 6,
});
```

## Migration

Run the migration to create the Memory table:

```bash
# Generate migration
pnpm db:generate

# Run migration
pnpm db:migrate

# Or manually run the SQL
psql $POSTGRES_URL < lib/db/migrations/add_memory_table.sql
```

## Future Enhancements

### Planned Features:

1. **AI-Powered Extraction** 🤖

   - Use LLM to intelligently extract memories
   - Better than simple pattern matching

2. **Semantic Search** 🔍

   - Find memories by meaning, not just keywords
   - Vector embeddings for similarity search

3. **Memory Decay** ⏰

   - Auto-decrease importance over time
   - Archive old, unused memories

4. **Memory Conflicts** ⚠️

   - Detect contradictory information
   - Ask user to resolve conflicts

5. **Export/Import** 💾

   - Export memories as JSON
   - Import from other sources

6. **Privacy Controls** 🔒
   - User can view all memories
   - Delete specific or all memories
   - Mark memories as sensitive

## Files Added/Modified

### New Files:

- `lib/db/memory.ts` - Memory management functions
- `lib/db/migrations/add_memory_table.sql` - Database migration
- `app/(chat)/api/memory/route.ts` - Memory API endpoints
- `LLM_MEMORY_SYSTEM.md` - This documentation

### Modified Files:

- `lib/db/schema.ts` - Added Memory table schema
- `lib/ai/prompts.ts` - Added userMemories parameter
- `app/(chat)/api/chat/route.ts` - Integrated memory loading and extraction

## Testing

### Test Memory Creation:

```bash
curl -X POST http://localhost:3000/api/memory \
  -H "Content-Type: application/json" \
  -d '{
    "category": "personal",
    "key": "name",
    "value": "Alice",
    "importance": 9
  }'
```

### Test Memory Retrieval:

```bash
curl http://localhost:3000/api/memory
```

### Test in Chat:

1. Start a conversation: "My name is Bob"
2. Start a new chat: "What's my name?"
3. AI should respond: "Your name is Bob" (using memory)

## Troubleshooting

### Memory not loading?

Check console logs:

```
💭 Loaded 5 memories for user context
```

### Memory not extracting?

Current implementation uses simple pattern matching.
Check `lib/db/memory.ts` → `extractMemoriesFromConversation()`

### Database errors?

Ensure migration is run:

```bash
pnpm db:migrate
```

## Summary

✅ **Automatic** - Learns from conversations
✅ **Persistent** - Remembers across chats
✅ **Intelligent** - Prioritizes by importance
✅ **Flexible** - Manual or automatic management
✅ **Scalable** - Handles thousands of memories
✅ **Privacy-Focused** - User controls their data

The LLM now has **long-term memory**! 🧠✨
