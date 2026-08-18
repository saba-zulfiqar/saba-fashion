// Stripe payment routes.
const router = require("express").Router();
const payments = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

// Card checkout (guests allowed, like orders).
router.post("/checkout", (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) return protect()(req, res, () => payments.createCheckoutSession(req, res, next));
  payments.createCheckoutSession(req, res, next);
});

// Webhook receives Stripe events with a raw body (wired up in index.js).
router.post("/webhook", payments.webhook);

module.exports = router;
