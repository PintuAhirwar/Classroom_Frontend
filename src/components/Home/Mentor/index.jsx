"use client";
import { useEffect, useState, useRef } from "react";
import { apiGet } from "@/lib/api";
import Image from "next/image";
import { getImagePrefix } from "@/utils/util";
import { Icon } from "@iconify/react";

function getImageUrl(img) {
  if (!img || img === "null" || img === "undefined") return "/images/placeholder.jpg";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const base = getImagePrefix().replace(/\/$/, "");
  const path = img.startsWith("/") ? img : `/${img}`;
  return `${base}${path}`;
}

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-56 sm:w-64 animate-pulse">
      <div className="bg-slate-200 rounded-2xl aspect-[4/5]" />
    </div>
  );
}

const Mentor = () => {
  const [faculty, setFaculty]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeIdx, setActiveIdx]   = useState(0);
  const [isMobile, setIsMobile]     = useState(false);
  const trackRef    = useRef(null);
  const isDragging  = useRef(false);
  const dragStartX  = useRef(null);
  const scrollStart = useRef(null);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setLoading(true);
    apiGet("/faculty/")
      .then((data) => {
        const list = Array.isArray(data) ? data : data.results || [];
        setFaculty(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Mobile: track which card is centered
  useEffect(() => {
    if (!isMobile) return;
    const track = trackRef.current;
    if (!track) return;

    const handleScroll = () => {
      const cards = track.querySelectorAll(".mentor-card");
      const cx = track.scrollLeft + track.offsetWidth / 2;
      let closest = 0, minDist = Infinity;
      cards.forEach((c, i) => {
        const dist = Math.abs((c.offsetLeft + c.offsetWidth / 2) - cx);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      setActiveIdx(closest);
    };

    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, [isMobile, faculty]);

  // Mouse drag
  const handleMouseDown = (e) => {
    isDragging.current  = true;
    dragStartX.current  = e.clientX;
    scrollStart.current = trackRef.current?.scrollLeft || 0;
    if (trackRef.current) trackRef.current.style.cursor = "grabbing";
  };
  const handleMouseMove = (e) => {
    if (!isDragging.current || !trackRef.current) return;
    trackRef.current.scrollLeft = scrollStart.current - (e.clientX - dragStartX.current);
  };
  const handleMouseUp = () => {
    isDragging.current = false;
    if (trackRef.current) trackRef.current.style.cursor = "grab";
  };

  const scroll = (dir) => {
    trackRef.current?.scrollBy({ left: dir === "next" ? 280 : -280, behavior: "smooth" });
  };

  return (
    <section id="mentor" className="py-16 bg-deepSlate">
      <div className="container mx-auto lg:max-w-screen-xl px-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
          <div>
            <h2 className="text-midnight_text text-4xl lg:text-5xl font-semibold">
              Meet our<br />mentors.
            </h2>
            {!loading && faculty.length > 0 && (
              <p className="text-slate-500 text-sm mt-2">
                {faculty.length} expert{faculty.length !== 1 ? "s" : ""} ready to guide you
              </p>
            )}
          </div>
          {/* Desktop arrows */}
          {!loading && faculty.length > 3 && (
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => scroll("prev")}
                className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center
                           justify-center text-slate-600 hover:border-primary hover:text-primary transition-all"
              >
                <Icon icon="mdi:chevron-left" className="text-xl" />
              </button>
              <button
                onClick={() => scroll("next")}
                className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center
                           justify-center text-slate-600 hover:border-primary hover:text-primary transition-all"
              >
                <Icon icon="mdi:chevron-right" className="text-xl" />
              </button>
            </div>
          )}
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="flex gap-4 overflow-x-auto pb-4 select-none"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            cursor: "grab",
            scrollSnapType: isMobile ? "x mandatory" : "none",
          }}
        >
          <style>{`
            #mentor-track::-webkit-scrollbar { display: none; }

            /* Desktop hover */
            .mentor-card .card-img    { transition: transform 0.5s ease; }
            .mentor-card:hover .card-img { transform: scale(1.1); }
            .mentor-card .card-overlay {
              transform: translateY(100%);
              transition: transform 0.4s cubic-bezier(0.34, 1.2, 0.64, 1);
            }
            .mentor-card:hover .card-overlay { transform: translateY(0); }

            /* Mobile active card */
            .mentor-card.is-active    { transform: scale(1.06); }
            .mentor-card.is-active .card-img { transform: scale(1.1); }
            .mentor-card.is-active .card-overlay { transform: translateY(0); }
            .mentor-card.is-side      { transform: scale(0.92); opacity: 0.65; }
            .mentor-card              { transition: transform 0.35s ease, opacity 0.35s ease; }

            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(14px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {loading
            ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            : faculty.map((item, i) => {
                const isActive = isMobile && i === activeIdx;
                const isSide   = isMobile && i !== activeIdx;

                return (
                  <div
                    key={item.id || i}
                    className={`mentor-card flex-shrink-0 w-56 sm:w-64
                      ${isActive ? "is-active" : ""}
                      ${isSide   ? "is-side"   : ""}
                    `}
                    style={{
                      scrollSnapAlign: isMobile ? "center" : "none",
                      animation: `fadeInUp 0.4s ease ${Math.min(i * 60, 360)}ms both`,
                    }}
                  >
                    {/* Image container */}
                    <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-[4/5]">

                      {/* Image */}
                      <Image
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        fill
                        className="card-img object-cover object-top"
                        onError={(e) => { e.target.src = "/images/placeholder.jpg"; }}
                      />

                      {/* Social icons — desktop hover top-right */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2
                                      opacity-0 group-hover:opacity-100
                                      transition-opacity duration-300 z-10
                                      hidden sm:flex">
                        {item.instagram && (
                          <a href={item.instagram} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center
                                       text-pink-500 hover:bg-pink-500 hover:text-white transition-colors shadow-sm">
                            <Icon icon="mdi:instagram" className="text-base" />
                          </a>
                        )}
                        {item.youtube && (
                          <a href={item.youtube} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center
                                       text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-sm">
                            <Icon icon="mdi:youtube" className="text-base" />
                          </a>
                        )}
                        {item.linkedin && (
                          <a href={item.linkedin} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center
                                       text-blue-600 hover:bg-blue-600 hover:text-white transition-colors shadow-sm">
                            <Icon icon="mdi:linkedin" className="text-base" />
                          </a>
                        )}
                      </div>

                      {/* Overlay — slides up from bottom */}
                      <div className="card-overlay absolute inset-x-0 bottom-0 z-10">
                        {/* Gradient bg */}
                        <div className="absolute inset-x-0 bottom-0 h-3/4
                                        bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
                        {/* Text */}
                        <div className="relative p-4">
                          <h3 className="text-white text-base font-bold leading-tight line-clamp-1">
                            {item.name}
                          </h3>
                          {item.subject && (
                            <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{item.subject}</p>
                          )}
                          {/* Mobile social icons inside overlay */}
                          {isMobile && isActive && (
                            <div className="flex gap-2 mt-2">
                              {item.instagram && (
                                <a href={item.instagram} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center
                                             text-white hover:bg-pink-500 transition-colors">
                                  <Icon icon="mdi:instagram" className="text-sm" />
                                </a>
                              )}
                              {item.youtube && (
                                <a href={item.youtube} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center
                                             text-white hover:bg-red-500 transition-colors">
                                  <Icon icon="mdi:youtube" className="text-sm" />
                                </a>
                              )}
                              {item.linkedin && (
                                <a href={item.linkedin} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center
                                             text-white hover:bg-blue-600 transition-colors">
                                  <Icon icon="mdi:linkedin" className="text-sm" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
};

export default Mentor;