"use client";
import { useState, useEffect, ChangeEvent } from "react";
import {
  getActiveSales,
  getAllSales,
  getExpenses,
  getCreditors,
  getPayments,
  Sale,
  Expense,
  Creditor,
  Payment,
} from "../../../lib/storage";
import Link from "next/link";

export default function TotalsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    if (isAuthenticated) {
      setSales(getActiveSales());
      setExpenses(getExpenses());
      setCreditors(getCreditors());
      setPayments(getPayments());
    }
  }, [isAuthenticated]);

  const authenticate = (): void => {
    if (password === "cloudify") {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  // Calculate totals by payment method
  const cashSales = sales.filter(
    (sale) => !sale.isCredit && sale.paymentMethod === "cash"
  );
  const jazzCashSales = sales.filter(
    (sale) => !sale.isCredit && sale.paymentMethod === "jazzcash"
  );
  const creditCardSales = sales.filter(
    (sale) => !sale.isCredit && sale.paymentMethod === "card"
  );
  const creditSales = sales.filter((sale) => sale.isCredit);

  // Calculate refill and coil revenues (frontend and backend)
  const refillSales = sales.filter((sale) => sale.type === "refill");
  const coilSales = sales.filter((sale) => sale.type === "coil");

  // Frontend revenue (100 for refill, 750 for coil)
  const totalRefillRevenue = refillSales.reduce(
    (sum, sale) => sum + sale.amount,
    0
  );
  const totalCoilRevenue = coilSales.reduce(
    (sum, sale) => sum + sale.amount,
    0
  );

  // Backend revenue (60 for refill, 600 for coil)
  const totalBackendRefillRevenue = refillSales.reduce(
    (sum, sale) => sum + (sale.backendAmount || sale.quantity * 60),
    0
  );
  const totalBackendCoilRevenue = coilSales.reduce(
    (sum, sale) => sum + (sale.backendAmount || sale.quantity * 600),
    0
  );

  const totalRefillQuantity = refillSales.reduce(
    (sum, sale) => sum + sale.quantity,
    0
  );
  const totalCoilQuantity = coilSales.reduce(
    (sum, sale) => sum + sale.quantity,
    0
  );

  const totalCashSales = cashSales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalJazzCashSales = jazzCashSales.reduce(
    (sum, sale) => sum + sale.amount,
    0
  );
  const totalCreditCardSales = creditCardSales.reduce(
    (sum, sale) => sum + sale.amount,
    0
  );
  const totalCreditSalesAmount = creditSales.reduce(
    (sum, sale) => sum + sale.amount,
    0
  );
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const totalOwed = creditors.reduce(
    (sum, creditor) => sum + creditor.amountOwed,
    0
  );
  const totalPayments = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Net Amount = All Immediate Payments (Cash + JazzCash + Credit Card) + Payments Received - Expenses
  const netAmount =
    totalCashSales +
    totalJazzCashSales +
    totalCreditCardSales +
    totalPayments -
    totalExpenses;

  // Refill quantities by type
  interface RefillQuantities {
    [key: string]: number;
  }

  const refillQuantities: RefillQuantities = refillSales.reduce(
    (acc: RefillQuantities, sale) => {
      acc[sale.itemName] = (acc[sale.itemName] || 0) + sale.quantity;
      return acc;
    },
    {}
  );

  // Download PDF function
  const downloadPDF = async (): Promise<void> => {
    const html2pdf = (await import("html2pdf.js")).default;

    // Get all data from storage including deleted entries
    const allSales = getAllSales();
    const allExpenses = getExpenses();
    const allCreditors = getCreditors();
    const allPayments = getPayments();

    // Filter active sales for totals calculation (excluding deleted)
    const activeSales = allSales.filter((sale) => !sale.deleted);

    // Calculate totals using active sales only for the dashboard
    const totalSales = activeSales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalCashSales = activeSales
      .filter((sale) => !sale.isCredit && sale.paymentMethod === "cash")
      .reduce((sum, sale) => sum + sale.amount, 0);
    const totalJazzCashSales = activeSales
      .filter((sale) => !sale.isCredit && sale.paymentMethod === "jazzcash")
      .reduce((sum, sale) => sum + sale.amount, 0);
    const totalCreditCardSales = activeSales
      .filter((sale) => !sale.isCredit && sale.paymentMethod === "card")
      .reduce((sum, sale) => sum + sale.amount, 0);
    const totalCreditSales = activeSales
      .filter((sale) => sale.isCredit)
      .reduce((sum, sale) => sum + sale.amount, 0);
    const totalExpenses = allExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const totalOwed = allCreditors.reduce(
      (sum, creditor) => sum + creditor.amountOwed,
      0
    );
    const totalPaymentsReceived = allPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const netAmount =
      totalCashSales +
      totalJazzCashSales +
      totalCreditCardSales +
      totalPaymentsReceived -
      totalExpenses;

    // Count deleted sales for the report
    const deletedSalesCount = allSales.filter((sale) => sale.deleted).length;

    // Create comprehensive HTML content that includes both totals and complete reports
    const comprehensiveHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #6c757d, #495057); color: white; padding: 20px; border-radius: 10px;">
          <h1>CLOUDIFY - COMPREHENSIVE BUSINESS REPORT</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p style="color: #ffeb3b; font-weight: bold; margin-top: 10px;">INCLUDES TOTALS DASHBOARD & COMPLETE REPORTS WITH ALL ENTRIES</p>
        </div>

        <!-- Executive Summary -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4a6fa5; border-bottom: 2px solid #4a6fa5; padding-bottom: 10px;">EXECUTIVE SUMMARY</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #28a745;">Net Amount</h3>
              <p style="font-size: 1.5rem; font-weight: bold; margin: 10px 0;">${netAmount.toFixed(
                2
              )} PKR</p>
            </div>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #2196f3;">Total Sales</h3>
              <p style="font-size: 1.5rem; font-weight: bold; margin: 10px 0;">${totalSales.toFixed(
                2
              )} PKR</p>
            </div>
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #ffc107;">Credit Sales</h3>
              <p style="font-size: 1.5rem; font-weight: bold; margin: 10px 0;">${totalCreditSales.toFixed(
                2
              )} PKR</p>
            </div>
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #dc3545;">Total Expenses</h3>
              <p style="font-size: 1.5rem; font-weight: bold; margin: 10px 0;">${totalExpenses.toFixed(
                2
              )} PKR</p>
            </div>
          </div>
        </div>

        <!-- Financial Summary -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #4a6fa5; text-align: center; margin-bottom: 20px;">FINANCIAL SUMMARY</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <div style="text-align: center;">
              <h4>Total Revenue</h4>
              <p style="font-size: 1.2rem; font-weight: bold;">${totalSales.toFixed(
                2
              )} PKR</p>
            </div>
            <div style="text-align: center;">
              <h4>Collected Revenue</h4>
              <p style="font-size: 1.2rem; font-weight: bold;">${(
                totalCashSales +
                totalJazzCashSales +
                totalCreditCardSales +
                totalPaymentsReceived
              ).toFixed(2)} PKR</p>
            </div>
            <div style="text-align: center;">
              <h4>Pending Collection</h4>
              <p style="font-size: 1.2rem; font-weight: bold;">${(
                totalCreditSales - totalPaymentsReceived
              ).toFixed(2)} PKR</p>
            </div>
            <div style="text-align: center;">
              <h4>Net Profit</h4>
              <p style="font-size: 1.2rem; font-weight: bold; color: ${
                netAmount >= 0 ? "#28a745" : "#dc3545"
              }">
                ${netAmount.toFixed(2)} PKR
              </p>
            </div>
          </div>
        </div>

        <!-- Payment Method Breakdown -->
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #856404; text-align: center; margin-bottom: 20px;">PAYMENT METHOD BREAKDOWN</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="text-align: center;">
              <h4>Cash Sales</h4>
              <p style="font-size: 1.2rem; font-weight: bold; color: #28a745;">${totalCashSales.toFixed(
                2
              )} PKR</p>
            </div>
            <div style="text-align: center;">
              <h4>JazzCash Sales</h4>
              <p style="font-size: 1.2rem; font-weight: bold; color: #17a2b8;">${totalJazzCashSales.toFixed(
                2
              )} PKR</p>
            </div>
            <div style="text-align: center;">
              <h4>Credit Card Sales</h4>
              <p style="font-size: 1.2rem; font-weight: bold; color: #6f42c1;">${totalCreditCardSales.toFixed(
                2
              )} PKR</p>
            </div>
          </div>
        </div>

        <!-- Page Break for Reports Section -->
        <div style="page-break-before: always; margin-top: 40px;">
          <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; border-radius: 10px;">
            <h1>COMPLETE REPORTS - ALL ENTRIES</h1>
            <p style="color: #ffeb3b; font-weight: bold;">INCLUDES DELETED ENTRIES AND COMPLETE HISTORICAL DATA</p>
          </div>
        </div>

        <!-- Complete Sales Report with Deleted Entries -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4a6fa5; border-bottom: 2px solid #4a6fa5; padding-bottom: 10px;">COMPLETE SALES REPORT - ALL ENTRIES</h2>
          <p><strong>Total Sales Records:</strong> ${
            allSales.length
          } (including ${deletedSalesCount} deleted entries)</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.8rem;">
            <thead>
              <tr style="background-color: #4a6fa5; color: white;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Status</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Date</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Type</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Item</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Quantity</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Amount</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Payment</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Sale Type</th>
              </tr>
            </thead>
            <tbody>
              ${allSales
                .slice()
                .reverse()
                .map(
                  (sale) => `
                <tr style="border-bottom: 1px solid #ddd; ${
                  sale.deleted ? "background-color: #ffebee;" : ""
                }">
                  <td style="padding: 8px; border: 1px solid #ddd; color: ${
                    sale.deleted ? "#d32f2f" : "#388e3c"
                  }; font-weight: bold;">
                    ${sale.deleted ? "❌ DELETED" : "✅ ACTIVE"}
                  </td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(
                    sale.timestamp
                  ).toLocaleDateString()}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    sale.type
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    sale.itemName
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    sale.quantity
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${sale.amount.toFixed(
                    2
                  )} PKR</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    sale.paymentMethod
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd; color: ${
                    sale.isCredit ? "#ffc107" : "#28a745"
                  }">
                    ${sale.isCredit ? "CREDIT" : "CASH"}
                  </td>
                </tr>
                ${
                  sale.deleted
                    ? `
                <tr style="background-color: #ffebee;">
                  <td colspan="8" style="padding: 5px 8px; border: 1px solid #ddd; color: #d32f2f; font-size: 0.7em;">
                    🗑️ Deleted on: ${
                      sale.deletedAt
                        ? new Date(sale.deletedAt).toLocaleString()
                        : "Unknown"
                    }
                  </td>
                </tr>
                `
                    : ""
                }
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- Expenses Report -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4a6fa5; border-bottom: 2px solid #4a6fa5; padding-bottom: 10px;">EXPENSES REPORT</h2>
          <p><strong>Total Expenses:</strong> ${
            allExpenses.length
          } transactions</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.8rem;">
            <thead>
              <tr style="background-color: #dc3545; color: white;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Date</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Category</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${allExpenses
                .slice()
                .reverse()
                .map(
                  (expense) => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(
                    expense.timestamp
                  ).toLocaleDateString()}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    expense.description
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    expense.category
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${expense.amount.toFixed(
                    2
                  )} PKR</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- Creditors Report -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4a6fa5; border-bottom: 2px solid #4a6fa5; padding-bottom: 10px;">CREDITORS REPORT</h2>
          <p><strong>Total Creditors:</strong> ${
            allCreditors.length
          } customers</p>
          <p><strong>Total Amount Owed:</strong> ${totalOwed.toFixed(2)} PKR</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.8rem;">
            <thead>
              <tr style="background-color: #ffc107; color: black;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Customer Name</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Phone</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Amount Owed</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Purchases</th>
              </tr>
            </thead>
            <tbody>
              ${allCreditors
                .map(
                  (creditor) => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    creditor.name
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    creditor.phone
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${creditor.amountOwed.toFixed(
                    2
                  )} PKR</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    creditor.purchases.length
                  } items</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- Payments History -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4a6fa5; border-bottom: 2px solid #4a6fa5; padding-bottom: 10px;">PAYMENTS HISTORY</h2>
          <p><strong>Total Payments Received:</strong> ${
            allPayments.length
          } payments</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.8rem;">
            <thead>
              <tr style="background-color: #28a745; color: white;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Date</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Customer</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${allPayments
                .slice()
                .reverse()
                .map(
                  (payment) => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(
                    payment.timestamp
                  ).toLocaleDateString()}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    payment.creditorName
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${payment.amount.toFixed(
                    2
                  )} PKR</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #4a6fa5; color: #6c757d;">
          <p>Cloudify Business Management System - Comprehensive Report with Complete Data</p>
          <p>Includes totals dashboard and complete reports with all historical entries</p>
          <p>Generated automatically on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    // Create temporary element for PDF generation
    const tempElement = document.createElement("div");
    tempElement.innerHTML = comprehensiveHTML;
    document.body.appendChild(tempElement);

    const opt = {
      margin: 10,
      filename: `cloudify_complete_business_report_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        backgroundColor: "#FFFFFF",
        useCORS: true,
        logging: false,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait" as const,
      },
    };

    try {
      await html2pdf().set(opt).from(tempElement).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      // Clean up temporary element
      document.body.removeChild(tempElement);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={authContainerStyles}>
        <div style={authBoxStyles}>
          <h2>Admin Access Required</h2>
          <p>Please enter the admin password to view totals:</p>
          <input
            type="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            placeholder="Enter password"
            style={inputStyles}
          />
          <button onClick={authenticate} style={authButtonStyles}>
            Access Totals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <header style={headerStyles}>
        <div style={headerContentStyles}>
          <h1 style={headerTitleStyle}>BUSINESS TOTALS - ADMIN DASHBOARD</h1>
          <p style={headerSubtitleStyle}>
            Credit sales are only counted as income when payments are received
          </p>
        </div>
      </header>

      <div id="totals-content">
        {/* Updated Totals Grid with backend revenue boxes */}
        <div style={totalsGridStyles}>
          {/* Cash Sales */}
          <div style={totalItemStyles}>
            <h3>Cash Sales</h3>
            <div style={valueStyles}>{totalCashSales.toFixed(2)} PKR</div>
            <small style={smallTextStyles}>
              {cashSales.length} immediate sales
            </small>
          </div>

          {/* JazzCash Sales */}
          <div style={{ ...totalItemStyles, borderTop: "4px solid #17a2b8" }}>
            <h3>JazzCash Sales</h3>
            <div style={{ ...valueStyles, color: "#17a2b8" }}>
              {totalJazzCashSales.toFixed(2)} PKR
            </div>
            <small style={smallTextStyles}>
              {jazzCashSales.length} JazzCash sales
            </small>
          </div>

          {/* Credit Card Sales */}
          <div style={{ ...totalItemStyles, borderTop: "4px solid #6f42c1" }}>
            <h3>Credit Card Sales</h3>
            <div style={{ ...valueStyles, color: "#6f42c1" }}>
              {totalCreditCardSales.toFixed(2)} PKR
            </div>
            <small style={smallTextStyles}>
              {creditCardSales.length} card sales
            </small>
          </div>

          {/* Credit Sales */}
          <div style={totalItemStyles}>
            <h3>Credit Sales (Pending)</h3>
            <div style={{ ...valueStyles, color: "#ffc107" }}>
              {totalCreditSalesAmount.toFixed(2)} PKR
            </div>
            <small style={smallTextStyles}>
              {creditSales.length} credit sales
            </small>
          </div>

          {/* Backend Refill Revenue */}
          <div style={{ ...totalItemStyles, borderTop: "4px solid #4CAF50" }}>
            <h3>Backend Refill Revenue</h3>
            <div style={{ ...valueStyles, color: "#4CAF50" }}>
              {totalBackendRefillRevenue.toFixed(2)} PKR
            </div>
            <small style={smallTextStyles}>
              {refillSales.length} refills × 60 PKR
            </small>
            <div style={backendNoteStyle}>
              Frontend: {totalRefillRevenue.toFixed(2)} PKR
            </div>
          </div>

          {/* Backend Coil Revenue */}
          <div style={{ ...totalItemStyles, borderTop: "4px solid #FF9800" }}>
            <h3>Backend Coil Revenue</h3>
            <div style={{ ...valueStyles, color: "#FF9800" }}>
              {totalBackendCoilRevenue.toFixed(2)} PKR
            </div>
            <small style={smallTextStyles}>
              {coilSales.length} coils × 600 PKR
            </small>
            <div style={backendNoteStyle}>
              Frontend: {totalCoilRevenue.toFixed(2)}
            </div>
          </div>

          {/* Expenses */}
          <div style={totalItemStyles}>
            <h3>Total Expenses</h3>
            <div style={valueStyles}>{totalExpenses.toFixed(2)} PKR</div>
          </div>

          {/* Amount Owed */}
          <div style={totalItemStyles}>
            <h3>Amount Owed</h3>
            <div style={valueStyles}>{totalOwed.toFixed(2)} PKR</div>
            <small style={smallTextStyles}>{creditors.length} creditors</small>
          </div>

          {/* Payments Received */}
          <div style={totalItemStyles}>
            <h3>Payments Received</h3>
            <div style={valueStyles}>{totalPayments.toFixed(2)} PKR</div>
            <small style={smallTextStyles}>From credit sales</small>
          </div>

          {/* Net Amount */}
          <div style={{ ...totalItemStyles, backgroundColor: "#e8f5e8" }}>
            <h3>Net Amount</h3>
            <div
              style={{
                ...valueStyles,
                color: netAmount >= 0 ? "#28a745" : "#dc3545",
              }}
            >
              {netAmount.toFixed(2)} PKR
            </div>
            <small style={smallTextStyles}>
              All Payments + Payments Received - Expenses
            </small>
          </div>

          {/* Backend Revenue Summary */}
          <div
            style={{
              ...totalItemStyles,
              backgroundColor: "#f0f8ff",
              gridColumn: "span 2",
            }}
          >
            <h3>Backend Revenue Summary</h3>
            <div style={backendSummaryGrid}>
              <div style={backendSummaryItem}>
                <div>Refill Revenue (×60)</div>
                <div style={{ fontWeight: "bold", color: "#4CAF50" }}>
                  {totalBackendRefillRevenue.toFixed(2)} PKR
                </div>
              </div>
              <div style={backendSummaryItem}>
                <div>Coil Revenue (×600)</div>
                <div style={{ fontWeight: "bold", color: "#FF9800" }}>
                  {totalBackendCoilRevenue.toFixed(2)} PKR
                </div>
              </div>
              <div
                style={{
                  ...backendSummaryItem,
                  borderTop: "1px solid #ddd",
                  paddingTop: "10px",
                }}
              >
                <div>
                  <strong>Total Backend Revenue</strong>
                </div>
                <div style={{ fontWeight: "bold", color: "#2196F3" }}>
                  {(
                    totalBackendRefillRevenue + totalBackendCoilRevenue
                  ).toFixed(2)}{" "}
                  PKR
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyle}>Financial Summary</h2>
          <div style={summaryGridStyles}>
            <div style={summaryItemStyles}>
              <h4>Total Potential Revenue</h4>
              <div style={summaryValueStyles}>
                {(
                  totalCashSales +
                  totalJazzCashSales +
                  totalCreditCardSales +
                  totalCreditSalesAmount
                ).toFixed(2)}{" "}
                PKR
              </div>
            </div>
            <div style={summaryItemStyles}>
              <h4>Collected Revenue</h4>
              <div style={summaryValueStyles}>
                {(
                  totalCashSales +
                  totalJazzCashSales +
                  totalCreditCardSales +
                  totalPayments
                ).toFixed(2)}{" "}
                PKR
              </div>
            </div>
            <div style={summaryItemStyles}>
              <h4>Collection Rate</h4>
              <div style={summaryValueStyles}>
                {totalCreditSalesAmount > 0
                  ? ((totalPayments / totalCreditSalesAmount) * 100).toFixed(
                      1
                    ) + "%"
                  : "100%"}
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div style={{ marginTop: "30px" }}>
            <h3 style={subsectionTitleStyle}>Payment Method Breakdown</h3>
            <div style={paymentBreakdownStyles}>
              <div style={paymentMethodItemStyles}>
                <span>Cash:</span>
                <span>{totalCashSales.toFixed(2)} PKR</span>
              </div>
              <div style={paymentMethodItemStyles}>
                <span>JazzCash:</span>
                <span>{totalJazzCashSales.toFixed(2)} PKR</span>
              </div>
              <div style={paymentMethodItemStyles}>
                <span>Credit Card:</span>
                <span>{totalCreditCardSales.toFixed(2)} PKR</span>
              </div>
              <div
                style={{
                  ...paymentMethodItemStyles,
                  borderTop: "2px solid #eee",
                  paddingTop: "15px",
                  fontWeight: "bold",
                }}
              >
                <span>Total Immediate Payments:</span>
                <span>
                  {(
                    totalCashSales +
                    totalJazzCashSales +
                    totalCreditCardSales
                  ).toFixed(2)}{" "}
                  PKR
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Revenue Comparison */}
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyle}>Product Revenue Comparison</h2>
          <div style={comparisonGridStyles}>
            <div style={comparisonItemStyles}>
              <h4>Refill Revenue</h4>
              <div style={comparisonValues}>
                <div>
                  <span style={{ color: "#666" }}>Frontend (×100):</span>
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    {totalRefillRevenue.toFixed(2)} PKR
                  </span>
                </div>
                <div>
                  <span style={{ color: "#666" }}>Backend (×60):</span>
                  <span style={{ fontWeight: "bold", color: "#4CAF50" }}>
                    {" "}
                    {totalBackendRefillRevenue.toFixed(2)} PKR
                  </span>
                </div>
                <div>
                  <span style={{ color: "#666" }}>Difference:</span>
                  <span style={{ fontWeight: "bold", color: "#FF5722" }}>
                    {" "}
                    {(totalRefillRevenue - totalBackendRefillRevenue).toFixed(
                      2
                    )}{" "}
                    PKR
                  </span>
                </div>
              </div>
            </div>
            <div style={comparisonItemStyles}>
              <h4>Coil Revenue</h4>
              <div style={comparisonValues}>
                <div>
                  <span style={{ color: "#666" }}>Frontend (x800):</span>
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    {totalCoilRevenue.toFixed(2)} PKR
                  </span>
                </div>
                <div>
                  <span style={{ color: "#666" }}>Backend (×600):</span>
                  <span style={{ fontWeight: "bold", color: "#FF9800" }}>
                    {" "}
                    {totalBackendCoilRevenue.toFixed(2)} PKR
                  </span>
                </div>
                <div>
                  <span style={{ color: "#666" }}>Difference:</span>
                  <span style={{ fontWeight: "bold", color: "#FF5722" }}>
                    {" "}
                    {(totalCoilRevenue - totalBackendCoilRevenue).toFixed(
                      2
                    )}{" "}
                    PKR
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ... Rest of the existing code remains unchanged ... */}

        {/* Action Buttons */}
        <div style={buttonContainerStyles}>
          <button onClick={downloadPDF} style={pdfButtonStyles}>
            Download PDF Report
          </button>
          <Link href="/totals/reports" style={reportsButtonStyles}>
            View Complete Reports
          </Link>
        </div>
      </div>
    </div>
  );
}

