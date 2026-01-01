"use client";
import { useState, useEffect, ChangeEvent, useMemo } from "react";
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
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [countingValues, setCountingValues] = useState({
    cash: 0,
    jazzCash: 0,
    creditCard: 0,
    credit: 0,
    expenses: 0,
    owed: 0,
    received: 0,
    net: 0,
  });

  useEffect(() => {
    if (isAuthenticated) {
      const activeSales = getActiveSales();
      const allExpenses = getExpenses();
      const allCreditors = getCreditors();
      const allPayments = getPayments();

      setSales(activeSales);
      setExpenses(allExpenses);
      setCreditors(allCreditors);
      setPayments(allPayments);

      // Start counting animations after a brief delay
      setTimeout(() => {
        calculateAndAnimateValues(
          activeSales,
          allExpenses,
          allCreditors,
          allPayments
        );
        setIsLoaded(true);
      }, 500);
    }
  }, [isAuthenticated]);

  // Calculate sold items by category
  const soldItemsSummary = useMemo(() => {
    const summary = {
      coils: [] as { name: string; quantity: number; amount: number }[],
      devices: [] as { name: string; quantity: number; amount: number }[],
      repairs: [] as { name: string; quantity: number; amount: number }[],
      puffs: [] as { name: string; quantity: number; amount: number }[],
      flavourBottles: [] as {
        name: string;
        quantity: number;
        amount: number;
      }[],
      refills: [] as { name: string; quantity: number; amount: number }[],
    };

    sales.forEach((sale) => {
      const item = {
        name: sale.itemName,
        quantity: sale.quantity,
        amount: sale.amount,
      };

      switch (sale.type) {
        case "coil":
          const existingCoil = summary.coils.find(
            (c) => c.name === sale.itemName
          );
          if (existingCoil) {
            existingCoil.quantity += sale.quantity;
            existingCoil.amount += sale.amount;
          } else {
            summary.coils.push(item);
          }
          break;

        case "device":
          const existingDevice = summary.devices.find(
            (d) => d.name === sale.itemName
          );
          if (existingDevice) {
            existingDevice.quantity += sale.quantity;
            existingDevice.amount += sale.amount;
          } else {
            summary.devices.push(item);
          }
          break;

        case "repairing":
          const existingRepair = summary.repairs.find(
            (r) => r.name === sale.itemName
          );
          if (existingRepair) {
            existingRepair.quantity += sale.quantity;
            existingRepair.amount += sale.amount;
          } else {
            summary.repairs.push(item);
          }
          break;

        case "puff":
          const existingPuff = summary.puffs.find(
            (p) => p.name === sale.itemName
          );
          if (existingPuff) {
            existingPuff.quantity += sale.quantity;
            existingPuff.amount += sale.amount;
          } else {
            summary.puffs.push(item);
          }
          break;

        case "flavourbottle":
          const existingFlavour = summary.flavourBottles.find(
            (f) => f.name === sale.itemName
          );
          if (existingFlavour) {
            existingFlavour.quantity += sale.quantity;
            existingFlavour.amount += sale.amount;
          } else {
            summary.flavourBottles.push(item);
          }
          break;

        case "refill":
          const existingRefill = summary.refills.find(
            (r) => r.name === sale.itemName
          );
          if (existingRefill) {
            existingRefill.quantity += sale.quantity;
            existingRefill.amount += sale.amount;
          } else {
            summary.refills.push(item);
          }
          break;
      }
    });

    // Sort each category by amount (highest first)
    summary.coils.sort((a, b) => b.amount - a.amount);
    summary.devices.sort((a, b) => b.amount - a.amount);
    summary.repairs.sort((a, b) => b.amount - a.amount);
    summary.puffs.sort((a, b) => b.amount - a.amount);
    summary.flavourBottles.sort((a, b) => b.amount - a.amount);
    summary.refills.sort((a, b) => b.amount - a.amount);

    return summary;
  }, [sales]);

  // Calculate totals for each category
  const categoryTotals = useMemo(() => {
    return {
      coils: {
        totalQuantity: soldItemsSummary.coils.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        totalAmount: soldItemsSummary.coils.reduce(
          (sum, item) => sum + item.amount,
          0
        ),
      },
      devices: {
        totalQuantity: soldItemsSummary.devices.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        totalAmount: soldItemsSummary.devices.reduce(
          (sum, item) => sum + item.amount,
          0
        ),
      },
      repairs: {
        totalQuantity: soldItemsSummary.repairs.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        totalAmount: soldItemsSummary.repairs.reduce(
          (sum, item) => sum + item.amount,
          0
        ),
      },
      puffs: {
        totalQuantity: soldItemsSummary.puffs.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        totalAmount: soldItemsSummary.puffs.reduce(
          (sum, item) => sum + item.amount,
          0
        ),
      },
      flavourBottles: {
        totalQuantity: soldItemsSummary.flavourBottles.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        totalAmount: soldItemsSummary.flavourBottles.reduce(
          (sum, item) => sum + item.amount,
          0
        ),
      },
      refills: {
        totalQuantity: soldItemsSummary.refills.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        totalAmount: soldItemsSummary.refills.reduce(
          (sum, item) => sum + item.amount,
          0
        ),
      },
    };
  }, [soldItemsSummary]);

  const calculateAndAnimateValues = (
    sales: Sale[],
    expenses: Expense[],
    creditors: Creditor[],
    payments: Payment[]
  ) => {
    // Calculate totals
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

    const totalCashSales = cashSales.reduce(
      (sum, sale) => sum + sale.amount,
      0
    );
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
    const netAmount =
      totalCashSales +
      totalJazzCashSales +
      totalCreditCardSales +
      totalPayments -
      totalExpenses;

    // Animate counting
    animateCount(totalCashSales, "cash", 0);
    animateCount(totalJazzCashSales, "jazzCash", 100);
    animateCount(totalCreditCardSales, "creditCard", 200);
    animateCount(totalCreditSalesAmount, "credit", 300);
    animateCount(totalExpenses, "expenses", 400);
    animateCount(totalOwed, "owed", 500);
    animateCount(totalPayments, "received", 600);
    animateCount(netAmount, "net", 700);
  };

  const animateCount = (
    target: number,
    key: keyof typeof countingValues,
    delay: number
  ) => {
    setTimeout(() => {
      const duration = 1500;
      const startTime = Date.now();
      const startValue = 0;

      const updateCount = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (target - startValue) * easedProgress;

        setCountingValues((prev) => ({
          ...prev,
          [key]: parseFloat(currentValue.toFixed(2)),
        }));

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        }
      };

      requestAnimationFrame(updateCount);
    }, delay);
  };

  const authenticate = (): void => {
    if (password === "cloudify") {
      setIsAuthenticated(true);
    } else {
      // Shake animation for wrong password
      const authBox = document.querySelector(".auth-box");
      if (authBox) {
        authBox.classList.add("animate-shake");
        setTimeout(() => authBox.classList.remove("animate-shake"), 500);
      }
    }
  };

  // Calculate totals for display
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
  const refillSales = sales.filter((sale) => sale.type === "refill");
  const coilSales = sales.filter((sale) => sale.type === "coil");

  const totalRefillRevenue = refillSales.reduce(
    (sum, sale) => sum + sale.amount,
    0
  );
  const totalCoilRevenue = coilSales.reduce(
    (sum, sale) => sum + sale.amount,
    0
  );
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

  // Update the downloadPDF function to include sold items section
  const downloadPDF = async (): Promise<void> => {
    const html2pdf = (await import("html2pdf.js")).default;

    // Get all data from storage including deleted entries
    const allSales = getAllSales();
    const allExpenses = getExpenses();
    const allCreditors = getCreditors();
    const allPayments = getPayments();

    // Filter active sales for totals calculation (excluding deleted)
    const activeSales = allSales.filter((sale) => !sale.deleted);

    // Calculate sold items summary for PDF
    const pdfSoldItemsSummary = {
      coils: [] as { name: string; quantity: number; amount: number }[],
      devices: [] as { name: string; quantity: number; amount: number }[],
      repairs: [] as { name: string; quantity: number; amount: number }[],
      puffs: [] as { name: string; quantity: number; amount: number }[],
      flavourBottles: [] as {
        name: string;
        quantity: number;
        amount: number;
      }[],
      refills: [] as { name: string; quantity: number; amount: number }[],
    };

    activeSales.forEach((sale) => {
      const item = {
        name: sale.itemName,
        quantity: sale.quantity,
        amount: sale.amount,
      };

      switch (sale.type) {
        case "coil":
          const existingCoil = pdfSoldItemsSummary.coils.find(
            (c) => c.name === sale.itemName
          );
          if (existingCoil) {
            existingCoil.quantity += sale.quantity;
            existingCoil.amount += sale.amount;
          } else {
            pdfSoldItemsSummary.coils.push(item);
          }
          break;

        case "device":
          const existingDevice = pdfSoldItemsSummary.devices.find(
            (d) => d.name === sale.itemName
          );
          if (existingDevice) {
            existingDevice.quantity += sale.quantity;
            existingDevice.amount += sale.amount;
          } else {
            pdfSoldItemsSummary.devices.push(item);
          }
          break;

        case "repairing":
          const existingRepair = pdfSoldItemsSummary.repairs.find(
            (r) => r.name === sale.itemName
          );
          if (existingRepair) {
            existingRepair.quantity += sale.quantity;
            existingRepair.amount += sale.amount;
          } else {
            pdfSoldItemsSummary.repairs.push(item);
          }
          break;

        case "puff":
          const existingPuff = pdfSoldItemsSummary.puffs.find(
            (p) => p.name === sale.itemName
          );
          if (existingPuff) {
            existingPuff.quantity += sale.quantity;
            existingPuff.amount += sale.amount;
          } else {
            pdfSoldItemsSummary.puffs.push(item);
          }
          break;

        case "flavourbottle":
          const existingFlavour = pdfSoldItemsSummary.flavourBottles.find(
            (f) => f.name === sale.itemName
          );
          if (existingFlavour) {
            existingFlavour.quantity += sale.quantity;
            existingFlavour.amount += sale.amount;
          } else {
            pdfSoldItemsSummary.flavourBottles.push(item);
          }
          break;

        case "refill":
          const existingRefill = pdfSoldItemsSummary.refills.find(
            (r) => r.name === sale.itemName
          );
          if (existingRefill) {
            existingRefill.quantity += sale.quantity;
            existingRefill.amount += sale.amount;
          } else {
            pdfSoldItemsSummary.refills.push(item);
          }
          break;
      }
    });

    // Calculate totals
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

    // Create comprehensive HTML content
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

        <!-- Sold Items Summary -->
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="color: #4a6fa5; border-bottom: 2px solid #4a6fa5; padding-bottom: 10px;">SOLD ITEMS SUMMARY</h2>
          
          <!-- Coils -->
          ${
            pdfSoldItemsSummary.coils.length > 0
              ? `
            <div style="margin-bottom: 25px;">
              <h3 style="color: #ff9800; margin-bottom: 15px; background: rgba(255, 152, 0, 0.1); padding: 10px; border-radius: 5px;">
                Coils - Total: ${pdfSoldItemsSummary.coils.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                )} items, ${pdfSoldItemsSummary.coils
                  .reduce((sum, item) => sum + item.amount, 0)
                  .toFixed(2)} PKR
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead>
                  <tr style="background-color: #fff3cd;">
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Coil Name</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Quantity</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${pdfSoldItemsSummary.coils
                    .map(
                      (item) => `
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 8px; border: 1px solid #ddd;">${
                        item.name
                      }</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${
                        item.quantity
                      }</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.amount.toFixed(
                        2
                      )}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
              : ""
          }

          <!-- Devices -->
          ${
            pdfSoldItemsSummary.devices.length > 0
              ? `
            <div style="margin-bottom: 25px;">
              <h3 style="color: #2196f3; margin-bottom: 15px; background: rgba(33, 150, 243, 0.1); padding: 10px; border-radius: 5px;">
                Devices - Total: ${pdfSoldItemsSummary.devices.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                )} items, ${pdfSoldItemsSummary.devices
                  .reduce((sum, item) => sum + item.amount, 0)
                  .toFixed(2)} PKR
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead>
                  <tr style="background-color: #e3f2fd;">
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Device Name</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Quantity</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${pdfSoldItemsSummary.devices
                    .map(
                      (item) => `
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 8px; border: 1px solid #ddd;">${
                        item.name
                      }</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${
                        item.quantity
                      }</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.amount.toFixed(
                        2
                      )}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
              : ""
          }

          <!-- Repairs -->
          ${
            pdfSoldItemsSummary.repairs.length > 0
              ? `
            <div style="margin-bottom: 25px;">
              <h3 style="color: #9c27b0; margin-bottom: 15px; background: rgba(156, 39, 176, 0.1); padding: 10px; border-radius: 5px;">
                Repairs - Total: ${pdfSoldItemsSummary.repairs.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                )} services, ${pdfSoldItemsSummary.repairs
                  .reduce((sum, item) => sum + item.amount, 0)
                  .toFixed(2)} PKR
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead>
                  <tr style="background-color: #f3e5f5;">
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Repair Service</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Quantity</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${pdfSoldItemsSummary.repairs
                    .map(
                      (item) => `
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 8px; border: 1px solid #ddd;">${
                        item.name
                      }</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${
                        item.quantity
                      }</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.amount.toFixed(
                        2
                      )}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
              : ""
          }

          <!-- Puffs -->
          ${
            pdfSoldItemsSummary.puffs.length > 0
              ? `
            <div style="margin-bottom: 25px;">
              <h3 style="color: #e91e63; margin-bottom: 15px; background: rgba(233, 30, 99, 0.1); padding: 10px; border-radius: 5px;">
                Puffs - Total: ${pdfSoldItemsSummary.puffs.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                )} items, ${pdfSoldItemsSummary.puffs
                  .reduce((sum, item) => sum + item.amount, 0)
                  .toFixed(2)} PKR
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead>
                  <tr style="background-color: #fce4ec;">
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Puff Name</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Quantity</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${pdfSoldItemsSummary.puffs
                    .map(
                      (item) => `
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 8px; border: 1px solid #ddd;">${
                        item.name
                      }</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${
                        item.quantity
                      }</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.amount.toFixed(
                        2
                      )}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
              : ""
          }

          <!-- Flavour Bottles -->
          ${
            pdfSoldItemsSummary.flavourBottles.length > 0
              ? `
            <div style="margin-bottom: 25px;">
              <h3 style="color: #4caf50; margin-bottom: 15px; background: rgba(76, 175, 80, 0.1); padding: 10px; border-radius: 5px;">
                Flavour Bottles - Total: ${pdfSoldItemsSummary.flavourBottles.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                )} bottles, ${pdfSoldItemsSummary.flavourBottles
                  .reduce((sum, item) => sum + item.amount, 0)
                  .toFixed(2)} PKR
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead>
                  <tr style="background-color: #e8f5e9;">
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Flavour Name</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Quantity</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${pdfSoldItemsSummary.flavourBottles
                    .map(
                      (item) => `
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 8px; border: 1px solid #ddd;">${
                        item.name
                      }</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${
                        item.quantity
                      }</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.amount.toFixed(
                        2
                      )}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
              : ""
          }

          <!-- Refills -->
          ${
            pdfSoldItemsSummary.refills.length > 0
              ? `
            <div style="margin-bottom: 25px;">
              <h3 style="color: #ff5722; margin-bottom: 15px; background: rgba(255, 87, 34, 0.1); padding: 10px; border-radius: 5px;">
                Refills - Total: ${pdfSoldItemsSummary.refills.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                )} refills, ${pdfSoldItemsSummary.refills
                  .reduce((sum, item) => sum + item.amount, 0)
                  .toFixed(2)} PKR
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead>
                  <tr style="background-color: #fbe9e7;">
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Flavour Name</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Quantity</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${pdfSoldItemsSummary.refills
                    .map(
                      (item) => `
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 8px; border: 1px solid #ddd;">${
                        item.name
                      }</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${
                        item.quantity
                      }</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.amount.toFixed(
                        2
                      )}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
              : ""
          }

        </div>

        <!-- Continue with existing PDF content... -->
        <!-- (The rest of your existing PDF content remains the same) -->
        
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
        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(74, 111, 165, 0.4);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(74, 111, 165, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(74, 111, 165, 0);
            }
          }

          @keyframes shake {
            0%,
            100% {
              transform: translateX(0);
            }
            10%,
            30%,
            50%,
            70%,
            90% {
              transform: translateX(-5px);
            }
            20%,
            40%,
            60%,
            80% {
              transform: translateX(5px);
            }
          }

          .animate-fade-in {
            animation: fadeIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)
              forwards;
          }

          .animate-pulse-once {
            animation: pulse 1.5s ease-in-out;
          }

          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }

          .auth-input {
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          .auth-input:focus {
            transform: translateY(-1px);
            box-shadow: 0 5px 15px rgba(74, 111, 165, 0.3);
          }

          .auth-button {
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          .auth-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          }

          .auth-button:active {
            transform: translateY(0);
          }
        `}</style>

        <div className="auth-box animate-fade-in" style={authBoxStyles}>
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
            className="auth-input"
            onKeyPress={(e) => {
              if (e.key === "Enter") authenticate();
            }}
          />
          <button
            onClick={authenticate}
            style={authButtonStyles}
            className="auth-button animate-pulse-once"
          >
            Access Totals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Add Global CSS for animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes glow {
          0%,
          100% {
            box-shadow: 0 0 5px rgba(74, 111, 165, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(74, 111, 165, 0.6);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)
            forwards;
        }

        .animate-slide-left {
          animation: slideInLeft 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)
            forwards;
        }

        .animate-slide-right {
          animation: slideInRight 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)
            forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)
            forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .total-card {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          opacity: 0;
          animation: fadeInUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)
            forwards;
        }

        .total-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1) !important;
        }

        .summary-card {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .summary-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
        }

        .comparison-card {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .comparison-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
        }

        .button-animate {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .button-animate:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2) !important;
        }

        .button-animate:active {
          transform: translateY(0);
        }

        .hover-shimmer {
          position: relative;
          overflow: hidden;
        }

        .hover-shimmer:hover::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          animation: shimmer 1.5s infinite;
        }

        .counting-number {
          transition: all 0.3s ease;
        }

        .empty-state-animate {
          animation: float 6s ease-in-out infinite;
        }

        /* Responsive animations */
        @media (max-width: 768px) {
          .mobile-fade-in {
            animation: fadeInUp 0.5s ease-out forwards;
          }

          .mobile-slide-up {
            animation: fadeInUp 0.4s ease-out forwards;
          }
        }
      `}</style>

      <header
        style={{
          ...headerStyles,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? "translateY(0)" : "translateY(-20px)",
          transition: "all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
        className="animate-fade-in-up"
      >
        <div style={headerContentStyles}>
          <h1 style={headerTitleStyle}>BUSINESS TOTALS - ADMIN DASHBOARD</h1>
          <p style={headerSubtitleStyle}>
            Credit sales are only counted as income when payments are received
          </p>
        </div>
      </header>

      <div id="totals-content">
        {/* Updated Totals Grid with counting animations */}
        <div style={totalsGridStyles}>
          {/* Cash Sales */}
          <div
            style={{
              ...totalItemStyles,
              borderTop: "4px solid #28a745",
              animationDelay: "0.1s",
            }}
            className="total-card hover-shimmer"
          >
            <h3>Cash Sales</h3>
            <div style={valueStyles} className="counting-number">
              {countingValues.cash.toFixed(2)} PKR
            </div>
            <small style={smallTextStyles}>
              {cashSales.length} immediate sales
            </small>
          </div>

          {/* JazzCash Sales */}
          <div
            style={{
              ...totalItemStyles,
              borderTop: "4px solid #17a2b8",
              animationDelay: "0.2s",
            }}
            className="total-card hover-shimmer"
          >
            <h3>JazzCash Sales</h3>
            <div
              style={{ ...valueStyles, color: "#17a2b8" }}
              className="counting-number"
            >
              {countingValues.jazzCash.toFixed(2)} PKR
            </div>
            <small style={smallTextStyles}>
              {jazzCashSales.length} JazzCash sales
            </small>
          </div>

          {/* Credit Card Sales */}
          <div
            style={{
              ...totalItemStyles,
              borderTop: "4px solid #6f42c1",
              animationDelay: "0.3s",
            }}
            className="total-card hover-shimmer"
          >
            <h3>Credit Card Sales</h3>
            <div
              style={{ ...valueStyles, color: "#6f42c1" }}
              className="counting-number"
            >
              {countingValues.creditCard.toFixed(2)} PKR
            </div>
            <small style={smallTextStyles}>
              {creditCardSales.length} card sales
            </small>
          </div>

          {/* Credit Sales */}
          <div
            style={{
              ...totalItemStyles,
              borderTop: "4px solid #ffc107",
              animationDelay: "0.4s",
            }}
            className="total-card hover-shimmer"
          >
            <h3>Credit Sales (Pending)</h3>
            <div
              style={{ ...valueStyles, color: "#ffc107" }}
              className="counting-number"
            >
              {countingValues.credit.toFixed(2)} PKR
            </div>
            <small style={smallTextStyles}>
              {creditSales.length} credit sales
            </small>
          </div>

          {/* Backend Refill Revenue */}
          <div
            style={{
              ...totalItemStyles,
              borderTop: "4px solid #4CAF50",
              animationDelay: "0.5s",
            }}
            className="total-card hover-shimmer"
          >
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
          <div
            style={{
              ...totalItemStyles,
              borderTop: "4px solid #FF9800",
              animationDelay: "0.6s",
            }}
            className="total-card hover-shimmer"
          >
            <h3>Backend Coil Revenue</h3>
            <div style={{ ...valueStyles, color: "#FF9800" }}>
              {totalBackendCoilRevenue.toFixed(2)} PKR
            </div>
            <small style={smallTextStyles}>
              {coilSales.length} coils × 600 PKR
            </small>
            <div style={backendNoteStyle}>
              Frontend: {totalCoilRevenue.toFixed(2)} PKR
            </div>
          </div>

          {/* Expenses */}
          <div
            style={{
              ...totalItemStyles,
              borderTop: "4px solid #dc3545",
              animationDelay: "0.7s",
            }}
            className="total-card hover-shimmer"
          >
            <h3>Total Expenses</h3>
            <div style={valueStyles} className="counting-number">
              {countingValues.expenses.toFixed(2)} PKR
            </div>
          </div>

          {/* Amount Owed */}
          <div
            style={{
              ...totalItemStyles,
              borderTop: "4px solid #9c27b0",
              animationDelay: "0.8s",
            }}
            className="total-card hover-shimmer"
          >
            <h3>Amount Owed</h3>
            <div style={valueStyles} className="counting-number">
              {countingValues.owed.toFixed(2)} PKR
            </div>
            <small style={smallTextStyles}>{creditors.length} creditors</small>
          </div>

          {/* Payments Received */}
          <div
            style={{
              ...totalItemStyles,
              borderTop: "4px solid #20c997",
              animationDelay: "0.9s",
            }}
            className="total-card hover-shimmer"
          >
            <h3>Payments Received</h3>
            <div style={valueStyles} className="counting-number">
              {countingValues.received.toFixed(2)} PKR
            </div>
            <small style={smallTextStyles}>From credit sales</small>
          </div>

          {/* Net Amount */}
          <div
            style={{
              ...totalItemStyles,
              backgroundColor: countingValues.net >= 0 ? "#e8f5e8" : "#ffeaea",
              borderTop:
                countingValues.net >= 0
                  ? "4px solid #28a745"
                  : "4px solid #dc3545",
              animationDelay: "1s",
            }}
            className="total-card animate-glow"
          >
            <h3>Net Amount</h3>
            <div
              style={{
                ...valueStyles,
                color: countingValues.net >= 0 ? "#28a745" : "#dc3545",
              }}
              className="counting-number"
            >
              {countingValues.net.toFixed(2)} PKR
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
              animationDelay: "1.1s",
            }}
            className="total-card hover-shimmer"
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

        {/* NEW: Sold Items Summary Section */}
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyle}>Sold Items Summary</h2>

          {/* Coils */}
          {soldItemsSummary.coils.length > 0 && (
            <div style={categorySectionStyles}>
              <h3 style={{ ...categoryTitleStyles, color: "#ff9800" }}>
                Coils Sold ({categoryTotals.coils.totalQuantity} items) - Total:{" "}
                {categoryTotals.coils.totalAmount.toFixed(2)} PKR
              </h3>
              <div style={itemsGridStyles}>
                {soldItemsSummary.coils.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      ...itemCardStyles,
                      borderTop: "3px solid #ff9800",
                    }}
                    className="summary-card"
                  >
                    <h4 style={{ margin: "0 0 10px 0", color: "#ff9800" }}>
                      {item.name}
                    </h4>
                    <div style={itemDetailsStyles}>
                      <div>
                        Quantity: <strong>{item.quantity}</strong>
                      </div>
                      <div>
                        Amount: <strong>{item.amount.toFixed(2)} PKR</strong>
                      </div>
                      <div>
                        Avg Price:{" "}
                        <strong>
                          {(item.amount / item.quantity).toFixed(2)} PKR
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Devices */}
          {soldItemsSummary.devices.length > 0 && (
            <div style={categorySectionStyles}>
              <h3 style={{ ...categoryTitleStyles, color: "#2196f3" }}>
                Devices Sold ({categoryTotals.devices.totalQuantity} items) -
                Total: {categoryTotals.devices.totalAmount.toFixed(2)} PKR
              </h3>
              <div style={itemsGridStyles}>
                {soldItemsSummary.devices.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      ...itemCardStyles,
                      borderTop: "3px solid #2196f3",
                    }}
                    className="summary-card"
                  >
                    <h4 style={{ margin: "0 0 10px 0", color: "#2196f3" }}>
                      {item.name}
                    </h4>
                    <div style={itemDetailsStyles}>
                      <div>
                        Quantity: <strong>{item.quantity}</strong>
                      </div>
                      <div>
                        Amount: <strong>{item.amount.toFixed(2)} PKR</strong>
                      </div>
                      <div>
                        Avg Price:{" "}
                        <strong>
                          {(item.amount / item.quantity).toFixed(2)} PKR
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repairs */}
          {soldItemsSummary.repairs.length > 0 && (
            <div style={categorySectionStyles}>
              <h3 style={{ ...categoryTitleStyles, color: "#9c27b0" }}>
                Repairs ({categoryTotals.repairs.totalQuantity} services) -
                Total: {categoryTotals.repairs.totalAmount.toFixed(2)} PKR
              </h3>
              <div style={itemsGridStyles}>
                {soldItemsSummary.repairs.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      ...itemCardStyles,
                      borderTop: "3px solid #9c27b0",
                    }}
                    className="summary-card"
                  >
                    <h4 style={{ margin: "0 0 10px 0", color: "#9c27b0" }}>
                      {item.name}
                    </h4>
                    <div style={itemDetailsStyles}>
                      <div>
                        Quantity: <strong>{item.quantity}</strong>
                      </div>
                      <div>
                        Amount: <strong>{item.amount.toFixed(2)} PKR</strong>
                      </div>
                      <div>
                        Avg Price:{" "}
                        <strong>
                          {(item.amount / item.quantity).toFixed(2)} PKR
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Puffs */}
          {soldItemsSummary.puffs.length > 0 && (
            <div style={categorySectionStyles}>
              <h3 style={{ ...categoryTitleStyles, color: "#e91e63" }}>
                Puffs Sold ({categoryTotals.puffs.totalQuantity} items) - Total:{" "}
                {categoryTotals.puffs.totalAmount.toFixed(2)} PKR
              </h3>
              <div style={itemsGridStyles}>
                {soldItemsSummary.puffs.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      ...itemCardStyles,
                      borderTop: "3px solid #e91e63",
                    }}
                    className="summary-card"
                  >
                    <h4 style={{ margin: "0 0 10px 0", color: "#e91e63" }}>
                      {item.name}
                    </h4>
                    <div style={itemDetailsStyles}>
                      <div>
                        Quantity: <strong>{item.quantity}</strong>
                      </div>
                      <div>
                        Amount: <strong>{item.amount.toFixed(2)} PKR</strong>
                      </div>
                      <div>
                        Avg Price:{" "}
                        <strong>
                          {(item.amount / item.quantity).toFixed(2)} PKR
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flavour Bottles */}
          {soldItemsSummary.flavourBottles.length > 0 && (
            <div style={categorySectionStyles}>
              <h3 style={{ ...categoryTitleStyles, color: "#4caf50" }}>
                Flavour Bottles ({categoryTotals.flavourBottles.totalQuantity}{" "}
                bottles) - Total:{" "}
                {categoryTotals.flavourBottles.totalAmount.toFixed(2)} PKR
              </h3>
              <div style={itemsGridStyles}>
                {soldItemsSummary.flavourBottles.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      ...itemCardStyles,
                      borderTop: "3px solid #4caf50",
                    }}
                    className="summary-card"
                  >
                    <h4 style={{ margin: "0 0 10px 0", color: "#4caf50" }}>
                      {item.name}
                    </h4>
                    <div style={itemDetailsStyles}>
                      <div>
                        Quantity: <strong>{item.quantity}</strong>
                      </div>
                      <div>
                        Amount: <strong>{item.amount.toFixed(2)} PKR</strong>
                      </div>
                      <div>
                        Avg Price:{" "}
                        <strong>
                          {(item.amount / item.quantity).toFixed(2)} PKR
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refills */}
          {soldItemsSummary.refills.length > 0 && (
            <div style={categorySectionStyles}>
              <h3 style={{ ...categoryTitleStyles, color: "#ff5722" }}>
                Refills ({categoryTotals.refills.totalQuantity} refills) -
                Total: {categoryTotals.refills.totalAmount.toFixed(2)} PKR
              </h3>
              <div style={itemsGridStyles}>
                {soldItemsSummary.refills.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      ...itemCardStyles,
                      borderTop: "3px solid #ff5722",
                    }}
                    className="summary-card"
                  >
                    <h4 style={{ margin: "0 0 10px 0", color: "#ff5722" }}>
                      {item.name}
                    </h4>
                    <div style={itemDetailsStyles}>
                      <div>
                        Quantity: <strong>{item.quantity}</strong>
                      </div>
                      <div>
                        Amount: <strong>{item.amount.toFixed(2)} PKR</strong>
                      </div>
                      <div>
                        Avg Price:{" "}
                        <strong>
                          {(item.amount / item.quantity).toFixed(2)} PKR
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyle}>Financial Summary</h2>
          <div style={summaryGridStyles}>
            <div
              style={{ ...summaryItemStyles, animationDelay: "0.1s" }}
              className="summary-card animate-slide-left"
            >
              <h4>Total Potential Revenue</h4>
              <div style={summaryValueStyles}>
                {(
                  countingValues.cash +
                  countingValues.jazzCash +
                  countingValues.creditCard +
                  countingValues.credit
                ).toFixed(2)}{" "}
                PKR
              </div>
            </div>
            <div
              style={{ ...summaryItemStyles, animationDelay: "0.2s" }}
              className="summary-card animate-slide-left"
            >
              <h4>Collected Revenue</h4>
              <div style={summaryValueStyles}>
                {(
                  countingValues.cash +
                  countingValues.jazzCash +
                  countingValues.creditCard +
                  countingValues.received
                ).toFixed(2)}{" "}
                PKR
              </div>
            </div>
            <div
              style={{ ...summaryItemStyles, animationDelay: "0.2s" }}
              className="summary-card animate-slide-right"
            >
              <h4>Collection Rate</h4>
              <div style={summaryValueStyles}>
                {countingValues.credit > 0
                  ? (
                      (countingValues.received / countingValues.credit) *
                      100
                    ).toFixed(1) + "%"
                  : "100%"}
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div style={{ marginTop: "30px" }}>
            <h3 style={subsectionTitleStyle}>Payment Method Breakdown</h3>
            <div style={paymentBreakdownStyles}>
              <div
                style={{ ...paymentMethodItemStyles, animationDelay: "0.1s" }}
                className="animate-fade-in-up"
              >
                <span>Cash:</span>
                <span>{countingValues.cash.toFixed(2)} PKR</span>
              </div>
              <div
                style={{ ...paymentMethodItemStyles, animationDelay: "0.2s" }}
                className="animate-fade-in-up"
              >
                <span>JazzCash:</span>
                <span>{countingValues.jazzCash.toFixed(2)} PKR</span>
              </div>
              <div
                style={{ ...paymentMethodItemStyles, animationDelay: "0.3s" }}
                className="animate-fade-in-up"
              >
                <span>Credit Card:</span>
                <span>{countingValues.creditCard.toFixed(2)} PKR</span>
              </div>
              <div
                style={{
                  ...paymentMethodItemStyles,
                  borderTop: "2px solid #eee",
                  paddingTop: "15px",
                  fontWeight: "bold",
                  animationDelay: "0.4s",
                }}
                className="animate-fade-in-up"
              >
                <span>Total Immediate Payments:</span>
                <span>
                  {(
                    countingValues.cash +
                    countingValues.jazzCash +
                    countingValues.creditCard
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
            <div
              style={{ ...comparisonItemStyles, animationDelay: "0.1s" }}
              className="comparison-card animate-scale-in"
            >
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
              <div
                style={{
                  marginTop: "10px",
                  padding: "5px 10px",
                  backgroundColor: "rgba(76, 175, 80, 0.1)",
                  borderRadius: "5px",
                  fontSize: "0.9rem",
                  color: "#4CAF50",
                }}
              >
                Quantity: {totalRefillQuantity} refills
              </div>
            </div>
            <div
              style={{ ...comparisonItemStyles, animationDelay: "0.2s" }}
              className="comparison-card animate-scale-in"
            >
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
              <div
                style={{
                  marginTop: "10px",
                  padding: "5px 10px",
                  backgroundColor: "rgba(255, 152, 0, 0.1)",
                  borderRadius: "5px",
                  fontSize: "0.9rem",
                  color: "#FF9800",
                }}
              >
                Quantity: {totalCoilQuantity} coils
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={buttonContainerStyles}>
          <button
            onClick={downloadPDF}
            style={pdfButtonStyles}
            className="button-animate hover-shimmer animate-pulse-once"
          >
            Download PDF Report
          </button>
          <Link
            href="/totals/reports"
            style={reportsButtonStyles}
            className="button-animate hover-shimmer"
          >
            View Complete Reports
          </Link>
        </div>
      </div>
    </div>
  );
}

