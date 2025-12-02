import Tesseract from 'tesseract.js';

export interface ScannedReceiptData {
  amount?: number;
  date?: Date;
  merchant?: string;
  text: string;
}

export const parseReceiptImage = async (imageFile: File): Promise<ScannedReceiptData> => {
  try {
    const result = await Tesseract.recognize(
      imageFile,
      'eng',
      { 
        logger: m => console.log(m) // Optional logger
      }
    );

    const text = result.data.text;
    console.log("Extracted Text:", text);

    return {
      text,
      amount: extractAmount(text),
      date: extractDate(text),
      merchant: extractMerchant(text),
    };
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to scan receipt");
  }
};

const extractAmount = (text: string): number | undefined => {
  // Look for "Total" followed by a number, or just the largest number with 2 decimals
  // Regex for currency-like numbers: 123.45, 1,234.45
  const amountRegex = /(\d{1,3}(?:,\d{3})*\.\d{2})/g;
  const matches = text.match(amountRegex);

  if (!matches) return undefined;

  // Convert to numbers
  const amounts = matches.map(m => parseFloat(m.replace(/,/g, '')));
  
  // Heuristic: The total is usually the largest amount on the receipt
  return Math.max(...amounts);
};

const extractDate = (text: string): Date | undefined => {
  // Common date formats: DD/MM/YYYY, YYYY-MM-DD, DD-MMM-YYYY
  const datePatterns = [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/, // DD/MM/YYYY or DD-MM-YYYY
    /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/, // YYYY-MM-DD
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})\b/i // DD Mon YYYY
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const dateStr = match[0];
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  return undefined;
};

const extractMerchant = (text: string): string | undefined => {
  // Very basic heuristic: First non-empty line is often the merchant
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0) {
    return lines[0];
  }
  return undefined;
};
