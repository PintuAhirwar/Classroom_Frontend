"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import { API_BASE } from "@/lib/api";
import { getImagePrefix } from "@/utils/getImagePrefix";
import { useCart } from "@/context/CartContext";
import { toast } from "react-toastify";
import axios from "axios";
import { trackActivity } from "@/utils/trackActivity"; // ← TRACKING [1/5] new import
import DemoPreviewSection from "@/components/DemoPreviewSection";

// ── Image helper ──────────────────────────────────────────────────────────────
function getImageUrl(img) {
  if (!img || img === "null" || img === "undefined") return "/images/placeholder-course.jpg";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const base = getImagePrefix().replace(/\/$/, "");
  const path = img.startsWith("/") ? img : `/${img}`;
  return `${base}${path}`;
}

// ── Product type config ───────────────────────────────────────────────────────
const TYPE_CONFIG = {
  lecture: {
    label: "Lecture", icon: "mdi:play-circle-outline",
    color: "bg-blue-100 text-blue-700", apiPath: "lectures", priceField: "base_price",
  },
  book: {
    label: "Book", icon: "mdi:book-open-variant-outline",
    color: "bg-emerald-100 text-emerald-700", apiPath: "books", priceField: "price",
  },
  test_series: {
    label: "Test Series", icon: "mdi:pencil-box-multiple-outline",
    color: "bg-amber-100 text-amber-700", apiPath: "test-series", priceField: "price",
  },
  combo: {
    label: "Combo", icon: "mdi:package-variant-closed",
    color: "bg-rose-100 text-rose-700", apiPath: "combos", priceField: "combo_price",
  },
};

const TYPE_BADGE = {
  lecture:     { label: "Lecture",     color: "bg-blue-100 text-blue-700",        icon: "mdi:play-circle-outline"         },
  book:        { label: "Book",        color: "bg-emerald-100 text-emerald-700",  icon: "mdi:book-open-variant-outline"   },
  test_series: { label: "Test Series", color: "bg-amber-100 text-amber-700",      icon: "mdi:pencil-box-multiple-outline" },
  combo:       { label: "Combo",       color: "bg-rose-100 text-rose-700",        icon: "mdi:package-variant-closed"      },
};

