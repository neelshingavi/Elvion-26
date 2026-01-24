"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    getDealsForInvestor,
    acceptDeal,
    counterDeal,
    declineDeal,
    canUserActOnDeal
} from "@/lib/deal-service";
import { getStartup, Startup } from "@/lib/startup-service";
import {
    Deal,
    DEAL_STATUS_COLORS,
    getTimeRemaining,
    getRoleAwareStatusLabel,
    ValidityDuration,
    INSTRUMENT_LABELS
} from "@/lib/types/deal";
import {
    Briefcase,
    Clock,
    DollarSign,
    ArrowRight,
    Plus,
    AlertCircle,
    CheckCircle2,
    Lock,
    Timer,
    User
} from "lucide-react";
import { cn } from "@/lib/utils";
import DealReviewPanel from "@/components/deals/DealReviewPanel";
import CreateOfferModal from "@/components/deals/CreateOfferModal";

interface EnrichedDeal extends Deal {
    startup?: Startup;
}

export default function InvestorDealsPage() {
    const { user } = useAuth();
    const [deals, setDeals] = useState<EnrichedDeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "action" | "waiting" | "closed">("all");
    const [selectedDeal, setSelectedDeal] = useState<EnrichedDeal | null>(null);
    const [showCreateOffer, setShowCreateOffer] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const loadDeals = async () => {
        if (!user) return;
        try {
            const rawDeals = await getDealsForInvestor(user.uid);
            const enriched = await Promise.all(
                rawDeals.map(async (deal) => {
                    try {
                        const startup = await getStartup(deal.projectId);
                        return { ...deal, startup: startup || undefined };
                    } catch {
                        return { ...deal, startup: undefined };
                    }
                })
            );
            setDeals(enriched);
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
            await acceptDeal(dealId, user.uid, "INVESTOR");
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
            await declineDeal(dealId, user.uid, "INVESTOR");
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
            await counterDeal(dealId, user.uid, "INVESTOR", investmentAmount, equityPercentage, validityDays, undefined, undefined, rationale);
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

    const filteredDeals = useMemo(() => {
        if (filter === "all") return deals;
        if (filter === "action") return actionRequired;
        if (filter === "waiting") return awaitingResponse;
        return closedDeals;
    }, [deals, filter, actionRequired, awaitingResponse, closedDeals]);

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
                        <Briefcase className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Deal Management</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Active Deals</h1>
                </div>
                <button
                    onClick={() => setShowCreateOffer(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg"
                >
                    <Plus className="w-4 h-4" />
                    New Offer
                </button>
            </header>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-fit">
                {[
                    { key: "all", label: "All", count: deals.length },
                    { key: "action", label: "Action Required", count: actionRequired.length },
                    { key: "waiting", label: "Awaiting", count: awaitingResponse.length },
                    { key: "closed", label: "Closed", count: closedDeals.length }
                ].map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key as any)}
                        className={cn(
                            "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2",
                            filter === f.key
                                ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        )}
                    >
                        {f.label}
                        {f.count > 0 && (
                            <span className={cn(
                                "px-1.5 py-0.5 rounded text-[9px]",
                                filter === f.key ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"
                            )}>
                                {f.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Action Required Banner */}
            {actionRequired.length > 0 && filter !== "closed" && (
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
                                Including {actionRequired.filter(d => d.initiatedBy === "FOUNDER").length} founder ask{actionRequired.filter(d => d.initiatedBy === "FOUNDER").length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Action Required", value: actionRequired.length, icon: Clock, color: "text-amber-500" },
                    { label: "Awaiting Response", value: awaitingResponse.length, icon: Timer, color: "text-blue-500" },
                    { label: "Finalized", value: closedDeals.filter(d => d.status === "LOCKED").length, icon: Lock, color: "text-green-500" },
                    { label: "Capital Committed", value: formatCurrency(closedDeals.filter(d => d.status === "LOCKED").reduce((sum, d) => sum + d.currentTerms.investmentAmount, 0)), icon: DollarSign, color: "text-indigo-500" }
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

            {/* Deals Grid */}
            {filteredDeals.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                    <Briefcase className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">No deals in this category</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredDeals.map((deal) => {
                        const statusColors = DEAL_STATUS_COLORS[deal.status];
                        const canAct = user && canUserActOnDeal(deal, user.uid);
                        const timeRemaining = getTimeRemaining(deal.validUntil);
                        const roleLabel = getRoleAwareStatusLabel(deal, "INVESTOR");

                        return (
                            <div
                                key={deal.dealId}
                                onClick={() => setSelectedDeal(deal)}
                                className={cn(
                                    "p-8 rounded-3xl bg-white dark:bg-zinc-900 border cursor-pointer transition-all hover:shadow-xl",
                                    canAct ? "border-amber-300 dark:border-amber-700 ring-2 ring-amber-200/50" : "border-zinc-100 dark:border-zinc-800"
                                )}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={cn(
                                                "px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded",
                                                statusColors.bg, statusColors.text
                                            )}>
                                                {roleLabel}
                                            </span>
                                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                                {deal.initiatedBy === "INVESTOR" ? "Your Offer" : "Founder Ask"}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold tracking-tight">
                                            {deal.startup?.name || deal.startup?.idea || "Unknown Project"}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                            <User className="w-3 h-3" />
                                            <span>Founder: {deal.founderId.slice(0, 8)}...</span>
                                        </div>
                                    </div>
                                    {canAct && (
                                        <div className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                            <span className="text-[9px] font-bold text-amber-600 uppercase">Action Required</span>
                                        </div>
                                    )}
                                </div>

                                {/* Terms Grid */}
                                <div className="grid grid-cols-3 gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl mb-6">
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Investment</p>
                                        <p className="text-xl font-bold tracking-tight">{formatCurrency(deal.currentTerms.investmentAmount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Equity</p>
                                        <p className="text-xl font-bold tracking-tight">{deal.currentTerms.equityPercentage}%</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Valuation</p>
                                        <p className="text-xl font-bold tracking-tight">{formatCurrency(deal.currentTerms.impliedValuation)}</p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold rounded-lg">
                                            {INSTRUMENT_LABELS[deal.currentTerms.instrumentType]}
                                        </span>
                                        <span className="text-[10px] text-zinc-400">
                                            V{deal.versionNumber}
                                        </span>
                                    </div>
                                    {!timeRemaining.expired && ["PROPOSED", "COUNTERED", "NEGOTIATING"].includes(deal.status) && (
                                        <span className={cn(
                                            "text-[10px] font-bold",
                                            timeRemaining.days <= 2 ? "text-red-500" : "text-zinc-400"
                                        )}>
                                            Expires in {timeRemaining.days}d {timeRemaining.hours}h
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Deal Review Panel */}
            {selectedDeal && user && (
                <DealReviewPanel
                    deal={selectedDeal}
                    userId={user.uid}
                    userRole="INVESTOR"
                    onClose={() => { setSelectedDeal(null); setActionError(null); }}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onCounter={handleCounter}
                    error={actionError}
                />
            )}

            {/* Create Offer Modal */}
            {showCreateOffer && user && (
                <CreateOfferModal
                    userId={user.uid}
                    onClose={() => setShowCreateOffer(false)}
                    onSuccess={() => { setShowCreateOffer(false); loadDeals(); }}
                />
            )}
        </div>
    );
}
