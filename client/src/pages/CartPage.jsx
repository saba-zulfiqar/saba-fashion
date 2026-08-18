import { useNavigate } from "react-router-dom";
import { ShoppingBag, Minus, Plus, Trash2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { money } from "../lib/format";
import { assetUrl } from "../lib/api";

export default function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();

  return (
    <div className="page container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Shopping Bag</h1>
          <p className="page-sub" style={{ margin: 0 }}>Review items before proceeding to checkout.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/")}>
          <ArrowLeft size={16} /> Continue Shopping
        </button>
      </div>

      {cart.items.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={48} color="#a9615a" />
          <h2 style={{ fontFamily: "Georgia, serif", margin: "14px 0 8px" }}>Your bag is empty</h2>
          <p style={{ color: "#8a7f79", marginBottom: 20 }}>Looks like you haven't added any items to your bag yet.</p>
          <button className="btn btn-dark" onClick={() => navigate("/")}>
            Explore Collections
          </button>
        </div>
      ) : (
        <div className="checkout-layout">
          <div>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: 20, marginBottom: 14 }}>
              Items ({cart.count})
            </h3>
            <div className="cart-items" style={{ marginBottom: 30 }}>
              {cart.items.map((it, i) => (
                <div className="cart-row" key={i}>
                  <img src={assetUrl(it.image)} alt={it.name} />
                  <div className="cr-info">
                    <p className="cr-name">{it.name}</p>
                    <p className="cr-meta">Size: {it.size || "Free size"}</p>
                    <p className="cr-price">{money(it.price)}</p>
                  </div>
                  <div className="cr-right">
                    <div className="qty-control">
                      <button onClick={() => cart.updateQty(it.id, it.size, it.qty - 1)}><Minus size={15} /></button>
                      <span>{it.qty}</span>
                      <button onClick={() => cart.updateQty(it.id, it.size, it.qty + 1)}><Plus size={15} /></button>
                    </div>
                    <button
                      className="remove-btn"
                      aria-label="Remove item"
                      onClick={() => cart.removeItem(it.id, it.size)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="summary-card">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal ({cart.count} items)</span>
              <span>{money(cart.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{cart.shipping === 0 ? "Free" : money(cart.shipping)}</span>
            </div>

            {cart.shipping === 0 && cart.subtotal > 0 && (
              <div className="free-ship">Free delivery unlocked!</div>
            )}
            {cart.shipping > 0 && (
              <p className="summary-note">
                Add {money(6000 - cart.subtotal)} more for free shipping.
              </p>
            )}

            <div className="summary-row total">
              <span>Total</span>
              <span>{money(cart.total)}</span>
            </div>

            <button
              className="btn btn-accent btn-lg btn-block"
              style={{ marginTop: 20 }}
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout
            </button>

            <p className="summary-note" style={{ marginTop: 16, lineHeight: 1.5 }}>
              Orders ship within 2–3 working days across Pakistan.
            </p>
            <p className="summary-note" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={14} color="#4f7a5b" /> Cash on Delivery & Card / Mobile Payments available
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
