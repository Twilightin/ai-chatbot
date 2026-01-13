# Artifact Re-Opening Troubleshooting Guide

## Issue

Artifacts show no text when re-opened after being minimized.

## Troubleshooting Steps

### Step 1: Check Browser Console

Open your browser's Developer Tools (F12 or Cmd+Option+I) and look at the Console tab.

### Step 2: Test Scenario

1. **Create an artifact**: Type "write a haiku in the artifacts"
2. **Wait for it to complete**: The haiku should appear
3. **Minimize the artifact**: Click the X button
4. **Check console logs**: Look for logs starting with `🔍 [TROUBLESHOOTING]`
5. **Re-open the artifact**: Click on the minimized preview
6. **Check console logs again**: Look for new troubleshooting logs

### Step 3: Analyze the Logs

Look for these specific log entries:

#### When Re-Opening (document-preview.tsx)

```
🔍 [TROUBLESHOOTING] Re-opening artifact - Current State:
```

**Check these values:**

- `currentDocumentId`: Should match the artifact you're opening
- `currentContent`: Should contain the haiku text
- `currentContentLength`: Should be > 0
- `currentStatus`: Should be "idle" or "streaming"
- `resultId`: The ID being opened
- `resultContent`: The tool message (ignore this)

**Then check:**

```
🔍 [TROUBLESHOOTING] Setting artifact state:
```

- `isSameDocument`: Should be `true` if re-opening same artifact
- `willPreserveContent`: Should be `true` if content exists
- `contentToUseLength`: Should be > 0
- `contentPreview`: Should show first 100 chars of haiku

#### After Re-Opening (artifact.tsx)

```
🔍 [TROUBLESHOOTING] Artifact - Documents changed:
```

**Check:**

- `documentsLength`: How many document versions fetched
- `isDocumentsFetching`: Is it currently fetching?
- `artifactDocumentId`: Current artifact ID
- `artifactStatus`: Should be "idle"
- `artifactContentLength`: Should be > 0

**If documents are fetched:**

```
🔍 [TROUBLESHOOTING] Artifact - Setting document from fetch:
```

- `documentContentLength`: Should be > 0
- `documentContentPreview`: Should show the haiku

#### When Rendering (artifact.tsx)

```
🔍 [TROUBLESHOOTING] Artifact - Rendering content:
```

**Check:**

- `contentLength`: Should be > 0
- `contentPreview`: Should show the haiku
- `isLoading`: Should be `false` if content is ready

## Common Problems & Solutions

### Problem 1: `currentContent` is empty when re-opening

**Diagnosis**: The artifact context lost the content  
**Possible Causes**:

- Content was never set during streaming
- Context was reset somewhere

**Solution**: Check if content is being set during document creation

### Problem 2: `isSameDocument` is false

**Diagnosis**: Document IDs don't match  
**Possible Causes**:

- `artifact.documentId` is "init" or different ID
- Creating a new document instead of re-opening

**Solution**: Verify document ID is set correctly during creation

### Problem 3: `willPreserveContent` is false

**Diagnosis**: Not preserving existing content  
**Possible Causes**:

- `artifact.content` is empty
- `isSameDocument` is false

**Solution**: Check why content is empty (see Problem 1)

### Problem 4: Content exists but not rendering

**Diagnosis**: UI rendering issue  
**Possible Causes**:

- `isLoading` is true
- Content component not receiving content
- CSS hiding content

**Solution**: Check the rendering logs and inspect the DOM

### Problem 5: Documents fetch returns empty or wrong data

**Diagnosis**: Database or API issue  
**Possible Causes**:

- Document not saved to database
- Wrong document ID
- API error

**Solution**:

1. Check Network tab for `/api/document?id=...` request
2. Verify response contains document with content
3. Check database directly

## Data Flow Summary

```
1. USER CLICKS PREVIEW
   ↓
2. handleClick in document-preview.tsx
   - Reads current artifact state
   - Checks if same document
   - Preserves content if available
   - Sets status to "idle"
   ↓
3. artifact.tsx receives updated state
   - SWR checks if should fetch (status !== "streaming")
   - Fetches from /api/document if needed
   ↓
4. useEffect updates artifact.content
   - Sets content from fetched document
   ↓
5. Render phase
   - artifactDefinition.content receives content
   - Text editor displays content
```

## Quick Diagnostic Checklist

Run through this checklist based on console logs:

- [ ] **Step 1**: Does `currentContent` have text when re-opening?

  - ✅ Yes → Content preserved in context
  - ❌ No → **DATA PROBLEM**: Content lost from context

- [ ] **Step 2**: Is `isSameDocument` true?

  - ✅ Yes → Correct document identification
  - ❌ No → **DATA PROBLEM**: Document ID mismatch

- [ ] **Step 3**: Is `willPreserveContent` true?

  - ✅ Yes → Content will be preserved
  - ❌ No → Will fetch from database (check next step)

- [ ] **Step 4**: If fetching, does `documentContentLength` > 0?

  - ✅ Yes → Database has content
  - ❌ No → **DATA PROBLEM**: Content not in database

- [ ] **Step 5**: Does rendering receive `contentLength` > 0?

  - ✅ Yes → Content passed to renderer
  - ❌ No → **DATA PROBLEM**: Content lost in rendering phase

- [ ] **Step 6**: Can you see the content in the DOM?
  - ✅ Yes → **UI PROBLEM**: CSS or visibility issue
  - ❌ No → **UI PROBLEM**: Component not rendering

## Next Steps Based on Diagnosis

### If DATA PROBLEM at Step 1 (Content lost from context)

**Issue**: Artifact context is being reset  
**Check**:

1. When was content set during creation?
2. Is the context being cleared when minimizing?
3. Is there another component resetting the context?

### If DATA PROBLEM at Step 4 (Content not in database)

**Issue**: Document wasn't saved or fetched incorrectly  
**Check**:

1. Network tab: `/api/document?id=...` response
2. Database: Query documents table for the ID
3. Document creation: Was it saved during streaming?

### If UI PROBLEM (Content in DOM but not visible)

**Issue**: CSS or rendering problem  
**Check**:

1. Inspect element in DevTools
2. Check if content has `display: none` or `opacity: 0`
3. Check if text color matches background
4. Check if element has zero dimensions

## Expected Console Output (Success Case)

```
🔍 [TROUBLESHOOTING] Re-opening artifact - Current State:
{
  currentDocumentId: "abc-123-def",
  currentContent: "Whispers through the trees...",
  currentContentLength: 85,
  currentStatus: "idle",
  ...
}

🔍 [TROUBLESHOOTING] Setting artifact state:
{
  isSameDocument: true,
  willPreserveContent: true,
  contentToUseLength: 85,
  contentPreview: "Whispers through the trees, Leaves dance in the autumn breeze, Nature's song is peace.",
}

🔍 [TROUBLESHOOTING] Artifact - Rendering content:
{
  isCurrentVersion: true,
  contentLength: 85,
  contentPreview: "Whispers through the trees, Leaves dance in the autumn breeze, Nature's song is peace.",
  artifactStatus: "idle",
  isLoading: false,
}
```

## Removing Logs

Once debugging is complete, remove the console.log statements from:

- `/components/document-preview.tsx` (handleClick function)
- `/components/artifact.tsx` (useEffect and render section)

## Date

2025-11-08
