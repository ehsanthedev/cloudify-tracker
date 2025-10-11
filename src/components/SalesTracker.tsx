'use client'
import { useState, useEffect, ChangeEvent, useRef, useCallback } from 'react'
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [modal, setModal] = useState<Omit<ModalProps, 'onClose' | 'onConfirm'> & { 
    isOpen: boolean; 
    onConfirm?: () => void 
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  })

  // Refs for form fields
  const quantityRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const customItemRef = useRef<HTMLInputElement>(null)
  const customerNameRef = useRef<HTMLInputElement>(null)
  const customerPhoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedSales = getSales()
    setSales(savedSales)
  }, [])

  // Create stable callback for validation
  const validateAndSaveSale = useCallback((): void => {
    const finalItemName = (type === 'device' || type === 'puff') ? customItem : itemName
    const saleQuantity = parseFloat(quantity)
    const saleAmount = parseFloat(amount)

    // Basic validation
    if (!finalItemName || !quantity || !amount || isNaN(saleQuantity) || isNaN(saleAmount)) {
      showModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please fill all required fields with valid values.',
        type: 'error'
      })
      return
    }

    // Credit sale validation
    if (isCredit && (!customerName.trim() || !customerPhone.trim())) {
      showModal({
        isOpen: true,
        title: 'Credit Sale Required',
        message: 'For credit sales, both customer name and phone number are required.',
        type: 'error'
      })
      return
    }

    // All validations passed, add or update the sale
    if (editingIndex !== null) {
      updateSale()
    } else {
      addSale()
    }
  }, [type, itemName, customItem, quantity, amount, isCredit, customerName, customerPhone, editingIndex])

  // Handle Enter key press - FIXED VERSION with stable dependencies
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle Enter key
      if (e.key !== 'Enter') return

      // If modal is open, close it or confirm action
      if (modal.isOpen) {
        e.preventDefault()
        if (modal.type === 'confirm' && modal.onConfirm) {
          modal.onConfirm()
        } else {
          hideModal()
        }
        return
      }

      // Don't trigger if user is typing in input fields
      const activeElement = document.activeElement
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT'
      )) {
        // Check if we're in a form field that should trigger on Enter
        const isFormField = activeElement.closest('form') || 
                           activeElement.getAttribute('role') === 'textbox' ||
                           activeElement.classList.contains('form-field')
        
        if (!isFormField) {
          e.preventDefault()
          validateAndSaveSale()
        }
        return
      }

      // For other cases, validate and save
      e.preventDefault()
      validateAndSaveSale()
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [modal.isOpen, modal.type, modal.onConfirm, validateAndSaveSale]) // Fixed dependencies

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
      // Set default item names based on type
      if (newType === 'refill') {
        setItemName('Pineapple Series')
      } else if (newType === 'flavourbottle') {
        setItemName('Pineapple Series')
      } else {
        setItemName('VMate')
      }
    }
  }

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const newType = e.target.value
    setType(newType)
    updateItemField(newType)
  }

  const editSale = (index: number): void => {
    const sale = sales[index]
    setType(sale.type)
    
    // Set item name based on sale type
    if (sale.type === 'device' || sale.type === 'puff') {
      setCustomItem(sale.itemName)
      setItemName('')
    } else {
      setItemName(sale.itemName)
      setCustomItem('')
    }
    
    setQuantity(sale.quantity.toString())
    setAmount(sale.amount.toString())
    setPaymentMethod(sale.paymentMethod)
    setIsCredit(sale.isCredit)
    setCustomerName(sale.customerName)
    setCustomerPhone(sale.customerPhone)
    setEditingIndex(index)
  }

  const cancelEdit = (): void => {
    setEditingIndex(null)
    resetForm()
  }

  const resetForm = (): void => {
    setType('refill')
    setItemName('Pineapple Series')
    setCustomItem('')
    setQuantity('')
    setAmount('')
    setPaymentMethod('cash')
    setIsCredit(false)
    setCustomerName('')
    setCustomerPhone('')
    setEditingIndex(null)
  }

  const addSale = (): void => {
    const finalItemName = (type === 'device' || type === 'puff') ? customItem : itemName
    const saleQuantity = parseFloat(quantity)
    const saleAmount = parseFloat(amount)

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
      isPaid: !isCredit
    }

    // If it's a credit sale, add to creditors
    if (isCredit && customerName && customerPhone) {
      addToCreditors(finalItemName, saleQuantity, saleAmount, customerName.trim(), customerPhone.trim())
    }

    const updatedSales = [...sales, newSale]
    setSales(updatedSales)
    saveSales(updatedSales)

    resetForm()
    
    showModal({
      isOpen: true,
      title: 'Success!',
      message: 'Sale has been added successfully.',
      type: 'success'
    })
  }

  const updateSale = (): void => {
    if (editingIndex === null) return

    const originalSale = sales[editingIndex]
    const finalItemName = (type === 'device' || type === 'puff') ? customItem : itemName
    const saleQuantity = parseFloat(quantity)
    const saleAmount = parseFloat(amount)

    const updatedSale: Sale = {
      type,
      itemName: finalItemName,
      quantity: saleQuantity,
      amount: saleAmount,
      paymentMethod,
      timestamp: originalSale.timestamp, // Keep original timestamp
      isCredit,
      customerName: isCredit ? customerName.trim() : '',
      customerPhone: isCredit ? customerPhone.trim() : '',
      isPaid: !isCredit
    }

    // Handle creditor updates
    handleCreditorUpdate(originalSale, updatedSale, finalItemName, saleQuantity, saleAmount)

    const updatedSales = [...sales]
    updatedSales[editingIndex] = updatedSale
    setSales(updatedSales)
    saveSales(updatedSales)

    resetForm()
    
    showModal({
      isOpen: true,
      title: 'Success!',
      message: 'Sale has been updated successfully.',
      type: 'success'
    })
  }

  const addToCreditors = (itemName: string, quantity: number, amount: number, name: string, phone: string) => {
    const creditors: Creditor[] = getCreditors()
    const existingCreditor = creditors.find((c: Creditor) => c.phone === phone)

    const newPurchase: Purchase = {
      itemName,
      quantity,
      amount,
      date: new Date().toISOString()
    }

    if (existingCreditor) {
      existingCreditor.amountOwed += amount
      existingCreditor.purchases.push(newPurchase)
    } else {
      creditors.push({
        name,
        phone,
        amountOwed: amount,
        purchases: [newPurchase]
      })
    }
    saveCreditors(creditors)
  }

  const removeFromCreditors = (originalSale: Sale) => {
    if (!originalSale.isCredit || !originalSale.customerPhone) return

    const creditors: Creditor[] = getCreditors()
    const creditorIndex = creditors.findIndex((c: Creditor) => c.phone === originalSale.customerPhone)
    
    if (creditorIndex !== -1) {
      const creditor = creditors[creditorIndex]
      creditor.amountOwed -= originalSale.amount
      
      // Remove the purchase (simplified - in real app you might want more specific matching)
      creditor.purchases = creditor.purchases.filter(p => 
        !(p.itemName === originalSale.itemName && 
          p.quantity === originalSale.quantity && 
          Math.abs(p.amount - originalSale.amount) < 0.01)
      )
      
      // Remove creditor if no amount owed and no purchases
      if (creditor.amountOwed <= 0 && creditor.purchases.length === 0) {
        creditors.splice(creditorIndex, 1)
      }
      
      saveCreditors(creditors)
    }
  }

  const handleCreditorUpdate = (originalSale: Sale, updatedSale: Sale, itemName: string, quantity: number, amount: number) => {
    // Case 1: Original was credit, updated is credit (same or different customer)
    if (originalSale.isCredit && updatedSale.isCredit) {
      // If customer details changed, remove from old creditor and add to new
      if (originalSale.customerPhone !== updatedSale.customerPhone) {
        removeFromCreditors(originalSale)
        addToCreditors(itemName, quantity, amount, updatedSale.customerName, updatedSale.customerPhone)
      } else {
        // Same customer, update creditor amount
        const creditors: Creditor[] = getCreditors()
        const creditor = creditors.find((c: Creditor) => c.phone === originalSale.customerPhone)
        if (creditor) {
          creditor.amountOwed = creditor.amountOwed - originalSale.amount + amount
          saveCreditors(creditors)
        }
      }
    }
    // Case 2: Original was credit, updated is cash - remove from creditors
    else if (originalSale.isCredit && !updatedSale.isCredit) {
      removeFromCreditors(originalSale)
    }
    // Case 3: Original was cash, updated is credit - add to creditors
    else if (!originalSale.isCredit && updatedSale.isCredit) {
      addToCreditors(itemName, quantity, amount, updatedSale.customerName, updatedSale.customerPhone)
    }
    // Case 4: Both cash - no creditor changes needed
  }

  // In your SalesTracker component, replace the delete functions:

