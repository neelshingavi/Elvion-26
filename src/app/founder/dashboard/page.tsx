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
    Sparkles,
    Mail
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!startup) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in zoom-in duration-1000">
                <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-[3rem] shadow-sm border border-zinc-100 dark:border-zinc-800">
                    <Rocket className="w-16 h-16 text-zinc-300 dark:text-zinc-700" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-black tracking-tighter">Initiate Venture</h2>
                    <p className="text-zinc-500 font-medium max-w-sm mx-auto">
                        Your strategic command center is ready. Select a project to begin extraction.
                    </p>
                </div>
                <button
                    onClick={() => router.push("/projects")}
                    className="px-10 py-4 bg-black dark:bg-zinc-50 text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                >
                    Registry
                </button>
            </div>
        );
    }

    const pendingTasks = tasks.filter(t => t.status === "pending");
    const completedTasks = tasks.filter(t => t.status === "done");
    const primaryAction = getPrimaryAction(startup);
    const activeRuns = agentRuns.filter(r => r.status === "running");

    const handleAgentAction = async (agent: any) => {
        if (!startup) return;
        try {
            if (agent.id === "ppt" || agent.id === "mailer") {
                const { createTaskDirectly } = await import("@/lib/startup-service");
                const title = agent.id === "ppt" ? "Generate Pitch Deck" : "Dispatch Newsletter";
                const desc = agent.id === "ppt"
                    ? "Generate a comprehensive pitch deck based on validated roadmap nodes."
                    : "Draft and dispatch the weekly ecosystem newsletter to venture partners.";

                await createTaskDirectly(startup.startupId, title, desc, "high");
                router.push("/founder/tasks");
                return;
            }
            await createAgentRun(startup.startupId, agent.id);
        } catch (e) {
            console.error("Agent failed:", e);
        }
    };

    const stats = [
        {
            name: "Venture Stage",
            value: startup.stage.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            icon: Target,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            name: "Execution Velocity",
            value: `${Math.round((completedTasks.length / (tasks.length || 1)) * 100)}%`,
            icon: Rocket,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10"
        },
        {
            name: "Active Streams",
            value: `${activeRuns.length}`,
            icon: Zap,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            name: "Completed Nodes",
            value: `${completedTasks.length}`,
            icon: CheckCircle2,
            color: "text-green-500",
            bg: "bg-green-500/10"
        },
        {
            name: "Venture Partners",
            value: `${currentUser?.uid ? (startup as any)?.connectionCount || 3 : 0}`,
            icon: Users,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            onClick: () => router.push("/founder/chat")
        },
        {
            name: "Strategic IQ",
            value: "85/100",
            icon: Brain,
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
    ];

    const agents = [
        { id: "planner", name: "Strategic Planner", description: "Roadmaps & Milestones", icon: Target },
        { id: "researcher", name: "Market Researcher", description: "Competitor Analysis", icon: Activity },
        { id: "drafter", name: "Content Drafter", description: "Pitch Decks & Memos", icon: FileText },
        { id: "ppt", name: "PPT Deck Builder", description: "Visual Presentation Vector", icon: Sparkles },
        { id: "mailer", name: "Newsletter Mailer", description: "Ecosystem Outreach", icon: Mail },
    ];

    return (
        <div className="space-y-12 p-6 md:p-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
            {/* Classy Header */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-zinc-100 dark:border-zinc-800 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Executive Dashboard
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
                            {startup.name}
                        </h1>
                        <button
                            onClick={() => router.push("/projects")}
                            className="p-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all text-zinc-400 hover:text-indigo-500"
                            title="Switch Context"
                        >
                            <ArrowLeftRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Notification Center Popover */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-3 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm text-zinc-400 hover:text-indigo-500 transition-all relative"
                        >
                            <Bell className="w-5 h-5" />
                            {notifications.length > 0 && (
                                <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-red-500 text-[8px] font-black text-white flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-950 animate-in zoom-in">
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
                                        <div className="p-6 border-b border-zinc-50 dark:border-zinc-900 flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Signal Intelligence</h3>
                                            <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg"><X className="w-3 h-3 text-zinc-400" /></button>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                            {notifications.length > 0 ? notifications.map((req) => (
                                                <div key={req.id} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-3 transition-colors hover:border-indigo-500/20">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                                            <Users className="w-5 h-5 text-indigo-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[9px] font-black uppercase text-zinc-400">Connection Link</p>
                                                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate">Protocol Sent: {req.fromId.slice(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => handleAccept(req)}
                                                            className="flex items-center justify-center gap-1.5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-[1.05] transition-transform"
                                                        >
                                                            <Check className="w-3 h-3" /> Connect
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(req)}
                                                            className="flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-zinc-800 text-zinc-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 border border-zinc-100 dark:border-zinc-800 transition-colors"
                                                        >
                                                            <CloseX className="w-3 h-3" /> Purge
                                                        </button>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="py-12 text-center space-y-4">
                                                    <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-100 dark:border-zinc-800">
                                                        <Sparkles className="w-5 h-5 text-zinc-300" />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">No pending signals</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => router.push("/founder/chat")}
                        className="p-3 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm text-zinc-400 hover:text-indigo-500 transition-all relative"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                        <div className="relative">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                        </div>
                        <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">
                            {activeRuns.length > 0 ? `${activeRuns.length} Active Intel Streams` : "Core Engine Idle"}
                        </span>
                    </div>
                </div>
            </header>

            {/* Stats Grid - Unified with Validation UI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={stat.onClick}
                        className={cn(
                            "group p-8 rounded-[2rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all",
                            stat.onClick && "cursor-pointer"
                        )}
                    >
                        <div className="flex flex-col gap-4">
                            <div className={cn("w-12 h-12 rounded-2xl transition-transform group-hover:scale-110 flex items-center justify-center", stat.bg, stat.color)}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                                    {stat.name}
                                </p>
                                <p className="text-xl font-black tracking-tighter uppercase">{stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                {/* Main Content Rail */}
                <div className="xl:col-span-9 space-y-12">

                    {/* Strategic Focus - Clean Dark/Light Panel */}
                    <section className="relative overflow-hidden group">
                        <div className="relative z-10 p-12 rounded-[3rem] bg-zinc-900 text-white shadow-2xl overflow-hidden border border-white/5">
                            <div className="relative z-20 space-y-8">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[9px] font-black tracking-[0.3em] uppercase text-indigo-400">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Active Strategic Vector
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black tracking-tighter leading-none">
                                        {primaryAction.label}
                                    </h3>
                                    <p className="opacity-50 text-base font-medium max-w-xl leading-relaxed">
                                        {primaryAction.description}
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/founder/planning')}
                                    className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/5"
                                >
                                    Initialize Execution
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
                        </div>
                    </section>

                    {/* Agent Grid */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-1">
                            <Bot className="w-4 h-4 text-zinc-400" />
                            <h3 className="text-[10px] font-black tracking-[0.3em] text-zinc-400 uppercase">Agent Ecosystem</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {agents.map((agent) => (
                                <div key={agent.id} className="p-8 rounded-[2rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 hover:shadow-lg transition-all group overflow-hidden relative">
                                    <div className="absolute -top-4 -right-4 p-8 opacity-[0.02] group-hover:scale-110 transition-transform">
                                        <agent.icon className="w-24 h-24" />
                                    </div>
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors">
                                            <agent.icon className="w-5 h-5" />
                                        </div>
                                        <div className={cn("h-1.5 w-1.5 rounded-full", activeRuns.find(r => r.agentType === agent.id) ? "bg-green-500 animate-pulse" : "bg-zinc-200 dark:bg-zinc-800")} />
                                    </div>
                                    <div className="relative z-10">
                                        <h4 className="font-black text-sm uppercase tracking-tight mb-1">{agent.name}</h4>
                                        <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-widest">{agent.description}</p>
                                    </div>
                                    <button
                                        onClick={() => handleAgentAction(agent)}
                                        className="relative z-10 mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all border border-zinc-100 dark:border-zinc-800"
                                    >
                                        <Play className="w-3 h-3" />
                                        Trigger
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Execution Nodes */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-1">
                            <Activity className="w-4 h-4 text-zinc-400" />
                            <h3 className="text-[10px] font-black tracking-[0.3em] text-zinc-400 uppercase">Execution Registry</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[...pendingTasks.slice(0, 4), ...completedTasks.slice(0, 2)].map((task) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={() => task.status === "done" && setSelectedTask(task)}
                                    className={cn(
                                        "group p-8 rounded-[2rem] bg-white dark:bg-zinc-950 border transition-all cursor-pointer shadow-sm hover:shadow-md",
                                        task.status === "done" ? "border-green-500/10" : "border-zinc-200 dark:border-zinc-800"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            {task.status === "done" ? (
                                                <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-lg border-2 border-zinc-100 dark:border-zinc-800" />
                                            )}
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                {task.status === "done" ? "NODE CAPTURED" : `${task.priority} INTEL`}
                                            </span>
                                        </div>
                                    </div>
                                    <h4 className="font-black text-xs tracking-tight mb-2 group-hover:text-indigo-500 transition-colors uppercase leading-relaxed">{task.title}</h4>
                                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-tighter line-clamp-1 italic">"{task.instruction || task.reason}"</p>
                                    {task.status === "done" && (
                                        <div className="mt-6 pt-6 border-t border-zinc-50 dark:border-zinc-900 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Access Intelligence →</span>
                                            <FileText className="w-4 h-4 text-zinc-300" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Vertical Intel Stream */}
                <aside className="xl:col-span-3 border-l border-zinc-100 dark:border-zinc-800 pl-12 hidden xl:block">
                    <div className="sticky top-12 space-y-12">

                        <div className="flex items-center gap-3 text-zinc-400 pt-8">
                            <Clock className="w-4 h-4" />
                            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase">Decision Stream</h3>
                        </div>

                        <div className="relative space-y-10 before:absolute before:inset-0 before:ml-[15px] before:h-full before:w-px before:bg-zinc-100 dark:before:bg-zinc-900">
                            {memory.slice(0, 8).map((entry) => (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="relative flex items-start pl-12 group"
                                >
                                    <div className={cn(
                                        "absolute left-0 mt-0 w-8 h-8 rounded-xl border-4 border-white dark:border-black flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                                        entry.source === "agent" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                                    )}>
                                        {entry.type === "idea" && <Rocket className="w-3.5 h-3.5" />}
                                        {entry.type === "agent-output" && <Zap className="w-3.5 h-3.5" />}
                                        {entry.type === "decision" && <Target className="w-3.5 h-3.5" />}
                                        {entry.type === "pivot" && <AlertTriangle className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                                            {formatDistanceToNow(entry.timestamp.toDate(), { addSuffix: true }).toUpperCase()}
                                        </span>
                                        <p className="text-[11px] font-bold leading-relaxed text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors uppercase tracking-tighter line-clamp-2">
                                            {entry.content.length > 80 ? entry.content.substring(0, 80) + '...' : entry.content}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Global Intel Viewer */}
            <AnimatePresence>
                {selectedTask && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedTask(null)}
                            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-zinc-950 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5"
                        >
                            <div className="flex items-center justify-between p-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="space-y-1">
                                    <h2 className="text-sm font-black tracking-widest uppercase">{selectedTask.title}</h2>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500">Extracted Intelligence</p>
                                </div>
                                <button onClick={() => setSelectedTask(null)} className="p-3 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-2xl transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-12 overflow-y-auto max-h-[60vh] prose prose-zinc dark:prose-invert prose-p:text-sm prose-headings:uppercase prose-headings:tracking-widest">
                                <ReactMarkdown>{selectedTask.aiResponse || "_DATA UNAVAILABLE_"}</ReactMarkdown>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
