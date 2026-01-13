# PostgreSQL Admin SQL Samples for AI Chatbot

## 📊 Database Overview Queries

### 1. View All Tables

```sql
-- List all tables in the database
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 2. View Table Sizes

```sql
-- Check size of each table
SELECT
    tablename AS table,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Count Records in All Tables

```sql
-- Count rows in each table
SELECT
    'Chat' AS table_name, COUNT(*) AS row_count FROM "Chat"
UNION ALL
SELECT 'Message_v2', COUNT(*) FROM "Message_v2"
UNION ALL
SELECT 'Memory', COUNT(*) FROM "Memory"
UNION ALL
SELECT 'Document', COUNT(*) FROM "Document"
UNION ALL
SELECT 'User', COUNT(*) FROM "User"
ORDER BY row_count DESC;
```

---

## 💬 Chat Queries

### 4. View Recent Chats

```sql
-- Get 10 most recent chats
SELECT
    id,
    title,
    "createdAt",
    visibility,
    "userId"
FROM "Chat"
ORDER BY "createdAt" DESC
LIMIT 10;
```

### 5. View Chats with Message Count

```sql
-- Chats with number of messages
SELECT
    c.id,
    c.title,
    c."createdAt",
    COUNT(m.id) AS message_count
FROM "Chat" c
LEFT JOIN "Message_v2" m ON c.id = m."chatId"
GROUP BY c.id, c.title, c."createdAt"
ORDER BY c."createdAt" DESC
LIMIT 20;
```

### 6. Find Chats by Title

```sql
-- Search chats by title
SELECT
    id,
    title,
    "createdAt",
    visibility
FROM "Chat"
WHERE title ILIKE '%your search term%'
ORDER BY "createdAt" DESC;
```

---

## 📝 Message Queries

### 7. View Messages in a Specific Chat

```sql
-- Replace 'YOUR_CHAT_ID' with actual chat ID
SELECT
    id,
    role,
    parts,
    "createdAt"
FROM "Message_v2"
WHERE "chatId" = 'YOUR_CHAT_ID'
ORDER BY "createdAt" ASC;
```

### 8. Count Messages by Role

```sql
-- Count user vs assistant messages
SELECT
    role,
    COUNT(*) AS count
FROM "Message_v2"
GROUP BY role;
```

### 9. Recent Messages Across All Chats

```sql
-- Last 20 messages from all chats
SELECT
    m.id,
    m.role,
    m."createdAt",
    c.title AS chat_title,
    LEFT(m.parts::text, 100) AS preview
FROM "Message_v2" m
JOIN "Chat" c ON m."chatId" = c.id
ORDER BY m."createdAt" DESC
LIMIT 20;
```

---

## 🧠 Memory Queries

### 10. View All Memories

```sql
-- Get all user memories
SELECT
    id,
    category,
    key,
    value,
    importance,
    "createdAt",
    "accessCount"
FROM "Memory"
ORDER BY CAST(importance AS INTEGER) DESC, "updatedAt" DESC;
```

### 11. Memories by Category

```sql
-- Group memories by category
SELECT
    category,
    COUNT(*) AS count,
    AVG(CAST(importance AS INTEGER)) AS avg_importance
FROM "Memory"
GROUP BY category
ORDER BY count DESC;
```

### 12. High-Priority Memories

```sql
-- Get memories with importance >= 7
SELECT
    key,
    value,
    category,
    importance,
    "accessCount",
    "lastAccessedAt"
FROM "Memory"
WHERE CAST(importance AS INTEGER) >= 7
ORDER BY CAST(importance AS INTEGER) DESC;
```

### 13. Most Accessed Memories

```sql
-- Top 10 most accessed memories
SELECT
    key,
    value,
    category,
    CAST("accessCount" AS INTEGER) AS access_count,
    "lastAccessedAt"
FROM "Memory"
ORDER BY CAST("accessCount" AS INTEGER) DESC
LIMIT 10;
```

### 14. Recently Updated Memories

```sql
-- Memories updated in last 7 days
SELECT
    key,
    value,
    category,
    "updatedAt",
    "createdAt"
FROM "Memory"
WHERE "updatedAt" >= NOW() - INTERVAL '7 days'
ORDER BY "updatedAt" DESC;
```

---

## 📄 Document Queries

### 15. View All Documents

```sql
-- Get all documents
SELECT
    id,
    title,
    kind,
    "createdAt",
    LEFT(content, 100) AS content_preview
FROM "Document"
ORDER BY "createdAt" DESC
LIMIT 20;
```

### 16. Documents by Type

```sql
-- Count documents by kind (text, code, sheet, image)
SELECT
    kind,
    COUNT(*) AS count
FROM "Document"
GROUP BY kind;
```

---

## 👤 User Queries

### 17. View All Users

```sql
-- Get all users
SELECT
    id,
    email,
    password IS NOT NULL AS has_password
FROM "User"
ORDER BY email;
```

### 18. User Activity Summary

```sql
-- User with chat and message counts
SELECT
    u.email,
    COUNT(DISTINCT c.id) AS chat_count,
    COUNT(m.id) AS message_count
FROM "User" u
LEFT JOIN "Chat" c ON u.id = c."userId"
LEFT JOIN "Message_v2" m ON c.id = m."chatId"
GROUP BY u.id, u.email;
```

---

## 🧹 Cleanup Queries

### 19. Delete Old Chats (CAUTION!)

```sql
-- Delete chats older than 30 days (THIS WILL DELETE DATA!)
-- Uncomment to execute:
/*
DELETE FROM "Chat"
WHERE "createdAt" < NOW() - INTERVAL '30 days';
*/

-- Preview what would be deleted:
SELECT
    id,
    title,
    "createdAt"
FROM "Chat"
WHERE "createdAt" < NOW() - INTERVAL '30 days';
```

