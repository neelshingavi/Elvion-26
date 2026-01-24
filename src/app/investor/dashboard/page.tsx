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
    Info,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20 max-w-7xl mx-auto">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-bold uppercase tracking-wider rounded">Portfolio OS</div>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Portfolio Intelligence
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed">
                        Continuous monitoring of {portfolio.length} active technology assets.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === "grid" ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-50" : "text-zinc-400 hover:text-zinc-600"}`}
                    >
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4" />
                            Grid
                        </div>
                    </button>
                    <button
                        onClick={() => setViewMode("table")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === "table" ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-50" : "text-zinc-400 hover:text-zinc-600"}`}
                    >
                        <div className="flex items-center gap-2">
                            <List className="w-4 h-4" />
                            Table
                        </div>
                    </button>
                </div>
            </header>

            {/* Aggregated KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    label="Health Score"
                    value={`${summary?.healthScore}/100`}
                    trend="+4% vs last mo"
                    icon={Activity}
                    color="indigo"
                />
                <MetricCard
                    label="Execution Risk"
                    customContent={
                        <div className="flex items-center gap-1.5 h-2 w-full mt-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: '70%' }} />
                            <div className="h-full bg-amber-500" style={{ width: '20%' }} />
                            <div className="h-full bg-red-500" style={{ width: '10%' }} />
                        </div>
                    }
                    trend="Low Probability"
                    icon={Shield}
                    color="green"
                />
                <MetricCard
                    label="Stage Distribution"
                    value="100% Pre-Seed"
                    trend="In Milestone Phase"
                    icon={PieChart}
                />
                <div className="p-8 rounded-3xl bg-zinc-900 border border-white/5 shadow-xl relative overflow-hidden group min-w-0">
                    <div className="relative z-10 flex flex-col h-full min-w-0">
                        <div className="flex items-center gap-2 text-zinc-500 mb-6 shrink-0">
                            <Activity className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest line-clamp-1">Pulse Monitor</span>
                        </div>
                        <div className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors tracking-tight line-clamp-2 min-w-0 shrink-0">Active Signal Intelligence</div>
                        <div className="mt-auto pt-6 flex items-center gap-2 text-[10px] text-green-400 font-bold uppercase tracking-wider shrink-0">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            Live Telemetry
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-2xl font-bold">Active Assets</h2>
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by name or stage..."
                                    className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                />
                            </div>
                            <button className="p-2.5 text-zinc-500 hover:text-black dark:hover:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-all">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {viewMode === "grid" ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {portfolio.map((item) => (
                                    <ProjectCard key={item.projectId} item={item} />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm"
                            >
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Asset</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Stage</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Velocity</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Risk Profile</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Last Sync</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {portfolio.map((item) => (
                                            <tr key={item.projectId} className="group hover:bg-zinc-50 dark:hover:bg-zinc-950/30 transition-colors">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold">
                                                            {item.project.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-zinc-900 dark:text-zinc-50">{item.project.name}</div>
                                                            <div className="text-xs text-zinc-500">{item.project.industry}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold uppercase text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                                                        {item.project.stage}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500 font-bold text-sm">
                                                        <TrendingUp className="w-3.5 h-3.5" />
                                                        High
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                                        <Shield className="w-3.5 h-3.5" />
                                                        Low
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-zinc-500">2d ago</td>
                                                <td className="px-6 py-5 text-right">
                                                    <Link href={`/investor/project/${item.projectId}`} className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 group-hover:text-indigo-500 transition-colors">
                                                        Deep Dive <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
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

                <aside className="space-y-8 min-w-0">
                    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm space-y-8 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 shrink-0">
                            <Activity className="w-5 h-5" />
                            <h3 className="text-lg font-bold tracking-tight">Signal Flow</h3>
                        </div>
                        <div className="space-y-4">
                            {insights.map((insight, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 group hover:border-indigo-500/30 transition-all min-w-0 overflow-hidden">
                                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors line-clamp-3 break-words">
                                        {insight}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-8 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                            <AlertCircle className="w-5 h-5" />
                            <h3 className="text-lg font-bold">Threshold Alerts</h3>
                        </div>
                        <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-amber-100 dark:border-amber-900/30 shadow-sm">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1">Execution Drift</div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Project X is showing a 15% reduction in task completion speed vs benchmark.</p>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

// Sub-components for cleaner structure and 8px alignment
function MetricCard({ label, value, trend, icon: Icon, color = "zinc", customContent }: any) {
    const colors: any = {
        indigo: "text-indigo-600 dark:text-indigo-400",
        green: "text-green-600 dark:text-green-500",
        zinc: "text-zinc-400"
    };

    return (
        <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col min-w-0 overflow-hidden">
            <div className="flex items-center gap-3 mb-8 text-zinc-400 shrink-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] line-clamp-1">{label}</span>
            </div>
            <div className="flex-1 min-w-0">
                {customContent || (
                    <div className={cn("text-4xl font-bold tracking-tight line-clamp-1 truncate", colors[color])}>
                        {value}
                    </div>
                )}
            </div>
            <div className="mt-8 pt-6 border-t border-zinc-50 dark:border-zinc-800/50 flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-widest shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0" />
                <span className="line-clamp-1">{trend}</span>
            </div>
        </div>
    );
}

function ProjectCard({ item }: { item: any }) {
    return (
        <Link
            href={`/investor/project/${item.projectId}`}
            className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 hover:border-indigo-500/50 transition-all hover:shadow-xl hover:-translate-y-1 duration-300 overflow-hidden flex flex-col min-w-0"
        >
            <div className="flex justify-between items-start mb-10 shrink-0 min-w-0 gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight line-clamp-1">
                        {item.project.name}
                    </h3>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">{item.project.industry}</span>
                        <span className="text-[10px] text-zinc-300 font-bold shrink-0">•</span>
                        <span className="text-[10px] text-indigo-500 uppercase tracking-widest font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">{item.project.stage}</span>
                    </div>
                </div>
                <div className="p-2 rounded-full border border-zinc-100 dark:border-zinc-800 group-hover:border-indigo-500/30 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-all">
                    <ArrowUpRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-500 transition-colors" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8 pt-6 border-t border-zinc-50 dark:border-zinc-800/50">
                <div className="space-y-1">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Velocity</div>
                    <div className="text-sm font-bold text-green-600 dark:text-green-500">High</div>
                </div>
                <div className="space-y-1">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Signals</div>
                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Pulsing</div>
                </div>
                <div className="space-y-1">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Risk</div>
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-500">Minimal</div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-zinc-50 dark:border-zinc-800/50">
                <div className="flex -space-x-2">
                    {[1, 2].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 shadow-sm" />
                    ))}
                    <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-900 border-2 border-white dark:border-zinc-900 shadow-sm flex items-center justify-center text-[10px] font-bold text-zinc-400">
                        +3
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 uppercase tracking-wider">
                    View Project
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
    );
}
