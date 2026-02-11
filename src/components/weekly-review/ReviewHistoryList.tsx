
"use client";
import { WeeklyReview } from "@/types/weekly-review";
import { Calendar, CheckCircle2, TrendingUp, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface Props {
    review: WeeklyReview;
}

export function ReviewHistoryItem({ review }: Props) {
    // Safe date handling
    const date = review.createdAt?.toDate ? review.createdAt.toDate() : new Date(review.createdAt || Date.now());
    const completedGoals = review.pastGoals?.filter(g => g.isCompleted).length || 0;
    const totalGoals = review.pastGoals?.length || 0;
    const percentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    return (
        <div className="p-4 bg-surface rounded-xl border border-subtle hover:border-primary transition-all cursor-pointer group flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-black text-lg">
                    W{review.weekNumber}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3 h-3 text-muted" />
                        <span className="text-xs font-bold text-muted uppercase tracking-wider">{format(date, "MMM d, yyyy")}</span>
                    </div>
                    <h4 className="font-bold text-strong text-lg flex items-center gap-2">
                        Week {review.weekNumber} Review
                        {percentage >= 80 && <span className="ox-2 py-0.5 bg-success/10 text-success text-xs rounded-full px-2">High Perf</span>}
                    </h4>
                </div>
            </div>

            <div className="flex items-center gap-8">
                <div className="text-right hidden md:block">
                    <div className="text-xs font-bold text-muted uppercase">Execution</div>
                    <div className="font-black text-lg text-strong">{percentage}%</div>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-xs font-bold text-muted uppercase">Revenue</div>
                    <div className="font-black text-lg text-emerald-600">{review.metrics?.revenue || "-"}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
            </div>
        </div>
    );
}
