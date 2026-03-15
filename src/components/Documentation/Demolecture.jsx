"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Icon } from "@iconify/react";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { toast } from "react-toastify";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
      <div className="bg-slate-200 aspect-video" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
        <div className="h-9 bg-slate-200 rounded-full w-full mt-3" />
      </div>
    </div>
  );
}

const getEmbedUrl = (url) => {
  if (!url) return null;
  if (url.includes("youtube.com/watch?v=")) {
    const videoId = new URL(url).searchParams.get("v");
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes("youtu.be/")) {
    return `https://www.youtube.com/embed/${url.split("youtu.be/")[1]}`;
  }
  if (url.includes("drive.google.com") && url.includes("/view")) {
    return url.replace("/view", "/preview");
  }
  if (url.endsWith(".pdf")) return url + "#view=FitH";
  return url;
};

export const Demolecture = () => {
  const router  = useRouter();
  const { addToCart } = useCart();
  const [lectures, setLectures]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [selectedLecture, setSelectedLecture] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiGet("/demolecture/")
      .then((data) => {
        const list = Array.isArray(data) ? data : data.results || [];
        setLectures(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleBuyLecture = (e, lectureDetail) => {
    e.stopPropagation();
    router.push(`/courses/lectures/${lectureDetail.slug}`);
  };

  return (
    <>
      <div>
        <p className="text-slate-400 text-sm mb-6 flex items-center gap-1.5">
          <Icon icon="solar:info-circle-linear" className="text-base flex-shrink-0" />
          These are preview lectures. Enroll to access the full course.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
            : lectures.map((item, i) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100
                             hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group
                             flex flex-col"
                  style={{ animation: `fadeInUp 0.4s ease ${Math.min(i * 60, 400)}ms both` }}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-slate-900 overflow-hidden flex-shrink-0">
                    {getEmbedUrl(item.url) ? (
                      <iframe
                        src={getEmbedUrl(item.url)}
                        title={item.title}
                        allowFullScreen
                        className="w-full h-full pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon icon="solar:play-circle-bold" className="text-white/30 text-6xl" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <button
                      onClick={() => setSelectedLecture(item)}
                      className="absolute inset-0 flex items-center justify-center
                                 bg-black/0 hover:bg-black/40 transition-all duration-300 group/play"
                    >
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center
                                      scale-0 group-hover/play:scale-100 transition-transform duration-300 shadow-lg">
                        <Icon icon="solar:play-bold" className="text-primary text-xl ml-0.5" />
                      </div>
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <h5 className="text-slate-900 font-bold text-base line-clamp-1 mb-1.5
                                   group-hover:text-primary transition-colors">
                      {item.title}
                    </h5>
                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-3 flex-1">
                      {item.description}
                    </p>

                    <button
                      onClick={() => setSelectedLecture(item)}
                      className="flex items-center gap-1.5 text-primary text-xs font-semibold
                                 hover:gap-2.5 transition-all duration-200 mb-4"
                    >
                      <Icon icon="solar:play-circle-bold" className="text-sm" />
                      Watch Preview
                      <Icon icon="solar:arrow-right-linear" className="text-xs" />
                    </button>

                    {/* Buy button — sirf tab dikhega jab lecture linked ho */}
                    {item.lecture_detail && (
                      <div className="border-t border-slate-100 pt-3">
                        {/* Linked product info */}
                        <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                          <Icon icon="solar:tag-linear" className="text-xs" />
                          From: <span className="text-slate-600 font-medium line-clamp-1 ml-1">
                            {item.lecture_detail.title}
                          </span>
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          {item.lecture_detail.base_price && (
                            <span className="text-primary font-black text-base">
                              ₹{Number(item.lecture_detail.base_price).toLocaleString()}
                            </span>
                          )}
                          <button
                            onClick={(e) => handleBuyLecture(e, item.lecture_detail)}
                            className="flex items-center gap-1.5 bg-primary text-white
                                       px-4 py-2 rounded-full text-xs font-semibold
                                       hover:bg-primary/90 transition-all duration-200
                                       active:scale-95 flex-shrink-0"
                          >
                            <Icon icon="solar:cart-plus-bold" className="text-sm" />
                            Buy Full Course
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
        </div>

        {!loading && lectures.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Icon icon="solar:video-library-bold" className="text-3xl text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-700">No demo lectures yet</h3>
            <p className="text-slate-400 text-sm mt-1">Check back soon</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog
        open={!!selectedLecture}
        onClose={() => setSelectedLecture(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">

            {selectedLecture && getEmbedUrl(selectedLecture.url) && (
              <div className="aspect-video bg-black">
                <iframe
                  src={getEmbedUrl(selectedLecture.url)}
                  title={selectedLecture.title}
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-slate-900 text-xl font-bold leading-snug">
                  {selectedLecture?.title}
                </h3>
                <button
                  onClick={() => setSelectedLecture(null)}
                  className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center
                             hover:bg-slate-200 transition-colors flex-shrink-0"
                >
                  <Icon icon="mdi:close" className="text-slate-500 text-base" />
                </button>
              </div>

              <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line mb-5">
                {selectedLecture?.description}
              </p>

              {/* Buy button inside modal */}
              {selectedLecture?.lecture_detail && (
                <div className="flex items-center justify-between gap-4
                                bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 mb-0.5">Full Course</p>
                    <p className="text-slate-900 font-bold text-sm line-clamp-1">
                      {selectedLecture.lecture_detail.title}
                    </p>
                    {selectedLecture.lecture_detail.base_price && (
                      <p className="text-primary font-black text-lg mt-0.5">
                        ₹{Number(selectedLecture.lecture_detail.base_price).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      setSelectedLecture(null);
                      handleBuyLecture(e, selectedLecture.lecture_detail);
                    }}
                    className="flex items-center gap-2 bg-primary text-white
                               px-5 py-2.5 rounded-full text-sm font-semibold
                               hover:bg-primary/90 transition-all duration-200
                               active:scale-95 flex-shrink-0 shadow-md shadow-primary/20"
                  >
                    <Icon icon="solar:cart-plus-bold" className="text-base" />
                    Buy Full Course
                  </button>
                </div>
              )}
            </div>
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