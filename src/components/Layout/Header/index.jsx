"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { headerData } from "./Navigation/menuData";
import Logo from "./Logo";
import Signin from "@/components/Auth/SignIn";
import { Icon } from "@iconify/react/dist/iconify.js";
import ProfileDropdown from "@/components/Layout/Header/ProfileDropdown";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useActiveSection } from "@/hooks/useActiveSection";
import CoursesDropdown from "./Navigation/CoursesDropdown";

export default function Header() {
  const pathUrl               = usePathname();
  const activeSection         = useActiveSection();
  const [navbarOpen, setNavbarOpen]     = useState(false);
  const [sticky, setSticky]             = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const { user, logout, loading }       = useAuth();
  const { cart }                        = useCart();
  const cartCount                       = cart.length;
  const signInRef                       = useRef(null);
  const mobileMenuRef                   = useRef(null);

  // Sticky on scroll
  useEffect(() => {
    const handleScroll = () => setSticky(window.scrollY >= 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (signInRef.current && !signInRef.current.contains(e.target)) {
        setIsSignInOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && navbarOpen) {
        setNavbarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [navbarOpen]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = (isSignInOpen || navbarOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isSignInOpen, navbarOpen]);

  // Is a nav item active?
  const isActive = (item) => {
      console.log("pathUrl:", pathUrl, "| activeSection:", activeSection, "| item:", item.label, item.href);
  // Home — sirf tab active jab koi section scroll nahi hua
  if (pathUrl.startsWith("/documentation")) {
    return item.label === "Demo";
  }

  // /courses/* page — sirf Courses active
  if (pathUrl.startsWith("/courses")) {
    return item.label === "Courses";
  }

  // Home page /
  if (pathUrl === "/") {
    // Home link — sirf jab top pe ho
    if (item.href === "/") {
      return activeSection === "";
    }
    // Section links
    if (item.href.startsWith("/#")) {
      const sectionId = item.href.replace("/#", "");
      return activeSection === sectionId;
    }
  }

  return false;
};

  if (loading) return (
    <header className="fixed top-0 z-40 w-full bg-white py-4 h-[72px]" />
  );

  return (
    <>
      <header className={`fixed top-0 z-40 w-full bg-white transition-all duration-300
        ${sticky ? "shadow-md py-3" : "shadow-none py-4"}`}>
        <div className="container mx-auto lg:max-w-screen-xl px-4 flex items-center justify-between gap-4">

          {/* Logo */}
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            {headerData.map((item, i) =>
              item.label === "Courses" ? (
                <CoursesDropdown key={i} isActive={isActive(item)} />
              ) : (
                <NavLink key={i} item={item} active={isActive(item)} />
              )
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link href="/cart" className="relative p-1">
              <Icon icon="mdi:cart-outline" className="text-2xl text-midnight_text" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs
                                 w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Auth — desktop */}
            {!user ? (
              <button
                onClick={() => setIsSignInOpen(true)}
                className="hidden lg:flex items-center gap-1.5 bg-primary text-white
                           px-5 py-2.5 rounded-full text-sm font-semibold
                           hover:bg-primary/90 transition-colors"
              >
                Sign In
              </button>
            ) : (
              <div className="hidden lg:block">
                <ProfileDropdown user={user} onLogout={logout} />
              </div>
            )}

            {/* Hamburger — mobile */}
            <button
              onClick={() => setNavbarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Icon icon="mdi:menu" className="text-2xl text-midnight_text" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {navbarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden"
             onClick={() => setNavbarOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 lg:hidden
                    transform transition-transform duration-300
                    ${navbarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <Logo />
          <button
            onClick={() => setNavbarOpen(false)}
            className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center
                       hover:bg-slate-200 transition-colors"
          >
            <Icon icon="mdi:close" className="text-slate-600 text-lg" />
          </button>
        </div>

        <nav className="p-4 flex flex-col gap-1">
          {headerData.map((item, i) => {
            const active = isActive(item);
            return (
              <Link
                key={i}
                href={item.href}
                onClick={() => setNavbarOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium
                            transition-colors
                            ${active
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                {active && <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile auth bottom */}
        <div className="absolute bottom-0 inset-x-0 p-4 border-t border-slate-100 bg-white">
          {!user ? (
            <button
              onClick={() => { setNavbarOpen(false); setIsSignInOpen(true); }}
              className="w-full bg-primary text-white py-3 rounded-full text-sm font-semibold
                         hover:bg-primary/90 transition-colors"
            >
              Sign In
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center
                              text-primary font-bold text-sm flex-shrink-0">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                <Link href="/profile" onClick={() => setNavbarOpen(false)}
                  className="text-xs text-primary hover:underline">View Profile</Link>
              </div>
              <button
                onClick={() => { logout(); setNavbarOpen(false); }}
                className="text-xs text-red-500 font-semibold px-3 py-1.5 rounded-lg
                           hover:bg-red-50 transition-colors flex-shrink-0"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SignIn Modal */}
      {isSignInOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div ref={signInRef}
               className="bg-white rounded-2xl w-full max-w-md p-8 relative shadow-2xl">
            <button
              onClick={() => setIsSignInOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-slate-100 rounded-full
                         flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <Icon icon="mdi:close" className="text-slate-600 text-base" />
            </button>
            <Signin onSuccess={() => setIsSignInOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

// Desktop nav link
function NavLink({ item, active }) {
  return (
    <Link
      href={item.href}
      className={`text-base font-medium transition-colors relative py-1
        ${active
          ? "text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full"
          : "text-slate-600 hover:text-black"}`}
    >
      {item.label}
    </Link>
  );
}