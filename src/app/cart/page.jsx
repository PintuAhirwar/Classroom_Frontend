"use client";
import React, { useState, useRef } from "react"; // ← TRACKING [1/3] added useRef
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import { getImagePrefix } from "@/utils/getImagePrefix";
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE } from "@/lib/api";
import { useRouter } from "next/navigation";
import { trackActivity } from "@/utils/trackActivity"; // ← TRACKING [2/3] new import

// ── Image helper ──────────────────────────────────────────────────────────────
function getImageUrl(img) {
  if (!img || img === "null" || img === "undefined") return "/images/placeholder-course.jpg";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const base = getImagePrefix().replace(/\/$/, "");
  const path = img.startsWith("/") ? img : `/${img}`;
  return `${base}${path}`;
}

const TYPE_BADGE = {
  lecture:     { label: "Lecture",     color: "bg-blue-100 text-blue-700",       icon: "mdi:play-circle-outline"         },
  book:        { label: "Book",        color: "bg-emerald-100 text-emerald-700", icon: "mdi:book-open-variant-outline"   },
  test_series: { label: "Test Series", color: "bg-amber-100 text-amber-700",     icon: "mdi:pencil-box-multiple-outline" },
  combo:       { label: "Combo",       color: "bg-rose-100 text-rose-700",       icon: "mdi:package-variant-closed"      },
};

