"use client";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import { Icon } from "@iconify/react";
import { Dialog } from "@headlessui/react";

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
  return url;
};

const getPreviewUrl = (url) => {
  if (!url) return null;
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/(.*)\/view/);
    if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return url;
};

export default function DemoPreviewSection({ productType, productId }) {
  const [demoLectures, setDemoLectures]   = useState([]);
  const [demoBooks, setDemoBooks]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedPdf, setSelectedPdf]     = useState(null);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        if (productType === "lecture") {
          const res = await fetch(`${API_BASE}/demolecture/?lecture=${productId}`).then(r => r.json());
          const list = Array.isArray(res) ? res : res.results || [];
          setDemoLectures(list);
          setDemoBooks([]);
        } else if (productType === "book") {
          const res = await fetch(`${API_BASE}/demofile/?book=${productId}`).then(r => r.json());
          const list = Array.isArray(res) ? res : res.results || [];
          setDemoBooks(list);
          setDemoLectures([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, productType]);

  const hasDemo = demoLectures.length > 0 || demoBooks.length > 0;

  if (loading) return (
    <div className="mt-6 space-y-2">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  if (!hasDemo) return null;

  return (
    <>
      <div className="mt-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h3 className="text-slate-900 font-bold text-sm">Free Preview</h3>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {demoLectures.length + demoBooks.length} available
          </span>
        </div>

        <div className="flex flex-col gap-2">

          {/* Demo Lectures */}
          {demoLectures.map((item) => (
            <button
              key={`dl-${item.id}`}
              onClick={() => setSelectedVideo(item)}
              className="w-full flex items-center gap-3 bg-slate-50 hover:bg-primary/5
                         border border-slate-200 hover:border-primary/30
                         rounded-xl p-3 text-left transition-all duration-200 group"
            >
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center
                              flex-shrink-0 group-hover:bg-primary transition-colors duration-200">
                <Icon icon="solar:play-bold"
                      className="text-primary group-hover:text-white text-base ml-0.5
                                 transition-colors duration-200" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 text-xs font-semibold line-clamp-1
                               group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">Demo Lecture · Free</p>
              </div>
              <Icon icon="solar:arrow-right-linear"
                    className="text-slate-300 group-hover:text-primary text-sm flex-shrink-0
                               transition-colors duration-200" />
            </button>
          ))}

          {/* Demo Books */}
          {demoBooks.map((item) => (
            <button
              key={`db-${item.id}`}
              onClick={() => setSelectedPdf(item)}
              className="w-full flex items-center gap-3 bg-slate-50 hover:bg-emerald-50/60
                         border border-slate-200 hover:border-emerald-200
                         rounded-xl p-3 text-left transition-all duration-200 group"
            >
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center
                              flex-shrink-0 group-hover:bg-emerald-500 transition-colors duration-200">
                <Icon icon="solar:document-bold"
                      className="text-emerald-600 group-hover:text-white text-base
                                 transition-colors duration-200" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 text-xs font-semibold line-clamp-1
                               group-hover:text-emerald-700 transition-colors">
                  {item.name}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">Sample Book PDF · Free</p>
              </div>
              <Icon icon="solar:arrow-right-linear"
                    className="text-slate-300 group-hover:text-emerald-500 text-sm flex-shrink-0
                               transition-colors duration-200" />
            </button>
          ))}

        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onClose={() => setSelectedVideo(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
            {selectedVideo && getEmbedUrl(selectedVideo.url) && (
              <div className="aspect-video bg-black">
                <iframe
                  src={getEmbedUrl(selectedVideo.url)}
                  title={selectedVideo.title}
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-slate-900 font-bold text-base line-clamp-1">
                  {selectedVideo?.title}
                </h3>
                {selectedVideo?.description && (
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed line-clamp-3">
                    {selectedVideo.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center
                           hover:bg-slate-200 transition-colors flex-shrink-0"
              >
                <Icon icon="mdi:close" className="text-slate-500 text-base" />
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* PDF Modal */}
      <Dialog open={!!selectedPdf} onClose={() => setSelectedPdf(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <Icon icon="solar:book-bold" className="text-emerald-600 text-lg flex-shrink-0" />
                <h3 className="text-slate-900 font-bold text-base truncate">
                  {selectedPdf?.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPdf(null)}
                className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center
                           hover:bg-slate-200 transition-colors flex-shrink-0 ml-4"
              >
                <Icon icon="mdi:close" className="text-slate-500 text-base" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-50">
              {selectedPdf?.urls ? (
                <iframe
                  src={getPreviewUrl(selectedPdf.urls)}
                  className="w-full h-full"
                  title="PDF Viewer"
                  allow="autoplay"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-slate-400 text-sm">No PDF available.</p>
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}