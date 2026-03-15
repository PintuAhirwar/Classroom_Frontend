"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Icon } from "@iconify/react";
import { Dialog } from "@headlessui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getImagePrefix } from "@/utils/util";

function getImageUrl(img) {
  if (!img || img === "null" || img === "undefined") return "/images/placeholder-course.jpg";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const base = getImagePrefix().replace(/\/$/, "");
  const path = img.startsWith("/") ? img : `/${img}`;
  return `${base}${path}`;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
      <div className="bg-slate-200 aspect-[4/3]" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
        <div className="h-9 bg-slate-200 rounded-full w-full mt-3" />
      </div>
    </div>
  );
}

const getPreviewUrl = (url) => {
  if (!url) return null;
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/(.*)\/view/);
    if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return url;
};

export const Demobooks = () => {
  const router = useRouter();
  const [books, setBooks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiGet("/demofile/")
      .then((data) => {
        const list = Array.isArray(data) ? data : data.results || [];
        setBooks(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleBuyBook = (e, bookDetail) => {
    e.stopPropagation();
    router.push(`/courses/book/${bookDetail.slug}`);
  };

  return (
    <>
      <div>
        <p className="text-slate-400 text-sm mb-6 flex items-center gap-1.5">
          <Icon icon="solar:info-circle-linear" className="text-base flex-shrink-0" />
          Sample pages from our books. Purchase to get full access.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
            : books.map((book, i) => (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100
                             hover:shadow-xl hover:-translate-y-1 transition-all duration-300
                             group flex flex-col"
                  style={{ animation: `fadeInUp 0.4s ease ${Math.min(i * 60, 400)}ms both` }}
                >
                  {/* Cover image */}
                  <div className="relative overflow-hidden bg-slate-100 aspect-[4/3]">
                    <Image
                      src={getImageUrl(book.image)}
                      alt={book.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { e.target.src = "/images/placeholder-course.jpg"; }}
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold
                                       px-2 py-0.5 rounded-full">
                        Sample
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <Icon icon="solar:book-bold" className="text-primary text-lg flex-shrink-0 mt-0.5" />
                      <h5 className="text-slate-900 font-bold text-base line-clamp-1
                                     group-hover:text-primary transition-colors">
                        {book.name}
                      </h5>
                    </div>
                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed flex-1 mb-3">
                      {book.description}
                    </p>

                    <button
                      onClick={() => setSelectedBook(book)}
                      className="w-full flex items-center justify-center gap-2
                                 bg-primary/10 text-primary hover:bg-primary hover:text-white
                                 px-4 py-2.5 rounded-full text-sm font-semibold
                                 transition-all duration-200 active:scale-95 mb-3"
                    >
                      <Icon icon="solar:document-bold" className="text-base" />
                      View Sample PDF
                    </button>

                    {/* Buy Book button — sirf tab dikhega jab book linked ho */}
                    {book.book_detail && (
                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                          <Icon icon="solar:tag-linear" className="text-xs" />
                          Buy: <span className="text-slate-600 font-medium line-clamp-1 ml-1">
                            {book.book_detail.title}
                          </span>
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-primary font-black text-base">
                            ₹{Number(book.book_detail.price).toLocaleString()}
                          </span>
                          <button
                            onClick={(e) => handleBuyBook(e, book.book_detail)}
                            className="flex items-center gap-1.5 bg-primary text-white
                                       px-4 py-2 rounded-full text-xs font-semibold
                                       hover:bg-primary/90 transition-all duration-200
                                       active:scale-95 flex-shrink-0"
                          >
                            <Icon icon="solar:cart-plus-bold" className="text-sm" />
                            Buy Book
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
        </div>

        {!loading && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Icon icon="solar:book-bold" className="text-3xl text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-700">No sample books yet</h3>
            <p className="text-slate-400 text-sm mt-1">Check back soon</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog
        open={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm
                        flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl w-full max-w-4xl
                                   h-[90vh] flex flex-col overflow-hidden shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <Icon icon="solar:book-bold" className="text-primary text-lg flex-shrink-0" />
                <h3 className="text-slate-900 font-bold text-base truncate">
                  {selectedBook?.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBook(null)}
                className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center
                           hover:bg-slate-200 transition-colors flex-shrink-0 ml-4"
              >
                <Icon icon="mdi:close" className="text-slate-500 text-base" />
              </button>
            </div>

            {/* PDF viewer */}
            <div className="flex-1 overflow-hidden bg-slate-50">
              {selectedBook?.urls ? (
                <iframe
                  src={getPreviewUrl(selectedBook.urls)}
                  className="w-full h-full"
                  title="PDF Viewer"
                  allow="autoplay"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Icon icon="solar:document-bold" className="text-slate-300 text-6xl mb-4" />
                  <p className="text-slate-500 font-medium">No PDF available.</p>
                </div>
              )}
            </div>

            {/* Buy button in modal footer */}
            {selectedBook?.book_detail && (
              <div className="px-6 py-4 border-t border-slate-100 bg-white
                              flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 mb-0.5">Full Book</p>
                  <p className="text-slate-900 font-bold text-sm line-clamp-1">
                    {selectedBook.book_detail.title}
                  </p>
                  <p className="text-primary font-black text-lg mt-0.5">
                    ₹{Number(selectedBook.book_detail.price).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    setSelectedBook(null);
                    handleBuyBook(e, selectedBook.book_detail);
                  }}
                  className="flex items-center gap-2 bg-primary text-white
                             px-5 py-2.5 rounded-full text-sm font-semibold
                             hover:bg-primary/90 transition-all duration-200
                             active:scale-95 flex-shrink-0 shadow-md shadow-primary/20"
                >
                  <Icon icon="solar:cart-plus-bold" className="text-base" />
                  Buy Book
                </button>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};