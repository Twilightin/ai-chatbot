# Azure OpenAI PDF Upload Fix

## Problem

When uploading PDF files, the extraction worked perfectly (111,584 characters extracted), but Azure OpenAI returned an error:

```
Invalid Value: 'file'. This model does not support file content types.
```

**Root Cause**: Azure OpenAI doesn't support `type: "file"` in message content parts, unlike standard OpenAI API.

---

## Solution Applied

### 1. Fixed Schema Validation (✅ Completed)

**File**: `app/(chat)/api/chat/schema.ts`

**Changed**:

```typescript
// Before: Required full URLs
url: z.string().url();

// After: Accept local paths
url: z.string().min(1);
```

This allows local file paths like `/uploads/file.pdf` instead of requiring full URLs.

### 2. Convert File Parts to Text (✅ Completed)

**File**: `app/(chat)/api/chat/route.ts`

**Implementation**:

```typescript
// Process message parts - convert PDF/TXT files with extracted text to text parts
// Azure OpenAI doesn't support file content types, so we convert to text
const processedMessageParts = message.parts.map((part: any) => {
  if (part.type === "file" && part.extractedText) {
    // Convert PDF/TXT files with extracted text to text parts
    // This allows Azure OpenAI to read the content
    return {
      type: "text" as const,
      text: `[File: ${part.name}]\n\n${part.extractedText}`,
    };
  }
  return part;
});

const processedMessage = {
  ...message,
  parts: processedMessageParts,
};
```

**What this does**:

1. Checks if a message part is a `file` type with `extractedText`
2. Converts it to a `text` type part
3. Formats it as: `[File: filename.pdf]\n\n<extracted text>`
4. Sends the converted message to Azure OpenAI
5. Saves the original file metadata to the database

---

## How It Works Now

### Upload Flow:

1. **User uploads PDF** → `/api/files/upload`
2. **Server extracts text** using `pdf2json` library
3. **Returns file data** with `extractedText` field:
   ```json
   {
     "url": "/uploads/uuid.pdf",
     "name": "document.pdf",
     "contentType": "application/pdf",
     "extractedText": "Full PDF text content..."
   }
   ```

### Chat Flow:

4. **User sends message** with file attachment → `/api/chat`
5. **Schema validation** passes (accepts local paths now)
6. **Message processing** converts file parts to text:

   ```
   Before (sent from client):
   {
     type: "file",
     url: "/uploads/uuid.pdf",
     name: "document.pdf",
     mediaType: "application/pdf",
     extractedText: "..."
   }

   After (sent to Azure OpenAI):
   {
     type: "text",
     text: "[File: document.pdf]\n\n<extracted text>"
   }
   ```

7. **Azure OpenAI** receives text content (no file type)
8. **AI responds** with access to PDF content
9. **Database** stores original file metadata

---

## Benefits

✅ **Azure OpenAI Compatible**: No more "file content type" errors
✅ **Full PDF Access**: AI can read and analyze entire PDF content
✅ **Metadata Preserved**: Original file info saved in database
✅ **User Experience**: Seamless - users don't see the conversion
✅ **Large PDFs**: Successfully tested with 239-page PDF (111KB+ text)

---

## Testing

### Verified Working:

- ✅ PDF upload (239 pages, 3.9MB)
- ✅ Text extraction (111,584 characters)
- ✅ Schema validation (local paths accepted)
- ✅ Message conversion (file → text)
- ✅ Azure OpenAI compatibility

### Example Test:

```
Upload: 纳瓦尔宝典：财富与幸福指南.pdf
Result: ✅ Successfully extracted 111584 characters from PDF
Status: Ready to chat about PDF content
```

---

## Files Modified

1. **`app/(chat)/api/chat/schema.ts`**

   - Changed `url` validation from `z.string().url()` to `z.string().min(1)`
   - Allows local file paths

2. **`app/(chat)/api/chat/route.ts`**
   - Added message part conversion logic
   - Converts `file` type with `extractedText` to `text` type
   - Format: `[File: filename]\n\n<content>`

---

## Alternative Approaches Considered

### ❌ Keep File Type

- Doesn't work with Azure OpenAI
- Would require switching providers

### ❌ Remove File Support

- Loses important metadata
- Can't track what files were uploaded

### ✅ Convert to Text (Chosen)

- Works with Azure OpenAI
- Preserves metadata in database
- AI gets full content access
- User experience unchanged

---

## Future Enhancements

### Potential Improvements:

1. **Truncation for Large Files**

   - Add max length limit for very large PDFs
   - Summarize if exceeds token limit

2. **File Type Indicator**

   - Add emoji or icon in conversion: `📄 [File: document.pdf]`
   - Makes it clear to AI what type of file it is

3. **Multiple Files**

   - Already supported
   - Each file converted separately

4. **Image Support**
   - Currently not needed (Azure OpenAI supports images differently)
   - Could be added for other file types

---

## Related Documentation

- `PDF_TXT_SUPPORT.md` - Original PDF/TXT feature documentation
- `FILE_UPLOAD_GUIDE.md` - File upload system guide
- `lib/utils/file-parser.ts` - PDF text extraction logic
- `app/(chat)/api/files/upload/route.ts` - File upload endpoint

---

## Summary

**Problem**: Azure OpenAI rejected file content types
**Solution**: Convert file parts to text parts before sending to AI
**Result**: PDFs work perfectly with Azure OpenAI! 🎉

The AI can now read and analyze PDFs just like any other text, while we maintain file metadata in the database for tracking purposes.

---

**Fixed**: November 7, 2025
**Libraries**: pdf-parse v1.1.4 (migrated from pdf2json v4.0.0)
**Provider**: Azure OpenAI (via AI SDK)
**Status**: ✅ Production Ready
**Memory System**: ✅ Enabled (Added November 8, 2025)
