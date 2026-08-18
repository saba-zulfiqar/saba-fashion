import { useNavigate } from "react-router-dom";
import { Sparkles, Heart, ShieldCheck, ShoppingBag, ArrowRight } from "lucide-react";
import { assetUrl } from "../lib/api";

const COLLECTION_LINKS = [
  { slug: "silk", title: "Luxury Silk", desc: "Hand-finished raw silk and tissue suits with delicate tilla detail.", Icon: Sparkles },
  { slug: "summer", title: "Summer Lawn", desc: "Breezy lawn and chiffon ensembles tailored for summer days.", Icon: Heart },
  { slug: "embroidery", title: "Hand Embroidery", desc: "Intricate zardozi and thread embroidery for festive events.", Icon: ShieldCheck },
  { slug: "casual-printed", title: "Casual & Printed", desc: "Vibrant everyday pret created for comfort and versatile style.", Icon: ShoppingBag },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      {/* Hero section */}
      <section className="about-hero" style={{ background: "linear-gradient(135deg, #241d1a 0%, #3d2c26 100%)", color: "#fff", padding: "clamp(44px, 8vw, 60px) 0 clamp(56px, 10vw, 80px)", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 2, color: "#e8c9bf" }}>
            Timeless Elegance & Grace
          </span>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(30px, 6vw, 42px)", margin: "14px 0 18px", fontWeight: 700 }}>
            About Saba Fashion
          </h1>
          <p style={{ fontSize: "clamp(15px, 2.4vw, 17px)", lineHeight: 1.7, color: "#eee4de", margin: "0 auto 28px", maxWidth: 680 }}>
            Saba Fashion is a modern Pakistani fashion destination offering elegant ready-to-wear collections designed for everyday style, festive occasions and timeless Pakistani elegance.
          </p>
          <button className="btn btn-light btn-lg" onClick={() => navigate("/?s=silk")}>
            Explore Collections <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Brand Story & Philosophy */}
      <section className="container" style={{ padding: "60px 0" }}>
        <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 40, alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, color: "#a9615a", fontWeight: 700 }}>
              Our Story & Heritage
            </span>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 32, margin: "10px 0 16px" }}>
              Crafting Elegance for Every Pakistani Woman
            </h2>
            <p style={{ color: "#5c524c", lineHeight: 1.7, marginBottom: 16 }}>
              At Saba Fashion, we believe that true elegance lies in the details. Founded in Lahore, Pakistan, our brand brings together master craftsmanship, delicate embroideries, and soft comfortable fabrics tailored for the contemporary woman.
            </p>
            <p style={{ color: "#5c524c", lineHeight: 1.7, marginBottom: 20 }}>
              Our collections include pure silk, lightweight summer lawn, casual everyday pret, vibrant digital prints, and intricate hand-embroidered festive ensembles carefully presented for women who appreciate quality, comfort, and sophisticated design.
            </p>
          </div>
          <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,0.1)" }}>
            <img src={assetUrl("/images/about-single-model.jpg")} alt="Pakistani model in emerald shalwar kameez" style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        </div>
      </section>

      {/* Collection Highlights */}
      <section style={{ background: "#faf5f1", padding: "60px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 40px" }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 32, margin: "0 0 10px" }}>Our Signature Collections</h2>
            <p style={{ color: "#8a7f79" }}>Discover thoughtful craftsmanship across five distinct Pakistani fashion lines.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {COLLECTION_LINKS.map(({ slug, title, desc, Icon }) => (
              <div
                key={slug}
                className="card about-collection-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/collection/${slug}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/collection/${slug}`);
                  }
                }}
                style={{ padding: 24, textAlign: "center", background: "#fff" }}
              >
                <Icon size={28} color="#a9615a" style={{ margin: "0 auto 12px" }} />
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: 18, margin: "0 0 8px" }}>{title}</h3>
                <p style={{ fontSize: 13, color: "#5c524c", margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="container" style={{ padding: "60px 0", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 30, marginBottom: 16 }}>
          Experience Saba Fashion Today
        </h2>
        <p style={{ color: "#8a7f79", maxWidth: 540, margin: "0 auto 24px" }}>
          Enjoy free delivery on orders over Rs. 6,000 across Pakistan with reliable Cash on Delivery and online payment options.
        </p>
        <button className="btn btn-accent btn-lg" onClick={() => navigate("/?s=silk")}>
          Shop New Arrivals
        </button>
      </section>
    </div>
  );
}
