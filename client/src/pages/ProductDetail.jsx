import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingBag, CheckCircle, AlertCircle } from "lucide-react";
import { api, assetUrl } from "../lib/api";
import { money } from "../lib/format";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";

const SWATCH = {
  Ivory: "#f5f1e6", Champagne: "#e8d5b7", Blush: "#f0c4c0", Emerald: "#2d7d5f", Teal: "#2a7f7f",
  Gold: "#c9a227", Maroon: "#6d1f2e", "Dusty Pink": "#d4a0a5", Navy: "#2b3a67", Burgundy: "#6f1d35",
  "Pearl Grey": "#d8d8d4", Sage: "#9caf88", Sapphire: "#1f4e8c", Wine: "#7a2a3a", Black: "#232323",
  "Rose Gold": "#c08d7b", Midnight: "#1e2749", Silver: "#c0c4cc", Mint: "#b5d8c3", Peach: "#f7c9a8",
  "Sky Blue": "#a8cce8", Lavender: "#c7b8e8", "Butter Yellow": "#f2e2a0", White: "#ffffff",
  Coral: "#f48a6a", Aqua: "#9fe3e0", Rose: "#e8a0b0", "Mint Green": "#9fd0a5", Periwinkle: "#a9a9e0",
  Sand: "#dcc8a0", Turquoise: "#4fb8b8", Lemon: "#f2e84e", "Ice Blue": "#d8ecf4", Pistachio: "#c3d8a0",
  Ecru: "#d9d2bf", Grey: "#9a9a9a", "Dusty Rose": "#d8a0a8", Olive: "#7d7a42", Oat: "#e2d9c0",
  Stone: "#b0a99a", Terracotta: "#c96f4a", "Off-white": "#f2efe6", Slate: "#6d7682", Camel: "#b98a5a",
  Charcoal: "#4a4a4a"
};

function swatch(color) {
  return SWATCH[color] || "#d8c4a8";
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cart = useCart();

  const [product, setProduct] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedNotice, setAddedNotice] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    api(`/api/products/${id}`)
      .then((data) => {
        const p = data.product || data;
        setProduct(p);
        setSize(p.sizes?.[0] || "");
        setColor(p.colors?.[0] || "");
        setQty(1);
        setActiveImg(0);
      })
      .catch((e) => setError(e.message || "Failed to load product details."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product?.category?.slug) return;
    api(`/api/products?category=${product.category.slug}`)
      .then((data) => {
        const products = Array.isArray(data) ? data : data.products || [];
        const related = products.filter((p) => p._id !== product._id).slice(0, 4);
        setRelatedProducts(related);
      })
      .catch(() => {});
  }, [product]);

  const availableSizes = useMemo(() => {
    const stockMap = {};
    if (product?.sizes) {
      for (const s of product.sizes) {
        const counts = cart.items
          .filter((it) => it.id === product._id && it.size === s)
          .reduce((sum, it) => sum + it.qty, 0);
        stockMap[s] = Math.max((product.stock || 0) - counts, 0);
      }
    }
    return stockMap;
  }, [product, cart.items]);

  function handleAddToCart() {
    if (!product || product.stock <= 0) return;
    if (size && availableSizes[size] <= 0) return;

    cart.addItem(product, { size, qty });
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  }

  function changeQty(delta) {
    setQty((q) => Math.max(1, Math.min(product?.stock || 1, q + delta)));
  }

  if (loading) {
    return (
      <div className="page container">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page container">
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }} onClick={() => navigate("/")}>
          <ArrowLeft size={16} /> Back to shop
        </button>
        <div className="error-box" style={{ maxWidth: 500, margin: "20px auto" }}>
          <AlertCircle size={20} />
          {error || "Product not found."}
        </div>
      </div>
    );
  }

  const out = product.stock <= 0;

  return (
    <div className="page container">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }} onClick={() => navigate("/")}>
        <ArrowLeft size={16} /> Back to shop
      </button>

      {addedNotice && (
        <div className="notice" style={{ background: "#edf7f0", borderColor: "#c2e5cc", color: "#2d6639", marginBottom: 20 }}>
          <CheckCircle size={18} style={{ verticalAlign: -3, marginRight: 8 }} />
          Added "{product.name}" to your bag!
          <button className="btn btn-dark btn-sm" style={{ marginLeft: 16 }} onClick={() => navigate("/cart")}>
            View Bag ({cart.count})
          </button>
        </div>
      )}

      <div className="product-detail">
        <div className="gallery">
          <div className="gallery-thumbs">
            {(product.images || []).map((img, i) => (
              <button
                key={i}
                className={`thumb ${i === activeImg ? "active" : ""}`}
                onClick={() => setActiveImg(i)}
              >
                <img src={assetUrl(img)} alt={`${product.name} view ${i + 1}`} />
              </button>
            ))}
          </div>
          <div className="gallery-main">
            <img src={assetUrl(product.images?.[activeImg])} alt={product.name} />
          </div>
        </div>

        <div className="detail-info">
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, margin: "0 0 10px" }}>{product.name}</h1>
          <div className="category-badge" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "#8a7f79", marginBottom: 12 }}>
            Category: {product.category?.name || "Saba Collection"}
          </div>
          <div className="detail-price">{money(product.price)}</div>
          <div className={`detail-stock ${out ? "none" : product.stock <= 5 ? "low" : "ok"}`}>
            {out ? "Out of stock" : product.stock <= 5 ? `Only ${product.stock} left` : "In stock"}
          </div>
          <p className="detail-desc">{product.description || "Premium Pakistani outfit crafted with care and elegance."}</p>

          <span className="field-label">Select Size</span>
          <div className="size-options">
            {(product.sizes || ["S", "M", "L", "XL"]).map((s) => {
              const disabled = out || (availableSizes[s] !== undefined && availableSizes[s] <= 0);
              return (
                <button
                  key={s}
                  className={`size-opt ${size === s ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                  disabled={disabled}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {product.colors?.length > 0 && (
            <>
              <span className="field-label">Colour</span>
              <div className="color-options">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    className={`color-opt ${color === c ? "selected" : ""}`}
                    title={c}
                    aria-label={`Colour ${c}`}
                    onClick={() => setColor(c)}
                    style={{ "--swatch": swatch(c) }}
                  >
                    <span className="color-dot" />
                  </button>
                ))}
                {color && <span className="color-name">{color}</span>}
              </div>
            </>
          )}

          <span className="field-label">Quantity</span>
          <div className="qty-row" style={{ marginBottom: 24 }}>
            <div className="qty-control">
              <button onClick={() => changeQty(-1)}><Minus size={15} /></button>
              <span>{qty}</span>
              <button onClick={() => changeQty(1)}><Plus size={15} /></button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-accent" disabled={out} onClick={() => { handleAddToCart(); navigate("/cart"); }}>
              <ShoppingBag size={18} /> Add to Cart
            </button>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div style={{ marginTop: 60 }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, marginBottom: 20 }}>
            More from {product.category?.name || "this"} Collection
          </h2>
          <div className="grid">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
