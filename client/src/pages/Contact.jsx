import { useState } from "react";
import { Phone, Mail, MapPin, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { api } from "../lib/api";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [sentMsg, setSentMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSentMsg("");
    setErrorMsg("");
    setDebugInfo("");

    // Frontend validation
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.subject.trim() || !form.message.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setBusy(true);

    try {
      const data = await api("/api/contact", {
        method: "POST",
        body: form,
      });

      if (data.success) {
        setSentMsg("Your message has been sent successfully.");
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        setErrorMsg("We could not send your message right now. Please try again.");
        if (data.errorDetails) setDebugInfo(data.errorDetails);
      }
    } catch (err) {
      setErrorMsg("We could not send your message right now. Please try again.");
      if (err.message) setDebugInfo(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page container">
      <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 40px" }}>
        <h1 className="page-title" style={{ marginBottom: 8 }}>Contact Saba Fashion</h1>
        <p className="page-sub">
          We would love to hear from you. Reach out to our customer care team for orders, sizing help, or custom inquiries.
        </p>
      </div>

      <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 32 }}>
        {/* Contact info card */}
        <div style={{ background: "#fff", padding: 30, borderRadius: 16, border: "1px solid #eee4de", height: "fit-content" }}>
          <div className="logo" style={{ marginBottom: 20 }}>
            SABA <span>FASHION</span>
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
            <Phone size={20} color="#a9615a" style={{ marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Phone / WhatsApp</div>
              <a href="tel:03075834975" style={{ color: "#5c524c", fontSize: 15 }}>0307-5834975</a>
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
            <Mail size={20} color="#a9615a" style={{ marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Email Address</div>
              <a href="mailto:sabazulfiqar926@gmail.com" style={{ color: "#5c524c", fontSize: 15 }}>sabazulfiqar926@gmail.com</a>
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
            <MapPin size={20} color="#a9615a" style={{ marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Location</div>
              <span style={{ color: "#5c524c", fontSize: 15 }}>Lahore, Pakistan</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", paddingTop: 16, borderTop: "1px dashed #eee4de" }}>
            <Clock size={20} color="#a9615a" style={{ marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Customer Support Hours</div>
              <span style={{ color: "#5c524c", fontSize: 14 }}>Monday – Saturday: 10:00 AM – 8:00 PM (PKT)</span>
            </div>
          </div>

          {/* Map placeholder */}
          <div style={{ marginTop: 24, background: "#faf5f1", padding: 20, borderRadius: 12, border: "1px solid #eee4de", textAlign: "center" }}>
            <MapPin size={32} color="#a9615a" style={{ margin: "0 auto 8px" }} />
            <h4 style={{ margin: "0 0 4px", fontSize: 15 }}>Lahore, Pakistan</h4>
            <p style={{ fontSize: 13, color: "#8a7f79", margin: 0 }}>Lahore, Pakistan</p>
          </div>
        </div>

        {/* Contact Form */}
        <div style={{ background: "#fff", padding: 30, borderRadius: 16, border: "1px solid #eee4de" }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: "0 0 20px" }}>Send Us a Message</h3>

          {sentMsg && (
            <div className="notice" style={{ background: "#edf7f0", borderColor: "#c2e5cc", color: "#2d6639", padding: 18, marginBottom: 20 }}>
              <CheckCircle2 size={22} style={{ verticalAlign: -4, marginRight: 8 }} />
              <b>{sentMsg}</b>
            </div>
          )}

          {errorMsg && (
            <div className="error-box" style={{ marginBottom: 20 }}>
              <AlertCircle size={18} style={{ verticalAlign: -3, marginRight: 6 }} />
              <b>{errorMsg}</b>
              {debugInfo && (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, whiteSpace: "pre-wrap" }}>
                  {debugInfo}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label">Customer Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label className="field-label">Customer Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
              <div className="field">
                <label className="field-label">Customer Phone *</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Subject *</label>
              <input
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Enter subject (e.g. Inquiry about product sizing / order status)"
              />
            </div>

            <div className="field">
              <label className="field-label">Customer Message *</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Write your message here..."
              />
            </div>

            <button type="submit" className="btn btn-accent btn-lg btn-block" disabled={busy}>
              <Send size={16} /> {busy ? "Sending Message..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
