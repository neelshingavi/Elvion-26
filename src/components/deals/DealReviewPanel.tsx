import { useState, useEffect } from "react";
import {
    Deal,
    DEAL_STATUS_COLORS,
    INSTRUMENT_LABELS,
    getTimeRemaining,
    getRoleAwareStatusLabel,
    ValidityDuration,
    VALIDITY_DURATION_LABELS,
    createDealTerms
} from "@/lib/types/deal";
import { canUserActOnDeal } from "@/lib/deal-service";
import {
    X,
    DollarSign,
    Percent,
    CheckCircle2,
    ArrowLeftRight,
    AlertCircle,
    Lock,
    Send,
    XCircle,
    Timer
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getLatestAIAnalysis } from "@/lib/ai-service";
import { DealAIAnalysis } from "@/lib/types/ai";
import { Sparkles, Brain, ShieldAlert, Lightbulb } from "lucide-react";

interface DealReviewPanelProps {
    deal: Deal;
    userId: string;
    userRole: "FOUNDER" | "INVESTOR";
    onClose: () => void;
    onAccept: (dealId: string) => void;
    onDecline: (dealId: string) => void;
    onCounter: (dealId: string, amount: number, equity: number, validity: ValidityDuration, rationale?: string) => void;
    error?: string | null;
}

