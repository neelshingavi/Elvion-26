"use client";

import { CheckSquare, ListTodo, Plus, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const mockTasks = [
    { id: 1, title: "Finalize Landing Page Hero", priority: "high", status: "todo" },
    { id: 2, title: "Connect Firebase Auth", priority: "critical", status: "todo" },
    { id: 3, title: "Setup Gemini Route", priority: "medium", status: "done" },
    { id: 4, title: "Design Onboarding Flow", priority: "high", status: "done" },
];

export default function TasksPage() {
    const [tasks, setTasks] = useState(mockTasks);
    const [loading, setLoading] = useState(false);

    const generateTasks = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1500);
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
                    onClick={generateTasks}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-md"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
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
                        {tasks.filter(t => t.status === "todo").map(task => (
                            <div
                                key={task.id}
                                className="group flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-5 h-5 rounded-md border-2 border-zinc-200 dark:border-zinc-800" />
                                    <div>
                                        <p className="font-medium">{task.title}</p>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                                            task.priority === "critical" ? "bg-red-500/10 text-red-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                        )}>
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>
                                <AlertCircle className="w-4 h-4 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                        <button className="w-full py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 hover:text-black dark:hover:text-white transition-all flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
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
                                className="flex items-center justify-between p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
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
