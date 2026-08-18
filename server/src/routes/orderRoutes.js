// Order routes (public guest checkout + protected customer history).
const router = require("express").Router();
const orders = require("../controllers/orderController");
const { protect } = require("../middleware/auth");

// Guests and logged-in customers can both place orders; req.user is optional.
router.post("/", (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) return protect()(req, res, () => orders.createOrder(req, res, next));
  orders.createOrder(req, res, next);
});

router.get("/me", protect(), orders.myOrders);

module.exports = router;