// ==================== NEW STYLES ====================

const backendNoteStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "#666",
  marginTop: "5px",
  fontStyle: "italic",
};

const backendSummaryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  marginTop: "10px",
};

const backendSummaryItem: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  borderBottom: "1px solid #eee",
};

const comparisonGridStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "20px",
  marginTop: "20px",
};

const comparisonItemStyles: React.CSSProperties = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
};

const comparisonValues: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  marginTop: "15px",
};

// ==================== EXISTING STYLES ====================

// Authentication Styles
const authContainerStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "50vh",
  padding: "20px",
};

const authBoxStyles: React.CSSProperties = {
  backgroundColor: "white",
  padding: "40px",
  borderRadius: "10px",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
  textAlign: "center",
  maxWidth: "400px",
  width: "100%",
};

const inputStyles: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  margin: "15px 0",
  border: "1px solid #ddd",
  borderRadius: "6px",
};

const authButtonStyles: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#4a6fa5",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "1rem",
};

// Container Styles
const containerStyles: React.CSSProperties = {
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "20px",
};

// Header Styles
const headerStyles: React.CSSProperties = {
  textAlign: "center",
  padding: "20px 0",
  marginBottom: "30px",
  background: "linear-gradient(135deg, #6c757d, #495057)",
  color: "white",
  borderRadius: "10px",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
  position: "relative",
};

