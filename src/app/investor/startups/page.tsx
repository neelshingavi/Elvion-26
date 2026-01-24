"use client";

import { useState, useEffect } from "react";
import { getStartups, Startup } from "@/lib/startup-service";
import Link from "next/link";
import { Search, Filter, ArrowUpRight } from "lucide-react";

export default function DiscoverStartupsPage() {
    const [startups, setStartups] = useState<Startup[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [stageFilter, setStageFilter] = useState<string>("all");

    useEffect(() => {
        const fetchStartups = async () => {
            setLoading(true);
            try {
                // In a real app, we'd debounce and pass search term to backend
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
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Discover Startups
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                    Find the next unicorn before anyone else.
                </p>
            </header>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search by keywords, industry, or problem statement..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <select
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none transition-all cursor-pointer"
                    >
                        <option value="all">All Stages</option>
                        <option value="idea_submitted">Idea Phase</option>
                        <option value="idea_validated">Validated</option>
                        <option value="execution_active">Execution Active</option>
                    </select>
                </div>
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStartups.length > 0 ? (
                        filteredStartups.map((startup) => (
                            <Link
                                key={startup.startupId}
                                href={`/investor/startups/${startup.startupId}`}
                                className="group flex flex-col p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all hover:shadow-lg h-full"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center font-bold text-xl">
                                        {startup.idea.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="p-2 -mr-2 -mt-2 rounded-full group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 transition-colors">
                                        <ArrowUpRight className="w-5 h-5 text-zinc-300 group-hover:text-black dark:group-hover:text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-3">
                                    <h3 className="font-bold text-lg leading-tight line-clamp-2">
                                        {startup.idea}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold uppercase text-zinc-500">
                                            {startup.stage.replace(/_/g, " ")}
                                        </span>
                                        {/* Simulating generic tags for now */}
                                        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold uppercase">
                                            AI
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <h3 className="font-bold text-lg mb-2">No matches found</h3>
                            <p className="text-zinc-500">Try adjusting your filters or search terms.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
