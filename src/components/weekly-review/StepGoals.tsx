
"use client";
import React from "react";
import { WeeklyReview, Goal } from "@/types/weekly-review";
import { Target, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProps {
    data: WeeklyReview;
    updateData: (updates: Partial<WeeklyReview>) => void;
}

export function StepGoals({ data, updateData }: StepProps) {
    // If no past goals (first review), provide empties or fetch from somewhere else if possible.
    // We assume 'data.pastGoals' is populated if available.

    const goals = data.pastGoals || [];

    const handleToggle = (id: string, isCompleted: boolean) => {
        const updatedGoals = goals.map(g => g.id === id ? { ...g, isCompleted } : g);
        updateData({ pastGoals: updatedGoals });
    };

    const handleReason = (id: string, reason: string) => {
        const updatedGoals = goals.map(g => g.id === id ? { ...g, reasonForFailure: reason } : g);
        updateData({ pastGoals: updatedGoals });
    };

    const completionRate = goals.length > 0
        ? Math.round((goals.filter(g => g.isCompleted).length / goals.length) * 100)
        : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Summary Stat */}
            <div className="flex items-center justify-between p-4 bg-primary-soft/30 rounded-xl border border-primary/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary text-on-primary rounded-lg">
                        <Target className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-strong">Goal Completion</h4>
                        <p className="text-xs text-muted">Based on your commitment last week</p>
                    </div>
                </div>
                <div className="text-3xl font-black text-primary">{completionRate}%</div>
            </div>

            <div className="space-y-4">
                {goals.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed border-subtle rounded-xl">
                        <p className="text-muted italic">No goals found from last week. This might be your first review.</p>
                    </div>
                ) : (
                    goals.map((goal) => (
                        <div key={goal.id} className={cn("p-4 rounded-xl border transition-all",
                            goal.isCompleted ? "bg-success-soft/20 border-success/30" : "bg-surface-alt border-subtle")}>
                            <div className="flex items-start gap-4">
                                <button
                                    onClick={() => handleToggle(goal.id, !goal.isCompleted)}
                                    className={cn("mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        goal.isCompleted
                                            ? "bg-success border-success text-on-primary"
                                            : "border-muted hover:border-primary"
                                    )}
                                >
                                    {goal.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                                </button>
                                <div className="flex-1">
                                    <p className={cn("text-lg font-medium mb-2", goal.isCompleted && "line-through text-muted")}>
                                        {goal.text}
                                    </p>

                                    {!goal.isCompleted && (
                                        <div className="mt-3 animate-in fade-in zoom-in-95 duration-300">
                                            <label className="text-xs font-bold text-danger uppercase flex items-center gap-1 mb-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Why was this missed?
                                            </label>
                                            <textarea
                                                placeholder="Be honest. Was it a distraction? A blocker? Over-estimation?"
                                                value={goal.reasonForFailure || ""}
                                                onChange={(e) => handleReason(goal.id, e.target.value)}
                                                className="w-full text-sm p-3 bg-surface rounded-lg border border-danger/20 focus:border-danger outline-none min-h-[60px]"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
