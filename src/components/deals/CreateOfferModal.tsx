"use client";

import { useState, useEffect } from "react";
import { createDeal } from "@/lib/deal-service";
import { getConnectionsForUser } from "@/lib/connection-service";
import {
    createDealTerms,
    InstrumentType,
    ValidityDuration
} from "@/lib/types/deal";
import { X, Send, AlertCircle, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { Connection } from "@/lib/types/connection";

interface CreateOfferModalProps {
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateOfferModal({ userId, onClose, onSuccess }: CreateOfferModalProps) {
    const [connectedStartups, setConnectedStartups] = useState<Connection[]>([]);
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [amount, setAmount] = useState(100000);
    const [equity, setEquity] = useState(5);
    const [validity, setValidity] = useState<ValidityDuration>(14);
    const [instrumentType, setInstrumentType] = useState<InstrumentType>("EQUITY");
    const [conditions, setConditions] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingStartups, setFetchingStartups] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const terms = createDealTerms(amount, equity, instrumentType, conditions);

    useEffect(() => {
        const loadStartups = async () => {
            try {
                // Fetch connections where I am the investor
                const connections = await getConnectionsForUser(userId, "INVESTOR");
                // Filter only those that are INTERESTED or CONNECTED/ACTIVE
                // (Active deals might already exist, but here we can create a new offer if no active deal)
                const eligible = connections.filter(c => ["INTERESTED", "CONNECTED", "ACTIVE"].includes(c.status));
                setConnectedStartups(eligible);
            } catch (err) {
                console.error("Failed to load startups", err);
                setError("Failed to load your interested startups");
            } finally {
                setFetchingStartups(false);
            }
        };
        loadStartups();
    }, [userId]);

    const formatCurrency = (amt: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0
        }).format(amt);
    };

    const handleSubmit = async () => {
        if (!selectedConnection) {
            setError("Please select a startup");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await createDeal(
                userId,
                "INVESTOR",
                selectedConnection.projectId,
                selectedConnection.founderId,
                amount,
                equity,
                validity,
                instrumentType,
                conditions || undefined
            );
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to create offer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-8 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Create Investment Offer</h2>
                        <p className="text-[11px] text-zinc-500 mt-1">Propose terms to a startup you are interested in</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto">
                    {/* Startup Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Select Startup</label>

                        {fetchingStartups ? (
                            <div className="text-xs text-zinc-500 animate-pulse">Loading interested startups...</div>
                        ) : connectedStartups.length === 0 ? (
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 text-center">
                                <p className="text-sm font-medium text-zinc-500">No interested startups found.</p>
                                <p className="text-[10px] text-zinc-400 mt-1">Visit a startup profile and click "Interested" first.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                                {connectedStartups.map((conn) => (
                                    <button
                                        key={conn.connectionId}
                                        onClick={() => setSelectedConnection(conn)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                                            selectedConnection?.connectionId === conn.connectionId
                                                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500"
                                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                                <Briefcase className="w-4 h-4 text-zinc-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                    {conn.metadata?.projectName || `Project ${conn.projectId.slice(0, 8)}`}
                                                </p>
                                                <p className="text-[10px] text-zinc-500">
                                                    Status: {conn.status}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedConnection?.connectionId === conn.connectionId && (
                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {connectedStartups.length > 0 && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Investment Amount</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className="w-full px-4 py-3 text-lg font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Equity Requested (%)</label>
                                    <input
                                        type="number"
                                        value={equity}
                                        onChange={(e) => setEquity(Number(e.target.value))}
                                        className="w-full px-4 py-3 text-lg font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none"
                                        step={0.5}
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[10px] text-zinc-500 mb-1">Implied Valuation</p>
                                        <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{formatCurrency(terms.impliedValuation)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 mb-1">Post-Money</p>
                                        <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{formatCurrency(terms.postMoneyValuation)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Offer Valid For</label>
                                <div className="flex gap-2">
                                    {([7, 14, 30, 60] as ValidityDuration[]).map((days) => (
                                        <button
                                            key={days}
                                            onClick={() => setValidity(days)}
                                            className={cn(
                                                "flex-1 py-3 text-[11px] font-bold uppercase rounded-xl border transition-all",
                                                validity === days
                                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white"
                                                    : "border-zinc-200 dark:border-zinc-800"
                                            )}
                                        >
                                            {days} days
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-xl flex items-center gap-3">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-sm text-red-600">{error}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedConnection}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Send Offer
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
