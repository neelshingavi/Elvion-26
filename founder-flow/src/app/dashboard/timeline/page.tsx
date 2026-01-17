"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getStartupMemory } from "@/lib/startup-service";
import { History, Zap, Brain, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function TimelinePage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!user) return;
            // In a real app, we'd fetch the active startupId from a global state or DB
            // For now, we'll need to find the latest startup for this user
            // Placeholder: assuming we have a startupId
            // const memory = await getStartupMemory(startupId);
            // setLogs(memory);
        };
        fetchLogs();
    }, [user]);

    const mockLogs = [
        { type: "idea", content: "AI-driven platform for founder matching and roadmap automation.", timestamp: new Date() },
        { type: "agent-output", content: "Validated idea with score 85. Risks identified in market saturation.", timestamp: new Date(Date.now() - 1000 * 60 * 5) },
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case "idea": return <Brain className="w-4 h-4" />;
            case "agent-output": return <Zap className="w-4 h-4" />;
            default: return <MessageSquare className="w-4 h-4" />;
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                    <History className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Startup Memory</h1>
                    <p className="text-zinc-500">Chronological log of every action and AI decision.</p>
                </div>
            </div>

            <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-4 pl-8 space-y-12">
                {mockLogs.map((log, i) => (
                    <div key={i} className="relative">
                        <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-white dark:bg-black border-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                            {getIcon(log.type)}
                        </div>
                        <div className="space-y-2">
                            <span className="text-xs font-mono text-zinc-400 uppercase tracking-tighter">
                                {format(log.timestamp, "MMM d, HH:mm")} — {log.type}
                            </span>
                            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    {log.content}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                <div className="flex justify-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                    <p className="text-zinc-400 text-sm">End of history. More logs will appear as agents run.</p>
                </div>
            </div>
        </div>
    );
}
