"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { toast } from "react-toastify";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);

  // ── Load from localStorage, then try server sync ──────────────────────────
  useEffect(() => {
    const local = typeof window !== "undefined" && localStorage.getItem("cart");
    if (local) {
      try { setCart(JSON.parse(local)); } catch { setCart([]); }
    }

    (async () => {
      const access = typeof window !== "undefined" && localStorage.getItem("access");
      if (!access) return; // not logged in — stay local

      setLoading(true);
      try {
        const serverItems = await apiGet("/cart/");
        setCart(Array.isArray(serverItems) ? serverItems : serverItems?.results || []);
        setSynced(true);
      } catch (err) {
        // 401 = token expired/invalid — remove it so we don't keep retrying
        if (err?.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
          }
        }
        // fall back to local cart silently
        console.warn("Cart sync failed, using local cart:", err?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Persist to localStorage whenever cart changes ─────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart]);

  // ── Add to cart ───────────────────────────────────────────────────────────
  const addToCart = async (course) => {
    // Optimistic local add first (instant UI feedback)
    setCart((prev) => {
      const id = course.id;
      const exists = prev.find(
        (it) => it.course?.id === id || it.id === id || it.id === `local-${id}`
      );
      if (exists) return prev;
      return [...prev, { id: `local-${id}`, course, added_at: new Date().toISOString() }];
    });

    const access = typeof window !== "undefined" && localStorage.getItem("access");
    if (!access) return { ok: true, source: "local" };

    try {
      const res = await apiPost("/cart/", { course_id: course.id });
      // Replace local entry with server entry
      setCart((prev) => {
        const without = prev.filter(
          (it) => it.id !== `local-${course.id}` && it.course?.id !== course.id
        );
        return [...without, res];
      });
      return { ok: true, source: "server" };
    } catch (err) {
      if (err?.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
      }
      // local add already done — just warn
      console.warn("Server cart add failed:", err?.message);
      return { ok: true, source: "local" };
    }
    toast.success("Added to cart! 🛒", {
    position: "top-center",
    autoClose: 2000,
  });
  };

  // ── Remove from cart ──────────────────────────────────────────────────────
  const removeFromCart = async (courseId) => {
    // Optimistic remove
    setCart((prev) =>
      prev.filter(
        (it) =>
          it.course?.id !== courseId &&
          it.course_id !== Number(courseId) &&
          it.id !== courseId &&
          it.id !== `local-${courseId}`
      )
    );

    const access = typeof window !== "undefined" && localStorage.getItem("access");
    if (!access) return { ok: true };

    try {
      await apiDelete(`/cart/remove/${courseId}/`);
      return { ok: true };
    } catch (err) {
      if (err?.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
      }
      return { ok: false, error: err?.message };
    }
    toast.success("Removed from Cart! 🛒", {
    position: "top-center",
    autoClose: 2000,
  });
  };

  // ── Clear cart ────────────────────────────────────────────────────────────
  const clearCart = async () => {
    setCart([]);
    const access = typeof window !== "undefined" && localStorage.getItem("access");
    if (!access) return { ok: true };

    try {
      await apiPost("/cart/clear/", {});
      return { ok: true };
    } catch (err) {
      if (err?.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
      }
      return { ok: false, error: err?.message };
    }
    toast.success("Clear cart!", {
    position: "top-center",
    autoClose: 2000,
  });
  };

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, removeFromCart, clearCart, synced }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);