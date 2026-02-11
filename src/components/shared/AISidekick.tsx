"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, User, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/context/AuthContext";

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
    const { user } = useAuth();
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
        if (!startupId) {
            setMessages(prev => [...prev, {
                id: `error_${Date.now()}`,
                role: "assistant",
                content: "Please select or create a startup before using the Sidekick.",
                timestamp: new Date()
            }]);
            return;
        }
        if (!user) {
            console.error("User not authenticated.");
            return;
        }

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
            const token = await user.getIdToken();
            const response = await fetch("/api/sidekick", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
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

            if (!response.ok || data.error) {
                const message = typeof data.error === "string" ? data.error : data.error?.message || "Sidekick failed";
                throw new Error(message);
            }

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
                        className="fixed inset-0 bg-overlay backdrop-blur-[2px] z-[100]"
                    />
                    
                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 240 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface shadow-float z-[101] flex flex-col border-l border-subtle"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-subtle flex items-center justify-between bg-surface-alt">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-card">
                                    <Bot className="w-5 h-5 text-on-primary" />
                                </div>
                                <div>
                                    <h3 className="text-h3 text-strong uppercase tracking-tight">AI Sidekick</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                        <p className="text-overline text-subtle">Strategist Persona Active</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-surface rounded-xl transition-colors text-subtle hover:text-strong"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-app">
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
                                            ? "bg-surface border border-subtle" 
                                            : "bg-primary-soft"
                                    )}>
                                        {msg.role === "user" ? <User className="w-4 h-4 text-subtle" /> : <Sparkles className="w-4 h-4 text-primary" />}
                                    </div>
                                    <div className={cn(
                                        "p-4 rounded-2xl text-sm leading-relaxed",
                                        msg.role === "user" 
                                            ? "bg-primary text-on-primary rounded-tr-none shadow-card" 
                                            : "bg-surface-alt text-strong rounded-tl-none border border-subtle"
                                    )}>
                                        <ReactMarkdown 
                                            components={{
                                                p: ({ children }) => <p className="mb-0">{children}</p>,
                                                ul: ({ children }) => <ul className="mt-2 space-y-1">{children}</ul>,
                                                li: ({ children }) => <li className="list-disc ml-4">{children}</li>,
                                                strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 max-w-[85%] mr-auto">
                                    <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center shrink-0 mt-1">
                                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                    </div>
                                    <div className="p-4 rounded-2xl text-sm bg-surface-alt text-muted rounded-tl-none border border-subtle animate-pulse">
                                        Strategizing...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Footer / Input Area */}
                        <div className="p-4 bg-surface-alt border-t border-subtle">
                            {messages.length === 1 && !isLoading && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => {
                                                setInput(suggestion);
                                            }}
                                            className="px-3 py-1.5 rounded-full bg-surface border border-subtle text-[11px] font-semibold text-muted hover:border-primary hover:text-primary transition-all shadow-sm"
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
                                    className="input flex-1 rounded-2xl px-5 py-3.5 text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className={cn(
                                        "p-3.5 rounded-2xl bg-primary-gradient text-on-primary shadow-card transition-all",
                                        (!input.trim() || isLoading) 
                                            ? "opacity-50 cursor-not-allowed" 
                                            : "hover:scale-105 active:scale-95"
                                    )}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                            <p className="mt-3 text-center text-overline">
                                AI may provide inaccurate info. Plan accordingly.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
