import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Problems from "@/components/sections/Problems";
import Features from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import Simulation from "@/components/sections/Simulation";
import Pricing from "@/components/sections/Pricing";
import Testimonials from "@/components/sections/Testimonials";
import CTA from "@/components/sections/CTA";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="w-full relative overflow-x-hidden">
        <Hero />
        <Problems />
        <Features />
        <HowItWorks />
        <Simulation />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
