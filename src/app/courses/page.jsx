"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import { API_BASE } from "@/lib/api";
import { getImagePrefix } from "@/utils/getImagePrefix";
import { useCart } from "@/context/CartContext";
import { toast } from "react-toastify";

// ── Image helper ──────────────────────────────────────────────────────────────
function getImageUrl(img) {
  if (!img || img === "null" || img === "undefined") return "/images/placeholder-course.jpg";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const base = getImagePrefix().replace(/\/$/, "");
  const path = img.startsWith("/") ? img : `/${img}`;
  return `${base}${path}`;
}

// ── Product type config (book_set REMOVED) ────────────────────────────────────
const PRODUCT_TYPES = [
  { key: "all",         label: "All",         icon: "mdi:view-grid-outline"           },
  { key: "lecture",     label: "Lectures",    icon: "mdi:play-circle-outline"         },
  { key: "book",        label: "Books",       icon: "mdi:book-open-variant-outline"   },
  { key: "test_series", label: "Test Series", icon: "mdi:pencil-box-multiple-outline" },
  { key: "combo",       label: "Combos",      icon: "mdi:package-variant-closed"      },
];

const TYPE_BADGE = {
  lecture:     { label: "Lecture",     color: "bg-blue-100 text-blue-700"        },
  book:        { label: "Book",        color: "bg-emerald-100 text-emerald-700"  },
  test_series: { label: "Test Series", color: "bg-amber-100 text-amber-700"      },
  combo:       { label: "Combo",       color: "bg-rose-100 text-rose-700"        },
};

function normalise(item, type) {
  return {
    ...item,
    _type:      type,
    _price:     Number(item.price ?? item.base_price ?? item.combo_price ?? 0),
    _origPrice: Number(item.original_price ?? 0) || null,
    _slug:      item.slug || item.id,
    _faculty:   item.faculty_name || "",
    _image:     item.image || null,
    _title:     item.title,
    _featured:  item.is_featured || false,
    _category:  item.category_detail?.name || "",
    _subject:   item.subject_name || "",
  };
}

