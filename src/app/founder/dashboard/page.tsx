"use client";

import { useStartup } from "@/hooks/useStartup";
import {
    Rocket,
    Target,
    Zap,
    CheckCircle2,
    Clock,
    ChevronRight,
    Activity,
    Brain,
    Sparkles,
    LayoutDashboard,
    X,
    FileText,
    Bot,
    Play,
    AlertTriangle,
    ArrowLeftRight,
    Bell,
    Check,
    X as CloseX,
    Users,
    MessageSquare,
    ArrowUpRight
} from "lucide-react";
import { getPrimaryAction } from "@/lib/orchestrator";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { createAgentRun } from "@/lib/startup-service";
import { getConnectionRequests, acceptConnectionRequest, rejectConnectionRequest } from "@/lib/connection-service";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
    const { user: currentUser } = useAuth();
    const { startup, memory, tasks, agentRuns, loading } = useStartup();
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!currentUser) return;
        const unsub = getConnectionRequests(currentUser.uid, (reqs) => {
            setNotifications(reqs);
        });
        return () => unsub();
    }, [currentUser]);

    const handleAccept = async (req: any) => {
        await acceptConnectionRequest(req.id, req.fromId, req.toId);
    };

    const handleReject = async (req: any) => {
        await rejectConnectionRequest(req.id);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Loading Intelligence...</span>
            </div>
        );
    }

    if (!startup) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-1000">
                <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <Rocket className="w-16 h-16 text-zinc-300 dark:text-zinc-700" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tight">Initiate Venture</h2>
                    <p className="text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
                        Your strategic command center is ready. Initialize your first project to begin execution.
                    </p>
                </div>
                <button
                    onClick={() => router.push("/projects")}
                    className="px-10 py-4 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-black rounded-2xl font-bold text-sm tracking-tight hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                    Project Registry
                </button>
            </div>
        );
    }

    const pendingTasks = tasks.filter(t => t.status === "pending");
    const completedTasks = tasks.filter(t => t.status === "done");
    const primaryAction = getPrimaryAction(startup);
    const activeRuns = agentRuns.filter(r => r.status === "running");

    const manualTriggerAgent = async (agentType: string) => {
        if (!startup) return;
        try {
            await createAgentRun(startup.startupId, agentType);
        } catch (e) {
            console.error("Agent failed:", e);
        }
    };

    const stats = [
        {
            name: "Venture Stage",
            value: startup.stage.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            icon: Target,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-500/10"
        },
        {
            name: "Execution Velocity",
            value: `${Math.round((completedTasks.length / (tasks.length || 1)) * 100)}%`,
            icon: Rocket,
            color: "text-green-600 dark:text-green-500",
            bg: "bg-green-500/10"
        },
        {
            name: "Active Streams",
            value: `${activeRuns.length}`,
            icon: Zap,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-500/10"
        },
        {
            name: "Strategic IQ",
            value: "85/100",
            icon: Brain,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-500/10"
        },
    ];

    const agents = [
        { id: "planner", name: "Strategic Planner", description: "Roadmaps & Milestones", icon: Target },
        { id: "researcher", name: "Market Researcher", description: "Competitor Analysis", icon: Activity },
        { id: "drafter", name: "Content Drafter", description: "Pitch Decks & Memos", icon: FileText },
    ];

    return (
        <div className="space-y-12 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
            {/* Header Section */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 border-b border-zinc-100 dark:border-zinc-800/50 pb-12">
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-bold uppercase tracking-wider rounded">Executive OS</div>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            {startup.name}
                        </h1>
                        <button
                            onClick={() => router.push("/projects")}
                            className="p-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all text-zinc-400 hover:text-indigo-500 shadow-sm"
                            title="Switch Context"
                        >
                            <ArrowLeftRight className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm w-fit">
                        <div className="relative">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                        </div>
                        <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
                            {activeRuns.length > 0 ? `${activeRuns.length} Intel Streams Running` : "Decision Cycle IDLE"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-4 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-zinc-400 hover:text-indigo-500 transition-all relative"
                        >
                            <Bell className="w-5 h-5 shadow-inner" />
                            {notifications.length > 0 && (
                                <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-indigo-500 text-[8px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-950">
                                    {notifications.length}
                                </div>
                            )}
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] shadow-2xl z-50 overflow-hidden"
                                    >
                                        <div className="p-6 border-b border-zinc-50 dark:border-zinc-900 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Signal Intelligence</h3>
                                            <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><X className="w-3 h-3 text-zinc-400" /></button>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
                                            {notifications.length > 0 ? notifications.map((req) => (
                                                <div key={req.id} className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 transition-all hover:shadow-lg space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                                            <Users className="w-5 h-5 text-indigo-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Connection Link</p>
                                                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate">Protocol: {req.fromId.slice(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button onClick={() => handleAccept(req)} className="py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform">Connect</button>
                                                        <button onClick={() => handleReject(req)} className="py-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-red-500 transition-colors">Dismiss</button>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="py-12 text-center text-zinc-300 italic">No signals detected.</div>
                                            )}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => router.push("/founder/chat")}
                        className="p-4 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-zinc-400 hover:text-indigo-500 transition-all"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Aggregated Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-lg transition-all min-w-0"
                    >
                        <div className="flex flex-col gap-6 min-w-0">
                            <div className={cn("w-14 h-14 rounded-2xl transition-transform group-hover:scale-110 flex items-center justify-center shadow-inner shrink-0", stat.bg, stat.color)}>
                                <stat.icon className="w-7 h-7" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 line-clamp-1">{stat.name}</p>
                                <p className="text-2xl font-bold tracking-tight line-clamp-1 truncate">{stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                {/* Main Action Channel */}
                <div className="xl:col-span-8 space-y-12">

                    {/* Primary Strategic Focus */}
                    <div className="p-12 rounded-[3rem] bg-zinc-900 text-white shadow-2xl relative overflow-hidden group min-w-0">
                        <div className="relative z-10 space-y-8 min-w-0">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[9px] font-bold tracking-[0.3em] uppercase text-indigo-400 shrink-0">
                                <Sparkles className="w-3.5 h-3.5" />
                                Optimal Next Phase
                            </div>
                            <div className="space-y-4 min-w-0">
                                <h3 className="text-4xl font-bold tracking-tight line-clamp-2 break-words">
                                    {primaryAction.label}
                                </h3>
                                <p className="opacity-60 text-lg font-medium leading-relaxed max-w-xl line-clamp-3">
                                    {primaryAction.description}
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/founder/planning')}
                                className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shrink-0 w-fit"
                            >
                                Execute Protocol
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
                    </div>

                    {/* Agent Grid */}
                    <section className="space-y-6">
                        <h3 className="text-xl font-bold tracking-tight flex items-center gap-3 px-2">
                            <Bot className="w-5 h-5 text-indigo-500" /> Intelligence Ecosystem
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {agents.map((agent) => (
                                <div key={agent.id} className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-xl hover:border-indigo-500/20 group relative overflow-hidden min-w-0">
                                    <div className="flex flex-col gap-6 relative z-10 h-full min-w-0">
                                        <div className="flex items-center justify-between shrink-0">
                                            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-500 transition-colors">
                                                <agent.icon className="w-6 h-6" />
                                            </div>
                                            <div className={cn("h-2 w-2 rounded-full", activeRuns.find(r => r.agentType === agent.id) ? "bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.5)]" : "bg-zinc-100 dark:bg-zinc-800")} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-base tracking-tight mb-1 group-hover:text-indigo-500 transition-colors line-clamp-1">{agent.name}</h4>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest line-clamp-1">{agent.description}</p>
                                        </div>
                                        <button
                                            onClick={() => manualTriggerAgent(agent.id)}
                                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all border border-zinc-100 dark:border-zinc-800 shrink-0"
                                        >
                                            <Play className="w-3 h-3" />
                                            Trigger Intel
                                        </button>
                                    </div>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Execution Nodes */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-bold tracking-tight flex items-center gap-3">
                                <Activity className="w-5 h-5 text-indigo-500" /> Node Registry
                            </h3>
                            <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-indigo-500 transition-colors">Historical Logs</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[...pendingTasks.slice(0, 4), ...completedTasks.slice(0, 2)].map((task) => (
                                <div
                                    key={task.id}
                                    onClick={() => task.status === "done" && setSelectedTask(task)}
                                    className={cn(
                                        "group p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border transition-all cursor-pointer shadow-sm hover:shadow-xl min-w-0 overflow-hidden flex flex-col",
                                        task.status === "done" ? "border-green-500/20 bg-green-50/10" : "border-zinc-200 dark:border-zinc-800"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-6 shrink-0">
                                        <div className="flex items-center gap-3">
                                            {task.status === "done" ? (
                                                <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-lg border-2 border-zinc-100 dark:border-zinc-800 shrink-0" />
                                            )}
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 line-clamp-1">
                                                {task.status === "done" ? "VERIFIED" : `${task.priority} INTEL`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase leading-relaxed line-clamp-2 break-words">{task.title}</h4>
                                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed italic line-clamp-2 break-words">"{task.instruction || task.reason}"</p>
                                    </div>
                                    {task.status === "done" && (
                                        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between shrink-0">
                                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Access Evidence →</span>
                                            <ArrowUpRight className="w-4 h-4 text-zinc-300" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Vertical Stream Sidecar */}
                <aside className="xl:col-span-4 space-y-12 h-fit xl:sticky xl:top-12">
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-[3rem] border border-zinc-100 dark:border-zinc-800/50 shadow-sm space-y-10">
                        <div className="flex items-center gap-3 text-zinc-400">
                            <Clock className="w-5 h-5" />
                            <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase">Decision Stream</h3>
                        </div>

                        <div className="relative space-y-12 before:absolute before:inset-0 before:ml-[15px] before:h-full before:w-[1.5px] before:bg-zinc-200 dark:before:bg-zinc-800/50">
                            {memory.slice(0, 8).map((entry) => (
                                <div
                                    key={entry.id}
                                    className="relative flex items-start pl-12 group min-w-0"
                                >
                                    <div className={cn(
                                        "absolute left-0 mt-0 w-8 h-8 rounded-xl border-4 border-white dark:border-black flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 shrink-0",
                                        entry.source === "agent" ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "bg-white text-zinc-400 dark:bg-zinc-800 border-zinc-50 dark:border-zinc-900"
                                    )}>
                                        {entry.type === "idea" && <Rocket className="w-3.5 h-3.5" />}
                                        {entry.type === "agent-output" && <Zap className="w-3.5 h-3.5" />}
                                        {entry.type === "decision" && <Target className="w-3.5 h-3.5" />}
                                        {entry.type === "pivot" && <AlertTriangle className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest line-clamp-1">
                                            {formatDistanceToNow(entry.timestamp.toDate())} ago
                                        </div>
                                        <p className="text-[11px] font-medium leading-relaxed text-zinc-600 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors line-clamp-3 break-words">
                                            {entry.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Evidence Viewer */}
            <AnimatePresence>
                {selectedTask && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedTask(null)}
                            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-zinc-950 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 flex flex-col"
                        >
                            <div className="flex items-center justify-between p-10 bg-zinc-100/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight mb-1">{selectedTask.title}</h2>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-500">Extracted Evidence Packet</p>
                                </div>
                                <button onClick={() => setSelectedTask(null)} className="p-3 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-2xl transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-12 overflow-y-auto flex-1 prose prose-zinc dark:prose-invert prose-p:text-sm prose-headings:text-lg prose-headings:font-bold prose-headings:tracking-tight max-w-none">
                                <ReactMarkdown>{selectedTask.aiResponse || "_SECURE DATA LAYER UPLOADING_"}</ReactMarkdown>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

