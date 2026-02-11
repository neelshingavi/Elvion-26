"use client";

import { useRef } from "react";
import Scene from "@/components/landing/Scene";
import Overlay from "@/components/landing/Overlay";
import Navbar from "@/components/landing/Navbar";

export default function Home() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black text-white">
      <Navbar />

      <Scene />
      <div
        ref={scrollRef}
        className="relative z-10 w-full h-full overflow-y-auto no-scrollbar scroll-smooth"
      >
        <Overlay containerRef={scrollRef} />
      </div>
    </main>
  );
}
