# File Upload Guide - Supported File Types

This document explains what types of files you can upload in the chat application and how to modify the restrictions.

---

## Current Upload Restrictions

### ✅ Supported File Types

Currently, the application **only accepts PDF and TXT files**:

- **PDF** (`application/pdf`, `.pdf`)
- **TXT** (`text/plain`, `.txt`)

### 📏 File Size Limit

- **Maximum Size**: 10 MB per file
- Files larger than 10 MB will be rejected

### 📁 Storage Location

- **Local Path**: `/public/uploads/`
- **URL Access**: `http://localhost:3000/uploads/[filename]`

### 📝 Text Extraction

- **PDF files**: Text content is automatically extracted using `pdf-parse`
- **TXT files**: Content is read as UTF-8 text
- Extracted text is sent to the LLM for processing (not the binary file)

---

## Upload Methods

### 1. Click Attachment Button

- Click the 📎 (paperclip) icon in the chat input
- Select PDF or TXT file(s) from your computer
- Multiple files can be selected at once

### 2. ~~Paste Images~~

- _(Not supported for PDF/TXT files)_

### 3. Drag & Drop

_(Not explicitly implemented in code, but may work depending on browser)_

---

## File Upload Configuration

### Backend Validation

**File**: `app/(chat)/api/files/upload/route.ts`

```typescript
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "File size should be less than 10MB",
    })
    .refine((file) => ["application/pdf", "text/plain"].includes(file.type), {
      message: "File type should be PDF or TXT",
    }),
});
```

### Frontend Validation

**File**: `components/multimodal-input.tsx`

```tsx
<input
  type="file"
  accept="application/pdf,text/plain"
  multiple
  onChange={handleFileChange}
/>
```

---

## How to Add More File Types

Edit `app/(chat)/api/files/upload/route.ts`:

```typescript
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      // Change size limit
      message: "File size should be less than 10MB",
    })
    .refine(
      (file) =>
        [
          // Add more MIME types here
          "image/jpeg",
          "image/png",
          "image/gif", // GIF support
          "image/webp", // WebP support
          "application/pdf", // PDF support
          "text/plain", // Text files
          "text/csv", // CSV files
        ].includes(file.type),
      {
        message: "Unsupported file type",
      }
    ),
});
```

### Step 2: Update Chat Schema

Edit `app/(chat)/api/chat/schema.ts`:

```typescript
mediaType: z.enum([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
]),
```

### Step 3: Update Frontend (Optional)

Edit `components/multimodal-input.tsx` to add `accept` attribute:

Find the file input element (around line 301):

```tsx
<input
  className="-top-4 -left-4 pointer-events-none fixed size-0.5 opacity-0"
  multiple
  onChange={handleFileChange}
  ref={fileInputRef}
  tabIndex={-1}
  type="file"
  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" // Add this
/>
```

---

## Common MIME Types Reference

### Images

- `image/jpeg` - JPEG/JPG images
- `image/png` - PNG images
- `image/gif` - GIF images
- `image/webp` - WebP images
- `image/svg+xml` - SVG images
- `image/bmp` - Bitmap images

### Documents

- `application/pdf` - PDF documents
- `application/msword` - Word (.doc)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` - Word (.docx)
- `application/vnd.ms-excel` - Excel (.xls)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` - Excel (.xlsx)
- `application/vnd.ms-powerpoint` - PowerPoint (.ppt)
- `application/vnd.openxmlformats-officedocument.presentationml.presentation` - PowerPoint (.pptx)

### Text Files

- `text/plain` - Plain text (.txt)
- `text/csv` - CSV files
- `text/html` - HTML files
- `text/css` - CSS files
- `text/javascript` - JavaScript files
- `application/json` - JSON files

### Code Files

- `text/x-python` - Python files
- `text/x-java` - Java files
- `text/x-c` - C files
- `text/x-c++` - C++ files

### Archives

- `application/zip` - ZIP archives
- `application/x-rar-compressed` - RAR archives
- `application/x-7z-compressed` - 7-Zip archives

### Audio/Video

- `audio/mpeg` - MP3 audio
- `audio/wav` - WAV audio
- `video/mp4` - MP4 video
- `video/mpeg` - MPEG video

---

## Example: Adding PDF Support

### 1. Update Backend Validation

```typescript
// app/(chat)/api/files/upload/route.ts
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "File size should be less than 10MB",
    })
    .refine(
      (file) =>
        [
          "image/jpeg",
          "image/png",
          "application/pdf", // ← Add PDF
        ].includes(file.type),
      {
        message: "File type should be JPEG, PNG, or PDF",
      }
    ),
});
```

### 2. Update Chat Schema

```typescript
// app/(chat)/api/chat/schema.ts
mediaType: z.enum([
  "image/jpeg",
  "image/png",
  "application/pdf"  // ← Add PDF
]),
```

### 3. Update Frontend (Optional)

```tsx
// components/multimodal-input.tsx
<input
  type="file"
  accept="image/jpeg,image/png,application/pdf" // ← Add PDF
  multiple
  // ...other props
/>
```

