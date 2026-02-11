
"use client";
import React, { useState } from "react";
import { WeeklyReview } from "@/types/weekly-review";
import { Target, Flag, Rocket, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProps {
    data: WeeklyReview;
    updateData: (updates: Partial<WeeklyReview>) => void;
}

export function StepPlanning({ data, updateData }: StepProps) {
    const nextWeek = data.nextWeek || { topPriorities: [], mustWinGoal: "", keyMetricTarget: "" };
    const [priorityInput, setPriorityInput] = useState("");

    const addPriority = () => {
        if (!priorityInput.trim()) return;
        if (nextWeek.topPriorities.length >= 3) return;
        updateData({
            nextWeek: { ...nextWeek, topPriorities: [...nextWeek.topPriorities, priorityInput] }
        });
        setPriorityInput("");
    };

    const removePriority = (idx: number) => {
        updateData({
            nextWeek: { ...nextWeek, topPriorities: nextWeek.topPriorities.filter((_, i) => i !== idx) }
        });
    };

    const updateField = (field: string, value: string) => {
        updateData({
            nextWeek: { ...nextWeek, [field]: value }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Top 3 Priorities */}
            <div className="space-y-4">
                <h3 className="font-bold text-xl flex items-center gap-2">
                    <Target className="w-6 h-6 text-primary" />
                    Top 3 Priorities
                    <span className="text-sm font-normal text-muted ml-2">(Focus on what moves the needle)</span>
                </h3>

                <div className="space-y-3">
                    {nextWeek.topPriorities.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-subtle shadow-sm">
                            <span className="flex-none w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                            <span className="flex-1 font-medium">{p}</span>
                            <button onClick={() => removePriority(i)} className="text-muted hover:text-danger"><X className="w-4 h-4" /></button>
                        </div>
                    ))}

                    {nextWeek.topPriorities.length < 3 && (
                        <div className="flex items-center gap-2">
                            <input
                                value={priorityInput}
                                onChange={(e) => setPriorityInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addPriority()}
                                placeholder="Add a priority..."
                                className="flex-1 p-3 bg-surface-alt rounded-xl border border-transparent focus:border-primary outline-none"
                            />
                            <button onClick={addPriority} className="btn-secondary px-4 py-3 rounded-xl"><Plus className="w-5 h-5" /></button>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-px bg-subtle" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Must Win Goal */}
                <div className="p-6 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-3 text-amber-600 font-bold uppercase text-sm">
                        <Flag className="w-4 h-4" /> The "Must Win"
                    </div>
                    <textarea
                        value={nextWeek.mustWinGoal}
                        onChange={(e) => updateField("mustWinGoal", e.target.value)}
                        placeholder="If you only achieve one thing..."
                        className="w-full bg-transparent text-lg font-bold text-strong outline-none placeholder:text-muted/50"
                        rows={2}
                    />
                </div>

                {/* Metric Target */}
                <div className="p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <div className="flex items-center gap-2 mb-3 text-indigo-600 font-bold uppercase text-sm">
                        <Rocket className="w-4 h-4" /> Key Metric Target
                    </div>
                    <input
                        value={nextWeek.keyMetricTarget}
                        onChange={(e) => updateField("keyMetricTarget", e.target.value)}
                        placeholder="e.g. 100 new users"
                        className="w-full bg-transparent text-lg font-bold text-strong outline-none placeholder:text-muted/50"
                    />
                </div>
            </div>
        </div>
    );
}
