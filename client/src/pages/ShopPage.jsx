// Shop page. Lists every product from all five categories in one place.
// Products are loaded live from the API (MongoDB) on every visit, so both
// originally seeded products and anything added later via the Admin
// Dashboard always appear together — nothing is capped or filtered out.
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { CATEGORY_META } from "../lib/categories";
import ProductCard from "../components/ProductCard";

export default function ShopPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Normalize whatever shape the API returns into a flat array so a missing
  // key can never silently empty the page (accepts arrays, {products},
  // {data: [...]}, {data: {products: [...]}}).
  const toList = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.products)) return value.products;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.data?.products)) return value.data.products;
    return [];
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [cats, prods] = await Promise.all([
        api("/api/categories"),
        api("/api/products"),
      ]);
      setCategories(toList(cats));
      setProducts(toList(prods));
    } catch (err) {
      console.error("Failed to load shop catalogue:", err);
      setError(
        "We could not load the catalogue right now. Please check that the API server is running and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const total = products.length;

  const sections = useMemo(() => {
    // Map category ids -> slugs so products whose category is returned as a
    // bare ObjectId (not populated) still land in the correct section.
    const idToSlug = {};
    for (const c of categories) {
      const slug = typeof c === "string" ? c : c?.slug;
      const id = typeof c === "string" ? null : c?._id || c?.id;
      if (slug && id) idToSlug[id] = slug;
    }
    const slugOf = (p) =>
      p.category?.slug ||
      (typeof p.category === "string" ? idToSlug[p.category] : p.category?._id ? idToSlug[p.category._id] : null);

    return Object.keys(CATEGORY_META)
      .map((slug) => {
        const items = products
          .filter((p) => slugOf(p) === slug)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return { slug, meta: CATEGORY_META[slug], items };
      })
      .filter((s) => s.items.length > 0);
  }, [products, categories]);

  return (
    <div className="page container">
      <h1 className="page-title">Shop All</h1>
      <p className="page-sub">
        Every piece across Silk, Summer, Casual, Printed & Embroidery.
      </p>

      {error ? (
        <div
          className="notice"
          style={{
            background: "#fbeeec",
            borderColor: "#f3c9c2",
            color: "#b0493f",
            maxWidth: 560,
          }}
        >
          <AlertTriangle size={18} style={{ verticalAlign: -3, marginRight: 8 }} />
          {error}
          <button
            className="btn btn-dark btn-sm"
            style={{ marginLeft: 12 }}
            onClick={loadData}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : loading ? (
        <div className="spinner" />
      ) : sections.length === 0 ? (
        <div className="empty-state">
          {categories.length === 0
            ? "No products available right now."
            : "No products found."}
        </div>
      ) : (
        <p className="page-sub" style={{ marginBottom: 28 }}>
          {total} {total === 1 ? "item" : "items"}
        </p>
      )}

      {!error &&
        !loading &&
        sections.map(({ slug, meta, items }) => (
          <section key={slug} id={`shop-section-${slug}`} className="section">
            <div className="section-head">
              <div>
                <h2>{meta.title}</h2>
                <div className="sub">{meta.sub}</div>
              </div>
            </div>
            <div className="grid">
              {items.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
