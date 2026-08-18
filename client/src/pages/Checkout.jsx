import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";
import { api, assetUrl } from "../lib/api";
import { money } from "../lib/format";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Checkout() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
  });

  // Payment selection: "cod" | "card" | "easypaisa" | "jazzcash"
  const [payMethod, setPayMethod] = useState("cod");

  // Card details state
  const [cardForm, setCardForm] = useState({
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  // Easypaisa / JazzCash account state
  const [walletForm, setWalletForm] = useState({
    accountNumber: "",
    accountName: "",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Prefill logged-in user details if available
  useEffect(() => {
    if (user) {
      setCustomerForm((f) => ({
        ...f,
        name: f.name || user.name || "",
        email: f.email || user.email || "",
        phone: f.phone || user.phone || "",
        address: f.address || user.address || "",
        city: f.city || user.city || "",
      }));
    }
  }, [user]);

  function handleCardNumberChange(e) {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 16) val = val.slice(0, 16);
    // Format into groups of 4
    const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
    setCardForm({ ...cardForm, cardNumber: formatted });
  }

  function handleExpiryChange(e) {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardForm({ ...cardForm, expiry: val });
  }

  function handleCvvChange(e) {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 4) val = val.slice(0, 4);
    setCardForm({ ...cardForm, cvv: val });
  }

  function validateCheckout() {
    const errs = {};
    if (!customerForm.name.trim()) errs.name = "Full name is required.";
    if (!customerForm.phone.trim()) errs.phone = "Phone number is required.";
    if (!customerForm.address.trim()) errs.address = "Shipping address is required.";
    if (!customerForm.city.trim()) errs.city = "City is required.";

    if (payMethod === "card") {
      const rawCard = cardForm.cardNumber.replace(/\s/g, "");
      if (!cardForm.cardholderName.trim()) errs.cardholderName = "Cardholder name is required.";
      if (!rawCard || rawCard.length < 15) errs.cardNumber = "Valid 16-digit card number is required.";
      if (!cardForm.expiry || !/^\d{2}\/\d{2}$/.test(cardForm.expiry)) errs.expiry = "Expiry date format MM/YY is required.";
      if (!cardForm.cvv || cardForm.cvv.length < 3) errs.cvv = "3 or 4 digit CVV is required.";
    } else if (payMethod === "easypaisa" || payMethod === "jazzcash") {
      if (!walletForm.accountNumber.trim() || walletForm.accountNumber.length < 10) {
        errs.accountNumber = `Valid ${payMethod === "easypaisa" ? "Easypaisa" : "JazzCash"} mobile/account number is required.`;
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setError("");

    if (cart.items.length === 0) {
      setError("Your shopping bag is empty.");
      return;
    }

    if (!validateCheckout()) {
      setError("Please fix the highlighted errors before placing your order.");
      return;
    }

    // Construct backend payload (NEVER including CVV or raw card details!)
    const payload = {
      items: cart.items.map((it) => ({
        product: it.id,
        size: it.size,
        quantity: it.qty,
        price: it.price,
      })),
      customer: {
        name: customerForm.name.trim(),
        email: customerForm.email.trim() || undefined,
        phone: customerForm.phone.trim(),
        address: customerForm.address.trim(),
        city: customerForm.city.trim(),
        province: customerForm.province.trim(),
        postalCode: customerForm.postalCode.trim(),
      },
      paymentMethod: payMethod,
    };

    setBusy(true);
    try {
      const data = await api("/api/orders", { method: "POST", body: payload });
      cart.clearCart();
      navigate(`/order-success/${data.order._id || data.order.orderNumber}`, {
        state: { order: data.order },
      });
    } catch (err) {
      setError(err.message || "Could not place order. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="page container">
        <div className="empty-state">
          <ShoppingBag size={48} color="#a9615a" />
          <h2>Your bag is empty</h2>
          <p>Please add items to your bag before checking out.</p>
          <button className="btn btn-dark" onClick={() => navigate("/")}>
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page container">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate("/cart")}>
        <ArrowLeft size={16} /> Return to Bag
      </button>

      <h1 className="page-title">Checkout</h1>
      <p className="page-sub">Complete your customer and delivery details to place your order.</p>

      {error && <div className="error-box" style={{ marginBottom: 20 }}>{error}</div>}

      <div className="checkout-layout">
        <form onSubmit={handlePlaceOrder}>
          {/* SECTION 1: CUSTOMER INFORMATION */}
          <div className="form-section" style={{ background: "#fff", padding: 24, borderRadius: 14, border: "1px solid #eee4de", marginBottom: 24 }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: 20, margin: "0 0 16px" }}>1. Customer Information</h3>
            <div className="field">
              <label className="field-label">Full Name *</label>
              <input
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                placeholder="Enter name"
              />
              {fieldErrors.name && <span className="field-err">{fieldErrors.name}</span>}
            </div>
            <div className="field-row">
              <div className="field">
                <label className="field-label">Phone Number *</label>
                <input
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
                {fieldErrors.phone && <span className="field-err">{fieldErrors.phone}</span>}
              </div>
              <div className="field">
                <label className="field-label">Email Address (optional)</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: SHIPPING INFORMATION */}
          <div className="form-section" style={{ background: "#fff", padding: 24, borderRadius: 14, border: "1px solid #eee4de", marginBottom: 24 }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: 20, margin: "0 0 16px" }}>2. Shipping Address</h3>
            <div className="field">
              <label className="field-label">Street Address *</label>
              <textarea
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                placeholder="House / Flat #, Street name, Block / Area..."
              />
              {fieldErrors.address && <span className="field-err">{fieldErrors.address}</span>}
            </div>
            <div className="field-row">
              <div className="field">
                <label className="field-label">City *</label>
                <input
                  value={customerForm.city}
                  onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                />
                {fieldErrors.city && <span className="field-err">{fieldErrors.city}</span>}
              </div>
              <div className="field">
                <label className="field-label">Province</label>
                <input
                  value={customerForm.province}
                  onChange={(e) => setCustomerForm({ ...customerForm, province: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field-label">Postal Code</label>
                <input
                  value={customerForm.postalCode}
                  onChange={(e) => setCustomerForm({ ...customerForm, postalCode: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: PAYMENT METHOD */}
          <div className="form-section" style={{ background: "#fff", padding: 24, borderRadius: 14, border: "1px solid #eee4de", marginBottom: 24 }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: 20, margin: "0 0 16px" }}>3. Select Payment Method</h3>
            
            <div className="pay-methods" style={{ display: "grid", gap: 12, marginBottom: 20 }}>
              {/* COD */}
              <label className={`pay-method ${payMethod === "cod" ? "selected" : ""}`}>
                <input type="radio" name="pay" checked={payMethod === "cod"} onChange={() => setPayMethod("cod")} />
                <Banknote size={22} color="#4f7a5b" />
                <div>
                  <div className="pm-label">Cash on Delivery (COD)</div>
                  <div className="pm-hint">Pay cash when your order is delivered to your doorstep</div>
                </div>
              </label>

              {/* CARD */}
              <label className={`pay-method ${payMethod === "card" ? "selected" : ""}`}>
                <input type="radio" name="pay" checked={payMethod === "card"} onChange={() => setPayMethod("card")} />
                <CreditCard size={22} color="#a9615a" />
                <div>
                  <div className="pm-label">Credit / Debit Card</div>
                  <div className="pm-hint">Visa, Mastercard, UnionPay</div>
                </div>
              </label>

              {/* EASYPAISA */}
              <label className={`pay-method ${payMethod === "easypaisa" ? "selected" : ""}`}>
                <input type="radio" name="pay" checked={payMethod === "easypaisa"} onChange={() => setPayMethod("easypaisa")} />
                <Smartphone size={22} color="#2b7d5f" />
                <div>
                  <div className="pm-label">Easypaisa</div>
                  <div className="pm-hint">Pay via Easypaisa Mobile Wallet</div>
                </div>
              </label>

              {/* JAZZCASH */}
              <label className={`pay-method ${payMethod === "jazzcash" ? "selected" : ""}`}>
                <input type="radio" name="pay" checked={payMethod === "jazzcash"} onChange={() => setPayMethod("jazzcash")} />
                <Smartphone size={22} color="#b0493f" />
                <div>
                  <div className="pm-label">JazzCash</div>
                  <div className="pm-hint">Pay via JazzCash Mobile Wallet</div>
                </div>
              </label>
            </div>

            {/* CARD DETAILS FORM */}
            {payMethod === "card" && (
              <div style={{ background: "#faf5f1", padding: 20, borderRadius: 12, border: "1px solid #eee4de", marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8a7f79", fontSize: 13, marginBottom: 14 }}>
                  <ShieldCheck size={16} color="#4f7a5b" />
                  <span>Demo Card Payment UI. CVV & Full Card Numbers are NEVER saved.</span>
                </div>
                <div className="field">
                  <label className="field-label">Cardholder Name *</label>
                  <input
                    value={cardForm.cardholderName}
                    onChange={(e) => setCardForm({ ...cardForm, cardholderName: e.target.value })}
                  />
                  {fieldErrors.cardholderName && <span className="field-err">{fieldErrors.cardholderName}</span>}
                </div>
                <div className="field">
                  <label className="field-label">Card Number *</label>
                  <input
                    value={cardForm.cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                  />
                  {fieldErrors.cardNumber && <span className="field-err">{fieldErrors.cardNumber}</span>}
                </div>
                <div className="field-row">
                  <div className="field">
                    <label className="field-label">Expiry Date *</label>
                    <input
                      value={cardForm.expiry}
                      onChange={handleExpiryChange}
                      maxLength={5}
                    />
                    {fieldErrors.expiry && <span className="field-err">{fieldErrors.expiry}</span>}
                  </div>
                  <div className="field">
                    <label className="field-label">CVV *</label>
                    <input
                      type="password"
                      value={cardForm.cvv}
                      onChange={handleCvvChange}
                      maxLength={4}
                    />
                    {fieldErrors.cvv && <span className="field-err">{fieldErrors.cvv}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* EASYPAISA FORM */}
            {payMethod === "easypaisa" && (
              <div style={{ background: "#eef7f2", padding: 20, borderRadius: 12, border: "1px solid #c2e5cc", marginTop: 16 }}>
                <h4 style={{ margin: "0 0 10px", color: "#2b7d5f" }}>Easypaisa Account Details</h4>
                <div className="field">
                  <label className="field-label">Easypaisa Mobile Number *</label>
                  <input
                    value={walletForm.accountNumber}
                    onChange={(e) => setWalletForm({ ...walletForm, accountNumber: e.target.value })}
                    placeholder="03xx xxxxxxx"
                  />
                  {fieldErrors.accountNumber && <span className="field-err">{fieldErrors.accountNumber}</span>}
                </div>
                <div className="field">
                  <label className="field-label">Account Title (optional)</label>
                  <input
                    value={walletForm.accountName}
                    onChange={(e) => setWalletForm({ ...walletForm, accountName: e.target.value })}
                    placeholder="Account holder name"
                  />
                </div>
                <div className="notice" style={{ fontSize: 12, background: "#fff", color: "#2b7d5f" }}>
                  Easypaisa Gateway Integration Pending (Demo Checkout Mode).
                </div>
              </div>
            )}

            {/* JAZZCASH FORM */}
            {payMethod === "jazzcash" && (
              <div style={{ background: "#fdf2f2", padding: 20, borderRadius: 12, border: "1px solid #f3c9c2", marginTop: 16 }}>
                <h4 style={{ margin: "0 0 10px", color: "#b0493f" }}>JazzCash Account Details</h4>
                <div className="field">
                  <label className="field-label">JazzCash Mobile Number *</label>
                  <input
                    value={walletForm.accountNumber}
                    onChange={(e) => setWalletForm({ ...walletForm, accountNumber: e.target.value })}
                    placeholder="03xx xxxxxxx"
                  />
                  {fieldErrors.accountNumber && <span className="field-err">{fieldErrors.accountNumber}</span>}
                </div>
                <div className="field">
                  <label className="field-label">Account Title (optional)</label>
                  <input
                    value={walletForm.accountName}
                    onChange={(e) => setWalletForm({ ...walletForm, accountName: e.target.value })}
                    placeholder="Account holder name"
                  />
                </div>
                <div className="notice" style={{ fontSize: 12, background: "#fff", color: "#b0493f" }}>
                  JazzCash Gateway Integration Pending (Demo Checkout Mode).
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: PLACE ORDER BUTTON */}
          {error && (
            <div className="error-box" style={{ marginBottom: 14 }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-accent btn-lg btn-block" disabled={busy} style={{ fontSize: 16, padding: "16px 30px" }}>
            {busy ? "Creating Order..." : `PLACE ORDER — ${money(cart.total)}`}
          </button>
        </form>

        {/* ORDER REVIEW ASIDE */}
        <aside className="summary-card" style={{ height: "fit-content" }}>
          <h3 style={{ fontFamily: "Georgia, serif", marginTop: 0 }}>Order Review</h3>
          <div className="cart-items" style={{ maxHeight: 280, overflowY: "auto", marginBottom: 16 }}>
            {cart.items.map((it, i) => (
              <div className="cart-row" key={i} style={{ padding: "8px 0" }}>
                <img src={assetUrl(it.image)} alt={it.name} style={{ width: 44, height: 58 }} />
                <div className="cr-info">
                  <p className="cr-name" style={{ fontSize: 13 }}>{it.name}</p>
                  <p className="cr-meta" style={{ fontSize: 12 }}>Size: {it.size || "Free"} | Qty: {it.qty}</p>
                </div>
                <div className="cr-price" style={{ fontSize: 13 }}>{money(it.price * it.qty)}</div>
              </div>
            ))}
          </div>

          <div className="summary-row"><span>Subtotal ({cart.count} items)</span><span>{money(cart.subtotal)}</span></div>
          <div className="summary-row"><span>Shipping</span><span>{cart.shipping === 0 ? "Free" : money(cart.shipping)}</span></div>
          <div className="summary-row total"><span>Total</span><span>{money(cart.total)}</span></div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed #eee4de", fontSize: 13, color: "#5c524c" }}>
            <p style={{ margin: "4px 0" }}><b>Shipping to:</b> {customerForm.city || "Lahore"}, Pakistan</p>
            <p style={{ margin: "4px 0", textTransform: "capitalize" }}><b>Selected Payment:</b> {payMethod}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
