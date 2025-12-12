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
  deleted?: boolean;
  deletedAt?: string;
}

export interface Expense {
  description: string;
  amount: number;
  category: string;
  timestamp: string;
  deleted?: boolean;
  deletedAt?: string;
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
  deleted?: boolean;
  deletedAt?: string;
}

export interface Payment {
  creditorName: string;
  creditorPhone: string;
  amount: number;
  timestamp: string;
  originalSaleAmount?: number;
  deleted?: boolean;
  deletedAt?: string;
}

// ==================== SALES FUNCTIONS ====================

// Get all sales including deleted ones (for internal use)
export const getAllSales = (): Sale[] => {
  if (typeof window === "undefined") return [];
  try {
    const sales = localStorage.getItem("cloudify-sales");
    return sales ? JSON.parse(sales) : [];
  } catch (error) {
    console.error("Error parsing sales from localStorage:", error);
    return [];
  }
};

// Get only active (non-deleted) sales - USE THIS IN YOUR SALES PAGE
export const getActiveSales = (): Sale[] => {
  const allSales = getAllSales();
  return allSales.filter((sale: Sale) => !sale.deleted);
};

// Get only deleted sales - USE THIS IN YOUR DELETED SALES PAGE
export const getDeletedSales = (): Sale[] => {
  const allSales = getAllSales();
  return allSales.filter((sale: Sale) => sale.deleted);
};

// Save sales to storage
export const saveSales = (sales: Sale[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("cloudify-sales", JSON.stringify(sales));
  } catch (error) {
    console.error("Error saving sales to localStorage:", error);
  }
};

// Soft delete a sale (mark as deleted but keep in storage)
export const softDeleteSale = (timestamp: string): void => {
  const sales = getAllSales();
  const updatedSales = sales.map((sale) =>
    sale.timestamp === timestamp
      ? { ...sale, deleted: true, deletedAt: new Date().toISOString() }
      : sale
  );
  saveSales(updatedSales);
};

// Restore a deleted sale
export const restoreSale = (timestamp: string): void => {
  const sales = getAllSales();
  const updatedSales = sales.map((sale) =>
    sale.timestamp === timestamp
      ? { ...sale, deleted: false, deletedAt: undefined }
      : sale
  );
  saveSales(updatedSales);
};

// Permanently delete a sale (remove from storage completely)
export const permanentDeleteSale = (timestamp: string): void => {
  const sales = getAllSales();
  const updatedSales = sales.filter((sale) => sale.timestamp !== timestamp);
  saveSales(updatedSales);
};

// Empty trash (permanently delete all soft-deleted sales)
export const emptyTrash = (): void => {
  const sales = getAllSales();
  const updatedSales = sales.filter((sale) => !sale.deleted);
  saveSales(updatedSales);
};

// ==================== EXPENSES FUNCTIONS ====================

export const getExpenses = (): Expense[] => {
  if (typeof window === "undefined") return [];
  try {
    const expenses = localStorage.getItem("cloudify-expenses");
    return expenses ? JSON.parse(expenses) : [];
  } catch (error) {
    console.error("Error parsing expenses from localStorage:", error);
    return [];
  }
};

export const saveExpenses = (expenses: Expense[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("cloudify-expenses", JSON.stringify(expenses));
  } catch (error) {
    console.error("Error saving expenses to localStorage:", error);
  }
};

// ==================== CREDITORS FUNCTIONS ====================

export const getCreditors = (): Creditor[] => {
  if (typeof window === "undefined") return [];
  try {
    const creditors = localStorage.getItem("cloudify-creditors");
    return creditors ? JSON.parse(creditors) : [];
  } catch (error) {
    console.error("Error parsing creditors from localStorage:", error);
    return [];
  }
};

export const saveCreditors = (creditors: Creditor[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("cloudify-creditors", JSON.stringify(creditors));
  } catch (error) {
    console.error("Error saving creditors to localStorage:", error);
  }
};

// ==================== PAYMENTS FUNCTIONS ====================

export const getPayments = (): Payment[] => {
  if (typeof window === "undefined") return [];
  try {
    const payments = localStorage.getItem("cloudify-payments");
    return payments ? JSON.parse(payments) : [];
  } catch (error) {
    console.error("Error parsing payments from localStorage:", error);
    return [];
  }
};

export const savePayments = (payments: Payment[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("cloudify-payments", JSON.stringify(payments));
  } catch (error) {
    console.error("Error saving payments to localStorage:", error);
  }
};

// ==================== UTILITY FUNCTIONS ====================

// Clear all data (use with caution!)
export const clearAllData = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("cloudify-sales");
    localStorage.removeItem("cloudify-expenses");
    localStorage.removeItem("cloudify-creditors");
    localStorage.removeItem("cloudify-payments");
  } catch (error) {
    console.error("Error clearing data from localStorage:", error);
  }
};

// Get all data (for backup or reporting)
export const getAllData = (): {
  sales: Sale[];
  expenses: Expense[];
  creditors: Creditor[];
  payments: Payment[];
} => {
  return {
    sales: getAllSales(),
    expenses: getExpenses(),
    creditors: getCreditors(),
    payments: getPayments(),
  };
};

// Export types for convenience
export type {
  Sale as SaleType,
  Expense as ExpenseType,
  Creditor as CreditorType,
  Payment as PaymentType,
  Purchase as PurchaseType,
};

// Add these functions to your existing storage.tsx file

// ==================== ENHANCED DELETION FUNCTIONS ====================

// Permanently delete all sales (both active and deleted)
export const permanentDeleteAllSales = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("cloudify-sales");
  } catch (error) {
    console.error("Error deleting all sales from localStorage:", error);
  }
};

// Permanently delete all expenses
export const permanentDeleteAllExpenses = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("cloudify-expenses");
  } catch (error) {
    console.error("Error deleting all expenses from localStorage:", error);
  }
};

// Permanently delete all creditors
export const permanentDeleteAllCreditors = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("cloudify-creditors");
  } catch (error) {
    console.error("Error deleting all creditors from localStorage:", error);
  }
};

// Permanently delete all payments
export const permanentDeleteAllPayments = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("cloudify-payments");
  } catch (error) {
    console.error("Error deleting all payments from localStorage:", error);
  }
};

// Clear all data except creditors
export const clearAllDataExceptCreditors = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("cloudify-sales");
    localStorage.removeItem("cloudify-expenses");
    localStorage.removeItem("cloudify-payments");
    // Note: We DON'T remove cloudify-creditors
  } catch (error) {
    console.error("Error clearing data from localStorage:", error);
  }
};
// In lib/storage.tsx, update the Sale interface:
export interface Sale {
  type: string;
  itemName: string;
  quantity: number;
  amount: number;
  backendAmount?: number; // Add this line
  paymentMethod: string;
  timestamp: string;
  isCredit: boolean;
  customerName: string;
  customerPhone: string;
  isPaid?: boolean;
  deleted?: boolean;
  deletedAt?: string;
}
