"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { apiGet } from "@/lib/api";
import Image from "next/image";
import { getImagePrefix } from "@/utils/util";
import { Icon } from "@iconify/react";

function getImageUrl(img) {
    if (!img || img === "null" || img === "undefined") return "/images/placeholder-course.jpg";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    const base = getImagePrefix().replace(/\/$/, "");
    const path = img.startsWith("/") ? img : `/${img}`;
    return `${base}${path}`;
}

function normalise(item, type) {
    return {
        ...item,
        _type: type,
        _price: Number(item.price ?? item.base_price ?? item.combo_price ?? 0),
        _origPrice: Number(item.original_price ?? 0) || null,
        _slug: item.slug || item.id,
        _image: item.image || null,
        _title: item.title,
    };
}

const TYPE_BADGE = {
    lecture: { label: "Lecture", color: "bg-blue-100 text-blue-700" },
    book: { label: "Book", color: "bg-emerald-100 text-emerald-700" },
    test_series: { label: "Test Series", color: "bg-amber-100 text-amber-700" },
    combo: { label: "Combo", color: "bg-rose-100 text-rose-700" },
};

function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden animate-pulse border border-slate-100">
            <div className="bg-slate-200 aspect-[4/3]" />
            <div className="p-3 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-4/5" />
                <div className="h-3 bg-slate-100 rounded w-3/5" />
                <div className="h-4 bg-slate-200 rounded w-2/5 mt-2" />
            </div>
        </div>
    );
}

function SkeletonFilter() {
    return (
        <div className="flex gap-2 flex-wrap">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-slate-200 rounded-full animate-pulse"
                    style={{ width: `${60 + i * 15}px` }} />
            ))}
        </div>
    );
}

const ENDPOINTS = [
    { url: `${API_BASE}/courses/lectures/`, type: "lecture" },
    { url: `${API_BASE}/courses/books/`, type: "book" },
    { url: `${API_BASE}/courses/test-series/`, type: "test_series" },
    { url: `${API_BASE}/courses/combos/`, type: "combo" },
];

