"use client";

import { CheckSquare, ListTodo, Plus, Loader2, Sparkles, AlertCircle } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useStartup } from "@/hooks/useStartup";
import { updateTaskStatus } from "@/lib/startup-service";

export default function TasksPage() {
    const { tasks, loading, startup } = useStartup();
    const [syncing, setSyncing] = useState(false);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const toggleTask = async (taskId: string, currentStatus: "pending" | "done") => {
        await updateTaskStatus(taskId, currentStatus === "pending" ? "done" : "pending");
    };

    const handleSync = async () => {
        if (!startup) return;
        setSyncing(true);
        try {
            await fetch("/api/generate-tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startupId: startup.startupId, idea: startup.idea }),
            });
        } catch (error) {
            console.error("Sync failed:", error);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
                        <CheckSquare className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Task Board</h1>
                        <p className="text-zinc-500">Atomic tasks generated from your roadmap.</p>
                    </div>
                </div>

                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-md"
                >
                    {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    AI Sync
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
                        <ListTodo className="w-5 h-5 text-zinc-400" />
                        Active Tasks
                    </h3>
                    <div className="space-y-3">
                        {tasks.filter(t => t.status === "pending").length > 0 ? (
                            tasks.filter(t => t.status === "pending").map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => toggleTask(task.id, "pending")}
                                    className="group flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-5 h-5 rounded-md border-2 border-zinc-200 dark:border-zinc-800 group-hover:border-black dark:group-hover:border-white transition-colors" />
                                        <div>
                                            <p className="font-medium">{task.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                                                    task.priority === "high" ? "bg-red-500/10 text-red-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                                )}>
                                                    {task.priority}
                                                </span>
                                                <span className="text-[10px] text-zinc-400 opacity-60">via {task.createdByAgent}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <AlertCircle className="w-4 h-4 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))
                        ) : (
                            <div className="py-12 border-2 border-dashed border-zinc-100 dark:border-zinc-900 rounded-3xl flex flex-col items-center justify-center text-center px-6">
                                <Sparkles className="w-8 h-8 text-zinc-200 mb-2" />
                                <p className="text-zinc-400 text-sm">No tasks yet. Run AI Sync to generate your first sprint.</p>
                            </div>
                        )}
                        <button className="w-full py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 hover:text-black dark:hover:text-white transition-all flex items-center justify-center gap-2 group">
                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Add custom task
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-zinc-400">
                        <CheckSquare className="w-5 h-5" />
                        Completed
                    </h3>
                    <div className="space-y-3 opacity-60">
                        {tasks.filter(t => t.status === "done").map(task => (
                            <div
                                key={task.id}
                                onClick={() => toggleTask(task.id, "done")}
                                className="flex items-center justify-between p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                            >
                                <div className="flex items-center gap-4 line-through">
                                    <div className="w-5 h-5 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                                        <CheckSquare className="w-3 h-3 text-white dark:text-black" />
                                    </div>
                                    <p className="font-medium text-zinc-400">{task.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
