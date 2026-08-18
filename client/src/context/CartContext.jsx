// Shopping cart context.
// - Guests: cart is persisted in localStorage.
// - Logged-in customers: the cart is synced to the backend REST API
//   (server-side cart in MongoDB) so it survives across devices/sessions.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const STORAGE_KEY = "saba-cart";

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

// Convert server cart lines ({ product, size, qty }) to the app's item shape
// ({ id, name, price, image, size, qty, stock }).
function normalizeServerItems(lines) {
  return (lines || [])
    .filter((it) => it && it.product)
    .map((it) => ({
      id: it.product._id,
      name: it.product.name,
      price: it.product.price,
      image: it.product.images?.[0],
      size: it.size || "",
      qty: it.qty,
      stock: it.product.stock,
    }));
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  // Hydrate: logged-in users load the server cart; guests load localStorage.
  useEffect(() => {
    let active = true;
    setReady(false);
    if (user) {
      api("/api/cart")
        .then((d) => {
          if (active) setItems(normalizeServerItems(d.items));
        })
        .catch(() => {})
        .finally(() => {
          if (active) setReady(true);
        });
    } else {
      setItems(loadCart());
      setReady(true);
    }
    return () => {
      active = false;
    };
  }, [user]);

  // Persist after hydration (skipped while the server cart is still loading).
  useEffect(() => {
    if (!ready) return;
    if (user) {
      api("/api/cart", {
        method: "PUT",
        body: {
          items: items.map((it) => ({
            product: it.id,
            size: it.size,
            qty: it.qty,
          })),
        },
      }).catch(() => {});
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, ready, user]);

  function addItem(product, { size, qty = 1 }) {
    setItems((prev) => {
      const existing = prev.find(
        (it) => it.id === product._id && it.size === size
      );
      if (existing) {
        return prev.map((it) =>
          it.id === product._id && it.size === size
            ? { ...it, qty: it.qty + qty }
            : it
        );
      }
      return [
        ...prev,
        {
          id: product._id,
          name: product.name,
          price: product.price,
          image: product.images[0],
          size,
          qty,
          stock: product.stock,
        },
      ];
    });
  }

  function updateQty(id, size, qty) {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((it) => !(it.id === id && it.size === size))
        : prev.map((it) =>
            it.id === id && it.size === size ? { ...it, qty } : it
          )
    );
  }

  function removeItem(id, size) {
    setItems((prev) => prev.filter((it) => !(it.id === id && it.size === size)));
  }

  function clearCart() {
    setItems([]);
  }

  const count = useMemo(() => items.reduce((s, it) => s + it.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.price * it.qty, 0),
    [items]
  );
  const shipping = subtotal >= 6000 || subtotal === 0 ? 0 : 250;
  const total = subtotal + shipping;

  const value = {
    items,
    count,
    subtotal,
    shipping,
    total,
    addItem,
    updateQty,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
