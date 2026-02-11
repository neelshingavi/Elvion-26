"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <section className={`min-h-screen flex flex-col justify-center items-center p-8 ${className}`}>
        {children}
    </section>
);

export default function Overlay() {
    return (
        <div className="absolute top-0 left-0 w-full z-10 pointer-events-none">
            {/* Phase 1: Spark */}
            <Section>
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
            </Section>

            {/* Phase 2: Structure */}
            <Section className="items-start text-left">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-xl pointer-events-auto glass p-8 radius-card text-hero"
                >
                    <h2 className="text-4xl font-bold mb-4">Structure the Chaos</h2>
                    <p className="text-lg opacity-75 mb-6">
                        Raw ideas are messy. We help you validate, organize, and structure your vision into a concrete plan.
                    </p>
                    <ul className="space-y-3 opacity-70">
                        <li className="flex items-center gap-2">✓ AI-powered Idea Validation</li>
                        <li className="flex items-center gap-2">✓ Market Research & Competitor Analysis</li>
                        <li className="flex items-center gap-2">✓ Step-by-Step Execution Roadmaps</li>
                    </ul>
                </motion.div>
            </Section>

            {/* Phase 3: Growth */}
            <Section className="items-end text-right">
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-xl pointer-events-auto glass p-8 radius-card text-hero"
                >
                    <h2 className="text-4xl font-bold mb-4">Accelerate Growth</h2>
                    <p className="text-lg opacity-75 mb-6">
                        Once validated, execute with precision. Manage tasks, track metrics, and scale your operations without friction.
                    </p>
                    <ul className="space-y-3 opacity-70 justify-end">
                        <li className="flex items-center gap-2 flex-row-reverse">Smart Task Boards ✓</li>
                        <li className="flex items-center gap-2 flex-row-reverse">Team Collaboration ✓</li>
                        <li className="flex items-center gap-2 flex-row-reverse">Document Data Room ✓</li>
                    </ul>
                </motion.div>
            </Section>

            {/* Phase 4: Launch */}
            <Section>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="text-center pointer-events-auto bg-primary-gradient backdrop-blur-lg p-12 radius-card text-hero border border-subtle"
                >
                    <h2 className="text-5xl font-black mb-6">Ready to Launch?</h2>
                    <p className="text-xl opacity-80 mb-8 max-w-lg mx-auto">
                        Join thousands of founders who turned their spark into a flame with FounderFlow.
                    </p>
                    <Link
                        href="/login"
                        className="btn bg-surface text-strong text-xl px-10 py-4 inline-flex items-center gap-2"
                    >
                        Get Started for Free <ArrowRight className="w-6 h-6" />
                    </Link>
                </motion.div>
                
                <footer className="mt-24 text-hero opacity-60 text-sm pointer-events-auto">
                    © {new Date().getFullYear()} FounderFlow Inc.
                </footer>
            </Section>
        </div>
    );
}
