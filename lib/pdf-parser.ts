import { PDFParse } from 'pdf-parse';

/**
 * Extracts text from a PDF buffer.
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
    try {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        return result.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error('Failed to parse PDF');
    }
}
