"use client";

import { useStartup } from "@/hooks/useStartup";
import { History, Zap, Brain, MessageSquare, Clock, AlertCircle, Target, Rocket } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

const ExpandableText = ({ text }: { text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldTruncate = text.length > 200;

    if (!shouldTruncate) {
        return <p className="text-muted leading-relaxed font-medium">{text}</p>;
    }

    return (
        <div className="space-y-2">
            <p className={cn(
                "text-muted  leading-relaxed font-medium transition-all",
                !isExpanded && "line-clamp-4"
            )}>
                {text}
            </p>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                className="text-[10px] uppercase font-black tracking-widest text-primary hover:text-primary dark:hover:text-indigo-400"
            >
                {isExpanded ? "Read Less" : "Read More"}
            </button>
        </div>
    );
};

export default function TimelinePage() {
    const { memory, loading } = useStartup();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "idea": return <Rocket className="w-4 h-4" />;
            case "agent-output": return <Zap className="w-4 h-4 fill-current" />;
            case "decision": return <Target className="w-4 h-4" />;
            case "pivot": return <AlertCircle className="w-4 h-4" />;
            default: return <MessageSquare className="w-4 h-4" />;
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-info-soft text-info rounded-2xl">
                    <History className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Startup Memory</h1>
                    <p className="text-muted">Chronological log of every action and AI decision.</p>
                </div>
            </div>

            <div className="relative border-l border-subtle ml-4 pl-8 space-y-12">
                {memory.length > 0 ? (
                    memory.map((log) => (
                        <div key={log.id} className="relative group">
                            <div className={cn(
                                "absolute -left-[41px] top-1 w-6 h-6 rounded-full border-2 border-[#fafafa] dark:border-[#050505] flex items-center justify-center transition-transform group-hover:scale-110",
                                log.source === "agent" ? "bg-surface text-white dark:bg-surface-alt dark:text-black shadow-lg" : "bg-surface  text-muted shadow-sm"
                            )}>
                                {getIcon(log.type)}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-subtle uppercase tracking-widest">
                                        {log.source === "agent" ? "Agent Sync" : "Founder Decision"}
                                    </span>
                                    <span className="text-[10px] text-subtle">•</span>
                                    <span className="text-[10px] text-subtle">
                                        {log.timestamp ? formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true }) : "just now"}
                                    </span>
                                </div>
                                <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-sm transition-all group-hover:border-subtle dark:group-hover:border-zinc-700">
                                    <ExpandableText text={(() => {
                                        if (log.type !== "agent-output") return log.content;
                                        try {
                                            const parsed = JSON.parse(log.content);
                                            return parsed.summary || log.content;
                                        } catch (e) {
                                            return log.content;
                                        }
                                    })()} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
                        <Clock className="w-12 h-12" />
                        <p className="text-lg font-bold italic italic">Startup history is being written...</p>
                    </div>
                )}

                <div className="flex justify-center p-8 border border-dashed border-subtle rounded-3xl">
                    <p className="text-subtle text-sm">End of history. More logs will appear as agents run.</p>
                </div>
            </div>
        </div>
    );
}