// ==================== NEW STYLES ====================

const categorySectionStyles: React.CSSProperties = {
  marginBottom: "30px",
};

const categoryTitleStyles: React.CSSProperties = {
  fontSize: "1.25rem",
  marginBottom: "15px",
  paddingBottom: "10px",
  borderBottom: "2px solid #eee",
  fontWeight: "600",
};

const itemsGridStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "15px",
  marginTop: "15px",
};

const itemCardStyles: React.CSSProperties = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
};

const itemDetailsStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  fontSize: "0.9rem",
  color: "#666",
};

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
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.08)",
  opacity: 0,
  animation: "scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
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
  borderRadius: "12px",
  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
  textAlign: "center",
  maxWidth: "400px",
  width: "100%",
  opacity: 0,
  animation: "fadeIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
};

const inputStyles: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  margin: "15px 0",
  border: "2px solid #e1e5e9",
  borderRadius: "10px",
  fontSize: "1rem",
  boxSizing: "border-box" as const,
};

const authButtonStyles: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  backgroundColor: "#4a6fa5",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "1rem",
  fontWeight: "600",
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
  padding: "25px 0",
  marginBottom: "30px",
  background: "linear-gradient(135deg, #6c757d, #495057)",
  color: "white",
  borderRadius: "12px",
  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
  position: "relative",
  overflow: "hidden",
};

