import { desc, eq, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { memory, type Memory } from "./schema";

const connectionString = process.env.POSTGRES_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

export type MemoryCategory = "preference" | "personal" | "context" | "fact";

export type CreateMemoryParams = {
  userId: string;
  chatId?: string;
  category: MemoryCategory;
  key: string;
  value: string;
  importance?: number;
  metadata?: Record<string, any>;
};

export type UpdateMemoryParams = {
  id: string;
  userId: string;
  value?: string;
  importance?: number;
  metadata?: Record<string, any>;
};

/**
 * Save or update a memory for a user
 * If a memory with the same key exists, it will be updated
 */
export async function saveMemory(params: CreateMemoryParams): Promise<Memory> {
  const {
    userId,
    chatId,
    category,
    key,
    value,
    importance = 5,
    metadata,
  } = params;

  const now = new Date();

  // Check if memory exists
  const existing = await db
    .select()
    .from(memory)
    .where(and(eq(memory.userId, userId), eq(memory.key, key)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing memory
    const updated = await db
      .update(memory)
      .set({
        value,
        importance: importance.toString(),
        updatedAt: now,
        lastAccessedAt: now,
        accessCount: sql`CAST(${memory.accessCount} AS INTEGER) + 1`,
        metadata,
        ...(chatId && { chatId }),
      })
      .where(eq(memory.id, existing[0].id))
      .returning();

    return updated[0];
  }

  // Create new memory
  const created = await db
    .insert(memory)
    .values({
      userId,
      chatId: chatId || null,
      category,
      key,
      value,
      importance: importance.toString(),
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      accessCount: "1",
      metadata: metadata || null,
    })
    .returning();

  return created[0];
}

/**
 * Get all memories for a user, sorted by importance and recency
 */
export async function getMemoriesByUserId(
  userId: string,
  options?: {
    category?: MemoryCategory;
    limit?: number;
    minImportance?: number;
  }
): Promise<Memory[]> {
  const conditions = [eq(memory.userId, userId)];

  if (options?.category) {
    conditions.push(eq(memory.category, options.category));
  }

  if (options?.minImportance) {
    conditions.push(
      sql`CAST(${memory.importance} AS INTEGER) >= ${options.minImportance}`
    );
  }

  const results = await db
    .select()
    .from(memory)
    .where(and(...conditions))
    .orderBy(desc(memory.importance), desc(memory.updatedAt))
    .limit(options?.limit || 50);

  // Update last accessed time for retrieved memories
  if (results.length > 0) {
    const ids = results.map((m: Memory) => m.id);
    await db
      .update(memory)
      .set({
        lastAccessedAt: new Date(),
        accessCount: sql`CAST(${memory.accessCount} AS INTEGER) + 1`,
      })
      .where(sql`${memory.id} = ANY(${ids})`);
  }

  return results;
}

/**
 * Get a specific memory by key
 */
export async function getMemoryByKey(
  userId: string,
  key: string
): Promise<Memory | null> {
  const results = await db
    .select()
    .from(memory)
    .where(and(eq(memory.userId, userId), eq(memory.key, key)))
    .limit(1);

  if (results.length === 0) return null;

  // Update last accessed time
  await db
    .update(memory)
    .set({
      lastAccessedAt: new Date(),
      accessCount: sql`CAST(${memory.accessCount} AS INTEGER) + 1`,
    })
    .where(eq(memory.id, results[0].id));

  return results[0];
}

/**
 * Delete a memory
 */
export async function deleteMemory(id: string, userId: string): Promise<void> {
  await db
    .delete(memory)
    .where(and(eq(memory.id, id), eq(memory.userId, userId)));
}

/**
 * Delete all memories for a user
 */
export async function deleteAllMemories(userId: string): Promise<void> {
  await db.delete(memory).where(eq(memory.userId, userId));
}

/**
 * Format memories for LLM context
 */
export function formatMemoriesForContext(memories: Memory[]): string {
  if (memories.length === 0) return "";

  const grouped = memories.reduce(
    (acc, mem) => {
      const cat = mem.category || "context";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(mem);
      return acc;
    },
    {} as Record<string, Memory[]>
  );

  let formatted = "## User Memory\n\n";

  const categoryTitles: Record<string, string> = {
    preference: "Preferences",
    personal: "Personal Information",
    context: "Context & Background",
    fact: "Known Facts",
  };

  for (const [category, items] of Object.entries(grouped)) {
    formatted += `### ${categoryTitles[category] || category}\n`;
    for (const item of items) {
      formatted += `- ${item.key}: ${item.value}\n`;
    }
    formatted += "\n";
  }

  return formatted.trim();
}

/**
 * Extract and save memories from conversation
 * This is a helper function that can be called after AI responses
 * to automatically extract and store important information
 */
export async function extractMemoriesFromConversation(params: {
  userId: string;
  chatId: string;
  userMessage: string;
  aiResponse: string;
}): Promise<Memory[]> {
  const { userId, chatId } = params;
  const savedMemories: Memory[] = [];

  // TODO: Implement AI-based memory extraction
  // This would use the LLM to analyze the conversation and extract important facts
  // For now, this is a placeholder for future implementation

  // Example pattern matching (very basic)
  const patterns = [
    { regex: /my name is (\w+)/i, key: "name", category: "personal" as const },
    { regex: /I live in (\w+)/i, key: "location", category: "personal" as const },
    { regex: /I work as (?:a |an )?(.+)/i, key: "job", category: "personal" as const },
    { regex: /I prefer (\w+)/i, key: "preference", category: "preference" as const },
  ];

  for (const pattern of patterns) {
    const match = params.userMessage.match(pattern.regex);
    if (match && match[1]) {
      try {
        const mem = await saveMemory({
          userId,
          chatId,
          category: pattern.category,
          key: pattern.key,
          value: match[1],
          importance: 7,
          metadata: {
            extractedFrom: "conversation",
            timestamp: new Date().toISOString(),
          },
        });
        savedMemories.push(mem);
      } catch (error) {
        console.error("Failed to save memory:", error);
      }
    }
  }

  return savedMemories;
}
