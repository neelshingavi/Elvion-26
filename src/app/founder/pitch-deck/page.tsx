"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    Presentation, Sparkles, ChevronLeft, ChevronRight, Loader2, Eye, Edit3, Plus, Trash2,
    BarChart3, Users, Target, Lightbulb, Rocket, Clock, Layers, Shield, Megaphone, Briefcase,
    AlertTriangle, DollarSign, CheckCircle2, TrendingUp, Zap, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Slide {
    id: string;
    type: "vision" | "problem" | "solution" | "whynow" | "market" | "product" | "traction" | "business_model" | "competition" | "gtm" | "team" | "ask" | "custom";
    title: string;
    content: string[];
    notes?: string;
}

const SLIDE_TEMPLATES: Record<string, { title: string; icon: any; prompts: string[] }> = {
    vision: { title: "The Vision", icon: Eye, prompts: ["One-line category defining statement", "Clear customer identification"] },
    problem: { title: "The Problem", icon: AlertTriangle, prompts: ["The broken status quo", "Quantified pain point", "Why current solutions fail"] },
    solution: { title: "The Solution", icon: CheckCircle2, prompts: ["High-level value prop", "The 'Aha' moment", "Outcome (Speed/Cost/Quality)"] },
    whynow: { title: "Why Now", icon: Clock, prompts: ["Regulatory/Tech/Behavioral shift", "Why this wasn't possible 5 years ago"] },
    market: { title: "Market Size", icon: BarChart3, prompts: ["TAM (Total Addressable)", "SAM (Serviceable)", "SOM (Obtainable - 3 yrs)"] },
    product: { title: "The Product", icon: Layers, prompts: ["Core workflow", "Defensible moat", "Secret sauce"] },
    traction: { title: "Traction", icon: TrendingUp, prompts: ["Revenue/Users metrics", "Growth rate", "Key partnerships/LOIs"] },
    business_model: { title: "Business Model", icon: DollarSign, prompts: ["Revenue streams", "Pricing logic", "Unit economics (LTV/CAC)"] },
    competition: { title: "Competition", icon: Shield, prompts: ["Competitor 1 vs Us", "Competitor 2 vs Us", "Our unfair advantage"] },
    gtm: { title: "Go-To-Market", icon: Megaphone, prompts: ["Acquisition channels", "Distribution strategy", "First 10k users plan"] },
    team: { title: "The Team", icon: Users, prompts: ["CEO superpower", "CTO superpower", "Why this team wins"] },
    ask: { title: "The Ask", icon: Briefcase, prompts: ["Raise amount", "Runway length", "Key milestones to hit"] }
};

