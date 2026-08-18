import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { api, assetUrl } from "../lib/api";
import { CATEGORY_META } from "../lib/categories";
import { sectionRefs } from "../App";
import ProductCard from "../components/ProductCard";

const HERO_SLIDES = [
  {
    img: "/images/pakistani_hero_1.jpg",
    kicker: "Luxury Silk Edit",
    title: "Luxury Pakistani Silk",
    text: "Hand-finished raw-silk suits with delicate tilla work, crafted for timeless elegance.",
  },
  {
    img: "/images/hero-2.jpg",
    kicker: "Signature Craft",
    title: "Festive Embroidered Collection",
    text: "Timeless Pakistani shalwar kameez with hand embroidery, stitched to perfection.",
  },
  {
    img: "/images/pakistani_casual_hero3.jpg",
    kicker: "Casual Summer Edit",
    title: "Casual Pakistani Lawn & Kurta",
    text: "Breezy lawn suits and casual pret in fresh vibrant prints — lightweight and made for warm days.",
  },
];

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slide, setSlide] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = (searchParams.get("q") || "").trim().toLowerCase();

  // Navbar category filter: /?s=<slug> shows ONLY that category's section.
  // Search (q) takes priority, so results still span every category.
  // /?v=all shows every section starting at the Silk section (used by the
  // "View All Categories" button so the hero banner is skipped).
  const rawSlug = searchParams.get("s");
  const activeSlug =
    rawSlug && CATEGORY_META[rawSlug] ? rawSlug : null;
  const viewAll = searchParams.get("v") === "all";
  const filterMode = !query && activeSlug && !viewAll;

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [cats, prods] = await Promise.all([
        api("/api/categories"),
        api("/api/products"),
      ]);
      setCategories(Array.isArray(cats) ? cats : cats.categories || []);
      setProducts(Array.isArray(prods) ? prods : prods.products || []);
    } catch (err) {
      console.error("Failed to load catalogue:", err);
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

  useEffect(() => {
    const t = setInterval(() => {
      setSlide((s) => (s + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(t);
  }, []);

  // Category filter: when the navbar sends us to /?s=<slug>, show only that
  // category's section and scroll it into view. Leaving filter mode (slug
  // cleared) restores every section and returns to the top. "View All
  // Categories" (/ ?v=all) instead lands at the top of the Silk section so
  // the hero banner is not shown.
  const lastSlug = useRef(null);
  useEffect(() => {
    if (loading) return;
    if (viewAll) {
      const silk =
        sectionRefs.silk || document.getElementById("section-silk");
      if (silk) {
        const nav = document.querySelector(".navbar");
        const navH = nav ? nav.getBoundingClientRect().height : 0;
        const docTop = silk.getBoundingClientRect().top + window.scrollY;
        // Land the Silk section just below the sticky navbar so the hero
        // banner above it stays entirely out of view.
        requestAnimationFrame(() =>
          window.scrollTo({
            top: Math.max(0, docTop - navH - 8),
            behavior: "auto",
          })
        );
      }
      return;
    }
    if (activeSlug) {
      lastSlug.current = activeSlug;
      const el =
        sectionRefs[activeSlug] ||
        document.getElementById(`section-${activeSlug}`);
      if (el) {
        requestAnimationFrame(() =>
          el.scrollIntoView({ behavior: "smooth", block: "start" })
        );
      }
    } else if (lastSlug.current) {
      lastSlug.current = null;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [loading, activeSlug, viewAll]);

  // Hero "Shop Now" CTA: randomly pick one of the five categories and open
  // its section (reuses the same /?s=<slug> filter as the navbar links).
  // Each click re-runs the random selection, so it varies every time.
  function goToCollections() {
    const cats = Object.keys(CATEGORY_META);
    let pick = cats[Math.floor(Math.random() * cats.length)];
    // When already viewing one category, avoid landing on the same one again.
    if (activeSlug) {
      while (pick === activeSlug) {
        pick = cats[Math.floor(Math.random() * cats.length)];
      }
    }
    navigate(`/?s=${pick}`);
  }

  const sections = useMemo(() => {
    return Object.keys(CATEGORY_META)
      .map((slug) => {
        const items = products
          .filter((p) => p.category?.slug === slug)
          // Newest first, so newly added products appear at the top of their
          // category section.
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return {
          slug,
          meta: CATEGORY_META[slug],
          items: query
            ? items.filter(
                (p) =>
                  p.name.toLowerCase().includes(query) ||
                  (p.description || "").toLowerCase().includes(query)
              )
            : items,
        };
      })
      .filter((s) => s.items.length > 0);
  }, [products, query]);

  // In filter mode only the clicked category's section is rendered.
  const displaySections = filterMode
    ? sections.filter((s) => s.slug === activeSlug)
    : sections;

  if (loading) {
    return (
      <div>
        <section className="hero">
          <div className="hero-slide active">
            <img src={assetUrl(HERO_SLIDES[0].img)} alt="" />
          </div>
          <div className="hero-overlay" />
          <div className="hero-content container">
            <div className="hero-text">
              <div className="kicker">{HERO_SLIDES[0].kicker}</div>
              <h1>{HERO_SLIDES[0].title}</h1>
              <p>{HERO_SLIDES[0].text}</p>
            </div>
          </div>
        </section>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <section className="hero">
        {HERO_SLIDES.map((h, i) => (
          <div key={i} className={`hero-slide ${i === slide ? "active" : ""}`}>
            <img src={assetUrl(h.img)} alt={h.title} />
          </div>
        ))}
        <div className="hero-overlay" />
        <div className="hero-content container">
          <div className="hero-text">
            <div className="kicker">{HERO_SLIDES[slide].kicker}</div>
            <h1>{HERO_SLIDES[slide].title}</h1>
            <p>{HERO_SLIDES[slide].text}</p>
            <button
              className="btn btn-light"
              onClick={goToCollections}
              aria-label="Shop Now — open a random collection"
            >
              Shop Now
            </button>
          </div>
        </div>
        <div className="hero-dots">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={i === slide ? "active" : ""}
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {error && (
        <div className="container">
          <div
            className="notice"
            style={{
              background: "#fbeeec",
              borderColor: "#f3c9c2",
              color: "#b0493f",
            }}
          >
            <AlertTriangle
              size={18}
              style={{ verticalAlign: -3, marginRight: 8 }}
            />
            {error}
            <button
              className="btn btn-dark btn-sm"
              style={{ marginLeft: 12 }}
              onClick={loadData}
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </div>
      )}

      {!error && query && (
        <div className="container" style={{ padding: "30px 0 0" }}>
          <h2 className="page-title">Results for “{query}”</h2>
          <p className="page-sub">
            {
              products.filter(
                (p) =>
                  p.name.toLowerCase().includes(query) ||
                  (p.description || "").toLowerCase().includes(query)
              ).length
            }{" "}
            items found
          </p>
        </div>
      )}

      {!error && displaySections.length === 0 && (
        <div className="container">
          <div className="empty-state">No products available right now.</div>
        </div>
      )}

      {!error &&
        displaySections.map(({ slug, meta, items }) => (
          <section
            key={slug}
            id={`section-${slug}`}
            className="section container"
            ref={(el) => (sectionRefs[slug] = el)}
          >
            {filterMode && (
              <div
                className="notice"
                style={{
                  marginBottom: 18,
                  background: "#f3f7ee",
                  borderColor: "#d9e7c9",
                  color: "#33502e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                <button
                  className="btn btn-dark btn-sm"
                  onClick={() => navigate("/?v=all")}
                >
                  View All Categories
                </button>
              </div>
            )}
            <div className="section-head">
              <div>
                <h2>{meta.title}</h2>
                <div className="sub">{meta.sub}</div>
              </div>
            </div>
            {items.length > 0 ? (
              <div className="grid">
                {items.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                No products found in this collection.
              </div>
            )}
          </section>
        ))}
    </div>
  );
}
