'use client'
import { useState, useEffect, ChangeEvent } from 'react'
import { getCreditors, saveCreditors, getPayments, savePayments, getSales, saveSales, Creditor, Payment, Sale } from '../../../lib/storage'
import Modal, { ModalProps } from '../../components/Modal'

export default function CreditorsPage() {
    const [creditors, setCreditors] = useState<Creditor[]>([])
    const [payments, setPayments] = useState<Payment[]>([])
    const [sales, setSales] = useState<Sale[]>([])
    const [paymentAmount, setPaymentAmount] = useState<string>('')
    const [selectedCreditor, setSelectedCreditor] = useState<number | null>(null)
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
        setCreditors(getCreditors())
        setPayments(getPayments())
        setSales(getSales())
    }, [])

    const showModal = (config: Omit<ModalProps, 'onClose' | 'onConfirm'> & { onConfirm?: () => void }) => {
        setModal({ ...config, isOpen: true })
    }

    const hideModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }))
    }

    const addPayment = (creditorIndex: number): void => {
        const amount = parseFloat(paymentAmount)
        if (!amount || amount <= 0 || isNaN(amount)) {
            showModal({
                isOpen: true,
                title: 'Invalid Payment',
                message: 'Please enter a valid payment amount.',
                type: 'error',
                confirmText: undefined,
                cancelText: undefined
            })
            return
        }

        const creditor = creditors[creditorIndex]
        if (amount > creditor.amountOwed) {
            showModal({
                isOpen: true,
                title: 'Payment Error',
                message: 'Payment amount cannot exceed owed amount.',
                type: 'error'
            })
            return
        }

        // Update creditor
        const updatedCreditors = [...creditors]
        updatedCreditors[creditorIndex].amountOwed -= amount
        
        // Check if amount becomes zero after payment
        const shouldRemoveCreditor = updatedCreditors[creditorIndex].amountOwed === 0
        
        if (shouldRemoveCreditor) {
            // Remove creditor if fully paid
            updatedCreditors.splice(creditorIndex, 1)
        }
        
        setCreditors(updatedCreditors)
        saveCreditors(updatedCreditors)

        // Record payment
        const newPayment: Payment = {
            creditorName: creditor.name,
            creditorPhone: creditor.phone,
            amount,
            timestamp: new Date().toISOString(),
            originalSaleAmount: amount // Track this for reporting
        }

        const updatedPayments = [...payments, newPayment]
        setPayments(updatedPayments)
        savePayments(updatedPayments)

        // Update sales to mark as paid if applicable
        const updatedSales = [...sales]
        const creditSales = updatedSales.filter(sale => 
            sale.isCredit && 
            sale.customerPhone === creditor.phone
        )
        
        // If this payment covers the full amount of any credit sale, mark it as paid
        creditSales.forEach(sale => {
            if (amount >= sale.amount && !sale.isPaid) {
                sale.isPaid = true
                sale.paymentMethod = 'credit-payment'
                sale.timestamp = new Date().toISOString() // Update timestamp to payment time
            }
        })

        setSales(updatedSales)
        saveSales(updatedSales)

        setPaymentAmount('')
        setSelectedCreditor(null)
        
        if (shouldRemoveCreditor) {
            showModal({
                isOpen: true,
                title: 'Payment Complete',
                message: `${creditor.name} has been fully paid and removed from creditors.`,
                type: 'success'
            })
        } else {
            showModal({
                isOpen: true,
                title: 'Payment Added',
                message: `Payment of ${amount.toFixed(2)} PKR recorded for ${creditor.name}.`,
                type: 'success'
            })
        }
    }

    const deleteCreditor = (index: number): void => {
        const creditor = creditors[index]
        showModal({
            isOpen: true,
            title: 'Delete Creditor',
            message: `Are you sure you want to delete ${creditor.name} from creditors?`,
            type: 'confirm',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: () => {
                const updatedCreditors = creditors.filter((_, i) => i !== index)
                setCreditors(updatedCreditors)
                saveCreditors(updatedCreditors)
                
                showModal({
                    isOpen: true,
                    title: 'Success!',
                    message: `${creditor.name} has been deleted from creditors.`,
                    type: 'success'
                })
            }
        })
    }

    const deleteAllCreditors = (): void => {
        if (creditors.length === 0) {
            showModal({
                isOpen: true,
                title: 'No Creditors',
                message: 'No creditors to delete.',
                type: 'alert'
            })
            return
        }

        showModal({
            isOpen: true,
            title: 'Delete All Creditors',
            message: 'Are you sure you want to delete ALL creditors? This action cannot be undone.',
            type: 'confirm',
            confirmText: 'Delete All',
            cancelText: 'Cancel',
            onConfirm: () => {
                setCreditors([])
                saveCreditors([])
                
                showModal({
                    isOpen: true,
                    title: 'Success!',
                    message: 'All creditors have been deleted successfully.',
                    type: 'success'
                })
            }
        })
    }

    const deletePaymentHistory = (): void => {
        if (payments.length === 0) {
            showModal({
                isOpen: true,
                title: 'No Payment History',
                message: 'No payment history to delete.',
                type: 'alert'
            })
            return
        }

        showModal({
            isOpen: true,
            title: 'Delete Payment History',
            message: 'Are you sure you want to delete ALL payment history? This action cannot be undone.',
            type: 'confirm',
            confirmText: 'Delete All',
            cancelText: 'Cancel',
            onConfirm: () => {
                setPayments([])
                savePayments([])
                
                showModal({
                    isOpen: true,
                    title: 'Success!',
                    message: 'All payment history has been deleted successfully.',
                    type: 'success'
                })
            }
        })
    }

    const totalOwed = creditors.reduce((sum, creditor) => sum + creditor.amountOwed, 0)

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
                <h1>CREDITORS MANAGEMENT</h1>
            </header>

            <div style={totalStyles}>
                <div>
                    <h3>Total Amount Owed: {totalOwed.toFixed(2)} PKR</h3>
                </div>
                {creditors.length > 0 && (
                    <button onClick={deleteAllCreditors} style={dangerButtonStyles}>
                        Delete All Creditors
                    </button>
                )}
            </div>

            <div style={cardsContainerStyles}>
                {creditors.length === 0 ? (
                    <div style={emptyStateStyles}>
                        <h3>No Creditors</h3>
                        <p>Customers who purchase on credit will appear here.</p>
                    </div>
                ) : (
                    creditors.map((creditor, index) => (
                        <div key={index} style={cardStyles}>
                            <button 
                                onClick={() => deleteCreditor(index)}
                                style={deleteCreditorButtonStyles}
                            >
                                Delete
                            </button>
                            <h3>{creditor.name}</h3>
                            <p><span style={labelStyles}>Phone:</span> {creditor.phone}</p>
                            <p><span style={labelStyles}>Amount Owed:</span> {creditor.amountOwed.toFixed(2)} PKR</p>

                            <div style={purchasesSectionStyles}>
                                <h4>Recent Purchases:</h4>
                                {creditor.purchases.slice(-3).map((purchase, i) => (
                                    <div key={i} style={purchaseItemStyles}>
                                        {purchase.itemName} - {purchase.quantity} x {purchase.amount.toFixed(2)} PKR
                                    </div>
                                ))}
                            </div>

                            <div style={paymentSectionStyles}>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={selectedCreditor === index ? paymentAmount : ''}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPaymentAmount(e.target.value)}
                                    placeholder="Payment amount"
                                    style={inputStyles}
                                    onFocus={() => setSelectedCreditor(index)}
                                />
                                <button
                                    onClick={() => addPayment(index)}
                                    style={paymentButtonStyles}
                                    disabled={!paymentAmount || selectedCreditor !== index}
                                >
                                    Add Payment
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div style={paymentsSectionStyles}>
                <div style={paymentsHeaderStyles}>
                    <h2>Payment History</h2>
                    {payments.length > 0 && (
                        <button onClick={deletePaymentHistory} style={dangerButtonStyles}>
                            Delete All History
                        </button>
                    )}
                </div>
                {payments.length === 0 ? (
                    <p>No payments recorded.</p>
                ) : (
                    payments.slice().reverse().map((payment, index) => (
                        <div key={index} style={paymentCardStyles}>
                            <p><strong>{payment.creditorName}</strong> paid {payment.amount.toFixed(2)} PKR</p>
                            <small>{new Date(payment.timestamp).toLocaleString()}</small>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

// Styles remain the same as previous version
const containerStyles: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
}

const headerStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: '20px 0',
    marginBottom: '30px',
    background: 'linear-gradient(135deg, #28a745, #20c997)',
    color: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
}

const totalStyles: React.CSSProperties = {
    padding: '20px',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderRadius: '10px',
    marginBottom: '30px',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px'
}

const cardsContainerStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '25px',
    marginBottom: '40px'
}

const cardStyles: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
    borderTop: '4px solid #28a745',
    position: 'relative'
}

const labelStyles: React.CSSProperties = {
    fontWeight: '600',
    color: '#555'
}

const purchasesSectionStyles: React.CSSProperties = {
    margin: '15px 0',
    padding: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: '5px'
}

const purchaseItemStyles: React.CSSProperties = {
    fontSize: '0.9rem',
    padding: '5px 0',
    borderBottom: '1px solid #eee'
}

const paymentSectionStyles: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
}

const inputStyles: React.CSSProperties = {
    flex: 1,
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px'
}

const paymentButtonStyles: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
}

const deleteCreditorButtonStyles: React.CSSProperties = {
    position: 'absolute',
    top: '15px',
    right: '15px',
    padding: '6px 10px',
    fontSize: '0.85rem',
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    color: '#dc3545',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
}

const paymentsSectionStyles: React.CSSProperties = {
    marginTop: '40px'
}

const paymentsHeaderStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px'
}

const paymentCardStyles: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '15px',
    margin: '10px 0',
    borderRadius: '5px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
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

const emptyStateStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px',
    color: '#777',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: '10px',
    gridColumn: '1 / -1'
}