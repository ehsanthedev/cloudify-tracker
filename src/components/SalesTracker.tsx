"use client";
import { useState, useEffect, ChangeEvent, useRef, useCallback } from "react";
import {
  getActiveSales,
  saveSales,
  getCreditors,
  saveCreditors,
  Sale,
  Creditor,
  Purchase,
  permanentDeleteAllSales,
} from "../../lib/storage";
import Modal, { ModalProps } from "../components/Modal";

export default function SalesTracker() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [type, setType] = useState<string>("refill");
  const [itemName, setItemName] = useState<string>("Pineapple Series");
  const [customItem, setCustomItem] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [suggestedAmount, setSuggestedAmount] = useState<string>(""); // For showing suggestion
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [isCredit, setIsCredit] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);

  // Refs for form fields
  const typeSelectRef = useRef<HTMLSelectElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const customItemRef = useRef<HTMLInputElement>(null);
  const customerNameRef = useRef<HTMLInputElement>(null);
  const customerPhoneRef = useRef<HTMLInputElement>(null);

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

  // Price multipliers
  const FRONTEND_MULTIPLIERS = {
    refill: 100,
    coil: 800,
  };

  const BACKEND_MULTIPLIERS = {
    refill: 60,
    coil: 600,
  };

  useEffect(() => {
    const activeSales = getActiveSales();
    setSales(activeSales);
    // Focus on type field on initial load
    setTimeout(() => {
      typeSelectRef.current?.focus();
      setIsFormVisible(true); // Trigger form animation
    }, 100);
  }, []);

  // Update SUGGESTED amount when quantity changes for refill and coil
  useEffect(() => {
    if (type === "refill" || type === "coil") {
      const qty = parseFloat(quantity) || 0;
      if (qty > 0) {
        const frontendMultiplier =
          FRONTEND_MULTIPLIERS[type as keyof typeof FRONTEND_MULTIPLIERS];
        const calculatedAmount = qty * frontendMultiplier;
        setSuggestedAmount(calculatedAmount.toString());

        // Only auto-fill amount if it's empty (first time)
        if (!amount && editingIndex === null) {
          setAmount(calculatedAmount.toString());
        }
      } else {
        setSuggestedAmount("");
        if (!amount) {
          setAmount("");
        }
      }
    } else {
      setSuggestedAmount("");
    }
  }, [quantity, type]);

  // Phone number validation
  const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\d{11}$/;
    return phoneRegex.test(phone.replace(/\D/g, ""));
  };

  // Create stable callback for validation
  const validateAndSaveSale = useCallback((): void => {
    const finalItemName =
      type === "device" || type === "puff" || type === "repairing"
        ? customItem
        : itemName;
    const saleQuantity = parseFloat(quantity);
    const saleAmount = parseFloat(amount);

    // Calculate backend amount based on quantity and backend multipliers
    let saleBackendAmount: number = 0;
    if (type === "refill") {
      saleBackendAmount = saleQuantity * BACKEND_MULTIPLIERS.refill;
    } else if (type === "coil") {
      saleBackendAmount = saleQuantity * BACKEND_MULTIPLIERS.coil;
    }

    // Basic validation
    if (
      !finalItemName ||
      !quantity ||
      !amount ||
      isNaN(saleQuantity) ||
      saleQuantity <= 0 ||
      isNaN(saleAmount) ||
      saleAmount <= 0
    ) {
      showModal({
        isOpen: true,
        title: "Validation Error",
        message: "Please fill all required fields with valid values.",
        type: "error",
      });
      return;
    }

    // Credit sale validation
    if (isCredit) {
      // Check if customer name and phone are provided
      if (!customerName.trim() || !customerPhone.trim()) {
        showModal({
          isOpen: true,
          title: "Credit Sale Required",
          message:
            "For credit sales, both customer name and phone number are required.",
          type: "error",
        });
        return;
      }

      // Validate phone number format (exactly 11 digits)
      if (!isValidPhoneNumber(customerPhone)) {
        showModal({
          isOpen: true,
          title: "Invalid Phone Number",
          message:
            "Phone number must be exactly 11 digits (without any spaces or special characters).",
          type: "error",
        });
        return;
      }
    }

    // All validations passed, add or update the sale
    if (editingIndex !== null) {
      updateSale(saleAmount, saleBackendAmount);
    } else {
      addSale(saleAmount, saleBackendAmount);
    }
  }, [
    type,
    itemName,
    customItem,
    quantity,
    amount,
    isCredit,
    customerName,
    customerPhone,
    editingIndex,
    paymentMethod,
  ]);

  // Handle phone number input with validation
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    if (value.length <= 11) {
      setCustomerPhone(value);
    }
  };

  // Handle Enter key press
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

      // If modal is open, close it or confirm action
      if (modal.isOpen) {
        e.preventDefault();
        if (modal.type === "confirm" && modal.onConfirm) {
          modal.onConfirm();
        } else {
          hideModal();
        }
        return;
      }

      // Don't trigger if user is typing in input fields
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT")
      ) {
        const isFormField =
          activeElement.closest("form") ||
          activeElement.getAttribute("role") === "textbox" ||
          activeElement.classList.contains("form-field");

        if (!isFormField) {
          e.preventDefault();
          validateAndSaveSale();
        }
        return;
      }

      // For other cases, validate and save
      e.preventDefault();
      validateAndSaveSale();
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [modal.isOpen, modal.type, modal.onConfirm, validateAndSaveSale]);

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

  const updateItemField = (newType: string): void => {
    if (newType === "device" || newType === "puff" || newType === "repairing") {
      setItemName("");
      setCustomItem("");
    } else {
      // Set default item names based on type
      if (newType === "refill") {
        setItemName("Pineapple Series");
      } else if (newType === "flavourbottle") {
        setItemName("Pineapple Series");
      } else {
        setItemName("VMate");
      }
      setCustomItem("");
    }

    // Reset amounts when type changes
    setAmount("");
    setSuggestedAmount("");
  };

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const newType = e.target.value;
    setType(newType);
    updateItemField(newType);
  };

  const editSale = (index: number): void => {
    const sale = sales[index];

    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });

    setType(sale.type);

    // Set item name based on sale type
    if (
      sale.type === "device" ||
      sale.type === "puff" ||
      sale.type === "repairing"
    ) {
      setCustomItem(sale.itemName);
      setItemName("");
    } else {
      setItemName(sale.itemName);
      setCustomItem("");
    }

    setQuantity(sale.quantity.toString());
    setAmount(sale.amount.toString());

    // Calculate and set suggested amount for display only
    if (sale.type === "refill" || sale.type === "coil") {
      const multiplier =
        FRONTEND_MULTIPLIERS[sale.type as keyof typeof FRONTEND_MULTIPLIERS];
      setSuggestedAmount((sale.quantity * multiplier).toString());
    } else {
      setSuggestedAmount("");
    }

    setPaymentMethod(sale.paymentMethod);
    setIsCredit(sale.isCredit);
    setCustomerName(sale.customerName);
    setCustomerPhone(sale.customerPhone);
    setEditingIndex(index);

    // Focus on the type select field after a brief delay to allow state to update
    setTimeout(() => {
      typeSelectRef.current?.focus();
    }, 50);
  };

  const cancelEdit = (): void => {
    setEditingIndex(null);
    resetForm();
  };

  const resetForm = (): void => {
    setType("refill");
    setItemName("Pineapple Series");
    setCustomItem("");
    setQuantity("");
    setAmount("");
    setSuggestedAmount("");
    setPaymentMethod("cash");
    setIsCredit(false);
    setCustomerName("");
    setCustomerPhone("");
    setEditingIndex(null);

    // Focus on the type select field after reset
    setTimeout(() => {
      typeSelectRef.current?.focus();
    }, 50);
  };

  const addSale = (saleAmount: number, saleBackendAmount: number): void => {
    const finalItemName =
      type === "device" || type === "puff" || type === "repairing"
        ? customItem
        : itemName;
    const saleQuantity = parseFloat(quantity);

    const newSale: Sale = {
      type,
      itemName: finalItemName,
      quantity: saleQuantity,
      amount: saleAmount, // This is the USER-ENTERED amount
      backendAmount: saleBackendAmount, // This is auto-calculated (60/600)
      paymentMethod,
      timestamp: new Date().toISOString(),
      isCredit,
      customerName: isCredit ? customerName.trim() : "",
      customerPhone: isCredit ? customerPhone.trim() : "",
      isPaid: !isCredit,
    };

    console.log(
      "Adding sale - User Amount:",
      saleAmount,
      "Backend Amount:",
      saleBackendAmount
    );

    // If it's a credit sale, add to creditors using USER amount
    if (isCredit && customerName && customerPhone) {
      addToCreditors(
        finalItemName,
        saleQuantity,
        saleAmount, // Use user amount for creditors
        customerName.trim(),
        customerPhone.trim()
      );
    }

    const updatedSales = [...sales, newSale];
    setSales(updatedSales);
    saveSales(updatedSales);

    resetForm(); // This will reset the form and focus on type field

    showModal({
      isOpen: true,
      title: "Success!",
      message: "Sale has been added successfully.",
      type: "success",
    });
  };

  const updateSale = (saleAmount: number, saleBackendAmount: number): void => {
    if (editingIndex === null) return;

    const originalSale = sales[editingIndex];
    const finalItemName =
      type === "device" || type === "puff" || type === "repairing"
        ? customItem
        : itemName;
    const saleQuantity = parseFloat(quantity);

    const updatedSale: Sale = {
      type,
      itemName: finalItemName,
      quantity: saleQuantity,
      amount: saleAmount, // Use user-entered amount
      backendAmount: saleBackendAmount,
      paymentMethod,
      timestamp: originalSale.timestamp,
      isCredit,
      customerName: isCredit ? customerName.trim() : "",
      customerPhone: isCredit ? customerPhone.trim() : "",
      isPaid: !isCredit,
    };

    console.log(
      "Updating sale - User Amount:",
      saleAmount,
      "Backend Amount:",
      saleBackendAmount
    );

    // Handle creditor updates using USER amount
    handleCreditorUpdate(
      originalSale,
      updatedSale,
      finalItemName,
      saleQuantity,
      saleAmount
    );

    const updatedSales = [...sales];
    updatedSales[editingIndex] = updatedSale;
    setSales(updatedSales);
    saveSales(updatedSales);

    resetForm(); // This will reset the form and focus on type field

    showModal({
      isOpen: true,
      title: "Success!",
      message: "Sale has been updated successfully.",
      type: "success",
    });
  };

  const addToCreditors = (
    itemName: string,
    quantity: number,
    amount: number,
    name: string,
    phone: string
  ) => {
    const creditors: Creditor[] = getCreditors();
    const existingCreditor = creditors.find((c: Creditor) => c.phone === phone);

    const newPurchase: Purchase = {
      itemName,
      quantity,
      amount,
      date: new Date().toISOString(),
    };

    if (existingCreditor) {
      existingCreditor.amountOwed += amount;
      existingCreditor.purchases.push(newPurchase);
    } else {
      creditors.push({
        name,
        phone,
        amountOwed: amount,
        purchases: [newPurchase],
      });
    }
    saveCreditors(creditors);
  };

  const removeFromCreditors = (originalSale: Sale) => {
    if (!originalSale.isCredit || !originalSale.customerPhone) return;

    const creditors: Creditor[] = getCreditors();
    const creditorIndex = creditors.findIndex(
      (c: Creditor) => c.phone === originalSale.customerPhone
    );

    if (creditorIndex !== -1) {
      const creditor = creditors[creditorIndex];
      creditor.amountOwed -= originalSale.amount;

      // Remove the purchase
      creditor.purchases = creditor.purchases.filter(
        (p) =>
          !(
            p.itemName === originalSale.itemName &&
            p.quantity === originalSale.quantity &&
            Math.abs(p.amount - originalSale.amount) < 0.01
          )
      );

      // Remove creditor if no amount owed and no purchases
      if (creditor.amountOwed <= 0 && creditor.purchases.length === 0) {
        creditors.splice(creditorIndex, 1);
      }

      saveCreditors(creditors);
    }
  };

  const handleCreditorUpdate = (
    originalSale: Sale,
    updatedSale: Sale,
    itemName: string,
    quantity: number,
    amount: number
  ) => {
    // Case 1: Original was credit, updated is credit (same or different customer)
    if (originalSale.isCredit && updatedSale.isCredit) {
      // If customer details changed, remove from old creditor and add to new
      if (originalSale.customerPhone !== updatedSale.customerPhone) {
        removeFromCreditors(originalSale);
        addToCreditors(
          itemName,
          quantity,
          amount,
          updatedSale.customerName,
          updatedSale.customerPhone
        );
      } else {
        // Same customer, update creditor amount
        const creditors: Creditor[] = getCreditors();
        const creditor = creditors.find(
          (c: Creditor) => c.phone === originalSale.customerPhone
        );
        if (creditor) {
          creditor.amountOwed =
            creditor.amountOwed - originalSale.amount + amount;
          saveCreditors(creditors);
        }
      }
    }
    // Case 2: Original was credit, updated is cash - remove from creditors
    else if (originalSale.isCredit && !updatedSale.isCredit) {
      removeFromCreditors(originalSale);
    }
    // Case 3: Original was cash, updated is credit - add to creditors
    else if (!originalSale.isCredit && updatedSale.isCredit) {
      addToCreditors(
        itemName,
        quantity,
        amount,
        updatedSale.customerName,
        updatedSale.customerPhone
      );
    }
    // Case 4: Both cash - no creditor changes needed
  };

  const deleteSale = (index: number): void => {
    const sale = sales[index];

    showModal({
      isOpen: true,
      title: "Delete Sale",
      message: "Are you sure you want to delete this sale?",
      type: "confirm",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: () => {
        // Use soft delete instead of removing from array
        const updatedSales = sales.map((s, i) =>
          i === index
            ? { ...s, deleted: true, deletedAt: new Date().toISOString() }
            : s
        );
        setSales(updatedSales.filter((s) => !s.deleted));
        saveSales(updatedSales);

        showModal({
          isOpen: true,
          title: "Success!",
          message: "Sale has been deleted successfully.",
          type: "success",
        });
      },
    });
  };

  const deleteAllSales = (): void => {
    showModal({
      isOpen: true,
      title: "Delete All Sales",
      message:
        "Are you sure you want to permanently delete ALL sales (including deleted sales from reports)? This action cannot be undone.",
      type: "confirm",
      confirmText: "Delete All",
      cancelText: "Cancel",
      onConfirm: () => {
        // Permanently delete all sales from storage
        permanentDeleteAllSales();

        // Update state to empty array
        setSales([]);

        showModal({
          isOpen: true,
          title: "Success!",
          message: "All sales have been permanently deleted from everywhere.",
          type: "success",
        });
      },
    });
  };

  // Format sale type for display
  const formatSaleType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      refill: "Refill",
      coil: "Coil",
      device: "Device",
      puff: "Puff",
      repairing: "Repairing",
      flavourbottle: "Flavour Bottle",
    };
    return typeMap[type] || type;
  };

  // Format payment method for display
  const formatPaymentMethod = (method: string): string => {
    const methodMap: { [key: string]: string } = {
      cash: "Cash",
      jazzcash: "JazzCash",
      card: "Credit Card",
    };
    return methodMap[method] || method;
  };

  // Get border color based on sale type
  const getBorderColor = (saleType: string): string => {
    switch (saleType) {
      case "refill":
      case "flavourbottle":
        return "#ff7e5f";
      case "puff":
        return "#9c27b0";
      case "repairing":
        return "#2196f3";
      case "coil":
        return "#ff9800";
      default:
        return "#4a6fa5";
    }
  };

  // Handle amount change manually
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setAmount(e.target.value);
  };

  return (
    <div style={containerStyle}>
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
            box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
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

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.5s ease-out forwards;
        }

        .animate-pulse-once {
          animation: pulse 1.5s ease-in-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .hover-grow {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hover-grow:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
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

        .transition-all-smooth {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .transition-transform-smooth {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .transition-opacity-smooth {
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .button-press {
          transition: transform 0.1s ease;
        }

        .button-press:active {
          transform: scale(0.95);
        }

        .form-input-focus {
          transition: all 0.3s ease;
        }

        .form-input-focus:focus {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(74, 111, 165, 0.2);
        }

        .card-hover {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .card-hover:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }

        .success-highlight {
          background: linear-gradient(45deg, #28a745, #20c997);
          background-size: 200% 200%;
          animation: gradient 2s ease infinite;
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
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

      {/* Form Grid with animation */}
      <div
        style={{
          ...formGridStyle,
          opacity: isFormVisible ? 1 : 0,
          transform: isFormVisible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        className="animate-fade-in-up"
      >
        <div style={formGroupStyle}>
          <label style={labelStyle}>Sale Type</label>
          <select
            ref={typeSelectRef}
            value={type}
            onChange={handleTypeChange}
            style={inputStyle}
            autoFocus
            className="form-input-focus hover-shimmer transition-all-smooth"
          >
            <option value="refill">Refill</option>
            <option value="coil">Coil</option>
            <option value="device">Device</option>
            <option value="puff">Puff</option>
            <option value="repairing">Repairing</option>
            <option value="flavourbottle">Flavour Bottle</option>
          </select>
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Item Name</label>
          {type === "device" || type === "puff" || type === "repairing" ? (
            <input
              ref={customItemRef}
              type="text"
              value={customItem}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setCustomItem(e.target.value)
              }
              placeholder={
                type === "puff"
                  ? "Enter puff name"
                  : type === "repairing"
                  ? "Enter repair service name"
                  : "Enter device name"
              }
              style={inputStyle}
              className="form-input-focus hover-shimmer transition-all-smooth"
            />
          ) : (
            <select
              value={itemName}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setItemName(e.target.value)
              }
              style={inputStyle}
              className="form-input-focus hover-shimmer transition-all-smooth"
            >
              {type === "refill" || type === "flavourbottle" ? (
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
            step={type === "refill" ? "0.1" : "1"}
            min="0"
            value={quantity}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setQuantity(e.target.value)
            }
            placeholder="Enter quantity"
            style={inputStyle}
            required
            className="form-input-focus hover-shimmer transition-all-smooth"
          />
          {(type === "refill" || type === "coil") && quantity && (
            <small style={noteStyle}>
              Suggested: {quantity} × {type === "refill" ? "100" : "800"} ={" "}
              {suggestedAmount} PKR
              <br />
              <em>(You can change the amount below)</em>
            </small>
          )}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Amount (PKR)</label>
          <input
            ref={amountRef}
            type="number"
            step="0.01"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount"
            style={inputStyle}
            required
            className="form-input-focus hover-shimmer transition-all-smooth"
          />
          {(type === "refill" || type === "coil") &&
            amount &&
            suggestedAmount && (
              <small
                style={amountNoteStyle(
                  parseFloat(amount),
                  parseFloat(suggestedAmount)
                )}
                className="transition-opacity-smooth"
              >
                {parseFloat(amount) === parseFloat(suggestedAmount)
                  ? "✓ Using suggested amount"
                  : parseFloat(amount) < parseFloat(suggestedAmount)
                  ? `↓ Discount: ${(
                      parseFloat(suggestedAmount) - parseFloat(amount)
                    ).toFixed(2)} PKR`
                  : `↑ Extra: ${(
                      parseFloat(amount) - parseFloat(suggestedAmount)
                    ).toFixed(2)} PKR`}
              </small>
            )}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setPaymentMethod(e.target.value)
            }
            style={inputStyle}
            className="form-input-focus hover-shimmer transition-all-smooth"
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
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setIsCredit(e.target.checked)
              }
              style={checkboxStyle}
              className="transition-all-smooth"
            />
            Sell on Credit
          </label>
        </div>

        {isCredit && (
          <>
            <div style={formGroupStyle} className="animate-slide-in-right">
              <label style={labelStyle}>Customer Name *</label>
              <input
                ref={customerNameRef}
                type="text"
                value={customerName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCustomerName(e.target.value)
                }
                placeholder="Customer name"
                style={inputStyle}
                required
                className="form-input-focus hover-shimmer transition-all-smooth"
              />
            </div>
            <div style={formGroupStyle} className="animate-slide-in-right">
              <label style={labelStyle}>Customer Phone *</label>
              <input
                ref={customerPhoneRef}
                type="text"
                value={customerPhone}
                onChange={handlePhoneChange}
                placeholder="03XXXXXXXXX (11 digits)"
                style={{
                  ...inputStyle,
                  borderColor:
                    customerPhone && !isValidPhoneNumber(customerPhone)
                      ? "#dc3545"
                      : "#ddd",
                }}
                maxLength={11}
                required
                className="form-input-focus hover-shimmer transition-all-smooth"
              />
              {customerPhone && !isValidPhoneNumber(customerPhone) && (
                <small
                  style={{
                    color: "#dc3545",
                    fontSize: "0.8rem",
                    marginTop: "5px",
                    display: "block",
                  }}
                  className="animate-fade-in-up"
                >
                  Phone number must be exactly 11 digits
                </small>
              )}
            </div>
          </>
        )}
      </div>

      <div style={actionButtonsStyle} className="animate-fade-in-up">
        <button
          onClick={validateAndSaveSale}
          style={
            editingIndex !== null ? warningButtonStyle : successButtonStyle
          }
          className={`button-press hover-grow transition-all-smooth ${
            editingIndex !== null ? "animate-pulse-once" : ""
          }`}
        >
          {editingIndex !== null
            ? "Update Sale (or Press Enter)"
            : "Add New Sale (or Press Enter)"}
        </button>
        {editingIndex !== null && (
          <button
            onClick={cancelEdit}
            style={secondaryButtonStyle}
            className="button-press hover-grow transition-all-smooth"
          >
            Cancel Edit
          </button>
        )}
        <button
          onClick={deleteAllSales}
          style={dangerButtonStyle}
          className="button-press hover-grow transition-all-smooth"
        >
          Delete All Sales
        </button>
      </div>

      <div style={cardsContainerStyle}>
        {sales.length === 0 ? (
          <div style={emptyStateStyle} className="animate-float">
            <h3>No Sales Recorded Yet</h3>
            <p>Add your first sale to get started!</p>
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
          sales.map((sale, index) => (
            <div
              key={index}
              style={{
                ...cardStyle,
                borderTop: `4px solid ${getBorderColor(sale.type)}`,
                animationDelay: `${index * 0.1}s`,
              }}
              className="card-hover animate-fade-in-up"
            >
              <h3 style={cardTitleStyle}>{formatSaleType(sale.type)} Sale</h3>
              {sale.isCredit && (
                <div style={creditBadgeStyle} className="animate-pulse-once">
                  CREDIT
                </div>
              )}
              <p>
                <span style={labelTextStyle}>Item:</span> {sale.itemName}
              </p>
              <p>
                <span style={labelTextStyle}>Quantity:</span> {sale.quantity}
                {(sale.type === "refill" || sale.type === "coil") && (
                  <small
                    style={{
                      marginLeft: "10px",
                      color: "#666",
                      fontSize: "0.9rem",
                    }}
                    className="transition-opacity-smooth"
                  >
                    (Rate: {sale.amount / sale.quantity} PKR each)
                  </small>
                )}
              </p>
              <p>
                <span style={labelTextStyle}>Amount:</span>{" "}
                {sale.amount.toFixed(2)} PKR
              </p>
              <p>
                <span style={labelTextStyle}>Payment:</span>{" "}
                {formatPaymentMethod(sale.paymentMethod)}
              </p>
              {sale.isCredit && (
                <>
                  <p>
                    <span style={labelTextStyle}>Customer:</span>{" "}
                    {sale.customerName}
                  </p>
                  <p>
                    <span style={labelTextStyle}>Phone:</span>{" "}
                    {sale.customerPhone}
                  </p>
                </>
              )}
              <p style={timestampStyle}>
                Added: {new Date(sale.timestamp).toLocaleString()}
              </p>
              <div style={cardActionsStyle}>
                <button
                  onClick={() => editSale(index)}
                  style={editButtonStyle}
                  className="button-press hover-grow transition-all-smooth"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteSale(index)}
                  style={deleteButtonStyle}
                  className="button-press hover-grow transition-all-smooth"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==================== STYLES ====================
const containerStyle: React.CSSProperties = {
  padding: "1rem",
  maxWidth: "1400px",
  margin: "0 auto",
  animation: "fadeInUp 0.8s ease-out",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
  marginBottom: "30px",
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  padding: "25px",
  borderRadius: "15px",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: "15px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "600",
  color: "#333",
  fontSize: "0.95rem",
  transition: "color 0.3s ease",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  fontSize: "1rem",
  border: "2px solid #e1e5e9",
  borderRadius: "10px",
  boxSizing: "border-box" as const,
  backgroundColor: "white",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
};

const noteStyle: React.CSSProperties = {
  display: "block",
  marginTop: "8px",
  fontSize: "0.8rem",
  color: "#666",
  fontStyle: "italic",
  lineHeight: "1.4",
  opacity: 0.9,
};

const amountNoteStyle = (actual: number, suggested: number) => ({
  display: "block",
  marginTop: "8px",
  fontSize: "0.8rem",
  color:
    actual === suggested
      ? "#28a745"
      : actual < suggested
      ? "#dc3545"
      : "#ffc107",
  fontStyle: "italic",
  lineHeight: "1.4",
  fontWeight: "500",
});

const checkboxLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  cursor: "pointer",
  padding: "10px",
  borderRadius: "8px",
  transition: "all 0.3s ease",
  marginTop: "10px",
};

const checkboxStyle: React.CSSProperties = {
  width: "18px",
  height: "18px",
  cursor: "pointer",
  accentColor: "#4a6fa5",
};

const actionButtonsStyle: React.CSSProperties = {
  display: "flex",
  gap: "15px",
  marginBottom: "30px",
  flexDirection: "column",
  opacity: 0,
  animation: "fadeInUp 0.8s ease-out 0.3s forwards",
};

const successButtonStyle: React.CSSProperties = {
  padding: "16px 24px",
  backgroundColor: "#28a745",
  color: "white",
  border: "none",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "1.1rem",
  flex: 1,
  fontWeight: "600",
  letterSpacing: "0.5px",
  position: "relative",
  overflow: "hidden",
};

const warningButtonStyle: React.CSSProperties = {
  padding: "16px 24px",
  backgroundColor: "#ffc107",
  color: "black",
  border: "none",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "1.1rem",
  flex: 1,
  fontWeight: "600",
  letterSpacing: "0.5px",
  position: "relative",
  overflow: "hidden",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "16px 24px",
  backgroundColor: "#6c757d",
  color: "white",
  border: "none",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "1.1rem",
  flex: 1,
  fontWeight: "600",
  letterSpacing: "0.5px",
  position: "relative",
  overflow: "hidden",
};

const dangerButtonStyle: React.CSSProperties = {
  padding: "16px 24px",
  backgroundColor: "#dc3545",
  color: "white",
  border: "none",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "1.1rem",
  flex: 1,
  fontWeight: "600",
  letterSpacing: "0.5px",
  position: "relative",
  overflow: "hidden",
};

const cardsContainerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "25px",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "white",
  padding: "25px",
  borderRadius: "15px",
  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.08)",
  position: "relative",
  overflow: "hidden",
  opacity: 0,
  animation: "fadeInUp 0.6s ease-out forwards",
};

const cardTitleStyle: React.CSSProperties = {
  margin: "0 0 15px 0",
  fontSize: "1.3rem",
  fontWeight: "700",
  color: "#2c3e50",
};

const creditBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: "15px",
  right: "15px",
  backgroundColor: "#ffc107",
  color: "#333",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "0.75rem",
  fontWeight: "bold",
  letterSpacing: "0.5px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};

const labelTextStyle: React.CSSProperties = {
  fontWeight: "600",
  color: "#555",
  display: "inline-block",
  minWidth: "80px",
};

const timestampStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#777",
  marginTop: "20px",
  paddingTop: "15px",
  borderTop: "1px dashed #e1e5e9",
  fontStyle: "italic",
};

const cardActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  marginTop: "20px",
  justifyContent: "flex-end",
};

const editButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: "0.9rem",
  backgroundColor: "rgba(255, 193, 7, 0.1)",
  color: "#856404",
  border: "2px solid #ffc107",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  letterSpacing: "0.3px",
  transition: "all 0.3s ease",
};

const deleteButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: "0.9rem",
  backgroundColor: "rgba(220, 53, 69, 0.1)",
  color: "#dc3545",
  border: "2px solid #dc3545",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  letterSpacing: "0.3px",
  transition: "all 0.3s ease",
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "60px 40px",
  color: "#666",
  backgroundColor: "rgba(74, 111, 165, 0.03)",
  borderRadius: "20px",
  gridColumn: "1 / -1",
  border: "2px dashed #e1e5e9",
  animation: "float 6s ease-in-out infinite",
};