export default function PitchDeckPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [startupId, setStartupId] = useState<string | null>(null);
    const [startup, setStartup] = useState<any>(null);
    const [slides, setSlides] = useState<Slide[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [presentMode, setPresentMode] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const activeStartupId = userDoc.data()?.activeStartupId;
                if (!activeStartupId) { setLoading(false); return; }
                setStartupId(activeStartupId);

                const startupDoc = await getDoc(doc(db, "startups", activeStartupId));
                if (startupDoc.exists()) setStartup(startupDoc.data());

                const deckDoc = await getDoc(doc(db, "pitchDecks", activeStartupId));
                if (deckDoc.exists() && deckDoc.data().slides && deckDoc.data().slides.length > 0) {
                    setSlides(deckDoc.data().slides);
                } else {
                    // Initialize with Tier-1 VC Structure defaults
                    const defaultSlides: Slide[] = [
                        { id: "s1", type: "vision", title: "The Operating System for Venture Scalability.", content: ["Standardizing the chaotic pre-seed ecosystem by turning founder execution into structured, investable data."] },
                        { id: "s2", type: "problem", title: "Early-Stage Venture is Building on Blind Faith, Not Data.", content: ["90% of pre-seed data exists in static PDFs & disconnected spreadsheets.", "Investors bet on 'lines, not dots,' but only see the 'dot' (pitch deck).", "High Diligence Friction: 40+ hours to verify operational reality."] },
                        { id: "s3", type: "solution", title: "FounderFlow: Turning Execution into an Asset Class.", content: ["The Founder Execution Engine: Weekly Reviews, KPI tracking, Decision Logs.", "Dynamic Data Creation: Capturing rate of progress & consistency.", "Standardized Deal Infrastructure: Verified 'Deal Packet' for investors."] },
                        { id: "s4", type: "whynow", "title": "The Shift from 'Access' to 'Algorithmic Selection'.", content: ["AI Explosion: Cost of starting a company -> Zero. Noise -> Infinite.", "Diligence Crisis: Investors can't manual filter 10k+ startups.", "Founders want transparency: 'Verified Traction' > 'Projected Hype'."] },
                        { id: "s5", type: "market", "title": "$1.2B Initial Serviceable Opportunity.", content: ["TAM: 400M Entrepreneurs × $50/mo = $240B.", "SAM: 5M VC-Backable Tech Startups × $600/yr = $3B.", "SOM (3 Yrs): 50k Startups @ $100/mo = $60M ARR."] },
                        { id: "s6", type: "product", "title": "Proprietary Data Capture via High-Retention Workflows.", content: ["Weekly Execution Loops: Creating a proprietary 'Execution Score'.", "Intelligence Layer: Automated bottleneck detection driving 40%+ retention.", "The 'Living' Data Room: Always-verified, never stale."] },
                        { id: "s7", type: "business_model", "title": "Dual-Sided Value Capture.", content: ["Founder SaaS (MRR): Freemium -> $49/mo Pro Tier.", "Investor Access (ARR): $5k-$25k/yr for filtered deal flow.", "Unit Economics: Target CAC $150 vs Year-1 LTV $600."] },
                        { id: "s8", "type": "traction", "title": "Validating the Need for Structured Guidance.", content: ["Waitlist: 500+ Founders.", "Beta Retention: 40% Weekly Review completion (Industry avg <10%).", "Launch Partners: 3 Accelerators signed for Day 1."] },
                        { id: "s9", "type": "competition", "title": "The Only Dynamic Execution Platform.", content: ["Legacy Databases (Crunchbase): Static, backward-looking.", "Workflow Tools (Notion): Unstructured, single-player.", "FounderFlow: Dynamic, structured, networked, verified."] },
                        { id: "s10", "type": "gtm", "title": "Product-Led Growth × Network Clusters.", content: ["Viral Limit: Founders share 'Execution Graphs' (Social Proof).", "AcceleratorOS: Bulk acquisition via batch integration.", "Content Loops: 'State of Execution' reports driving organic traffic."] },
                        { id: "s11", "type": "team", "title": "Builders Who Understand the Problem.", content: ["Founders with deep product & venture operational experience.", "Technical DNA: Building for scale, not just features.", "Backed by top-tier advisors in Fintech & SaaS."] },
                        { id: "s12", "type": "ask", "title": "Raising to Own the 'Execution Data' Layer.", content: ["Raising Seed Round for 18 months runway.", "Milestones: Launch Investor API, Reach $50k MRR.", "Vision: Evolving from a 'Tool' to the 'Credit Score for Startups'."] }
                    ];
                    setSlides(defaultSlides);
                }
            } catch (error) { console.error("Error:", error); }
            finally { setLoading(false); }
        };
        loadData();
    }, [user]);

    const generateDeck = async () => {
        if (!startupId) return;
        if (!user) return;
        setGenerating(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch("/api/generate-pitch-deck", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ startupId })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error?.message || "Failed to generate pitch deck");
            if (data.slides) {
                setSlides(data.slides);
                await setDoc(doc(db, "pitchDecks", startupId), { slides: data.slides, updatedAt: serverTimestamp(), startupId }, { merge: true });
            }
        } catch (error) { console.error("Error:", error); }
        finally { setGenerating(false); }
    };

    const updateSlide = async (slideId: string, content: string[]) => {
        const updated = slides.map(s => s.id === slideId ? { ...s, content } : s);
        setSlides(updated);
        if (startupId) await setDoc(doc(db, "pitchDecks", startupId), { startupId, slides: updated, updatedAt: serverTimestamp() }, { merge: true });
    };

    const updateSlideTitle = async (slideId: string, title: string) => {
        const updated = slides.map(s => s.id === slideId ? { ...s, title } : s);
        setSlides(updated);
        if (startupId) await setDoc(doc(db, "pitchDecks", startupId), { startupId, slides: updated, updatedAt: serverTimestamp() }, { merge: true });
    };

    const addSlide = (type: string = "custom") => {
        const newSlide: Slide = {
            id: `slide_${Date.now()}`,
            type: type as any,
            title: SLIDE_TEMPLATES[type]?.title || "New Slide",
            content: SLIDE_TEMPLATES[type]?.prompts || ["Add content here"]
        };
        setSlides([...slides, newSlide]);
        setCurrentSlide(slides.length);
    };

    const deleteSlide = (slideId: string) => {
        const updated = slides.filter(s => s.id !== slideId);
        setSlides(updated);
        if (currentSlide >= updated.length) setCurrentSlide(Math.max(0, updated.length - 1));
    };

    const resetDeck = async () => {
        if (!confirm("This will erase your current deck and reset to the Tier-1 VC Template. Continue?")) return;
        const defaultSlides: Slide[] = [
            { id: "s1", type: "vision", title: "The Operating System for Venture Scalability.", content: ["Standardizing the chaotic pre-seed ecosystem by turning founder execution into structured, investable data."] },
            { id: "s2", type: "problem", title: "Early-Stage Venture is Building on Blind Faith, Not Data.", content: ["90% of pre-seed data exists in static PDFs & disconnected spreadsheets.", "Investors bet on 'lines, not dots,' but only see the 'dot' (pitch deck).", "High Diligence Friction: 40+ hours to verify operational reality."] },
            { id: "s3", type: "solution", title: "FounderFlow: Turning Execution into an Asset Class.", content: ["The Founder Execution Engine: Weekly Reviews, KPI tracking, Decision Logs.", "Dynamic Data Creation: Capturing rate of progress & consistency.", "Standardized Deal Infrastructure: Verified 'Deal Packet' for investors."] },
            { id: "s4", type: "whynow", "title": "The Shift from 'Access' to 'Algorithmic Selection'.", content: ["AI Explosion: Cost of starting a company -> Zero. Noise -> Infinite.", "Diligence Crisis: Investors can't manual filter 10k+ startups.", "Founders want transparency: 'Verified Traction' > 'Projected Hype'."] },
            { id: "s5", type: "market", "title": "$1.2B Initial Serviceable Opportunity.", content: ["TAM: 400M Entrepreneurs × $50/mo = $240B.", "SAM: 5M VC-Backable Tech Startups × $600/yr = $3B.", "SOM (3 Yrs): 50k Startups @ $100/mo = $60M ARR."] },
            { id: "s6", type: "product", "title": "Proprietary Data Capture via High-Retention Workflows.", content: ["Weekly Execution Loops: Creating a proprietary 'Execution Score'.", "Intelligence Layer: Automated bottleneck detection driving 40%+ retention.", "The 'Living' Data Room: Always-verified, never stale."] },
            { id: "s7", type: "business_model", "title": "Dual-Sided Value Capture.", content: ["Founder SaaS (MRR): Freemium -> $49/mo Pro Tier.", "Investor Access (ARR): $5k-$25k/yr for filtered deal flow.", "Unit Economics: Target CAC $150 vs Year-1 LTV $600."] },
            { id: "s8", "type": "traction", "title": "Validating the Need for Structured Guidance.", content: ["Waitlist: 500+ Founders.", "Beta Retention: 40% Weekly Review completion (Industry avg <10%).", "Launch Partners: 3 Accelerators signed for Day 1."] },
            { id: "s9", "type": "competition", "title": "The Only Dynamic Execution Platform.", content: ["Legacy Databases (Crunchbase): Static, backward-looking.", "Workflow Tools (Notion): Unstructured, single-player.", "FounderFlow: Dynamic, structured, networked, verified."] },
            { id: "s10", "type": "gtm", "title": "Product-Led Growth × Network Clusters.", content: ["Viral Limit: Founders share 'Execution Graphs' (Social Proof).", "AcceleratorOS: Bulk acquisition via batch integration.", "Content Loops: 'State of Execution' reports driving organic traffic."] },
            { id: "s11", "type": "team", "title": "Builders Who Understand the Problem.", content: ["Founders with deep product & venture operational experience.", "Technical DNA: Building for scale, not just features.", "Backed by top-tier advisors in Fintech & SaaS."] },
            { id: "s12", "type": "ask", "title": "Raising to Own the 'Execution Data' Layer.", content: ["Raising Seed Round for 18 months runway.", "Milestones: Launch Investor API, Reach $50k MRR.", "Vision: Evolving from a 'Tool' to the 'Credit Score for Startups'."] }
        ];
        setSlides(defaultSlides);
        if (startupId) await setDoc(doc(db, "pitchDecks", startupId), { startupId, slides: defaultSlides, updatedAt: serverTimestamp() }, { merge: true });
    }

    if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    const slide = slides[currentSlide];
    const SlideIcon = slide ? SLIDE_TEMPLATES[slide.type]?.icon || Presentation : Presentation;

    return (
        <div className="min-h-screen bg-app p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3"><Presentation className="w-8 h-8 text-primary" />Investor Pitch Deck</h1>
                        <p className="text-muted mt-1">Tier-1 Venture Capital Structure (12 Slides)</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={resetDeck} className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-alt border border-subtle text-muted hover:text-danger rounded-xl font-bold text-sm transition-colors">
                            <RefreshCw className="w-4 h-4" /> Reset Template
                        </button>
                        <button onClick={generateDeck} disabled={generating} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {generating ? "AI Generate" : "AI Rewrite"}
                        </button>
                        <button onClick={() => setPresentMode(true)} className="flex items-center gap-2 px-4 py-2 bg-surface dark:bg-surface-alt text-white dark:text-strong rounded-xl font-bold text-sm hover:shadow-lg transition-all">
                            <Eye className="w-4 h-4" />Present Deck
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
                    {/* Slide List */}
                    <div className="lg:col-span-1 space-y-3 flex flex-col h-full bg-surface border border-subtle rounded-2xl p-4 overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-subtle">Structure ({slides.length})</span>
                            <button onClick={() => addSlide()} className="p-2 hover:bg-surface-alt rounded-lg">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                            {slides.map((s, i) => (
                                <div key={s.id} onClick={() => setCurrentSlide(i)}
                                    className={cn("p-4 rounded-xl border cursor-pointer transition-all group relative",
                                        currentSlide === i ? "bg-primary-soft border-primary ring-1 ring-primary/20" : "bg-surface-alt border-transparent hover:bg-surface hover:border-subtle")}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={cn("text-[10px] font-black uppercase tracking-wider", currentSlide === i ? "text-primary" : "text-muted")}>Slide {i + 1}</span>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); deleteSlide(s.id); }}
                                                className="p-1.5 hover:bg-danger-soft rounded-lg text-danger"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                    <h4 className={cn("font-bold text-sm leading-tight line-clamp-2", currentSlide === i ? "text-primary" : "text-strong")}>{s.title}</h4>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Slide Editor / Preview */}
                    <div className="lg:col-span-3 flex flex-col h-full">
                        <div className="flex-1 bg-surface border border-subtle rounded-2xl overflow-hidden relative flex flex-col">
                            {slide ? (
                                <div className="flex-1 p-12 md:p-16 flex flex-col bg-white dark:bg-[#0F0F0F] text-strong relative">
                                    {/* Slide Header */}
                                    <div className="mb-10">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                <SlideIcon className="w-5 h-5" />
                                            </div>
                                            <input
                                                value={slide.title}
                                                onChange={(e) => updateSlideTitle(slide.id, e.target.value)}
                                                className="text-3xl font-black bg-transparent border-none outline-none w-full placeholder:text-muted/20"
                                                placeholder="Slide Title"
                                            />
                                        </div>
                                        <div className="h-1 w-20 bg-primary rounded-full" />
                                    </div>

                                    {/* Slide Content */}
                                    <div className="flex-1 space-y-6">
                                        {slide.content.map((c, i) => (
                                            <div key={i} className="flex items-start gap-4 group">
                                                <div className="w-2 h-2 mt-4 bg-muted rounded-full shrink-0 group-focus-within:bg-primary transition-colors" />
                                                <textarea
                                                    value={c}
                                                    onChange={e => {
                                                        const newContent = [...slide.content];
                                                        newContent[i] = e.target.value;
                                                        updateSlide(slide.id, newContent);
                                                    }}
                                                    className="flex-1 bg-transparent border-b border-transparent focus:border-subtle hover:border-subtle/30 text-xl md:text-2xl font-medium outline-none resize-none leading-relaxed overflow-hidden py-1"
                                                    rows={Math.max(1, Math.ceil(c.length / 60))}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newContent = slide.content.filter((_, idx) => idx !== i);
                                                        updateSlide(slide.id, newContent);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-danger hover:bg-danger-soft rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => updateSlide(slide.id, [...slide.content, "New point..."])}
                                            className="flex items-center gap-2 text-primary font-bold text-sm hover:underline mt-4 pl-6"
                                        >
                                            <Plus className="w-4 h-4" /> Add Point
                                        </button>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-8 pt-8 border-t border-subtle flex justify-between items-center text-sm font-bold text-muted uppercase tracking-widest">
                                        <span>CONFIDENTIAL</span>
                                        <span>{currentSlide + 1} / {slides.length}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-muted">Select a slide to edit</div>
                            )}
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex items-center justify-between mt-4 px-2">
                            <div className="text-xs font-bold text-muted">
                                {slide?.type.toUpperCase().replace("_", " ")} SLIDE
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}
                                    className="p-3 bg-surface hover:bg-surface-alt rounded-xl disabled:opacity-50 transition-colors border border-subtle">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1}
                                    className="p-3 bg-surface hover:bg-surface-alt rounded-xl disabled:opacity-50 transition-colors border border-subtle">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Presentation Mode */}
            <AnimatePresence>
                {presentMode && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black z-50 flex flex-col" onClick={() => setPresentMode(false)}>

                        <div className="flex-1 flex items-center justify-center p-4 md:p-12 cursor-none hover:cursor-default">
                            {slide && (
                                <motion.div
                                    key={slide.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="w-full max-w-[1600px] aspect-[16/9] bg-white text-black rounded-xl overflow-hidden shadow-2xl relative flex flex-col p-16 md:p-24"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Slide Header */}
                                    <div className="mb-16">
                                        <div className="flex items-center gap-6 mb-6">
                                            <div className="w-16 h-16 bg-[#0047FF] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                                <SlideIcon className="w-8 h-8" />
                                            </div>
                                            <h2 className="text-6xl font-black tracking-tight text-[#0F172A] leading-tight max-w-4xl">
                                                {slide.title}
                                            </h2>
                                        </div>
                                        <div className="h-1.5 w-32 bg-[#0047FF] rounded-full" />
                                    </div>

                                    {/* Slide Content */}
                                    <div className="flex-1 flex flex-col justify-center space-y-10">
                                        {slide.content.map((c, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="flex items-start gap-6"
                                            >
                                                <div className="w-3 h-3 mt-4 bg-[#0F172A] rounded-full shrink-0" />
                                                <p className="text-3xl md:text-4xl font-medium text-[#334155] leading-relaxed max-w-5xl">
                                                    {c}
                                                </p>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-auto pt-12 flex justify-between items-center border-t-2 border-slate-100">
                                        <span className="text-lg font-bold text-slate-400 uppercase tracking-widest">{startup?.name || "CONFIDENTIAL"}</span>
                                        <span className="text-lg font-bold text-slate-400">{currentSlide + 1} / {slides.length}</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Controls Overlay */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full text-white/70 border border-white/10 opacity-0 hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setCurrentSlide(Math.max(0, currentSlide - 1)); }} className="hover:text-white"><ChevronLeft className="w-6 h-6" /></button>
                            <span className="font-mono">{currentSlide + 1} / {slides.length}</span>
                            <button onClick={(e) => { e.stopPropagation(); setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1)); }} className="hover:text-white"><ChevronRight className="w-6 h-6" /></button>
                        </div>
                        <button onClick={() => setPresentMode(false)} className="absolute top-8 right-8 text-white/50 hover:text-white p-2">✕ Close</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
