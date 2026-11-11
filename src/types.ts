export type Expense = {
  id: string;
  Date: string; // YYYY-MM-DD
  Expense: number;
  Category: string;
  'For/With': string;
  Description: string;
};

export type VaultData = {
  expenses: Expense[];
  categories: string[];
  people: string[];
  updatedAt: string;
};

export type GoogleUser = { name: string; email: string; picture?: string };
export type Timeframe = 'Monthly' | 'Yearly' | 'Everything';
