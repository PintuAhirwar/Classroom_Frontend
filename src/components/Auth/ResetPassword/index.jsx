"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Logo from "@/components/Layout/Header/Logo";
import Link from "next/link";
import { Icon } from "@iconify/react";

const ResetPassword = ({ token }) => {
  const router = useRouter();
  const [data, setData]         = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading]   = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [showPass, setShowPass]   = useState({ new: false, confirm: false });

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.post("/api/forgot-password/verify-token", { token });
        if (res.status === 200) setUserEmail(res.data.email);
      } catch (err) {
        toast.error(err?.response?.data || "Invalid or expired link");
        router.push("/forgot-password");
      } finally {
        setVerifying(false);
      }
    };
    verify();
  }, []);

  const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (data.newPassword !== data.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (data.newPassword.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/forgot-password/update", {
        email: userEmail, password: data.newPassword,
      });
      if (res.status === 200) {
        toast.success("Password updated successfully!");
        router.push("/signin");
      }
    } catch (err) {
      toast.error(err?.response?.data || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Icon icon="mdi:loading" className="animate-spin text-primary text-3xl" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">

          <div className="flex justify-center mb-8">
            <Logo />
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Set new password</h1>
            <p className="text-slate-500 text-sm mt-1">
              {userEmail && <>For <span className="font-medium text-slate-700">{userEmail}</span></>}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* New password */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                New Password
              </label>
              <div className="relative">
                <Icon icon="mdi:lock-outline"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                <input
                  type={showPass.new ? "text" : "password"}
                  name="newPassword" placeholder="Min. 8 characters"
                  value={data.newPassword} onChange={handleChange} required
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50
                             text-sm text-slate-900 placeholder:text-slate-400
                             focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                             transition-all"
                />
                <button type="button"
                  onClick={() => setShowPass(p => ({ ...p, new: !p.new }))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <Icon icon={showPass.new ? "mdi:eye-off-outline" : "mdi:eye-outline"} className="text-lg" />
                </button>
              </div>
              {/* Strength indicator */}
              {data.newPassword && (
                <div className="flex gap-1 mt-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors
                      ${data.newPassword.length >= i * 2
                        ? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-amber-400" : i <= 3 ? "bg-yellow-400" : "bg-emerald-400"
                        : "bg-slate-200"}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Confirm Password
              </label>
              <div className="relative">
                <Icon icon="mdi:lock-check-outline"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                <input
                  type={showPass.confirm ? "text" : "password"}
                  name="confirmPassword" placeholder="Repeat password"
                  value={data.confirmPassword} onChange={handleChange} required
                  className={`w-full pl-10 pr-11 py-3 rounded-xl border bg-slate-50
                             text-sm text-slate-900 placeholder:text-slate-400
                             focus:outline-none focus:ring-2 focus:border-primary/50 transition-all
                             ${data.confirmPassword && data.newPassword !== data.confirmPassword
                               ? "border-red-300 focus:ring-red-200"
                               : "border-slate-200 focus:ring-primary/20"}`}
                />
                <button type="button"
                  onClick={() => setShowPass(p => ({ ...p, confirm: !p.confirm }))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <Icon icon={showPass.confirm ? "mdi:eye-off-outline" : "mdi:eye-outline"} className="text-lg" />
                </button>
              </div>
              {data.confirmPassword && data.newPassword !== data.confirmPassword && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <Icon icon="mdi:alert-circle-outline" className="text-sm" />
                  Passwords do not match
                </p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm
                         hover:bg-primary/90 active:scale-[0.98] transition-all duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed mt-2
                         flex items-center justify-center gap-2 shadow-md shadow-primary/20">
              {loading
                ? <><Icon icon="mdi:loading" className="animate-spin text-lg" /> Saving…</>
                : <><Icon icon="mdi:check-circle-outline" className="text-base" /> Save New Password</>
              }
            </button>
          </form>

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

export default ResetPassword;