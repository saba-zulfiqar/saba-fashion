// Collection listing page. Shown when a customer clicks one of the four
// "Signature Collections" cards on the About page. Products are loaded live
// from the API (MongoDB) so anything the admin adds appears automatically.
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, AlertCircle, CheckCircle } from "lucide-react";
import { api, assetUrl } from "../lib/api";
import { money } from "../lib/format";
import { useCart } from "../context/CartContext";

const COLLECTIONS = {
  silk: {
    title: "Luxury Silk",
    sub: "Hand-finished raw silk and tissue suits with delicate tilla detail.",
    categories: ["silk"],
  },
  summer: {
    title: "Summer Lawn",
    sub: "Breezy lawn and chiffon ensembles tailored for summer days.",
    categories: ["summer"],
  },
  embroidery: {
    title: "Hand Embroidery",
    sub: "Intricate zardozi and thread embroidery for festive events.",
    categories: ["embroidery"],
  },
  "casual-printed": {
    title: "Casual & Printed",
    sub: "Vibrant everyday pret created for comfort and versatile style.",
    categories: ["casual", "printed"],
  },
};

function discountedPrice(product) {
  const discount = Number(product.discount) || 0;
  if (discount <= 0 || discount >= 100) return product.price;
  return Math.round((product.price * (100 - discount)) / 100);
}

export default function CollectionPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const cart = useCart();

  const meta = COLLECTIONS[slug];
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedId, setAddedId] = useState("");

  useEffect(() => {
    if (!meta) return;
    let active = true;
    setLoading(true);
    setError("");
    Promise.all(meta.categories.map((c) => api(`/api/products?category=${c}`)))
      .then((results) => {
        if (!active) return;
        const list = results.flat().filter(Boolean);
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setProducts(list);
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load this collection.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (!meta) {
    return (
      <div className="page container">
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }} onClick={() => navigate("/about")}>
          <ArrowLeft size={16} /> Back to About
        </button>
        <div className="error-box" style={{ maxWidth: 520, margin: "20px auto" }}>
          <AlertCircle size={20} />
          This collection does not exist.
        </div>
      </div>
    );
  }

  function addToCart(product) {
    if (product.stock <= 0) return;
    cart.addItem(product, { size: product.sizes?.[0] || "", qty: 1 });
    setAddedId(product._id);
    setTimeout(() => setAddedId(""), 2500);
  }

  return (
    <div className="page container">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate("/about")}>
        <ArrowLeft size={16} /> Back to About
      </button>

      <h1 className="page-title">{meta.title}</h1>
      <p className="page-sub">{meta.sub}</p>

      {error ? (
        <div className="error-box" style={{ maxWidth: 520 }}>
          <AlertCircle size={20} />
          {error}
        </div>
      ) : loading ? (
        <div className="spinner" />
      ) : products.length === 0 ? (
        <div className="empty-state">No products in this collection yet.</div>
      ) : (
        <>
          <p className="page-sub" style={{ marginBottom: 24 }}>
            {products.length} {products.length === 1 ? "item" : "items"}
          </p>
          <div className="grid">
            {products.map((p) => {
              const out = (p.stock ?? 0) <= 0;
              const discount = Number(p.discount) || 0;
              const price = discountedPrice(p);
              return (
                <article
                  key={p._id}
                  className="card collection-card"
                  onClick={() => navigate(`/product/${p._id}`)}
                >
                  <div className="card-media">
                    <img src={assetUrl(p.images?.[0])} alt={p.name} loading="lazy" />
                    {discount > 0 && (
                      <span className="discount-badge">-{Math.round(discount)}%</span>
                    )}
                    {out && <span className="out-of-stock">Out of stock</span>}
                  </div>
                  <div className="card-body">
                    <h3 className="card-name">{p.name}</h3>
                    <div className="collection-price-row">
                      {discount > 0 && <span className="old-price">{money(p.price)}</span>}
                      <span className="card-price">{money(price)}</span>
                    </div>
                    <p className="collection-desc">
                      {p.description || "Premium Pakistani outfit crafted with care and elegance."}
                    </p>
                    <button
                      className="btn btn-dark collection-add"
                      disabled={out}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(p);
                      }}
                    >
                      <ShoppingBag size={15} /> {addedId === p._id ? "Added" : "Add to Cart"}
                    </button>
                    {addedId === p._id && (
                      <span className="added-note">
                        <CheckCircle size={13} /> Added to bag
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
