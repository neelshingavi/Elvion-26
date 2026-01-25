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
import { getConnectionsForUser } from "@/lib/connection-service";
import { getStartup, Startup } from "@/lib/startup-service";
import { Connection } from "@/lib/types/connection";
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
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"active" | "pipeline" | "closed" | "all">("active");
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
    const [selectedDeal, setSelectedDeal] = useState<EnrichedDeal | null>(null);
    const [showCreateOffer, setShowCreateOffer] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const loadData = async () => {
        if (!user) return;
        try {
            const [rawDeals, rawConnections] = await Promise.all([
                getDealsForInvestor(user.uid),
                getConnectionsForUser(user.uid, "INVESTOR")
            ]);

            setConnections(rawConnections);

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
        loadData();
    }, [user]);

    const handleAccept = async (dealId: string) => {
        if (!user) return;
        setActionError(null);
        try {
            await acceptDeal(dealId, user.uid, "INVESTOR");
            await loadData();
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
            await loadData();
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
            await loadData();
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
    const activeNegotiations = deals.filter(d => ["PROPOSED", "COUNTERED", "NEGOTIATING", "ACCEPTED"].includes(d.status));
    const closedDeals = deals.filter(d => ["LOCKED", "EXPIRED", "DECLINED"].includes(d.status));

    // Identify Pipeline (Connections with NO active deal)
    const pipelineConnections = connections.filter(conn => {
        // Check if there is already an active deal for this connection
        const hasActiveDeal = deals.some(d => d.projectId === conn.projectId && ["PROPOSED", "COUNTERED", "NEGOTIATING", "ACCEPTED"].includes(d.status));
        return !hasActiveDeal && conn.status !== "REVOKED";
    });

    const filteredItems = useMemo(() => {
        if (filter === "pipeline") return pipelineConnections;

        let base = deals;
        if (selectedConnectionId) {
            base = base.filter(d => d.connectionId === selectedConnectionId);
        }

        if (filter === "active") return base.filter(d => ["PROPOSED", "COUNTERED", "NEGOTIATING", "ACCEPTED"].includes(d.status));
        if (filter === "closed") return base.filter(d => ["LOCKED", "EXPIRED", "DECLINED"].includes(d.status));
        return base; // 'all' (though we might remove 'all' in favor of tabs)
    }, [deals, pipelineConnections, filter, selectedConnectionId]);

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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Stats & Connections */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Mini Stats */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-amber-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">To Review</span>
                            </div>
                            <p className="text-2xl font-bold">{actionRequired.length}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Active</span>
                            </div>
                            <p className="text-2xl font-bold">{activeNegotiations.length}</p>
                        </div>
                    </div>

                    {/* Connections List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">All Connections</h2>
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {connections.length === 0 ? (
                                <p className="text-[11px] text-zinc-500 italic p-4 border border-dashed rounded-xl">No connections yet.</p>
                            ) : (
                                connections.map((conn) => (
                                    <div
                                        key={conn.connectionId}
                                        className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800"
                                    >
                                        <p className="font-bold text-sm tracking-tight">{conn.metadata?.projectName || "Unknown Project"}</p>
                                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tighter">Founder: {conn.founderId.slice(0, 8)}</p>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase",
                                                conn.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                                                    conn.status === "INTERESTED" ? "bg-blue-100 text-blue-700" :
                                                        "bg-zinc-100 text-zinc-500"
                                            )}>
                                                {conn.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Deals Listing */}
                <div className="lg:col-span-9 space-y-6">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-fit">
                        {[
                            { key: "active", label: "Active Negotiations", count: activeNegotiations.length },
                            { key: "pipeline", label: "Pipeline (Interested)", count: pipelineConnections.length },
                            { key: "closed", label: "Closed / Archived", count: closedDeals.length }
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

                    {/* Content Area */}
                    {filter === "pipeline" ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {pipelineConnections.length === 0 ? (
                                <div className="col-span-full p-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                                    <Briefcase className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                                    <p className="text-zinc-500 font-medium">No active leads</p>
                                    <p className="text-[11px] text-zinc-400 mt-1">Express interest in startups to see them here.</p>
                                </div>
                            ) : (
                                pipelineConnections.map(conn => (
                                    <div key={conn.connectionId} className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold">{conn.metadata?.projectName}</h3>
                                                <p className="text-xs text-zinc-500">Interested since {conn.createdAt.toDate().toLocaleDateString()}</p>
                                            </div>
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                                                <Briefcase className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase rounded">
                                                No Active Offer
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                // Pre-select logic if we wanted, for now just open modal
                                                setShowCreateOffer(true);
                                            }}
                                            className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black text-[11px] font-bold uppercase rounded-xl hover:opacity-90 transition-opacity"
                                        >
                                            Create Offer
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        // Deals Grid (Active or Closed)
                        (filteredItems as EnrichedDeal[]).length === 0 ? (
                            <div className="p-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                                <Briefcase className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-500 font-medium">No deals in this category</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {(filteredItems as EnrichedDeal[]).map((deal) => {
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
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl mb-6">
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
                        )
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
                            onSuccess={() => { setShowCreateOffer(false); loadData(); }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
