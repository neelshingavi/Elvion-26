"use client";

import { useState } from "react";
import { createDeal } from "@/lib/deal-service";
import { createDealTerms, InstrumentType, INSTRUMENT_LABELS } from "@/lib/types/deal";
import { X, DollarSign, Percent, TrendingUp, FileText, Send, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (dealId: string) => void;
    investorId: string;
    projectId: string;
    projectName: string;
    founderId: string;
}

export default function CreateDealModal({
    isOpen,
    onClose,
    onSuccess,
    investorId,
    projectId,
    projectName,
    founderId
}: CreateDealModalProps) {
    const [investmentAmount, setInvestmentAmount] = useState<number>(100000);
    const [equityPercentage, setEquityPercentage] = useState<number>(5);
    const [instrumentType, setInstrumentType] = useState<InstrumentType>("EQUITY");
    const [conditions, setConditions] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate valuations
    const terms = createDealTerms(investmentAmount, equityPercentage, instrumentType, conditions);
    const preMoneyValuation = terms.postMoneyValuation - investmentAmount;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleSubmit = async () => {
        if (investmentAmount <= 0 || equityPercentage <= 0 || equityPercentage > 100) {
            setError("Please enter valid investment amount and equity percentage");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const dealId = await createDeal(
                investorId,
                "INVESTOR",
                projectId,
                founderId,
                investmentAmount,
                equityPercentage,
                14, // Default 14 days validity
                instrumentType,
                conditions || undefined
            );
            onSuccess(dealId);
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to create deal");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Create Deal Proposal</h2>
                        <p className="text-[11px] text-zinc-500 mt-1">
                            Investment offer for <span className="font-bold text-indigo-500">{projectName}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                    {/* Amount & Equity Row */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                Investment Amount (USD)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="number"
                                    value={investmentAmount}
                                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-4 text-xl font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    min={0}
                                    step={10000}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                Equity Percentage
                            </label>
                            <div className="relative">
                                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="number"
                                    value={equityPercentage}
                                    onChange={(e) => setEquityPercentage(Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-4 text-xl font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    min={0.1}
                                    max={100}
                                    step={0.5}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Valuation Preview */}
                    <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                                Implied Valuation
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Pre-Money</p>
                                <p className="text-2xl font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
                                    {formatCurrency(preMoneyValuation)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Post-Money</p>
                                <p className="text-2xl font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
                                    {formatCurrency(terms.postMoneyValuation)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Instrument Type */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            Investment Instrument
                        </label>
                        <div className="flex gap-3">
                            {(Object.keys(INSTRUMENT_LABELS) as InstrumentType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setInstrumentType(type)}
                                    className={cn(
                                        "flex-1 py-3 px-4 text-[11px] font-bold uppercase tracking-widest rounded-xl border transition-all",
                                        instrumentType === type
                                            ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white"
                                            : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                                    )}
                                >
                                    {INSTRUMENT_LABELS[type]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conditions */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            Conditions / Notes (Optional)
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-4 w-4 h-4 text-zinc-400" />
                            <textarea
                                value={conditions}
                                onChange={(e) => setConditions(e.target.value)}
                                placeholder="Any specific terms or conditions..."
                                className="w-full pl-10 pr-4 py-4 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                            <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <p className="text-[10px] text-zinc-400 max-w-xs">
                        This offer will be sent to the founder for review. They may accept or counter with modified terms.
                    </p>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Send Proposal
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