const headerContentStyles: React.CSSProperties = {
  position: "relative",
  padding: "0 20px",
  zIndex: 1,
};

const headerTitleStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "1.8rem",
  fontWeight: "700",
  letterSpacing: "0.5px",
};

const headerSubtitleStyle: React.CSSProperties = {
  marginTop: "10px",
  opacity: 0.9,
  fontSize: "1rem",
  fontWeight: "400",
};

// Button Styles
const pdfButtonStyles: React.CSSProperties = {
  padding: "12px 24px",
  backgroundColor: "#dc3545",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "1rem",
  fontWeight: "600",
  boxShadow: "0 4px 15px rgba(220, 53, 69, 0.3)",
};

const reportsButtonStyles: React.CSSProperties = {
  padding: "12px 24px",
  backgroundColor: "#17a2b8",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "1rem",
  textDecoration: "none",
  fontWeight: "600",
  boxShadow: "0 4px 15px rgba(23, 162, 184, 0.3)",
  display: "inline-block",
  textAlign: "center",
};

const buttonContainerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "20px",
  marginTop: "40px",
  marginBottom: "40px",
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
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.08)",
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
};

const valueStyles: React.CSSProperties = {
  fontSize: "1.8rem",
  fontWeight: "700",
  color: "#4a6fa5",
  marginTop: "10px",
  marginBottom: "5px",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

const smallTextStyles: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#6c757d",
  marginTop: "5px",
  display: "block",
};

const sectionStyles: React.CSSProperties = {
  marginBottom: "40px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  marginBottom: "20px",
  color: "#4a6fa5",
  fontWeight: "700",
  borderBottom: "2px solid #4a6fa5",
  paddingBottom: "10px",
};

const subsectionTitleStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  marginBottom: "15px",
  color: "#4a6fa5",
  fontWeight: "600",
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
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.08)",
  textAlign: "center",
  borderTop: "4px solid #17a2b8",
  opacity: 0,
  animation: "fadeInUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
};

const summaryValueStyles: React.CSSProperties = {
  fontSize: "1.4rem",
  fontWeight: "700",
  color: "#17a2b8",
  marginTop: "10px",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

// Payment Breakdown Styles
const paymentBreakdownStyles: React.CSSProperties = {
  backgroundColor: "white",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.08)",
};

const paymentMethodItemStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "12px 0",
  borderBottom: "1px solid #eee",
  opacity: 0,
  animation: "fadeInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
};
