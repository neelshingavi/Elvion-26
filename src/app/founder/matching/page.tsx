"use client";

import { Users, Search, MapPin, TrendingUp, Mail, ExternalLink } from "lucide-react";
import { useState } from "react";

const mockMatches = [
    {
        name: "Alex Rivera",
        role: "Angel Investor",
        compatibility: 94,
        tags: ["SaaS", "AI/ML"],
        location: "San Francisco, CA",
        img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
    },
    {
        name: "Sarah Chen",
        role: "Full Stack Engineer",
        compatibility: 88,
        tags: ["Next.js", "Python"],
        location: "London, UK",
        img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    },
];

export default function MatchingPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Agentic Matching</h1>
                        <p className="text-zinc-500">Gemini-curated connections based on your startup intent.</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search ecosystem..."
                        className="pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockMatches.map((match, i) => (
                    <div key={i} className="group p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-2xl transition-all duration-500">
                        <div className="flex items-start justify-between mb-6">
                            <img src={match.img} alt={match.name} className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800" />
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-green-500 uppercase tracking-widest bg-green-500/5 px-3 py-1 rounded-full">
                                    {match.compatibility}% Match
                                </span>
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold">{match.name}</h3>
                        <p className="text-zinc-500 font-medium mb-1">{match.role}</p>
                        <div className="flex items-center gap-1 text-zinc-400 text-sm mb-6">
                            <MapPin className="w-3 h-3" />
                            {match.location}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-8">
                            {match.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:scale-105 transition-transform active:scale-95">
                                <Mail className="w-4 h-4" />
                                Connect
                            </button>
                            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                                Profile
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-12 rounded-[2.5rem] bg-gradient-to-br from-black to-zinc-900 dark:from-white dark:to-zinc-200 text-white dark:text-black">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-400">
                            <TrendingUp className="w-5 h-5" />
                            <h4 className="font-bold uppercase tracking-wider">AI Optimizer</h4>
                        </div>
                        <h3 className="text-3xl font-black">Boost Visibility</h3>
                        <p className="opacity-60 max-w-sm">
                            Let the Matching Agent highlight your project to the top relevant investors based on your latest roadmap activity.
                        </p>
                    </div>
                    <button className="px-8 py-4 bg-white text-black dark:bg-black dark:text-white rounded-2xl font-bold hover:scale-105 transition-transform">
                        Enable Hyper-Growth
                    </button>
                </div>
            </div>
        </div>
    );
}
