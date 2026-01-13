# Artifact Re-Opening Content Fix

## Critical Issue Discovered

When re-opening artifacts, the wrong content was displayed: **"A document was created and is now visible to the user."** instead of the actual haiku content.

## Root Cause

The `result.content` field from the tool output contains a **status message**, NOT the actual document content!

### Understanding the Document Creation Flow

1. **Tool Execution** (`/lib/ai/tools/create-document.ts`):

   ```typescript
   return {
     id,
     title,
     kind,
     content: "A document was created and is now visible to the user.", // ❌ Status message!
   };
   ```

2. **Actual Content Storage**:

   - The real content (haiku) is streamed via `dataStream`
   - Saved to the database during streaming
   - Retrieved via `/api/document?id=${documentId}`

3. **The Problem**:
   - `result.content` = Tool status message
   - Actual haiku content = In database, needs to be fetched

### What We Were Doing Wrong

**BEFORE (Broken):**

```tsx
setArtifact({
  ...artifact,
  title: result.title,
  documentId: result.id,
  kind: result.kind,
  content: result.content ?? "", // ❌ Sets "A document was created..."
  status: "idle",
  isVisible: true,
});
```

Result: Artifact showed **"A document was created and is now visible to the user."**

## The Fix

**AFTER (Fixed):**

```tsx
setArtifact({
  ...artifact,
  title: result.title,
  documentId: result.id,
  kind: result.kind,
  // ✅ REMOVED: content: result.content
  // Let SWR fetch the real content from the database
  status: "idle", // ✅ Allows SWR to fetch
  isVisible: true,
});
```

### Why This Works

1. **Set `status: "idle"`**: Unblocks the SWR hook in `artifact.tsx`
2. **Set `documentId`**: Tells SWR which document to fetch
3. **Don't set `content`**: Let SWR fetch the real content from `/api/document`

### The SWR Fetch Logic

In `/components/artifact.tsx` (line 94-99):

```tsx
useSWR<Document[]>(
  artifact.documentId !== "init" && artifact.status !== "streaming"
    ? `/api/document?id=${artifact.documentId}` // ✅ Fetches real content
    : null,
  fetcher
);
```

When `status === "idle"` and `documentId` is set, SWR fetches the document and gets the real haiku!

## Changes Made

### File: `/components/document-preview.tsx`

**Before:**

```tsx
setArtifact((artifact) =>
  artifact.status === "streaming"
    ? { ...artifact, isVisible: true }
    : {
        ...artifact,
        title: result.title,
        documentId: result.id,
        kind: result.kind,
        content: result.content ?? "",  // ❌ WRONG!
        status: "idle",
        isVisible: true,
        boundingBox: {...},
      }
);
```

**After:**

```tsx
setArtifact((artifact) =>
  artifact.status === "streaming"
    ? { ...artifact, isVisible: true }
    : {
        ...artifact,
        title: result.title,
        documentId: result.id,
        kind: result.kind,
        // ✅ Removed content assignment
        // Let artifact.tsx fetch real content via SWR
        status: "idle",
        isVisible: true,
        boundingBox: {...},
      }
);
```

## Testing

### Test Sequence

1. **Create artifact**: "write a haiku in the artifacts"

   - ✅ Haiku displays correctly when created

2. **Minimize artifact**: Click X or minimize button

   - ✅ Preview shows haiku content (not tool message)

3. **Re-open artifact**: Click on the minimized preview
   - ✅ Should show actual haiku
   - ❌ **BEFORE**: Showed "A document was created and is now visible to the user."
   - ✅ **AFTER**: Shows actual haiku content

## Important Notes

### Why result.content Exists

The `result.content` field serves a specific purpose:

- It's the tool's output message for the LLM
- Confirms the action was successful
- NOT meant to be the actual document content

### Content Source Hierarchy

1. **During Streaming**: Use `artifact.content` (live updates)
2. **After Streaming**: Fetch from `/api/document` (database)
3. **Never**: Use `result.content` (tool message)

### Minimized vs Expanded View

**Minimized View:**

- Can use `result.content` because it's just a preview
- Shows tool message is acceptable for preview

**Expanded View:**

- MUST fetch real content from database
- Shows full, editable document
- Needs accurate content

## Related Code

### Tool Output Structure

```typescript
// /lib/ai/tools/create-document.ts
{
  id: string; // ✅ Document ID - use for fetching
  title: string; // ✅ Document title
  kind: ArtifactKind; // ✅ Artifact type
  content: string; // ❌ Tool message - DON'T use as document content
}
```

### Document Structure (from database)

```typescript
// /lib/db/schema.ts
{
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string; // ✅ Actual haiku/document content
  createdAt: Date;
  userId: string;
}
```

## Status

✅ **Fixed** - Re-opening artifacts now shows correct content

## Date

2025-11-08

## Lesson Learned

**Never assume tool output `content` is the actual document content!**

Tool outputs often contain status/confirmation messages, while actual content is stored separately in the database and must be fetched.

## The Complete Fix (Final Version)

After discovering the wrong content issue, the final solution properly handles content:

```tsx
setArtifact((artifact) => {
  if (artifact.status === "streaming") {
    return { ...artifact, isVisible: true };
  }

  // Check if this is the same document we already have
  const isSameDocument = artifact.documentId === result.id;

  return {
    ...artifact,
    title: result.title,
    documentId: result.id,
    kind: result.kind,
    // ✅ Preserve existing content if same document and has content
    // ✅ Otherwise set empty and let SWR fetch from database
    content: isSameDocument && artifact.content ? artifact.content : "",
    status: "idle",
    isVisible: true,
    boundingBox: {...},
  };
});
```

### Why This Works

1. **Same Document with Content**:

   - When you minimize and re-open the same artifact
   - The artifact context **still has the content** from when it was created/streamed
   - We preserve it: `artifact.content` ✅

2. **Different Document or No Content**:

   - Set `content: ""` (empty)
   - Set `status: "idle"`
   - SWR in `artifact.tsx` fetches from `/api/document?id=${documentId}`
   - `useEffect` populates `artifact.content` when fetch completes

3. **Never Use result.content**:
   - ❌ `result.content` = "A document was created and is now visible to the user."
   - ✅ `artifact.content` = Actual haiku from streaming or database

## Evolution of the Fix

### Attempt 1: Set result.content ❌

```tsx
content: result.content ?? ""; // Shows tool message!
```

**Problem**: Showed "A document was created and is now visible to the user."

### Attempt 2: Don't set content ❌

```tsx
// (no content field)
```

**Problem**: Content was empty, needed to wait for SWR fetch

### Attempt 3: Preserve existing content ✅

```tsx
content: isSameDocument && artifact.content ? artifact.content : "";
```

**Solution**: Uses existing content if available, otherwise fetches from DB
