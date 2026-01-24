"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    getDealsForFounder,
    acceptDeal,
    counterDeal,
    declineDeal,
    canUserActOnDeal
} from "@/lib/deal-service";
import {
    Deal,
    DEAL_STATUS_COLORS,
    getTimeRemaining,
    getRoleAwareStatusLabel,
    ValidityDuration
} from "@/lib/types/deal";
import {
    Inbox,
    Clock,
    DollarSign,
    Lock,
    User,
    ArrowRight,
    Plus,
    AlertCircle,
    ArrowLeftRight,
    Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import DealReviewPanel from "@/components/deals/DealReviewPanel";
import CreateAskModal from "@/components/deals/CreateAskModal";

export default function FounderDealsPage() {
    const { user } = useAuth();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [showCreateAsk, setShowCreateAsk] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const loadDeals = async () => {
        if (!user) return;
        try {
            const rawDeals = await getDealsForFounder(user.uid);
            setDeals(rawDeals);
        } catch (error) {
            console.error("Failed to load deals:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeals();
    }, [user]);

    const handleAccept = async (dealId: string) => {
        if (!user) return;
        setActionError(null);
        try {
            await acceptDeal(dealId, user.uid, "FOUNDER");
            await loadDeals();
            setSelectedDeal(null);
        } catch (error: any) {
            setActionError(error.message || "Failed to accept deal");
        }
    };

    const handleDecline = async (dealId: string) => {
        if (!user) return;
        setActionError(null);
        try {
            await declineDeal(dealId, user.uid, "FOUNDER");
            await loadDeals();
            setSelectedDeal(null);
        } catch (error: any) {
            setActionError(error.message || "Failed to decline deal");
        }
    };

    const handleCounter = async (
        dealId: string,
        investmentAmount: number,
        equityPercentage: number,
        validityDays: ValidityDuration,
        rationale?: string
    ) => {
        if (!user) return;
        setActionError(null);
        try {
            await counterDeal(dealId, user.uid, "FOUNDER", investmentAmount, equityPercentage, validityDays, undefined, undefined, rationale);
            await loadDeals();
            setSelectedDeal(null);
        } catch (error: any) {
            setActionError(error.message || "Failed to counter deal");
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Categorize deals
    const actionRequired = deals.filter(d => user && canUserActOnDeal(d, user.uid));
    const awaitingResponse = deals.filter(d => user && !canUserActOnDeal(d, user.uid) && ["PROPOSED", "COUNTERED", "NEGOTIATING"].includes(d.status));
    const closedDeals = deals.filter(d => ["LOCKED", "EXPIRED", "DECLINED"].includes(d.status));

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Loading Deals...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-24">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Inbox className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Fundraising</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Deal Inbox</h1>
                </div>
                <button
                    onClick={() => setShowCreateAsk(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg"
                >
                    <Plus className="w-4 h-4" />
                    Create Ask
                </button>
            </header>

            {/* Action Required Banner */}
            {actionRequired.length > 0 && (
                <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900/30 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-amber-800 dark:text-amber-200">
                                {actionRequired.length} deal{actionRequired.length > 1 ? "s" : ""} require your response
                            </p>
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                                Review and respond before offers expire
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Action Required", value: actionRequired.length, icon: Clock, color: "text-amber-500" },
                    { label: "Awaiting Response", value: awaitingResponse.length, icon: Timer, color: "text-blue-500" },
                    { label: "Finalized", value: closedDeals.filter(d => d.status === "LOCKED").length, icon: Lock, color: "text-green-500" },
                    { label: "Total Value", value: formatCurrency(deals.reduce((sum, d) => sum + d.currentTerms.investmentAmount, 0)), icon: DollarSign, color: "text-indigo-500" }
                ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                <stat.icon className={cn("w-4 h-4", stat.color)} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Deals List */}
            {deals.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                    <Inbox className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">No deals yet</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Create an Ask or wait for investor offers</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {deals.map((deal) => {
                        const statusColors = DEAL_STATUS_COLORS[deal.status];
                        const canAct = user && canUserActOnDeal(deal, user.uid);
                        const timeRemaining = getTimeRemaining(deal.validUntil);
                        const roleLabel = getRoleAwareStatusLabel(deal, "FOUNDER");

                        return (
                            <div
                                key={deal.dealId}
                                onClick={() => setSelectedDeal(deal)}
                                className={cn(
                                    "p-6 rounded-2xl bg-white dark:bg-zinc-900 border cursor-pointer transition-all hover:shadow-lg",
                                    canAct
                                        ? "border-amber-300 dark:border-amber-700 ring-2 ring-amber-200 dark:ring-amber-900/50"
                                        : "border-zinc-100 dark:border-zinc-800"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={cn(
                                            "p-3 rounded-xl",
                                            canAct ? "bg-amber-100 dark:bg-amber-900/30" : "bg-zinc-100 dark:bg-zinc-800"
                                        )}>
                                            {deal.status === "LOCKED" ? (
                                                <Lock className="w-5 h-5 text-green-500" />
                                            ) : canAct ? (
                                                <Clock className="w-5 h-5 text-amber-500" />
                                            ) : (
                                                <ArrowLeftRight className="w-5 h-5 text-zinc-500" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className={cn(
                                                    "px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded",
                                                    statusColors.bg, statusColors.text
                                                )}>
                                                    {roleLabel}
                                                </span>
                                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                                    {deal.initiatedBy === "FOUNDER" ? "Your Ask" : "Investor Offer"}
                                                </span>
                                                {canAct && (
                                                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                                                        Action Required
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                                                <User className="w-3 h-3" />
                                                <span>Investor: {deal.investorId.slice(0, 8)}...</span>
                                                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                                {!timeRemaining.expired && ["PROPOSED", "COUNTERED", "NEGOTIATING"].includes(deal.status) && (
                                                    <span className={cn(
                                                        "font-bold",
                                                        timeRemaining.days <= 2 ? "text-red-500" : "text-zinc-500"
                                                    )}>
                                                        Expires in {timeRemaining.days}d {timeRemaining.hours}h
                                                    </span>
                                                )}
                                                {timeRemaining.expired && deal.status !== "EXPIRED" && deal.status !== "LOCKED" && deal.status !== "DECLINED" && (
                                                    <span className="text-red-500 font-bold">Expired</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Investment</p>
                                            <p className="text-lg font-bold">{formatCurrency(deal.currentTerms.investmentAmount)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Equity</p>
                                            <p className="text-lg font-bold">{deal.currentTerms.equityPercentage}%</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Valuation</p>
                                            <p className="text-lg font-bold">{formatCurrency(deal.currentTerms.impliedValuation)}</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-zinc-300" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Deal Review Panel */}
            {selectedDeal && (
                <DealReviewPanel
                    deal={selectedDeal}
                    userId={user?.uid || ""}
                    userRole="FOUNDER"
                    onClose={() => { setSelectedDeal(null); setActionError(null); }}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onCounter={handleCounter}
                    error={actionError}
                />
            )}

            {/* Create Ask Modal */}
            {showCreateAsk && user && (
                <CreateAskModal
                    userId={user.uid}
                    onClose={() => setShowCreateAsk(false)}
                    onSuccess={() => { setShowCreateAsk(false); loadDeals(); }}
                />
            )}
        </div>
    );
}
