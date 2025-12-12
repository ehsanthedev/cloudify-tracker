"use client";
import { useState, useEffect, ChangeEvent } from "react";
import {
  getCreditors,
  saveCreditors,
  getPayments,
  savePayments,
  getAllSales,
  saveSales,
  Creditor,
  Payment,
  Sale,
  permanentDeleteAllCreditors,
  permanentDeleteAllPayments,
} from "../../../lib/storage";
import Modal, { ModalProps } from "../../components/Modal";

export default function CreditorsPage() {
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [selectedCreditor, setSelectedCreditor] = useState<number | null>(null);
  const [modal, setModal] = useState<
    Omit<ModalProps, "onClose" | "onConfirm"> & {
      isOpen: boolean;
      onConfirm?: () => void;
    }
  >({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCreditors(getCreditors());
    setPayments(getPayments());
    // Trigger entrance animation
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const showModal = (
    config: Omit<ModalProps, "onClose" | "onConfirm"> & {
      onConfirm?: () => void;
    }
  ) => {
    setModal({ ...config, isOpen: true });
  };

  const hideModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const addPayment = (creditorIndex: number): void => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      showModal({
        isOpen: true,
        title: "Invalid Payment",
        message: "Please enter a valid payment amount.",
        type: "error",
        confirmText: undefined,
        cancelText: undefined,
      });
      return;
    }

    const creditor = creditors[creditorIndex];
    if (amount > creditor.amountOwed) {
      showModal({
        isOpen: true,
        title: "Payment Error",
        message: "Payment amount cannot exceed owed amount.",
        type: "error",
      });
      return;
    }

    // Update creditor
    const updatedCreditors = [...creditors];
    updatedCreditors[creditorIndex].amountOwed -= amount;

    // Check if amount becomes zero after payment
    const shouldRemoveCreditor =
      updatedCreditors[creditorIndex].amountOwed === 0;

    if (shouldRemoveCreditor) {
      // Remove creditor if fully paid
      updatedCreditors.splice(creditorIndex, 1);
    }

    setCreditors(updatedCreditors);
    saveCreditors(updatedCreditors);

    // Record payment
    const newPayment: Payment = {
      creditorName: creditor.name,
      creditorPhone: creditor.phone,
      amount,
      timestamp: new Date().toISOString(),
      originalSaleAmount: amount,
    };

    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    savePayments(updatedPayments);

    // Update sales to mark as paid if applicable - using getAllSales
    const allSales = getAllSales();
    const updatedSales = [...allSales];
    const creditSales = updatedSales.filter(
      (sale) =>
        sale.isCredit && sale.customerPhone === creditor.phone && !sale.deleted
    );

    // If this payment covers the full amount of any credit sale, mark it as paid
    creditSales.forEach((sale) => {
      if (amount >= sale.amount && !sale.isPaid) {
        sale.isPaid = true;
        sale.paymentMethod = "credit-payment";
        sale.timestamp = new Date().toISOString();
      }
    });

    saveSales(updatedSales);

    // Add success animation
    const creditorCard = document.getElementById(`creditor-${creditorIndex}`);
    if (creditorCard) {
      creditorCard.classList.add("animate-success-payment");
      setTimeout(
        () => creditorCard.classList.remove("animate-success-payment"),
        1000
      );
    }

    setPaymentAmount("");
    setSelectedCreditor(null);

    if (shouldRemoveCreditor) {
      showModal({
        isOpen: true,
        title: "Payment Complete",
        message: `${creditor.name} has been fully paid and removed from creditors.`,
        type: "success",
      });
    } else {
      showModal({
        isOpen: true,
        title: "Payment Added",
        message: `Payment of ${amount.toFixed(2)} PKR recorded for ${
          creditor.name
        }.`,
        type: "success",
      });
    }
  };

  const deleteCreditor = (index: number): void => {
    const creditor = creditors[index];
    showModal({
      isOpen: true,
      title: "Delete Creditor",
      message: `Are you sure you want to delete ${creditor.name} from creditors?`,
      type: "confirm",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: () => {
        const creditorCard = document.getElementById(`creditor-${index}`);
        if (creditorCard) {
          creditorCard.classList.add("animate-delete");
          setTimeout(() => {
            const updatedCreditors = creditors.filter((_, i) => i !== index);
            setCreditors(updatedCreditors);
            saveCreditors(updatedCreditors);

            showModal({
              isOpen: true,
              title: "Success!",
              message: `${creditor.name} has been deleted from creditors.`,
              type: "success",
            });
          }, 300);
        }
      },
    });
  };

  const deleteAllCreditors = (): void => {
    if (creditors.length === 0) {
      showModal({
        isOpen: true,
        title: "No Creditors",
        message: "No creditors to delete.",
        type: "alert",
      });
      return;
    }

    showModal({
      isOpen: true,
      title: "Delete All Creditors",
      message:
        "Are you sure you want to delete ALL creditors? This action cannot be undone.",
      type: "confirm",
      confirmText: "Delete All",
      cancelText: "Cancel",
      onConfirm: () => {
        // Add exit animation to all cards
        const cards = document.querySelectorAll(".creditor-card");
        cards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add("animate-delete");
          }, index * 50);
        });

        setTimeout(() => {
          // Permanently delete all creditors from storage
          permanentDeleteAllCreditors();

          // Update state to empty arrays
          setCreditors([]);
          setPayments([]);
          permanentDeleteAllPayments();

          showModal({
            isOpen: true,
            title: "Success!",
            message: "All creditors have been deleted successfully.",
            type: "success",
          });
        }, 300 + cards.length * 50);
      },
    });
  };

  const deletePaymentHistory = (): void => {
    if (payments.length === 0) {
      showModal({
        isOpen: true,
        title: "No Payment History",
        message: "No payment history to delete.",
        type: "alert",
      });
      return;
    }

    showModal({
      isOpen: true,
      title: "Delete Payment History",
      message:
        "Are you sure you want to delete ALL payment history? This action cannot be undone.",
      type: "confirm",
      confirmText: "Delete All",
      cancelText: "Cancel",
      onConfirm: () => {
        // Add exit animation to all payment cards
        const paymentCards = document.querySelectorAll(".payment-card");
        paymentCards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add("animate-delete");
          }, index * 30);
        });

        setTimeout(() => {
          setPayments([]);
          savePayments([]);

          showModal({
            isOpen: true,
            title: "Success!",
            message: "All payment history has been deleted successfully.",
            type: "success",
          });
        }, 300 + paymentCards.length * 30);
      },
    });
  };

  const totalOwed = creditors.reduce(
    (sum, creditor) => sum + creditor.amountOwed,
    0
  );

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

        @keyframes successPayment {
          0% {
            background-color: rgba(40, 167, 69, 0);
            transform: scale(1);
          }
          50% {
            background-color: rgba(40, 167, 69, 0.1);
            transform: scale(1.02);
            box-shadow: 0 10px 30px rgba(40, 167, 69, 0.2);
          }
          100% {
            background-color: rgba(40, 167, 69, 0);
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes deleteAnimation {
          to {
            opacity: 0;
            transform: translateX(-100%) scale(0.9);
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

        @keyframes moneyFall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100px) rotate(360deg);
            opacity: 0;
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

        .animate-success-payment {
          animation: successPayment 1s ease-out;
        }

        .animate-pulse-once {
          animation: pulse 0.5s ease-in-out;
        }

        .animate-delete {
          animation: deleteAnimation 0.3s ease-out forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-money-fall {
          animation: moneyFall 2s ease-out;
        }

        .creditor-card {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .creditor-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }

        .payment-card {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .payment-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .button-animate {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .button-animate:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .button-animate:active {
          transform: translateY(0);
        }

        .form-input-animate {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .form-input-animate:focus {
          transform: translateY(-1px);
          box-shadow: 0 5px 15px rgba(40, 167, 69, 0.2);
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

        .total-amount-counter {
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .empty-state-animate {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

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

      <header
        style={{
          ...headerStyles,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? "translateY(0)" : "translateY(-20px)",
          transition: "all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
        className="animate-fade-in-up"
      >
        <h1>CREDITORS MANAGEMENT</h1>
      </header>

      <div
        style={{
          ...totalStyles,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s",
        }}
        className="total-amount-counter"
      >
        <div>
          <h3>
            Total Amount Owed:{" "}
            <span style={{ color: "#28a745", fontWeight: "700" }}>
              {totalOwed.toFixed(2)} PKR
            </span>
          </h3>
        </div>
        {creditors.length > 0 && (
          <button
            onClick={deleteAllCreditors}
            style={dangerButtonStyles}
            className="button-animate hover-shimmer"
          >
            Delete All Creditors
          </button>
        )}
      </div>

      <div style={cardsContainerStyles}>
        {creditors.length === 0 ? (
          <div style={emptyStateStyles} className="empty-state-animate">
            <h3>No Creditors</h3>
            <p>Customers who purchase on credit will appear here.</p>
            <div
              style={{
                fontSize: "3rem",
                margin: "20px 0",
                opacity: 0.7,
                animation: "float 3s ease-in-out infinite",
              }}
            >
              📋
            </div>
          </div>
        ) : (
          creditors.map((creditor, index) => (
            <div
              key={index}
              id={`creditor-${index}`}
              style={{
                ...cardStyles,
                borderTop: `4px solid ${getCreditorColor(index)}`,
                animationDelay: `${index * 0.1}s`,
              }}
              className="creditor-card animate-fade-in-up"
            >
              <button
                onClick={() => deleteCreditor(index)}
                style={deleteCreditorButtonStyles}
                className="button-animate hover-shimmer"
              >
                Delete
              </button>
              <h3>{creditor.name}</h3>
              <p>
                <span style={labelStyles}>Phone:</span> {creditor.phone}
              </p>
              <p>
                <span style={labelStyles}>Amount Owed:</span>{" "}
                <span style={{ fontWeight: "700", color: "#28a745" }}>
                  {creditor.amountOwed.toFixed(2)} PKR
                </span>
              </p>

              <div style={purchasesSectionStyles}>
                <h4>Recent Purchases:</h4>
                {creditor.purchases.slice(-3).map((purchase, i) => (
                  <div key={i} style={purchaseItemStyles}>
                    {purchase.itemName} - {purchase.quantity} x{" "}
                    {purchase.amount.toFixed(2)} PKR
                  </div>
                ))}
              </div>

              <div style={paymentSectionStyles}>
                <input
                  type="number"
                  step="0.01"
                  value={selectedCreditor === index ? paymentAmount : ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPaymentAmount(e.target.value)
                  }
                  placeholder="Payment amount"
                  style={inputStyles}
                  className="form-input-animate hover-shimmer"
                  onFocus={() => setSelectedCreditor(index)}
                  onKeyPress={(e) => {
                    if (
                      e.key === "Enter" &&
                      paymentAmount &&
                      selectedCreditor === index
                    ) {
                      addPayment(index);
                    }
                  }}
                />
                <button
                  onClick={() => addPayment(index)}
                  style={paymentButtonStyles}
                  className="button-animate hover-shimmer"
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
        <div
          style={{
            ...paymentsHeaderStyles,
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s",
          }}
        >
          <h2>Payment History</h2>
          {payments.length > 0 && (
            <button
              onClick={deletePaymentHistory}
              style={dangerButtonStyles}
              className="button-animate hover-shimmer"
            >
              Delete All History
            </button>
          )}
        </div>
        {payments.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666", marginTop: "20px" }}>
            No payments recorded.
          </p>
        ) : (
          payments
            .slice()
            .reverse()
            .map((payment, index) => (
              <div
                key={index}
                style={{
                  ...paymentCardStyles,
                  animationDelay: `${index * 0.05}s`,
                }}
                className="payment-card animate-fade-in-up"
              >
                <p>
                  <strong>{payment.creditorName}</strong> paid{" "}
                  <span style={{ color: "#28a745", fontWeight: "600" }}>
                    {payment.amount.toFixed(2)} PKR
                  </span>
                </p>
                <small>{new Date(payment.timestamp).toLocaleString()}</small>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "15px",
                    fontSize: "1.5rem",
                    opacity: 0.3,
                    animation: "float 2s ease-in-out infinite",
                  }}
                >
                  💰
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

// Helper function to get different colors for creditors
const getCreditorColor = (index: number): string => {
  const colors = [
    "#28a745", // Green
    "#17a2b8", // Teal
    "#ffc107", // Yellow
    "#6f42c1", // Purple
    "#fd7e14", // Orange
    "#20c997", // Mint
    "#e83e8c", // Pink
  ];
  return colors[index % colors.length];
};

// Styles remain the same as previous version
const containerStyles: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "20px",
};

const headerStyles: React.CSSProperties = {
  textAlign: "center",
  padding: "20px 0",
  marginBottom: "30px",
  background: "linear-gradient(135deg, #28a745, #20c997)",
  color: "white",
  borderRadius: "12px",
  boxShadow: "0 8px 25px rgba(40, 167, 69, 0.3)",
};

const totalStyles: React.CSSProperties = {
  padding: "20px",
  backgroundColor: "rgba(40, 167, 69, 0.1)",
  borderRadius: "12px",
  marginBottom: "30px",
  textAlign: "center",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "15px",
  border: "2px dashed rgba(40, 167, 69, 0.3)",
};

const cardsContainerStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
  gap: "25px",
  marginBottom: "40px",
};

const cardStyles: React.CSSProperties = {
  backgroundColor: "white",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.08)",
  position: "relative",
  opacity: 0,
  animation: "fadeInUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
};

const labelStyles: React.CSSProperties = {
  fontWeight: "600",
  color: "#555",
};

const purchasesSectionStyles: React.CSSProperties = {
  margin: "15px 0",
  padding: "12px",
  backgroundColor: "rgba(0, 0, 0, 0.02)",
  borderRadius: "8px",
};

const purchaseItemStyles: React.CSSProperties = {
  fontSize: "0.9rem",
  padding: "6px 0",
  borderBottom: "1px solid #eee",
  display: "flex",
  justifyContent: "space-between",
};

const paymentSectionStyles: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  marginTop: "20px",
};

const inputStyles: React.CSSProperties = {
  flex: 1,
  padding: "10px",
  border: "2px solid #e1e5e9",
  borderRadius: "8px",
  fontSize: "1rem",
};

const paymentButtonStyles: React.CSSProperties = {
  padding: "10px 20px",
  backgroundColor: "#28a745",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "0.9rem",
};

const deleteCreditorButtonStyles: React.CSSProperties = {
  position: "absolute",
  top: "15px",
  right: "15px",
  padding: "8px 12px",
  fontSize: "0.85rem",
  backgroundColor: "rgba(220, 53, 69, 0.1)",
  color: "#dc3545",
  border: "2px solid #dc3545",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const paymentsSectionStyles: React.CSSProperties = {
  marginTop: "40px",
};

const paymentsHeaderStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  flexWrap: "wrap",
  gap: "15px",
};

const paymentCardStyles: React.CSSProperties = {
  backgroundColor: "white",
  padding: "20px",
  margin: "10px 0",
  borderRadius: "10px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  position: "relative",
  overflow: "hidden",
  opacity: 0,
  animation: "fadeInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
};

const dangerButtonStyles: React.CSSProperties = {
  padding: "12px 20px",
  backgroundColor: "#dc3545",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: "600",
};

const emptyStateStyles: React.CSSProperties = {
  textAlign: "center",
  padding: "60px 40px",
  color: "#666",
  backgroundColor: "rgba(40, 167, 69, 0.05)",
  borderRadius: "12px",
  gridColumn: "1 / -1",
  border: "2px dashed rgba(40, 167, 69, 0.3)",
};
