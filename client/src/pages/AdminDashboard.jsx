import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Shirt,
  ClipboardList,
  Users,
  LogOut,
  Pencil,
  Trash2,
  Plus,
  PackageX,
  ArrowLeft,
  Upload,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { api, assetUrl } from "../lib/api";
import { money, orderStatusLabel } from "../lib/format";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "products", label: "Products", icon: Shirt },
  { key: "orders", label: "Orders", icon: ClipboardList },
  { key: "customers", label: "Customers", icon: Users },
];

const EMPTY_FORM = {
  name: "",
  price: "",
  discount: "",
  category: "",
  stock: "10",
  description: "",
  sizes: "S, M, L, XL",
  status: "active",
  featured: false,
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/admin/login", { replace: true });
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="container dash-layout">
      <aside className="dash-side">
        <div className="dash-user">
          <b>{user.name}</b>
          <span>Administrator</span>
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
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </nav>
      </aside>

      <div className="dash-content">
        <div className="dash-head">
          <h2>{TABS.find((t) => t.key === tab).label}</h2>
        </div>
        {tab === "overview" && <Overview />}
        {tab === "products" && <Products />}
        {tab === "orders" && <Orders />}
        {tab === "customers" && <Customers />}
      </div>
    </div>
  );
}

/* ------------------------------ OVERVIEW ------------------------------ */
function Overview() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api("/api/admin/stats").then(setStats).catch(() => {});
  }, []);

  if (!stats) return <div className="spinner" />;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="sc-label">Revenue</div>
          <div className="sc-value">{money(stats.revenue)}</div>
          <div className="sc-sub">Collected orders</div>
        </div>
        <div className="stat-card">
          <div className="sc-label">Orders</div>
          <div className="sc-value">{stats.totalOrders}</div>
          <div className="sc-sub">{stats.pendingOrders} pending</div>
        </div>
        <div className="stat-card">
          <div className="sc-label">Products</div>
          <div className="sc-value">{stats.totalProducts}</div>
          <div className="sc-sub">{stats.lowStock} low stock</div>
        </div>
        <div className="stat-card">
          <div className="sc-label">Customers</div>
          <div className="sc-value">{stats.totalCustomers}</div>
          <div className="sc-sub">Registered users</div>
        </div>
      </div>

      {stats.lowStockItems?.length > 0 ? (
        <>
          <div className="dash-head" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 20 }}>Low Stock Alert</h2>
          </div>
          <div className="table-wrap">
            <table className="dash-table">
              <thead>
                <tr><th>Product</th><th>Stock</th><th>Price</th><th>Category</th></tr>
              </thead>
              <tbody>
                {stats.lowStockItems.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="tprod">
                        <img src={assetUrl(p.images?.[0])} alt={p.name} />
                        <b>{p.name}</b>
                      </div>
                    </td>
                    <td>
                      <span className={`tag ${p.stock <= 0 ? "cancelled" : "pending"}`}>
                        {p.stock <= 0 ? "Out" : `${p.stock} left`}
                      </span>
                    </td>
                    <td>{money(p.price)}</td>
                    <td>{p.category?.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="notice" style={{ maxWidth: 480 }}>All products are well stocked.</div>
      )}
    </div>
  );
}

