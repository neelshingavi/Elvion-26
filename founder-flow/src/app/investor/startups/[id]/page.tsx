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
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!data) return <div>Startup not found</div>;

    const { memory, tasks, agentRuns } = data;

    // Calculate simulated "Execution Score"
    const completedTasks = tasks.filter((t: any) => t.status === "done").length;
    const totalTasks = tasks.length || 1;
    const executionScore = Math.round((completedTasks / totalTasks) * 100);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="space-y-4">
                <Link
                    href="/investor/startups"
                    className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Discovery
                </Link>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-4 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-500">
                            {data.stage.replace(/_/g, " ")}
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">{data.idea}</h1>
                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Created {formatDistanceToNow(data.createdAt.toDate(), { addSuffix: true })}
                            </span>
                            <span className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                {tasks.length} Roadmap Items
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleTrackStartup}
                            disabled={tracking}
                            className="px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
                        >
                            {tracking ? "Adding..." : "Track Deal"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-2 text-zinc-400">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Execution Score</span>
                    </div>
                    <div className="text-3xl font-bold">{executionScore}/100</div>
                </div>
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-2 text-zinc-400">
                        <Zap className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Agent Velocity</span>
                    </div>
                    <div className="text-3xl font-bold">{agentRuns.length} Runs</div>
                </div>
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-2 text-zinc-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Tasks Done</span>
                    </div>
                    <div className="text-3xl font-bold">{completedTasks}</div>
                </div>
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-2 text-zinc-400">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Risk Level</span>
                    </div>
                    <div className="text-3xl font-bold text-green-500">Low</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold">Execution Stream</h3>
                    <div className="relative space-y-8 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800">
                        {memory.slice(0, 10).map((entry: any) => (
                            <div key={entry.id} className="relative pl-6">
                                <div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 ${entry.source === "agent" ? "bg-black dark:bg-white" : "bg-zinc-400"
                                    }`} />
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-400">
                                        <span>{entry.type}</span>
                                        <span>•</span>
                                        <span>{formatDistanceToNow(entry.timestamp.toDate())} ago</span>
                                    </div>
                                    <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                                        {entry.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 space-y-4">
                        <h3 className="font-bold">Team</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                            <div>
                                <p className="font-bold text-sm">Founder</p>
                                <p className="text-xs text-zinc-500">View Profile</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
