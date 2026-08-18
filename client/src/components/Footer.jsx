import { Link } from "react-router-dom";
import { Camera, Globe, MessageCircle, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="logo footer-logo">
            SABA <span>FASHION</span>
          </Link>
          <p style={{ lineHeight: 1.6, marginTop: 12 }}>
            Saba Fashion is a modern Pakistani fashion destination offering elegant ready-to-wear collections designed for everyday style, festive occasions and timeless Pakistani elegance. Our collections include silk, summer lawn, casual, printed and embroidered outfits, carefully presented for women who appreciate quality, comfort and sophisticated design.
          </p>
          <div className="footer-social">
            <a href="#" aria-label="Facebook"><Globe size={18} /></a>
            <a href="#" aria-label="Instagram"><Camera size={18} /></a>
            <a href="https://wa.me/923075834975" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle size={18} /></a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/?s=silk">Silk Collection</Link>
          <Link to="/?s=summer">Summer Collection</Link>
          <Link to="/?s=casual">Casual Collection</Link>
          <Link to="/?s=printed">Printed Collection</Link>
          <Link to="/?s=embroidery">Embroidery Collection</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="footer-col">
          <h4>Customer Care</h4>
          <Link to="/cart">My Bag</Link>
          <Link to="/account">Sign In</Link>
          <Link to="/dashboard">Track Order</Link>
        </div>

        <div className="footer-col footer-contact">
          <h4>Contact Us</h4>
          <span><Phone size={15} /> 0307-5834975</span>
          <span><Mail size={15} /> sabazulfiqar926@gmail.com</span>
          <span><MapPin size={15} /> Lahore, Pakistan</span>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">© Saba Fashion. All rights reserved.</div>
      </div>
    </footer>
  );
}
