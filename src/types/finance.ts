export interface Transaction {
  id: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  date: string;
  description?: string | null;
}
