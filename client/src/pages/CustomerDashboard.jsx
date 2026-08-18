// Customer dashboard: orders, profile, wishlist.
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  UserRound,
  Heart,
  LogOut,
  Eye,
} from "lucide-react";
import { api, assetUrl } from "../lib/api";
import { money, orderStatusLabel } from "../lib/format";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { key: "orders", label: "My Orders", icon: Package },
  { key: "profile", label: "Profile", icon: UserRound },
  { key: "wishlist", label: "Wishlist", icon: Heart },
];

export default function CustomerDashboard() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/account", { replace: true });
      return;
    }
    if (user.role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }
    setProfileForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      city: user.city || "",
    });
  }, [user, navigate]);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api("/api/orders/me").catch(() => null),
      api("/api/users/wishlist").catch(() => null),
    ])
      .then(([o, w]) => {
        setOrders(o?.orders || o || []);
        setWishlist(w?.wishlist || w || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  async function saveProfile(e) {
    e.preventDefault();
    setMsg("");
    try {
      const data = await api("/api/users/profile", {
        method: "PATCH",
        body: {
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
          address: profileForm.address,
        },
      });
      setUser(data.user);
      setMsg("Profile updated.");
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function toggleWishlist(pid) {
    const has = wishlist.some((p) => p._id === pid);
    try {
      if (has) {
        await api(`/api/users/wishlist/${pid}`, { method: "DELETE" });
      } else {
        await api("/api/users/wishlist", { method: "POST", body: { productId: pid } });
      }
      const w = await api("/api/users/wishlist");
      setWishlist(w?.wishlist || w || []);
    } catch {
      /* ignore */
    }
  }

  const ActiveIcon = TABS.find((t) => t.key === tab).icon;

  return (
    <div className="container dash-layout">
      <aside className="dash-side">
        <div className="dash-user">
          <b>{user?.name}</b>
          <span>{user?.email}</span>
        </div>
        <nav className="dash-nav">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? "active" : ""}
              onClick={() => setTab(t.key)}
            >
              <t.icon size={18} /> {t.label}
            </button>
          ))}
          <button onClick={() => { logout(); navigate("/"); }}>
            <LogOut size={18} /> Sign Out
          </button>
        </nav>
      </aside>

      <div className="dash-content">
        <div className="dash-head">
          <h2>{TABS.find((t) => t.key === tab).label}</h2>
          <ActiveIcon size={20} color="#a9615a" />
        </div>

        {tab === "orders" && (
          loading ? <div className="spinner" /> : orders.length === 0 ? (
            <div className="empty-state">
              <Package size={44} />
              <p>No orders yet.</p>
              <button className="btn btn-dark" onClick={() => navigate("/")}>Start Shopping</button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td><b>{o.orderNumber}</b></td>
                      <td>
                        {o.items.map((it, i) => (
                          <div key={i} style={{ fontSize: 12 }}>
                            {it.product?.name || "Item"} x{it.qty}
                            {it.size ? ` (${it.size})` : ""}
                          </div>
                        ))}
                      </td>
                      <td><b>{money(o.total)}</b></td>
                      <td style={{ textTransform: "capitalize" }}>{o.paymentMethod}</td>
                      <td>
                        <span className={`tag ${o.status}`}>{orderStatusLabel(o.status)}</span>
                      </td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === "profile" && (
          <div className="admin-form" style={{ maxWidth: 520 }}>
            {msg && <div className="notice" style={{ margin: "0 0 16px" }}>{msg}</div>}
            <form onSubmit={saveProfile}>
              <div className="field">
                <label className="field-label">Full Name</label>
                <input value={profileForm.name || ""} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              </div>
              <div className="field">
                <label className="field-label">Email</label>
                <input value={profileForm.email || ""} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
              </div>
              <div className="field">
                <label className="field-label">Phone</label>
                <input value={profileForm.phone || ""} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </div>
              <div className="field">
                <label className="field-label">City</label>
                <input value={profileForm.city || ""} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} />
              </div>
              <div className="field">
                <label className="field-label">Address</label>
                <textarea value={profileForm.address || ""} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
              </div>
              <button className="btn btn-dark">Save Changes</button>
            </form>
          </div>
        )}

        {tab === "wishlist" && (
          loading ? <div className="spinner" /> : wishlist.length === 0 ? (
            <div className="empty-state">
              <Heart size={44} />
              <p>Your wishlist is empty.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="dash-table">
                <thead>
                  <tr><th>Product</th><th>Price</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {wishlist.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="tprod">
                          <img src={assetUrl(p.images?.[0])} alt={p.name} />
                          <div>
                            <b>{p.name}</b>
                            <span>{p.category?.name || ""}</span>
                          </div>
                        </div>
                      </td>
                      <td>{money(p.price)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-light btn-sm" onClick={() => navigate(`/checkout?p=${p._id}`)}>
                            <Eye size={14} /> View
                          </button>
                          <button className="btn btn-light btn-sm" onClick={() => toggleWishlist(p._id)}>
                            <Heart size={14} /> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
