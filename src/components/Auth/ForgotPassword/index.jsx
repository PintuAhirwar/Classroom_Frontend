"use client";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Logo from "@/components/Layout/Header/Logo";
import Link from "next/link";
import { Icon } from "@iconify/react";

const ForgotPassword = () => {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email address.");
    setLoading(true);
    try {
      const res = await axios.post("/api/forgot-password/reset", { email: email.toLowerCase() });
      if (res.status === 200) {
        setSent(true);
        toast.success("Reset link sent!");
      }
    } catch (error) {
      toast.error(error?.response?.data || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">

          <div className="flex justify-center mb-8">
            <Logo />
          </div>

          {!sent ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Forgot password?</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Icon icon="mdi:email-outline"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                  <input
                    type="email" placeholder="Email address"
                    value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50
                               text-sm text-slate-900 placeholder:text-slate-400
                               focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                               transition-all"
                  />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm
                             hover:bg-primary/90 active:scale-[0.98] transition-all duration-200
                             disabled:opacity-60 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2 shadow-md shadow-primary/20">
                  {loading
                    ? <><Icon icon="mdi:loading" className="animate-spin text-lg" /> Sending…</>
                    : <><Icon icon="mdi:send-outline" className="text-base" /> Send Reset Link</>
                  }
                </button>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:email-check-outline" className="text-3xl text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                We sent a password reset link to <span className="font-medium text-slate-700">{email}</span>
              </p>
              <button onClick={() => setSent(false)}
                className="mt-5 text-sm text-primary font-semibold hover:underline">
                Try a different email
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-slate-500 hover:text-primary transition-colors
                                      flex items-center justify-center gap-1">
              <Icon icon="mdi:arrow-left" className="text-base" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;