
"use client";
import React from "react";
import { WeeklyReview } from "@/types/weekly-review";
import { AlertTriangle, TrendingUp, Target, Brain } from "lucide-react";

interface Props {
    history: WeeklyReview[];
}

export function AnalyticsInsights({ history }: Props) {
    if (history.length < 1) return null;

    const latest = history[0];
    const previous = history[1];

    // 1. Detect recurring unfinished goals
    const missedInLatest = latest.pastGoals?.filter(g => !g.isCompleted).map(g => g.text.toLowerCase()) || [];
    const missedInPrevious = previous?.pastGoals?.filter(g => !g.isCompleted).map(g => g.text.toLowerCase()) || [];

    const recurringMisses = missedInLatest.filter(text =>
        missedInPrevious.some(prevText => prevText.includes(text) || text.includes(prevText))
    );

    // 2. Performance trend
    const latestPct = latest.pastGoals?.length > 0 ? (latest.pastGoals.filter(g => g.isCompleted).length / latest.pastGoals.length) : 0;
    const prevPct = previous?.pastGoals?.length > 0 ? (previous.pastGoals.filter(g => g.isCompleted).length / previous.pastGoals.length) : 0;
    const isImproving = latestPct > prevPct;

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-black flex items-center gap-2 px-2">
                <Brain className="w-6 h-6 text-primary" />
                Founder Intelligence
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recurring Issues */}
                {recurringMisses.length > 0 && (
                    <div className="p-5 bg-danger-soft/10 border border-danger/20 rounded-2xl flex gap-4">
                        <AlertTriangle className="w-6 h-6 text-danger shrink-0" />
                        <div>
                            <h4 className="font-bold text-danger">Recurring Bottleneck Detect</h4>
                            <p className="text-sm text-muted mt-1">
                                You've missed goals related to <span className="font-bold text-strong">"{recurringMisses[0]}"</span> for 2 weeks in a row. Consider decoping or delegating this.
                            </p>
                        </div>
                    </div>
                )}

                {/* Momentum */}
                {previous && (
                    <div className={isImproving ? "p-5 bg-success-soft/10 border border-success/20 rounded-2xl flex gap-4" : "p-5 bg-warning-soft/10 border border-warning/20 rounded-2xl flex gap-4"}>
                        {isImproving ? <TrendingUp className="w-6 h-6 text-success shrink-0" /> : <TrendingUp className="w-6 h-6 text-warning shrink-0" />}
                        <div>
                            <h4 className={isImproving ? "font-bold text-success" : "font-bold text-warning"}>
                                {isImproving ? "Momentum Increasing" : "Execution Dip"}
                            </h4>
                            <p className="text-sm text-muted mt-1">
                                Your execution rate {isImproving ? "climbed" : "dropped"} by {Math.round(Math.abs(latestPct - prevPct) * 100)}% compared to last week.
                            </p>
                        </div>
                    </div>
                )}

                {/* Goal Consistency */}
                <div className="p-5 bg-primary-soft/10 border border-primary/20 rounded-2xl flex gap-4">
                    <Target className="w-6 h-6 text-primary shrink-0" />
                    <div>
                        <h4 className="font-bold text-primary">Strategy Integrity</h4>
                        <p className="text-sm text-muted mt-1">
                            You are logging {latest.decisions?.length || 0} strategic decisions per week. Keeping a record reduces cognitive bias.
                        </p>
                    </div>
                </div>

                {/* Skip Warning */}
                {(() => {
                    const currentWeek = Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 604800000);
                    const lastReviewWeek = latest.weekNumber;
                    const diff = currentWeek - lastReviewWeek;
                    if (diff >= 2) {
                        return (
                            <div className="p-5 bg-amber-soft/10 border border-amber/20 rounded-2xl flex gap-4">
                                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-amber-600">Review Gap Detected</h4>
                                    <p className="text-sm text-muted mt-1">
                                        You haven't logged a review in {diff} weeks. Execution thrives on consistency.
                                    </p>
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div className="p-5 bg-surface border border-subtle rounded-2xl flex gap-4">
                            <div className="w-6 h-6 bg-info text-on-primary rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">i</div>
                            <div>
                                <h4 className="font-bold text-strong">Review Quality</h4>
                                <p className="text-sm text-muted mt-1">
                                    Your energy levels correlate with your execution rate. Keep the review honest to find your peak performance hours.
                                </p>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
