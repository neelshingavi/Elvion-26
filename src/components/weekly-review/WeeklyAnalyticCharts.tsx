
"use client";
import React from "react";
import { motion } from "framer-motion";
import { WeeklyReview } from "@/types/weekly-review";
import { cn } from "@/lib/utils";

interface Props {
    history: WeeklyReview[];
}

export function WeeklyAnalyticCharts({ history }: Props) {
    // Sort history by week/year to show chronological trend
    const sortedHistory = [...history].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.weekNumber - b.weekNumber;
    }).slice(-7); // Last 7 reviews

    const maxVal = 100;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* execution Trend */}
            <div className="bg-surface border border-subtle rounded-2xl p-6">
                <h4 className="text-sm font-bold text-muted uppercase mb-6">Execution Trend (%)</h4>
                <div className="flex items-end gap-2 h-32 px-2">
                    {sortedHistory.map((r, i) => {
                        const completed = r.pastGoals?.filter(g => g.isCompleted).length || 0;
                        const total = r.pastGoals?.length || 0;
                        const pct = total > 0 ? (completed / total) * 100 : 0;

                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="relative w-full flex items-end justify-center h-full">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${pct}%` }}
                                        className={cn("w-full max-w-[30px] rounded-t-lg transition-colors",
                                            pct >= 80 ? "bg-success" : pct >= 50 ? "bg-primary" : "bg-danger"
                                        )}
                                    />
                                    {/* Tooltip on hover */}
                                    <div className="absolute -top-8 bg-strong text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        W{r.weekNumber}: {Math.round(pct)}%
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-muted">W{r.weekNumber}</span>
                            </div>
                        );
                    })}
                    {history.length < 2 && <div className="flex-1 flex items-center justify-center text-muted italic text-xs">Need more data...</div>}
                </div>
            </div>

            {/* Energy vs Productivity */}
            <div className="bg-surface border border-subtle rounded-2xl p-6">
                <h4 className="text-sm font-bold text-muted uppercase mb-6">Energy & Pulse</h4>
                <div className="space-y-4">
                    {sortedHistory.slice(-3).reverse().map((r, i) => (
                        <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-strong">Week {r.weekNumber}</span>
                                <span className="text-muted">Energy {r.sentiment.energyLevel}/10 • Prod {r.sentiment.productivityRating}/10</span>
                            </div>
                            <div className="h-2 w-full bg-surface-alt rounded-full overflow-hidden flex">
                                <div
                                    className="h-full bg-warning"
                                    style={{ width: `${(r.sentiment.energyLevel / 10) * 50}%` }}
                                />
                                <div
                                    className="h-full bg-primary"
                                    style={{ width: `${(r.sentiment.productivityRating / 10) * 50}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && <div className="text-center py-8 text-muted italic text-xs">Complete your first review to see trends.</div>}
                </div>
            </div>
        </div>
    );
}