const headerContentStyles: React.CSSProperties = {
  position: "relative",
  padding: "0 20px",
};

const headerTitleStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "1.8rem",
};

const headerSubtitleStyle: React.CSSProperties = {
  marginTop: "10px",
  opacity: 0.9,
  fontSize: "1rem",
};

// Button Styles
const pdfButtonStyles: React.CSSProperties = {
  padding: "10px 20px",
  backgroundColor: "#dc3545",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.9rem",
  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
  margin: "0 2rem",
};

const reportsButtonStyles: React.CSSProperties = {
  padding: "10px 20px",
  backgroundColor: "#17a2b8",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.9rem",
  textDecoration: "none",
  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
  margin: "2rem 2rem",
};

const buttonContainerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1rem",
};

// Grid and Section Styles
const totalsGridStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
  marginBottom: "40px",
};

const totalItemStyles: React.CSSProperties = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
  textAlign: "center",
  borderTop: "4px solid #4a6fa5",
  position: "relative",
};

const valueStyles: React.CSSProperties = {
  fontSize: "1.8rem",
  fontWeight: "700",
  color: "#4a6fa5",
  marginTop: "10px",
  marginBottom: "5px",
};

const smallTextStyles: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#6c757d",
  marginTop: "5px",
};

const sectionStyles: React.CSSProperties = {
  marginBottom: "40px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  marginBottom: "20px",
  color: "#4a6fa5",
};

const subsectionTitleStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  marginBottom: "15px",
  color: "#4a6fa5",
};

// Summary Grid Styles
const summaryGridStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "20px",
  marginBottom: "20px",
};

const summaryItemStyles: React.CSSProperties = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
  textAlign: "center",
  borderTop: "4px solid #17a2b8",
};

const summaryValueStyles: React.CSSProperties = {
  fontSize: "1.4rem",
  fontWeight: "700",
  color: "#17a2b8",
  marginTop: "10px",
};

// Payment Breakdown Styles
const paymentBreakdownStyles: React.CSSProperties = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
};

const paymentMethodItemStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px 0",
  borderBottom: "1px solid #eee",
};

// Coil Sales Styles
const coilSummaryStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "20px",
  marginBottom: "30px",
};

const coilSummaryItemStyles: React.CSSProperties = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
  textAlign: "center",
  borderTop: "4px solid #ff7e5f",
};

const coilSummaryValueStyles: React.CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: "700",
  color: "#ff7e5f",
  marginTop: "10px",
};

// Table Styles
const tableContainerStyles: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: "10px",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
  overflow: "hidden",
  marginBottom: "20px",
};

const tableScrollContainer: React.CSSProperties = {
  overflowX: "auto",
  width: "100%",
};

const tableStyles: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "600px",
};

