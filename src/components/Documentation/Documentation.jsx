// ─── Documentation.jsx (main wrapper) ────────────────────────────────────────
"use client";
import { useState } from "react";
import { Demolecture } from "./Demolecture";
import { Demobooks } from "./Demobooks";
import { Icon } from "@iconify/react";

const TABS = [
  { key: "lecture", label: "Demo Lectures", icon: "solar:play-circle-bold" },
  { key: "book",    label: "Demo Books",    icon: "solar:book-bold"         },
];

export const Documentation = () => {
  const [activeSection, setActiveSection] = useState("lecture");

  return (
    <div className="min-h-screen">
      <div className="container mx-auto lg:max-w-screen-xl px-4 pt-24 lg:pt-36 pb-20">

        {/* Header */}
        <div className="mb-10">
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">
            Free Preview
          </p>
          <h1 className="text-midnight_text text-4xl lg:text-5xl font-semibold">
            Try before you buy.
          </h1>
          <p className="text-slate-500 text-base mt-3 max-w-xl leading-relaxed">
            Explore our demo lectures and sample books before enrolling.
            Get a feel for the quality of our content.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-10">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold
                          border transition-all duration-200
                          ${activeSection === tab.key
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                            : "bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
                          }`}
            >
              <Icon icon={tab.icon} className="text-base" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeSection === "lecture" && <Demolecture />}
          {activeSection === "book"    && <Demobooks  />}
        </div>

      </div>
    </div>
  );
};

export default Documentation;