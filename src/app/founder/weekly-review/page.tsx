
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { WeeklyReviewService } from "@/lib/services/weekly-review-service";
import { WeeklyReview } from "@/types/weekly-review";
import { WizardStepContainer } from "@/components/weekly-review/WizardStepContainer";
import { ReviewHistoryItem } from "@/components/weekly-review/ReviewHistoryList";
import { WeeklyAnalyticCharts } from "@/components/weekly-review/WeeklyAnalyticCharts"; // New Import
import { AnalyticsInsights } from "@/components/weekly-review/AnalyticsInsights"; // New Import
import { ReviewCompleteSummary } from "@/components/weekly-review/ReviewCompleteSummary"; // New Import
import { StepSnapshot } from "@/components/weekly-review/StepSnapshot";
import { StepGoals } from "@/components/weekly-review/StepGoals";
import { StepWinsChallenges } from "@/components/weekly-review/StepWinsChallenges";
import { StepDecisions } from "@/components/weekly-review/StepDecisions";
import { StepTeam } from "@/components/weekly-review/StepTeam";
import { StepPlanning } from "@/components/weekly-review/StepPlanning";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, History, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

export default function WeeklyReviewPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<"dashboard" | "review" | "summary">("dashboard");
    const [currentStep, setCurrentStep] = useState(0);
    const [reviewData, setReviewData] = useState<WeeklyReview | null>(null);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState<WeeklyReview[]>([]);

    const STEPS = [
        { title: "Week Snapshot", subtitle: "Key metrics & numbers" },
        { title: "Goals Review", subtitle: "Accountability check" },
        { title: "Wins & Challenges", subtitle: "Reflect on highs & lows" },
        { title: "Decision Log", subtitle: "Strategic choices made" },
        { title: "Team & Energy", subtitle: "Pulse check" },
        { title: "Next Week", subtitle: "Commit to priorities" },
    ];

    useEffect(() => {
        if (!user) return;
        const init = async () => {
            try {
                const draft = await WeeklyReviewService.getDraft(user.uid);
                if (draft) {
                    setReviewData(draft);
                }
            } catch (err) {
                console.error("Failed to load review data", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [user]);

    useEffect(() => {
        if (!user || mode !== "dashboard") return;
        const loadHistory = async () => {
            try {
                const q = query(
                    collection(db, "weekly_reviews"),
                    where("userId", "==", user.uid),
                    where("status", "==", "completed"),
                    orderBy("createdAt", "desc"),
                    limit(10)
                );
                const snap = await getDocs(q);
                const docs = snap.docs.map(d => ({ ...d.data(), id: d.id })) as WeeklyReview[];
                setHistory(docs);
            } catch (e) {
                console.warn("History load failed (likely missing index):", e);
            }
        };
        loadHistory();
    }, [user, mode]);

    const startNewReview = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const lastReview = await WeeklyReviewService.getLatestReview(user.uid);

            const pastGoals: { id: string; text: string; isCompleted: boolean }[] = [];

            if (lastReview?.nextWeek?.topPriorities) {
                lastReview.nextWeek.topPriorities.forEach((text: string, i: number) => {
                    pastGoals.push({ id: `goal-${i}`, text, isCompleted: false });
                });
            }

            if (lastReview?.nextWeek?.mustWinGoal) {
                pastGoals.unshift({ id: 'goal-must-win', text: `Must Win: ${lastReview.nextWeek.mustWinGoal}`, isCompleted: false });
            }

            const weekNumber = WeeklyReviewService.getWeekNumber();
            const year = new Date().getFullYear();

            // Check for draft again 
            let initialData: WeeklyReview;
            const existingDraft = await WeeklyReviewService.getDraft(user.uid);

            if (existingDraft) {
                initialData = existingDraft;
            } else {
                initialData = {
                    userId: user.uid,
                    startupId: "default",
                    weekNumber,
                    year,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    status: "draft",
                    metrics: { revenue: "", keyMetric: { id: "m1", name: "", value: "" } },
                    pastGoals,
                    wins: [],
                    challenges: [],
                    decisions: [],
                    sentiment: { productivityRating: 5, energyLevel: 5 },
                    nextWeek: { topPriorities: [], mustWinGoal: "", keyMetricTarget: "" }
                };
            }

            setReviewData(initialData);
            setMode("review");
            setCurrentStep(0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const continueDraft = () => {
        if (reviewData) {
            setMode("review");
        }
    };

    const updateData = (updates: Partial<WeeklyReview>) => {
        setReviewData(prev => prev ? { ...prev, ...updates } : null);
    };

    const handleNext = async () => {
        if (!reviewData || !user) return;
        setSaving(true);
        try {
            await WeeklyReviewService.saveDraft(reviewData);

            if (currentStep < STEPS.length - 1) {
                setCurrentStep(prev => prev + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                await WeeklyReviewService.submitReview(reviewData);
                setMode("summary");
            }
        } catch (e) {
            console.error("Save failed", e);
            alert("Failed to save progress. Please check your connection.");
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        else setMode("dashboard");
    };

    // Stats Calculation
    const avgCompletion = history.length > 0
        ? Math.round(history.reduce((acc, r) => {
            const total = r.pastGoals?.length || 0;
            const completed = r.pastGoals?.filter(g => g.isCompleted).length || 0;
            return acc + (total > 0 ? (completed / total) : 0);
        }, 0) / history.length * 100)
        : 0;

    const currentStreak = history.length; // Simplified streak for now

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    // VIEW: DASHBOARD
    if (mode === "dashboard") {
        return (
            <div className="min-h-screen bg-app p-6 md:p-12">
                <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-strong tracking-tight">Weekly Reviews</h1>
                            <p className="text-xl text-muted mt-2">The CEO's meeting with themselves.</p>
                        </div>

                        <div className="flex gap-4">
                            {reviewData && reviewData.status === 'draft' && (
                                <button
                                    onClick={continueDraft}
                                    className="bg-surface hover:bg-surface-alt border border-primary text-primary px-6 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all"
                                >
                                    Continue Draft
                                </button>
                            )}

                            <button
                                onClick={startNewReview}
                                className="bg-primary hover:bg-primary-dark text-on-primary px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                            >
                                <Plus className="w-6 h-6" /> {reviewData ? "Start New Review" : "Start Review"}
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-surface rounded-xl border border-subtle">
                            <h4 className="font-bold text-muted uppercase text-xs mb-2">Avg Goal Completion</h4>
                            <div className="text-3xl font-black">{avgCompletion > 0 ? `${avgCompletion}%` : "--"}</div>
                        </div>
                        <div className="p-6 bg-surface rounded-xl border border-subtle">
                            <h4 className="font-bold text-muted uppercase text-xs mb-2">Reviews Logged</h4>
                            <div className="text-3xl font-black">{history.length}</div>
                        </div>
                        <div className="p-6 bg-surface rounded-xl border border-subtle">
                            <h4 className="font-bold text-muted uppercase text-xs mb-2">Current Streak</h4>
                            <div className="text-3xl font-black">{currentStreak > 0 ? `${currentStreak} Wks` : "--"}</div>
                        </div>
                    </div>

                    {/* Analytics Layer */}
                    <div className="space-y-8">
                        <WeeklyAnalyticCharts history={history} />
                        <AnalyticsInsights history={history} />
                    </div>

                    {/* History List */}
                    <div className="bg-surface border border-subtle rounded-2xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <History className="w-6 h-6 text-primary" />
                            <h3 className="font-bold text-xl">Review History</h3>
                        </div>

                        {history.length === 0 ? (
                            <div className="text-center py-12 bg-surface-alt/30 rounded-xl border border-dashed border-subtle">
                                <p className="text-muted italic">No completed reviews found yet. Start your first one above!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map(review => (
                                    <ReviewHistoryItem key={review.id || review.weekNumber} review={review} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // VIEW: WIZARD
    if (mode === "review" && reviewData) {
        const stepInfo = STEPS[currentStep];
        const progress = Math.round(((currentStep) / (STEPS.length - 1)) * 100);

        return (
            <div className="min-h-screen bg-app flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] py-12 px-4">
                    <WizardStepContainer title={stepInfo.title} subtitle={stepInfo.subtitle} progress={progress}>
                        {currentStep === 0 && <StepSnapshot data={reviewData} updateData={updateData} />}
                        {currentStep === 1 && <StepGoals data={reviewData} updateData={updateData} />}
                        {currentStep === 2 && <StepWinsChallenges data={reviewData} updateData={updateData} />}
                        {currentStep === 3 && <StepDecisions data={reviewData} updateData={updateData} />}
                        {currentStep === 4 && <StepTeam data={reviewData} updateData={updateData} />}
                        {currentStep === 5 && <StepPlanning data={reviewData} updateData={updateData} />}
                    </WizardStepContainer>
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-md border-t border-subtle p-6 z-50">
                    <div className="max-w-3xl mx-auto flex justify-between items-center">
                        <button
                            onClick={handleBack}
                            className="text-muted font-bold hover:text-strong flex items-center gap-2 px-4 py-2 transition-colors"
                            disabled={saving}
                        >
                            <ArrowLeft className="w-5 h-5" /> Back
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={saving}
                            className={cn(
                                "flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0",
                                currentStep === STEPS.length - 1
                                    ? "bg-success hover:bg-success-dark text-white"
                                    : "bg-primary hover:bg-primary-dark text-on-primary"
                            )}
                        >
                            {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                            {currentStep === STEPS.length - 1 ? (
                                <>Complete Review <CheckCircle2 className="w-5 h-5" /></>
                            ) : (
                                <>Next Step <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </div>
                </div>
                {/* Spacer for fixed footer */}
                <div className="h-24" />
            </div>
        );
    }

    // VIEW: SUMMARY
    if (mode === "summary" && reviewData) {
        return (
            <div className="min-h-screen bg-app flex items-center justify-center py-20 px-4">
                <ReviewCompleteSummary
                    review={reviewData}
                    onFinish={() => {
                        setMode("dashboard");
                        setReviewData(null);
                    }}
                />
            </div>
        );
    }

    return null;
}
