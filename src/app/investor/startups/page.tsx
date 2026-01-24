"use client";

import { useState, useEffect } from "react";
import { getStartups, Startup } from "@/lib/startup-service";
import Link from "next/link";
import { Search, Filter, ArrowUpRight, Rocket, Target, Zap, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DiscoverStartupsPage() {
    const [startups, setStartups] = useState<Startup[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [stageFilter, setStageFilter] = useState<string>("all");

    useEffect(() => {
        const fetchStartups = async () => {
            setLoading(true);
            try {
                const data = await getStartups(stageFilter !== "all" ? { stage: stageFilter } : undefined);
                setStartups(data);
            } catch (error) {
                console.error("Failed to fetch startups:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStartups();
    }, [stageFilter]);

    const filteredStartups = startups.filter(s =>
        s.idea.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-12 pb-24 max-w-full mx-auto animate-in fade-in duration-700">
            <header className="space-y-4">
                <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Venture Marketplace</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Discover Opportunities
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed max-w-2xl">
                    Our AI agents continuously scan the network for high-velocity startups. Source and track your next conviction investment.
                </p>
            </header>

            {/* Premium Controls */}
            <div className="flex flex-col md:flex-row gap-6 p-2 bg-zinc-100 dark:bg-zinc-900/50 rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by keywords, industry, or problem statement..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 rounded-3xl border-none bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                    />
                </div>
                <div className="relative md:w-64 group">
                    <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                    <select
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                        className="w-full pl-14 pr-10 py-4 rounded-3xl border-none bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none transition-all cursor-pointer shadow-sm font-medium text-sm"
                    >
                        <option value="all">All Growth Stages</option>
                        <option value="idea_submitted">Protocol Alpha (Idea)</option>
                        <option value="idea_validated">Validation Phase</option>
                        <option value="execution_active">High-Velocity Execution</option>
                    </select>
                </div>
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Indexing Network...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filteredStartups.length > 0 ? (
                            filteredStartups.map((startup, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={startup.startupId}
                                >
                                    <Link
                                        href={`/investor/startups/${startup.startupId}`}
                                        className="group relative flex flex-col p-10 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:-translate-y-1 duration-300 h-full overflow-hidden min-w-0"
                                    >
                                        <div className="flex justify-between items-start mb-10 relative z-10 shrink-0 min-w-0 gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-zinc-950 dark:bg-white flex items-center justify-center font-bold text-2xl text-white dark:text-black shadow-lg shrink-0">
                                                {startup.idea.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:border-indigo-500/30 transition-all shrink-0">
                                                <ArrowUpRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-500 transition-colors" />
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-6 relative z-10 min-w-0 flex flex-col">
                                            <h3 className="font-bold text-xl leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight line-clamp-2 break-words min-h-[3.5rem]">
                                                {startup.idea}
                                            </h3>

                                            <div className="flex flex-wrap gap-2 shrink-0 overflow-hidden">
                                                <span className="px-3 py-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-500 border border-zinc-100 dark:border-zinc-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                                    {startup.stage.replace(/_/g, " ")}
                                                </span>
                                                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-indigo-500/10 whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">
                                                    High Velocity
                                                </span>
                                            </div>

                                            <div className="pt-8 mt-auto border-t border-zinc-50 dark:border-zinc-800/50 flex items-center justify-between shrink-0">
                                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-400 tracking-widest line-clamp-1">
                                                    <Target className="w-4 h-4 shrink-0" />
                                                    <span className="truncate">Source: Protocol</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-green-500 tracking-widest shrink-0">
                                                    <Activity className="w-4 h-4 animate-pulse shrink-0" />
                                                    <span>Verified</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Subtle Background Accent */}
                                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[80px] rounded-full translate-x-1/2 translate-y-1/2 group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
                                    </Link>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-32 text-center bg-zinc-50 dark:bg-zinc-950/50 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl w-fit mx-auto shadow-sm mb-6">
                                    <Target className="w-12 h-12 text-zinc-200 dark:text-zinc-800" />
                                </div>
                                <h3 className="font-bold text-2xl mb-2">No matches found</h3>
                                <p className="text-zinc-500 text-lg">Adjust your search parameters to explore other possibilities.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