### 4. Restart the App

```bash
# The app will hot-reload automatically
# Or restart manually if needed
```

---

## Testing File Upload

### Test Valid Upload

1. **Prepare test files**:

   - `test.jpg` (under 5MB)
   - `test.png` (under 5MB)

2. **Upload in chat**:

   - Click paperclip icon
   - Select file
   - File should appear in preview
   - Send message

3. **Verify storage**:
   ```bash
   ls -lh public/uploads/
   ```

### Test Invalid Upload

1. **Large file** (over 5MB):

   - Error: "File size should be less than 5MB"

2. **Wrong type** (e.g., PDF):

   - Error: "File type should be JPEG or PNG"

3. **Check browser console** (F12):
   - Look for upload errors
   - Check network tab for API response

---

## File Upload Flow

### 1. Frontend

```
User clicks attach → File input opens → User selects file
         ↓
handleFileChange() → uploadFile() → POST /api/files/upload
         ↓
Response received → Attachment added to state → Preview shown
```

### 2. Backend

```
POST /api/files/upload → Validate file (type, size)
         ↓
Generate unique filename (UUID.ext)
         ↓
Write to /public/uploads/ directory
         ↓
Return { url, name, contentType }
```

### 3. Storage

```
Original: photo.jpg
         ↓
Saved as: 550e8400-e29b-41d4-a716-446655440000.jpg
         ↓
Location: /public/uploads/550e8400-e29b-41d4-a716-446655440000.jpg
         ↓
Access: http://localhost:3000/uploads/550e8400-e29b-41d4-a716-446655440000.jpg
```

---

## Troubleshooting

### Error: "File type should be JPEG or PNG"

**Problem**: Trying to upload unsupported file type

**Solution**:

- Only upload JPEG or PNG images
- OR modify the code to support more types (see above)

### Error: "File size should be less than 5MB"

**Problem**: File is too large

**Solution**:

- Compress the image
- OR increase size limit in code
- Use online tools: tinypng.com, compressor.io

### File uploads but doesn't appear

**Problem**: Upload successful but preview not showing

**Check**:

1. Browser console for errors
2. Network tab - check API response
3. `/public/uploads/` directory - verify file exists
4. File permissions - ensure writable

### Upload hangs/freezes

**Problem**: Upload doesn't complete

**Check**:

1. File size (very large files may timeout)
2. Network connection
3. Server logs in terminal
4. Browser console for errors

---

## Security Considerations

### Current Implementation

⚠️ **For Local Development Only**

Current setup has minimal security:

- ✅ File size validation (5MB)
- ✅ MIME type validation (JPEG/PNG only)
- ❌ No virus scanning
- ❌ No content validation
- ❌ No rate limiting
- ❌ No user authentication

### Production Recommendations

For production deployment:

1. **Add Virus Scanning**:

   - Use ClamAV or similar
   - Scan files before saving

2. **Validate File Content**:

   - Don't trust MIME type alone
   - Check magic bytes/file headers
   - Use libraries like `file-type`

3. **Implement Rate Limiting**:

   - Limit uploads per user/IP
   - Prevent abuse/spam

4. **Use Cloud Storage**:

   - AWS S3, Google Cloud Storage
   - Better scalability
   - CDN support

5. **Add User Authentication**:

   - Track who uploaded what
   - Implement quotas
   - Enable access control

6. **Content Security**:

   - Sanitize filenames
   - Prevent path traversal
   - Set proper CORS headers

7. **File Cleanup**:
   - Implement automatic deletion
   - Set retention policies
   - Monitor storage usage

---

## Additional Features to Consider

### 1. Drag & Drop Support

Add drag & drop zone:

```tsx
<div
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  className="border-dashed border-2"
>
  Drop files here
</div>
```

### 2. Upload Progress Bar

Show upload progress:

```tsx
const [progress, setProgress] = useState(0);

// Use XMLHttpRequest to track progress
xhr.upload.onprogress = (e) => {
  setProgress((e.loaded / e.total) * 100);
};
```

### 3. Image Preview Before Upload

Preview images before uploading:

```tsx
const reader = new FileReader();
reader.onload = (e) => {
  setPreviewUrl(e.target.result);
};
reader.readAsDataURL(file);
```

### 4. Multiple File Type Support

Allow images, PDFs, and documents:

- Images: Display inline
- PDFs: Show PDF viewer
- Documents: Show download link

---

## Summary

**Current Configuration**:

- ✅ JPEG and PNG only
- ✅ 5 MB max size
- ✅ Multiple file upload
- ✅ Paste from clipboard
- ✅ Local file storage

**To Add More Types**:

1. Update `FileSchema` validation
2. Update `mediaType` enum
3. Optionally add `accept` attribute
4. Restart app

**Storage**:

- Files saved to `/public/uploads/`
- Accessible at `http://localhost:3000/uploads/[filename]`

---

**Created**: November 7, 2025  
**Purpose**: Document file upload capabilities and configuration  
**Current Restriction**: Images only (JPEG/PNG, 5MB max)
