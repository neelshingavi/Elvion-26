"use client";

import { useEffect, useState } from "react";
import { Users, Rocket, Activity } from "lucide-react";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        founders: 0,
        others: 0,
        startups: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/admin/stats");
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error?.message || "Failed to load stats");
                setStats({
                    founders: data.founders || 0,
                    others: data.others || 0,
                    startups: data.startups || 0
                });
            } catch (error) {
                console.error("Admin stats error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        { title: "Total Founders", value: stats.founders, icon: Users, color: "text-blue-500" },
        { title: "Total Startups", value: stats.startups, icon: Rocket, color: "text-purple-500" },
        { title: "Other Users", value: stats.others, icon: Activity, color: "text-zinc-500" },
    ];

    if (loading) return <div className="text-zinc-500">Loading metrics...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header>
                <h1 className="text-3xl font-bold text-white">System Status</h1>
                <p className="text-zinc-400">Real-time platform telemetry.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <div key={card.title} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-zinc-400">{card.title}</h3>
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                        <p className="text-3xl font-bold text-white">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Placeholder for charts or logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl h-64 flex items-center justify-center text-zinc-500 border-dashed">
                    Activity Chart Placeholder
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl h-64 flex items-center justify-center text-zinc-500 border-dashed">
                    System Logs Placeholder
                </div>
            </div>
        </div>
    );
}
