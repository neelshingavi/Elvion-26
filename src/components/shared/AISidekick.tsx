"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, User, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface AISidekickProps {
    isOpen: boolean;
    onClose: () => void;
    startupId: string;
    userId: string;
}

export function AISidekick({ isOpen, onClose, startupId, userId }: AISidekickProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hi! I'm your AI Sidekick. I have context on your startup and I'm here to help you strategize. What's on your mind?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/sidekick", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startupId,
                    userId,
                    message: input,
                    history: messages.slice(-5).map(m => ({ 
                        role: m.role === 'assistant' ? 'assistant' : 'user', 
                        content: m.content 
                    }))
                })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error: unknown) {
            console.error("Sidekick Error:", error);
            const errorMessage: Message = {
                id: "error",
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again later.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const suggestions = [
        "What should be my next milestone?",
        "Analyze my current strategy",
        "Help me draft a pitch sentence",
        "Identify risks in my idea"
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100]"
                    />
                    
                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 240 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-[#0a0a0b] shadow-2xl z-[101] flex flex-col border-l border-zinc-200 dark:border-zinc-800"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">AI Sidekick</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Strategist Persona Active</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex gap-3 max-w-[85%]",
                                        msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                                        msg.role === "user" 
                                            ? "bg-zinc-100 dark:bg-zinc-800" 
                                            : "bg-indigo-100 dark:bg-indigo-900/40"
                                    )}>
                                        {msg.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-indigo-500" />}
                                    </div>
                                    <div className={cn(
                                        "p-4 rounded-2xl text-sm leading-relaxed",
                                        msg.role === "user" 
                                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black rounded-tr-none" 
                                            : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50"
                                    )}>
                                        <ReactMarkdown 
                                            components={{
                                                p: ({ children }) => <p className="mb-0">{children}</p>,
                                                ul: ({ children }) => <ul className="mt-2 space-y-1">{children}</ul>,
                                                li: ({ children }) => <li className="list-disc ml-4">{children}</li>,
                                                strong: ({ children }) => <strong className="font-bold text-indigo-500 dark:text-indigo-400">{children}</strong>
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 max-w-[85%] mr-auto">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 mt-1">
                                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                    </div>
                                    <div className="p-4 rounded-2xl text-sm bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50 animate-pulse">
                                        Strategizing...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Footer / Input Area */}
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/50">
                            {messages.length === 1 && !isLoading && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => {
                                                setInput(suggestion);
                                            }}
                                            className="px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:border-indigo-500 hover:text-indigo-500 transition-all shadow-sm"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className={cn(
                                        "p-3.5 rounded-2xl bg-indigo-600 text-white shadow-lg transition-all",
                                        (!input.trim() || isLoading) 
                                            ? "opacity-50 cursor-not-allowed" 
                                            : "hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-indigo-500/20"
                                    )}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                            <p className="mt-3 text-center text-[10px] text-zinc-400 font-medium uppercase tracking-widest">
                                AI may provide inaccurate info. Plan accordingly.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
