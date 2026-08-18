# Saba Fashion — Full-Stack E-Commerce Website

Full-stack ready-to-wear Pakistani women's clothing e-commerce web application with dedicated **Frontend**, **REST API Backend**, **MongoDB Database**, and role-separated **Customer & Admin Dashboards**.

---

## Technical Stack

- **Frontend (`client/`)**: React.js, Vite, Lucide Icons, Vanilla CSS Design System.
- **Backend (`server/`)**: Node.js + Express.js REST API with JWT Auth, Role-Based Access Control, Multer file uploads, and atomic Mongoose queries.
- **Database**: MongoDB (Mongoose models for Product, Category, User, Order).
- **Payment Integration**: Cash on Delivery (COD) as default payment method, plus Stripe Checkout integration for card payments. (No JazzCash/EasyPaisa).
- **Contact Details**:
  - **Phone**: `0307-5834975`
  - **Email**: `sabazulfiqar926@gmail.com`

---

## Key Features & Architectural Highlights

1. **Hero Banner Slider**:
   - 3 rotating realistic Pakistani women's dress photography slides.
   - Synchronized slide image and matching text transitions.

2. **5 Curated Pakistani Collections (8 Products Each)**:
   - **Silk Collection**: Pakistani raw-silk shalwar kameez.
   - **Summer Edit**: Pakistani summer lawn and chiffon wear.
   - **Casual Collection**: Everyday Pakistani casual wear.
   - **Printed Collection**: Pakistani printed suits featuring small floral prints (*chote chote phool*).
   - **Embroidery Collection**: Hand-embroidered festive Pakistani suits.
   - *All product images are clean with no size text overlays ("S M L XL") or platform watermarks.*

3. **Product Detail & Continuation Page (`/checkout?p=<id>`)**:
   - Shows 4 posture images (front, side, back, close-up) for the selected dress.
   - Includes price, size selector, quantity picker, and "Add to Bag" button.
   - Homepage content continues seamlessly underneath, allowing uninterrupted browsing.
   - Navbar category navigation returns home and smoothly scrolls to the target section.

4. **Role-Separated Customer & Admin Dashboards**:
   - **Customer Dashboard (`/dashboard`)**: Order history with status tags (pending, processing, shipped, delivered), editable profile details, and wishlist.
   - **Customer Registration**: New user signup automatically redirects straight to the **Home Page (`/`)**.
   - **Admin Portal (`/admin/login` & `/admin`)**: Protected route accessible exclusively by administrator accounts. Features Overview stats (total revenue, total orders, total customers, product count, low-stock alerts), Product CRUD with 4 posture image uploads, Inventory stock management, and Order fulfillment status updates.

---

## Installation & Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB instance running locally on `mongodb://127.0.0.1:27017`

### 1. Backend Setup (`server/`)
```bash
cd server
npm install

# Configure environment variables (.env)
# Create .env with PORT=5000, MONGO_URI, JWT_SECRET, and optional STRIPE_SECRET_KEY

# Seed database with initial categories, 40 products, demo users, and sample orders:
npm run seed

# Run the Express API server:
npm run dev
```

### 2. Frontend Setup (`client/`)
```bash
cd client
npm install

# Start Vite dev server:
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Credentials & Testing Accounts

| Portal | Route | Email | Password | Role |
| ------ | ----- | ----- | -------- | ---- |
| **Customer** | `/account` | `customer@sabafashion.com` | `Customer@1234` | Customer |
| **Admin** | `/admin/login` | `admin@sabafashion.com` | `Admin@1234` | Admin |