function FilterSection({ title, children, defaultOpen = true, count = 0 }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3.5 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors">
        <span className="flex items-center gap-2">
          {title}
          {count > 0 && <span className="bg-blue-100 text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{count}</span>}
        </span>
        <Icon icon="mdi:chevron-down" className={`text-base transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-96 pb-4" : "max-h-0"}`}>
        {children}
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const { addToCart } = useCart();

  const [allItems,    setAllItems]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [faculties,   setFaculties]   = useState([]);
  const [loading,     setLoading]     = useState(true);

  // Valid type values that can come from URL ?type= param
  const VALID_TYPES = ["lecture", "book", "test_series", "combo"];

  const [activeType,        setActiveType]        = useState(() => {
    const t = searchParams.get("type") || "";
    return VALID_TYPES.includes(t) ? t : "all";
  });
  const [selectedCategory,  setSelectedCategory]  = useState(searchParams.get("category") || "");
  const [selectedSubject,   setSelectedSubject]   = useState(searchParams.get("subject")  || "");
  const [selectedFaculty,   setSelectedFaculty]   = useState("");
  const [searchQuery,       setSearchQuery]       = useState("");
  const [sortBy,            setSortBy]            = useState("newest");
  const [priceRange,        setPriceRange]        = useState([0, 50000]);
  const [maxPrice,          setMaxPrice]          = useState(50000);
  const [gridLayout,        setGridLayout]        = useState("grid");
  const [sidebarCollapsed,  setSidebarCollapsed]  = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Pagination
  const [currentPage,       setCurrentPage]       = useState(1);
  const PAGE_SIZE = 12;

  // ── Fetch categories + faculties ───────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/courses/category/`).then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : d.results || [])).catch(() => {});
    fetch(`${API_BASE}/faculty/`).then(r => r.json())
      .then(d => setFaculties(Array.isArray(d) ? d : d.results || [])).catch(() => {});
  }, []);

  // ── Fetch ALL pages of a paginated endpoint ────────────────────────────────
  const fetchAllPages = async (firstUrl, type) => {
    const items = [];
    let url = firstUrl;
    while (url) {
      const d = await fetch(url).then(r => r.json());
      const page = Array.isArray(d) ? d : d.results || [];
      items.push(...page.map(item => normalise(item, type)));
      url = typeof d === "object" && !Array.isArray(d) ? (d.next || null) : null;
    }
    return items;
  };

  // ── Fetch all product types ────────────────────────────────────────────────
  const fetchAll = useCallback(() => {
    setLoading(true);
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedSubject)  params.set("subject",  selectedSubject);
    if (selectedFaculty)  params.set("faculty",  selectedFaculty);
    const q = params.toString();

    const endpoints = [
      { url: `${API_BASE}/courses/lectures/?${q}`,    type: "lecture"     },
      { url: `${API_BASE}/courses/books/?${q}`,       type: "book"        },
      { url: `${API_BASE}/courses/test-series/?${q}`, type: "test_series" },
      { url: `${API_BASE}/courses/combos/`,           type: "combo"       },
    ];

    Promise.allSettled(endpoints.map(e => fetchAllPages(e.url, e.type)))
      .then(results => {
        const merged = results.filter(r => r.status === "fulfilled").flatMap(r => r.value);
        const maxP   = merged.reduce((m, i) => Math.max(m, i._price), 0);
        setMaxPrice(maxP || 50000);
        setPriceRange([0, maxP || 50000]);
        setAllItems(merged);
      }).finally(() => setLoading(false));
  }, [selectedCategory, selectedSubject, selectedFaculty]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "");
    setSelectedSubject(searchParams.get("subject")   || "");
    const t = searchParams.get("type") || "";
    setActiveType(VALID_TYPES.includes(t) ? t : "all");
  }, [searchParams]);

  // Reset to page 1 whenever filters/sort/type change
  useEffect(() => { setCurrentPage(1); }, [activeType, searchQuery, sortBy, priceRange]);

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = allItems
    .filter(item => {
      if (activeType !== "all" && item._type !== activeType) return false;
      if (item._price < priceRange[0] || item._price > priceRange[1]) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!item._title?.toLowerCase().includes(q) && !item._faculty?.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc")  return a._price - b._price;
      if (sortBy === "price_desc") return b._price - a._price;
      if (sortBy === "name")       return a._title.localeCompare(b._title);
      return (b.id ?? 0) - (a.id ?? 0);
    });

  // ── Paginate filtered results ──────────────────────────────────────────────
  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const activeSubjects    = selectedCategory
    ? categories.find(c => c.slug === selectedCategory)?.subjects || []
    : categories.flatMap(c => c.subjects || []);
  const activeFiltersCount = [selectedCategory, selectedSubject, selectedFaculty].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory(""); setSelectedSubject(""); setSelectedFaculty("");
    setPriceRange([0, maxPrice]); setSearchQuery(""); setActiveType("all");
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleItemClick = (item) => {
    router.push(`/courses/${item._type}/${item._slug}`);
  };

  const handleAddToCart = (e, item) => {
    e.stopPropagation();
    addToCart({ ...item, price: item._price, title: item._title, image: item._image });
    toast.success("Added to cart!", { icon: "🛒", position: "bottom-center" });
  };

  const gridClass = {
    grid:    "grid-cols-2 lg:grid-cols-3",
    compact: "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4",
    list:    "grid-cols-1",
  }[gridLayout];

  // ── Sidebar ────────────────────────────────────────────────────────────────
