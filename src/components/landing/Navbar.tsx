"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export default function Navbar() {
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 50);
    });

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/50 backdrop-blur-md border-b border-white/10" : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2">
                    <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        Founder
                    </span>
                    <span className="text-indigo-500">Flow</span>
                </Link>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
                        <Link href="#features" className="hover:text-white transition-colors">
                            Features
                        </Link>
                        <Link href="#about" className="hover:text-white transition-colors">
                            About
                        </Link>
                    </div>

                    <div className="h-6 w-px bg-white/10 hidden md:block" />

                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors px-4 py-2"
                        >
                            Log in
                        </Link>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
