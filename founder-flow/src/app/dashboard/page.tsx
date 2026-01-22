"use client";

import { useStartup } from "@/hooks/useStartup";
import {
    Rocket,
    Target,
    Users,
    Zap,
    CheckCircle2,
    Clock,
    ChevronRight,
    MessageSquare,
    AlertCircle,
    Activity
} from "lucide-react";
import { getPrimaryAction, AgentType } from "@/lib/orchestrator";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
    const { startup, memory, tasks, agentRuns, loading, userData } = useStartup();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!startup) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                    <Rocket className="w-12 h-12 text-zinc-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">No Startup Found</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-2">
                        It looks like you haven't started your journey yet. Create your first startup project to get started.
                    </p>
                </div>
                <button className="px-6 py-3 bg-black text-white dark:bg-zinc-50 dark:text-black rounded-xl font-bold hover:scale-105 transition-all">
                    Initialize Startup
                </button>
            </div>
        );
    }

    const primaryAction = getPrimaryAction(startup);
    const pendingTasks = tasks.filter(t => t.status === "pending");
    const activeRuns = agentRuns.filter(r => r.status === "running");

    const stats = [
        {
            name: "Current Stage",
            value: startup.stage.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            icon: Rocket,
            color: "text-blue-500"
        },
        {
            name: "Active Tasks",
            value: pendingTasks.length,
            icon: CheckCircle2,
            color: "text-green-500"
        },
        {
            name: "Agent Status",
            value: activeRuns.length > 0 ? "Agents Working" : "Ready",
            icon: Zap,
            color: activeRuns.length > 0 ? "text-yellow-500 animate-pulse" : "text-zinc-400"
        },
        {
            name: "Memory Entries",
            value: memory.length,
            icon: MessageSquare,
            color: "text-purple-500"
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Hello, {userData?.role === "founder" ? "Founder" : "User"}
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                        Your agents have de-risked <span className="text-zinc-900 dark:text-zinc-100 font-medium">14%</span> of your roadmap today.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800">
                    <Activity className="w-3 h-3 text-green-500" />
                    SYSTEM ONLINE
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                    {stat.name}
                                </p>
                                <p className="text-lg font-bold">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Primary Action Panel */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="relative overflow-hidden p-8 rounded-3xl bg-black text-white dark:bg-zinc-50 dark:text-black">
                        <div className="relative z-10 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-full text-xs font-bold tracking-wide uppercase">
                                <Zap className="w-3 h-3 fill-current" />
                                Recommended Action
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-4xl font-bold tracking-tight max-w-md">
                                    {primaryAction.label}
                                </h3>
                                <p className="opacity-70 text-lg max-w-sm">
                                    {primaryAction.description}
                                </p>
                            </div>
                            <button className="flex items-center gap-2 px-8 py-4 bg-white text-black dark:bg-black dark:text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-black/20">
                                Launch Agent
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-400/20 dark:bg-zinc-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    </section>

                    {/* Task Board Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold">Execution Board</h3>
                            <button className="text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                                View Full Roadmap
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingTasks.length > 0 ? (
                                pendingTasks.slice(0, 4).map((task) => (
                                    <div
                                        key={task.id}
                                        className="group p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${task.priority === "high" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                                                    task.priority === "medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                                        "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                                }`}>
                                                {task.priority}
                                            </span>
                                            <div className="w-5 h-5 rounded-md border-2 border-zinc-200 dark:border-zinc-800 group-hover:border-zinc-400 transition-colors" />
                                        </div>
                                        <h4 className="font-bold text-sm leading-tight mb-2">{task.title}</h4>
                                        <p className="text-xs text-zinc-500 line-clamp-2">{task.reason}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="md:col-span-2 p-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                                    <CheckCircle2 className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                                    <p className="text-sm text-zinc-400 font-medium italic">All tasks completed. Agents are drafting next steps.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Startup Memory Timeline */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-zinc-400" />
                        <h3 className="text-xl font-bold">Startup Memory</h3>
                    </div>

                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-zinc-200 before:via-zinc-200 before:to-transparent dark:before:from-zinc-800 dark:before:via-zinc-800">
                        {memory.length > 0 ? (
                            memory.slice(0, 5).map((entry, idx) => (
                                <div key={entry.id} className="relative flex items-start pl-8 group">
                                    <div className={`absolute left-0 mt-1.5 w-8 h-8 rounded-full border-4 border-[#fafafa] dark:border-[#050505] flex items-center justify-center transition-transform group-hover:scale-110 ${entry.source === "agent" ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-black shadow-lg shadow-black/10" : "bg-white dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700"
                                        }`}>
                                        {entry.type === "idea" && <Rocket className="w-3 h-3" />}
                                        {entry.type === "agent-output" && <Zap className="w-3 h-3 fill-current" />}
                                        {entry.type === "decision" && <Target className="w-3 h-3" />}
                                        {entry.type === "pivot" && <AlertCircle className="w-3 h-3" />}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                {entry.source === "agent" ? "Agent Log" : "Founder Entry"}
                                            </span>
                                            <span className="text-[10px] text-zinc-400">•</span>
                                            <span className="text-[10px] text-zinc-400">
                                                {entry.timestamp ? formatDistanceToNow(entry.timestamp.toDate(), { addSuffix: true }) : "just now"}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed text-zinc-800 dark:text-zinc-200">
                                            {entry.content}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                                <Clock className="w-10 h-10 mb-4" />
                                <p className="text-sm font-medium italic">Memory is empty...</p>
                            </div>
                        )}

                        {memory.length > 5 && (
                            <div className="pt-2">
                                <button className="text-xs font-bold text-zinc-400 hover:text-black dark:hover:text-white transition-colors pl-8">
                                    View Older Archives
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3 mb-3">
                            <Activity className="w-4 h-4 text-zinc-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Agent Activity</span>
                        </div>
                        {activeRuns.length > 0 ? (
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                <p className="text-sm font-medium">{activeRuns[0].agentType.replace("-", " ")} in progress...</p>
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-500 italic">No agents active at the moment.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