const Courses = () => {
    const router = useRouter();
    const [allItems, setAllItems] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState("all");
    const [loading, setLoading] = useState(true);
    const [catLoading, setCatLoading] = useState(true);

    // Fetch all product types in parallel
    useEffect(() => {
        setLoading(true);
        Promise.allSettled(
            ENDPOINTS.map(({ url, type }) =>
                fetch(url)
                    .then(r => r.json())
                    .then(d => {
                        const list = Array.isArray(d) ? d : d.results || [];
                        return list.map(item => normalise(item, type));
                    })
                    .catch(() => [])
            )
        ).then(results => {
            const merged = results
                .filter(r => r.status === "fulfilled")
                .flatMap(r => r.value);
            setAllItems(merged);
            setFiltered(merged);
        }).finally(() => setLoading(false));
    }, []);

    // Fetch categories
    useEffect(() => {
        setCatLoading(true);
        apiGet("/courses/category/")
            .then(data => {
                const list = Array.isArray(data) ? data : data.results || [];
                setCategories(list);
            })
            .catch(console.error)
            .finally(() => setCatLoading(false));
    }, []);

    // Filter by category (client-side)
    useEffect(() => {
        if (activeCategory === "all") {
            setFiltered(allItems);
        } else {
            setFiltered(
                allItems.filter(item =>
                    item.category_detail?.slug === activeCategory ||
                    item.category_slug === activeCategory ||
                    item.category === activeCategory
                )
            );
        }
    }, [activeCategory, allItems]);

    const handleCardClick = (item) => {
        router.push(`/courses/${item._type}/${item._slug}`);
    };

    return (
        <section id="courses" className="py-16 bg-slate-50">
            <div className="container mx-auto lg:max-w-screen-xl px-4">

                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-midnight_text text-4xl lg:text-5xl font-semibold">
                        Popular courses.
                    </h2>
                    <p className="text-slate-500 text-sm mt-2">
                        {loading
                            ? "Loading..."
                            : `${filtered.length} product${filtered.length !== 1 ? "s" : ""} ${activeCategory !== "all" ? "in this category" : "available"}`}
                    </p>
                </div>

                {/* Category Filter */}
                <div className="mb-8 overflow-x-auto pb-1 -mx-4 px-4">
                    {catLoading ? <SkeletonFilter /> : (
                        <div className="flex gap-2 flex-nowrap">
                            <button
                                onClick={() => setActiveCategory("all")}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold
                            whitespace-nowrap transition-all duration-200 border flex-shrink-0
                            ${activeCategory === "all"
                                        ? "bg-primary text-white border-primary shadow-sm"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary"}`}
                            >
                                <Icon icon="mdi:view-grid-outline" className="text-sm" />
                                All
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${activeCategory === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                                    {allItems.length}
                                </span>
                            </button>

                            {categories.map((cat) => {
                                const isActive = activeCategory === cat.slug;
                                const count = allItems.filter(item =>
                                    item.category_detail?.slug === cat.slug ||
                                    item.category_slug === cat.slug ||
                                    item.category === cat.slug
                                ).length;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(isActive ? "all" : cat.slug)}
                                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold
                                whitespace-nowrap transition-all duration-200 border flex-shrink-0
                                ${isActive
                                                ? "bg-primary text-white border-primary shadow-sm"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary"}`}
                                    >
                                        {cat.icon
                                            ? <Icon icon={cat.icon} className="text-sm" />
                                            : <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : "bg-primary"}`} />
                                        }
                                        {cat.name}
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                      ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Grid — first 8 only */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {loading
                        ? [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
                        : filtered.slice(0, 8).map((item, i) => {
                            const badge = TYPE_BADGE[item._type];
                            const discPct = item._origPrice && item._origPrice > item._price
                                ? Math.round((1 - item._price / item._origPrice) * 100) : null;

                            return (
                                <div
                                    key={`${item._type}-${item.id}`}
                                    onClick={() => handleCardClick(item)}
                                    className="bg-white rounded-2xl overflow-hidden cursor-pointer group
                               hover:shadow-xl hover:-translate-y-1 transition-all duration-300
                               active:scale-[0.97]"
                                >
                                    {/* Image */}
                                    <div className="relative overflow-hidden flex-shrink-0 bg-slate-100">
                                        <Image
                                            src={getImageUrl(item._image)}
                                            alt={item._title}
                                            width={400}
                                            height={300}
                                            className="w-full h-40 sm:h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                                            unoptimized
                                            onError={(e) => { e.target.src = "/images/placeholder-course.jpg"; }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="absolute top-2 left-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge?.color}`}>
                                                {badge?.label}
                                            </span>
                                        </div>
                                        {discPct && (
                                            <div className="absolute top-2 right-2">
                                                <span className="bg-emerald-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                                    {discPct}% off
                                                </span>
                                            </div>
                                        )}
                                        {item.is_featured && (
                                            <div className="absolute bottom-2 right-2">
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
                                    <div className="p-3.5">
                                        {item.category_detail?.name && (
                                            <span className="inline-block text-xs text-slate-400 font-medium mb-1">
                                                {item.category_detail.name}
                                            </span>
                                        )}
                                        <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2
                                     group-hover:text-primary transition-colors mb-1">
                                            {item._title}
                                        </h3>
                                        {item.faculty_name && (
                                            <p className="text-xs text-slate-400 flex items-center gap-1 truncate mb-2.5">
                                                <Icon icon="mdi:account-circle-outline" className="flex-shrink-0 text-sm" />
                                                {item.faculty_name}
                                            </p>
                                        )}
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-base font-black text-primary">
                                                {item._price > 0 ? `₹${item._price.toLocaleString()}` : "Free"}
                                            </span>
                                            {item._origPrice && item._origPrice > item._price && (
                                                <span className="text-xs text-slate-400 line-through">
                                                    ₹{item._origPrice.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <Icon icon="mdi:book-search-outline" className="text-3xl text-slate-400" />
                        </div>
                        <h3 className="text-base font-bold text-slate-700">No products in this category</h3>
                        <p className="text-slate-400 text-sm mt-1 mb-5">Try a different category</p>
                        <button
                            onClick={() => setActiveCategory("all")}
                            className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
                        >
                            Show All
                        </button>
                    </div>
                )}

                {/* Browse All CTA */}
                {!loading && filtered.length > 0 && (
                    <div className="flex justify-center mt-10">
                        <button
                            onClick={() => router.push(activeCategory !== "all" ? `/courses?category=${activeCategory}` : "/courses")}
                            className="flex items-center gap-2 bg-primary text-white px-8 py-3
                         rounded-full font-semibold text-sm hover:bg-primary/90
                         transition-all duration-200 shadow-sm shadow-primary/20"
                        >
                            <Icon icon="mdi:open-in-new" className="text-base" />
                            Browse All Products
                        </button>
                    </div>
                )}

            </div>

            <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </section>
    );
};

export default Courses;