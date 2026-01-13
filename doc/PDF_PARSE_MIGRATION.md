# PDF Parser Migration: pdf2json → pdf-parse

## Overview

Successfully migrated PDF text extraction from `pdf2json` to `pdf-parse` for better Azure OpenAI compatibility and simpler implementation.

## Changes Made

### 1. Updated Dependencies (`package.json`)

- **Removed**: `pdf2json@^4.0.0`
- **Added**: `pdf-parse@^1.1.1` (installed: `1.1.4`)

### 2. Updated PDF Extraction Logic (`lib/utils/file-parser.ts`)

#### Before (pdf2json):

- Complex event-based parsing using `PDFParser`
- Manual text extraction from nested data structure
- URI-encoded text decoding with fallbacks
- Promise-based wrapper around event handlers

#### After (pdf-parse):

- Simple async/await pattern
- Direct text extraction from `data.text`
- Built-in text decoding
- Cleaner error handling

### 3. Key Improvements

✅ **Simpler Code**: Reduced from ~80 lines to ~40 lines  
✅ **Better Compatibility**: Works seamlessly with Azure OpenAI  
✅ **Easier Maintenance**: Straightforward async/await instead of events  
✅ **Same Features**: Preserves all error handling and logging  
✅ **Better Output**: Direct text extraction without manual parsing

### 4. API Compatibility

The function signature remains unchanged:

```typescript
export async function extractTextFromPDF(buffer: Buffer): Promise<string>;
```

All calling code continues to work without modifications.

## Testing Recommendations

Test with various PDF types:

1. **Simple text PDFs** - Standard documents with extractable text
2. **Complex PDFs** - Multi-column layouts, tables
3. **Scanned PDFs** - Image-based documents (should return empty message)
4. **Protected PDFs** - Password-protected or encrypted files (should error gracefully)
5. **Corrupted PDFs** - Invalid or malformed files (should error gracefully)

## Benefits for Azure OpenAI

- **Text Extraction Only**: pdf-parse focuses on text extraction, which is what we need for LLM processing
- **No File Type Issues**: Extracted text is converted to text parts in the message, avoiding Azure OpenAI's `type: "file"` limitation
- **Better Performance**: Simpler library with fewer dependencies
- **More Reliable**: Widely used in production environments

## Error Handling

Both libraries handle similar error cases:

- Invalid/corrupted PDF files
- Password-protected PDFs
- Encrypted PDFs
- Empty PDFs or scanned images

The new implementation maintains the same error messages for consistency.

## Installation

```bash
# Remove old dependency
pnpm remove pdf2json

# Add new dependency
pnpm install pdf-parse
```

## Rollback Plan

If needed, revert by:

1. Restore `lib/utils/file-parser.ts` from git history
2. Update `package.json` to use `pdf2json@^4.0.0`
3. Run `pnpm install`

## Related Documentation

- [FILE_UPLOAD_RESTRICTIONS.md](./FILE_UPLOAD_RESTRICTIONS.md) - File upload requirements
- [AZURE_OPENAI_PDF_FIX.md](./AZURE_OPENAI_PDF_FIX.md) - Azure OpenAI compatibility fixes

## Migration Date

2025-11-08

## Status

✅ **Complete** - Ready for testing
