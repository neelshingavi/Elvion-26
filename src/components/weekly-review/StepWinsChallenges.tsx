
"use client";
import React from "react";
import { WeeklyReview } from "@/types/weekly-review";
import { Trophy, AlertCircle, Plus, X } from "lucide-react";

interface StepProps {
    data: WeeklyReview;
    updateData: (updates: Partial<WeeklyReview>) => void;
}

export function StepWinsChallenges({ data, updateData }: StepProps) {
    const wins = data.wins || [];
    const challenges = data.challenges || [];

    const addWin = () => {
        updateData({
            wins: [...wins, { id: crypto.randomUUID(), text: "", type: "major" }]
        });
    };

    const removeWin = (id: string) => {
        updateData({ wins: wins.filter(w => w.id !== id) });
    };

    const updateWin = (id: string, text: string) => {
        updateData({ wins: wins.map(w => w.id === id ? { ...w, text } : w) });
    };

    const addChallenge = () => {
        updateData({
            challenges: [...challenges, { id: crypto.randomUUID(), obstacle: "", rootCause: "", blocker: "", supportNeeded: "" }]
        });
    };

    const updateChallenge = (id: string, field: string, value: string) => {
        updateData({
            challenges: challenges.map(c => c.id === id ? { ...c, [field]: value } : c)
        });
    };

    const removeChallenge = (id: string) => {
        updateData({ challenges: challenges.filter(c => c.id !== id) });
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* WINS SECTION */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-amber-500" />
                        Wins & Highlights
                    </h3>
                    <button onClick={addWin} className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add Win
                    </button>
                </div>

                {wins.map((win, idx) => (
                    <div key={win.id} className="flex gap-3 group">
                        <div className="mt-3 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <input
                            placeholder="Describe a win..."
                            value={win.text}
                            onChange={(e) => updateWin(win.id, e.target.value)}
                            className="flex-1 p-3 bg-surface-alt rounded-lg border-none focus:ring-2 ring-primary/20 outline-none text-strong"
                            autoFocus={idx === wins.length - 1} // Auto-focus new inputs
                        />
                        <button onClick={() => removeWin(win.id)} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {wins.length === 0 && <p className="text-muted italic text-sm">No wins recorded yet. Even small progress counts!</p>}
            </div>

            <div className="h-px bg-subtle w-full" />

            {/* CHALLENGES SECTION */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-danger" />
                        Challenges & Blockers
                    </h3>
                    <button onClick={addChallenge} className="text-sm font-bold text-danger hover:underline flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add Challenge
                    </button>
                </div>

                {challenges.map((challenge) => (
                    <div key={challenge.id} className="p-4 bg-danger-soft/10 rounded-xl border border-danger/10 space-y-3 relative group">
                        <button onClick={() => removeChallenge(challenge.id)} className="absolute top-2 right-2 text-danger opacity-0 group-hover:opacity-100">
                            <X className="w-4 h-4" />
                        </button>
                        <div>
                            <label className="text-xs font-bold text-danger uppercase">Obstacle</label>
                            <input
                                value={challenge.obstacle}
                                onChange={(e) => updateChallenge(challenge.id, "obstacle", e.target.value)}
                                placeholder="What's blocking you?"
                                className="w-full bg-transparent border-b border-danger/20 focus:border-danger outline-none py-1 text-strong font-medium"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-muted uppercase">Root Cause</label>
                                <textarea
                                    value={challenge.rootCause}
                                    onChange={(e) => updateChallenge(challenge.id, "rootCause", e.target.value)}
                                    placeholder="Why is this happening?"
                                    className="w-full bg-surface rounded-lg p-2 text-sm mt-1 outline-none focus:ring-1 ring-danger"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted uppercase">Support Needed</label>
                                <textarea
                                    value={challenge.supportNeeded}
                                    onChange={(e) => updateChallenge(challenge.id, "supportNeeded", e.target.value)}
                                    placeholder="Who or what can help?"
                                    className="w-full bg-surface rounded-lg p-2 text-sm mt-1 outline-none focus:ring-1 ring-danger"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>
                ))}
                {challenges.length === 0 && <p className="text-muted italic text-sm">No major blockers? Great! Or are you ignoring something?</p>}
            </div>

        </div>
    );
}
