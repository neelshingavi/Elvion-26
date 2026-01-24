"use client";

import { useEffect, useState } from "react";
import { getDealFlow, updateDealStage } from "@/lib/investor-service";
import { getStartup } from "@/lib/startup-service";
import { useAuth } from "@/context/AuthContext";
import { DealFlow, DealStage } from "@/lib/types/investor";
import { Startup } from "@/lib/startup-service";
import { ChevronRight, MoreHorizontal, Activity, Tag, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface EnrichedDeal extends DealFlow {
    startup?: Startup;
}

const STAGES: DealStage[] = ["new", "review", "due_diligence", "term_sheet", "invested"];

export default function DealFlowPage() {
    const { user } = useAuth();
    const [deals, setDeals] = useState<EnrichedDeal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDeals = async () => {
            if (!user) return;
            try {
                const rawDeals = await getDealFlow(user.uid);
                const enriched = await Promise.all(rawDeals.map(async (deal) => {
                    const startup = await getStartup(deal.startupId);
                    return { ...deal, startup: startup || undefined };
                }));
                setDeals(enriched);
            } catch (error) {
                console.error("Failed to load deals:", error);
            } finally {
                setLoading(false);
            }
        };
        loadDeals();
    }, [user]);

    const handleStageChange = async (dealId: string, newStage: DealStage) => {
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
        try {
            await updateDealStage(dealId, newStage);
        } catch (error) {
            console.error("Failed to update deal stage:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col space-y-8">
            <header className="flex-none space-y-2">
                <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Deal Management</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Deal Flow
                </h1>
            </header>

            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-6 -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-6 h-full min-w-max">
                    {STAGES.map((stage) => {
                        const stageDeals = deals.filter(d => d.stage === stage);
                        return (
                            <div key={stage} className="w-[320px] flex flex-col bg-zinc-50 dark:bg-zinc-900/30 rounded-[2rem] border border-zinc-100 dark:border-zinc-800/50 p-4">
                                <div className="flex items-center justify-between mb-6 px-3">
                                    <h3 className="font-bold uppercase text-[10px] tracking-widest text-zinc-500">
                                        {stage.replace(/_/g, " ")}
                                    </h3>
                                    <span className="bg-zinc-200/50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded">
                                        {stageDeals.length} Assets
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
                                    <AnimatePresence>
                                        {stageDeals.map((deal) => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                key={deal.id}
                                                className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-indigo-500/20 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden flex flex-col min-w-0"
                                            >
                                                <div className="flex justify-between items-start mb-8 relative z-10 gap-4 shrink-0 min-w-0">
                                                    <div className="space-y-2 flex-1 min-w-0">
                                                        <Link href={`/investor/project/${deal.startupId}`} className="block group/link">
                                                            <h4 className="font-bold text-base tracking-tight leading-tight group-hover/link:text-indigo-500 transition-colors line-clamp-2 break-words">
                                                                {deal.startup?.name || deal.startup?.idea}
                                                            </h4>
                                                        </Link>
                                                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest line-clamp-1">
                                                            <Clock className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Updated 2d ago</span>
                                                        </div>
                                                    </div>
                                                    <button className="text-zinc-300 hover:text-indigo-500 transition-colors shrink-0">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-3 mb-8 relative z-10 shrink-0">
                                                    <div className="px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-[9px] font-bold text-zinc-500 border border-zinc-100 dark:border-zinc-800 uppercase tracking-wider shrink-0">
                                                        PRE-SEED
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-green-500 uppercase tracking-widest shrink-0">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        Active
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 relative z-10 mt-auto pt-6 border-t border-zinc-50 dark:border-zinc-800/50 shrink-0">
                                                    {stage !== "invested" ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleStageChange(deal.id, getNextStage(stage));
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-2 text-[10px] font-bold uppercase py-3 bg-zinc-950 text-white dark:bg-zinc-50 dark:text-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                                                        >
                                                            Advance Stage
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <div className="w-full py-3 bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-500 text-[10px] font-bold uppercase text-center rounded-xl border border-green-100 dark:border-green-900/30">
                                                            Investment Finalized
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {stageDeals.length === 0 && (
                                        <div className="h-32 border-2 border-dashed border-zinc-100 dark:border-zinc-800/50 rounded-[2rem] flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700 space-y-2">
                                            <Tag className="w-6 h-6 opacity-20" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Empty Channel</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function getNextStage(current: DealStage): DealStage {
    const idx = STAGES.indexOf(current);
    return idx < STAGES.length - 1 ? STAGES[idx + 1] : current;
}

