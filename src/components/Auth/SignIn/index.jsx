"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import Logo from "@/components/Layout/Header/Logo";
import { useAuth } from "@/context/AuthContext";
import { registerUser, verifyOtp, loginUser } from "@/lib/authApi";
import { Icon } from "@iconify/react";

export default function AuthPage({ onSuccess }) {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "", otp: "",
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister && !otpSent) {
        await registerUser({ name: formData.name, email: formData.email, phone: formData.phone, password: formData.password });
        setOtpSent(true);
        toast.success("OTP sent to your email 📩", {
          position: "bottom-center",
          autoClose: 3000,
        });
      } else if (isRegister && otpSent) {
        const data = await verifyOtp({ email: formData.email, otp: formData.otp });
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("user", JSON.stringify(data.user));
        login(data.user);
        toast.success("Account verified and logged in 🎉", {
          position: "top-center",
          autoClose: 2500,
        });
        onSuccess?.();
        router.replace("/");
      } else {
        try {
          const data = await loginUser({ email: formData.email, password: formData.password });
          localStorage.setItem("access", data.access);
          localStorage.setItem("refresh", data.refresh);
          localStorage.setItem("user", JSON.stringify(data.user));
          login(data.user);
          toast.success("Login successful! Welcome back 🎉", {
            position: "top-center",
            autoClose: 2500,
          });

          onSuccess?.();
          router.replace("/");
        } catch (err) {
        if (err.status === 401) {
          setIsRegister(true);
          toast.error("Account not found. Please register.", {
            position: "top-center",
            autoClose: 3000,
          });
        } else {
          toast.error(err.message);
        }
      }
    }
    } catch (err) {
    toast.error(err.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};

const step = isRegister ? (otpSent ? 3 : 2) : 1;
const stepLabel = step === 1 ? "Sign in" : step === 2 ? "Create account" : "Verify OTP";

return (
  <div className="w-full">
    {/* Logo */}
    <div className="flex justify-center mb-8">
      <Logo />
    </div>

    {/* Step indicator — register only */}
    {isRegister && (
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                transition-all duration-300
                ${s < step ? "bg-primary text-white" : s === step ? "bg-primary text-white ring-4 ring-primary/20" : "bg-slate-100 text-slate-400"}`}>
              {s < step ? <Icon icon="mdi:check" className="text-xs" /> : s}
            </div>
            {s < 3 && (
              <div className={`h-0.5 flex-1 rounded-full transition-all duration-500
                  ${s < step ? "bg-primary" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>
    )}

    {/* Header */}
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {isRegister ? (otpSent ? "Check your email" : "Create account") : "Welcome back"}
      </h1>
      <p className="text-slate-500 text-sm mt-1">
        {isRegister
          ? otpSent
            ? `We sent a 6-digit code to ${formData.email}`
            : "Fill in your details to get started"
          : "Sign in to continue learning"}
      </p>
    </div>

    {/* Google Sign In */}
    {!otpSent && (
      <>
        <button
          onClick={() => { }}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                       border border-slate-200 bg-white hover:bg-slate-50
                       text-sm font-medium text-slate-700 transition-all duration-200
                       active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 23 22" fill="none">
            <path d="M22.5001 11.2438C22.5134 10.4876 22.4338 9.73256 22.2629 8.995H11.7246V13.0771H17.9105C17.6458 14.5165 16.8094 15.7915 15.5899 16.6219L15.5704 16.7498L18.9176 19.3333L19.1407 19.3553C21.2811 17.3665 22.5001 14.5743 22.5001 11.2438Z" fill="#4285F4" />
            <path d="M11.7246 21.9999C14.7556 21.9999 17.3 21.0131 19.1407 19.3553L15.5899 16.6219C14.6824 17.2393 13.3337 17.6653 11.7246 17.6653C8.80001 17.6653 6.31779 15.7365 5.45335 13.0991L5.32778 13.1096L1.84668 15.7927L1.80017 15.908C3.63001 19.5296 7.37779 21.9999 11.7246 21.9999Z" fill="#34A853" />
            <path d="M5.45336 13.0991C5.22558 12.4264 5.10669 11.7199 5.1023 11.008C5.10685 10.2968 5.22574 9.59117 5.45336 8.91907L5.44745 8.78268L1.92127 6.05762L1.80018 6.11311C1.07532 7.5547 0.698242 9.16362 0.698242 11.008C0.698242 12.8524 1.07532 14.4613 1.80018 15.9029L5.45336 13.0991Z" fill="#FBBC05" />
            <path d="M11.7246 4.35058C13.7299 4.34408 15.6653 5.10066 17.1288 6.47394L19.232 4.38938C17.2383 2.52981 14.5298 1.50655 11.7246 1.5C7.37779 1.5 3.63001 3.97033 1.80017 7.5919L5.44228 10.4066C6.31779 7.76913 8.80001 5.84032 11.7246 4.35058Z" fill="#EB4335" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      </>
    )}

    {/* Form */}
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Register fields */}
      {isRegister && !otpSent && (
        <>
          <div className="relative">
            <Icon icon="mdi:account-outline" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input
              type="text" name="name" placeholder="Full name"
              onChange={handleChange} required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50
                           text-sm text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                           transition-all"
            />
          </div>
          <div className="relative">
            <Icon icon="mdi:phone-outline" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input
              type="tel" name="phone" placeholder="Phone number"
              onChange={handleChange} required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50
                           text-sm text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                           transition-all"
            />
          </div>
        </>
      )}

      {/* Email */}
      {!otpSent && (
        <div className="relative">
          <Icon icon="mdi:email-outline" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="email" name="email" placeholder="Email address"
            onChange={handleChange} required
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50
                         text-sm text-slate-900 placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                         transition-all"
          />
        </div>
      )}

      {/* Password */}
      {!otpSent && (
        <div className="relative">
          <Icon icon="mdi:lock-outline" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type={showPassword ? "text" : "password"} name="password" placeholder="Password"
            onChange={handleChange} required
            className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50
                         text-sm text-slate-900 placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                         transition-all"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <Icon icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} className="text-lg" />
          </button>
        </div>
      )}

      {/* OTP field */}
      {isRegister && otpSent && (
        <div>
          <div className="relative">
            <Icon icon="mdi:shield-key-outline" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input
              type="text" name="otp" placeholder="Enter 6-digit OTP"
              maxLength={6} onChange={handleChange} required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50
                           text-sm text-slate-900 placeholder:text-slate-400 tracking-widest
                           focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                           transition-all"
            />
          </div>
          <button type="button"
            className="text-xs text-primary mt-2 hover:underline">
            Resend OTP
          </button>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit" disabled={loading}
        className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm
                     hover:bg-primary/90 active:scale-[0.98] transition-all duration-200
                     disabled:opacity-60 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 shadow-md shadow-primary/20 mt-2"
      >
        {loading
          ? <><Icon icon="mdi:loading" className="animate-spin text-lg" /> Please wait…</>
          : isRegister
            ? otpSent ? "Verify & Create Account" : "Send OTP"
            : "Sign In"
        }
      </button>
    </form>

    {/* Toggle register/login */}
    <p className="text-center text-sm text-slate-500 mt-5">
      {isRegister ? (
        <>Already have an account?{" "}
          <button onClick={() => { setIsRegister(false); setOtpSent(false); }}
            className="text-primary font-semibold hover:underline">Sign In</button>
        </>
      ) : (
        <>New here?{" "}
          <button onClick={() => setIsRegister(true)}
            className="text-primary font-semibold hover:underline">Create Account</button>
        </>
      )}
    </p>
  </div>
);
}