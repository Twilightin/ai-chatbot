# Image Vision Fix for Azure OpenAI

## Problem Identified

When uploading image files (.jpeg, .png), the system was incorrectly converting them to text before sending to Azure OpenAI, causing two issues:

1. **Content Filter Trigger**: The file path in the converted text (e.g., `/uploads/xxx.jpeg`) triggered Azure OpenAI's content filter
2. **No Vision Response**: Azure OpenAI received text instead of images, so it couldn't use vision capabilities

### Error Log Example

```
🔄 Converting model message file part to text
✅ Model messages after processing: [
  {
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "[File: file]\n\n/uploads/63b4d720-5f1c-4985-aec9-5bb82c8136d7.jpeg"
      }
    ]
  }
]

Error: The response was filtered due to the prompt triggering Azure OpenAI's content management policy
"sexual":{"filtered":true,"severity":"medium"}
```

## Root Cause

In `/app/(chat)/api/chat/route.ts`, there were **two message conversion steps**:

1. **First conversion** (client message → UI message): Correctly handled PDF/TXT with extracted text
2. **Second conversion** (UI message → model message): Incorrectly converted ALL file parts to text, including images

The second conversion was treating image file parts as if they needed text extraction, converting them to text parts instead of image parts.

## Solution

### Changes Made

#### 1. First Conversion (Lines 187-207)

**Before**: Only converted files with `extractedText` to text (PDF/TXT)
**After**: Explicitly converts image files to image parts, not just skipping them

```typescript
// PDF/TXT files with extracted text -> text parts
if (part.extractedText) {
  console.log(`📄 Converting PDF/TXT file to text: ${part.name}`);
  return {
    type: "text" as const,
    text: `[File: ${part.name}]\n\n${part.extractedText}`,
  };
}

// Image files (PNG/JPEG) -> image parts for vision
if (part.mediaType === "image/png" || part.mediaType === "image/jpeg") {
  console.log(`🖼️ Converting image file to image part: ${part.name}`);
  return {
    type: "image" as const,
    image: part.url, // Relative path for now
  };
}
```

#### 2. Second Conversion (Lines 260-292)

**Before**: Converted ALL file parts (including images) to text
**After**: Only ensures image parts have full URLs, warns about unexpected file parts

```typescript
// Image parts - ensure they have a full URL for Azure OpenAI
if (part.type === "image" && part.image) {
  // If image is a relative path, convert to full URL
  if (typeof part.image === "string" && part.image.startsWith("/")) {
    console.log(`🌐 Adding full URL to image: ${part.image}`);
    return {
      type: "image" as const,
      image: `http://localhost:3000${part.image}`,
    };
  }
  return part;
}

// Unexpected file parts (shouldn't happen if first conversion worked)
if (part.type === "file") {
  console.warn(`⚠️ Unexpected file part in model message:`, part);
  return {
    type: "text" as const,
    text: `[Unsupported file: ${part.name || "unknown"}]`,
  };
}
```

## Expected Behavior After Fix

### Image Upload Flow

1. **Client**: User uploads `.jpeg` or `.png` image
2. **Upload API** (`/api/files/upload`): Saves file, returns metadata
3. **Client**: Sends message with file part:

   ```json
   {
     "type": "file",
     "mediaType": "image/jpeg",
     "name": "photo.jpeg",
     "url": "/uploads/xxx.jpeg"
   }
   ```

4. **First Conversion**: Converts file part to image part:

   ```json
   {
     "type": "image",
     "image": "/uploads/xxx.jpeg"
   }
   ```

5. **Second Conversion**: Adds full URL:

   ```json
   {
     "type": "image",
     "image": "http://localhost:3000/uploads/xxx.jpeg"
   }
   ```

6. **Azure OpenAI**: Receives image part with URL, uses vision to analyze

### Expected Logs

```
🖼️ Converting image file to image part: photo.jpeg
🔍 Model messages before processing: [{"role":"user","content":[{"type":"image","image":"/uploads/xxx.jpeg"}]}]
🌐 Adding full URL to image: /uploads/xxx.jpeg
✅ Model messages after processing: [{"role":"user","content":[{"type":"image","image":"http://localhost:3000/uploads/xxx.jpeg"}]}]
```

## Testing

### Test Case 1: Upload Image with Question

1. Upload a `.jpeg` or `.png` image
2. Ask a question about the image (e.g., "What's in this image?")
3. **Expected**: Azure OpenAI analyzes the image and responds with description

### Test Case 2: Upload PDF with Text

1. Upload a `.pdf` file
2. Ask about the content
3. **Expected**: Text is extracted and sent to Azure OpenAI for analysis

### Test Case 3: Mixed Upload

1. Upload both an image and a PDF
2. Ask about both
3. **Expected**: PDF text is extracted, image is sent as image part

## Content Filter Note

The original error showed:

```json
"sexual": {"filtered": true, "severity": "medium"}
```

This was triggered because the **file path** `/uploads/xxx.jpeg` was sent as **text**, not because the image content was inappropriate. With the fix, the image is sent as an image part (URL), which Azure OpenAI handles differently and is less likely to trigger false positives.

## Related Files

- `/app/(chat)/api/chat/route.ts` - Main fix location
- `/app/(chat)/api/files/upload/route.ts` - File upload API (supports images)
- `/app/(chat)/api/chat/schema.ts` - Schema validation (supports image types)
- `/components/multimodal-input.tsx` - Client file input (accepts images)

## Deployment

After making these changes:

1. **Clear build cache**: `rm -rf .next`
2. **Restart dev server**: `pnpm dev`
3. **Test image upload**: Upload a .jpeg/.png and verify vision works

---

**Fixed:** November 8, 2025  
**Issue:** Image files converted to text, triggering content filters  
**Solution:** Proper image part handling for Azure OpenAI vision
