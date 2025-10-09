'use client'
import { useState, useEffect, ChangeEvent } from 'react'
import { getSales, saveSales, getCreditors, saveCreditors, Sale, Creditor, Purchase } from '../../lib/storage'
  import Modal, { ModalProps } from '../components/Modal'

export default function SalesTracker() {
  const [sales, setSales] = useState<Sale[]>([])
  const [type, setType] = useState<string>('refill')
  const [itemName, setItemName] = useState<string>('Pineapple Series')
  const [customItem, setCustomItem] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [isCredit, setIsCredit] = useState<boolean>(false)
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
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
    const savedSales = getSales()
    setSales(savedSales)
  }, [])

  const showModal = (config: Omit<ModalProps, 'onClose' | 'onConfirm'> & { onConfirm?: () => void }) => {
    setModal({ ...config, isOpen: true })
  }

  const hideModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }

  const updateItemField = (newType: string): void => {
    if (newType === 'device' || newType === 'puff') {
      setItemName('')
    } else {
      setItemName(newType === 'refill' ? 'Pineapple Series' : 'VMate')
    }
  }

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const newType = e.target.value
    setType(newType)
    updateItemField(newType)
  }

  const addSale = (): void => {
    const finalItemName = (type === 'device' || type === 'puff') ? customItem : itemName
    const saleQuantity = parseFloat(quantity)
    const saleAmount = parseFloat(amount)

    // Basic validation
    if (!finalItemName || isNaN(saleQuantity) || isNaN(saleAmount)) {
      showModal({
        title: 'Validation Error',
        message: 'Please fill all required fields with valid values.',
        type: 'error',
        isOpen: false
      })
      return
    }

    // Credit sale validation
    if (isCredit && (!customerName.trim() || !customerPhone.trim())) {
      showModal({
        title: 'Credit Sale Required',
        message: 'For credit sales, both customer name and phone number are required.',
        type: 'error',
        isOpen: false
      })
      return
    }

    const newSale: Sale = {
      type,
      itemName: finalItemName,
      quantity: saleQuantity,
      amount: saleAmount,
      paymentMethod,
      timestamp: new Date().toISOString(),
      isCredit,
      customerName: isCredit ? customerName.trim() : '',
      customerPhone: isCredit ? customerPhone.trim() : '',
      isPaid: !isCredit // Cash sales are immediately paid
    }

    // If it's a credit sale, add to creditors
    if (isCredit && customerName && customerPhone) {
      const creditors: Creditor[] = getCreditors()
      const existingCreditor = creditors.find(
        (c: Creditor) => c.phone === customerPhone.trim()
      )

      const newPurchase: Purchase = {
        itemName: finalItemName,
        quantity: saleQuantity,
        amount: saleAmount,
        date: new Date().toISOString()
      }

      if (existingCreditor) {
        existingCreditor.amountOwed += saleAmount
        existingCreditor.purchases.push(newPurchase)
      } else {
        creditors.push({
          name: customerName.trim(),
          phone: customerPhone.trim(),
          amountOwed: saleAmount,
          purchases: [newPurchase]
        })
      }
      saveCreditors(creditors)
    }

    const updatedSales = [...sales, newSale]
    setSales(updatedSales)
    saveSales(updatedSales)

    // Reset form
    setQuantity('')
    setAmount('')
    setCustomItem('')
    setIsCredit(false)
    setCustomerName('')
    setCustomerPhone('')
    showModal({
      title: 'Success!',
      message: 'Sale has been added successfully.',
      type: 'success',
      isOpen: false
    })
  }

  const deleteSale = (index: number): void => {
    showModal({
      title: 'Delete Sale',
      message: 'Are you sure you want to delete this sale?',
      type: 'confirm',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isOpen: false,
      onConfirm: () => {
        const updatedSales = sales.filter((_, i) => i !== index)
        setSales(updatedSales)
        saveSales(updatedSales)
        showModal({
          title: 'Success!',
          message: 'Sale has been deleted successfully.',
          type: 'success',
          isOpen: false
        })
      }
    })
  }

  const deleteAllSales = (): void => {
    showModal({
      title: 'Delete All Sales',
      message: 'Are you sure you want to delete all sales? This action cannot be undone.',
      type: 'confirm',
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      isOpen: false,
      onConfirm: () => {
        setSales([])
        saveSales([])
        showModal({
          title: 'Success!',
          message: 'All sales have been deleted successfully.',
          type: 'success',
          isOpen: false
        })
      }
    })
  }

  return (
    <div style={containerStyle}>
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

      {/* Form Grid */}
      <div style={formGridStyle}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Sale Type</label>
          <select value={type} onChange={handleTypeChange} style={inputStyle}>
            <option value="refill">Refill</option>
            <option value="coil">Coil</option>
            <option value="device">Device</option>
            <option value="puff">Puff</option>
          </select>
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Item Name</label>
          {(type === 'device' || type === 'puff') ? (
            <input
              type="text"
              value={customItem}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomItem(e.target.value)}
              placeholder={type === 'puff' ? "Enter puff name" : "Enter device name"}
              style={inputStyle}
            />
          ) : (
            <select 
              value={itemName} 
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setItemName(e.target.value)}
              style={inputStyle}
            >
              {type === 'refill' ? (
                <>
                  <option value="Pineapple Series">Pineapple Series</option>
                  <option value="UK Salt">UK Salt</option>
                  <option value="Simple Tokyo">Simple Tokyo</option>
                </>
              ) : (
                <>
                  <option value="VMate">VMate</option>
                  <option value="Argus">Argus</option>
                  <option value="G3">G3</option>
                  <option value="Xlim">Xlim</option>
                  <option value="Xros">Xros</option>
                  <option value="Freemax">Freemax</option>
                  <option value="Caliburn g">Caliburn g</option>
                  <option value="Sonder">Sonder</option>
                  <option value="Oneo">Oneo</option>
                </>
              )}
            </select>
          )}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Quantity</label>
          <input
            type="number"
            step="0.1"
            value={quantity}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
            placeholder="Enter quantity"
            style={inputStyle}
            required
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Amount (PKR)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
            placeholder="Enter amount"
            style={inputStyle}
            required
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Payment Method</label>
          <select 
            value={paymentMethod} 
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setPaymentMethod(e.target.value)}
            style={inputStyle}
          >
            <option value="cash">Cash</option>
            <option value="jazzcash">JazzCash</option>
            <option value="card">Credit Card</option>
          </select>
        </div>

        <div style={formGroupStyle}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={isCredit}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setIsCredit(e.target.checked)}
              style={checkboxStyle}
            />
            Sell on Credit
          </label>
        </div>

        {isCredit && (
          <>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Customer Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                style={inputStyle}
                required
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Customer Phone *</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerPhone(e.target.value)}
                placeholder="Phone number"
                style={inputStyle}
                required
              />
            </div>
          </>
        )}
      </div>

      <div style={actionButtonsStyle}>
        <button onClick={addSale} style={successButtonStyle}>
          Add New Sale
        </button>
        <button onClick={deleteAllSales} style={dangerButtonStyle}>
          Delete All Sales
        </button>
      </div>

      <div style={cardsContainerStyle}>
        {sales.length === 0 ? (
          <div style={emptyStateStyle}>
            <h3>No Sales Recorded Yet</h3>
            <p>Add your first sale to get started!</p>
          </div>
        ) : (
          sales.map((sale, index) => (
            <div key={index} style={{
              ...cardStyle,
              borderTop: `4px solid ${
                sale.type === 'refill' ? '#ff7e5f' : 
                sale.type === 'puff' ? '#9c27b0' : '#4a6fa5'
              }`
            }}>
              <h3 style={cardTitleStyle}>{sale.type.charAt(0).toUpperCase() + sale.type.slice(1)} Sale</h3>
              {sale.isCredit && <div style={creditBadgeStyle}>CREDIT</div>}
              <p><span style={labelTextStyle}>Item:</span> {sale.itemName}</p>
              <p><span style={labelTextStyle}>Quantity:</span> {sale.quantity}</p>
              <p><span style={labelTextStyle}>Amount:</span> {sale.amount.toFixed(2)} PKR</p>
              <p><span style={labelTextStyle}>Payment:</span> {sale.paymentMethod}</p>
              {sale.isCredit && (
                <>
                  <p><span style={labelTextStyle}>Customer:</span> {sale.customerName}</p>
                  <p><span style={labelTextStyle}>Phone:</span> {sale.customerPhone}</p>
                </>
              )}
              <p style={timestampStyle}>
                Added: {new Date(sale.timestamp).toLocaleString()}
              </p>
              <button 
                onClick={() => deleteSale(index)}
                style={deleteButtonStyle}
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
        .responsive-form-grid {
          grid-template-columns: 1fr !important;
        }
        
        .responsive-action-buttons {
          flex-direction: column !important;
        }
        
        .responsive-cards-container {
          grid-template-columns: 1fr !important;
        }

        /* Small phones (320px - 480px) */
        @media (min-width: 320px) {
          .responsive-form-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* Large phones (481px - 767px) */
        @media (min-width: 481px) {
          .responsive-form-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .responsive-cards-container {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        /* Tablets (768px - 1023px) */
        @media (min-width: 768px) {
          .responsive-form-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .responsive-action-buttons {
            flex-direction: row !important;
          }
          .responsive-cards-container {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        /* Small desktops (1024px - 1279px) */
        @media (min-width: 1024px) {
          .responsive-form-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .responsive-cards-container {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        /* Large desktops (1280px+) */
        @media (min-width: 1280px) {
          .responsive-form-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .responsive-cards-container {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        /* Extra large screens (1440px+) */
        @media (min-width: 1440px) {
          .responsive-form-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .responsive-cards-container {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}

// Converted Styles - Keeping exact same styling and spacing
const containerStyle: React.CSSProperties = {
  padding: '1rem',
  maxWidth: '1400px',
  margin: '0 auto'
}

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
  marginBottom: '30px',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  padding: '25px',
  borderRadius: '10px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
}

const formGroupStyle: React.CSSProperties = {
  marginBottom: '15px'
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '5px',
  fontWeight: '500'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  fontSize: '1rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  boxSizing: 'border-box' as const
}

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer'
}

const checkboxStyle: React.CSSProperties = {
  width: 'auto'
}

const actionButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '15px',
  marginBottom: '30px',
  flexDirection: 'column'
}

const successButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem',
  flex: 1
}

const dangerButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem',
  flex: 1
}

const cardsContainerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '25px'
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
  position: 'relative'
}

const cardTitleStyle: React.CSSProperties = {
  margin: '0 0 15px 0',
  fontSize: '1.25rem',
  fontWeight: '600'
}

const creditBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '15px',
  right: '15px',
  backgroundColor: '#ffc107',
  color: '#333',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: 'bold'
}

const labelTextStyle: React.CSSProperties = {
  fontWeight: '600',
  color: '#555'
}

const timestampStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#777',
  marginTop: '15px',
  paddingTop: '10px',
  borderTop: '1px dashed #ddd'
}

const deleteButtonStyle: React.CSSProperties = {
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

const emptyStateStyle: React.CSSProperties = {
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
    .responsive-form-grid {
      grid-template-columns: 1fr !important;
    }
    
    .responsive-action-buttons {
      flex-direction: column !important;
    }
    
    .responsive-cards-container {
      grid-template-columns: 1fr !important;
    }

    /* Small phones (320px - 480px) */
    @media (min-width: 320px) {
      .responsive-form-grid {
        grid-template-columns: 1fr !important;
      }
    }

    /* Large phones (481px - 767px) */
    @media (min-width: 481px) {
      .responsive-form-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      .responsive-cards-container {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }

    /* Tablets (768px - 1023px) */
    @media (min-width: 768px) {
      .responsive-form-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
      .responsive-action-buttons {
        flex-direction: row !important;
      }
      .responsive-cards-container {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }

    /* Small desktops (1024px - 1279px) */
    @media (min-width: 1024px) {
      .responsive-form-grid {
        grid-template-columns: repeat(4, 1fr) !important;
      }
      .responsive-cards-container {
        grid-template-columns: repeat(3, 1fr) !important;
      }
    }

    /* Large desktops (1280px+) */
    @media (min-width: 1280px) {
      .responsive-form-grid {
        grid-template-columns: repeat(4, 1fr) !important;
      }
      .responsive-cards-container {
        grid-template-columns: repeat(3, 1fr) !important;
      }
    }

    /* Extra large screens (1440px+) */
    @media (min-width: 1440px) {
      .responsive-form-grid {
        grid-template-columns: repeat(4, 1fr) !important;
      }
      .responsive-cards-container {
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
    
    if (formGrid) formGrid.classList.add('responsive-form-grid')
    if (actionButtons) actionButtons.classList.add('responsive-action-buttons')
    if (cardsContainer) cardsContainer.classList.add('responsive-cards-container')
    }, 100)
  }

