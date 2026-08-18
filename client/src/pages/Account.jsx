// Customer Login / Signup page.
// Redirects customers straight to the Home page after successful signup/login.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Account() {
  const { login, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      if (isAdmin) navigate("/admin", { replace: true });
      else navigate("/", { replace: true });
    }
  }, [user, isAdmin, navigate]);

  if (user) return null;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        const data = await api("/api/auth/login", {
          method: "POST",
          body: { email: form.email, password: form.password },
        });
        login(data.token, data.user);
        if (data.user.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        if (!form.name.trim()) throw new Error("Please enter your full name.");
        if (form.password.length < 6)
          throw new Error("Password must be at least 6 characters.");
        if (form.password !== form.confirmPassword)
          throw new Error("Passwords do not match.");
        const data = await api("/api/auth/signup", {
          method: "POST",
          body: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            address: form.address,
            city: form.city,
          },
        });
        login(data.token, data.user);
        // Requirement 9: When a new customer registers, redirect them straight to the Home page after successful signup
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="page-title" style={{ fontSize: 28 }}>
          {mode === "login" ? "Customer Sign In" : "Create Account"}
        </h1>
        <p className="page-sub">Saba Fashion Customer Portal</p>

        <div className="tabs">
          <button
            className={`tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            className={`tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={submit} autoComplete="off">
          {mode === "signup" && (
            <div className="field">
              <label className="field-label">Full Name *</label>
              <input
                value={form.name}
                onChange={set("name")}
                placeholder="Enter name"
                autoComplete="off"
                required
              />
            </div>
          )}
          <div className="field">
            <label className="field-label">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="Enter email"
              autoComplete="off"
              required
            />
          </div>
          <div className="field">
            <label className="field-label">Password *</label>
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="Enter your password"
              autoComplete="new-password"
              required
            />
          </div>
          {mode === "signup" && (
            <>
              <div className="field">
                <label className="field-label">Confirm Password *</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="field">
                <label className="field-label">Phone *</label>
                <input
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="03xx xxxxxxx"
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label className="field-label">City</label>
                  <input
                    value={form.city}
                    onChange={set("city")}
                    placeholder="Karachi"
                  />
                </div>
                <div className="field">
                  <label className="field-label">Address *</label>
                  <input
                    value={form.address}
                    onChange={set("address")}
                    placeholder="House, street..."
                  />
                </div>
              </div>
            </>
          )}
          <button className="btn btn-dark btn-lg btn-block" disabled={busy}>
            {busy
              ? "Please wait..."
              : mode === "login"
              ? "Sign In & Continue"
              : "Register & Start Shopping"}
          </button>
        </form>

        <div
          className="demo-box"
          style={{ marginTop: 24, textAlign: "center" }}
        >
          <div style={{ marginTop: 10, fontSize: 13 }}>
            Store Administrator?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/admin/login");
              }}
              style={{ color: "var(--accent)", fontWeight: "bold" }}
            >
              Go to Admin Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