// ── Checkout multi-step modal ─────────────────────────────────────────────────
function CheckoutModal({ cart, onClose, onSuccess }) {
  const [step,          setStep]          = useState(1);
  const [formData,      setFormData]      = useState({ name: "", email: "", phone: "", address: "", voucher: "" });
  const [discount,      setDiscount]      = useState(0);
  const [voucherStatus, setVoucherStatus] = useState(""); // "" | "applied" | "invalid"
  const [orderId,       setOrderId]       = useState(null);
  const [utr,           setUtr]           = useState("");
  const [upiLoading,    setUpiLoading]    = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const buyTracked = useRef(false); // ← TRACKING [3/3] track buy_now only once per modal open

  const total      = cart.reduce((s, it) => s + Number(it.course?.price ?? it.price ?? 0), 0);
  const finalAmount = Math.max(0, total - discount);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "voucher") { setVoucherStatus(""); setDiscount(0); }
  };

  // Replaces the inline onClick={() => setStep(2)} on the Next button
  const handleStep1Next = () => {
    if (!buyTracked.current) {
      buyTracked.current = true;
      cart.forEach(item => {
        trackActivity("buy_now", item, { name: formData.name, phone: formData.phone });
      });
    }
    setStep(2);
  };

  const applyVoucher = async () => {
    try {
      const res = await axios.post(`${API_BASE}/orders/vouchers/validate/`, {
        code: formData.voucher,
        course_id: cart[0]?.course?.id || cart[0]?.id,
      });
      setDiscount(res.data.discount_amount);
      setVoucherStatus("applied");
      toast.success("🎟 Voucher applied!");
    } catch (err) {
      setVoucherStatus("invalid");
      setDiscount(0);
      toast.error(err.response?.data?.error || "Invalid voucher");
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
    const data = {
      name:            formData.name,
      email:           formData.email || null,
      phone:           formData.phone || null,
      address:         formData.address || null,
      discount_code:   formData.voucher || null,
      discount_amount: discount || 0,
      total_amount:    total || 0,
      final_amount:    finalAmount,
      items: cart.map(c => ({
        course: c.course?.id || c.id,
        price:  Number(c.course?.price || c.price || 0),
      })),
    };
    try {
      const res = await axios.post(`${API_BASE}/orders/orders`, data,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      setOrderId(res.data.id);
      setStep(3);
      toast.success("✅ Order placed!");
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || "Failed to place order");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const payViaUPI = async () => {
    if (!orderId) return;
    setUpiLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/orders/${orderId}/upi/`);
      window.location.href = res.data.upi_link;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to generate UPI link");
    } finally {
      setUpiLoading(false);
    }
  };

  const submitUTR = async () => {
    if (!utr.trim()) { toast.error("Please enter a valid UTR"); return; }
    try {
      await axios.post(`${API_BASE}/orders/${orderId}/submit-utr/`, { utr });
      toast.success("Payment submitted for verification 🎉");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit UTR");
    }
  };

  const isStep1Valid = formData.name && formData.email && formData.phone;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)", maxHeight: "96vh" }}>

        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-8 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900">
              {step === 1 ? "Your Details" : step === 2 ? "Apply Discount" : "Payment"}
            </h2>
            <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors">
              <Icon icon="mdi:close" className="text-slate-500 text-sm" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1.5">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-primary" : "bg-slate-200"}`} />
            ))}
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-5" style={{ maxHeight: "calc(96vh - 100px)" }}>

          {/* ── STEP 1: Details ── */}
          {step === 1 && (
            <>
              {/* Order summary mini */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 max-h-36 overflow-y-auto">
                {cart.map((it, i) => {
                  const c = it.course || it;
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                        <Image src={getImageUrl(c.image)} alt={c.title} fill className="object-cover" unoptimized />
                      </div>
                      <p className="text-xs font-medium text-slate-700 flex-1 line-clamp-1">{c.title}</p>
                      <span className="text-xs font-bold text-slate-900 flex-shrink-0">₹{Number(c.price || 0).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>

              {/* Fields */}
              <div className="space-y-3">
                {[
                  { key: "name",    label: "Full Name", icon: "mdi:account-outline", type: "text",  placeholder: "Your full name",    req: true  },
                  { key: "email",   label: "Email",     icon: "mdi:email-outline",   type: "email", placeholder: "your@email.com",    req: true  },
                  { key: "phone",   label: "Phone",     icon: "mdi:phone-outline",   type: "tel",   placeholder: "+91 XXXXX XXXXX",   req: true  },
                  { key: "address", label: "Address",   icon: "mdi:map-marker-outline", type: "text", placeholder: "Delivery address", req: false },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                      {f.label}{f.req && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    <div className="relative">
                      <Icon icon={f.icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                      <input type={f.type} name={f.key} placeholder={f.placeholder} value={formData[f.key]}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all" />
                    </div>
                  </div>
                ))}
              </div>

              {/* was onClick={() => setStep(2)}, now onClick={handleStep1Next} */}
              <button onClick={handleStep1Next} disabled={!isStep1Valid}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                Next — Apply Discount <Icon icon="mdi:arrow-right" />
              </button>
            </>
          )}

          {/* ── STEP 2: Discount + confirm ── */}
          {step === 2 && (
            <>
              <div className="space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm">
                <div className="flex justify-between text-slate-600"><span>Subtotal ({cart.length} items)</span><span>₹{total.toLocaleString()}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span className="flex items-center gap-1"><Icon icon="mdi:tag-outline" className="text-sm" />Discount</span>
                    <span>− ₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-base">
                  <span className="text-slate-900">Total</span>
                  <span className="text-primary">₹{finalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Voucher / Discount Code</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Icon icon="mdi:ticket-percent-outline" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                    <input name="voucher" placeholder="Enter code" value={formData.voucher} onChange={handleChange}
                      disabled={voucherStatus === "applied"}
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 disabled:opacity-60 transition-all" />
                  </div>
                  <button onClick={applyVoucher} disabled={voucherStatus === "applied" || !formData.voucher}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex-shrink-0
                      ${voucherStatus === "applied" ? "bg-emerald-100 text-emerald-700 cursor-not-allowed"
                        : voucherStatus === "invalid" ? "bg-red-100 text-red-600"
                        : "bg-primary text-white hover:bg-primary/90"}`}>
                    {voucherStatus === "applied" ? <><Icon icon="mdi:check" className="inline" /> Applied</> : "Apply"}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 border border-slate-200 text-slate-600 hover:border-primary hover:text-primary py-3.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5">
                  <Icon icon="mdi:arrow-left" /> Back
                </button>
                <button onClick={handleCheckout} disabled={checkoutLoading}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                  {checkoutLoading
                    ? <><Icon icon="mdi:loading" className="animate-spin" /> Placing...</>
                    : <><Icon icon="mdi:lock-outline" /> Pay ₹{finalAmount.toLocaleString()}</>}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Payment ── */}
          {step === 3 && (
            <>
              {orderId ? (
                <>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                    <Icon icon="mdi:check-circle" className="text-3xl text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-emerald-700">Order #{orderId} placed successfully!</p>
                    <p className="text-xs text-emerald-600 mt-1">Complete payment below to confirm your order.</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm space-y-1.5">
                    <div className="flex justify-between text-slate-600"><span>Order Amount</span><span>₹{total.toLocaleString()}</span></div>
                    {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>− ₹{discount.toLocaleString()}</span></div>}
                    <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-base">
                      <span>Payable</span><span className="text-primary">₹{finalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scan to Pay</p>
                    <div className="border-2 border-slate-200 rounded-2xl p-3 bg-white shadow-sm">
                      <Image src={`${API_BASE}/orders/${orderId}/upi-qr/`} alt="UPI QR" width={180} height={180}
                        unoptimized className="rounded-xl" />
                    </div>
                    <button onClick={payViaUPI} disabled={upiLoading}
                      className="w-full bg-primary/10 hover:bg-primary hover:text-white text-primary border border-primary/30 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                      {upiLoading ? <><Icon icon="mdi:loading" className="animate-spin" /> Opening...</> : <><Icon icon="mdi:open-in-app" /> Open UPI App</>}
                    </button>
                  </div>

                  {/* UTR */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                      Enter UTR / Transaction ID after payment
                    </label>
                    <div className="relative">
                      <Icon icon="mdi:receipt-text-outline" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                      <input placeholder="12-digit UTR number" value={utr} onChange={e => setUtr(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all" />
                    </div>
                  </div>

                  <button onClick={submitUTR} disabled={!utr.trim()}
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                    <Icon icon="mdi:check-circle-outline" /> Confirm Payment
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Icon icon="mdi:alert-circle-outline" className="text-4xl text-red-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium mb-4">Order could not be placed. Please try again.</p>
                  <button onClick={() => setStep(2)}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
                    ← Try Again
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform:translateY(60px); opacity:0 } to { transform:translateY(0); opacity:1 } }`}</style>
    </div>
  );
}

// ── Empty cart state ──────────────────────────────────────────────────────────
function EmptyCart({ router }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
        <Icon icon="mdi:cart-off" className="text-5xl text-slate-300" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
      <p className="text-slate-500 text-sm mb-8 max-w-xs">Add some courses, books, or test series to get started.</p>
      <button onClick={() => router.push("/courses")}
        className="bg-primary text-white hover:bg-primary/90 px-8 py-3.5 rounded-full font-semibold text-sm flex items-center gap-2 transition-colors">
        <Icon icon="mdi:view-grid-outline" className="text-base" /> Browse Products
      </button>
    </div>
  );
}

// ── MAIN CART PAGE ────────────────────────────────────────────────────────────
export default function CartPage() {
  const { cart, loading, removeFromCart, clearCart } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const router = useRouter();

  const total    = cart.reduce((s, it) => s + Number(it.course?.price ?? it.price ?? 0), 0);
  const itemCount = cart.length;

  const handleRemove = (item) => {
    const c = item.course || item;
    removeFromCart(c.id);
    toast.info(`${c.title} removed`, { icon: "🗑️", position: "bottom-center" });
  };

  const handleCheckoutSuccess = () => {
    clearCart();
    setCheckoutOpen(false);
    toast.success("🎉 Order confirmed! We'll verify your payment shortly.");
    router.push("/");
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Icon icon="mdi:loading" className="text-4xl text-primary animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading your cart…</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .cart-item { animation: fadeUp 0.35s ease both }
      `}</style>

      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 pt-16">
            <button onClick={() => router.push("/")} className="hover:text-slate-700 transition-colors">Home</button>
            <Icon icon="mdi:chevron-right" className="text-sm" />
            <span className="text-slate-700 font-medium">My Cart</span>
          </div>

          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">My Cart</h1>
              <p className="text-slate-500 text-sm mt-1">
                {itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? "s" : ""} in your cart` : "Your cart is empty"}
              </p>
            </div>
            {itemCount > 0 && (
              <button onClick={() => clearCart()}
                className="text-sm text-slate-400 hover:text-red-500 font-medium flex items-center gap-1.5 transition-colors">
                <Icon icon="mdi:trash-can-outline" className="text-base" /> Clear all
              </button>
            )}
          </div>

          {itemCount === 0 ? (
            <EmptyCart router={router} />
          ) : (
            <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">

              {/* ── CART ITEMS ── */}
              <div className="space-y-3">
                {cart.map((it, idx) => {
                  const c       = it.course || it;
                  const type    = it.product_type || c.product_type || "lecture";
                  const badge   = TYPE_BADGE[type] || TYPE_BADGE.lecture;
                  const price   = Number(c.price || c.base_price || c.combo_price || 0);
                  const origP   = Number(c.original_price || 0) || null;
                  const discPct = origP && origP > price ? Math.round((1 - price / origP) * 100) : null;

                  return (
                    <div key={it.id || idx}
                      className="cart-item bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-200"
                      style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex gap-0">

                        {/* Image */}
                        <div className="relative w-28 sm:w-36 flex-shrink-0 bg-slate-100 cursor-pointer"
                          onClick={() => router.push(`/courses/${type}/${c.slug || c.id}`)}>
                          <Image src={getImageUrl(c.image)} alt={c.title} fill className="object-cover" unoptimized
                            onError={e => { e.target.src = "/images/placeholder-course.jpg"; }} />
                          <div className="absolute top-2 left-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug mb-1 cursor-pointer hover:text-primary transition-colors"
                              onClick={() => router.push(`/courses/${type}/${c.slug || c.id}`)}>
                              {c.title}
                            </h3>
                            {c.faculty_name && (
                              <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                                <Icon icon="mdi:account-circle-outline" className="text-sm flex-shrink-0" />
                                {c.faculty_name}
                              </p>
                            )}
                            {it.selectedVariant && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                  {it.selectedVariant.mode_display || it.selectedVariant.mode}
                                </span>
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                  {it.selectedVariant.language_display || it.selectedVariant.language}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Price row + remove */}
                          <div className="flex items-end justify-between gap-2 mt-2">
                            <div className="flex items-baseline gap-2">
                              <span className="text-base sm:text-lg font-black text-primary">
                                ₹{price.toLocaleString()}
                              </span>
                              {origP && origP > price && (
                                <span className="text-xs text-slate-400 line-through">₹{origP.toLocaleString()}</span>
                              )}
                              {discPct && (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                  {discPct}% off
                                </span>
                              )}
                            </div>
                            <button onClick={() => handleRemove(it)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all flex-shrink-0">
                              <Icon icon="mdi:trash-can-outline" className="text-sm" />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── ORDER SUMMARY (sticky) ── */}
              <div className="lg:sticky lg:top-24">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100">
                    <h2 className="text-base font-bold text-slate-900">Order Summary</h2>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="space-y-2">
                      {cart.map((it, i) => {
                        const c = it.course || it;
                        const p = Number(c.price || c.base_price || 0);
                        return (
                          <div key={i} className="flex justify-between items-center gap-2 text-sm">
                            <span className="text-slate-600 line-clamp-1 flex-1 min-w-0">{c.title}</span>
                            <span className="font-semibold text-slate-800 flex-shrink-0">₹{p.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-base">
                      <span className="text-slate-900">Total</span>
                      <span className="text-primary text-lg">₹{total.toLocaleString()}</span>
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Icon icon="mdi:tag-outline" className="text-sm" />
                      Discount codes can be applied at checkout
                    </p>
                  </div>

                  {/* CTAs */}
                  <div className="px-5 pb-5 space-y-2.5">
                    <button onClick={() => setCheckoutOpen(true)}
                      className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]">
                      <Icon icon="mdi:lightning-bolt" className="text-base" />
                      Proceed to Checkout
                    </button>
                    <button onClick={() => router.push("/courses")}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                      <Icon icon="mdi:plus" className="text-base" /> Add More Products
                    </button>
                  </div>

                  <div className="px-5 pb-5">
                    <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
                      <Icon icon="mdi:shield-check-outline" className="text-emerald-500 text-sm" />
                      Secure checkout · Easy returns
                    </p>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { icon: "mdi:shield-lock-outline",   label: "Secure" },
                    { icon: "mdi:headset",               label: "Support" },
                    { icon: "mdi:cash-refund",           label: "Refund" },
                  ].map(b => (
                    <div key={b.label} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-1.5">
                      <Icon icon={b.icon} className="text-primary text-xl" />
                      <span className="text-xs font-semibold text-slate-500">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      {itemCount > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-4 py-3"
          style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <p className="text-xs text-slate-400">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
              <p className="font-bold text-primary text-lg leading-none">₹{total.toLocaleString()}</p>
            </div>
            <button onClick={() => setCheckoutOpen(true)}
              className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]">
              <Icon icon="mdi:lightning-bolt" /> Checkout
            </button>
          </div>
        </div>
      )}

      {itemCount > 0 && <div className="lg:hidden h-20" />}

      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </>
  );
}