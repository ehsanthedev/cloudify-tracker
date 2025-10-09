'use client'
import { useEffect, ReactNode } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  type: 'alert' | 'confirm' | 'success' | 'error'
  confirmText?: string
  cancelText?: string
  children?: ReactNode
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  children
}: ModalProps) {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Don't render if not open
  if (!isOpen) return null

  // Get styles based on modal type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          headerBg: 'linear-gradient(135deg, #28a745, #20c997)',
          confirmBg: '#28a745',
          icon: '✓'
        }
      case 'error':
        return {
          headerBg: 'linear-gradient(135deg, #dc3545, #e83e8c)',
          confirmBg: '#dc3545',
          icon: '⚠️'
        }
      case 'confirm':
        return {
          headerBg: 'linear-gradient(135deg, #ffc107, #fd7e14)',
          confirmBg: '#ffc107',
          icon: '❓'
        }
      default: // alert
        return {
          headerBg: 'linear-gradient(135deg, #4a6fa5, #2c3e50)',
          confirmBg: '#4a6fa5',
          icon: 'ℹ️'
        }
    }
  }

  const typeStyles = getTypeStyles()

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  return (
    <div style={backdropStyle} onClick={handleBackdropClick}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ ...headerStyle, background: typeStyles.headerBg }}>
          <div style={headerContentStyle}>
            <span style={iconStyle}>{typeStyles.icon}</span>
            <h3 style={titleStyle}>{title}</h3>
          </div>
          <button onClick={onClose} style={closeButtonStyle} aria-label="Close">
            ×
          </button>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {children || <p style={messageStyle}>{message}</p>}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          {(type === 'confirm' || type === 'alert') && (
            <button
              onClick={onClose}
              style={cancelButtonStyle}
            >
              {type === 'alert' ? 'OK' : cancelText}
            </button>
          )}
          
          {type === 'confirm' && (
            <button
              onClick={handleConfirm}
              style={{ ...confirmButtonStyle, backgroundColor: typeStyles.confirmBg }}
            >
              {confirmText}
            </button>
          )}
          
          {(type === 'success' || type === 'error') && (
            <button
              onClick={onClose}
              style={{ ...confirmButtonStyle, backgroundColor: typeStyles.confirmBg }}
            >
              OK
            </button>
          )}
        </div>
      </div>

      {/* Global styles for modal */}
      <style jsx global>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            // transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            // transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes backdropFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

// Styles
const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
  animation: 'backdropFadeIn 0.2s ease-out',
  padding: '20px'
}

const modalStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  maxWidth: '500px',
  width: '100%',
  maxHeight: '90vh',
  overflow: 'hidden',
  animation: 'modalFadeIn 0.3s ease-out'
}

const headerStyle: React.CSSProperties = {
  padding: '20px 24px',
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const headerContentStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}

const iconStyle: React.CSSProperties = {
  fontSize: '24px'
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.25rem',
  fontWeight: '600'
}

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'white',
  fontSize: '28px',
  cursor: 'pointer',
  padding: '0',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  transition: 'background-color 0.2s'
}

const bodyStyle: React.CSSProperties = {
  padding: '24px',
  maxHeight: '60vh',
  overflowY: 'auto'
}

const messageStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  lineHeight: '1.5',
  color: '#333'
}

const footerStyle: React.CSSProperties = {
  padding: '20px 24px',
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  borderTop: '1px solid #e9ecef'
}

const cancelButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500',
  transition: 'all 0.2s',
  minWidth: '80px'
}

const confirmButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500',
  transition: 'all 0.2s',
  minWidth: '80px'
}

// Add hover effects
if (typeof window !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    [style*="background-color: #6c757d"]:hover {
      background-color: #5a6268 !important;
      transform: translateY(-1px);
    }
    
    [style*="background-color: #4a6fa5"]:hover,
    [style*="background-color: #28a745"]:hover,
    [style*="background-color: #dc3545"]:hover,
    [style*="background-color: #ffc107"]:hover {
      filter: brightness(110%) !important;
      transform: translateY(-1px);
    }
    
    [style*="background: none"]:hover {
      background-color: rgba(255, 255, 255, 0.2) !important;
    }
  `
  document.head.appendChild(style)
}