"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    Presentation, Sparkles, Download, RefreshCw, ChevronLeft, ChevronRight,
    Loader2, Eye, Edit3, Plus, Trash2, Image, Type, BarChart3, Users, Target, Lightbulb, IndianRupee, Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Slide {
    id: string; type: "title" | "problem" | "solution" | "market" | "traction" | "team" | "ask" | "custom";
    title: string; content: string[]; notes?: string;
}

const SLIDE_TEMPLATES: Record<string, { title: string; icon: any; prompts: string[] }> = {
    title: { title: "Title Slide", icon: Presentation, prompts: ["Company Name", "One-line pitch", "Logo/Visual"] },
    problem: { title: "The Problem", icon: Lightbulb, prompts: ["Key pain point", "Who experiences it", "Current solutions"] },
    solution: { title: "Our Solution", icon: Rocket, prompts: ["Product overview", "Key features", "Differentiation"] },
    market: { title: "Market Size", icon: BarChart3, prompts: ["TAM", "SAM", "SOM"] },
    traction: { title: "Traction", icon: Target, prompts: ["Key metrics", "Growth rate", "Milestones"] },
    team: { title: "The Team", icon: Users, prompts: ["Founders", "Key hires", "Advisors"] },
    ask: { title: "The Ask", icon: IndianRupee, prompts: ["Funding amount", "Use of funds", "Runway"] }
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
                if (deckDoc.exists() && deckDoc.data().slides) {
                    setSlides(deckDoc.data().slides);
                } else {
                    // Initialize with default slides
                    const defaultSlides: Slide[] = [
                        { id: "s1", type: "title", title: startupDoc.data()?.name || "Your Startup", content: [startupDoc.data()?.oneSentencePitch || "Transform the way people..."] },
                        { id: "s2", type: "problem", title: "The Problem", content: ["Problem statement here"] },
                        { id: "s3", type: "solution", title: "Our Solution", content: ["Solution overview"] },
                        { id: "s4", type: "market", title: "Market Opportunity", content: ["TAM: ₹X Cr", "SAM: ₹X Cr", "SOM: ₹X Cr"] },
                        { id: "s5", type: "traction", title: "Traction", content: ["Key metrics"] },
                        { id: "s6", type: "team", title: "The Team", content: ["Founder info"] },
                        { id: "s7", type: "ask", title: "The Ask", content: ["Raising ₹X for Y months runway"] }
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
        setGenerating(true);
        try {
            const response = await fetch("/api/generate-pitch-deck", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startupId })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.slides) {
                    setSlides(data.slides);
                    await setDoc(doc(db, "pitchDecks", startupId), { slides: data.slides, updatedAt: serverTimestamp() });
                }
            }
        } catch (error) { console.error("Error:", error); }
        finally { setGenerating(false); }
    };

    const updateSlide = async (slideId: string, content: string[]) => {
        const updated = slides.map(s => s.id === slideId ? { ...s, content } : s);
        setSlides(updated);
        if (startupId) await setDoc(doc(db, "pitchDecks", startupId), { slides: updated, updatedAt: serverTimestamp() }, { merge: true });
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

    if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

    const slide = slides[currentSlide];
    const SlideIcon = slide ? SLIDE_TEMPLATES[slide.type]?.icon || Presentation : Presentation;

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3"><Presentation className="w-8 h-8 text-indigo-500" />Pitch Deck</h1>
                        <p className="text-zinc-500 mt-1">Auto-updating deck from your canvas</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={generateDeck} disabled={generating} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {generating ? "Generating..." : "AI Generate"}
                        </button>
                        <button onClick={() => setPresentMode(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm">
                            <Eye className="w-4 h-4" />Present
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Slide List */}
                    <div className="lg:col-span-1 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Slides ({slides.length})</span>
                            <button onClick={() => addSlide()} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {slides.map((s, i) => (
                                <div key={s.id} onClick={() => setCurrentSlide(i)}
                                    className={cn("p-3 rounded-xl border cursor-pointer transition-all group",
                                        currentSlide === i ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300")}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-zinc-400">{i + 1}</span>
                                        <button onClick={(e) => { e.stopPropagation(); deleteSlide(s.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                    <h4 className="font-bold text-sm mt-1 truncate">{s.title}</h4>
                                    <p className="text-xs text-zinc-500 truncate">{s.content[0]}</p>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Add Slide</p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(SLIDE_TEMPLATES).slice(0, 4).map(([key, tpl]) => (
                                    <button key={key} onClick={() => addSlide(key)}
                                        className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2">
                                        <tpl.icon className="w-3 h-3" />{tpl.title.split(" ")[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Slide Preview */}
                    <div className="lg:col-span-3">
                        <div className="aspect-video bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl overflow-hidden relative">
                            {slide && (
                                <div className="absolute inset-0 p-12 flex flex-col text-white">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                                            <SlideIcon className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-4xl font-black">{slide.title}</h2>
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        {slide.content.map((c, i) => (
                                            <div key={i} className="flex items-start gap-4">
                                                {slide.type !== "title" && <div className="w-3 h-3 mt-2 bg-indigo-500 rounded-full shrink-0" />}
                                                {editMode ? (
                                                    <input value={c} onChange={e => {
                                                        const newContent = [...slide.content];
                                                        newContent[i] = e.target.value;
                                                        updateSlide(slide.id, newContent);
                                                    }} className="flex-1 bg-transparent border-b border-zinc-700 text-xl outline-none" />
                                                ) : (
                                                    <p className={cn("text-xl", slide.type === "title" && "text-3xl font-light")}>{c}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between text-zinc-500 text-sm">
                                        <span>{startup?.name}</span>
                                        <span>{currentSlide + 1} / {slides.length}</span>
                                    </div>
                                </div>
                            )}
                            <button onClick={() => setEditMode(!editMode)}
                                className={cn("absolute top-4 right-4 p-2 rounded-lg transition-all", editMode ? "bg-indigo-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                                <Edit3 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-4">
                            <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium disabled:opacity-50">
                                <ChevronLeft className="w-4 h-4" />Previous
                            </button>
                            <div className="flex items-center gap-2">
                                {slides.map((_, i) => (
                                    <button key={i} onClick={() => setCurrentSlide(i)}
                                        className={cn("w-2 h-2 rounded-full transition-all", currentSlide === i ? "bg-indigo-500 w-6" : "bg-zinc-300 dark:bg-zinc-700")} />
                                ))}
                            </div>
                            <button onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium disabled:opacity-50">
                                Next<ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Presentation Mode */}
            <AnimatePresence>
                {presentMode && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-zinc-900 z-50" onClick={() => setPresentMode(false)}>
                        <div className="h-full flex items-center justify-center p-8">
                            {slide && (
                                <motion.div key={slide.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
                                    className="w-full max-w-5xl aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-16 text-white">
                                    <div className="flex items-center gap-4 mb-12">
                                        <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center"><SlideIcon className="w-8 h-8" /></div>
                                        <h2 className="text-6xl font-black">{slide.title}</h2>
                                    </div>
                                    <div className="space-y-6">
                                        {slide.content.map((c, i) => (
                                            <p key={i} className="text-3xl flex items-start gap-4">
                                                {slide.type !== "title" && <span className="w-4 h-4 mt-2 bg-indigo-500 rounded-full shrink-0" />}{c}
                                            </p>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white/50">
                            <button onClick={(e) => { e.stopPropagation(); setCurrentSlide(Math.max(0, currentSlide - 1)); }} className="p-3 hover:bg-white/10 rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
                            <span className="font-bold">{currentSlide + 1} / {slides.length}</span>
                            <button onClick={(e) => { e.stopPropagation(); setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1)); }} className="p-3 hover:bg-white/10 rounded-xl"><ChevronRight className="w-6 h-6" /></button>
                        </div>
                        <button onClick={() => setPresentMode(false)} className="absolute top-8 right-8 text-white/50 hover:text-white">Press ESC to exit</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
