"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserChatRooms, getMessages, sendMessage, ChatRoom, Message } from "@/lib/messaging-service";
import { getUserData, UserData } from "@/lib/startup-service";
import { getConnectedUsersSnapshot } from "@/lib/connection-service";
import {
    Send, MessageSquare, Search,
    ChevronLeft, Loader2, Sparkles, MoreHorizontal, Phone, Video,
    Shield, Info, Paperclip, Smile, Star
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface MessagingHubProps {
    roleContext: "founder" | "admin";
}

export function MessagingHub({ roleContext }: MessagingHubProps) {
    const { user: currentUser } = useAuth();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeOtherId, setActiveOtherId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [roomUsers, setRoomUsers] = useState<Record<string, UserData>>({});
    const [connectedUserIds, setConnectedUserIds] = useState<string[]>([]);
    const [messageText, setMessageText] = useState("");
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Data & Real-time Listeners
    useEffect(() => {
        if (!currentUser) return;

        // 1. Real-time Connection Listener
        const unsubConnections = getConnectedUsersSnapshot(currentUser.uid, (ids) => {
            console.log("Connected Users Sync:", ids);
            setConnectedUserIds(ids);
            // Fetch names for anyone missing
            ids.forEach(id => {
                if (!roomUsers[id]) {
                    getUserData(id).then(u => {
                        if (u) setRoomUsers(prev => ({ ...prev, [id]: u }));
                    });
                }
            });
        });

        // 2. Real-time Rooms Listener
        const unsubRooms = getUserChatRooms(currentUser.uid, (data) => {
            setRooms(data);
            setLoadingRooms(false);

            // Sync metadata for room participants
            data.forEach(room => {
                const otherId = room.participants.find(p => p !== currentUser.uid);
                if (otherId && !roomUsers[otherId]) {
                    getUserData(otherId).then(u => {
                        if (u) setRoomUsers(prev => ({ ...prev, [otherId]: u }));
                    });
                }
            });
        });

        // Lock body scroll to prevent layout jump on focus
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";

        return () => {
            unsubConnections();
            unsubRooms();
            document.body.style.overflow = "unset";
            document.documentElement.style.overflow = "unset";
        };
    }, [currentUser]);

    // Active Message Stream Listener
    useEffect(() => {
        if (!activeOtherId || !currentUser) {
            setMessages([]);
            return;
        }

        const unsub = getMessages(currentUser.uid, activeOtherId, (msgs) => {
            setMessages(msgs);
            // Immediate scroll to bottom
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
            }, 50);
        });
        return () => unsub();
    }, [activeOtherId, currentUser]);

    // Derived Messaging List (All connections, attach room data)
    const displayList = useMemo(() => {
        const list = connectedUserIds.map(userId => {
            const existingRoom = rooms.find(r => r.participants.includes(userId));
            return {
                userId,
                room: existingRoom || null
            };
        });

        return list.sort((a, b) => {
            const timeA = a.room?.lastTimestamp?.toDate?.().getTime() || 0;
            const timeB = b.room?.lastTimestamp?.toDate?.().getTime() || 0;
            if (timeA !== timeB) return timeB - timeA;

            const nameA = roomUsers[a.userId]?.displayName || "";
            const nameB = roomUsers[b.userId]?.displayName || "";
            return nameA.localeCompare(nameB);
        }).filter(item => {
            const u = roomUsers[item.userId];
            const nameMatch = u?.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
            const msgMatch = item.room?.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());
            return nameMatch || msgMatch;
        });
    }, [connectedUserIds, rooms, roomUsers, searchTerm]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!messageText.trim() || !activeOtherId || !currentUser) return;

        const text = messageText;
        setMessageText("");

        try {
            await sendMessage(currentUser.uid, activeOtherId, text);
        } catch (error) {
            console.error("Transmission failed:", error);
            setMessageText(text);
        }
    };

    const activeOtherUserData = activeOtherId ? roomUsers[activeOtherId] : null;

    if (!currentUser) return null;

    return (
        <div className="flex h-full w-full bg-app overflow-hidden relative overscroll-none touch-none">

            {/* Conversations List */}
            <div className={cn(
                "w-full md:w-[380px] border-r border-subtle flex flex-col bg-surface-alt z-20",
                activeOtherId ? "hidden md:flex" : "flex"
            )}>
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-h2 text-strong uppercase tracking-tight">Relay Hub</h2>
                            <p className="text-overline text-primary pt-2">
                                {roleContext} Secure Channel
                            </p>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                            <input
                                type="text"
                                placeholder="Locate connection..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-11 pr-4 py-3.5 text-xs font-medium placeholder:text-subtle"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-2 custom-scrollbar">
                    {loadingRooms ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-20">
                            <Loader2 className="w-6 h-6 animate-spin text-subtle" />
                            <span className="text-overline">Initialising...</span>
                        </div>
                    ) : displayList.length > 0 ? (
                        displayList.map((item) => {
                            const u = roomUsers[item.userId];
                            const isActive = activeOtherId === item.userId;

                            return (
                                <button
                                    key={item.userId}
                                    onClick={() => setActiveOtherId(item.userId)}
                                    className={cn(
                                        "w-full flex items-center gap-4 p-5 radius-card border border-subtle transition-all group duration-300",
                                        isActive
                                            ? "bg-surface shadow-card"
                                            : "bg-surface-alt hover:bg-surface"
                                    )}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center overflow-hidden border border-subtle">
                                            <img
                                                src={u?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u?.displayName || item.userId}`}
                                                className="w-full h-full object-cover"
                                                alt=""
                                            />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-success border-2 border-surface rounded-full shadow-lg" />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="text-sm font-semibold text-strong truncate">
                                                {u?.displayName || "Loading Node..."}
                                            </h4>
                                            {item.room?.lastTimestamp && (
                                                <span className="text-caption uppercase tracking-widest">
                                                    {formatDistanceToNow(item.room.lastTimestamp.toDate())}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-caption text-muted truncate">
                                            {item.room?.lastMessage || "Begin stable connection..."}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="py-20 text-center space-y-6 opacity-30">
                            <div className="w-16 h-16 bg-surface rounded-[2rem] mx-auto flex items-center justify-center border border-subtle">
                                <Sparkles className="w-6 h-6 text-subtle" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-overline">Zero Transmissions</p>
                                <p className="text-caption text-muted max-w-[180px] mx-auto leading-relaxed">Ensure users are in your "Accepted" connection list to begin relayed messaging.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={cn(
                "flex-1 flex flex-col bg-surface relative",
                !activeOtherId && "hidden md:flex items-center justify-center bg-app"
            )}>
                {activeOtherId ? (
                    <>
                        {/* Header */}
                        <div className="p-6 md:px-12 border-b border-subtle flex items-center justify-between z-30 bg-surface-glass backdrop-blur-xl">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => setActiveOtherId(null)}
                                    className="md:hidden p-3 hover:bg-surface-alt rounded-2xl transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 text-subtle" />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center border border-subtle overflow-hidden shadow-card">
                                            <img
                                                src={activeOtherUserData?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeOtherUserData?.displayName || activeOtherId}`}
                                                className="w-full h-full object-cover"
                                                alt=""
                                            />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success border-4 border-surface rounded-full" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-tight text-strong">
                                            {activeOtherUserData?.displayName || "Protocol Node"}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 font-semibold text-success text-[9px] uppercase tracking-[0.2em]">
                                                <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                                                Verified Transmission
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stream Area */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 bg-app">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-6">
                                    <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center border border-subtle">
                                        <Info className="w-6 h-6 text-subtle" />
                                    </div>
                                    <p className="text-overline text-muted">E2E Secure Channel Ready</p>
                                </div>
                            ) : messages.map((msg, idx) => {
                                const isMe = msg.senderId === currentUser?.uid;
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className={cn(
                                            "flex items-end gap-3",
                                            isMe ? "flex-row-reverse" : "flex-row"
                                        )}
                                    >
                                        <div className={cn(
                                            "max-w-[80%] p-6 rounded-[2.5rem] relative",
                                            isMe
                                                ? "bg-primary text-on-primary rounded-br-[0.5rem] shadow-float"
                                                : "bg-surface text-strong border border-subtle rounded-bl-[0.5rem] shadow-card"
                                        )}>
                                            <p className="text-[14px] font-medium leading-relaxed tracking-tight whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                        <div className="text-caption uppercase tracking-widest text-subtle mb-4 px-2">
                                            {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---"}
                                        </div>
                                    </motion.div>
                                );
                            })}
                            <div ref={scrollRef} className="h-4" />
                        </div>

                        {/* Interactive Input Hub - Absolute fixed to bottom of container */}
                        <div className="p-10 border-t border-subtle bg-surface z-30">
                            <div className="relative group flex items-end gap-5">
                                <div className="flex-1 relative">
                                    <div className="relative flex items-center bg-surface-alt rounded-[2.2rem] border border-subtle px-6 py-2 transition-all focus-within:shadow-card">
                                        <button className="p-3 text-subtle hover:text-primary transition-colors">
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <textarea
                                            rows={1}
                                            value={messageText}
                                            onChange={(e) => {
                                                setMessageText(e.target.value);
                                                e.target.style.height = 'auto';
                                                e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            placeholder="Transmit intelligence..."
                                            className="flex-1 bg-transparent border-none text-[15px] font-medium focus:ring-0 placeholder:text-subtle py-4 max-h-[150px] resize-none overflow-y-auto"
                                        />
                                        <button className="p-3 text-subtle hover:text-primary transition-colors">
                                            <Smile className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSend()}
                                    disabled={!messageText.trim()}
                                    className="h-[68px] w-[68px] radius-card bg-primary-gradient text-on-primary flex items-center justify-center shadow-float transition-all disabled:opacity-30 disabled:scale-100 group/send"
                                >
                                    <Send className="w-6 h-6 group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
                                </motion.button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-8 text-center max-w-sm px-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        <div className="relative">
                            <div className="absolute -inset-12 bg-primary-soft rounded-full blur-[80px]" />
                            <div className="relative w-32 h-32 rounded-[3.5rem] bg-surface flex items-center justify-center border border-subtle shadow-float">
                                <MessageSquare className="w-12 h-12 text-subtle" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-h2 text-strong uppercase tracking-tight">Secure Relay Hub</h3>
                            <div className="pt-4 space-y-2 px-6">
                                <p className="text-caption text-muted uppercase tracking-[0.25em] leading-relaxed italic">
                                    Initialize end-to-end encrypted protocol with verified connections in your network.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
