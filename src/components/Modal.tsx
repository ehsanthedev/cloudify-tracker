"use client";
import { useEffect, ReactNode } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type: "alert" | "confirm" | "success" | "error";
  confirmText?: string;
  cancelText?: string;
  children?: ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type,
  confirmText = "Confirm",
  cancelText = "Cancel",
  children,
}: ModalProps) {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  // Get styles based on modal type
  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          headerBg: "#28a745",
          confirmBg: "#28a745",
          icon: "✓",
        };
      case "error":
        return {
          headerBg: "#dc3545",
          confirmBg: "#dc3545",
          icon: "⚠️",
        };
      case "confirm":
        return {
          headerBg: "#4a6fa5",
          confirmBg: "#4a6fa5",
          icon: "❓",
        };
      default: // alert
        return {
          headerBg: "#4a6fa5",
          confirmBg: "#4a6fa5",
          icon: "ℹ️",
        };
    }
  };

  const typeStyles = getTypeStyles();

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
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

        @keyframes bounce {
          0%,
          20%,
          50%,
          80%,
          100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
          }
        }

        .modal-backdrop {
          animation: fadeIn 0.3s ease-out;
        }

        .modal-content {
          animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .modal-success .modal-icon {
          animation: bounce 0.6s ease-out;
        }

        .modal-error {
          animation: shake 0.5s ease-in-out;
        }

        .modal-confirm .modal-icon {
          animation: pulse 2s infinite;
        }

        .modal-button-hover {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .modal-button-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .modal-button-hover:active {
          transform: translateY(0);
        }

        .modal-close-button {
          transition: all 0.3s ease;
        }

        .modal-close-button:hover {
          transform: rotate(90deg);
          background-color: rgba(255, 255, 255, 0.2) !important;
        }

        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .slide-up {
          animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>

      <div
        style={backdropStyle}
        onClick={handleBackdropClick}
        className={`modal-backdrop fade-in ${
          type === "error" ? "modal-error" : ""
        }`}
      >
        <div
          style={modalStyle}
          className={`modal-content slide-up ${
            type === "success" ? "modal-success" : ""
          } ${type === "confirm" ? "modal-confirm" : ""}`}
        >
          {/* Header */}
          <div style={{ ...headerStyle, backgroundColor: typeStyles.headerBg }}>
            <div style={headerContentStyle}>
              <span style={iconStyle} className="modal-icon">
                {typeStyles.icon}
              </span>
              <h3 style={titleStyle}>{title}</h3>
            </div>
            <button
              onClick={onClose}
              style={closeButtonStyle}
              aria-label="Close"
              className="modal-close-button"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div style={bodyStyle}>
            {children || <p style={messageStyle}>{message}</p>}
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            {(type === "confirm" || type === "alert") && (
              <button
                onClick={onClose}
                style={cancelButtonStyle}
                className="modal-button-hover"
              >
                {type === "alert" ? "OK" : cancelText}
              </button>
            )}

            {type === "confirm" && (
              <button
                onClick={handleConfirm}
                style={{
                  ...confirmButtonStyle,
                  backgroundColor: typeStyles.confirmBg,
                }}
                className="modal-button-hover"
              >
                {confirmText}
              </button>
            )}

            {(type === "success" || type === "error") && (
              <button
                onClick={onClose}
                style={{
                  ...confirmButtonStyle,
                  backgroundColor: typeStyles.confirmBg,
                }}
                className="modal-button-hover"
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Updated Styles with better visuals
const backdropStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: "20px",
};

const modalStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "12px",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  maxWidth: "500px",
  width: "100%",
  maxHeight: "90vh",
  overflow: "hidden",
  transform: "translateY(0)",
};

const headerStyle: React.CSSProperties = {
  padding: "20px 24px",
  color: "white",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const headerContentStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const iconStyle: React.CSSProperties = {
  fontSize: "24px",
  display: "inline-block",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.25rem",
  fontWeight: "600",
  letterSpacing: "0.3px",
};

const closeButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "white",
  fontSize: "28px",
  cursor: "pointer",
  padding: "0",
  width: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  fontWeight: "300",
};

const bodyStyle: React.CSSProperties = {
  padding: "24px",
  maxHeight: "60vh",
  overflowY: "auto",
};

const messageStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1rem",
  lineHeight: "1.5",
  color: "#333",
  textAlign: "center",
};

const footerStyle: React.CSSProperties = {
  padding: "20px 24px",
  display: "flex",
  gap: "12px",
  justifyContent: "flex-end",
  borderTop: "1px solid #e9ecef",
};

const cancelButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  backgroundColor: "#6c757d",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: "500",
  minWidth: "80px",
};

const confirmButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: "500",
  minWidth: "80px",
};

// Add hover effects for buttons
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    [style*="background-color: #6c757d"]:hover {
      background-color: #5a6268 !important;
    }
    
    [style*="background-color: #4a6fa5"]:hover,
    [style*="background-color: #28a745"]:hover,
    [style*="background-color: #dc3545"]:hover {
      filter: brightness(110%) !important;
    }
  `;
  document.head.appendChild(style);
}
