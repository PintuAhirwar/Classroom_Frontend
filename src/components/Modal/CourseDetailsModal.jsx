"use client";
import { Dialog } from "@headlessui/react";
import { Icon } from "@iconify/react";

export default function CourseDetailsModal({
  isOpen,
  onClose,
  course,
  onAddToCart,
  isInCart,
  showCheckout = false,
  onCheckout,
}) {
  if (!course) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">

        <Dialog.Panel
          className="
            bg-white rounded-2xl w-full max-w-3xl
            flex flex-col
            max-h-[85vh]
          "
        >
          {/* HEADER */}
          <div className="flex justify-between items-center px-6 py-4 border-b shrink-0">
            <Dialog.Title className="text-2xl font-bold text-black">
              {course.title}
            </Dialog.Title>
            <button onClick={onClose}>
              <Icon icon="mdi:close" className="text-2xl text-black/60 hover:text-black" />
            </button>
          </div>

          {/* BODY (SCROLL AREA) */}
          <div
            className="
              px-6 py-5 space-y-6
              overflow-y-auto
              scrollbar-thin
            "
          >
            {/* FACULTY */}
            <p className="text-black/70 text-lg">
              Faculty: <span className="font-medium">{course.faculty}</span>
            </p>

            {/* DETAILS */}
            <div className="bg-gray-50 rounded-xl p-5 leading-relaxed text-black/80">
              {course.details || "Course details will be updated soon."}
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t flex justify-between items-center shrink-0">
            <div className="text-2xl font-semibold text-black">
              ₹{course.price}
            </div>

            {showCheckout ? (
              <button
                onClick={onCheckout}
                className="px-8 py-3 rounded-full text-lg font-medium transition"
              >
                Go to Checkout →
              </button>
            ) : (
              <button
                onClick={() => onAddToCart(course)}
                disabled={isInCart(course.id)}
                className={`block px-8 py-3 rounded-full text-lg font-medium transition-all duration-300
      ${isInCart(course.id)
                    ? "bg-primary text-white hover:bg-primary/15 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/15 hover:text-primary"
                  }`}
              >
                {isInCart(course.id) ? "Added" : "Add to Cart"}
              </button>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
