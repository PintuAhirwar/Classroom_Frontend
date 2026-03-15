"use client";
import { useEffect, useState } from "react";

const SECTION_IDS = ["courses", "mentor", "testimonial"];

export function useActiveSection() {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      // Agar page top pe hai — koi section active nahi
      if (window.scrollY < 50) {
        setActiveSection("");
        return;
      }

      // Sections ko upar se neeche check karo
      // Jo section viewport ke top se 60% ke andar ho wo active
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        const windowH = window.innerHeight;

        if (rect.top <= windowH * 0.6 && rect.bottom > 0) {
          setActiveSection(id);
          return;
        }
      }

      setActiveSection("");
    };

    // Pehle ek baar run karo
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return activeSection;
}