### 20. Delete Empty Chats (CAUTION!)

```sql
-- Delete chats with no messages (THIS WILL DELETE DATA!)
-- Uncomment to execute:
/*
DELETE FROM "Chat" c
WHERE NOT EXISTS (
    SELECT 1 FROM "Message_v2" m WHERE m."chatId" = c.id
);
*/

-- Preview what would be deleted:
SELECT
    c.id,
    c.title,
    c."createdAt"
FROM "Chat" c
WHERE NOT EXISTS (
    SELECT 1 FROM "Message_v2" m WHERE m."chatId" = c.id
);
```

### 21. Clear All Memories (CAUTION!)

```sql
-- Delete all memories (THIS WILL DELETE DATA!)
-- Uncomment to execute:
/*
DELETE FROM "Memory";
*/

-- Preview count:
SELECT COUNT(*) AS total_memories FROM "Memory";
```

---

## 📊 Analytics Queries

### 22. Daily Message Count (Last 7 Days)

```sql
-- Messages per day for last week
SELECT
    DATE("createdAt") AS date,
    COUNT(*) AS message_count
FROM "Message_v2"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;
```

### 23. Average Messages per Chat

```sql
-- Average number of messages per chat
SELECT
    AVG(message_count) AS avg_messages_per_chat
FROM (
    SELECT
        "chatId",
        COUNT(*) AS message_count
    FROM "Message_v2"
    GROUP BY "chatId"
) AS chat_messages;
```

### 24. Memory Usage by Category

```sql
-- Memory distribution by category
SELECT
    category,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
FROM "Memory"
GROUP BY category
ORDER BY count DESC;
```

---

## 🔍 Advanced Queries

### 25. Search in Message Content

```sql
-- Search for text in message parts (JSON field)
SELECT
    m.id,
    m.role,
    m."createdAt",
    c.title AS chat_title,
    m.parts
FROM "Message_v2" m
JOIN "Chat" c ON m."chatId" = c.id
WHERE m.parts::text ILIKE '%search term%'
ORDER BY m."createdAt" DESC
LIMIT 20;
```

### 26. Find Messages with File Attachments

```sql
-- Messages that have file attachments
SELECT
    m.id,
    m.role,
    m."createdAt",
    c.title AS chat_title,
    m.parts
FROM "Message_v2" m
JOIN "Chat" c ON m."chatId" = c.id
WHERE m.parts::text LIKE '%"type":"file"%'
ORDER BY m."createdAt" DESC;
```

### 27. Chat Duration Analysis

```sql
-- Calculate chat duration (first to last message)
SELECT
    c.id,
    c.title,
    MIN(m."createdAt") AS first_message,
    MAX(m."createdAt") AS last_message,
    MAX(m."createdAt") - MIN(m."createdAt") AS duration
FROM "Chat" c
JOIN "Message_v2" m ON c.id = m."chatId"
GROUP BY c.id, c.title
HAVING COUNT(m.id) > 1
ORDER BY duration DESC
LIMIT 10;
```

### 28. Memory Statistics

```sql
-- Comprehensive memory statistics
SELECT
    COUNT(*) AS total_memories,
    COUNT(DISTINCT category) AS unique_categories,
    AVG(CAST(importance AS INTEGER)) AS avg_importance,
    AVG(CAST("accessCount" AS INTEGER)) AS avg_access_count,
    MAX(CAST("accessCount" AS INTEGER)) AS max_access_count
FROM "Memory";
```

---

## 🛠️ Maintenance Queries

### 29. Check Database Indexes

```sql
-- View all indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 30. Vacuum and Analyze (Optimize)

```sql
-- Optimize database performance
VACUUM ANALYZE;

-- Or for specific tables:
VACUUM ANALYZE "Chat";
VACUUM ANALYZE "Message_v2";
VACUUM ANALYZE "Memory";
```

---

## 💡 Quick Tips

### Execute Multiple Queries

You can select and run individual queries or multiple at once.

### Export Results

Most PostgreSQL clients allow you to export query results to CSV, JSON, or Excel.

### Use Transactions for Safety

```sql
-- Start transaction
BEGIN;

-- Your DELETE/UPDATE queries here
DELETE FROM "Memory" WHERE key = 'test';

-- If everything looks good:
COMMIT;

-- If you made a mistake:
-- ROLLBACK;
```

### Backup Before Major Operations

```bash
# Command line backup
pg_dump -U your_user ai_chatbot > backup_$(date +%Y%m%d).sql
```

---

## 🎯 Common Use Cases

### Find a Specific Chat

```sql
SELECT * FROM "Chat" WHERE title = 'Your Chat Title';
```

### Get Chat with All Messages

```sql
SELECT
    c.title,
    m.role,
    m.parts,
    m."createdAt"
FROM "Chat" c
JOIN "Message_v2" m ON c.id = m."chatId"
WHERE c.id = 'YOUR_CHAT_ID'
ORDER BY m."createdAt" ASC;
```

### Update Memory Importance

```sql
UPDATE "Memory"
SET importance = '9'
WHERE key = 'important_fact';
```

### Add Manual Memory

```sql
INSERT INTO "Memory" (
    "userId",
    category,
    key,
    value,
    importance,
    "createdAt",
    "updatedAt",
    "lastAccessedAt",
    "accessCount"
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'personal',
    'favorite_color',
    'blue',
    '8',
    NOW(),
    NOW(),
    NOW(),
    '1'
);
```

---

**Created:** November 8, 2025  
**Database:** PostgreSQL (ai_chatbot)  
**Tables:** Chat, Message_v2, Memory, Document, User, Stream, Suggestion, Vote_v2