export default function DealReviewPanel({
    deal,
    userId,
    userRole,
    onClose,
    onAccept,
    onDecline,
    onCounter,
    error
}: DealReviewPanelProps) {
    const [mode, setMode] = useState<"review" | "counter">("review");
    const [counterAmount, setCounterAmount] = useState(deal.currentTerms.investmentAmount);
    const [counterEquity, setCounterEquity] = useState(deal.currentTerms.equityPercentage);
    const [counterValidity, setCounterValidity] = useState<ValidityDuration>(14);
    const [rationale, setRationale] = useState("");
    const [loading, setLoading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<DealAIAnalysis | null>(null);
    const [loadingAI, setLoadingAI] = useState(false);

    useEffect(() => {
        const fetchAI = async () => {
            setLoadingAI(true);
            try {
                const analysis = await getLatestAIAnalysis(deal.dealId, userRole);
                setAiAnalysis(analysis);
            } catch (err) {
                console.error("AI Analysis fetch failed:", err);
            } finally {
                setLoadingAI(false);
            }
        };
        fetchAI();
    }, [deal.dealId, deal.versionNumber, userRole]);

    const canAct = canUserActOnDeal(deal, userId);
    const timeRemaining = getTimeRemaining(deal.validUntil);
    const counterTerms = createDealTerms(counterAmount, counterEquity, deal.currentTerms.instrumentType);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleAcceptClick = async () => {
        setLoading(true);
        try {
            await onAccept(deal.dealId);
        } finally {
            setLoading(false);
        }
    };

    const handleDeclineClick = async () => {
        setLoading(true);
        try {
            await onDecline(deal.dealId);
        } finally {
            setLoading(false);
        }
    };

    const handleCounterClick = async () => {
        setLoading(true);
        try {
            await onCounter(deal.dealId, counterAmount, counterEquity, counterValidity, rationale || undefined);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-stretch justify-end">
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Deal Review</h2>
                        <p className="text-[11px] text-zinc-500">
                            {deal.initiatedBy === "FOUNDER" ? "Founder Ask" : "Investor Offer"} • Version {deal.versionNumber}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Content Layout */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-zinc-100 dark:border-zinc-800">
                        {/* Expiration Warning */}
                        {!timeRemaining.expired && ["PROPOSED", "COUNTERED", "NEGOTIATING"].includes(deal.status) && (
                            <div className={cn(
                                "p-4 rounded-xl border flex items-center gap-3",
                                timeRemaining.days <= 2
                                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30"
                                    : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30"
                            )}>
                                <Timer className={cn("w-5 h-5", timeRemaining.days <= 2 ? "text-red-500" : "text-blue-500")} />
                                <span className={cn("text-sm font-medium", timeRemaining.days <= 2 ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300")}>
                                    {timeRemaining.expired ? "Expired" : `Expires in ${timeRemaining.days} days, ${timeRemaining.hours} hours`}
                                </span>
                            </div>
                        )}

                        {/* Current Terms */}
                        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2 mb-4">
                                <DollarSign className="w-4 h-4 text-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Current Terms</span>
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <p className="text-[10px] text-zinc-400 mb-1">Investment</p>
                                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(deal.currentTerms.investmentAmount)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-400 mb-1">Equity</p>
                                    <p className="text-2xl font-bold tracking-tight">{deal.currentTerms.equityPercentage}%</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-400 mb-1">Valuation</p>
                                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(deal.currentTerms.impliedValuation)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Negotiation History */}
                        {deal.versionHistory.length > 1 && (
                            <div className="space-y-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Negotiation History</span>
                                <div className="space-y-2">
                                    {deal.versionHistory.slice().reverse().map((version, i) => (
                                        <div key={version.version} className={cn(
                                            "p-4 rounded-xl border",
                                            i === 0 ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30" : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800"
                                        )}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={cn("text-[9px] font-bold uppercase tracking-widest", i === 0 ? "text-indigo-600" : "text-zinc-400")}>
                                                    V{version.version} {i === 0 && "• Current"}
                                                </span>
                                                <span className="text-[10px] text-zinc-400">
                                                    {version.proposedAt ? format(version.proposedAt.toDate(), "MMM d, h:mm a") : ""}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[11px]">
                                                <span className="font-bold">{formatCurrency(version.terms.investmentAmount)}</span>
                                                <span className="text-zinc-400">for</span>
                                                <span className="font-bold">{version.terms.equityPercentage}%</span>
                                                <span className="text-zinc-400">by {version.proposedBy}</span>
                                            </div>
                                            {version.rationale && (
                                                <p className="mt-2 text-[11px] text-zinc-500 italic">"{version.rationale}"</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Counter Mode */}
                        {mode === "counter" && canAct && (
                            <div className="p-6 bg-purple-50 dark:bg-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-900/30 space-y-4">
                                <div className="flex items-center gap-2">
                                    <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-700 dark:text-purple-400">Your Counter Offer</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500">Investment Amount</label>
                                        <input
                                            type="number"
                                            value={counterAmount}
                                            onChange={(e) => setCounterAmount(Number(e.target.value))}
                                            className="w-full px-4 py-3 text-lg font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500">Equity %</label>
                                        <input
                                            type="number"
                                            value={counterEquity}
                                            onChange={(e) => setCounterEquity(Number(e.target.value))}
                                            className="w-full px-4 py-3 text-lg font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none"
                                            step={0.5}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500">Validity Period</label>
                                    <div className="flex gap-2">
                                        {([7, 14, 30, 60] as ValidityDuration[]).map((days) => (
                                            <button
                                                key={days}
                                                onClick={() => setCounterValidity(days)}
                                                className={cn(
                                                    "px-4 py-2 text-[11px] font-bold rounded-lg border transition-all",
                                                    counterValidity === days
                                                        ? "bg-purple-600 text-white border-purple-600"
                                                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                                )}
                                            >
                                                {VALIDITY_DURATION_LABELS[days]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl">
                                    <p className="text-[10px] text-zinc-400 mb-1">New Valuation</p>
                                    <p className="text-xl font-bold">{formatCurrency(counterTerms.impliedValuation)}</p>
                                </div>

                                <textarea
                                    value={rationale}
                                    onChange={(e) => setRationale(e.target.value)}
                                    placeholder="Explain your counter (optional)"
                                    className="w-full px-4 py-3 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none resize-none"
                                    rows={2}
                                />
                            </div>
                        )}
                    </div>

                    {/* AI Insights Sidebar */}
                    <div className="w-80 bg-zinc-50 dark:bg-zinc-900/50 overflow-y-auto p-6 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">AI Insight (Advisory)</span>
                        </div>

                        {loadingAI ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                                <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            </div>
                        ) : aiAnalysis ? (
                            <div className="space-y-6">
                                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 italic">
                                        "{aiAnalysis.summary}"
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-zinc-500">
                                        <Brain className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase">Valuation Sanity</span>
                                    </div>
                                    <p className="text-[11px] font-medium text-zinc-900 dark:text-zinc-200">{aiAnalysis.valuationSanity}</p>
                                </div>

                                {aiAnalysis.riskSignals.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-amber-500">
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase">Risk Signals</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {aiAnalysis.riskSignals.map((risk, i) => (
                                                <li key={i} className="text-[11px] text-zinc-600 dark:text-zinc-400 pl-4 border-l-2 border-amber-200">
                                                    {risk}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {aiAnalysis.suggestedActions.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-indigo-500">
                                            <Lightbulb className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase">Suggested Actions</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {aiAnalysis.suggestedActions.map((action, i) => (
                                                <li key={i} className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                                                    {action}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                    <div className="flex justify-between items-center text-[9px] text-zinc-500">
                                        <span>Confidence Score</span>
                                        <span className="font-bold text-green-500">{(aiAnalysis.confidenceScore * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="mt-2 h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 transition-all duration-1000"
                                            style={{ width: `${aiAnalysis.confidenceScore * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-center">
                                <p className="text-[10px] text-zinc-500">No analysis available for this version.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border-t border-red-200 dark:border-red-900/30 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600">{error}</span>
                    </div>
                )}

                {/* Footer Actions */}
                {canAct && (
                    <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        {mode === "review" ? (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleAcceptClick}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Accept
                                </button>
                                <button
                                    onClick={() => setMode("counter")}
                                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-purple-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-purple-700 transition-all"
                                >
                                    <ArrowLeftRight className="w-4 h-4" />
                                    Counter
                                </button>
                                <button
                                    onClick={handleDeclineClick}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Decline
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setMode("review")} className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCounterClick}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-purple-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl disabled:opacity-50 transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                    Send Counter
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Read-only State */}
                {!canAct && ["PROPOSED", "COUNTERED", "NEGOTIATING"].includes(deal.status) && (
                    <div className="p-6 border-t border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/20">
                        <div className="flex items-center gap-3">
                            <Timer className="w-5 h-5 text-blue-600" />
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                Waiting for {deal.actionRequiredBy === "INVESTOR" ? "investor" : "founder"} response
                            </p>
                        </div>
                    </div>
                )}

                {/* Locked State */}
                {deal.status === "LOCKED" && (
                    <div className="p-6 border-t border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-950/20">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="font-bold text-green-800 dark:text-green-200">Deal Finalized</p>
                                <p className="text-[11px] text-green-600">
                                    Locked on {deal.lockedAt ? format(deal.lockedAt.toDate(), "MMMM d, yyyy") : "recently"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
