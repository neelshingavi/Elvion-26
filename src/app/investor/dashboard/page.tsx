"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    getInvestorPortfolioList,
    getPortfolioSummary,
    getPortfolioInsights
} from "@/lib/investor-service";
import {
    Activity,
    TrendingUp,
    Shield,
    PieChart,
    ChevronRight,
    ArrowUpRight,
    Search,
    Filter,
    LayoutGrid,
    List,
    AlertCircle,
    Info
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function InvestorPortfolioDashboard() {
    const { user } = useAuth();
    const [portfolio, setPortfolio] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [insights, setInsights] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

    useEffect(() => {
        const loadPortfolioData = async () => {
            if (!user) return;
            try {
                const [list, stats, hints] = await Promise.all([
                    getInvestorPortfolioList(user.uid),
                    getPortfolioSummary(user.uid),
                    getPortfolioInsights(user.uid)
                ]);
                setPortfolio(list);
                setSummary(stats);
                setInsights(hints);
            } catch (error) {
                console.error("Failed to load portfolio:", error);
            } finally {
                setLoading(false);
            }
        };
        loadPortfolioData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* 3. Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Portfolio Intelligence
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Unified real-time view of your {portfolio.length} active investments.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-zinc-800 shadow-sm" : "text-zinc-400"}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("table")}
                        className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-white dark:bg-zinc-800 shadow-sm" : "text-zinc-400"}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* 4. Aggregated Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-zinc-400">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Health Score</span>
                    </div>
                    <div className="text-3xl font-bold text-indigo-500">{summary?.healthScore}/100</div>
                    <p className="text-xs text-zinc-500 mt-2">↑ 4% from last month</p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-zinc-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Risk Dist.</span>
                    </div>
                    <div className="flex items-center gap-1.5 h-6">
                        <div className="h-full bg-green-500 rounded-sm" style={{ width: '70%' }} />
                        <div className="h-full bg-amber-500 rounded-sm" style={{ width: '20%' }} />
                        <div className="h-full bg-red-500 rounded-sm" style={{ width: '10%' }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-2 uppercase font-bold">
                        <span>Low / Med / High</span>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-zinc-400">
                        <PieChart className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Stage Mix</span>
                    </div>
                    <div className="text-xl font-bold">100% Pre-Seed</div>
                    <p className="text-xs text-zinc-500 mt-2">Concentration risk detected</p>
                </div>

                <div className="p-6 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                    <div className="flex items-center gap-3 mb-4 text-indigo-100">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">AI Status</span>
                    </div>
                    <div className="text-xl font-bold">Continuous Monitoring</div>
                    <p className="text-xs text-indigo-200 mt-2">All signals verified</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* 5. Main Startup Listing */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Active Assets</h2>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Filter startups..."
                                    className="pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <button className="p-2 text-zinc-500 hover:text-black dark:hover:text-white">
                                <Filter className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {viewMode === "grid" ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {portfolio.map((item) => (
                                    <Link
                                        key={item.projectId}
                                        href={`/investor/project/${item.projectId}`}
                                        className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 hover:border-indigo-500/50 transition-all hover:shadow-xl overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-bold group-hover:text-indigo-500 transition-colors">
                                                    {item.project.name}
                                                </h3>
                                                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                                                    {item.project.industry}
                                                </p>
                                            </div>
                                            <ArrowUpRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-500 transition-colors" />
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                            <div className="space-y-1">
                                                <div className="text-[10px] text-zinc-400 uppercase font-bold">Velocity</div>
                                                <div className="text-sm font-bold text-green-500">High</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[10px] text-zinc-400 uppercase font-bold">Trend</div>
                                                <div className="text-sm font-bold text-indigo-500">Flat</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[10px] text-zinc-400 uppercase font-bold">Risk</div>
                                                <div className="text-sm font-bold text-blue-500">Low</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                            <div className="flex -space-x-2">
                                                {[1, 2].map(i => (
                                                    <div key={i} className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900" />
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-zinc-400 font-medium">
                                                Update 2d ago
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden"
                            >
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-950 font-bold border-b border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            <th className="px-6 py-4">Startup</th>
                                            <th className="px-6 py-4">Stage</th>
                                            <th className="px-6 py-4">Velocity</th>
                                            <th className="px-6 py-4">Risk</th>
                                            <th className="px-6 py-4">Last Update</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {portfolio.map((item) => (
                                            <tr key={item.projectId} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold">{item.project.name}</div>
                                                    <div className="text-[10px] text-zinc-500 capitalize">{item.project.industry}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold uppercase text-zinc-500">
                                                        {item.project.stage}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-green-500 font-bold">High</td>
                                                <td className="px-6 py-4 text-indigo-500 font-bold">Low</td>
                                                <td className="px-6 py-4 text-zinc-500">2d ago</td>
                                                <td className="px-6 py-4">
                                                    <Link href={`/investor/project/${item.projectId}`} className="p-2 text-zinc-300 hover:text-indigo-500">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 9. AI Insights & Note Section */}
                <aside className="space-y-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                        <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">
                            <Activity className="w-5 h-5" />
                            <h3 className="font-bold">Portfolio Insights</h3>
                        </div>
                        <div className="space-y-4">
                            {insights.map((insight, i) => (
                                <div key={i} className="flex gap-3">
                                    <InfoIcon className="w-4 h-4 text-indigo-400 flex-none mt-0.5" />
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                                        "{insight}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            <h3 className="font-bold">Execution Alerts</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                <div className="text-[10px] font-bold uppercase text-red-600 mb-1">Threshold Breach</div>
                                <p className="text-xs text-red-900 dark:text-red-200">Execution velocity drop detected in Project X.</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function InfoIcon({ className }: { className?: string }) {
    return <Info className={className} />;
}
