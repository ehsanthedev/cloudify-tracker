'use client'
import { useState, useEffect } from 'react'
import { getAllData, clearAllData, Sale, Expense, Creditor, Payment, clearAllDataExceptCreditors } from '../../../../lib/storage'
import Link from 'next/link'
import Modal, { ModalProps } from '../../../components/Modal'

export default function ReportsPage() {
  const [data, setData] = useState<{
    sales: Sale[];
    expenses: Expense[];
    creditors: Creditor[];
    payments: Payment[];
  }>({
    sales: [],
    expenses: [],
    creditors: [],
    payments: []
  })
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [password, setPassword] = useState<string>('')
  const [modal, setModal] = useState<Omit<ModalProps, 'onClose' | 'onConfirm'> & { 
    isOpen: boolean; 
    onConfirm?: () => void 
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  })

  useEffect(() => {
    if (isAuthenticated) {
      const allData = getAllData()
      setData(allData)
    }
  }, [isAuthenticated])

  const showModal = (config: Omit<ModalProps, 'onClose' | 'onConfirm'> & { onConfirm?: () => void }) => {
    setModal({ ...config, isOpen: true })
  }

  const hideModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }

  const authenticate = (): void => {
    // Use the same password as your TotalsPage for consistency
    if (password === 'Ehsan@7890') {
      setIsAuthenticated(true)
    } else {
      showModal({
        isOpen: true,
        title: 'Authentication Failed',
        message: 'Incorrect password. Please try again.',
        type: 'error'
      })
    }
  }

  // Replace the existing handleDeleteAllDataExceptCreditors function in totals/reports/page.tsx