const deleteSale = (index: number): void => {
  const sale = sales[index]
  
  showModal({
    isOpen: true,
    title: 'Delete Sale',
    message: 'Are you sure you want to delete this sale?',
    type: 'confirm',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: () => {
      // Use soft delete instead of removing from array
      const updatedSales = sales.map((s, i) => 
        i === index 
          ? { ...s, deleted: true, deletedAt: new Date().toISOString() }
          : s
      );
      setSales(updatedSales.filter(s => !s.deleted)); // Remove from view
      saveSales(updatedSales); // Save with deleted flag
      
      showModal({
        isOpen: true,
        title: 'Success!',
        message: 'Sale has been deleted successfully.',
        type: 'success'
      })
    }
  })
}

const deleteAllSales = (): void => {
  showModal({
    isOpen: true,
    title: 'Delete All Sales',
    message: 'Are you sure you want to delete all sales? This action cannot be undone.',
    type: 'confirm',
    confirmText: 'Delete All',
    cancelText: 'Cancel',
    onConfirm: () => {
      // Use soft delete for all sales
      const updatedSales = sales.map(sale => 
        ({ ...sale, deleted: true, deletedAt: new Date().toISOString() })
      );
      setSales([]);
      saveSales(updatedSales);
      showModal({
        isOpen: true,
        title: 'Success!',
        message: 'All sales have been deleted successfully.',
        type: 'success'
      })
    }
  })
}


  // Format sale type for display
  const formatSaleType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      refill: 'Refill',
      coil: 'Coil',
      device: 'Device',
      puff: 'Puff',
      flavourbottle: 'Flavour Bottle'
    }
    return typeMap[type] || type
  }

  // Get border color based on sale type
  const getBorderColor = (saleType: string): string => {
    switch (saleType) {
      case 'refill':
      case 'flavourbottle':
        return '#ff7e5f' // Same color for refill and flavour bottle
      case 'puff':
        return '#9c27b0'
      default:
        return '#4a6fa5'
    }
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
            <option value="flavourbottle">Flavour Bottle</option>
          </select>
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Item Name</label>
          {(type === 'device' || type === 'puff') ? (
            <input
              ref={customItemRef}
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
              {type === 'refill' || type === 'flavourbottle' ? (
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
                  <option value="Nexlim">Nexlim</option>
                </>
              )}
            </select>
          )}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Quantity</label>
          <input
            ref={quantityRef}
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
            ref={amountRef}
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
                ref={customerNameRef}
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
                ref={customerPhoneRef}
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
        <button onClick={validateAndSaveSale} style={editingIndex !== null ? warningButtonStyle : successButtonStyle}>
          {editingIndex !== null ? 'Update Sale (or Press Enter)' : 'Add New Sale (or Press Enter)'}
        </button>
        {editingIndex !== null && (
          <button onClick={cancelEdit} style={secondaryButtonStyle}>
            Cancel Edit
          </button>
        )}
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
              borderTop: `4px solid ${getBorderColor(sale.type)}`
            }}>
              <h3 style={cardTitleStyle}>{formatSaleType(sale.type)} Sale</h3>
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
              <div style={cardActionsStyle}>
                <button 
                  onClick={() => editSale(index)}
                  style={editButtonStyle}
                >
                  Edit
                </button>
                <button 
                  onClick={() => deleteSale(index)}
                  style={deleteButtonStyle}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Keep all your existing styles the same...
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

const warningButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#ffc107',
  color: 'black',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem',
  flex: 1
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#6c757d',
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

const cardActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  marginTop: '15px',
  justifyContent: 'flex-end'
}

const editButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '0.85rem',
  backgroundColor: 'rgba(255, 193, 7, 0.1)',
  color: '#856404',
  border: '1px solid #ffc107',
  borderRadius: '4px',
  cursor: 'pointer'
}

const deleteButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '0.85rem',
  backgroundColor: 'rgba(220, 53, 69, 0.1)',
  color: '#dc3545',
  border: '1px solid #dc3545',
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