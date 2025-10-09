// lib/storage.tsx

// Define TypeScript interfaces for our data structures
export interface Sale {
  type: string;
  itemName: string;
  quantity: number;
  amount: number;
  paymentMethod: string;
  timestamp: string;
  isCredit: boolean;
  customerName: string;
  customerPhone: string;
  isPaid?: boolean;
}

export interface Expense {
  description: string;
  amount: number;
  category: string;
  timestamp: string;
}

export interface Purchase {
  itemName: string;
  quantity: number;
  amount: number;
  date: string;
}

export interface Creditor {
  name: string;
  phone: string;
  amountOwed: number;
  purchases: Purchase[];
}

export interface Payment {
  creditorName: string;
  creditorPhone: string;
  amount: number;
  timestamp: string;
  originalSaleAmount?: number;
}

// Utility functions for localStorage management
export const getSales = (): Sale[] => {
  if (typeof window === 'undefined') return [];
  try {
    const sales = localStorage.getItem('cloudify-sales');
    return sales ? JSON.parse(sales) : [];
  } catch (error) {
    console.error('Error parsing sales from localStorage:', error);
    return [];
  }
};

export const saveSales = (sales: Sale[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('cloudify-sales', JSON.stringify(sales));
  } catch (error) {
    console.error('Error saving sales to localStorage:', error);
  }
};

export const getExpenses = (): Expense[] => {
  if (typeof window === 'undefined') return [];
  try {
    const expenses = localStorage.getItem('cloudify-expenses');
    return expenses ? JSON.parse(expenses) : [];
  } catch (error) {
    console.error('Error parsing expenses from localStorage:', error);
    return [];
  }
};

export const saveExpenses = (expenses: Expense[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('cloudify-expenses', JSON.stringify(expenses));
  } catch (error) {
    console.error('Error saving expenses to localStorage:', error);
  }
};

export const getCreditors = (): Creditor[] => {
  if (typeof window === 'undefined') return [];
  try {
    const creditors = localStorage.getItem('cloudify-creditors');
    return creditors ? JSON.parse(creditors) : [];
  } catch (error) {
    console.error('Error parsing creditors from localStorage:', error);
    return [];
  }
};

export const saveCreditors = (creditors: Creditor[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('cloudify-creditors', JSON.stringify(creditors));
  } catch (error) {
    console.error('Error saving creditors to localStorage:', error);
  }
};

export const getPayments = (): Payment[] => {
  if (typeof window === 'undefined') return [];
  try {
    const payments = localStorage.getItem('cloudify-payments');
    return payments ? JSON.parse(payments) : [];
  } catch (error) {
    console.error('Error parsing payments from localStorage:', error);
    return [];
  }
};

export const savePayments = (payments: Payment[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('cloudify-payments', JSON.stringify(payments));
  } catch (error) {
    console.error('Error saving payments to localStorage:', error);
  }
};

export const clearAllData = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('cloudify-sales');
    localStorage.removeItem('cloudify-expenses');
    localStorage.removeItem('cloudify-creditors');
    localStorage.removeItem('cloudify-payments');
  } catch (error) {
    console.error('Error clearing data from localStorage:', error);
  }
};

export const getAllData = (): {
  sales: Sale[];
  expenses: Expense[];
  creditors: Creditor[];
  payments: Payment[];
} => {
  return {
    sales: getSales(),
    expenses: getExpenses(),
    creditors: getCreditors(),
    payments: getPayments(),
  };
};

export type {
  Sale as SaleType,
  Expense as ExpenseType,
  Creditor as CreditorType,
  Payment as PaymentType,
  Purchase as PurchaseType,
};