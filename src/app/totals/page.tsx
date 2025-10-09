'use client'
import { useState, useEffect, ChangeEvent } from 'react'
import { getSales, getExpenses, getCreditors, getPayments, Sale, Expense, Creditor, Payment } from '../../../lib/storage'

export default function TotalsPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [creditors, setCreditors] = useState<Creditor[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [password, setPassword] = useState<string>('')

  useEffect(() => {
    if (isAuthenticated) {
      setSales(getSales())
      setExpenses(getExpenses())
      setCreditors(getCreditors())
      setPayments(getPayments())
    }
  }, [isAuthenticated])

  const authenticate = (): void => {
    if (password === 'admin123') {
      setIsAuthenticated(true)
    } else {
      alert('Incorrect password')
    }
  }

  // Calculate totals
  const cashSales = sales.filter(sale => !sale.isCredit)
  const creditSales = sales.filter(sale => sale.isCredit)
  
  const totalCashSales = cashSales.reduce((sum, sale) => sum + sale.amount, 0)
  const totalCreditSalesAmount = creditSales.reduce((sum, sale) => sum + sale.amount, 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalOwed = creditors.reduce((sum, creditor) => sum + creditor.amountOwed, 0)
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  
  // Net Amount = Cash Sales + Payments Received - Expenses
  const netAmount = totalCashSales + totalPayments - totalExpenses

  // Refill quantities
  interface RefillQuantities {
    [key: string]: number;
  }

  const refillQuantities: RefillQuantities = sales
    .filter(sale => sale.type === 'refill')
    .reduce((acc: RefillQuantities, sale) => {
      acc[sale.itemName] = (acc[sale.itemName] || 0) + sale.quantity
      return acc
    }, {})

  // Coils sales data
  const coilSales = sales.filter(sale => sale.type === 'coil')
  
  // Calculate coil totals by type
  interface CoilTotals {
    [key: string]: {
      quantity: number;
      amount: number;
      count: number;
    };
  }

  const coilTotals: CoilTotals = coilSales.reduce((acc: CoilTotals, sale) => {
    const coilName = sale.itemName;
    if (!acc[coilName]) {
      acc[coilName] = {
        quantity: 0,
        amount: 0,
        count: 0
      };
    }
    acc[coilName].quantity += sale.quantity;
    acc[coilName].amount += sale.amount;
    acc[coilName].count += 1;
    return acc;
  }, {})

  const totalCoilSales = coilSales.reduce((sum, sale) => sum + sale.amount, 0)
  const totalCoilQuantity = coilSales.reduce((sum, sale) => sum + sale.quantity, 0)

  // Download PDF function
  const downloadPDF = async (): Promise<void> => {
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Get all data from storage
    const allSales = getSales();
    const allExpenses = getExpenses();
    const allCreditors = getCreditors();
    const allPayments = getPayments();

    // Calculate additional totals for the comprehensive report
    const totalSales = allSales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalCashSales = allSales.filter(sale => !sale.isCredit).reduce((sum, sale) => sum + sale.amount, 0);
    const totalCreditSales = allSales.filter(sale => sale.isCredit).reduce((sum, sale) => sum + sale.amount, 0);
    const totalExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalOwed = allCreditors.reduce((sum, creditor) => sum + creditor.amountOwed, 0);
    const totalPaymentsReceived = allPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const netAmount = totalCashSales + totalPaymentsReceived - totalExpenses;

    // Create comprehensive HTML content
    const comprehensiveHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #6c757d, #495057); color: white; padding: 20px; border-radius: 10px;">
          <h1>CLOUDIFY - COMPREHENSIVE BUSINESS REPORT</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>

        <!-- Executive Summary -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4a6fa5; border-bottom: 2px solid #4a6fa5; padding-bottom: 10px;">EXECUTIVE SUMMARY</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #28a745;">Net Amount</h3>
              <p style="font-size: 1.5rem; font-weight: bold; margin: 10px 0;">${netAmount.toFixed(2)} PKR</p>
            </div>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #2196f3;">Total Sales</h3>
              <p style="font-size: 1.5rem; font-weight: bold; margin: 10px 0;">${totalSales.toFixed(2)} PKR</p>
            </div>
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #ffc107;">Credit Sales</h3>
              <p style="font-size: 1.5rem; font-weight: bold; margin: 10px 0;">${totalCreditSales.toFixed(2)} PKR</p>
            </div>
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #dc3545;">Total Expenses</h3>
              <p style="font-size: 1.5rem; font-weight: bold; margin: 10px 0;">${totalExpenses.toFixed(2)} PKR</p>
            </div>
          </div>
        </div>

        <!-- Sales Report -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4a6fa5; border-bottom: 2px solid #4a6fa5; padding-bottom: 10px;">SALES REPORT</h2>
          <p><strong>Total Sales:</strong> ${allSales.length} transactions</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #4a6fa5; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Date</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Type</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Item</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Quantity</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Amount</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Payment</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${allSales.slice().reverse().map(sale => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 10px; border: 1px solid #ddd;">${new Date(sale.timestamp).toLocaleDateString()}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${sale.type}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${sale.itemName}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${sale.quantity}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${sale.amount.toFixed(2)} PKR</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${sale.paymentMethod}</td>
                  <td style="padding: 10px; border: 1px solid #ddd; color: ${sale.isCredit ? '#ffc107' : '#28a745'}">
                    ${sale.isCredit ? 'CREDIT' : 'CASH'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Expenses Report -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4a6fa5; border-bottom: 2px solid #4a6fa5; padding-bottom: 10px;">EXPENSES REPORT</h2>
          <p><strong>Total Expenses:</strong> ${allExpenses.length} transactions</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #dc3545; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Date</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Description</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Category</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${allExpenses.slice().reverse().map(expense => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 10px; border: 1px solid #ddd;">${new Date(expense.timestamp).toLocaleDateString()}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${expense.description}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${expense.category}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${expense.amount.toFixed(2)} PKR</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Creditors Report -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4a6fa5; border-bottom: 2px solid #4a6fa5; padding-bottom: 10px;">CREDITORS REPORT</h2>
          <p><strong>Total Creditors:</strong> ${allCreditors.length} customers</p>
          <p><strong>Total Amount Owed:</strong> ${totalOwed.toFixed(2)} PKR</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #ffc107; color: black;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Customer Name</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Phone</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Amount Owed</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Purchases</th>
              </tr>
            </thead>
            <tbody>
              ${allCreditors.map(creditor => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 10px; border: 1px solid #ddd;">${creditor.name}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${creditor.phone}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${creditor.amountOwed.toFixed(2)} PKR</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${creditor.purchases.length} items</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Payments History -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4a6fa5; border-bottom: 2px solid #4a6fa5; padding-bottom: 10px;">PAYMENTS HISTORY</h2>
          <p><strong>Total Payments Received:</strong> ${allPayments.length} payments</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #28a745; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Date</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Customer</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${allPayments.slice().reverse().map(payment => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 10px; border: 1px solid #ddd;">${new Date(payment.timestamp).toLocaleDateString()}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${payment.creditorName}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${payment.amount.toFixed(2)} PKR</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Financial Summary -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px;">
          <h2 style="color: #4a6fa5; text-align: center;">FINANCIAL SUMMARY</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <div style="text-align: center;">
              <h4>Total Revenue</h4>
              <p style="font-size: 1.2rem; font-weight: bold;">${totalSales.toFixed(2)} PKR</p>
            </div>
            <div style="text-align: center;">
              <h4>Collected Revenue</h4>
              <p style="font-size: 1.2rem; font-weight: bold;">${(totalCashSales + totalPaymentsReceived).toFixed(2)} PKR</p>
            </div>
            <div style="text-align: center;">
              <h4>Pending Collection</h4>
              <p style="font-size: 1.2rem; font-weight: bold;">${(totalCreditSales - totalPaymentsReceived).toFixed(2)} PKR</p>
            </div>
            <div style="text-align: center;">
              <h4>Net Profit</h4>
              <p style="font-size: 1.2rem; font-weight: bold; color: ${netAmount >= 0 ? '#28a745' : '#dc3545'}">
                ${netAmount.toFixed(2)} PKR
              </p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #4a6fa5; color: #6c757d;">
          <p>Cloudify Business Management System - Comprehensive Report</p>
          <p>Generated automatically on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    // Create temporary element for PDF generation
    const tempElement = document.createElement('div');
    tempElement.innerHTML = comprehensiveHTML;
    document.body.appendChild(tempElement);

    const opt = {
      margin: 10,
      filename: `cloudify_comprehensive_report_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        backgroundColor: '#FFFFFF',
        useCORS: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: "portrait" as const
      },
    };

    try {
      await html2pdf().set(opt).from(tempElement).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={inputStyles}
          />
          <button onClick={authenticate} style={authButtonStyles}>
            Access Totals
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyles}>
      <header style={headerStyles}>
        <div style={headerContentStyles}>
          <h1 style={headerTitleStyle}>BUSINESS TOTALS - ADMIN DASHBOARD</h1>
          <p style={headerSubtitleStyle}>
            Credit sales are only counted as income when payments are received
          </p>
          <button onClick={downloadPDF} style={pdfButtonStyles}>
            Download PDF Report
          </button>
        </div>
      </header>

      <div id="totals-content">
        <div style={totalsGridStyles}>
          <div style={totalItemStyles}>
            <h3>Cash Sales</h3>
            <div style={valueStyles}>{totalCashSales.toFixed(2)} PKR</div>
            <small style={smallTextStyles}>
              {cashSales.length} immediate sales
            </small>
          </div>
          <div style={totalItemStyles}>
            <h3>Credit Sales (Pending)</h3>
            <div style={{...valueStyles, color: '#ffc107'}}>{totalCreditSalesAmount.toFixed(2)} PKR</div>
            <small style={smallTextStyles}>
              {creditSales.length} credit sales
            </small>
          </div>
          <div style={totalItemStyles}>
            <h3>Total Expenses</h3>
            <div style={valueStyles}>{totalExpenses.toFixed(2)} PKR</div>
          </div>
          <div style={totalItemStyles}>
            <h3>Amount Owed</h3>
            <div style={valueStyles}>{totalOwed.toFixed(2)} PKR</div>
            <small style={smallTextStyles}>
              {creditors.length} creditors
            </small>
          </div>
          <div style={totalItemStyles}>
            <h3>Payments Received</h3>
            <div style={valueStyles}>{totalPayments.toFixed(2)} PKR</div>
            <small style={smallTextStyles}>
              From credit sales
            </small>
          </div>
          <div style={{...totalItemStyles, backgroundColor: '#e8f5e8'}}>
            <h3>Net Amount</h3>
            <div style={{...valueStyles, color: netAmount >= 0 ? '#28a745' : '#dc3545'}}>
              {netAmount.toFixed(2)} PKR
            </div>
            <small style={smallTextStyles}>
              Cash Sales + Payments - Expenses
            </small>
          </div>
        </div>

        <div style={sectionStyles}>
          <h2 style={sectionTitleStyle}>Financial Summary</h2>
          <div style={summaryGridStyles}>
            <div style={summaryItemStyles}>
              <h4>Total Potential Revenue</h4>
              <div style={summaryValueStyles}>
                {(totalCashSales + totalCreditSalesAmount).toFixed(2)} PKR
              </div>
            </div>
            <div style={summaryItemStyles}>
              <h4>Collected Revenue</h4>
              <div style={summaryValueStyles}>
                {(totalCashSales + totalPayments).toFixed(2)} PKR
              </div>
            </div>
            <div style={summaryItemStyles}>
              <h4>Collection Rate</h4>
              <div style={summaryValueStyles}>
                {totalCreditSalesAmount > 0 
                  ? ((totalPayments / totalCreditSalesAmount) * 100).toFixed(1) + '%'
                  : '100%'
                }
              </div>
            </div>
          </div>
        </div>

        <div style={sectionStyles}>
          <h2 style={sectionTitleStyle}>Coils Sales Report</h2>
          <div style={coilSummaryStyles}>
            <div style={coilSummaryItemStyles}>
              <h4>Total Coils Sold</h4>
              <div style={coilSummaryValueStyles}>{totalCoilQuantity}</div>
            </div>
            <div style={coilSummaryItemStyles}>
              <h4>Total Coil Revenue</h4>
              <div style={coilSummaryValueStyles}>{totalCoilSales.toFixed(2)} PKR</div>
            </div>
            <div style={coilSummaryItemStyles}>
              <h4>Unique Coil Types</h4>
              <div style={coilSummaryValueStyles}>{Object.keys(coilTotals).length}</div>
            </div>
          </div>
          
          <div style={tableContainerStyles}>
            <div style={tableScrollContainer}>
              <table style={tableStyles}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyles}>Coil Name</th>
                    <th style={tableHeaderStyles}>Quantity Sold</th>
                    <th style={tableHeaderStyles}>Total Amount</th>
                    <th style={tableHeaderStyles}>Sales Count</th>
                    <th style={tableHeaderStyles}>Average Price</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(coilTotals).map(([coilName, data]) => (
                    <tr key={coilName} style={tableRowStyles}>
                      <td style={tableCellStyles}>{coilName}</td>
                      <td style={tableCellStyles}>{data.quantity}</td>
                      <td style={tableCellStyles}>{data.amount.toFixed(2)} PKR</td>
                      <td style={tableCellStyles}>{data.count}</td>
                      <td style={tableCellStyles}>{(data.amount / data.count).toFixed(2)} PKR</td>
                    </tr>
                  ))}
                  {Object.keys(coilTotals).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{...tableCellStyles, textAlign: 'center'}}>
                        No coil sales recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Coil Sales Table */}
          <div style={{marginTop: '30px'}}>
            <h3 style={subsectionTitleStyle}>Detailed Coil Sales</h3>
            <div style={tableContainerStyles}>
              <div style={tableScrollContainer}>
                <table style={tableStyles}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyles}>Date & Time</th>
                      <th style={tableHeaderStyles}>Coil Name</th>
                      <th style={tableHeaderStyles}>Quantity</th>
                      <th style={tableHeaderStyles}>Amount</th>
                      <th style={tableHeaderStyles}>Payment Method</th>
                      <th style={tableHeaderStyles}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coilSales.slice().reverse().map((sale, index) => (
                      <tr key={index} style={tableRowStyles}>
                        <td style={tableCellStyles}>
                          {new Date(sale.timestamp).toLocaleString()}
                        </td>
                        <td style={tableCellStyles}>{sale.itemName}</td>
                        <td style={tableCellStyles}>{sale.quantity}</td>
                        <td style={tableCellStyles}>{sale.amount.toFixed(2)} PKR</td>
                        <td style={tableCellStyles}>{sale.paymentMethod}</td>
                        <td style={tableCellStyles}>
                          <span style={{
                            ...typeBadgeStyles,
                            backgroundColor: sale.isCredit ? '#ffc107' : '#28a745',
                            color: sale.isCredit ? '#000' : '#fff'
                          }}>
                            {sale.isCredit ? 'Credit' : 'Cash'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {coilSales.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{...tableCellStyles, textAlign: 'center'}}>
                          No coil sales recorded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div style={sectionStyles}>
          <h2 style={sectionTitleStyle}>Refill Quantities</h2>
          <div style={refillTotalsStyles}>
            <div style={refillItemStyles}>
              <h3>Pineapple Series</h3>
              <div style={refillValueStyles}>
                {refillQuantities['Pineapple Series']?.toFixed(2) || '0'}
              </div>
            </div>
            <div style={refillItemStyles}>
              <h3>UK Salt</h3>
              <div style={refillValueStyles}>
                {refillQuantities['UK Salt']?.toFixed(2) || '0'}
              </div>
            </div>
            <div style={refillItemStyles}>
              <h3>Simple Tokyo</h3>
              <div style={refillValueStyles}>
                {refillQuantities['Simple Tokyo']?.toFixed(2) || '0'}
              </div>
            </div>
          </div>
        </div>

        <div style={sectionStyles}>
          <h2 style={sectionTitleStyle}>Sales by Type</h2>
          <div style={salesBreakdownStyles}>
            <div style={breakdownItemStyles}>
              <span>Refills:</span>
              <span>
                {sales.filter(s => s.type === 'refill').length} sales
              </span>
            </div>
            <div style={breakdownItemStyles}>
              <span>Coils:</span>
              <span>
                {sales.filter(s => s.type === 'coil').length} sales
              </span>
            </div>
            <div style={breakdownItemStyles}>
              <span>Devices:</span>
              <span>
                {sales.filter(s => s.type === 'device').length} sales
              </span>
            </div>
            <div style={breakdownItemStyles}>
              <span>Puffs:</span>
              <span>
                {sales.filter(s => s.type === 'puff').length} sales
              </span>
            </div>
            <div style={{...breakdownItemStyles, borderTop: '2px solid #eee', paddingTop: '15px'}}>
              <span><strong>Credit Sales:</strong></span>
              <span>
                <strong>{creditSales.length} sales</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive CSS */}
      <style jsx global>{`
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
      `}</style>
    </div>
  )
}

// Converted Styles - Keeping exact same styling and spacing
const authContainerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '50vh',
  padding: '20px'
}

const authBoxStyles: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '40px',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  textAlign: 'center',
  maxWidth: '400px',
  width: '100%'
}

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  margin: '15px 0',
  border: '1px solid #ddd',
  borderRadius: '6px'
}

const authButtonStyles: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#4a6fa5',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem'
}

const containerStyles: React.CSSProperties = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '20px'
}

const headerStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px 0',
  marginBottom: '30px',
  background: 'linear-gradient(135deg, #6c757d, #495057)',
  color: 'white',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  position: 'relative'
}

const headerContentStyles: React.CSSProperties = {
  position: 'relative',
  padding: '0 20px'
}

const headerTitleStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '1.8rem'
}

const headerSubtitleStyle: React.CSSProperties = {
  marginTop: '10px',
  opacity: 0.9,
  fontSize: '1rem'
}

const pdfButtonStyles: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '20px',
  padding: '10px 20px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
}

const totalsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
  marginBottom: '40px'
}

const totalItemStyles: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
  textAlign: 'center',
  borderTop: '4px solid #4a6fa5',
  position: 'relative'
}

const valueStyles: React.CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: '700',
  color: '#4a6fa5',
  marginTop: '10px',
  marginBottom: '5px'
}

const smallTextStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#6c757d',
  marginTop: '5px'
}

const sectionStyles: React.CSSProperties = {
  marginBottom: '40px'
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  marginBottom: '20px',
  color: '#4a6fa5'
}

const subsectionTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  marginBottom: '15px',
  color: '#4a6fa5'
}

const summaryGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px',
  marginBottom: '20px'
}

const summaryItemStyles: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
  textAlign: 'center',
  borderTop: '4px solid #17a2b8'
}

const summaryValueStyles: React.CSSProperties = {
  fontSize: '1.4rem',
  fontWeight: '700',
  color: '#17a2b8',
  marginTop: '10px'
}

// Coil sales styles
const coilSummaryStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px',
  marginBottom: '30px'
}

const coilSummaryItemStyles: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
  textAlign: 'center',
  borderTop: '4px solid #ff7e5f'
}

const coilSummaryValueStyles: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: '#ff7e5f',
  marginTop: '10px'
}

const tableContainerStyles: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden',
  marginBottom: '20px'
}

const tableScrollContainer: React.CSSProperties = {
  overflowX: 'auto',
  width: '100%'
}

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '600px'
}

const tableHeaderStyles: React.CSSProperties = {
  backgroundColor: '#4a6fa5',
  color: 'white',
  padding: '15px',
  textAlign: 'left',
  fontWeight: '600',
  fontSize: '0.9rem'
}

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #eee'
}

const tableCellStyles: React.CSSProperties = {
  padding: '15px',
  textAlign: 'left',
  fontSize: '0.9rem'
}

const typeBadgeStyles: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: '600'
}

const refillTotalsStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px'
}

const refillItemStyles: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
  textAlign: 'center'
}

const refillValueStyles: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: '#ff7e5f',
  marginTop: '10px'
}

const salesBreakdownStyles: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
}

const breakdownItemStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '10px 0',
  borderBottom: '1px solid #eee'
}

// Add responsive classes with JavaScript
if (typeof window !== 'undefined') {
  const style = document.createElement('style')
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
  `
  document.head.appendChild(style)
  
  // Add classes to elements after component mounts
  setTimeout(() => {
    const totalsGrid = document.querySelector('[style*="gridTemplateColumns: repeat(auto-fit, minmax(250px, 1fr))"]')
    const summaryGrid = document.querySelector('[style*="gridTemplateColumns: repeat(auto-fit, minmax(200px, 1fr))"]')
    const coilSummary = document.querySelector('[style*="gridTemplateColumns: repeat(auto-fit, minmax(200px, 1fr))"]')
    const refillTotals = document.querySelector('[style*="gridTemplateColumns: repeat(auto-fit, minmax(200px, 1fr))"]')
    const pdfButton = document.querySelector('[style*="position: absolute"]')
    const tableContainers = document.querySelectorAll('[style*="overflow: hidden"]')
    
    if (totalsGrid) totalsGrid.classList.add('responsive-totals-grid')
    if (summaryGrid) summaryGrid.classList.add('responsive-summary-grid')
    if (coilSummary) coilSummary.classList.add('responsive-coil-summary')
    if (refillTotals) refillTotals.classList.add('responsive-refill-totals')
    if (pdfButton) pdfButton.classList.add('responsive-pdf-button')
    
    tableContainers.forEach(container => {
      const table = container.querySelector('table')
      if (table) {
        const scrollContainer = document.createElement('div')
        scrollContainer.className = 'table-scroll-container'
        table.parentNode?.insertBefore(scrollContainer, table)
        scrollContainer.appendChild(table)
      }
    })
  }, 100)
}