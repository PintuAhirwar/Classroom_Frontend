// utils/trackActivity.js
// Fire-and-forget — never blocks the UI, never throws to the caller.

import { API_BASE } from "@/lib/api";

/**
 * Track a user action (add_to_cart or buy_now).
 *
 * @param {"add_to_cart"|"buy_now"} action
 * @param {object} product   - cart item / course object
 * @param {object} [user]    - { name, phone } optional, filled after checkout form
 */
export async function trackActivity(action, product, user = {}) {
  try {
    const variant = product.selectedVariant || null;

    const payload = {
      action,
      product_id:    String(product.id   || product.course?.id   || ""),
      product_type:  product.product_type || product.type         || "",
      product_name:  product.title        || product.course?.title || "",
      product_price: product.price        || product.course?.price || product.base_price || null,

      // variant (lectures only)
      variant_mode:     variant?.mode_display     || variant?.mode     || "",
      variant_language: variant?.language_display || variant?.language || "",

      // user details (optional)
      user_name:  user.name  || "",
      user_phone: user.phone || "",
    };

    await fetch(`${API_BASE}/activity/track/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
  } catch {
    // silently ignore — tracking should never break the purchase flow
  }
}