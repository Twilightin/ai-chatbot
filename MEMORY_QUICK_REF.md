# LLM Memory System - Quick Reference

## 🚀 Quick Start

### Check if Memory is Working

1. **Start a conversation:**

   ```
   User: "My name is Alice and I live in Tokyo"
   ```

2. **Start a NEW conversation:**

   ```
   User: "What's my name?"
   AI: "Your name is Alice" ✅
   ```

3. **Check console logs:**
   ```
   💭 Loaded 2 memories for user context
   ```

## 📝 Manual Memory Management

### Create a Memory (via API)

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

### Get All Memories

```bash
curl http://localhost:3000/api/memory
```

### Get Specific Memory

```bash
curl "http://localhost:3000/api/memory?key=name"
```

### Delete a Memory

```bash
curl -X DELETE "http://localhost:3000/api/memory?id=<memory-id>"
```

### Delete All Memories

```bash
curl -X DELETE "http://localhost:3000/api/memory?all=true"
```

## 🔧 Memory Categories

| Category     | Use Case            | Example                             |
| ------------ | ------------------- | ----------------------------------- |
| `preference` | User likes/dislikes | "prefers Python", "likes dark mode" |
| `personal`   | Personal info       | "name: Alice", "location: Tokyo"    |
| `context`    | Background info     | "working on Next.js project"        |
| `fact`       | Known facts         | "uses VS Code", "timezone: JST"     |

## ⚙️ Importance Levels

| Score | When to Use               |
| ----- | ------------------------- |
| 1-3   | Temporary, low priority   |
| 4-6   | Normal preferences        |
| 7-8   | Important personal info   |
| 9-10  | Critical, always remember |

## 💻 Programmatic Usage

```typescript
import { saveMemory, getMemoryByKey } from "@/lib/db/memory";

// Save a memory
await saveMemory({
  userId: "user-id",
  category: "preference",
  key: "coding_style",
  value: "TypeScript with functional programming",
  importance: 8,
});

// Get a memory
const memory = await getMemoryByKey("user-id", "coding_style");
```

## 🔍 Current Auto-Extraction Patterns

The system automatically extracts these patterns:

| Pattern        | Saves As                  |
| -------------- | ------------------------- |
| "my name is X" | `name` (personal)         |
| "I live in X"  | `location` (personal)     |
| "I work as X"  | `job` (personal)          |
| "I prefer X"   | `preference` (preference) |

## 📊 How Memory Works

```
┌─────────────────┐
│ User Message    │ "My name is Alice"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auto Extract    │ pattern: "my name is (\w+)"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save Memory     │ key: "name", value: "Alice"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load on Next    │ Include in system prompt
│ Conversation    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ AI Knows Name   │ "Hi Alice! How can I help?"
└─────────────────┘
```

## 🗄️ Database Query

```sql
-- View all memories
SELECT * FROM "Memory"
ORDER BY importance DESC, "updatedAt" DESC;

-- View high-priority memories
SELECT key, value, importance
FROM "Memory"
WHERE CAST(importance AS INTEGER) >= 7;

-- View most accessed memories
SELECT key, value, "accessCount"
FROM "Memory"
ORDER BY CAST("accessCount" AS INTEGER) DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### Memory not loading?

1. Check console for:

   ```
   💭 Loaded X memories for user context
   ```

2. Query database:

   ```sql
   SELECT COUNT(*) FROM "Memory";
   ```

3. Check API:
   ```bash
   curl http://localhost:3000/api/memory
   ```

### Memory not saving?

1. Check auto-extraction patterns in `lib/db/memory.ts`
2. Try manual save via API
3. Check database errors in console

### Out of tokens?

Reduce memory limit in `app/(chat)/api/chat/route.ts`:

```typescript
const memories = await getMemoriesByUserId(userId, {
  minImportance: 7, // Increase (only very important)
  limit: 10, // Decrease (fewer memories)
});
```

## 📚 Full Documentation

See `LLM_MEMORY_SYSTEM.md` for complete documentation.

## 🎯 Key Files

- `lib/db/memory.ts` - Memory management functions
- `lib/db/schema.ts` - Memory table schema
- `app/(chat)/api/memory/route.ts` - Memory API
- `app/(chat)/api/chat/route.ts` - Memory integration
- `lib/ai/prompts.ts` - Memory in system prompt

## ✅ Features

- ✅ Automatic extraction from conversations
- ✅ Manual creation via API
- ✅ Cross-chat persistence
- ✅ Importance-based prioritization
- ✅ Access tracking
- ✅ Category organization
- ✅ Metadata support

---

**Status:** ✅ Active  
**Version:** 1.0  
**Last Updated:** November 8, 2025
