// Product card used on the home page and dashboards.
import { useNavigate } from "react-router-dom";
import { assetUrl } from "../lib/api";
import { money } from "../lib/format";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const stock = product.stock ?? 0;
  const out = stock <= 0;

  return (
    <article
      className="card"
      onClick={() => navigate(`/product/${product._id}`)}
    >
      <div className="card-media">
        <img
          src={assetUrl(product.images?.[0])}
          alt={product.name}
          loading="lazy"
        />
        {out && <span className="out-of-stock">Out of stock</span>}
      </div>
      <div className="card-body">
        <h3 className="card-name">{product.name}</h3>
        <div className="card-price">{money(product.price)}</div>
      </div>
    </article>
  );
}
