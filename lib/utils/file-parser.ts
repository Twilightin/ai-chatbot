/**
 * Extract text from PDF buffer using pdf-parse
 * @param buffer - PDF file buffer
 * @returns Extracted text content
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Use pdf-parse - simpler and more reliable for text extraction
    const pdfParse = require('pdf-parse');
    
    // Parse the PDF buffer
    const data = await pdfParse(buffer);
    
    // Extract text from the parsed data
    const fullText = data.text;
    
    // Check if we got any text
    if (!fullText || fullText.trim().length === 0) {
      console.warn('PDF parsed but no text found - might be a scanned image or empty PDF');
      return '[This PDF appears to be empty or contains only images. No text could be extracted.]';
    }
    
    const cleanText = fullText.trim();
    console.log(`✅ Successfully extracted ${cleanText.length} characters from PDF`);
    console.log(`   Pages: ${data.numpages}`);
    console.log(`   Info: ${data.info ? JSON.stringify(data.info) : 'N/A'}`);
    
    return cleanText;
  } catch (error: any) {
    console.error('❌ PDF parsing error:', error);
    
    let errorMessage = 'Failed to extract text from PDF';
    if (error.message?.includes('Invalid PDF')) {
      errorMessage = 'Invalid or corrupted PDF file';
    } else if (error.message?.includes('password')) {
      errorMessage = 'PDF is password-protected';
    } else if (error.message?.includes('encrypted')) {
      errorMessage = 'PDF is encrypted';
    } else if (error.message) {
      errorMessage = `PDF parsing error: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Extract text from text file buffer
 * @param buffer - Text file buffer
 * @returns Text content
 */
export function extractTextFromTextFile(buffer: Buffer): string {
  try {
    return buffer.toString('utf-8');
  } catch (error) {
    console.error('Error reading text file:', error);
    throw new Error('Failed to read text file');
  }
}
