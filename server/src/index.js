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
// CLIENT_ORIGIN can hold a comma-separated list of explicit origins
// (e.g. "http://localhost:5173,http://localhost:5174,https://shop.example.com").
// Explicit origins (never "*") are required because credentials: true is set
// so cookie/token auth works; the browser only echoes the Access-Control-Allow
// -Origin header for origins that actually appear here.
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (curl, health checks, same-origin) and any
      // origin explicitly listed in CLIENT_ORIGIN.
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

// Serve uploaded product images statically. No-cache so the browser always
// picks up updated product photography rather than serving stale bytes.
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
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

// Start the server after the database is ready.
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Saba Fashion API running on http://localhost:${PORT}`));
});
