"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/landing/Footer";
import { RefObject, useRef } from "react";

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <section className={`py-12 flex flex-col justify-center items-center p-4 relative ${className}`}>
        {children}
    </section>
);

interface OverlayProps {
    containerRef: RefObject<HTMLDivElement | null>;
}

export default function Overlay({ containerRef }: OverlayProps) {
    const { scrollYProgress } = useScroll({
        container: containerRef,
    });

    const scaleY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div className="absolute top-0 left-0 w-full z-10 pointer-events-none">

            {/* Phase 1: Spark (Hero) */}
            <Section className="min-h-screen">
                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="text-center pointer-events-auto"
                    >
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 text-hero-gradient">
                            Founder<span className="text-primary">Flow</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-hero opacity-70 max-w-2xl mx-auto mb-8">
                            The journey from a chaotic spark to a scalable empire.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link
                                href="/login"
                                className="btn-primary text-lg px-8 py-3"
                            >
                                Start Building <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                        <div className="mt-12 animate-bounce">
                            <p className="text-sm text-hero opacity-60">Scroll to Explore</p>
                        </div>
                    </motion.div>
                </div>
            </Section>

            {/* Need for FounderFlow Section (Replaces About Us) */}
            <div id="about" className="relative z-10 py-16 bg-black/50 backdrop-blur-sm border-y border-white/5">
                <Section className="!py-0">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto text-center pointer-events-auto px-6"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Why FounderFlow?</h2>
                        <p className="text-base text-zinc-300 leading-relaxed mb-6">
                            Building a startup is overwhelming. You juggle widely disconnected tools for planning, funding, and growth, leading to chaos and lost focus.
                        </p>
                        <p className="text-base text-zinc-300 leading-relaxed mb-6">
                            FounderFlow is the <span className="text-indigo-400 font-semibold">Agentic Startup Operating System</span>. We unify every stage of your journey—from idea validation to Series A—into one intelligent, cohesive platform.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <h3 className="text-xl font-bold text-indigo-400 mb-1">Unified</h3>
                                <p className="text-zinc-400 text-xs">All tools in one place</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <h3 className="text-xl font-bold text-purple-400 mb-1">Intelligent</h3>
                                <p className="text-zinc-400 text-xs">AI-driven insights</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <h3 className="text-xl font-bold text-pink-400 mb-1">Scalable</h3>
                                <p className="text-zinc-400 text-xs">Grow without friction</p>
                            </div>
                        </div>
                    </motion.div>
                </Section>
            </div>

            {/* Tree Nodes & Branches Container - FEATURES SECTION */}
            <div id="features" className="relative max-w-4xl mx-auto my-16 overflow-hidden">
                {/* Tree Structure Background - Confined to features */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-px bg-white/10 z-0 hidden md:block">
                    <motion.div
                        style={{ scaleY, originY: 0 }}
                        className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                    />
                </div>

                {/* Alternating Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 relative py-8">
                    {/* Phase 2: Structure (Left) */}
                    <div className="md:text-right pr-6 py-4 flex flex-col items-center md:items-end">
                        <div className="hidden md:block absolute right-0 top-1/2 w-6 h-[2px] bg-indigo-500 origin-right translate-x-1/2 z-0">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,1)]"></div>
                        </div>

                        <Section className="!py-0 !flex-none w-full">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                                className="pointer-events-auto glass p-5 radius-card text-hero w-full max-w-sm flex flex-col items-center text-center"
                            >
                                <h2 className="text-xl font-bold mb-2">Structure the Chaos</h2>
                                <p className="text-sm opacity-75 mb-3 leading-snug">
                                    Raw ideas are messy. We help you validate, organize, and structure your vision into a concrete plan.
                                </p>
                                <ul className="space-y-1 opacity-70 text-xs w-full">
                                    <li className="flex justify-center items-center gap-2">✓ AI-powered Idea Validation</li>
                                    <li className="flex justify-center items-center gap-2">✓ Market Research & Competitor Analysis</li>
                                    <li className="flex justify-center items-center gap-2">✓ Execution Roadmaps</li>
                                </ul>
                            </motion.div>
                        </Section>
                    </div>
                    {/* Right Spacer */}
                    <div className="hidden md:block"></div>

                    {/* Left Spacer */}
                    <div className="hidden md:block"></div>
                    {/* Phase 2.5: Community (Right) */}
                    <div className="md:text-left pl-6 py-4 flex flex-col items-center md:items-start relative">
                        <div className="hidden md:block absolute left-0 top-1/2 w-6 h-[2px] bg-purple-500 origin-left -translate-x-1/2 z-0">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,1)]"></div>
                        </div>

                        <Section className="!py-0 !flex-none w-full">
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                                className="pointer-events-auto glass p-5 radius-card text-hero w-full max-w-sm flex flex-col items-center text-center"
                            >
                                <h2 className="text-xl font-bold mb-2">Network & Community</h2>
                                <p className="text-sm opacity-75 mb-3 leading-snug">
                                    Connect with like-minded founders, potential co-founders, and industry experts.
                                </p>
                                <ul className="space-y-1 opacity-70 text-xs w-full">
                                    <li className="flex justify-center items-center gap-2">✓ Founder Matching</li>
                                    <li className="flex justify-center items-center gap-2">✓ Expert AMAs</li>
                                    <li className="flex justify-center items-center gap-2">✓ Global Community</li>
                                </ul>
                            </motion.div>
                        </Section>
                    </div>

                    {/* Phase 3: Growth (Left) */}
                    <div className="md:text-right pr-6 py-4 flex flex-col items-center md:items-end relative">
                        <div className="hidden md:block absolute right-0 top-1/2 w-6 h-[2px] bg-pink-500 origin-right translate-x-1/2 z-0">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,1)]"></div>
                        </div>

                        <Section className="!py-0 !flex-none w-full">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                                className="pointer-events-auto glass p-5 radius-card text-hero w-full max-w-sm flex flex-col items-center text-center"
                            >
                                <h2 className="text-xl font-bold mb-2">Accelerate Growth</h2>
                                <p className="text-sm opacity-75 mb-3 leading-snug">
                                    Once validated, execute with precision. Manage tasks, track metrics, and scale your operations.
                                </p>
                                <ul className="space-y-1 opacity-70 text-xs w-full">
                                    <li className="flex justify-center items-center gap-2">✓ Smart Task Boards</li>
                                    <li className="flex justify-center items-center gap-2">✓ Team Collaboration</li>
                                    <li className="flex justify-center items-center gap-2">✓ Doc Data Room</li>
                                </ul>
                            </motion.div>
                        </Section>
                    </div>
                    {/* Right Spacer */}
                    <div className="hidden md:block"></div>

                    {/* Left Spacer */}
                    <div className="hidden md:block"></div>
                    {/* Phase 3.5: Mentorship (Right) */}
                    <div className="md:text-left pl-6 py-4 flex flex-col items-center md:items-start relative">
                        <div className="hidden md:block absolute left-0 top-1/2 w-6 h-[2px] bg-rose-500 origin-left -translate-x-1/2 z-0">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,1)]"></div>
                        </div>

                        <Section className="!py-0 !flex-none w-full">
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                                className="pointer-events-auto glass p-5 radius-card text-hero w-full max-w-sm flex flex-col items-center text-center"
                            >
                                <h2 className="text-xl font-bold mb-2">Expert Mentorship</h2>
                                <p className="text-sm opacity-75 mb-3 leading-snug">
                                    Get guidance from those who have been there. 1-on-1 sessions with successful founders and VCs.
                                </p>
                                <ul className="space-y-1 opacity-70 text-xs w-full">
                                    <li className="flex justify-center items-center gap-2">✓ Weekly Office Hours</li>
                                    <li className="flex justify-center items-center gap-2">✓ Curated Material</li>
                                    <li className="flex justify-center items-center gap-2">✓ Pitch Deck Reviews</li>
                                </ul>
                            </motion.div>
                        </Section>
                    </div>

                    {/* Phase 3.8: Funding (Left) */}
                    <div className="md:text-right pr-6 py-4 flex flex-col items-center md:items-end relative">
                        <div className="hidden md:block absolute right-0 top-1/2 w-6 h-[2px] bg-orange-500 origin-right translate-x-1/2 z-0">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,1)]"></div>
                        </div>

                        <Section className="!py-0 !flex-none w-full">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 0, x: 0 }}
                                transition={{ duration: 0.6 }}
                                className="pointer-events-auto glass p-5 radius-card text-hero w-full max-w-sm flex flex-col items-center text-center"
                            >
                                <h2 className="text-xl font-bold mb-2">Secure Funding</h2>
                                <p className="text-sm opacity-75 mb-3 leading-snug">
                                    We prepare you for the raise. From valuation to introductions, we bridge the gap.
                                </p>
                                <ul className="space-y-1 opacity-70 text-xs w-full">
                                    <li className="flex justify-center items-center gap-2">✓ Investor CRM</li>
                                    <li className="flex justify-center items-center gap-2">✓ Cap Table Management</li>
                                    <li className="flex justify-center items-center gap-2">✓ Due Diligence Prep</li>
                                </ul>
                            </motion.div>
                        </Section>
                    </div>
                    {/* Right Spacer */}
                    <div className="hidden md:block"></div>
                </div>
            </div>

            {/* Launch Section */}
            <div id="get-started">
                <Section className="relative z-10 py-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="text-center pointer-events-auto bg-black/40 backdrop-blur-xl p-10 radius-card border border-white/10 shadow-2xl relative z-10 max-w-2xl mx-auto"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-white">
                            Ready to Launch?
                        </h2>
                        <p className="text-base md:text-lg text-zinc-400 mb-8 max-w-md mx-auto">
                            Join thousands of founders who turned their spark into a flame with FounderFlow.
                        </p>
                        <Link
                            href="/login"
                            className="btn bg-white text-black hover:bg-zinc-200 text-lg px-8 py-3 inline-flex items-center gap-2 rounded-full font-semibold transition-all hover:scale-105"
                        >
                            Get Started for Free <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </Section>
            </div>

            <div className="relative z-20">
                <Footer />
            </div>
        </div>
    );
}
