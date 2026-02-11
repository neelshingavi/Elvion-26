
"use client";
import React from "react";
import { WeeklyReview } from "@/types/weekly-review";
import { BookOpen, Plus, X } from "lucide-react";

interface StepProps {
    data: WeeklyReview;
    updateData: (updates: Partial<WeeklyReview>) => void;
}

export function StepDecisions({ data, updateData }: StepProps) {
    const decisions = data.decisions || [];

    const addDecision = () => {
        updateData({
            decisions: [...decisions, { id: crypto.randomUUID(), decision: "", rationale: "", expectedImpact: "" }]
        });
    };

    const updateDecision = (id: string, field: string, value: string) => {
        updateData({
            decisions: decisions.map(d => d.id === id ? { ...d, [field]: value } : d)
        });
    };

    const removeDecision = (id: string) => updateData({ decisions: decisions.filter(d => d.id !== id) });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-black flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-primary" />
                        Decision Log
                    </h3>
                    <p className="text-muted text-sm">Document key decisions to track judgment over time.</p>
                </div>
                <button onClick={addDecision} className="btn-secondary px-3 py-1 text-sm flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Log
                </button>
            </div>

            {decisions.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-subtle rounded-xl text-center bg-surface-alt/50">
                    <p className="text-muted mb-2">Did you make any significant strategic choices this week?</p>
                    <button onClick={addDecision} className="text-primary hover:underline font-bold">Yes, log a decision</button>
                </div>
            ) : (
                <div className="space-y-6">
                    {decisions.map((d, i) => (
                        <div key={d.id} className="bg-surface rounded-xl border border-subtle p-5 shadow-sm relative group">
                            <button onClick={() => removeDecision(d.id)} className="absolute top-4 right-4 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase">The Decision</label>
                                    <input
                                        value={d.decision}
                                        onChange={(e) => updateDecision(d.id, "decision", e.target.value)}
                                        placeholder="e.g. Pivot to B2B, Hire a lead dev..."
                                        className="w-full text-lg font-bold border-b border-subtle focus:border-primary outline-none py-2 bg-transparent"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase">Why?</label>
                                        <textarea
                                            value={d.rationale}
                                            onChange={(e) => updateDecision(d.id, "rationale", e.target.value)}
                                            placeholder="Reasoning..."
                                            rows={2}
                                            className="w-full mt-1 p-2 bg-surface-alt rounded-lg text-sm border-none focus:ring-1 ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase">Expected Impact</label>
                                        <textarea
                                            value={d.expectedImpact}
                                            onChange={(e) => updateDecision(d.id, "expectedImpact", e.target.value)}
                                            placeholder="What will happen?"
                                            rows={2}
                                            className="w-full mt-1 p-2 bg-surface-alt rounded-lg text-sm border-none focus:ring-1 ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
