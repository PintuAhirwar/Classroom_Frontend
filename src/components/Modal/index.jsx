"use client";
import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

export default function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);

  // 🔴 outside click close (signin jaisa)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 animate-fadeIn"
      >
        {/* ❌ close icon */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl text-black/60 hover:text-black"
        >
          <Icon icon="mdi:close" />
        </button>

        {children}
      </div>
    </div>
  );
}
