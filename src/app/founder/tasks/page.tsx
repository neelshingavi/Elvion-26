"use client";

import { CheckSquare, ListTodo, Plus, Loader2, Sparkles, AlertCircle, Play, CheckCircle2, Zap, Rocket, Activity, Check, X, FileText, Send } from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useStartup } from "@/hooks/useStartup";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function TasksPage() {
    const { user } = useAuth();
    const { tasks, loading, startup } = useStartup();
    const [executingTaskIds, setExecutingTaskIds] = useState<string[]>([]);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSprintRunning, setIsSprintRunning] = useState(false);

    // Form state
    const [newTitle, setNewTitle] = useState("");
    const [newInstruction, setNewInstruction] = useState("");
    const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");

    const pendingTasks = tasks.filter(t => t.status === "pending");
    const completedTasks = tasks.filter(t => t.status === "done");

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startup || !newTitle || !newInstruction) return;

        try {
            await addDoc(collection(db, "tasks"), {
                startupId: startup.startupId,
                title: newTitle,
                instruction: newInstruction,
                priority: newPriority,
                status: "pending",
                reason: "User requested task",
                createdByAgent: "Founder",
                createdAt: serverTimestamp()
            });
            setShowAddModal(false);
            setNewTitle("");
            setNewInstruction("");
        } catch (error) {
            console.error("Failed to add task:", error);
        }
    };

    const runParallelSprint = async () => {
        if (pendingTasks.length === 0 || isSprintRunning) return;
        if (!user) {
            console.error("User not authenticated.");
            return;
        }
        if (!startup?.startupId) {
            console.error("No active startup selected.");
            return;
        }

        setIsSprintRunning(true);
        const taskIdsToRun = pendingTasks.map(t => t.id);
        setExecutingTaskIds(taskIdsToRun);

        const token = await user.getIdToken();

        // Run all tasks in parallel
        await Promise.all(pendingTasks.map(async (task) => {
            try {
                const res = await fetch("/api/execute-task", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        taskId: task.id,
                        instruction: task.instruction || task.title,
                        startupId: startup?.startupId
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error?.message || "Task execution failed");
            } catch (error) {
                console.error(`Task ${task.title} failed:`, error);
            } finally {
                setExecutingTaskIds(prev => prev.filter(id => id !== task.id));
            }
        }));

        setIsSprintRunning(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-24 max-w-full mx-auto animate-in fade-in duration-700">
            {/* Header - Compact */}
            <header className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                    <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <ListTodo className="w-5 h-5 text-indigo-500" />
                        Task Ecosystem
                    </h1>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                        Parallel Pulse • {pendingTasks.length} Pending
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-bold text-[11px] transition-all hover:scale-105"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Task
                    </button>
                    <button
                        onClick={runParallelSprint}
                        disabled={pendingTasks.length === 0 || isSprintRunning}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] transition-all hover:scale-105 disabled:bg-zinc-400 shadow-lg shadow-indigo-600/20"
                    >
                        {isSprintRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        Run Sprint
                    </button>
                </div>
            </header>

            {/* Parallel Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pending Column */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-1">Active Queue</h3>
                    <AnimatePresence mode="popLayout">
                        {pendingTasks.map((task) => (
                            <motion.div
                                layout
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                    "group relative p-3 rounded-xl bg-white dark:bg-zinc-900 border transition-all overflow-hidden",
                                    executingTaskIds.includes(task.id) ? "border-indigo-500 shadow-xl shadow-indigo-500/5 ring-1 ring-indigo-500/20" : "border-zinc-100 dark:border-zinc-800"
                                )}
                            >
                                <div className="flex items-start justify-between mb-1.5">
                                    <h4 className="font-bold text-xs tracking-tight">{task.title}</h4>
                                    <div className={cn(
                                        "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                                        task.priority === "high" || task.priority === "critical"
                                            ? "bg-red-500 text-white"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                    )}>
                                        {task.priority}
                                    </div>
                                </div>
                                <p className="text-[10px] text-zinc-500 italic mb-2 line-clamp-2">"{task.instruction || task.reason}"</p>

                                {executingTaskIds.includes(task.id) && (
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-indigo-500/10">
                                        <Activity className="w-3 h-3 text-indigo-500 animate-pulse" />
                                        <div className="flex-1 h-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full overflow-hidden">
                                            <motion.div
                                                animate={{ x: ["-100%", "100%"] }}
                                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                className="w-1/2 h-full bg-indigo-500"
                                            />
                                        </div>
                                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Running</span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {pendingTasks.length === 0 && !isSprintRunning && (
                        <div className="py-8 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center opacity-40">
                            <Sparkles className="w-5 h-5 text-zinc-300 mb-1" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Queue Clear</p>
                        </div>
                    )}
                </div>

                {/* Completed Column */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-1">Archive</h3>
                    <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                            {completedTasks.map((task) => (
                                <motion.div
                                    layout
                                    key={task.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => setSelectedTask(task)}
                                    className="group flex flex-col p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:border-indigo-500/20 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                                            </div>
                                            <h4 className="font-bold text-xs text-zinc-600 dark:text-zinc-400 tracking-tight">{task.title}</h4>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-tighter">View</span>
                                            <FileText className="w-3 h-3 text-indigo-500" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Result Modal - Compact */}
            <AnimatePresence>
                {selectedTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedTask(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="relative w-full max-w-xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-white/5"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
                                <div>
                                    <h2 className="text-sm font-black tracking-tighter uppercase">{selectedTask.title}</h2>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">Atomic Outcome</p>
                                </div>
                                <button onClick={() => setSelectedTask(null)} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto max-h-[70vh]">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-2xl font-black tracking-tighter mb-6 mt-8 text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-800 pb-2" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-xl font-bold tracking-tight mb-4 mt-6 text-indigo-600 dark:text-indigo-400" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-lg font-bold tracking-tight mb-3 mt-4 text-zinc-800 dark:text-zinc-100" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-zinc-600 dark:text-zinc-300 text-sm font-medium" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1 text-zinc-600 dark:text-zinc-300 marker:text-indigo-500" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-zinc-600 dark:text-zinc-300 marker:text-indigo-500" {...props} />,
                                        li: ({ node, ...props }) => <li className="pl-1 text-sm leading-relaxed" {...props} />,
                                        code: ({ node, ...props }) => <code className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-indigo-500 font-mono text-xs font-bold" {...props} />,
                                        pre: ({ node, ...props }) => <div className="overflow-x-auto rounded-xl bg-zinc-900 dark:bg-zinc-950 p-4 border border-zinc-800 my-4 shadow-xl"><pre className="text-zinc-50 text-xs font-mono" {...props} /></div>,
                                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 my-4 bg-indigo-50/10 italic text-zinc-500 dark:text-zinc-400" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-black text-zinc-900 dark:text-zinc-100" {...props} />,
                                        a: ({ node, ...props }) => <a className="text-indigo-500 hover:underline font-bold" {...props} />
                                    }}
                                >
                                    {selectedTask.aiResponse || "_Processing intelligence..._"}
                                </ReactMarkdown>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Modal - Compact */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.98, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.98, opacity: 0 }}
                            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl"
                        >
                            <h2 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2">
                                <Send className="w-4 h-4 text-indigo-500" />
                                Launch Instruction
                            </h2>
                            <form onSubmit={handleAddTask} className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 pl-1 mb-1 block">Objective</label>
                                    <input
                                        autoFocus
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        placeholder="e.g. Competitive Analysis"
                                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 focus:border-indigo-500 outline-none transition-all text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 pl-1 mb-1 block">Instruction for AI</label>
                                    <textarea
                                        rows={3}
                                        value={newInstruction}
                                        onChange={e => setNewInstruction(e.target.value)}
                                        placeholder="e.g. 'Identify top 5 competitors in the AI space...'"
                                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 focus:border-indigo-500 outline-none transition-all text-xs leading-relaxed"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {["low", "medium", "high"].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setNewPriority(p as any)}
                                            className={cn(
                                                "flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
                                                newPriority === p
                                                    ? "bg-indigo-600 text-white border-indigo-600"
                                                    : "bg-transparent text-zinc-400 border-zinc-100 dark:border-zinc-800"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <button type="submit" className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black text-[11px] hover:opacity-80 transition-all flex items-center justify-center gap-2 border border-transparent shadow-lg shadow-black/5">
                                    <Rocket className="w-3.5 h-3.5" />
                                    Launch Agent Task
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
