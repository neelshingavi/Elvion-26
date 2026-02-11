"use client";

import Scene from "@/components/landing/Scene";
import Overlay from "@/components/landing/Overlay";
import Navbar from "@/components/landing/Navbar";

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-black text-white">
      <Navbar />
      <Scene />
      <div className="relative z-10 w-full h-full overflow-y-auto no-scrollbar">
        <Overlay />
      </div>
    </main>
  );
}

