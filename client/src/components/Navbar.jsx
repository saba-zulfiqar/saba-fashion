import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, UserRound, ShoppingBag, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const CATEGORIES = ["silk", "summer", "casual", "printed", "embroidery"];

export default function Navbar({ onNavigate }) {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  function goCategory(name) {
    setMenuOpen(false);
    if (onNavigate) {
      onNavigate(name);
    } else {
      navigate(`/?s=${name}`);
    }
  }

  function submitSearch(e) {
    e.preventDefault();
    setSearchOpen(false);
    setMenuOpen(false);
    setQuery("");
    navigate(`/?q=${encodeURIComponent(query.trim())}`);
  }

  function goAccount() {
    setMenuOpen(false);
    if (!user) navigate("/account");
    else if (isAdmin) navigate("/admin");
    else navigate("/dashboard");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="logo">
          SABA <span>FASHION</span>
        </Link>

        <button
          className="nav-toggle icon-btn"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => {
            setSearchOpen(false);
            setMenuOpen((v) => !v);
          }}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
          {CATEGORIES.map((c) => (
            <button key={c} className="nav-link" onClick={() => goCategory(c)}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
          <Link to="/about" className="nav-link" onClick={() => setMenuOpen(false)}>About</Link>
          <Link to="/contact" className="nav-link" onClick={() => setMenuOpen(false)}>Contact</Link>
        </nav>

        <div className="nav-actions">
          <button
            className="nav-icon icon-btn"
            aria-label="Search"
            title="Search"
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen((v) => !v);
            }}
          >
            <Search size={22} />
          </button>

          <button className="nav-icon icon-btn" aria-label="Account" title="Account" onClick={goAccount}>
            <UserRound size={22} />
          </button>

          <Link to="/cart" className="nav-icon icon-btn cart-btn" aria-label="Cart" title="Cart / Bag">
            <ShoppingBag size={22} />
            {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>

          {user && (
            <Link
              to={isAdmin ? "/admin" : "/dashboard"}
              className="nav-icon icon-btn"
              aria-label="Dashboard"
              title={isAdmin ? "Admin Dashboard" : "My Account"}
            >
              <LayoutDashboard size={22} />
            </Link>
          )}

          {user && (
            <button
              className="nav-icon icon-btn"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => {
                setMenuOpen(false);
                logout();
                navigate("/");
              }}
            >
              <LogOut size={22} />
            </button>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="search-bar">
          <form className="container" onSubmit={submitSearch}>
            <Search size={20} className="search-ico" />
            <input
              autoFocus
              type="search"
              placeholder="Search dresses, silk, lawn..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-dark btn-sm">
              Search
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
