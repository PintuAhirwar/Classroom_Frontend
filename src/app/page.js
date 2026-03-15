import React from "react";
import Hero from "@/components/Home/Hero";
import Companies from "@/components/Home/Companies";
import Courses from "@/components/Home/Courses";
import Mentor from "@/components/Home/Mentor";
import Testimonial from "@/components/Home/Testimonials";
import Newsletter from "@/components/Home/Newsletter";
import WhyChooseUs from "@/components/Home/WhyChooseUs";
import { Metadata } from "next";
export const metadata = {
  title: "classroom",
};

export default function Home() {
  return (
    <main>
      <Hero />
      <Companies />
      <Courses />
      <Mentor />
      <WhyChooseUs />
      <Testimonial />
      <Newsletter />
    </main>
  );
}