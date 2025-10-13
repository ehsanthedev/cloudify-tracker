'use client'
import { useState, useEffect, ChangeEvent } from 'react'
import { getExpenses, saveExpenses, Expense } from '../../../lib/storage'
import Modal, { ModalProps } from '../../components/Modal'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [description, setDescription] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [category, setCategory] = useState<string>('supplies')
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
    const savedExpenses = getExpenses()
    setExpenses(savedExpenses)
  }, [])

  const showModal = (config: Omit<ModalProps, 'onClose' | 'onConfirm'> & { onConfirm?: () => void }) => {
    setModal({ ...config, isOpen: true })
  }

  const hideModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }

  const addExpense = (): void => {
    if (!description || !amount) {
      showModal({
        title: 'Validation Error',
        message: 'Please fill all required fields.',
        type: 'error',
        isOpen: true // Fixed: was false
      })
      return
    }

    const expenseAmount = parseFloat(amount)
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      showModal({
        title: 'Invalid Amount',
        message: 'Please enter a valid amount.',
        type: 'error',
        isOpen: true // Fixed: was false
      })
      return
    }

    const newExpense: Expense = {
      description,
      amount: expenseAmount,
      category,
      timestamp: new Date().toISOString()
    }

    const updatedExpenses = [...expenses, newExpense]
    setExpenses(updatedExpenses)
    saveExpenses(updatedExpenses)

    setDescription('')
    setAmount('')
    showModal({
      title: 'Success!',
      message: 'Expense has been added successfully.',
      type: 'success',
      isOpen: true // Fixed: was false
    })
  }

  const deleteExpense = (index: number): void => {
    showModal({
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense?',
      type: 'confirm',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isOpen: true, // Fixed: was false
      onConfirm: () => {
        const updatedExpenses = expenses.filter((_, i) => i !== index)
        setExpenses(updatedExpenses)
        saveExpenses(updatedExpenses) // Added: Save to localStorage
        showModal({
          title: 'Success!',
          message: 'Expense has been deleted successfully.',
          type: 'success',
          isOpen: true // Fixed: was false
        })
      }
    })
  }

  const deleteAllExpenses = (): void => {
    if (expenses.length === 0) {
      showModal({
        title: 'No Expenses',
        message: 'No expenses to delete.',
        type: 'alert',
        isOpen: true // Fixed: was false
      })
      return
    }

    showModal({
      title: 'Delete All Expenses',
      message: 'Are you sure you want to delete ALL expenses? This action cannot be undone.',
      type: 'confirm',
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      isOpen: true, // Fixed: was false
      onConfirm: () => {
        setExpenses([])
        saveExpenses([])
        showModal({
          title: 'Success!',
          message: 'All expenses have been deleted successfully.',
          type: 'success',
          isOpen: true // Fixed: was false
        })
      }
    })
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

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
        <h1>DAILY EXPENSE TRACKER</h1>
      </header>

      <div style={formGridStyles}>
        <div style={formGroupStyles}>
          <label style={labelStyle}>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            placeholder="Expense description"
            style={inputStyles}
          />
        </div>

        <div style={formGroupStyles}>
          <label style={labelStyle}>Amount (PKR)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
            placeholder="Enter amount"
            style={inputStyles}
          />
        </div>

        <div style={formGroupStyles}>
          <label style={labelStyle}>Category</label>
          <select 
            value={category} 
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
            style={inputStyles}
          >
            <option value="supplies">Supplies</option>
            <option value="rent">Rent</option>
            <option value="utilities">Utilities</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div style={actionButtonsStyles}>
        <button onClick={addExpense} style={successButtonStyles}>
          Add Expense
        </button>
        <button onClick={deleteAllExpenses} style={dangerButtonStyles}>
          Delete All Expenses
        </button>
      </div>

      <div style={totalStyles}>
        <h3>Total Expenses: {totalExpenses.toFixed(2)} PKR</h3>
      </div>

      <div style={cardsContainerStyles}>
        {expenses.length === 0 ? (
          <div style={emptyStateStyles}>
            <h3>No Expenses Recorded Yet</h3>
            <p>Add your first expense to get started!</p>
          </div>
        ) : (
          expenses.map((expense, index) => (
            <div key={index} style={cardStyles}>
              <h3 style={cardTitleStyle}>{expense.description}</h3>
              <p><span style={labelStyles}>Amount:</span> {expense.amount.toFixed(2)} PKR</p>
              <p><span style={labelStyles}>Category:</span> {expense.category}</p>
              <p style={timestampStyles}>
                Added: {new Date(expense.timestamp).toLocaleString()}
              </p>
              <button 
                onClick={() => deleteExpense(index)}
                style={deleteButtonStyles}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {/* Responsive CSS */}
      <style jsx global>{`
        /* Mobile First - Default styles */
        .responsive-expense-form-grid {
          grid-template-columns: 1fr !important;
        }
        
        .responsive-expense-action-buttons {
          flex-direction: column !important;
        }
        
        .responsive-expense-cards-container {
          grid-template-columns: 1fr !important;
        }

        /* Small phones (320px - 480px) */
        @media (min-width: 320px) {
          .responsive-expense-form-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* Large phones (481px - 767px) */
        @media (min-width: 481px) {
          .responsive-expense-form-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .responsive-expense-cards-container {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        /* Tablets (768px - 1023px) */
        @media (min-width: 768px) {
          .responsive-expense-form-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .responsive-expense-action-buttons {
            flex-direction: row !important;
          }
          .responsive-expense-cards-container {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        /* Small desktops (1024px - 1279px) */
        @media (min-width: 1024px) {
          .responsive-expense-form-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .responsive-expense-cards-container {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        /* Large desktops (1280px+) */
        @media (min-width: 1280px) {
          .responsive-expense-form-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .responsive-expense-cards-container {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        /* Extra large screens (1440px+) */
        @media (min-width: 1440px) {
          .responsive-expense-form-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .responsive-expense-cards-container {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}

// Converted Styles - Keeping exact same styling and spacing
const containerStyles: React.CSSProperties = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '20px'
}

const headerStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px 0',
  marginBottom: '30px',
  background: 'linear-gradient(135deg, #ff7e5f, #feb47b)',
  color: 'white',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
}

const formGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
  marginBottom: '30px',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  padding: '25px',
  borderRadius: '10px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
}

const formGroupStyles: React.CSSProperties = {
  marginBottom: '15px'
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '5px',
  fontWeight: '500'
}

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  fontSize: '1rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  boxSizing: 'border-box' as const
}

const actionButtonsStyles: React.CSSProperties = {
  display: 'flex',
  gap: '15px',
  marginBottom: '30px',
  flexDirection: 'column'
}

const successButtonStyles: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem',
  flex: 1
}

const dangerButtonStyles: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem',
  flex: 1
}

const totalStyles: React.CSSProperties = {
  padding: '20px',
  backgroundColor: 'rgba(255, 126, 95, 0.1)',
  borderRadius: '10px',
  marginBottom: '30px',
  textAlign: 'center'
}

const cardsContainerStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '25px'
}

const cardStyles: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
  position: 'relative',
  borderTop: '4px solid #ff7e5f'
}

const cardTitleStyle: React.CSSProperties = {
  margin: '0 0 15px 0',
  fontSize: '1.25rem',
  fontWeight: '600'
}

const labelStyles: React.CSSProperties = {
  fontWeight: '600',
  color: '#555'
}

const timestampStyles: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#777',
  marginTop: '15px',
  paddingTop: '10px',
  borderTop: '1px dashed #ddd'
}

const deleteButtonStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '15px',
  right: '15px',
  padding: '6px 10px',
  fontSize: '0.85rem',
  backgroundColor: 'rgba(220, 53, 69, 0.1)',
  color: '#dc3545',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
}

const emptyStateStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px',
  color: '#777',
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
  borderRadius: '10px',
  gridColumn: '1 / -1'
}

// Add responsive classes with JavaScript
if (typeof window !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    /* Mobile First - Default styles */
    .responsive-expense-form-grid {
      grid-template-columns: 1fr !important;
    }
    
    .responsive-expense-action-buttons {
      flex-direction: column !important;
    }
    
    .responsive-expense-cards-container {
      grid-template-columns: 1fr !important;
    }

    /* Small phones (320px - 480px) */
    @media (min-width: 320px) {
      .responsive-expense-form-grid {
        grid-template-columns: 1fr !important;
      }
    }

    /* Large phones (481px - 767px) */
    @media (min-width: 481px) {
      .responsive-expense-form-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      .responsive-expense-cards-container {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }

    /* Tablets (768px - 1023px) */
    @media (min-width: 768px) {
      .responsive-expense-form-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
      .responsive-expense-action-buttons {
        flex-direction: row !important;
      }
      .responsive-expense-cards-container {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }

    /* Small desktops (1024px - 1279px) */
    @media (min-width: 1024px) {
      .responsive-expense-form-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
      .responsive-expense-cards-container {
        grid-template-columns: repeat(3, 1fr) !important;
      }
    }

    /* Large desktops (1280px+) */
    @media (min-width: 1280px) {
      .responsive-expense-form-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
      .responsive-expense-cards-container {
        grid-template-columns: repeat(3, 1fr) !important;
      }
    }

    /* Extra large screens (1440px+) */
    @media (min-width: 1440px) {
      .responsive-expense-form-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
      .responsive-expense-cards-container {
        grid-template-columns: repeat(4, 1fr) !important;
      }
    }
  `
  document.head.appendChild(style)
  
  // Add classes to elements after component mounts
  setTimeout(() => {
    const formGrid = document.querySelector('[style*="gridTemplateColumns: repeat(auto-fit, minmax(250px, 1fr))"]')
    const actionButtons = document.querySelector('[style*="flex-direction: column"]')
    const cardsContainer = document.querySelector('[style*="gridTemplateColumns: repeat(auto-fit, minmax(300px, 1fr))"]')
    
    if (formGrid) formGrid.classList.add('responsive-expense-form-grid')
    if (actionButtons) actionButtons.classList.add('responsive-expense-action-buttons')
    if (cardsContainer) cardsContainer.classList.add('responsive-expense-cards-container')
  }, 100)
}