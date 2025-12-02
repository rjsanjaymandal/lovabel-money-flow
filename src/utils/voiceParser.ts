
export interface VoiceData {
  amount?: string;
  category?: string;
  description?: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Food & Dining": ["food", "lunch", "dinner", "breakfast", "coffee", "burger", "pizza", "restaurant", "cafe", "snack", "drink", "meal", "kfc", "mcdonalds", "dominos", "starbucks", "zomato", "swiggy"],
  "Transportation": ["transport", "uber", "ola", "taxi", "cab", "bus", "train", "metro", "flight", "fuel", "petrol", "diesel", "gas", "parking", "toll"],
  "Shopping": ["shopping", "clothes", "shoes", "dress", "shirt", "pant", "amazon", "flipkart", "myntra", "mall", "market"],
  "Bills & Utilities": ["bill", "rent", "electricity", "water", "wifi", "internet", "recharge", "mobile", "gas cylinder", "maintenance"],
  "Healthcare": ["health", "doctor", "medicine", "pharmacy", "hospital", "clinic", "checkup", "test"],
  "Entertainment": ["movie", "cinema", "netflix", "prime", "spotify", "game", "concert", "party"],
  "Education": ["book", "course", "tuition", "school", "college", "fees", "stationery"],
  "Personal": ["haircut", "salon", "spa", "gym", "fitness"],
};

export const parseVoiceInput = (text: string): VoiceData => {
  const lowerText = text.toLowerCase();
  const result: VoiceData = { description: text };

  // 1. Extract Amount
  // Look for numbers, optionally preceded by currency terms
  const amountMatch = lowerText.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
  if (amountMatch) {
    // Remove commas and parse
    const cleanAmount = amountMatch[1].replace(/,/g, "");
    if (!isNaN(parseFloat(cleanAmount))) {
      result.amount = cleanAmount;
    }
  }

  // 2. Extract Category
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      result.category = category;
      break; // Stop after first match
    }
  }

  // 3. Refine Description (Optional)
  // We could remove the amount from the description to make it cleaner
  // For now, keeping the full text is often better for context.

  return result;
};
