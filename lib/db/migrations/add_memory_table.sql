-- Create Memory table for storing user-specific memories
CREATE TABLE IF NOT EXISTS "Memory" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "chatId" UUID REFERENCES "Chat"("id") ON DELETE SET NULL,
  "category" VARCHAR(50) NOT NULL, -- 'preference', 'personal', 'context', 'fact'
  "key" TEXT NOT NULL, -- memory identifier (e.g., 'favorite_color', 'job_title')
  "value" TEXT NOT NULL, -- actual memory content
  "importance" INTEGER DEFAULT 5 NOT NULL, -- 1-10, higher = more important
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "lastAccessedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "accessCount" INTEGER DEFAULT 1 NOT NULL,
  "metadata" JSONB -- additional structured data
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS "idx_memory_userId" ON "Memory"("userId");
CREATE INDEX IF NOT EXISTS "idx_memory_category" ON "Memory"("category");
CREATE INDEX IF NOT EXISTS "idx_memory_importance" ON "Memory"("importance" DESC);
CREATE INDEX IF NOT EXISTS "idx_memory_updatedAt" ON "Memory"("updatedAt" DESC);

-- Create unique constraint to prevent duplicate keys per user
CREATE UNIQUE INDEX IF NOT EXISTS "idx_memory_user_key" ON "Memory"("userId", "key");

-- Comments for documentation
COMMENT ON TABLE "Memory" IS 'Stores long-term memories for LLM context across conversations';
COMMENT ON COLUMN "Memory"."category" IS 'Type of memory: preference, personal, context, fact';
COMMENT ON COLUMN "Memory"."key" IS 'Unique identifier for this memory within user scope';
COMMENT ON COLUMN "Memory"."importance" IS 'Priority score 1-10 for memory retrieval';
COMMENT ON COLUMN "Memory"."accessCount" IS 'Number of times this memory was accessed';