// ── Extracted outside CoursesPage so React never remounts them on state change ──
function SidebarContent({
  searchQuery, setSearchQuery,
  categories, selectedCategory, setSelectedCategory, setSelectedSubject,
  activeSubjects, selectedSubject,
  faculties, selectedFaculty, setSelectedFaculty,
  priceRange, setPriceRange, maxPrice,
}) {
  return (
    <div className="px-4 pb-4">
      <FilterSection title="Search" defaultOpen>
        <div className="relative">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            placeholder="Search products…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon icon="mdi:close-circle" className="text-base" />
            </button>
          )}
        </div>
      </FilterSection>

      <FilterSection title="Categories" defaultOpen count={selectedCategory ? 1 : 0}>
        <ul className="space-y-0.5">
          {categories.map(cat => {
            const active = selectedCategory === cat.slug;
            return (
              <li key={cat.id}>
                <button onClick={() => { setSelectedCategory(active ? "" : cat.slug); setSelectedSubject(""); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all
                    ${active ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                  <span className="flex items-center gap-2.5">
                    {cat.icon
                      ? <Icon icon={cat.icon} className={`text-base flex-shrink-0 ${active ? "text-blue-500" : "text-slate-400"}`} />
                      : <span className={`w-2 h-2 rounded-full ${active ? "bg-blue-500" : "bg-slate-300"}`} />}
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${active ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                    {cat.subjects?.length || 0}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </FilterSection>

      {activeSubjects.length > 0 && (
        <FilterSection title="Subjects" defaultOpen count={selectedSubject ? 1 : 0}>
          <ul className="space-y-0.5">
            {activeSubjects.map(sub => {
              const active = selectedSubject === sub.slug;
              return (
                <li key={sub.id}>
                  <button onClick={() => setSelectedSubject(active ? "" : sub.slug)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all
                      ${active ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-blue-500" : "bg-slate-300"}`} />
                    {sub.name}
                    {active && <Icon icon="mdi:check" className="ml-auto text-blue-500 text-sm" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </FilterSection>
      )}

      {faculties.length > 0 && (
        <FilterSection title="Faculty" defaultOpen={false} count={selectedFaculty ? 1 : 0}>
          <ul className="space-y-1">
            {faculties.map(f => {
              const active = selectedFaculty === String(f.id);
              return (
                <li key={f.id}>
                  <button onClick={() => setSelectedFaculty(active ? "" : String(f.id))}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                      ${active ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                    <img src={getImageUrl(f.image)} alt={f.name}
                      className={`w-7 h-7 rounded-lg object-cover flex-shrink-0 ring-2 ${active ? "ring-blue-300" : "ring-slate-100"}`}
                      onError={e => { e.target.style.display = "none"; }} />
                    <span className="truncate">{f.name}</span>
                    {active && <Icon icon="mdi:check" className="ml-auto text-blue-500 text-sm" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </FilterSection>
      )}

      <FilterSection title="Price Range" defaultOpen={false}>
        <div className="px-1 pt-1">
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-3">
            <span>₹0</span>
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">₹{priceRange[1].toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={0}
            max={maxPrice}
            value={priceRange[1]}
            onChange={e => setPriceRange([0, Number(e.target.value)])}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 bg-slate-200"
          />
        </div>
      </FilterSection>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
      <div className="bg-slate-200 aspect-[4/3]" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-slate-200 rounded-lg w-4/5" />
        <div className="h-3 bg-slate-100 rounded-lg w-3/5" />
        <div className="h-4 bg-slate-200 rounded-lg w-2/5 mt-2" />
      </div>
    </div>
  );
}

  return (
    <>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        .pcard { animation: fadeInUp 0.4s ease both }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }
      `}</style>

      <section className="min-h-screen bg-slate-50">
        <div className="container mx-auto lg:max-w-screen-xl px-4 pt-6 pb-16">

          {/* PAGE HEADER */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
              <a href="/" className="hover:text-slate-600 transition-colors">Home</a>
              <Icon icon="mdi:chevron-right" className="text-sm" />
              <span className="text-slate-700 font-medium">Courses</span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Explore Products</h1>
                <p className="text-slate-500 text-sm mt-1">
                  {loading ? "Loading…" : (
                    filtered.length > 0
                      ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length} product${filtered.length !== 1 ? "s" : ""}`
                      : "No products found"
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-transform">
                  <Icon icon="mdi:tune-variant" className="text-lg" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{activeFiltersCount}</span>
                  )}
                </button>
                <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-semibold shadow-sm hover:border-blue-300 transition-all">
                  <Icon icon={sidebarCollapsed ? "mdi:dock-left" : "mdi:dock-right"} className="text-lg" />
                  {sidebarCollapsed ? "Filters" : "Hide"}
                </button>
                <div className="relative">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 pl-4 pr-8 py-3 rounded-xl text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer">
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price ↑</option>
                    <option value="price_desc">Price ↓</option>
                    <option value="name">A – Z</option>
                  </select>
                  <Icon icon="mdi:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
                </div>
                <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {[
                    { key: "grid",    icon: "mdi:view-grid-outline"  },
                    { key: "compact", icon: "mdi:view-comfy-outline" },
                    { key: "list",    icon: "mdi:view-list-outline"  },
                  ].map(({ key, icon }) => (
                    <button key={key} onClick={() => setGridLayout(key)}
                      className={`p-2 transition-colors ${gridLayout === key ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                      <Icon icon={icon} className="text-lg" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PRODUCT TYPE TABS */}
          <div className="flex gap-2 flex-wrap mb-5 overflow-x-auto pb-1">
            {PRODUCT_TYPES.map(t => {
              const count = t.key === "all" ? allItems.length : allItems.filter(i => i._type === t.key).length;
              const isActive = activeType === t.key;
              return (
                <button key={t.key} onClick={() => setActiveType(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all
                    ${isActive
                      ? "bg-primary text-white shadow-md"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900"}`}>
                  <Icon icon={t.icon} className="text-base" />
                  {t.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                    ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ACTIVE FILTER PILLS */}
          {(activeFiltersCount > 0 || searchQuery) && (
            <div className="flex flex-wrap gap-2 mb-5">
              {selectedCategory && (
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 text-xs px-3 py-1.5 rounded-full font-semibold">
                  {categories.find(c => c.slug === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory("")}><Icon icon="mdi:close" className="text-xs" /></button>
                </span>
              )}
              {selectedSubject && (
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 text-xs px-3 py-1.5 rounded-full font-semibold">
                  {activeSubjects.find(s => s.slug === selectedSubject)?.name}
                  <button onClick={() => setSelectedSubject("")}><Icon icon="mdi:close" className="text-xs" /></button>
                </span>
              )}
              {selectedFaculty && (
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 text-xs px-3 py-1.5 rounded-full font-semibold">
                  {faculties.find(f => String(f.id) === selectedFaculty)?.name}
                  <button onClick={() => setSelectedFaculty("")}><Icon icon="mdi:close" className="text-xs" /></button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-full font-semibold">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery("")}><Icon icon="mdi:close" className="text-xs" /></button>
                </span>
              )}
              <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-red-500 font-medium px-2 py-1.5 transition-colors">
                Clear all
              </button>
            </div>
          )}

          <div className="flex gap-5 items-start">
            {/* DESKTOP SIDEBAR */}
            <aside className={`hidden lg:block flex-shrink-0 sticky top-24 transition-all duration-300 ${sidebarCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-64 opacity-100"}`}>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">Reset</button>
                  )}
                </div>
                <SidebarContent
                  searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                  categories={categories} selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory} setSelectedSubject={setSelectedSubject}
                  activeSubjects={activeSubjects} selectedSubject={selectedSubject}
                  faculties={faculties} selectedFaculty={selectedFaculty} setSelectedFaculty={setSelectedFaculty}
                  priceRange={priceRange} setPriceRange={setPriceRange} maxPrice={maxPrice}
                />
              </div>
            </aside>

            {/* MOBILE BOTTOM SHEET */}
            {mobileSidebarOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setMobileSidebarOpen(false)} style={{ animation: "fadeIn 0.2s ease" }} />
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[88vh] flex flex-col"
                  style={{ animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
                  <div className="flex justify-center pt-3"><div className="w-9 h-1 bg-slate-200 rounded-full" /></div>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                    <h3 className="font-black text-slate-800">Filters</h3>
                    <div className="flex items-center gap-3">
                      {activeFiltersCount > 0 && <button onClick={clearFilters} className="text-sm text-blue-600 font-semibold">Reset</button>}
                      <button onClick={() => setMobileSidebarOpen(false)} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                        <Icon icon="mdi:close" className="text-base text-slate-600" />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1"><SidebarContent
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    categories={categories} selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory} setSelectedSubject={setSelectedSubject}
                    activeSubjects={activeSubjects} selectedSubject={selectedSubject}
                    faculties={faculties} selectedFaculty={selectedFaculty} setSelectedFaculty={setSelectedFaculty}
                    priceRange={priceRange} setPriceRange={setPriceRange} maxPrice={maxPrice}
                  /></div>
                  <div className="p-4 border-t border-slate-100 bg-white">
                    <button onClick={() => setMobileSidebarOpen(false)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform">
                      Show {filtered.length} Product{filtered.length !== 1 ? "s" : ""}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCT GRID */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className={`grid ${gridClass} gap-4`}>
                  {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-5">
                    <Icon icon="mdi:book-search-outline" className="text-4xl text-slate-400" />
                  </div>
                  <h3 className="text-lg font-black text-slate-700">No products found</h3>
                  <p className="text-slate-400 text-sm mt-1 mb-5">Try changing your filters</p>
                  <button onClick={clearFilters}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className={`grid ${gridClass} gap-4`}>
                  {paginated.map((item, i) => {
                    const badge   = TYPE_BADGE[item._type];
                    const discPct = item._origPrice && item._origPrice > item._price
                      ? Math.round((1 - item._price / item._origPrice) * 100) : null;

                    return (
                      <div key={`${item._type}-${item.id}`}
                        onClick={() => handleItemClick(item)}
                        className={`pcard bg-white rounded-2xl overflow-hidden cursor-pointer group
                          hover:shadow-xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.97]
                          ${gridLayout === "list" ? "flex gap-0" : ""}`}
                        style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>

                        {/* Image */}
                        <div className={`relative overflow-hidden flex-shrink-0 bg-slate-100
                          ${gridLayout === "list" ? "w-36 sm:w-44" : ""}`}>
                          <Image
                            src={getImageUrl(item._image)}
                            alt={item._title}
                            width={400} height={300}
                            className={`object-cover transition-transform duration-500 group-hover:scale-105
                              ${gridLayout === "compact" ? "w-full h-32 sm:h-36"
                                : gridLayout === "list"  ? "w-full h-full min-h-[110px]"
                                                         : "w-full h-40 sm:h-48"}`}
                            unoptimized
                            onError={(e) => { e.target.src = "/images/placeholder-course.jpg"; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-2 left-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge?.color}`}>{badge?.label}</span>
                          </div>
                          {item._featured && (
                            <div className="absolute top-2 right-2">
                              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-1.5 py-0.5 rounded-full">★</span>
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                              View Details
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className={`flex flex-col justify-between
                          ${gridLayout === "compact" ? "p-2.5" : "p-3.5"}
                          ${gridLayout === "list" ? "flex-1 p-4" : ""}`}>
                          <div>
                            {item._category && gridLayout !== "compact" && (
                              <span className="inline-block text-xs text-slate-400 font-medium mb-1">{item._category}</span>
                            )}
                            <h3 className={`font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors
                              ${gridLayout === "compact" ? "text-xs" : "text-sm sm:text-base"}`}>
                              {item._title}
                            </h3>
                            {item._faculty && (
                              <p className={`text-slate-400 mt-1 flex items-center gap-1 truncate
                                ${gridLayout === "compact" ? "text-xs" : "text-xs sm:text-sm"}`}>
                                <Icon icon="mdi:account-circle-outline" className="flex-shrink-0 text-sm" />
                                {item._faculty}
                              </p>
                            )}
                            {item._type === "book" && item.book_type_display && gridLayout !== "compact" && (
                              <p className="text-xs text-slate-400 mt-0.5">{item.book_type_display}</p>
                            )}
                            {item._type === "test_series" && gridLayout !== "compact" && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                {item.course_name?.toUpperCase()} {item.level !== "na" ? `· ${item.level}` : ""} · {item.test_type_display}
                              </p>
                            )}
                            {item._type === "combo" && gridLayout !== "compact" && (
                              <p className="text-xs text-rose-600 font-semibold mt-0.5">
                                {item.item_count} products bundled
                              </p>
                            )}
                          </div>
                          <div className="mt-2.5">
                            <div className="flex items-baseline gap-2 mb-2.5">
                              <span className={`font-black text-blue-600 ${gridLayout === "compact" ? "text-sm" : "text-base sm:text-lg"}`}>
                                {item._price > 0 ? `₹${item._price.toLocaleString()}` : "Free"}
                              </span>
                              {item._origPrice && (
                                <span className="text-xs text-slate-400 line-through">₹{item._origPrice.toLocaleString()}</span>
                              )}
                              {discPct && (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{discPct}% off</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── PAGINATION ──────────────────────────────────────────── */}
              {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                  {/* Prev */}
                  <button
                    onClick={() => { setCurrentPage(p => p - 1); scrollToTop(); }}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <Icon icon="mdi:chevron-left" className="text-base" /> Prev
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-sm select-none">…</span>
                      ) : (
                        <button key={p}
                          onClick={() => { setCurrentPage(p); scrollToTop(); }}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all
                            ${currentPage === p
                              ? "bg-primary text-white shadow-md shadow-primary/30"
                              : "bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary"}`}>
                          {p}
                        </button>
                      )
                    )}

                  {/* Next */}
                  <button
                    onClick={() => { setCurrentPage(p => p + 1); scrollToTop(); }}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    Next <Icon icon="mdi:chevron-right" className="text-base" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}