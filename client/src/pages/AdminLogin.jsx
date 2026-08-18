// Admin Login page — restricted for store administrators only.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const { login, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate("/admin", { replace: true });
      } else {
        setError("Access Denied. You are logged in as a customer.");
      }
    }
  }, [user, isAdmin, navigate]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      if (data.user.role !== "admin") {
        throw new Error("Access Denied. This login is reserved for Administrator accounts only.");
      }
      login(data.token, data.user);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <ShieldCheck size={44} color="#a9615a" />
          <h1 className="page-title" style={{ fontSize: 26, margin: "10px 0 4px" }}>
            Admin Portal
          </h1>
          <p className="page-sub" style={{ margin: 0 }}>
            Management Portal — Saba Fashion Staff
          </p>
        </div>

        {error && (
          <div className="error-box" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={18} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label className="field-label">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sabafashion.com"
            />
          </div>
          <div className="field">
            <label className="field-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button className="btn btn-dark btn-lg btn-block" disabled={busy}>
            {busy ? "Authenticating..." : "Admin Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
