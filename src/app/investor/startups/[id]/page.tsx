"use client";

import { useEffect, useState, use } from "react";
import { getStartupDeepDive } from "@/lib/startup-service";
import { createDeal } from "@/lib/investor-service";
import { useAuth } from "@/context/AuthContext";
import {
    ArrowLeft,
    Rocket,
    Zap,
    MessageSquare,
    Clock,
    Target,
    Activity,
    ShieldAlert,
    CheckCircle2,
    ArrowUpRight,
    TrendingUp,
    Shield
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function StartupDeepDivePage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const { id } = unwrappedParams;
    const { user } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tracking, setTracking] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const deepDiveData = await getStartupDeepDive(id);
                setData(deepDiveData);
            } catch (error) {
                console.error("Failed to load startup:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleTrackStartup = async () => {
        if (!user || !data) return;
        setTracking(true);
        try {
            await createDeal(user.uid, data.startupId, "Started tracking from Deep Dive");
            router.push("/investor/dealflow");
        } catch (error) {
            console.error("Failed to track deal:", error);
            setTracking(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Decrypting Logic...</span>
            </div>
        );
    }

    if (!data) return <div>Startup not found</div>;

    const { memory, tasks, agentRuns } = data;
    const completedTasks = tasks.filter((t: any) => t.status === "done").length;
    const totalTasks = tasks.length || 1;
    const executionScore = Math.round((completedTasks / totalTasks) * 100);

    return (
        <div className="space-y-12 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
            {/* Context Navigation */}
            <div className="flex items-center justify-between">
                <Link
                    href="/investor/startups"
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-indigo-500 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Discovery
                </Link>
                <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase tracking-widest">
                    <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Execution Stream
                </div>
            </div>

            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-12 border-b border-zinc-100 dark:border-zinc-800/50 pb-12">
                <div className="space-y-6 max-w-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-2xl shadow-xl">
                            {data.idea.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-bold tracking-tight">{data.idea}</h1>
                                <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-bold uppercase tracking-widest rounded border border-indigo-500/20">
                                    {data.stage.replace(/_/g, " ")}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Created {formatDistanceToNow(data.createdAt.toDate())} ago</span>
                                <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> High Conviction Alpha</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium italic">
                        "Automated analysis of the problem market fit reveals strong signals in execution speed and agent-led validation."
                    </p>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={handleTrackStartup}
                        disabled={tracking}
                        className="flex-1 md:flex-none px-8 py-4 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-black rounded-2xl font-bold hover:shadow-2xl hover:-translate-y-0.5 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {tracking ? "Syncing..." : "Add to Portfolio"}
                        <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <MessageSquare className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>
            </div>

            {/* Metrics Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricBox label="Execution KPI" value={`${executionScore}%`} trend="Target Attainment" icon={TrendingUp} color="green" />
                <MetricBox label="Agent Velocity" value={`${agentRuns.length} Runs`} trend="Continuous Cycle" icon={Zap} color="indigo" />
                <MetricBox label="Tasks Verified" value={completedTasks} trend={`Of ${totalTasks} total`} icon={CheckCircle2} />
                <MetricBox label="Risk Posture" value="Minimal" trend="Direct Evidence" icon={Shield} color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Execution Stream (Timeline) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-2xl font-bold tracking-tight">Intelligence Stream</h3>
                        <div className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Audited by AI</div>
                    </div>

                    <div className="relative space-y-12 pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-zinc-100 dark:before:bg-zinc-800">
                        {memory.slice(0, 10).map((entry: any, i: number) => (
                            <div key={entry.id} className="relative group">
                                <div className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-4 border-white dark:border-zinc-950 transition-all shadow-sm ${entry.source === "agent" ? "bg-indigo-500 scale-125" : "bg-zinc-300"
                                    }`} />
                                <div className="space-y-2 bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800/50 shadow-sm transition-all hover:shadow-md hover:border-indigo-500/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                                            <span className={entry.source === "agent" ? "text-indigo-500" : ""}>{entry.type}</span>
                                            <span>•</span>
                                            <span>{formatDistanceToNow(entry.timestamp.toDate())} ago</span>
                                        </div>
                                    </div>
                                    <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                                        {entry.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Context */}
                <div className="space-y-12">
                    <section className="p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 space-y-8">
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg tracking-tight">Venture Team</h3>
                            <p className="text-xs text-zinc-500 font-medium">Core leadership and agent oversight.</p>
                        </div>
                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center transition-transform group-hover:scale-105">
                                <Activity className="w-6 h-6 text-zinc-400" />
                            </div>
                            <div>
                                <p className="font-bold text-sm tracking-tight group-hover:text-indigo-500 transition-colors text-zinc-900 dark:text-zinc-50">Lead Founder</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Verified Identity</p>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800/50">
                            <button className="w-full py-3 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                View Full Credentials
                            </button>
                        </div>
                    </section>

                    <section className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                                <Zap className="w-4 h-4" /> System Insight
                            </div>
                            <p className="text-sm font-medium leading-relaxed italic opacity-80">
                                "Market validation agents have reported 3 consecutive positive cycles in the fintech sandbox. Confidence is peaking."
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-3xl" />
                    </section>
                </div>
            </div>
        </div>
    );
}

function MetricBox({ label, value, trend, icon: Icon, color = "zinc" }: any) {
    const colors: any = {
        indigo: "text-indigo-500",
        green: "text-green-500",
        blue: "text-blue-500",
        zinc: "text-zinc-400"
    };

    return (
        <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:shadow-lg transition-all hover:border-indigo-500/20">
            <div className="flex items-center gap-2 mb-6 text-zinc-400">
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <div className={`text-3xl font-bold tracking-tight mb-1 ${colors[color]}`}>{value}</div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{trend}</div>
        </div>
    );
}

