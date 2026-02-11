
"use client";
import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, TrendingUp, Target, ArrowRight, Home } from "lucide-react";
import { WeeklyReview } from "@/types/weekly-review";

interface Props {
    review: WeeklyReview;
    onFinish: () => void;
}

export function ReviewCompleteSummary({ review, onFinish }: Props) {
    const completedCount = review.pastGoals?.filter(g => g.isCompleted).length || 0;
    const totalCount = review.pastGoals?.length || 0;
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto w-full p-6 md:p-8 text-center"
        >
            <div className="mb-8">
                <div className="w-24 h-24 bg-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-success/20">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-4xl font-black text-strong mb-2">Review Complete</h2>
                <p className="text-xl text-muted">You've logged your execution for Week {review.weekNumber}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="p-8 bg-surface border border-subtle rounded-3xl shadow-sm">
                    <div className="text-sm font-bold text-muted uppercase mb-2">Execution Rate</div>
                    <div className="text-5xl font-black text-primary">{pct}%</div>
                    <p className="text-sm text-muted mt-2">
                        {pct === 100 ? "Perfect execution!" : pct >= 70 ? "Strong momentum." : "Focus on fewer, higher impact goals next week."}
                    </p>
                </div>

                <div className="p-8 bg-surface border border-subtle rounded-3xl shadow-sm">
                    <div className="text-sm font-bold text-muted uppercase mb-2">Top Priority for Next Week</div>
                    <div className="text-lg font-bold text-strong line-clamp-2">
                        {review.nextWeek?.mustWinGoal || "Execution excellence"}
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-4 text-primary font-bold">
                        <TrendingUp className="w-4 h-4" />
                        Target: {review.nextWeek?.keyMetricTarget || "Growth"}
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button
                    onClick={onFinish}
                    className="bg-primary hover:bg-primary-dark text-on-primary px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all hover:-translate-y-1"
                >
                    Got it, let's build <ArrowRight className="w-5 h-5" />
                </button>
            </div>

            <p className="mt-8 text-muted text-sm italic">
                "Metrics are a reflection of your choices. Stay honest, stay focused."
            </p>
        </motion.div>
    );
}
