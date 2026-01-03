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
  const [suggestedAmount, setSuggestedAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [isCredit, setIsCredit] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
  const [isAmountManuallyChanged, setIsAmountManuallyChanged] =
    useState<boolean>(false);
  const [flavor, setFlavor] = useState<string>("");

  // NEW: Add field error states
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({
    type: false,
    itemName: false,
    quantity: false,
    amount: false,
    paymentMethod: false,
    customItem: false,
    flavor: false,
    customerName: false,
    customerPhone: false,
  });

  // Flavor suggestions
  const flavorSuggestions = {
    "Pineapple Series": [
      "Pine Mango",
      "Pineapple",
      "Pine Passion",
      "Blue Pine",
      "Pine Lychee",
      "Pine Jam",
      "Pink Pine Apple",
      "Pine Bubblegum",
    ],
    "Simple Tokyo": [
      "Strawberry Litchi",
      "cranberry Raspberry",
      "Strawberry Watermelon",
      "Passion Kiwi",
      "Straw Kiwi",
      "Dragonfruit",
      "Dragon Kiwi",
      "Grapes",
      "Papaya",
      "Rose Grapes",
      "Passion",
      "Honey Peach",
      "Instant Mango",
      "Peach Watermelon",
      "Apricot",
      "Wild Blueberry",
      "Coke",
      "Green Grapes",
      "Mull Berries",
      "Grapes Litchi",
      "Watermelon Blueberry",
    ],
    "UK Salt": [
      "Pineapple Peach",
      "Pineapple mango",
      "Pineapple Passion",
      "Pineapple bubblegum",
      "Pineapple Lychee ",
      "Pineapple Guava",
      "Pineapple Grapes",
      "Pineapple",
      "Guava",
      "Watermelon Bubblegum",
      "Passion Mango",
      "Grapes",
      "Iced Blue Razz",
      "Passion Bubblegum",
    ], // Add UK Salt flavors if needed
  };

  // Refs
  const typeSelectRef = useRef<HTMLSelectElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const customItemRef = useRef<HTMLInputElement>(null);
  const customerNameRef = useRef<HTMLInputElement>(null);
  const customerPhoneRef = useRef<HTMLInputElement>(null);
  const flavorRef = useRef<HTMLInputElement>(null);
  const itemNameRef = useRef<HTMLSelectElement>(null); // Added ref for itemName select

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

  // NEW: Reset field errors when values change
  useEffect(() => {
    if (quantity) {
      setFieldErrors((prev) => ({ ...prev, quantity: false }));
    }
  }, [quantity]);

  useEffect(() => {
    if (amount) {
      setFieldErrors((prev) => ({ ...prev, amount: false }));
    }
  }, [amount]);

  useEffect(() => {
    if (type) {
      setFieldErrors((prev) => ({ ...prev, type: false }));
    }
  }, [type]);

  useEffect(() => {
    if (itemName || customItem) {
      setFieldErrors((prev) => ({
        ...prev,
        itemName: false,
        customItem: false,
      }));
    }
  }, [itemName, customItem]);

  useEffect(() => {
    if (paymentMethod) {
      setFieldErrors((prev) => ({ ...prev, paymentMethod: false }));
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (customerName) {
      setFieldErrors((prev) => ({ ...prev, customerName: false }));
    }
  }, [customerName]);

  useEffect(() => {
    if (customerPhone) {
      setFieldErrors((prev) => ({ ...prev, customerPhone: false }));
    }
  }, [customerPhone]);

  useEffect(() => {
    if (flavor) {
      setFieldErrors((prev) => ({ ...prev, flavor: false }));
    }
  }, [flavor]);

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
    setTimeout(() => {
      typeSelectRef.current?.focus();
      setIsFormVisible(true);
    }, 100);
  }, []);

  // Calculate suggested amount
  useEffect(() => {
    if (type === "refill" || type === "coil") {
      const qty = parseFloat(quantity) || 0;
      if (qty > 0) {
        const frontendMultiplier =
          FRONTEND_MULTIPLIERS[type as keyof typeof FRONTEND_MULTIPLIERS];
        const calculatedAmount = qty * frontendMultiplier;
        setSuggestedAmount(calculatedAmount.toString());

        if (!isAmountManuallyChanged && editingIndex === null) {
          setAmount(calculatedAmount.toString());
        }
      } else {
        setSuggestedAmount("");
        if (quantity === "") {
          setAmount("");
          setIsAmountManuallyChanged(false);
        }
      }
    } else {
      setSuggestedAmount("");
    }
  }, [quantity, type, editingIndex, isAmountManuallyChanged]);

  // Reset flavor when itemName changes
  useEffect(() => {
    if (type === "refill" || type === "flavourbottle") {
      setFlavor("");
    }
  }, [itemName, type]);

  // Phone validation
  const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\d{11}$/;
    return phoneRegex.test(phone.replace(/\D/g, ""));
  };

  const validateAndSaveSale = useCallback((): void => {
    // NEW: Reset all field errors
    setFieldErrors({
      type: false,
      itemName: false,
      quantity: false,
      amount: false,
      paymentMethod: false,
      customItem: false,
      flavor: false,
      customerName: false,
      customerPhone: false,
    });

    const finalItemName =
      type === "device" || type === "puff" || type === "repairing"
        ? customItem
        : itemName;
    const saleQuantity = parseFloat(quantity);
    const saleAmount = parseFloat(amount);

    let saleBackendAmount: number = 0;
    if (type === "refill") {
      saleBackendAmount = saleQuantity * BACKEND_MULTIPLIERS.refill;
    } else if (type === "coil") {
      saleBackendAmount = saleQuantity * BACKEND_MULTIPLIERS.coil;
    }

    // NEW: Comprehensive field validation with focus on missing fields
    let hasError = false;
    const newErrors = { ...fieldErrors };

    // Validate type
    if (!type.trim()) {
      newErrors.type = true;
      hasError = true;
    }

    // Validate item name
    if (type === "device" || type === "puff" || type === "repairing") {
      if (!customItem.trim()) {
        newErrors.customItem = true;
        hasError = true;
      }
    } else {
      if (!itemName.trim()) {
        newErrors.itemName = true;
        hasError = true;
      }
    }

    // Validate flavor for specific conditions
    if (
      (type === "refill" || type === "flavourbottle") &&
      (itemName === "Pineapple Series" ||
        itemName === "Simple Tokyo" ||
        itemName === "UK Salt") &&
      !flavor.trim()
    ) {
      newErrors.flavor = true;
      hasError = true;
    }

    // Validate quantity
    if (!quantity.trim() || isNaN(saleQuantity) || saleQuantity <= 0) {
      newErrors.quantity = true;
      hasError = true;
    }

    // Validate amount
    if (!amount.trim() || isNaN(saleAmount) || saleAmount <= 0) {
      newErrors.amount = true;
      hasError = true;
    }

    // Validate payment method
    if (!paymentMethod.trim()) {
      newErrors.paymentMethod = true;
      hasError = true;
    }

    // Validate credit sale details
    if (isCredit) {
      if (!customerName.trim()) {
        newErrors.customerName = true;
        hasError = true;
      }

      if (!customerPhone.trim()) {
        newErrors.customerPhone = true;
        hasError = true;
      }

      if (customerPhone && !isValidPhoneNumber(customerPhone)) {
        showModal({
          isOpen: true,
          title: "Invalid Phone Number",
          message: "Phone number must be exactly 11 digits.",
          type: "error",
        });
        customerPhoneRef.current?.focus();
        return;
      }
    }

    if (hasError) {
      setFieldErrors(newErrors);

      // Focus on first error field
      if (newErrors.type) typeSelectRef.current?.focus();
      else if (newErrors.customItem) customItemRef.current?.focus();
      else if (newErrors.itemName) itemNameRef.current?.focus();
      else if (newErrors.flavor) flavorRef.current?.focus();
      else if (newErrors.quantity) quantityRef.current?.focus();
      else if (newErrors.amount) amountRef.current?.focus();
      else if (newErrors.paymentMethod) {
        // FIXED: Properly handle the payment method field focus
        const paymentMethodElement = document.querySelector(
          'select[name="paymentMethod"]'
        ) as HTMLElement;
        paymentMethodElement?.focus();
      } else if (newErrors.customerName) customerNameRef.current?.focus();
      else if (newErrors.customerPhone) customerPhoneRef.current?.focus();

      showModal({
        isOpen: true,
        title: "Validation Error",
        message: "Please fill all required fields before saving.",
        type: "error",
      });
      return;
    }

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
    flavor,
  ]);

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 11) {
      setCustomerPhone(value);
    }
  };

  // Handle Enter key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

      if (modal.isOpen) {
        e.preventDefault();
        if (modal.type === "confirm" && modal.onConfirm) {
          modal.onConfirm();
        } else {
          hideModal();
        }
        return;
      }

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

      e.preventDefault();
      validateAndSaveSale();
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [modal.isOpen, modal.type, modal.onConfirm, validateAndSaveSale]);

  const showModal = (
    config: Omit<ModalProps, "onClose" | "onConfirm"> & {
      onConfirm?: () => void;
    }
  ) => {
    setModal({ ...config, isOpen: true });
  };

  const hideModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const updateItemField = (newType: string): void => {
    if (newType === "device" || newType === "puff" || newType === "repairing") {
      setItemName("");
      setCustomItem("");
      setFlavor("");
    } else {
      if (newType === "refill") {
        setItemName("Pineapple Series");
      } else if (newType === "flavourbottle") {
        setItemName("Pineapple Series");
      } else {
        setItemName("VMate");
      }
      setCustomItem("");
      setFlavor("");
    }

    setQuantity("");
    setAmount("");
    setSuggestedAmount("");
    setIsAmountManuallyChanged(false);
  };

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const newType = e.target.value;
    setType(newType);
    updateItemField(newType);
  };

  const handleQuantityChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setQuantity(value);
    if (value === "") {
      setAmount("");
      setIsAmountManuallyChanged(false);
    }
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setAmount(value);
    if (value !== "" && !isAmountManuallyChanged) {
      setIsAmountManuallyChanged(true);
    }
  };

  const editSale = (index: number): void => {
    const sale = sales[index];
    window.scrollTo({ top: 0, behavior: "smooth" });

    setType(sale.type);
    if (
      sale.type === "device" ||
      sale.type === "puff" ||
      sale.type === "repairing"
    ) {
      setCustomItem(sale.itemName);
      setItemName("");
      setFlavor("");
    } else {
      setItemName(sale.itemName);
      setCustomItem("");
      setFlavor(sale.flavor || "");
    }

    setQuantity(sale.quantity.toString());
    setAmount(sale.amount.toString());
    setIsAmountManuallyChanged(true);

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

    // Reset errors when editing
    setFieldErrors({
      type: false,
      itemName: false,
      quantity: false,
      amount: false,
      paymentMethod: false,
      customItem: false,
      flavor: false,
      customerName: false,
      customerPhone: false,
    });

    setTimeout(() => typeSelectRef.current?.focus(), 50);
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
    setFlavor("");
    setEditingIndex(null);
    setIsAmountManuallyChanged(false);
    // Reset errors when form is reset
    setFieldErrors({
      type: false,
      itemName: false,
      quantity: false,
      amount: false,
      paymentMethod: false,
      customItem: false,
      flavor: false,
      customerName: false,
      customerPhone: false,
    });
    setTimeout(() => typeSelectRef.current?.focus(), 50);
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
      amount: saleAmount,
      backendAmount: saleBackendAmount,
      paymentMethod,
      timestamp: new Date().toISOString(),
      isCredit,
      customerName: isCredit ? customerName.trim() : "",
      customerPhone: isCredit ? customerPhone.trim() : "",
      isPaid: !isCredit,
      flavor:
        type === "refill" || type === "flavourbottle" ? flavor : undefined,
    };

    if (isCredit && customerName && customerPhone) {
      addToCreditors(
        finalItemName,
        saleQuantity,
        saleAmount,
        customerName.trim(),
        customerPhone.trim()
      );
    }

    const updatedSales = [...sales, newSale];
    setSales(updatedSales);
    saveSales(updatedSales);
    resetForm();

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
      amount: saleAmount,
      backendAmount: saleBackendAmount,
      paymentMethod,
      timestamp: originalSale.timestamp,
      isCredit,
      customerName: isCredit ? customerName.trim() : "",
      customerPhone: isCredit ? customerPhone.trim() : "",
      isPaid: !isCredit,
      flavor:
        type === "refill" || type === "flavourbottle" ? flavor : undefined,
    };

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
    resetForm();

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
      creditor.purchases = creditor.purchases.filter(
        (p) =>
          !(
            p.itemName === originalSale.itemName &&
            p.quantity === originalSale.quantity &&
            Math.abs(p.amount - originalSale.amount) < 0.01
          )
      );

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
    if (originalSale.isCredit && updatedSale.isCredit) {
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
    } else if (originalSale.isCredit && !updatedSale.isCredit) {
      removeFromCreditors(originalSale);
    } else if (!originalSale.isCredit && updatedSale.isCredit) {
      addToCreditors(
        itemName,
        quantity,
        amount,
        updatedSale.customerName,
        updatedSale.customerPhone
      );
    }
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
        "Are you sure you want to permanently delete ALL sales? This action cannot be undone.",
      type: "confirm",
      confirmText: "Delete All",
      cancelText: "Cancel",
      onConfirm: () => {
        permanentDeleteAllSales();
        setSales([]);
        showModal({
          isOpen: true,
          title: "Success!",
          message: "All sales have been permanently deleted.",
          type: "success",
        });
      },
    });
  };

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

  const formatPaymentMethod = (method: string): string => {
    const methodMap: { [key: string]: string } = {
      cash: "Cash",
      jazzcash: "JazzCash",
      card: "Credit Card",
    };
    return methodMap[method] || method;
  };

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

  return (
    <div style={containerStyle}>
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
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .hover-grow {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-grow:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        .button-press {
          transition: transform 0.1s ease;
        }
        .button-press:active {
          transform: scale(0.95);
        }
        .card-hover {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .card-hover:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }
      `}</style>

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
            style={{
              ...inputStyle,
              borderColor: fieldErrors.type ? "#dc3545" : "#ddd",
              animation: fieldErrors.type ? "shake 0.5s ease-in-out" : "none",
            }}
            autoFocus
          >
            <option value="refill">Refill</option>
            <option value="coil">Coil</option>
            <option value="device">Device</option>
            <option value="puff">Puff</option>
            <option value="repairing">Repairing</option>
            <option value="flavourbottle">Flavour Bottle</option>
          </select>
          {fieldErrors.type && (
            <small style={errorTextStyle}>Sale type is required</small>
          )}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Item Name</label>
          {type === "device" || type === "puff" || type === "repairing" ? (
            <>
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
                style={{
                  ...inputStyle,
                  borderColor: fieldErrors.customItem ? "#dc3545" : "#ddd",
                  animation: fieldErrors.customItem
                    ? "shake 0.5s ease-in-out"
                    : "none",
                }}
              />
              {fieldErrors.customItem && (
                <small style={errorTextStyle}>Item name is required</small>
              )}
            </>
          ) : (
            <>
              <select
                ref={itemNameRef}
                value={itemName}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setItemName(e.target.value)
                }
                style={{
                  ...inputStyle,
                  borderColor: fieldErrors.itemName ? "#dc3545" : "#ddd",
                  animation: fieldErrors.itemName
                    ? "shake 0.5s ease-in-out"
                    : "none",
                }}
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
              {fieldErrors.itemName && (
                <small style={errorTextStyle}>Item selection is required</small>
              )}
            </>
          )}
        </div>

        {/* Flavor Input Field */}
        {(type === "refill" || type === "flavourbottle") &&
          (itemName === "Pineapple Series" ||
            itemName === "Simple Tokyo" ||
            itemName === "UK Salt") && (
            <div style={formGroupStyle} className="animate-slide-in-right">
              <label style={labelStyle}>Flavor Name</label>
              <input
                ref={flavorRef}
                type="text"
                value={flavor}
                required
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFlavor(e.target.value)
                }
                list="flavor-suggestions"
                placeholder="Select or type flavor name"
                style={{
                  ...inputStyle,
                  borderColor: fieldErrors.flavor ? "#dc3545" : "#ddd",
                  animation: fieldErrors.flavor
                    ? "shake 0.5s ease-in-out"
                    : "none",
                }}
              />
              <datalist id="flavor-suggestions">
                {flavorSuggestions[
                  itemName as keyof typeof flavorSuggestions
                ]?.map((flavorName, index) => (
                  <option key={index} value={flavorName} />
                ))}
              </datalist>
              {fieldErrors.flavor && (
                <small style={errorTextStyle}>Flavor name is required</small>
              )}
            </div>
          )}

        <div style={formGroupStyle}>
          <label style={labelStyle}>Quantity</label>
          <input
            ref={quantityRef}
            type="number"
            step={type === "refill" ? "0.1" : "1"}
            min="0"
            value={quantity}
            onChange={handleQuantityChange}
            placeholder="Enter quantity"
            style={{
              ...inputStyle,
              borderColor: fieldErrors.quantity ? "#dc3545" : "#ddd",
              animation: fieldErrors.quantity
                ? "shake 0.5s ease-in-out"
                : "none",
            }}
            required
          />
          {(type === "refill" || type === "coil") && quantity && (
            <small style={noteStyle}>
              Suggested: {quantity} × {type === "refill" ? "100" : "800"} ={" "}
              {suggestedAmount} PKR
              <br />
              <em>(You can change the amount below)</em>
            </small>
          )}
          {fieldErrors.quantity && (
            <small style={errorTextStyle}>Valid quantity is required</small>
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
            style={{
              ...inputStyle,
              borderColor: fieldErrors.amount ? "#dc3545" : "#ddd",
              animation: fieldErrors.amount ? "shake 0.5s ease-in-out" : "none",
            }}
            required
          />
          {(type === "refill" || type === "coil") &&
            amount &&
            suggestedAmount && (
              <small
                style={amountNoteStyle(
                  parseFloat(amount),
                  parseFloat(suggestedAmount)
                )}
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
          {fieldErrors.amount && (
            <small style={errorTextStyle}>Valid amount is required</small>
          )}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Payment Method</label>
          <select
            name="paymentMethod"
            value={paymentMethod}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setPaymentMethod(e.target.value)
            }
            style={{
              ...inputStyle,
              borderColor: fieldErrors.paymentMethod ? "#dc3545" : "#ddd",
              animation: fieldErrors.paymentMethod
                ? "shake 0.5s ease-in-out"
                : "none",
            }}
          >
            <option value="cash">Cash</option>
            <option value="jazzcash">JazzCash</option>
            <option value="card">Credit Card</option>
          </select>
          {fieldErrors.paymentMethod && (
            <small style={errorTextStyle}>Payment method is required</small>
          )}
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
                style={{
                  ...inputStyle,
                  borderColor: fieldErrors.customerName ? "#dc3545" : "#ddd",
                  animation: fieldErrors.customerName
                    ? "shake 0.5s ease-in-out"
                    : "none",
                }}
                required
              />
              {fieldErrors.customerName && (
                <small style={errorTextStyle}>Customer name is required</small>
              )}
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
                    (customerPhone && !isValidPhoneNumber(customerPhone)) ||
                    fieldErrors.customerPhone
                      ? "#dc3545"
                      : "#ddd",
                  animation:
                    (customerPhone && !isValidPhoneNumber(customerPhone)) ||
                    fieldErrors.customerPhone
                      ? "shake 0.5s ease-in-out"
                      : "none",
                }}
                maxLength={11}
                required
              />
              {customerPhone && !isValidPhoneNumber(customerPhone) && (
                <small style={errorTextStyle}>
                  Phone number must be exactly 11 digits
                </small>
              )}
              {fieldErrors.customerPhone &&
                customerPhone &&
                isValidPhoneNumber(customerPhone) && (
                  <small style={errorTextStyle}>
                    Customer phone is required
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
          className={`button-press hover-grow ${
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
            className="button-press hover-grow"
          >
            Cancel Edit
          </button>
        )}
        <button
          onClick={deleteAllSales}
          style={dangerButtonStyle}
          className="button-press hover-grow"
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
              {sale.flavor && (
                <p>
                  <span style={labelTextStyle}>Flavor:</span> {sale.flavor}
                </p>
              )}
              <p>
                <span style={labelTextStyle}>Quantity:</span> {sale.quantity}
                {(sale.type === "refill" || sale.type === "coil") && (
                  <small
                    style={{
                      marginLeft: "10px",
                      color: "#666",
                      fontSize: "0.9rem",
                    }}
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
                  className="button-press hover-grow"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteSale(index)}
                  style={deleteButtonStyle}
                  className="button-press hover-grow"
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

// NEW: Error text style
const errorTextStyle: React.CSSProperties = {
  color: "#dc3545",
  fontSize: "0.8rem",
  marginTop: "5px",
  display: "block",
  fontWeight: "500",
};

// Styles (rest of the styles remain the same)
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
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  fontSize: "1rem",
  border: "2px solid #e1e5e9",
  borderRadius: "10px",
  boxSizing: "border-box",
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
