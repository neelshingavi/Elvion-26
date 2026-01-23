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
    Activity,
    Brain,
    Sparkles,
    LayoutDashboard,
    X,
    FileText
} from "lucide-react";
import { getPrimaryAction, AgentType } from "@/lib/orchestrator";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function DashboardPage() {
    const { startup, memory, tasks, agentRuns, loading, userData } = useStartup();
    const [selectedTask, setSelectedTask] = useState<any>(null);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!startup) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-700">
                <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-[2.5rem] shadow-inner">
                    <Rocket className="w-12 h-12 text-zinc-300" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight">Ready to Launch?</h2>
                    <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                        Your startup journey begins with a single idea. Let's build something world-changing.
                    </p>
                </div>
                <button className="px-8 py-4 bg-black text-white dark:bg-zinc-50 dark:text-black rounded-[1.5rem] font-black text-sm hover:scale-105 transition-all">
                    Initialize Journey
                </button>
            </div>
        );
    }

    const pendingTasks = tasks.filter(t => t.status === "pending");
    const completedTasks = tasks.filter(t => t.status === "done");
    const primaryAction = getPrimaryAction(startup);
    const activeRuns = agentRuns.filter(r => r.status === "running");

    const stats = [
        {
            name: "Venture Stage",
            value: startup.stage.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            icon: Target,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            name: "Active Tasks",
            value: pendingTasks.length,
            icon: CheckCircle2,
            color: "text-green-500",
            bg: "bg-green-500/10"
        },
        {
            name: "Pulse Rate",
            value: activeRuns.length > 0 ? "High" : "Optimal",
            icon: Zap,
            color: activeRuns.length > 0 ? "text-yellow-500" : "text-zinc-400",
            bg: activeRuns.length > 0 ? "bg-yellow-500/10" : "bg-zinc-500/10"
        },
        {
            name: "Market Hub",
            value: memory.length,
            icon: Brain,
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
    ];

    return (
        <div className="space-y-8 p-2 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Tactical Overview
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
                        {startup?.name || "Founder Hub"}
                    </h1>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className="relative">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                    </div>
                    <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">Live Pulse</span>
                </div>
            </header>

            {/* Stats Grid - Compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">
                                    {stat.name}
                                </p>
                                <p className="text-lg font-black tracking-tight">{stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Actions & Tasks */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Primary Hero - Compact */}
                    <section className="relative overflow-hidden group">
                        <div className="relative z-10 p-8 rounded-[2rem] bg-zinc-950 text-white dark:bg-zinc-50 dark:text-black shadow-2xl overflow-hidden">
                            <div className="relative z-20 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-full text-[9px] font-black tracking-[0.2em] uppercase text-indigo-400">
                                    <Sparkles className="w-3 h-3" />
                                    AI Recommendation
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black tracking-tighter leading-none">
                                        {primaryAction.label}
                                    </h3>
                                    <p className="opacity-60 text-sm font-medium max-w-md">
                                        {primaryAction.description}
                                    </p>
                                </div>
                                <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-black text-xs hover:scale-105 transition-all shadow-xl shadow-indigo-600/30">
                                    Initialize Execution
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                        </div>
                    </section>

                    {/* Task Board Section - Compact */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-500" />
                                <h3 className="text-sm font-black tracking-widest uppercase">Squad Sprint</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[...pendingTasks.slice(0, 2), ...completedTasks.slice(0, 2)].map((task) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={() => task.status === "done" && setSelectedTask(task)}
                                    className={cn(
                                        "group p-4 rounded-2xl bg-white dark:bg-zinc-900 border transition-all cursor-pointer",
                                        task.status === "done" ? "border-green-500/20 bg-green-50/5" : "border-zinc-100 dark:border-zinc-800"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {task.status === "done" ? (
                                                <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center shadow-sm">
                                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                                </div>
                                            ) : (
                                                <div className="w-3.5 h-3.5 rounded border-2 border-zinc-100 dark:border-zinc-800" />
                                            )}
                                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">
                                                {task.status === "done" ? "Outcome Extraction Ready" : task.priority + " Priority"}
                                            </span>
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-xs tracking-tight mb-1 group-hover:text-indigo-500 transition-colors uppercase">{task.title}</h4>
                                    <p className="text-[10px] text-zinc-500 line-clamp-1 italic">"{task.instruction || task.reason}"</p>
                                    {task.status === "done" && (
                                        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Explore Intelligence →</span>
                                            <FileText className="w-3 h-3 text-indigo-500" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: Pulse */}
                <aside className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-sm font-black tracking-widest uppercase">System History</h3>
                        </div>
                    </div>

                    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500/20 before:via-zinc-100 dark:before:via-zinc-800 before:to-transparent">
                        {memory.slice(0, 4).map((entry) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="relative flex items-start pl-10 group"
                            >
                                <div className={cn(
                                    "absolute left-0 mt-0.5 w-8 h-8 rounded-xl border-4 border-[#fafafa] dark:border-[#050505] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                                    entry.source === "agent" ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-black" : "bg-white dark:bg-zinc-800 text-zinc-400"
                                )}>
                                    {entry.type === "idea" && <Rocket className="w-3.5 h-3.5" />}
                                    {entry.type === "agent-output" && <Zap className="w-3.5 h-3.5" />}
                                    {entry.type === "decision" && <Target className="w-3.5 h-3.5" />}
                                    {entry.type === "pivot" && <AlertCircle className="w-3.5 h-3.5" />}
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">
                                        {formatDistanceToNow(entry.timestamp.toDate(), { addSuffix: true })}
                                    </span>
                                    <p className="text-[11px] font-bold leading-tight text-zinc-800 dark:text-zinc-200 line-clamp-2 uppercase tracking-tighter">
                                        {entry.content}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </aside>
            </div>

            {/* Global Result Viewer */}
            <AnimatePresence>
                {selectedTask && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedTask(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="relative w-full max-w-xl max-h-[80vh] bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
                                <div>
                                    <h2 className="text-sm font-black tracking-tighter uppercase">{selectedTask.title}</h2>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Atomic Intel Extraction</p>
                                </div>
                                <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto max-h-[60vh] prose prose-xs dark:prose-invert prose-indigo prose-p:text-xs">
                                <ReactMarkdown>{selectedTask.aiResponse || "_No extraction available._"}</ReactMarkdown>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
