"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { apiGet } from "@/lib/api";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { getImagePrefix } from "@/utils/util";
import { motion, AnimatePresence } from "framer-motion";

const Hero = () => {
  const [slider, setSlider] = useState([]);
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    apiGet("/slider/")
      .then((data) => {
        const sorted = [...data].sort((a, b) => b.show_search - a.show_search);
        setSlider(sorted);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (slider.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slider.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [slider]);

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slider.length);
  }, [slider.length]);

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slider.length) % slider.length);
  }, [slider.length]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove  = (e) => { touchEndX.current  = e.touches[0].clientX; };
  const handleTouchEnd   = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
    touchStartX.current = null;
    touchEndX.current   = null;
  };

  const getUrl = (path) =>
    !path ? null :
    path.startsWith("http") ? path : `${getImagePrefix()}${path}`;

  if (!slider.length) return null;

  const item = slider[current];

  const desktopUrl = getUrl(item.desktop_image) || getUrl(item.image);
  const mobileUrl  = getUrl(item.mobile_image)  || desktopUrl;
  const activeUrl  = isMobile ? mobileUrl : desktopUrl;
  const activeW    = isMobile ? 750  : 2400;
  const activeH    = isMobile ? 900  : 750;

  // ── Nav Arrows — dark style, desktop only ───────────────
  const NavArrows = () =>
    slider.length > 1 && !isMobile ? (
      <>
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20
            w-11 h-11 rounded-full flex items-center justify-center
            transition-all duration-200
            bg-black/50 hover:bg-black/75"
          aria-label="Previous"
        >
          <Icon icon="solar:arrow-left-linear" className="text-white text-2xl" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20
            w-11 h-11 rounded-full flex items-center justify-center
            transition-all duration-200
            bg-black/50 hover:bg-black/75"
          aria-label="Next"
        >
          <Icon icon="solar:arrow-right-linear" className="text-white text-2xl" />
        </button>
      </>
    ) : null;

  // ── Dots — dark style ────────────────────────────────────
  const Dots = () =>
    slider.length > 1 ? (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {slider.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 border-2 border-black/90
              ${current === i
                ? "w-6 h-3 bg-black/90"
                : "w-3 h-3 bg-transparent hover:bg-black/20"
              }`}
          />
        ))}
      </div>
    ) : null;

  // ── WITH SEARCH ──────────────────────────────────────────
  if (item.show_search) {
    return (
      <section
        id="home-section"
        className="relative w-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`bg-${item.id}-${isMobile}`}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="w-full"
          >
            {activeUrl && (
              <Image
                src={activeUrl}
                alt={item.title}
                width={activeW}
                height={activeH}
                className="w-full h-auto"
                priority
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0">

          {/* Desktop content — left center */}
          {!isMobile && (
            <div className="h-full container mx-auto lg:max-w-screen-xl px-8 flex items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`desk-${item.id}`}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.6 }}
                  className="max-w-lg flex flex-col gap-4"
                >
                  <div className="flex gap-2 items-center">
                    <Icon icon="solar:verified-check-bold" className="text-success text-xl" />
                    <p className="text-success text-sm font-semibold">
                      Get 30% off on first enroll
                    </p>
                  </div>
                  <h1 className="text-midnight_text text-4xl sm:text-5xl font-semibold">
                    {item.title}
                  </h1>
                  <p className="text-black/70 text-lg">
                    {item.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Mobile content — top center */}
          {isMobile && (
            <div className="w-full px-5 pt-25">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`mob-${item.id}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <div className="flex gap-2 items-center">
                    <Icon icon="solar:verified-check-bold" className="text-success text-xl" />
                    <p className="text-success text-sm font-semibold">
                      Get 30% off on first enroll
                    </p>
                  </div>
                  <h1 className="text-midnight_text text-2xl font-semibold leading-tight">
                    {item.title}
                  </h1>
                  <p className="text-black/70 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

        </div>

        <NavArrows />
        <Dots />
      </section>
    );
  }

  // ── WITHOUT SEARCH: pure image ──────────────────────────
  return (
    <section
      id="home-section"
      className="relative w-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`img-${item.id}-${isMobile}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          {activeUrl && (
            <Image
              src={activeUrl}
              alt={item.title}
              width={activeW}
              height={activeH}
              className="w-full h-auto"
              priority
            />
          )}
        </motion.div>
      </AnimatePresence>

      <NavArrows />
      <Dots />
    </section>
  );
};

export default Hero;