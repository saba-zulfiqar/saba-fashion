// Saba Fashion API — Express server.
// Entry point: loads env, connects to MongoDB, mounts routes and starts listening.
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const catalogRoutes = require("./routes/catalogRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();

// CORS for the Vite dev server / production frontend.
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || CLIENT_ORIGINS.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);

// Mount the Stripe webhook BEFORE express.json() because Stripe needs the raw
// body to verify the signature.
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded product images statically.
// On Vercel the writable dir is /tmp; locally it's the real uploads folder.
const UPLOADS_DIR = process.env.VERCEL
  ? "/tmp/uploads"
  : path.join(__dirname, "../uploads");

app.use(
  "/uploads",
  express.static(UPLOADS_DIR, {
    etag: true,
    lastModified: true,
    setHeaders: (res) => res.setHeader("Cache-Control", "public, no-cache"),
  })
);

// Health check.
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "saba-fashion-api" }));

// API routes.
app.use("/api/auth", authRoutes);
app.use("/api", catalogRoutes);        // /api/categories, /api/products
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);

// Fallback and error handling.
app.use(notFound);
app.use(errorHandler);

// Connect to the database on every cold start (safe to call repeatedly;
// most drivers cache the connection internally).
connectDB().catch((err) => console.error("MongoDB connection error:", err));

// On Vercel, the platform imports and calls this exported app directly —
// it must NOT call app.listen(), since there's no long-running process.
// Locally (node index.js), start a normal server.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Saba Fashion API running on http://localhost:${PORT}`));
}

module.exports = app;
