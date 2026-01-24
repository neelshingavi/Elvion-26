"use client";

import { useEffect, useState } from "react";
import { getDealFlow, updateDealStage } from "@/lib/investor-service";
import { getStartup } from "@/lib/startup-service";
import { useAuth } from "@/context/AuthContext";
import { DealFlow, DealStage } from "@/lib/types/investor";
import { Startup } from "@/lib/startup-service";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";

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
                // Enrich with startup data
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
        // Optimistic update
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
        try {
            await updateDealStage(dealId, newStage);
        } catch (error) {
            console.error("Failed to update deal stage:", error);
            // Revert on error would go here
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            <header className="mb-6 flex-none">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Deal Flow
                </h1>
            </header>

            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex gap-6 h-full min-w-max">
                    {STAGES.map((stage) => {
                        const stageDeals = deals.filter(d => d.stage === stage);
                        return (
                            <div key={stage} className="w-80 flex flex-col bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h3 className="font-bold uppercase text-xs tracking-widest text-zinc-500">
                                        {stage.replace(/_/g, " ")}
                                    </h3>
                                    <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {stageDeals.length}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                                    {stageDeals.map((deal) => (
                                        <div
                                            key={deal.id}
                                            className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <Link href={`/investor/startups/${deal.startupId}`} className="hover:underline">
                                                    <h4 className="font-bold text-sm">
                                                        {deal.startup?.idea.slice(0, 30)}...
                                                    </h4>
                                                </Link>
                                                <button className="text-zinc-400 hover:text-black dark:hover:text-white">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                                {stage !== "invested" && (
                                                    <button
                                                        onClick={() => handleStageChange(deal.id, getNextStage(stage))}
                                                        className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
                                                    >
                                                        Move Next
                                                        <ChevronRight className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {stageDeals.length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 text-xs font-medium italic">
                                            No deals
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
