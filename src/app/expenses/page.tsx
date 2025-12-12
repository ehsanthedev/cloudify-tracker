"use client";
import { useState, useEffect, ChangeEvent } from "react";
import {
  getExpenses,
  saveExpenses,
  Expense,
  permanentDeleteAllExpenses,
} from "../../../lib/storage";
import Modal, { ModalProps } from "../../components/Modal";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("supplies");
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
    const savedExpenses = getExpenses();
    setExpenses(savedExpenses);
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

  const addExpense = (): void => {
    if (!description || !amount) {
      showModal({
        title: "Validation Error",
        message: "Please fill all required fields.",
        type: "error",
        isOpen: true,
      });
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      showModal({
        title: "Invalid Amount",
        message: "Please enter a valid amount.",
        type: "error",
        isOpen: true,
      });
      return;
    }

    const newExpense: Expense = {
      description,
      amount: expenseAmount,
      category,
      timestamp: new Date().toISOString(),
    };

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);

    // Add animation feedback for successful addition
    const expenseCard = document.getElementById(
      `expense-${updatedExpenses.length - 1}`
    );
    if (expenseCard) {
      expenseCard.classList.add("animate-success-add");
      setTimeout(
        () => expenseCard.classList.remove("animate-success-add"),
        1000
      );
    }

    setDescription("");
    setAmount("");
    showModal({
      title: "Success!",
      message: "Expense has been added successfully.",
      type: "success",
      isOpen: true,
    });
  };

  const deleteExpense = (index: number): void => {
    showModal({
      title: "Delete Expense",
      message: "Are you sure you want to delete this expense?",
      type: "confirm",
      confirmText: "Delete",
      cancelText: "Cancel",
      isOpen: true,
      onConfirm: () => {
        const expenseCard = document.getElementById(`expense-${index}`);
        if (expenseCard) {
          expenseCard.classList.add("animate-delete");
          setTimeout(() => {
            const updatedExpenses = expenses.filter((_, i) => i !== index);
            setExpenses(updatedExpenses);
            saveExpenses(updatedExpenses);
            showModal({
              title: "Success!",
              message: "Expense has been deleted successfully.",
              type: "success",
              isOpen: true,
            });
          }, 300);
        }
      },
    });
  };

  const deleteAllExpenses = (): void => {
    if (expenses.length === 0) {
      showModal({
        title: "No Expenses",
        message: "No expenses to delete.",
        type: "alert",
        isOpen: true,
      });
      return;
    }

    showModal({
      title: "Delete All Expenses",
      message:
        "Are you sure you want to permanently delete ALL expenses (including from reports)? This action cannot be undone.",
      type: "confirm",
      confirmText: "Delete All",
      cancelText: "Cancel",
      isOpen: true,
      onConfirm: () => {
        // Permanently delete all expenses from storage
        permanentDeleteAllExpenses();

        // Add exit animation to all cards
        const cards = document.querySelectorAll(".expense-card");
        cards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add("animate-delete");
          }, index * 50);
        });

        setTimeout(() => {
          setExpenses([]);
          showModal({
            title: "Success!",
            message:
              "All expenses have been permanently deleted from everywhere.",
            type: "success",
            isOpen: true,
          });
        }, 300 + cards.length * 50);
      },
    });
  };

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
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

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        @keyframes successHighlight {
          0% {
            background-color: rgba(40, 167, 69, 0);
            transform: scale(1);
          }
          50% {
            background-color: rgba(40, 167, 69, 0.1);
            transform: scale(1.02);
          }
          100% {
            background-color: rgba(40, 167, 69, 0);
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

        .animate-pulse-once {
          animation: pulse 0.5s ease-in-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        .animate-success-add {
          animation: successHighlight 1s ease-out;
        }

        .animate-delete {
          animation: deleteAnimation 0.3s ease-out forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .form-input-animate {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .form-input-animate:focus {
          transform: translateY(-1px);
          box-shadow: 0 5px 15px rgba(255, 126, 95, 0.2);
        }

        .expense-card {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .expense-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
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

        .total-counter {
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .empty-state-animate {
          animation: float 6s ease-in-out infinite;
        }

        /* Responsive classes */
        @media (max-width: 480px) {
          .responsive-form-grid {
            grid-template-columns: 1fr !important;
          }
          .responsive-action-buttons {
            flex-direction: column !important;
          }
          .responsive-cards-container {
            grid-template-columns: 1fr !important;
          }
        }

        @media (min-width: 481px) and (max-width: 767px) {
          .responsive-form-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .responsive-cards-container {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
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

        @media (min-width: 1024px) and (max-width: 1279px) {
          .responsive-form-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .responsive-cards-container {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        @media (min-width: 1280px) {
          .responsive-form-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .responsive-cards-container {
            grid-template-columns: repeat(4, 1fr) !important;
          }
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
        <h1>DAILY EXPENSE TRACKER</h1>
      </header>

      <div
        style={{
          ...formGridStyles,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s",
        }}
        className="responsive-form-grid"
      >
        <div style={formGroupStyles} className="animate-slide-left">
          <label style={labelStyle}>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setDescription(e.target.value)
            }
            placeholder="Expense description"
            style={inputStyles}
            className="form-input-animate hover-shimmer"
            onKeyPress={(e) => {
              if (e.key === "Enter") addExpense();
            }}
          />
        </div>

        <div style={formGroupStyles} className="animate-slide-left">
          <label style={labelStyle}>Amount (PKR)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setAmount(e.target.value)
            }
            placeholder="Enter amount"
            style={inputStyles}
            className="form-input-animate hover-shimmer"
            onKeyPress={(e) => {
              if (e.key === "Enter") addExpense();
            }}
          />
        </div>

        <div style={formGroupStyles} className="animate-slide-right">
          <label style={labelStyle}>Category</label>
          <select
            value={category}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setCategory(e.target.value)
            }
            style={inputStyles}
            className="form-input-animate hover-shimmer"
          >
            <option value="supplies">Supplies</option>
            <option value="rent">Rent</option>
            <option value="utilities">Utilities</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div
        style={{
          ...actionButtonsStyles,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s",
        }}
        className="responsive-action-buttons"
      >
        <button
          onClick={addExpense}
          style={successButtonStyles}
          className="button-animate hover-shimmer animate-pulse-once"
        >
          Add Expense
        </button>
        <button
          onClick={deleteAllExpenses}
          style={dangerButtonStyles}
          className="button-animate hover-shimmer"
        >
          Delete All Expenses
        </button>
      </div>

      <div
        style={{
          ...totalStyles,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s",
        }}
        className="total-counter"
      >
        <h3>
          Total Expenses:{" "}
          <span style={{ color: "#ff7e5f", fontWeight: "700" }}>
            {totalExpenses.toFixed(2)} PKR
          </span>
        </h3>
      </div>

      <div style={cardsContainerStyles} className="responsive-cards-container">
        {expenses.length === 0 ? (
          <div style={emptyStateStyles} className="empty-state-animate">
            <h3>No Expenses Recorded Yet</h3>
            <p>Add your first expense to get started!</p>
            <div
              style={{
                fontSize: "3rem",
                margin: "20px 0",
                opacity: 0.7,
                animation: "float 3s ease-in-out infinite",
              }}
            >
              💸
            </div>
          </div>
        ) : (
          expenses.map((expense, index) => (
            <div
              key={index}
              id={`expense-${index}`}
              style={{
                ...cardStyles,
                borderTop: `4px solid ${getCategoryColor(expense.category)}`,
                animationDelay: `${index * 0.1}s`,
              }}
              className="expense-card animate-fade-in-up"
            >
              <h3 style={cardTitleStyle}>{expense.description}</h3>
              <p>
                <span style={labelStyles}>Amount:</span>{" "}
                <span style={{ fontWeight: "700", color: "#ff7e5f" }}>
                  {expense.amount.toFixed(2)} PKR
                </span>
              </p>
              <p>
                <span style={labelStyles}>Category:</span>{" "}
                <span style={getCategoryBadgeStyle(expense.category)}>
                  {expense.category}
                </span>
              </p>
              <p style={timestampStyles}>
                Added: {new Date(expense.timestamp).toLocaleString()}
              </p>
              <button
                onClick={() => deleteExpense(index)}
                style={deleteButtonStyles}
                className="button-animate hover-shimmer"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Helper function to get category color
const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    supplies: "#ff7e5f",
    rent: "#6a5acd",
    utilities: "#20b2aa",
    maintenance: "#ffa500",
    other: "#9b59b6",
  };
  return colors[category] || "#ff7e5f";
};

// Helper function to get category badge style
const getCategoryBadgeStyle = (category: string): React.CSSProperties => ({
  backgroundColor: getCategoryColor(category) + "20",
  color: getCategoryColor(category),
  padding: "2px 8px",
  borderRadius: "12px",
  fontSize: "0.85rem",
  fontWeight: "600",
  display: "inline-block",
});

// Converted Styles - Keeping exact same styling and spacing
const containerStyles: React.CSSProperties = {
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "20px",
};

const headerStyles: React.CSSProperties = {
  textAlign: "center",
  padding: "20px 0",
  marginBottom: "30px",
  background: "linear-gradient(135deg, #ff7e5f, #feb47b)",
  color: "white",
  borderRadius: "12px",
  boxShadow: "0 8px 25px rgba(255, 126, 95, 0.3)",
};

const formGridStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
  marginBottom: "30px",
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.08)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
};

const formGroupStyles: React.CSSProperties = {
  marginBottom: "15px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "600",
  color: "#333",
  fontSize: "0.95rem",
};

const inputStyles: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  fontSize: "1rem",
  border: "2px solid #e1e5e9",
  borderRadius: "10px",
  boxSizing: "border-box" as const,
  backgroundColor: "white",
};

const actionButtonsStyles: React.CSSProperties = {
  display: "flex",
  gap: "15px",
  marginBottom: "30px",
};

const successButtonStyles: React.CSSProperties = {
  padding: "16px 24px",
  backgroundColor: "#28a745",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "1.1rem",
  flex: 1,
  fontWeight: "600",
};

const dangerButtonStyles: React.CSSProperties = {
  padding: "16px 24px",
  backgroundColor: "#dc3545",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "1.1rem",
  flex: 1,
  fontWeight: "600",
};

const totalStyles: React.CSSProperties = {
  padding: "20px",
  backgroundColor: "rgba(255, 126, 95, 0.1)",
  borderRadius: "12px",
  marginBottom: "30px",
  textAlign: "center",
  border: "2px dashed rgba(255, 126, 95, 0.3)",
};

const cardsContainerStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "25px",
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

const cardTitleStyle: React.CSSProperties = {
  margin: "0 0 15px 0",
  fontSize: "1.25rem",
  fontWeight: "700",
  color: "#2c3e50",
};

const labelStyles: React.CSSProperties = {
  fontWeight: "600",
  color: "#555",
  display: "inline-block",
  minWidth: "80px",
};

const timestampStyles: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#777",
  marginTop: "15px",
  paddingTop: "15px",
  borderTop: "1px dashed #e1e5e9",
};

const deleteButtonStyles: React.CSSProperties = {
  position: "absolute",
  bottom: "20px",
  right: "20px",
  padding: "8px 16px",
  fontSize: "0.9rem",
  backgroundColor: "rgba(220, 53, 69, 0.1)",
  color: "#dc3545",
  border: "2px solid #dc3545",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const emptyStateStyles: React.CSSProperties = {
  textAlign: "center",
  padding: "60px 40px",
  color: "#666",
  backgroundColor: "rgba(255, 126, 95, 0.05)",
  borderRadius: "15px",
  gridColumn: "1 / -1",
  border: "2px dashed rgba(255, 126, 95, 0.3)",
};
