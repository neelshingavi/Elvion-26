"use client";

import { useState, useEffect } from "react";
import { createDeal, getEligibleInvestors } from "@/lib/deal-service";
import {
    createDealTerms,
    InstrumentType,
    ValidityDuration
} from "@/lib/types/deal";
import { X, Send, AlertCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Connection } from "@/lib/types/connection";

interface CreateAskModalProps {
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateAskModal({ userId, onClose, onSuccess }: CreateAskModalProps) {
    const [eligibleInvestors, setEligibleInvestors] = useState<Connection[]>([]);
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [amount, setAmount] = useState(100000);
    const [equity, setEquity] = useState(5);
    const [validity, setValidity] = useState<ValidityDuration>(14);
    const [instrumentType, setInstrumentType] = useState<InstrumentType>("EQUITY");
    const [conditions, setConditions] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingInvestors, setFetchingInvestors] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const terms = createDealTerms(amount, equity, instrumentType, conditions);

    useEffect(() => {
        const loadInvestors = async () => {
            try {
                const investors = await getEligibleInvestors(userId);
                setEligibleInvestors(investors);
            } catch (err) {
                console.error("Failed to load eligible investors", err);
                setError("Failed to load interested investors");
            } finally {
                setFetchingInvestors(false);
            }
        };
        loadInvestors();
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
            setError("Please select an investor");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await createDeal(
                userId,
                "FOUNDER",
                selectedConnection.projectId,
                selectedConnection.investorId,
                amount,
                equity,
                validity,
                instrumentType,
                conditions || undefined
            );
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to create ask");
        } finally {
            setLoading(false);
        }
    };

    const eligibleList = eligibleInvestors;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-8 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Create Fundraising Ask</h2>
                        <p className="text-[11px] text-zinc-500 mt-1">Propose terms to an interested investor</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto">
                    {/* Investor Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Select Interested Investor</label>

                        {fetchingInvestors ? (
                            <div className="text-xs text-zinc-500 animate-pulse">Loading interested investors...</div>
                        ) : eligibleList.length === 0 ? (
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 text-center">
                                <p className="text-sm font-medium text-zinc-500">No investors have expressed interest yet.</p>
                                <p className="text-[10px] text-zinc-400 mt-1">You can only create asks for investors who are tracking your startup.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                                {eligibleList.map((conn) => (
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
                                                <User className="w-4 h-4 text-zinc-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                    Investor {conn.investorId.slice(0, 8)}
                                                </p>
                                                <p className="text-[10px] text-zinc-500">
                                                    Project: {conn.metadata?.projectName || conn.projectId}
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

                    {eligibleList.length > 0 && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Amount Seeking</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className="w-full px-4 py-3 text-lg font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Equity Offering (%)</label>
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
                                Send Ask to Investor
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
