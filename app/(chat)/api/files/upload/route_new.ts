// ORIGINAL: Vercel Blob storage - COMMENTED OUT FOR LOCAL STORAGE
// import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { extractTextFromPDF, extractTextFromTextFile } from "@/lib/utils/file-parser";

// ORIGINAL: Auth import - COMMENTED OUT (authentication disabled)
// import { auth } from "@/app/(auth)/auth";

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "File size should be less than 10MB",
    })
    // PDF/TXT: text extracted and sent to LLM
    // PNG/JPG: image sent directly (Azure OpenAI supports vision)
    .refine((file) => [
      "application/pdf",
      "text/plain",
      "image/png",
      "image/jpeg",
    ].includes(file.type), {
      message: "File type should be PDF, TXT, PNG, or JPG",
    }),
});

export async function POST(request: Request) {
  // ORIGINAL: Authentication check - COMMENTED OUT (authentication disabled)
  // const session = await auth();
  // if (!session) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    try {
      // ORIGINAL: Vercel Blob storage - COMMENTED OUT
      // const data = await put(`${filename}`, fileBuffer, {
      //   access: "public",
      // });
      
      // NEW: Local file storage
      const fileExtension = filename.split('.').pop();
      const uniqueFilename = `${randomUUID()}.${fileExtension}`;
      const uploadsDir = join(process.cwd(), 'public', 'uploads');
      const filePath = join(uploadsDir, uniqueFilename);
      
      // Create uploads directory if it doesn't exist
      const { mkdir } = await import('fs/promises');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (err) {
        // Directory might already exist, ignore error
      }
      
      // Write file to local storage
      await writeFile(filePath, buffer);
      
      // Extract text from PDF or TXT files
      // Images (PNG/JPG) are uploaded as-is without text extraction
      let extractedText: string | undefined;
      
      if (file.type === 'application/pdf') {
        try {
          console.log(`Attempting to extract text from PDF: ${filename}`);
          extractedText = await extractTextFromPDF(buffer);
          console.log(`✅ Extracted ${extractedText?.length || 0} characters from PDF: ${filename}`);
        } catch (error) {
          console.error('❌ PDF text extraction failed:', error);
          // Return error instead of continuing - PDF text is required
          return NextResponse.json({ 
            error: "Failed to extract text from PDF", 
            details: error instanceof Error ? error.message : String(error) 
          }, { status: 500 });
        }
      } else if (file.type === 'text/plain') {
        try {
          console.log(`Attempting to read TXT file: ${filename}`);
          extractedText = extractTextFromTextFile(buffer);
          console.log(`✅ Read ${extractedText?.length || 0} characters from TXT: ${filename}`);
        } catch (error) {
          console.error('❌ TXT file reading failed:', error);
          // Return error instead of continuing - text content is required
          return NextResponse.json({ 
            error: "Failed to read text file", 
            details: error instanceof Error ? error.message : String(error) 
          }, { status: 500 });
        }
      } else if (file.type === 'image/png' || file.type === 'image/jpeg') {
        // Images are uploaded without text extraction
        // Azure OpenAI GPT-4o supports vision directly
        console.log(`✅ Uploaded image: ${filename} (${file.type})`);
      }
      
      // Return file data in same format as Vercel Blob + extracted text
      const data = {
        url: `/uploads/${uniqueFilename}`,
        pathname: uniqueFilename,
        contentType: file.type,
        contentDisposition: `attachment; filename="${filename}"`,
        name: filename,
        extractedText, // Include extracted text for PDF/TXT files
      };

      return NextResponse.json(data);
    } catch (error) {
      console.error("Upload failed:", error);
      return NextResponse.json({ 
        error: "Upload failed", 
        details: error instanceof Error ? error.message : String(error) 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Failed to process request:", error);
    return NextResponse.json(
      { 
        error: "Failed to process request", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