const handleDeleteAllDataExceptCreditors = (): void => {
  showModal({
    isOpen: true,
    title: 'Delete All Data (Except Creditors)',
    message: 'Are you sure you want to delete ALL data except creditors? This will remove all sales, expenses, and payments permanently but keep creditors intact.',
    type: 'confirm',
    confirmText: 'Delete All',
    cancelText: 'Cancel',
    onConfirm: () => {
      // Use the new function that preserves creditors
      clearAllDataExceptCreditors();
      
      // Update state - keep creditors, clear everything else
      const currentCreditors = data.creditors; // Preserve current creditors
      setData({
        sales: [],
        expenses: [],
        creditors: currentCreditors, // Keep creditors
        payments: []
      })
      
      showModal({
        isOpen: true,
        title: 'Success!',
        message: 'All data except creditors has been permanently deleted.',
        type: 'success'
      })
    }
  })
}

  if (!isAuthenticated) {
    return (
      <div style={authContainerStyles}>
        {/* Modal Component */}
        <Modal
          isOpen={modal.isOpen}
          onClose={hideModal}
          onConfirm={modal.onConfirm}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
        />

        <div style={authBoxStyles}>
          <h2>Admin Access Required</h2>
          <p>Please enter the admin password to view reports:</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={inputStyles}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                authenticate()
              }
            }}
          />
          <button onClick={authenticate} style={authButtonStyles}>
            Access Reports
          </button>
          <div style={{ marginTop: '15px' }}>
            <Link href="/totals" style={backLinkStyles}>
              ← Back to Totals
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyles}>
      {/* Modal Component */}
      <Modal
        isOpen={modal.isOpen}
        onClose={hideModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
      />

      <header style={headerStyles}>
        <div style={headerContentStyles}>
          <h1 style={headerTitleStyle}>COMPLETE BUSINESS REPORTS</h1>
          <p style={headerSubtitleStyle}>
            Includes all historical data including deleted entries
          </p>
          <div style={headerButtonsStyle}>
            <button onClick={handleDeleteAllDataExceptCreditors} style={dangerButtonStyles}>
              Delete All Data (Keep Creditors)
            </button>
            <Link href="/totals" style={backButtonStyles}>
              Back to Totals
            </Link>
          </div>
        </div>
      </header>

      <div style={contentStyles}>
        {/* Sales Section */}
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyle}>Sales Report - All Entries ({data.sales.length})</h2>
          <div style={tableContainerStyles}>
            <table style={tableStyles}>
              <thead>
                <tr>
                  <th style={tableHeaderStyles}>Status</th>
                  <th style={tableHeaderStyles}>Date & Time</th>
                  <th style={tableHeaderStyles}>Type</th>
                  <th style={tableHeaderStyles}>Item Name</th>
                  <th style={tableHeaderStyles}>Quantity</th>
                  <th style={tableHeaderStyles}>Amount</th>
                  <th style={tableHeaderStyles}>Payment Method</th>
                  <th style={tableHeaderStyles}>Sale Type</th>
                </tr>
              </thead>
              <tbody>
                {data.sales.slice().reverse().map((sale, index) => (
                  <tr key={index} style={sale.deleted ? deletedRowStyle : {}}>
                    <td style={tableCellStyles}>
                      {sale.deleted ? (
                        <span style={deletedBadgeStyle}>❌ DELETED</span>
                      ) : (
                        <span style={activeBadgeStyle}>✅ ACTIVE</span>
                      )}
                    </td>
                    <td style={tableCellStyles}>
                      {new Date(sale.timestamp).toLocaleString()}
                      {sale.deleted && sale.deletedAt && (
                        <div style={deletedInfoStyle}>
                          🗑️ Deleted: {new Date(sale.deletedAt).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td style={tableCellStyles}>{sale.type}</td>
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
                {data.sales.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{...tableCellStyles, textAlign: 'center'}}>
                      No sales records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Section */}
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyle}>Expenses Report ({data.expenses.length})</h2>
          <div style={tableContainerStyles}>
            <table style={tableStyles}>
              <thead>
                <tr>
                  <th style={tableHeaderStyles}>Date</th>
                  <th style={tableHeaderStyles}>Description</th>
                  <th style={tableHeaderStyles}>Category</th>
                  <th style={tableHeaderStyles}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.slice().reverse().map((expense, index) => (
                  <tr key={index}>
                    <td style={tableCellStyles}>
                      {new Date(expense.timestamp).toLocaleDateString()}
                    </td>
                    <td style={tableCellStyles}>{expense.description}</td>
                    <td style={tableCellStyles}>{expense.category}</td>
                    <td style={tableCellStyles}>{expense.amount.toFixed(2)} PKR</td>
                  </tr>
                ))}
                {data.expenses.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{...tableCellStyles, textAlign: 'center'}}>
                      No expenses records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Creditors Section */}
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyle}>Creditors Report ({data.creditors.length})</h2>
          <div style={tableContainerStyles}>
            <table style={tableStyles}>
              <thead>
                <tr>
                  <th style={tableHeaderStyles}>Customer Name</th>
                  <th style={tableHeaderStyles}>Phone</th>
                  <th style={tableHeaderStyles}>Amount Owed</th>
                  <th style={tableHeaderStyles}>Purchases Count</th>
                </tr>
              </thead>
              <tbody>
                {data.creditors.map((creditor, index) => (
                  <tr key={index}>
                    <td style={tableCellStyles}>{creditor.name}</td>
                    <td style={tableCellStyles}>{creditor.phone}</td>
                    <td style={tableCellStyles}>{creditor.amountOwed.toFixed(2)} PKR</td>
                    <td style={tableCellStyles}>{creditor.purchases.length}</td>
                  </tr>
                ))}
                {data.creditors.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{...tableCellStyles, textAlign: 'center'}}>
                      No creditors records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments Section */}
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyle}>Payments Report ({data.payments.length})</h2>
          <div style={tableContainerStyles}>
            <table style={tableStyles}>
              <thead>
                <tr>
                  <th style={tableHeaderStyles}>Date</th>
                  <th style={tableHeaderStyles}>Customer</th>
                  <th style={tableHeaderStyles}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.slice().reverse().map((payment, index) => (
                  <tr key={index}>
                    <td style={tableCellStyles}>
                      {new Date(payment.timestamp).toLocaleDateString()}
                    </td>
                    <td style={tableCellStyles}>{payment.creditorName}</td>
                    <td style={tableCellStyles}>{payment.amount.toFixed(2)} PKR</td>
                  </tr>
                ))}
                {data.payments.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{...tableCellStyles, textAlign: 'center'}}>
                      No payments records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


// Styles (keep all your existing styles the same)
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

const backLinkStyles: React.CSSProperties = {
  color: '#4a6fa5',
  textDecoration: 'none',
  fontSize: '0.9rem'
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
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
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

const headerButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '15px',
  justifyContent: 'center',
  marginTop: '20px',
  flexWrap: 'wrap'
}

const dangerButtonStyles: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem'
}

const backButtonStyles: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  textDecoration: 'none'
}

const contentStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '30px'
}

const sectionStyles: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '25px',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  marginBottom: '20px',
  color: '#4a6fa5',
  borderBottom: '2px solid #4a6fa5',
  paddingBottom: '10px'
}

const tableContainerStyles: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: '8px',
  border: '1px solid #ddd'
}

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '800px'
}

const tableHeaderStyles: React.CSSProperties = {
  backgroundColor: '#4a6fa5',
  color: 'white',
  padding: '15px',
  textAlign: 'left',
  fontWeight: '600',
  fontSize: '0.9rem'
}

const tableCellStyles: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
  fontSize: '0.9rem',
  borderBottom: '1px solid #eee'
}

const deletedRowStyle: React.CSSProperties = {
  backgroundColor: '#ffebee'
}

const deletedBadgeStyle: React.CSSProperties = {
  backgroundColor: '#dc3545',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: 'bold'
}

const activeBadgeStyle: React.CSSProperties = {
  backgroundColor: '#28a745',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: 'bold'
}

const deletedInfoStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#dc3545',
  marginTop: '5px'
}

const typeBadgeStyles: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: '600'
}