// ── CHECKOUT MODAL (same real flow as cart page) ──────────────────────────────
function CheckoutModal({ cart, onClose, onSuccess }) {
  const [step,            setStep]            = useState(1);
  const [formData,        setFormData]        = useState({ name: "", email: "", phone: "", address: "", voucher: "" });
  const [discount,        setDiscount]        = useState(0);
  const [voucherStatus,   setVoucherStatus]   = useState(""); // "" | "applied" | "invalid"
  const [orderId,         setOrderId]         = useState(null);
  const [utr,             setUtr]             = useState("");
  const [upiLoading,      setUpiLoading]      = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const buyTracked = useRef(false); // ← TRACKING [2/5] track buy_now only once per modal open

  const total       = cart.reduce((s, it) => s + Number(it.course?.price ?? it.price ?? 0), 0);
  const finalAmount = Math.max(0, total - discount);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "voucher") { setVoucherStatus(""); setDiscount(0); }
  };

  // ← TRACKING [3/5] replaces the inline onClick={() => setStep(2)} on the Next button
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
      <div
        className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)", maxHeight: "96vh" }}
      >
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
            <button
              onClick={onClose}
              className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <Icon icon="mdi:close" className="text-slate-500 text-sm" />
            </button>
          </div>
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
                  { key: "name",    label: "Full Name", icon: "mdi:account-outline",    type: "text",  placeholder: "Your full name",   req: true  },
                  { key: "email",   label: "Email",     icon: "mdi:email-outline",       type: "email", placeholder: "your@email.com",   req: true  },
                  { key: "phone",   label: "Phone",     icon: "mdi:phone-outline",       type: "tel",   placeholder: "+91 XXXXX XXXXX",  req: true  },
                  { key: "address", label: "Address",   icon: "mdi:map-marker-outline",  type: "text",  placeholder: "Delivery address", req: false },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                      {f.label}{f.req && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    <div className="relative">
                      <Icon icon={f.icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                      <input
                        type={f.type} name={f.key} placeholder={f.placeholder} value={formData[f.key]}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* ← TRACKING [4/5] was onClick={() => setStep(2)}, now onClick={handleStep1Next} */}
              <button
                onClick={handleStep1Next} disabled={!isStep1Valid}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                Next — Apply Discount <Icon icon="mdi:arrow-right" />
              </button>
            </>
          )}

          {/* ── STEP 2: Discount + confirm ── */}
          {step === 2 && (
            <>
              <div className="space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm">
                <div className="flex justify-between text-slate-600"><span>Subtotal ({cart.length} item{cart.length !== 1 ? "s" : ""})</span><span>₹{total.toLocaleString()}</span></div>
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
                    <input
                      name="voucher" placeholder="Enter code" value={formData.voucher} onChange={handleChange}
                      disabled={voucherStatus === "applied"}
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 disabled:opacity-60 transition-all"
                    />
                  </div>
                  <button
                    onClick={applyVoucher} disabled={voucherStatus === "applied" || !formData.voucher}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex-shrink-0
                      ${voucherStatus === "applied" ? "bg-emerald-100 text-emerald-700 cursor-not-allowed"
                        : voucherStatus === "invalid" ? "bg-red-100 text-red-600"
                        : "bg-primary text-white hover:bg-primary/90"}`}
                  >
                    {voucherStatus === "applied" ? <><Icon icon="mdi:check" className="inline" /> Applied</> : "Apply"}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-slate-200 text-slate-600 hover:border-primary hover:text-primary py-3.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Icon icon="mdi:arrow-left" /> Back
                </button>
                <button
                  onClick={handleCheckout} disabled={checkoutLoading}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
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
                      <Image
                        src={`${API_BASE}/orders/${orderId}/upi-qr/`} alt="UPI QR"
                        width={180} height={180} unoptimized className="rounded-xl"
                      />
                    </div>
                    <button
                      onClick={payViaUPI} disabled={upiLoading}
                      className="w-full bg-primary/10 hover:bg-primary hover:text-white text-primary border border-primary/30 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                    >
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
                      <input
                        placeholder="12-digit UTR number" value={utr} onChange={e => setUtr(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={submitUTR} disabled={!utr.trim()}
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Icon icon="mdi:check-circle-outline" /> Confirm Payment
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Icon icon="mdi:alert-circle-outline" className="text-4xl text-red-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium mb-4">Order could not be placed. Please try again.</p>
                  <button onClick={() => setStep(2)} className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
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

// ── VARIANT SELECTOR (lectures only) ─────────────────────────────────────────
function VariantSelector({ variants, selectedVariant, onChange }) {
  const modes     = [...new Set(variants.map(v => v.mode))];
  const languages = [...new Set(variants.map(v => v.language))];
  const [selectedMode, setSelectedMode] = useState(selectedVariant?.mode     || modes[0]);
  const [selectedLang, setSelectedLang] = useState(selectedVariant?.language || languages[0]);

  const MODE_ICONS  = { gd_android_ios: "mdi:cellphone-play", pendrive: "mdi:usb-flash-drive-outline", live: "mdi:broadcast", upcoming: "mdi:calendar-clock" };
  const MODE_LABELS = { gd_android_ios: "App / GD", pendrive: "Pendrive", live: "Live", upcoming: "Upcoming" };
  const LANG_LABELS = { hindi: "Hindi", english: "English", both: "Hindi + English" };
  const LANG_ICONS  = { hindi: "mdi:translate", english: "mdi:alphabetical", both: "mdi:earth" };

  useEffect(() => {
    const exact    = variants.find(v => v.mode === selectedMode && v.language === selectedLang && v.is_active);
    if (exact) { onChange(exact); return; }
    const fallback = variants.find(v => v.mode === selectedMode && v.is_active);
    if (fallback) { setSelectedLang(fallback.language); onChange(fallback); }
  }, [selectedMode, selectedLang]);

  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Delivery Mode</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {modes.map(mode => {
          const available = variants.some(v => v.mode === mode && v.is_active);
          const active    = selectedMode === mode;
          const priceV    = variants.find(v => v.mode === mode && v.language === selectedLang && v.is_active)
                         || variants.find(v => v.mode === mode && v.is_active);
          return (
            <button key={mode} disabled={!available} onClick={() => setSelectedMode(mode)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                ${active
                  ? "border-primary text-primary bg-primary/10 shadow-sm"
                  : available
                    ? "border-slate-200 text-slate-600 hover:border-slate-400 bg-white"
                    : "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed"}`}>
              <Icon icon={MODE_ICONS[mode] || "mdi:play-circle-outline"} className={`text-base flex-shrink-0 ${active ? "text-primary" : "text-slate-400"}`} />
              <span className="truncate">{MODE_LABELS[mode] || mode}</span>
              {priceV && <span className={`ml-auto text-xs ${active ? "text-primary/70" : "text-slate-400"}`}>₹{Number(priceV.price).toLocaleString()}</span>}
            </button>
          );
        })}
      </div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Language</p>
      <div className="flex gap-2 flex-wrap">
        {languages.map(lang => {
          const available = variants.some(v => v.mode === selectedMode && v.language === lang && v.is_active);
          const active    = selectedLang === lang;
          return (
            <button key={lang} disabled={!available} onClick={() => setSelectedLang(lang)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all
                ${active   ? "border-primary text-primary bg-primary/10 shadow-sm"
                  : available ? "border-slate-200 text-slate-600 hover:border-slate-400 bg-white"
                    : "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed"}`}>
              <Icon icon={LANG_ICONS[lang] || "mdi:earth"} className="text-sm" />
              {LANG_LABELS[lang] || lang}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── COMBO ITEM DETAIL DRAWER ──────────────────────────────────────────────────
function ComboItemDrawer({ item, onClose, onAddToCart }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (item?.type === "lecture" && item.variants?.length) {
      const first = item.variants.find(v => v.is_active) || item.variants[0];
      setSelectedVariant(first);
    }
  }, [item]);

  if (!item) return null;

  const type        = item.type || item.product_type || "book";
  const config      = TYPE_CONFIG[type] || TYPE_CONFIG.book;
  const badge       = TYPE_BADGE[type];
  const hasVariants = type === "lecture" && item.variants?.length > 0;

  const displayPrice = hasVariants && selectedVariant
    ? Number(selectedVariant.price || 0)
    : Number(item.price || item.base_price || 0);

  const origPrice = hasVariants && selectedVariant
    ? Number(selectedVariant.original_price || 0) || null
    : Number(item.original_price || 0) || null;

  const discPct = (origPrice && origPrice > displayPrice)
    ? Math.round((1 - displayPrice / origPrice) * 100) : null;

  const handleChoose = () => {
    if (hasVariants && !selectedVariant) {
      toast.error("Please select an option first");
      return;
    }
    const cartItem = {
      ...item,
      price:           displayPrice,
      product_type:    type,
      selectedVariant: hasVariants ? selectedVariant : null,
    };
    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)", maxHeight: "92vh" }}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-8 h-1 bg-slate-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge?.color}`}>
              <Icon icon={badge?.icon} className="inline text-xs mr-1" />{badge?.label}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors">
            <Icon icon="mdi:close" className="text-slate-500 text-sm" />
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 130px)" }}>
          <div className="p-5">
            <div className="flex gap-4 mb-5">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                <Image src={getImageUrl(item.image)} alt={item.title} fill className="object-cover" unoptimized
                  onError={(e) => { e.target.src = "/images/placeholder-course.jpg"; }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">{item.title}</h3>
                {item.faculty_name && (
                  <p className="text-sm text-slate-500 flex items-center gap-1.5">
                    <Icon icon="mdi:account-circle-outline" className="text-base flex-shrink-0" />
                    {item.faculty_name}
                  </p>
                )}
                {item.subject_name && (
                  <p className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">{item.subject_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-xl font-bold text-primary">₹{displayPrice.toLocaleString()}</span>
              {origPrice && origPrice > displayPrice && (
                <span className="text-slate-400 line-through text-sm">₹{origPrice.toLocaleString()}</span>
              )}
              {discPct && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{discPct}% OFF</span>
              )}
            </div>
            {hasVariants && (
              <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Available Options</p>
                <VariantSelector variants={item.variants} selectedVariant={selectedVariant} onChange={setSelectedVariant} />
              </div>
            )}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 bg-white flex items-center gap-3">
          <button
            onClick={() => { onClose(); router.push(`/courses/${type}/${item.slug || item.id}`); }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 text-xs font-semibold flex-shrink-0 transition-all">
            <Icon icon="mdi:open-in-new" className="text-sm" /> Full Details
          </button>
          <button
            onClick={handleChoose}
            disabled={hasVariants && !selectedVariant}
            className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]">
            <Icon icon="mdi:cart-plus" className="text-base" />
            {hasVariants ? (selectedVariant ? "Add to Cart" : "Select Option") : "Add to Cart"}
          </button>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform:translateY(50px); opacity:0 } to { transform:translateY(0); opacity:1 } }`}</style>
    </div>
  );
}

// ── COMBO CONTENTS DISPLAY ────────────────────────────────────────────────────
function ComboContentsPanel({ items, onAddToCart }) {
  const [drawerItem, setDrawerItem] = useState(null);

  const TYPE_SECTION = {
    lecture:     { label: "Lectures",    icon: "mdi:play-circle-outline",         bg: "bg-blue-50 border-blue-100"       },
    book:        { label: "Books",       icon: "mdi:book-open-variant-outline",   bg: "bg-emerald-50 border-emerald-100" },
    test_series: { label: "Test Series", icon: "mdi:pencil-box-multiple-outline", bg: "bg-amber-50 border-amber-100"     },
  };

  const grouped = {};
  items.forEach(item => {
    const t = item.type || item.product_type || "book";
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(item);
  });

  return (
    <>
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">What's Included</p>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">Click any item to view its details and available options.</p>
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, typeItems]) => {
            const sec = TYPE_SECTION[type] || { label: type, icon: "mdi:package-variant", bg: "bg-slate-50 border-slate-100" };
            return (
              <div key={type} className={`rounded-xl border p-3 ${sec.bg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon={sec.icon} className="text-slate-500 text-base" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{sec.label}</span>
                  <span className="text-xs text-slate-400 ml-auto">{typeItems.length}</span>
                </div>
                <div className="space-y-2">
                  {typeItems.map(item => {
                    const price = Number(item.price || item.base_price || 0);
                    const origP = Number(item.original_price || 0) || null;
                    const hasVar = type === "lecture" && item.variants?.length > 0;
                    return (
                      <button key={item.id} onClick={() => setDrawerItem(item)}
                        className="w-full text-left bg-white rounded-xl border border-slate-200 hover:border-primary/40 hover:shadow-sm transition-all duration-200 overflow-hidden group">
                        <div className="flex items-center gap-3 p-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                            <Image src={getImageUrl(item.image)} alt={item.title} fill className="object-cover" unoptimized
                              onError={(e) => { e.target.src = "/images/placeholder-course.jpg"; }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">{item.title}</p>
                            {item.faculty_name && <p className="text-xs text-slate-400 truncate mt-0.5">{item.faculty_name}</p>}
                            {hasVar && (
                              <p className="text-xs text-blue-500 mt-0.5 flex items-center gap-1">
                                <Icon icon="mdi:tune-variant" className="text-xs" />
                                {item.variants.filter(v => v.is_active).length} options available
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 flex items-center gap-2">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{price > 0 ? `₹${price.toLocaleString()}` : "—"}</p>
                              {origP && origP > price && <p className="text-xs text-slate-400 line-through">₹{origP.toLocaleString()}</p>}
                            </div>
                            <Icon icon="mdi:chevron-right" className="text-slate-300 group-hover:text-primary transition-colors text-lg flex-shrink-0" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {drawerItem && (
        <ComboItemDrawer item={drawerItem} onClose={() => setDrawerItem(null)} onAddToCart={onAddToCart} />
      )}
    </>
  );
}

// ── COMBO PRICE SUMMARY ───────────────────────────────────────────────────────
function ComboPriceSummary({ item }) {
  const comboPrice = Number(item.combo_price || item.price || 0);
  const origPrice  = Number(item.original_price || 0) || null;
  const savings    = Number(item.savings || 0) || (origPrice ? origPrice - comboPrice : 0);
  const discPct    = item.discount_pct || (origPrice && origPrice > comboPrice
    ? Math.round((1 - comboPrice / origPrice) * 100) : null);

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4">
      <div className="space-y-2 text-sm">
        {origPrice && origPrice > comboPrice && (
          <div className="flex justify-between text-slate-500">
            <span>Original Value</span>
            <span className="line-through">₹{origPrice.toLocaleString()}</span>
          </div>
        )}
        {savings > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span className="flex items-center gap-1">
              <Icon icon="mdi:tag-outline" className="text-sm" />
              You Save {discPct ? `(${discPct}% off)` : ""}
            </span>
            <span>- ₹{savings.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-base">
          <span className="text-slate-900">Combo Price</span>
          <span className="text-primary">₹{comboPrice.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left gap-3 group">
        <span className="text-sm text-slate-800 group-hover:text-slate-900 transition-colors">{q}</span>
        <Icon icon={open ? "mdi:minus" : "mdi:plus"} className="text-base text-slate-400 flex-shrink-0" />
      </button>
      {open && <p className="text-sm text-slate-500 leading-relaxed pb-4">{a}</p>}
    </div>
  );
}

// ── SUGGESTED PRODUCTS ────────────────────────────────────────────────────────
function SuggestedProducts({ currentId, currentType, categorySlug, router }) {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!categorySlug) return;
    fetch(`${API_BASE}/courses/lectures/?category=${categorySlug}`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : d.results || [];
        setProducts(list.filter(l => !(l.id === currentId && currentType === "lecture")).slice(0, 6));
      }).catch(() => { });
  }, [currentId, currentType, categorySlug]);

  if (!products.length) return null;

  return (
    <div className="bg-slate-50 py-12 border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">You May Also Like</h2>
            <p className="text-sm text-slate-500 mt-0.5">More from this category</p>
          </div>
          <button onClick={() => router.push(categorySlug ? `/courses?category=${categorySlug}` : "/courses")}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors">
            View all <Icon icon="mdi:arrow-right" className="text-base" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {products.map((p, i) => (
            <div key={p.id}
              onClick={() => router.push(`/courses/lecture/${p.slug || p.id}`)}
              className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group"
              style={{ animation: `fadeUp 0.4s ease ${i * 60}ms both` }}>
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <Image src={getImageUrl(p.image)} alt={p.title} fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug mb-1 group-hover:text-primary transition-colors">{p.title}</p>
                {p.faculty_name && <p className="text-xs text-slate-400 truncate mb-2">{p.faculty_name}</p>}
                <span className="text-sm font-bold text-slate-900">
                  {p.base_price ? `₹${Number(p.base_price).toLocaleString()}` : "See options"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TYPE-SPECIFIC INFO ────────────────────────────────────────────────────────
function ProductTypeInfo({ type, item }) {
  if (type === "book") return (
    <div className="space-y-3">
      {[
        ["Book Type",    item.book_type_display || item.book_type],
        ["Subject",      item.subject_name],
        ["Category",     item.category_detail?.name],
        ["Author",       item.author],
        ["Publisher",    item.publisher],
        ["Edition",      item.edition],
        ["Pages",        item.pages],
        ["Language",     item.language_display || item.language],
        ["Description",  item.description],
      ].filter(([, v]) => v).map(([label, value]) => (
        <div key={label} className="flex gap-3 py-2.5 border-b border-slate-100 text-sm">
          <span className="font-semibold text-slate-800 w-32 flex-shrink-0">{label}</span>
          <span className="text-slate-600">{value}</span>
        </div>
      ))}
    </div>
  );
  if (type === "test_series") return (
    <div className="space-y-3">
      {[
        ["Course",      item.course_name],
        ["Level",       item.level !== "na" ? item.level : null],
        ["Test Type",   item.test_type_display || item.test_type],
        ["Total Tests", item.total_tests],
        ["Duration",    item.duration],
        ["Subject",     item.subject_name],
        ["Category",    item.category_detail?.name],
        ["Validity",    item.validity],
        ["Description", item.description],
      ].filter(([, v]) => v).map(([label, value]) => (
        <div key={label} className="flex gap-3 py-2.5 border-b border-slate-100 text-sm">
          <span className="font-semibold text-slate-800 w-32 flex-shrink-0">{label}</span>
          <span className="text-slate-600">{value}</span>
        </div>
      ))}
    </div>
  );
  if (type === "combo") return (
    <div className="space-y-3">
      {[
        ["Description", item.description],
        ["Category",    item.category_detail?.name],
      ].filter(([, v]) => v).map(([label, value]) => (
        <div key={label} className="flex gap-3 py-2.5 border-b border-slate-100 text-sm">
          <span className="font-semibold text-slate-800 w-32 flex-shrink-0">{label}</span>
          <span className="text-slate-600">{value}</span>
        </div>
      ))}
    </div>
  );
  return null;
}

// ── Lecture highlights ────────────────────────────────────────────────────────
function getLectureHighlights(item) {
  const h = [];
  if (item?.views > 0)         h.push({ icon: "mdi:eye-outline",           label: `${Number(item.views).toLocaleString()} Views` });
  if (item?.duration)          h.push({ icon: "mdi:clock-outline",          label: item.duration });
  if (item?.validity)          h.push({ icon: "mdi:timer-sand",             label: item.validity });
  if (item?.total_lectures)    h.push({ icon: "mdi:play-circle-outline",    label: `${item.total_lectures} Lectures` });
  if (item?.faculty_name)      h.push({ icon: "mdi:account-circle-outline", label: item.faculty_name });
  if (item?.subject_name)      h.push({ icon: "mdi:book-open-outline",      label: item.subject_name });
  return h;
}

const TYPE_HIGHLIGHTS = {
  book: [
    { icon: "mdi:book-open-variant-outline", label: "Physical Book"   },
    { icon: "mdi:truck-delivery-outline",    label: "Home Delivery"   },
    { icon: "mdi:shield-check-outline",      label: "Quality Assured" },
    { icon: "mdi:tag-outline",               label: "Best Price"      },
  ],
  test_series: [
    { icon: "mdi:pencil-box-multiple-outline", label: "Practice Tests"        },
    { icon: "mdi:chart-line",                  label: "Performance Analytics" },
    { icon: "mdi:clock-outline",               label: "Timed Tests"           },
    { icon: "mdi:devices",                     label: "All Devices"           },
  ],
  combo: [
    { icon: "mdi:package-variant-closed", label: "Bundle Deal"      },
    { icon: "mdi:tag-outline",            label: "Save More"        },
    { icon: "mdi:shield-check-outline",   label: "Quality Assured"  },
    { icon: "mdi:truck-delivery-outline", label: "Home Delivery"    },
  ],
};

const FAQS = [
  { q: "How will I receive my order?",   a: "Digital products are accessible immediately after purchase. Physical books are dispatched within 2-3 business days." },
  { q: "What is the return policy?",     a: "We offer a 7-day return policy on physical books if they arrive damaged. Digital products are non-refundable once accessed." },
  { q: "Can I access on mobile?",        a: "Yes, all digital products are accessible on any device — mobile, tablet, or desktop." },
  { q: "Is there any doubt support?",    a: "Doubt support is available for lecture batches. Check individual product details." },
  { q: "Will I get a certificate?",      a: "Certificates are issued upon completion of lecture batches that include certification." },
];

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const type   = params?.type;
  const slug   = params?.slug;
  const config = TYPE_CONFIG[type];

  const [item,            setItem]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [checkoutOpen,    setCheckoutOpen]    = useState(false);
  const [checkoutCart,    setCheckoutCart]    = useState([]);
  const [activeTab,       setActiveTab]       = useState("information");
  const [stickyVisible,   setStickyVisible]   = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [imgError,        setImgError]        = useState(false);

  const heroRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug || !config) return;
    setLoading(true);
    setItem(null);
    setImgError(false);

    fetch(`${API_BASE}/courses/${config.apiPath}/${slug}/`)
      .then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then(d => {
        setItem(d);
        if (type === "lecture") {
          const first = d.variants?.find(v => v.is_active);
          if (first) setSelectedVariant(first);
        }
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [slug, type]);

  // ── Sticky ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setStickyVisible((heroRef.current?.getBoundingClientRect().bottom ?? 999) < 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Price ──────────────────────────────────────────────────────────────────
  const activePrice = (() => {
    if (type === "combo") return Number(item?.combo_price || item?.price || 0);
    if (type === "lecture" && selectedVariant) return Number(selectedVariant.price);
    if (!item) return 0;
    return Number(item.price ?? item.base_price ?? 0);
  })();

  const originalPrice = item
    ? Number(selectedVariant?.original_price || item.original_price || 0) || null
    : null;
  const discountPct = (originalPrice && originalPrice > activePrice)
    ? Math.round((1 - activePrice / originalPrice) * 100) : null;

  const hasVariants = type === "lecture" && item?.variants?.length > 0;
  const highlights  = type === "lecture" ? getLectureHighlights(item) : (TYPE_HIGHLIGHTS[type] || []);

  const buildCartItem = () => {
    const price = activePrice;
    if (selectedVariant) {
      return {
        ...item,
        price,
        product_type:    type,
        selectedVariant: {
          ...selectedVariant,
          mode_display:     selectedVariant.mode_display     || selectedVariant.mode,
          language_display: selectedVariant.language_display || selectedVariant.language,
        },
      };
    }
    return { ...item, price, product_type: type, selectedVariant: null };
  };

  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) {
      toast.error("Please select a delivery mode and language first");
      return;
    }
    const cartItem = buildCartItem();
    addToCart(cartItem);
    trackActivity("add_to_cart", cartItem); // ← TRACKING [5/5]
    toast.success(
      selectedVariant
        ? `Added (${selectedVariant.mode_display || selectedVariant.mode} · ${selectedVariant.language_display || selectedVariant.language}) — ₹${activePrice.toLocaleString()}`
        : "Added to cart!",
      { icon: "🛒", position: "top-center" }
    );
  };

  const handleBuyNow = () => {
    if (hasVariants && !selectedVariant) {
      toast.error("Please select a delivery mode and language first");
      return;
    }
    setCheckoutCart([buildCartItem()]);
    setCheckoutOpen(true);
    // buy_now is tracked inside CheckoutModal when user fills name+phone and clicks Next
  };

  const handleCheckoutSuccess = () => {
    setCheckoutOpen(false);
    toast.success("🎉 Order confirmed! We'll verify your payment shortly.");
    router.push("/");
  };

  const imageUrl = imgError ? "/images/placeholder-course.jpg" : getImageUrl(item?.image);

  const tabs = [
    { key: "information", label: "Information" },
    ...(type === "lecture" ? [{ key: "content", label: "Content" }, { key: "faculty", label: "Faculty" }] : []),
    ...(type === "book"    ? [{ key: "details",  label: "Details"  }] : []),
    ...(type === "combo"   ? [{ key: "contents", label: "All Contents" }] : []),
  ];

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <div className="h-3 bg-slate-100 rounded w-48 mb-8" />
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="bg-slate-100 rounded-2xl aspect-square" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-100 rounded w-3/4" />
            <div className="h-5 bg-slate-100 rounded w-1/2" />
            <div className="h-12 bg-slate-100 rounded-xl mt-6" />
            <div className="h-12 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!item || !config) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Icon icon="mdi:book-off-outline" className="text-5xl text-slate-300" />
      <p className="text-slate-500 font-semibold">Product not found</p>
      <button onClick={() => router.push("/courses")}
        className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
        Back to Courses
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeUp    { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideDown { from { transform:translateY(-100%); opacity:0 } to { transform:translateY(0); opacity:1 } }
        .au { animation: fadeUp 0.4s ease both }
        .sd { animation: slideDown 0.25s ease }
      `}</style>

      {/* STICKY TOP BAR */}
      {stickyVisible && (
        <div className="fixed top-0 inset-x-0 z-50 bg-white border-b border-slate-200 sd"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
              <Image src={imageUrl} alt={item.title} fill className="object-cover" unoptimized onError={() => setImgError(true)} />
            </div>
            <p className="flex-1 font-semibold text-slate-900 text-sm truncate min-w-0">{item.title}</p>
            <div className="flex items-center gap-3 flex-shrink-0">
              {originalPrice && <span className="hidden sm:block text-slate-400 line-through text-sm">₹{originalPrice.toLocaleString()}</span>}
              <span className="font-bold text-slate-900 text-base">₹{activePrice.toLocaleString()}</span>
              <button onClick={handleAddToCart}
                className="hidden sm:flex items-center gap-1.5 bg-primary/15 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors">
                <Icon icon="mdi:cart-plus-outline" className="text-base" /> Add to Cart
              </button>
              <button onClick={handleBuyNow}
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors">
                Buy now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-white">
        {/* HERO */}
        <div ref={heroRef} className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-8">

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 flex-wrap pt-16">
              <button onClick={() => router.push("/")} className="hover:text-slate-700 transition-colors">Home</button>
              <Icon icon="mdi:chevron-right" className="text-sm" />
              <button onClick={() => router.push("/courses")} className="hover:text-slate-700 transition-colors">Courses</button>
              <Icon icon="mdi:chevron-right" className="text-sm" />
              {item.category_detail && (
                <>
                  <button onClick={() => router.push(`/courses?category=${item.category_detail.slug}`)}
                    className="hover:text-slate-700 transition-colors">{item.category_detail.name}</button>
                  <Icon icon="mdi:chevron-right" className="text-sm" />
                </>
              )}
              <span className="text-slate-600 truncate max-w-[200px]">{item.title}</span>
            </div>

            <div className="grid lg:grid-cols-[1fr_400px] gap-8 xl:gap-12 items-start au">

              {/* LEFT: image */}
              <div>
                <div className="relative w-full rounded-2xl overflow-hidden bg-slate-100" style={{ aspectRatio: "1/1" }}>
                  <Image src={imageUrl} alt={item.title} fill className="object-cover" unoptimized onError={() => setImgError(true)} />
                  {item.is_featured && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full">★ Featured</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${config.color}`}>{config.label}</span>
                  </div>
                </div>
                <div className="hidden lg:flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                  <span className="text-sm text-slate-500 font-medium">Share:</span>
                  <div className="flex items-center gap-2">
                    <a href={`https://wa.me/?text=${encodeURIComponent(item.title + " " + (typeof window !== "undefined" ? window.location.href : ""))}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
                      <Icon icon="mdi:whatsapp" className="text-slate-600 text-base" />
                    </a>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                      className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
                      <Icon icon="mdi:link-variant" className="text-slate-600 text-base" />
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT: purchase panel */}
              <div className="lg:sticky lg:top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.category_detail && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">{item.category_detail.name}</span>
                  )}
                  {item.subject_name && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-medium">{item.subject_name}</span>
                  )}
                  {item.batch_type_display && (
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">{item.batch_type_display}</span>
                  )}
                </div>

                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-snug mb-3">{item.title}</h1>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-2xl font-bold text-primary">
                    {activePrice > 0 ? `₹${activePrice.toLocaleString()}` : "Free"}
                  </span>
                  {originalPrice && originalPrice > activePrice && (
                    <span className="text-slate-400 line-through text-base">₹{originalPrice.toLocaleString()}</span>
                  )}
                  {discountPct && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{discountPct}% OFF</span>
                  )}
                </div>

                {type !== "lecture" && type !== "combo" && (
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-2 mb-4 flex-wrap">
                    {item.validity    && <span className="flex items-center gap-1.5"><Icon icon="mdi:timer-sand" /> {item.validity}</span>}
                    {item.total_tests && <span className="flex items-center gap-1.5"><Icon icon="mdi:pencil-outline" /> {item.total_tests} Tests</span>}
                  </div>
                )}

                {type === "combo" && item.items?.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 mb-4">
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Icon icon="mdi:package-variant-closed" className="text-sm" />
                      {item.items.length} products included
                    </span>
                  </div>
                )}

                {item.description && (
                  <p className="text-sm text-slate-600 leading-relaxed mb-5 line-clamp-3">{item.description}</p>
                )}

                {hasVariants && (
                  <VariantSelector variants={item.variants} selectedVariant={selectedVariant} onChange={setSelectedVariant} />
                )}

                {type === "combo" && <ComboPriceSummary item={item} />}

                {type === "combo" && item.items?.length > 0 && (
                  <ComboContentsPanel
                    items={item.items}
                    onAddToCart={(cartItem) => {
                      addToCart(cartItem);
                      toast.success(`${cartItem.title} added to cart!`, { icon: "🛒", position: "bottom-center" });
                    }}
                  />
                )}

                {/* CTA buttons */}
                <div className="flex gap-3 mb-4">
                  <button onClick={handleAddToCart}
                    className="flex-1 bg-primary/15 text-primary hover:bg-primary hover:text-white px-4 py-3 rounded-full text-lg font-medium flex items-center justify-center gap-2 transition-colors active:scale-[0.98]">
                    <Icon icon="mdi:cart-plus-outline" className="text-base" />
                    Add to Cart
                  </button>
                  <button onClick={handleBuyNow}
                    className="flex-1 bg-primary text-white hover:bg-primary/15 hover:text-primary px-4 py-3 rounded-full text-lg font-medium flex items-center justify-center gap-2 transition-colors active:scale-[0.98]">
                    Buy — ₹{activePrice.toLocaleString()}
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1 mb-5">
                  <Icon icon="mdi:shield-check-outline" className="text-emerald-500 text-sm" />
                  {type === "book" ? "Easy Returns & Secure Payment" : "30-Day Money Back Guarantee"}
                </p>

                {highlights.length > 0 && (
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">This {config.label} includes</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {highlights.map(h => (
                        <div key={h.label} className="flex items-center gap-2 text-sm text-slate-600">
                          <Icon icon={h.icon} className="text-primary text-base flex-shrink-0" />
                          <span className="truncate">{h.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <DemoPreviewSection productType={type} productId={item?.id} />
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS TABS */}
        <div className="bg-slate-50 py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-1">Product Details</h2>
            <div className="w-16 h-0.5 bg-primary mx-auto mb-8" />
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors active:scale-[0.98]
                    ${activeTab === t.key
                      ? "bg-primary text-white hover:bg-primary/80"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 au" key={activeTab}>
              {activeTab === "information" && (
                <div className="max-w-3xl">
                  {item.batch_details
                    ? <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: item.batch_details }} />
                    : (
                      <>
                        <ProductTypeInfo type={type} item={item} />
                        {hasVariants && (
                          <div className="pt-4 mt-4">
                            <p className="font-semibold text-slate-800 text-sm mb-3">Available Variants & Pricing</p>
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                  <tr>{["Mode", "Language", "Price"].map(h => (
                                    <th key={h} className={`px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${h === "Price" ? "text-right" : "text-left"}`}>{h}</th>
                                  ))}</tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {item.variants.filter(v => v.is_active).map(v => (
                                    <tr key={v.id} className={selectedVariant?.id === v.id ? "bg-primary/5" : "hover:bg-slate-50"}>
                                      <td className="px-4 py-2.5 text-slate-700">{v.mode_display}</td>
                                      <td className="px-4 py-2.5 text-slate-700">{v.language_display}</td>
                                      <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                                        ₹{Number(v.price).toLocaleString()}
                                        {v.original_price && <span className="text-xs text-slate-400 line-through ml-1.5">₹{Number(v.original_price).toLocaleString()}</span>}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {highlights.length > 0 && (
                          <div className="pt-4 mt-4">
                            <p className="font-semibold text-slate-800 text-sm mb-3">This {config.label} includes</p>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {highlights.map(h => (
                                <div key={h.label} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
                                  <Icon icon={h.icon} className="text-primary text-lg flex-shrink-0" />
                                  <span className="text-sm text-slate-600 truncate">{h.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                </div>
              )}

              {activeTab === "content" && (
                <div className="max-w-3xl">
                  {item.curriculum?.length > 0
                    ? (
                      <div className="space-y-2">
                        {item.curriculum.map((c, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-primary text-xs font-bold">{idx + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800">{c.title}</p>
                              {c.duration && <p className="text-xs text-slate-400 mt-0.5">{c.duration}</p>}
                            </div>
                            <Icon icon="mdi:play-circle-outline" className="text-slate-400 flex-shrink-0 text-lg" />
                          </div>
                        ))}
                      </div>
                    )
                    : (
                      <div className="text-center py-12">
                        <Icon icon="mdi:book-open-variant-outline" className="text-4xl text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Curriculum details coming soon</p>
                      </div>
                    )}
                </div>
              )}

              {activeTab === "faculty" && (
                <div className="max-w-2xl">
                  {item.faculty_name
                    ? (
                      <>
                        <div className="flex gap-5 mb-6">
                          {item.faculty_image
                            ? <img src={getImageUrl(item.faculty_image)} alt={item.faculty_name}
                              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-100 flex-shrink-0"
                              onError={e => { e.target.src = "/images/placeholder-course.jpg"; }} />
                            : <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center flex-shrink-0">
                              <Icon icon="mdi:account" className="text-white text-3xl" />
                            </div>}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-slate-900">{item.faculty_name}</h3>
                            {item.faculty_subject && <p className="text-sm text-slate-500 mt-0.5">{item.faculty_subject}</p>}
                          </div>
                        </div>
                        {item.faculty_bio && (
                          <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-5">{item.faculty_bio}</p>
                        )}
                      </>
                    )
                    : (
                      <div className="text-center py-12">
                        <Icon icon="mdi:account-off-outline" className="text-4xl text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Instructor info not available</p>
                      </div>
                    )}
                </div>
              )}

              {(activeTab === "details" || activeTab === "contents") && (
                <div className="max-w-3xl">
                  {activeTab === "contents" && item.items?.length > 0
                    ? <ComboContentsPanel
                        items={item.items}
                        onAddToCart={(cartItem) => {
                          addToCart(cartItem);
                          toast.success(`${cartItem.title} added to cart!`, { icon: "🛒", position: "bottom-center" });
                        }}
                      />
                    : <ProductTypeInfo type={type} item={item} />
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white py-12 border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-1">Frequently Asked Questions</h2>
              <div className="w-16 h-0.5 bg-primary mx-auto mb-8" />
              <div className="border border-slate-200 rounded-2xl px-6 divide-y divide-slate-100">
                {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
              </div>
            </div>
          </div>
        </div>

        <SuggestedProducts
          currentId={item.id}
          currentType={type}
          categorySlug={item.category_detail?.slug}
          router={router}
        />

        <div className="h-20 lg:h-4" />
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-4 py-3"
        style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <p className="text-xs text-slate-400">Price</p>
            <p className="font-bold text-primary text-lg leading-none">
              {activePrice > 0 ? `₹${activePrice.toLocaleString()}` : "—"}
            </p>
          </div>
          <button onClick={handleAddToCart}
            className="border-2 border-primary text-primary px-3.5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-1.5 flex-shrink-0 hover:bg-primary hover:text-white transition-colors active:scale-95">
            <Icon icon="mdi:cart-plus-outline" className="text-base" />
          </button>
          <button onClick={handleBuyNow}
            className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]">
            <Icon icon="mdi:lightning-bolt" /> Buy now
          </button>
        </div>
      </div>

      {checkoutOpen && (
        <CheckoutModal
          cart={checkoutCart}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </>
  );
}