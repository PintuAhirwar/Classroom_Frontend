"use client";
import Image from "next/image";
import { Icon } from "@iconify/react";

const stats = [
  { value: "90%",  label: "Course completion rate",        sub: "90% of students see their course through to completion." },
  { value: "9/10", label: "Better learning outcomes",      sub: "9/10 users reported better learning outcomes."           },
  { value: "50K+", label: "Active learners",               sub: "Students actively learning across all our programs."     },
  { value: "4.9★", label: "Average course rating",         sub: "Rated by thousands of verified students."                },
];

const reasons = [
  { icon: "solar:verified-check-bold",       title: "Expert Mentors",         desc: "Learn directly from CA rankers and industry professionals with years of teaching experience."   },
  { icon: "solar:play-circle-bold",          title: "Flexible Learning",      desc: "Study at your own pace with recorded lectures, live sessions, and downloadable study material." },
  { icon: "solar:diploma-bold",              title: "Exam-Focused Content",   desc: "Curriculum designed around ICAI patterns — every topic mapped to exam relevance."               },
  { icon: "solar:chart-2-bold",              title: "Track Your Progress",    desc: "Detailed analytics, test series, and performance reports to keep you on track."                 },
  { icon: "solar:headphones-round-bold",     title: "Doubt Support",          desc: "Get your doubts resolved quickly through dedicated support channels and live Q&A sessions."     },
  { icon: "solar:shield-check-bold",         title: "Trusted Platform",       desc: "Thousands of students have cleared their exams using our structured learning system."           },
];

const WhyChooseUs = () => {
  return (
    <section id="why-us" className="py-20">
      <div className="container mx-auto lg:max-w-screen-xl px-4">

        {/* ── Top: image left + text right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center mb-24">

          {/* LEFT — image collage */}
          <div className="relative flex justify-center items-center">
            {/* Big circle bg */}
            <div className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-primary/8" />

            {/* Main image */}
            <div className="relative z-10 w-56 sm:w-64 rounded-3xl overflow-hidden shadow-xl
                            ring-4 ring-white -translate-y-4">
              <Image
                src="/images/about-main.jpg"
                alt="Student learning"
                width={256}
                height={320}
                className="w-full h-auto object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              {/* Fallback gradient if no image */}
              <div className="w-full h-72 bg-gradient-to-br from-primary/20 to-primary/5
                              flex items-center justify-center">
                <Icon icon="solar:user-rounded-bold" className="text-primary/40 text-8xl" />
              </div>
            </div>

            {/* Secondary image — overlapping bottom right */}
            <div className="absolute bottom-0 right-8 sm:right-16 z-20 w-36 sm:w-44
                            rounded-2xl overflow-hidden shadow-xl ring-4 ring-white translate-y-4">
              <Image
                src="/images/about-secondary.jpg"
                alt="Group study"
                width={176}
                height={140}
                className="w-full h-auto object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div className="w-full h-28 bg-gradient-to-br from-success/20 to-success/5
                              flex items-center justify-center">
                <Icon icon="solar:users-group-rounded-bold" className="text-success/40 text-5xl" />
              </div>
            </div>

            {/* Floating stat badge */}
            <div className="absolute top-4 left-4 sm:left-8 z-30
                            bg-white rounded-2xl shadow-lg px-4 py-3 text-center
                            ring-1 ring-slate-100">
              <p className="text-primary text-2xl font-black leading-none">2.98</p>
              <p className="text-slate-500 text-xs font-medium mt-0.5">Finished<br/>Sessions</p>
            </div>

            {/* Decorative ring */}
            <div className="absolute bottom-8 left-8 w-16 h-16 rounded-full
                            border-4 border-dashed border-primary/20 animate-spin"
                 style={{ animationDuration: "12s" }} />
          </div>
        </div>

        {/* ── Bottom: Why Choose Us grid ── */}
        <div className="mb-12 text-center">
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">Why Choose Us</p>
          <h2 className="text-midnight_text text-3xl sm:text-4xl lg:text-5xl font-semibold">
            Everything you need<br className="hidden sm:block" /> to succeed.
          </h2>
          <p className="text-slate-500 text-base mt-4 max-w-xl mx-auto leading-relaxed">
            From expert mentors to exam-focused content — we have built the complete
            learning ecosystem for CA aspirants.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r, i) => (
            <div
              key={r.title}
              className="group bg-white rounded-2xl p-6 border border-slate-100
                         hover:shadow-xl hover:-translate-y-1 transition-all duration-300
                         cursor-default"
              style={{ animation: `fadeInUp 0.4s ease ${i * 80}ms both` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4
                              group-hover:bg-primary transition-colors duration-300">
                <Icon icon={r.icon}
                      className="text-primary text-2xl group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-midnight_text text-lg font-semibold mb-2">{r.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Stats strip ── */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100 rounded-2xl overflow-hidden">
          {stats.map((s, i) => (
            <div key={s.value}
                 className="bg-white px-6 py-8 text-center"
                 style={{ animation: `fadeInUp 0.4s ease ${i * 80}ms both` }}>
              <p className="text-primary text-3xl sm:text-4xl font-black leading-none">{s.value}</p>
              <p className="text-midnight_text text-sm font-semibold mt-2">{s.label}</p>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">{s.sub}</p>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default WhyChooseUs;