const tableHeaderStyles: React.CSSProperties = {
  backgroundColor: "#4a6fa5",
  color: "white",
  padding: "15px",
  textAlign: "left",
  fontWeight: "600",
  fontSize: "0.9rem",
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: "1px solid #eee",
};

const tableCellStyles: React.CSSProperties = {
  padding: "15px",
  textAlign: "left",
  fontSize: "0.9rem",
};

const typeBadgeStyles: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "0.8rem",
  fontWeight: "600",
};

// Refill Styles
const refillTotalsStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "20px",
};

const refillItemStyles: React.CSSProperties = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
  textAlign: "center",
};

const refillValueStyles: React.CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: "700",
  color: "#ff7e5f",
  marginTop: "10px",
};

// Sales Breakdown Styles
const salesBreakdownStyles: React.CSSProperties = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
};

const breakdownItemStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px 0",
  borderBottom: "1px solid #eee",
};

// Add responsive classes with JavaScript
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    /* Mobile First - Default styles */
    .responsive-totals-grid {
      grid-template-columns: 1fr !important;
    }
    
    .responsive-summary-grid {
      grid-template-columns: 1fr !important;
    }
    
    .responsive-coil-summary {
      grid-template-columns: 1fr !important;
    }
    
    .responsive-refill-totals {
      grid-template-columns: 1fr !important;
    }

    .responsive-pdf-button {
      position: static !important;
      margin-top: 15px !important;
      width: 100% !important;
    }

    /* Small phones (320px - 480px) */
    @media (min-width: 320px) {
      .responsive-totals-grid {
        grid-template-columns: 1fr !important;
      }
    }

    /* Large phones (481px - 767px) */
    @media (min-width: 481px) {
      .responsive-totals-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      .responsive-summary-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      .responsive-coil-summary {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      .responsive-refill-totals {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }

    /* Tablets (768px - 1023px) */
    @media (min-width: 768px) {
      .responsive-totals-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
      .responsive-summary-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
      .responsive-coil-summary {
        grid-template-columns: repeat(3, 1fr) !important;
      }
      .responsive-refill-totals {
        grid-template-columns: repeat(3, 1fr) !important;
      }
      .responsive-pdf-button {
        position: absolute !important;
        top: 10px !important;
        right: 20px !important;
        width: auto !important;
        margin-top: 0 !important;
      }
    }

    /* Small desktops (1024px - 1279px) */
    @media (min-width: 1024px) {
      .responsive-totals-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
    }

    /* Large desktops (1280px+) */
    @media (min-width: 1280px) {
      .responsive-totals-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
    }

    /* Extra large screens (1440px+) */
    @media (min-width: 1440px) {
      .responsive-totals-grid {
        grid-template-columns: repeat(6, 1fr) !important;
      }
    }

    /* Table scrolling for mobile */
    .table-scroll-container {
      overflow-x: auto;
      width: 100%;
    }

    @media (max-width: 767px) {
      .table-scroll-container table {
        min-width: 600px;
      }
    }
  `;
  document.head.appendChild(style);

  // Add classes to elements after component mounts
  setTimeout(() => {
    const totalsGrid = document.querySelector(
      '[style*="gridTemplateColumns: repeat(auto-fit, minmax(250px, 1fr))"]'
    );
    const summaryGrid = document.querySelector(
      '[style*="gridTemplateColumns: repeat(auto-fit, minmax(200px, 1fr))"]'
    );
    const coilSummary = document.querySelector(
      '[style*="gridTemplateColumns: repeat(auto-fit, minmax(200px, 1fr))"]'
    );
    const refillTotals = document.querySelector(
      '[style*="gridTemplateColumns: repeat(auto-fit, minmax(200px, 1fr))"]'
    );
    const pdfButton = document.querySelector('[style*="position: absolute"]');
    const tableContainers = document.querySelectorAll(
      '[style*="overflow: hidden"]'
    );

    if (totalsGrid) totalsGrid.classList.add("responsive-totals-grid");
    if (summaryGrid) summaryGrid.classList.add("responsive-summary-grid");
    if (coilSummary) coilSummary.classList.add("responsive-coil-summary");
    if (refillTotals) refillTotals.classList.add("responsive-refill-totals");
    if (pdfButton) pdfButton.classList.add("responsive-pdf-button");

    tableContainers.forEach((container) => {
      const table = container.querySelector("table");
      if (table) {
        const scrollContainer = document.createElement("div");
        scrollContainer.className = "table-scroll-container";
        table.parentNode?.insertBefore(scrollContainer, table);
        scrollContainer.appendChild(table);
      }
    });
  }, 100);
}
