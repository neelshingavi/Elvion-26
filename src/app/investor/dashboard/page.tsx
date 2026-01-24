"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getInvestorDashboardStats } from "@/lib/investor-service";
import { getStartups, Startup } from "@/lib/startup-service";
import {
    TrendingUp,
    PieChart,
    Zap,
    ChevronRight,
    ArrowUpRight
} from "lucide-react";
import Link from "next/link";

export default function InvestorDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [trendingStartups, setTrendingStartups] = useState<Startup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            try {
                const [dashboardStats, startups] = await Promise.all([
                    getInvestorDashboardStats(user.uid),
                    getStartups() // Fetch all for now as "trending"
                ]);
                setStats(dashboardStats);
                setTrendingStartups(startups.slice(0, 3)); // Take top 3
            } catch (error) {
                console.error("Failed to load dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-6 h-6 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Overview
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                    Welcome back. You have <span className="font-medium text-black dark:text-white">{stats?.activeDeals || 0} active deals</span> requiring attention.
                </p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <PieChart className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Portfolio</span>
                    </div>
                    <div>
                        <span className="text-3xl font-bold">{stats?.portfolioCount || 0}</span>
                        <span className="text-sm text-zinc-500 ml-2">startups</span>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Active Deals</span>
                    </div>
                    <div>
                        <span className="text-3xl font-bold">{stats?.activeDeals || 0}</span>
                        <span className="text-sm text-zinc-500 ml-2">in pipeline</span>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Opportunities</span>
                    </div>
                    <div>
                        <span className="text-3xl font-bold">{stats?.newOpportunities || 0}</span>
                        <span className="text-sm text-zinc-500 ml-2">new matches</span>
                    </div>
                </div>
            </div>

            {/* Trending Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Trending Startups</h2>
                    <Link href="/investor/startups" className="text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors">
                        View All <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {trendingStartups.length > 0 ? (
                        trendingStartups.map((startup) => (
                            <Link
                                key={startup.startupId}
                                href={`/investor/project/${startup.startupId}`}
                                className="group p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all hover:shadow-lg"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-lg">
                                        {startup.idea.charAt(0).toUpperCase()}
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="font-bold text-lg mb-2 line-clamp-1">
                                    {startup.idea.split(" ").slice(0, 3).join(" ")}...
                                </h3>
                                <p className="text-sm text-zinc-500 line-clamp-2 mb-4 h-10">
                                    {startup.idea}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold uppercase text-zinc-500">
                                        {startup.stage.replace(/_/g, " ")}
                                    </span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-3 py-12 text-center text-zinc-400 italic">
                            No startups found.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