/* ------------------------------ PRODUCTS ------------------------------ */
function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = closed
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api("/api/admin/products"), api("/api/categories")])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c.categories || c);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  function openNew() {
    setEditing({});
    setForm({
      ...EMPTY_FORM,
      category: categories[0]?._id || "",
    });
    setFiles([]);
    setErr("");
    setSuccessMsg("");
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      name: p.name,
      price: p.price,
      discount: p.discount || "",
      category: p.category?._id || p.category,
      stock: p.stock,
      description: p.description,
      sizes: (p.sizes || []).join(", "),
      status: p.status || (p.stock > 0 ? "active" : "out_of_stock"),
      featured: p.featured || false,
    });
    setFiles([]);
    setErr("");
    setSuccessMsg("");
  }

  function closeForm() {
    setEditing(null);
  }

  function setFile(i) {
    return (e) => {
      const next = [...files];
      next[i] = e.target.files[0];
      setFiles(next);
    };
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setSuccessMsg("");

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("price", form.price);
    if (form.discount) fd.append("discount", form.discount);
    fd.append("category", form.category);
    fd.append("stock", form.stock);
    fd.append("sizes", form.sizes);

    for (const f of files) if (f) fd.append("images", f);

    try {
      if (editing._id) {
        await api(`/api/admin/products/${editing._id}`, { method: "PATCH", body: fd });
        setSuccessMsg(`Successfully updated "${form.name}"!`);
      } else {
        await api("/api/admin/products", { method: "POST", body: fd });
        setSuccessMsg(`Successfully created product "${form.name}" in category!`);
      }
      closeForm();
      load();
    } catch (error) {
      setErr(error.message || "Failed to save product.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStock(p, delta) {
    try {
      await api(`/api/admin/products/${p._id}/stock`, {
        method: "PATCH",
        body: { stockDelta: delta },
      });
      load();
    } catch (error) {
      alert(error.message);
    }
  }

  async function remove(p) {
    if (!window.confirm(`Delete "${p.name}" permanently?`)) return;
    try {
      await api(`/api/admin/products/${p._id}`, { method: "DELETE" });
      load();
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div>
      <div className="dash-head">
        <h2 style={{ fontSize: 20 }}>{products.length} Products Total</h2>
        {!editing && (
          <button className="btn btn-accent btn-sm" onClick={openNew}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      {successMsg && (
        <div className="notice" style={{ background: "#edf7f0", borderColor: "#c2e5cc", color: "#2d6639", marginBottom: 16 }}>
          <CheckCircle size={18} style={{ verticalAlign: -3, marginRight: 8 }} />
          {successMsg}
        </div>
      )}

      {editing && (
        <div className="admin-form" style={{ background: "#fff", padding: 24, borderRadius: 14, border: "1px solid #eee4de", marginBottom: 30 }}>
          <div className="dash-head" style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: "Georgia, serif", margin: 0 }}>
              {editing._id ? `Edit Product: ${editing.name}` : "Create New Product"}
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={closeForm}>
              <ArrowLeft size={15} /> Cancel
            </button>
          </div>
          {err && <div className="error-box" style={{ marginBottom: 16 }}>{err}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label className="field-label">Product Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Royal Raw Silk Emerald Suit" />
            </div>

            <div className="field-row">
              <div className="field">
                <label className="field-label">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                  <option value="">Choose category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Price (PKR) *</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="8500" />
              </div>
              <div className="field">
                <label className="field-label">Stock Quantity *</label>
                <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required placeholder="10" />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label className="field-label">Available Sizes (comma separated)</label>
                <input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L, XL" />
              </div>
              <div className="field">
                <label className="field-label">Discount (%) (optional)</label>
                <input type="number" min="0" max="100" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="10" />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Enter detailed product description..." />
            </div>

            <span className="field-label" style={{ marginBottom: 8, display: "block" }}>
              {editing._id ? "Product Images (4 posture shots) — Optional replace" : "Product Images (4 posture shots: Front, Side, Back, Close-up)"}
            </span>
            <div className="img-upload-grid" style={{ marginBottom: 20 }}>
              {[0, 1, 2, 3].map((i) => (
                <label className="img-upload-box" key={i}>
                  {files[i] ? (
                    <img src={URL.createObjectURL(files[i])} alt={`upload ${i}`} />
                  ) : editing._id && editing.images?.[i] ? (
                    <img src={assetUrl(editing.images[i])} alt={`existing ${i}`} />
                  ) : (
                    <>
                      <Upload size={22} />
                      <span>{["Front", "Side", "Back", "Close-up"][i]}</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={setFile(i)} />
                </label>
              ))}
            </div>

            <button className="btn btn-dark btn-lg" disabled={busy}>
              {busy ? "Saving Product..." : editing._id ? "Save Changes" : "Publish Product"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Sizes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="tprod">
                      <img src={assetUrl(p.images?.[0])} alt={p.name} />
                      <div>
                        <b>{p.name}</b>
                        <span style={{ fontSize: 11, color: "#8a7f79" }}>ID: {p._id.slice(-6)}</span>
                      </div>
                    </div>
                  </td>
                  <td><b>{money(p.price)}</b></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className={`tag ${p.stock <= 0 ? "cancelled" : p.stock <= 3 ? "pending" : "delivered"}`}>
                        {p.stock}
                      </span>
                      <button className="btn btn-light btn-sm" style={{ padding: "2px 6px" }} onClick={() => changeStock(p, -1)}><ChevronDown size={12} /></button>
                      <button className="btn btn-light btn-sm" style={{ padding: "2px 6px" }} onClick={() => changeStock(p, 1)}><ChevronUp size={12} /></button>
                    </div>
                  </td>
                  <td><span className="tag" style={{ background: "#f3e3dd", color: "#8c4b45" }}>{p.category?.name || "—"}</span></td>
                  <td>{p.sizes?.join(", ") || "Free size"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-light btn-sm" onClick={() => openEdit(p)}><Pencil size={14} /></button>
                      <button className="btn btn-light btn-sm" onClick={() => remove(p)}><Trash2 size={14} color="#b0493f" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ ORDERS ------------------------------ */
const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api("/api/admin/orders")
      .then(setOrders)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function setStatus(id, status) {
    try {
      await api(`/api/admin/orders/${id}`, { method: "PATCH", body: { status } });
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !search.trim() ||
      (o.orderNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer?.phone || "").includes(search);

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="spinner" />;
  if (err) return <div className="error-box">{err}</div>;

  return (
    <div>
      {/* Search & Filter Bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <Search size={18} style={{ position: "absolute", left: 12, top: 12, color: "#8a7f79" }} />
          <input
            style={{ width: "100%", paddingLeft: 38 }}
            placeholder="Search by Order #, Customer Name, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Filter size={16} color="#8a7f79" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses ({orders.length})</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{orderStatusLabel(s)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Order detail modal / view */}
      {selectedOrder && (
        <div className="notice" style={{ background: "#fff", border: "1px solid #eee4de", padding: 20, marginBottom: 24, borderRadius: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <h3 style={{ fontFamily: "Georgia, serif", margin: "0 0 4px" }}>Order #{selectedOrder.orderNumber} Details</h3>
              <span style={{ fontSize: 13, color: "#8a7f79" }}>Placed on: {new Date(selectedOrder.createdAt).toLocaleString()}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(null)}>
              <XCircle size={16} /> Close
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 16 }}>
            <div>
              <b>Customer Info:</b>
              <div>{selectedOrder.customer?.name || selectedOrder.user?.name}</div>
              <div>{selectedOrder.customer?.phone || selectedOrder.user?.phone}</div>
              <div>{selectedOrder.customer?.email || selectedOrder.user?.email || "No email"}</div>
            </div>
            <div>
              <b>Shipping Address:</b>
              <div>{selectedOrder.customer?.address}</div>
              <div>{selectedOrder.customer?.city || "Lahore"}, {selectedOrder.customer?.province || "Punjab"} {selectedOrder.customer?.postalCode}</div>
            </div>
            <div>
              <b>Payment & Status:</b>
              <div style={{ textTransform: "capitalize" }}>Method: {selectedOrder.paymentMethod}</div>
              <div>Payment: {selectedOrder.paymentStatus}</div>
              <div style={{ marginTop: 4 }}>
                Status: 
                <select
                  className="status-select"
                  style={{ marginLeft: 6 }}
                  value={selectedOrder.status}
                  onChange={(e) => setStatus(selectedOrder._id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{orderStatusLabel(s)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <b>Items Ordered:</b>
          <div className="cart-items" style={{ marginTop: 8 }}>
            {selectedOrder.items?.map((it, i) => (
              <div key={i} className="cart-row" style={{ padding: "6px 0" }}>
                <img src={assetUrl(it.image)} alt={it.name} style={{ width: 36, height: 48 }} />
                <div className="cr-info">
                  <p className="cr-name" style={{ fontSize: 13 }}>{it.name || "Product"}</p>
                  <p className="cr-meta" style={{ fontSize: 12 }}>Size: {it.size || "Free"} | Qty: {it.quantity}</p>
                </div>
                <div className="cr-price">{money(it.price * it.quantity)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o) => (
              <tr key={o._id}>
                <td><b>{o.orderNumber}</b></td>
                <td>
                  <b>{o.customer?.name || o.user?.name || "Guest"}</b>
                  <div style={{ fontSize: 12, color: "#8a7f79" }}>{o.customer?.phone || o.user?.phone || ""}</div>
                </td>
                <td>
                  {o.items.map((it, i) => (
                    <div key={i} style={{ fontSize: 12 }}>
                      {it.name || it.product?.name || "Item"} x{it.quantity}
                      {it.size ? ` (${it.size})` : ""}
                    </div>
                  ))}
                </td>
                <td><b>{money(o.total)}</b></td>
                <td>
                  <div style={{ textTransform: "capitalize", fontWeight: 600 }}>{o.paymentMethod}</div>
                  <div style={{ fontSize: 11, color: "#8a7f79" }}>
                    {o.paymentStatus === "paid" ? "Paid" : "Pending"}
                  </div>
                </td>
                <td>
                  <select
                    className="status-select"
                    value={o.status}
                    onChange={(e) => setStatus(o._id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{orderStatusLabel(s)}</option>
                    ))}
                  </select>
                </td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-light btn-sm" onClick={() => setSelectedOrder(o)}>
                    <Eye size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ CUSTOMERS ------------------------------ */
function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/admin/customers")
      .then(setCustomers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="table-wrap">
      <table className="dash-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>City</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c._id}>
              <td><b>{c.name}</b></td>
              <td>{c.email}</td>
              <td>{c.phone || "—"}</td>
              <td>{c.city || "Lahore"}</td>
              <td>{new Date(c.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
