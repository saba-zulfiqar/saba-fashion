import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ShoppingBag, CreditCard, Banknote, Smartphone, MapPin, Phone, User } from "lucide-react";
import { money } from "../lib/format";
import { assetUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const orderData = location.state?.order;

  return (
    <div className="page container">
      <div className="summary-card" style={{ maxWidth: 680, margin: "0 auto", padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <CheckCircle2 size={56} color="#4f7a5b" style={{ margin: "0 auto 12px" }} />
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, margin: "0 0 8px" }}>
            Order Placed Successfully!
          </h1>
          <p style={{ color: "#5c524c", fontSize: 16 }}>
            Thank you for shopping with Saba Fashion. Your order reference is <b>#{orderData?.orderNumber || id}</b>.
          </p>
        </div>

        {orderData && (
          <div style={{ background: "#faf5f1", padding: 20, borderRadius: 12, marginBottom: 24 }}>
            <h3 style={{ fontFamily: "Georgia, serif", marginTop: 0, marginBottom: 14 }}>Order Summary</h3>
            <div className="cart-items" style={{ marginBottom: 16 }}>
              {orderData.items?.map((it, i) => (
                <div className="cart-row" key={i} style={{ padding: "8px 0" }}>
                  <img src={assetUrl(it.image)} alt={it.name} style={{ width: 50, height: 65 }} />
                  <div className="cr-info">
                    <p className="cr-name">{it.name}</p>
                    <p className="cr-meta">Size: {it.size || "Free size"} | Qty: {it.quantity}</p>
                  </div>
                  <div className="cr-price">{money(it.price * it.quantity)}</div>
                </div>
              ))}
            </div>

            <div className="summary-row"><span>Subtotal</span><span>{money(orderData.subtotal)}</span></div>
            <div className="summary-row"><span>Delivery Charges</span><span>{orderData.shipping === 0 ? "Free" : money(orderData.shipping)}</span></div>
            <div className="summary-row total"><span>Grand Total</span><span>{money(orderData.total)}</span></div>
          </div>
        )}

        {orderData?.customer && (
          <div style={{ background: "#ffffff", border: "1px solid #eee4de", padding: 18, borderRadius: 12, marginBottom: 24 }}>
            <h4 style={{ margin: "0 0 10px", color: "#241d1a" }}>Delivery & Customer Details</h4>
            <p style={{ margin: "4px 0", fontSize: 14, color: "#5c524c" }}>
              <User size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
              <b>Name:</b> {orderData.customer.name}
            </p>
            <p style={{ margin: "4px 0", fontSize: 14, color: "#5c524c" }}>
              <Phone size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
              <b>Phone:</b> {orderData.customer.phone}
            </p>
            <p style={{ margin: "4px 0", fontSize: 14, color: "#5c524c" }}>
              <MapPin size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
              <b>Shipping Address:</b> {orderData.customer.address}, {orderData.customer.city}
              {orderData.customer.province ? `, ${orderData.customer.province}` : ""}
              {orderData.customer.postalCode ? ` (${orderData.customer.postalCode})` : ""}
            </p>
            <p style={{ margin: "4px 0", fontSize: 14, color: "#5c524c", textTransform: "capitalize" }}>
              {orderData.paymentMethod === "cod" && <><Banknote size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> <b>Payment Method:</b> Cash on Delivery</>}
              {orderData.paymentMethod === "card" && <><CreditCard size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> <b>Payment Method:</b> Credit / Debit Card</>}
              {orderData.paymentMethod === "easypaisa" && <><Smartphone size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> <b>Payment Method:</b> Easypaisa</>}
              {orderData.paymentMethod === "jazzcash" && <><Smartphone size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> <b>Payment Method:</b> JazzCash</>}
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-dark" onClick={() => navigate("/")}>
            <ShoppingBag size={16} /> Continue Shopping
          </button>
          {user && (
            <button className="btn btn-ghost" onClick={() => navigate("/dashboard")}>
              View Order History
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
