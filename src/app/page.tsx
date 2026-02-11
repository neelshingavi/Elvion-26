"use client";

import Scene from "@/components/landing/Scene";
import Overlay from "@/components/landing/Overlay";

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-hero text-hero">
      <Scene />
      <div className="relative z-10 w-full h-full overflow-y-auto no-scrollbar">
          <Overlay />
      </div>
    </main>
  );
}
