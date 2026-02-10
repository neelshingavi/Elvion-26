"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Experience from "./Experience";
import { Loader } from "@react-three/drei";

export default function Scene() {
    return (
        <div className="fixed inset-0 z-0">
            <Canvas
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 1.5]}
                camera={{ position: [0, 0, 5], fov: 50 }}
            >
                <Suspense fallback={null}>
                    <Experience />
                </Suspense>
            </Canvas>
            <Loader />
        </div>
    );
}
