"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { API_BASE } from "@/lib/api";
import { getImagePrefix } from "@/utils/getImagePrefix";

function getImageUrl(img) {
  if (!img || img === "null" || img === "undefined") return null;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const base = getImagePrefix().replace(/\/$/, "");
  const path = img.startsWith("/") ? img : `/${img}`;
  return `${base}${path}`;
}

// Preview panel with fade transition on content change
function PreviewPanel({ previewItem, previewLink, previewImageUrl, hoveredSubject, categoriesCount }) {
  const [displayed, setDisplayed] = useState(previewItem);
  const [displayedLink, setDisplayedLink] = useState(previewLink);
  const [displayedImg, setDisplayedImg] = useState(previewImageUrl);
  const [displayedSub, setDisplayedSub] = useState(hoveredSubject);
  const [fading, setFading] = useState(false);
  const fadeTimer = useRef(null);

  useEffect(() => {
    // Start fade out
    setFading(true);
    clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => {
      // Swap content at opacity 0
      setDisplayed(previewItem);
      setDisplayedLink(previewLink);
      setDisplayedImg(previewImageUrl);
      setDisplayedSub(hoveredSubject);
      // Fade back in
      setFading(false);
    }, 150);
    return () => clearTimeout(fadeTimer.current);
  }, [previewItem?.id, previewImageUrl, hoveredSubject?.id]);

  return (
    <div className="p-5 col-span-2 bg-slate-50/60">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
        {displayedSub ? displayedSub.name : "Featured"}
      </p>

      <div
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(4px)" : "translateY(0)",
          transition: "opacity 0.15s ease, transform 0.15s ease",
        }}
      >
        {displayed ? (
          <div className="flex gap-4">
            <div className="w-44 flex-shrink-0 rounded-xl overflow-hidden bg-slate-200 aspect-square self-start">
              {displayedImg ? (
                <img
                  src={displayedImg}
                  alt={displayed.title}
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.target.parentElement.innerHTML =
                      `<div class="w-full h-full flex items-center justify-center text-3xl">📚</div>`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon icon="mdi:book-open-variant" className="text-3xl text-primary/40" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 mb-1">
                {displayed.title}
              </p>
              {displayed.faculty_name && (
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                  <Icon icon="mdi:account-circle-outline" className="text-sm" />
                  {displayed.faculty_name}
                </p>
              )}
              {displayed.base_price && (
                <p className="text-base font-bold text-primary mb-3">
                  ₹{Number(displayed.base_price).toLocaleString()}
                </p>
              )}
              <Link
                href={displayedLink}
                className="inline-flex items-center gap-1.5 bg-primary text-white
                           text-xs font-semibold px-3 py-1.5 rounded-lg
                           hover:bg-primary/90 transition-colors"
              >
                {displayedSub ? "View lectures" : "View course"}
                <Icon icon="mdi:arrow-right" className="text-sm" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 items-start">
            <div className="w-40 h-28 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon icon="mdi:school-outline" className="text-4xl text-primary/50" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-snug mb-1">
                Start your learning journey today
              </p>
              <p className="text-xs text-slate-500">{categoriesCount}+ categories · Expert mentors</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between">
        <p className="text-xs text-slate-400">Explore all our products</p>
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 bg-slate-900 text-white
                     text-xs font-semibold px-4 py-2 rounded-lg
                     hover:bg-slate-700 transition-colors"
        >
          Browse All
          <Icon icon="mdi:arrow-right" className="text-sm" />
        </Link>
      </div>
    </div>
  );
}

export default function CoursesDropdown({ isActive = false }) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredSubject, setHoveredSubject] = useState(null);
  const [featuredLecture, setFeaturedLecture] = useState(null);
  const [hoveredSubjectItem, setHoveredSubjectItem] = useState(null);
  const triggerRef = useRef(null);
  const closeTimer = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/courses/category/`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : d.results || [];
        setCategories(list);
        if (list.length > 0) setHoveredCategory(list[0]);
      })
      .catch(() => { });

    fetch(`${API_BASE}/courses/lectures/?featured=true`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : d.results || [];
        if (list.length > 0) setFeaturedLecture(list[0]);
      })
      .catch(() => { });
  }, []);

  const handleOpen = () => {
    clearTimeout(closeTimer.current);
    if (!open) {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const padding = 24;
        const dropW = Math.min(vw - padding * 2, 1100);
        const left = (vw - dropW) / 2;
        setDropdownStyle({ width: `${dropW}px`, left: `${left - rect.left}px` });
      }
      setOpen(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    }
  };

  const handleClose = () => {
    setVisible(false);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setHoveredSubject(null);
      setHoveredSubjectItem(null);
    }, 200);
  };

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const fetchSubjectLecture = (subjectSlug) => {
    setHoveredSubjectItem(null);
    fetch(`${API_BASE}/courses/lectures/?subject=${subjectSlug}`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : d.results || [];
        if (list.length > 0) setHoveredSubjectItem(list[0]);
      })
      .catch(() => { });
  };

  const activeSubjects = hoveredCategory?.subjects || [];
  const previewItem = hoveredSubject ? hoveredSubjectItem : featuredLecture;
  const previewLink = hoveredSubject
    ? `/courses?category=${hoveredCategory?.slug}&subject=${hoveredSubject.slug}`
    : previewItem ? `/courses/lecture/${previewItem.slug || previewItem.id}` : "/courses";
  const previewImageUrl = previewItem ? getImageUrl(previewItem.image) : null;

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      {/* Trigger */}
      <button className={`flex items-center gap-1 text-base font-medium transition-all duration-200
                    py-2 px-3 rounded-lg relative
  ${isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
>
  {/* Text span — underline sirf iske niche */}
  <span className="relative">
    Courses
    <span className={`absolute bottom-0 left-0 h-0.5 bg-primary rounded-full
                      transition-all duration-300
                      ${isActive ? "w-full opacity-100" : "w-0 opacity-0"}`} />
  </span>

  <Icon
    icon="mdi:chevron-down"
    className={`text-base transition-transform duration-300 ${open ? "rotate-180" : ""}`}
  />
</button>
      {open && (
        <div className="absolute top-full left-0 w-full h-[10px]" />
      )}
      {open && (
        <div
          style={{
            ...dropdownStyle,
            boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-10px)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
            pointerEvents: visible ? "auto" : "none",
          }}
          className="absolute top-[calc(100%+10px)] bg-white rounded-2xl z-50
                     border border-slate-100 overflow-hidden"
          onMouseEnter={() => clearTimeout(closeTimer.current)}  // ← YE ADD KARO
          onMouseLeave={handleClose}
        >
          
          <div className="grid grid-cols-4 divide-x divide-slate-100">

            {/* Col 1: Categories */}
            <div className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Categories
              </p>
              {categories.length === 0
                ? <p className="text-xs text-slate-400">Loading…</p>
                : (
                  <ul className="space-y-0.5">
                    {categories.map(cat => (
                      <li key={cat.id}>
                        <Link
                          href={`/courses?category=${cat.slug}`}
                          onMouseEnter={() => {
                            setHoveredCategory(cat);
                            setHoveredSubject(null);
                            setHoveredSubjectItem(null);
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm
                                      transition-all duration-150 group
                            ${hoveredCategory?.id === cat.id
                              ? "bg-primary/10 text-primary"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                        >
                          {cat.icon
                            ? <Icon icon={cat.icon}
                              className={`text-base flex-shrink-0 transition-colors
                                  ${hoveredCategory?.id === cat.id
                                  ? "text-primary"
                                  : "text-slate-400 group-hover:text-slate-600"}`} />
                            : <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors
                                ${hoveredCategory?.id === cat.id ? "bg-primary" : "bg-slate-300"}`} />}
                          <span className="flex-1 truncate font-medium">{cat.name}</span>
                          <Icon icon="mdi:chevron-right"
                            className={`text-xs flex-shrink-0 transition-colors
                              ${hoveredCategory?.id === cat.id ? "text-primary" : "text-slate-300"}`} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-0.5">
                {[
                  { href: "/courses?type=book", icon: "mdi:book-open-variant-outline", label: "Books" },
                  { href: "/courses?type=test_series", icon: "mdi:pencil-box-multiple-outline", label: "Test Series" },
                  { href: "/courses?type=combo", icon: "mdi:package-variant-closed", label: "Combos" },
                ].map(({ href, icon, label }) => (
                  <Link key={label} href={href}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-slate-500
                               hover:bg-primary/10 hover:text-primary transition-colors">
                    <Icon icon={icon} className="text-sm flex-shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Col 2: Subjects */}
            <div className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                {hoveredCategory ? hoveredCategory.name : "Subjects"}
              </p>
              {activeSubjects.length === 0
                ? <p className="text-xs text-slate-400">No subjects available</p>
                : (
                  <ul className="space-y-0.5">
                    {activeSubjects.map(sub => (
                      <li key={sub.id}>
                        <Link
                          href={`/courses?category=${hoveredCategory?.slug}&subject=${sub.slug}`}
                          onMouseEnter={() => { setHoveredSubject(sub); fetchSubjectLecture(sub.slug); }}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm
                                      transition-all duration-150
                            ${hoveredSubject?.id === sub.id
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors
                            ${hoveredSubject?.id === sub.id ? "bg-primary" : "bg-slate-300"}`} />
                          {sub.name}
                          {hoveredSubject?.id === sub.id && (
                            <Icon icon="mdi:chevron-right" className="text-xs text-primary ml-auto" />
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
            </div>

            {/* Col 3+4: Preview with smooth fade */}
            <PreviewPanel
              previewItem={previewItem}
              previewLink={previewLink}
              previewImageUrl={previewImageUrl}
              hoveredSubject={hoveredSubject}
              categoriesCount={categories.length}
            />

          </div>
        </div>
      )}
    </div>
  );
}