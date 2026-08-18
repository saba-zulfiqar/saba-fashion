// Public catalogue routes.
const router = require("express").Router();
const catalog = require("../controllers/catalogController");

router.get("/categories", catalog.getCategories);
router.get("/products", catalog.getProducts);
router.get("/products/:id", catalog.getProduct);

module.exports = router;
