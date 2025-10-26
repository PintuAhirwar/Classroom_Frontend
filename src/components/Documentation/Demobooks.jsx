"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Icon } from "@iconify/react/dist/iconify.js";
import Image from "next/image";
import { Dialog } from "@headlessui/react";
import { getImagePrefix } from "@/utils/util";

export const Demobooks = () => {
  const [demofile, setDemofile] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    apiGet("/demofile/")
      .then(setDemofile)
      .catch(console.error);
  }, []);

  const handleSeeMore = (book) => {
    setSelectedBook(book);
    setIsOpen(true);
  };

  // 🔹 Convert Google Drive "view" link to "preview" link
  const getPreviewUrl = (url) => {
    if (!url) return null;
    if (url.includes("drive.google.com")) {
      const fileIdMatch = url.match(/\/d\/(.*)\/view/);
      if (fileIdMatch) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }
    return url; // fallback agar normal pdf ho
  };

  return (
    <section id="books" className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4 mt-20">
      <h3 className="text-3xl font-semibold mb-10 text-black">Demo Books</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {demofile.map((book) => (
          <div
            key={book.id}
            className="bg-white rounded-2xl shadow-course-shadow p-6 flex flex-col"
          >
            {/* Book Image */}
            <div className="relative rounded-lg overflow-hidden">
              <Image
                src={book.image}
                alt={book.name}
                width={389}
                height={262}
                className="w-full h-56 object-cover"
              />
            </div>

            {/* Book Info */}
            <div className="flex-1 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="tabler:book" className="text-primary text-lg" />
                <h5 className="text-xl font-bold text-black">{book.name}</h5>
              </div>

              {/* Short Description */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {book.description}
              </p>
              <button
                onClick={() => handleSeeMore(book)}
                className="text-primary text-sm mt-2 hover:underline"
              >
                See more
              </button>
            </div>

            {/* PDF Button */}
            <button
              onClick={() => handleSeeMore(book)} // 👈 same modal open karega
              className="mt-6 inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              <Icon icon="tabler:file" className="text-white" />
              View PDF
            </button>
          </div>
        ))}
      </div>

      {/* Modal with PDF */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl p-6 max-w-4xl w-full h-[90vh] flex flex-col">
            
            {/* PDF Viewer */}
            {selectedBook?.urls ? (
              <div className="flex-1 border rounded-lg overflow-hidden shadow">
                <iframe
                  src={getPreviewUrl(selectedBook.urls)}
                  className="w-full h-full"
                  title="PDF Viewer"
                  allow="autoplay"
                />
              </div>
            ) : (
              <p className="text-red-500">No PDF available for this book.</p>
            )}

            <Dialog.Title className="text-xl font-semibold mt-4 text-black">
              {selectedBook?.name}
            </Dialog.Title>
            <p className="text-gray-700 mb-4">{selectedBook?.description}</p>

            <div className="mt-4 text-right">
              <button
                onClick={() => setIsOpen(false)}
                className="bg-primary text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </section>
  );
};
