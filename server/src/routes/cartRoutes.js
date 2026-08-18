// Cart routes — all require a logged-in customer (JWT).
const express = require("express");
const { protect } = require("../middleware/auth");
const cart = require("../controllers/cartController");

const router = express.Router();

router.get("/", protect(), cart.getCart);
router.put("/", protect(), cart.replaceCart);
router.post("/items", protect(), cart.addItem);
router.patch("/items/:productId", protect(), cart.updateItem);
router.delete("/items/:productId", protect(), cart.removeItem);
router.delete("/", protect(), cart.clearCart);

module.exports = router;
