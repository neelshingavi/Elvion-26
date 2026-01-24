"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserChatRooms, getMessages, sendMessage, ChatRoom, Message } from "@/lib/messaging-service";
import { getUserData, UserData } from "@/lib/startup-service";
import { getConnectedUsers } from "@/lib/connection-service";
import {
    Send, MessageSquare, Search,
    ChevronLeft, Loader2, Sparkles, MoreHorizontal, Phone, Video,
    Shield, Rocket, Star, Info, Paperclip, Smile
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface MessagingHubProps {
    roleContext: "founder" | "investor" | "customer" | "job-seeker" | "admin";
}

export function MessagingHub({ roleContext }: MessagingHubProps) {
    const { user: currentUser } = useAuth();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [roomUsers, setRoomUsers] = useState<Record<string, UserData>>({});
    const [connectedUserIds, setConnectedUserIds] = useState<string[]>([]);
    const [messageText, setMessageText] = useState("");
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);

    useEffect(() => {
        if (!currentUser) return;

        getUserData(currentUser.uid).then(setCurrentUserData);
        getConnectedUsers(currentUser.uid).then(setConnectedUserIds);

        const unsub = getUserChatRooms(currentUser.uid, (data) => {
            setRooms(data);
            setLoadingRooms(false);

            const participantIds = Array.from(new Set(data.flatMap(room =>
                room.participants.filter(p => p !== currentUser.uid)
            )));

            participantIds.forEach(id => {
                if (!roomUsers[id]) {
                    getUserData(id).then(u => {
                        if (u) setRoomUsers(prev => ({ ...prev, [id]: u }));
                    });
                }
            });
        });
        return () => unsub();
    }, [currentUser]);

    useEffect(() => {
        if (!activeRoom || !currentUser) return;
        const otherId = activeRoom.participants.find(p => p !== currentUser.uid);
        if (!otherId) return;

        const unsub = getMessages(currentUser.uid, otherId, (msgs) => {
            setMessages(msgs);
            if (scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: "instant" });
            }
        });
        return () => unsub();
    }, [activeRoom, currentUser]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
        return () => clearTimeout(timeout);
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !activeRoom || !currentUser) return;
        const otherId = activeRoom.participants.find(p => p !== currentUser.uid);
        if (!otherId) return;

        const text = messageText;
        setMessageText("");
        await sendMessage(currentUser.uid, otherId, text);
    };

    const activeOtherUser = activeRoom?.participants.find(p => p !== currentUser?.uid);
    const otherUserData = activeOtherUser ? roomUsers[activeOtherUser] : null;

    const filteredRooms = rooms.filter(room => {
        const otherId = room.participants.find(p => p !== currentUser?.uid);
        // Only show rooms where the other person is a "connected" user
        if (!otherId || !connectedUserIds.includes(otherId)) return false;

        const u = roomUsers[otherId];
        return u?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (!currentUser) return null;

    return (
        <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-[#09090b] rounded-[3rem] border border-zinc-100 dark:border-zinc-800/50 overflow-hidden shadow-2xl relative">
            {/* Sidebar/List */}
            <div className={cn(
                "w-full md:w-[380px] border-r border-zinc-50 dark:border-zinc-800/50 flex flex-col bg-zinc-50/20 dark:bg-black/20 backdrop-blur-3xl z-20",
                activeRoom ? "hidden md:flex" : "flex"
            )}>
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Relay Hub</h2>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500/80">
                                {roleContext} Secure Channel
                            </p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Find connection..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-zinc-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-2 custom-scrollbar">
                    {loadingRooms ? (
                        <div className="flex justify-center p-12 opacity-20">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : filteredRooms.length > 0 ? (
                        filteredRooms.map((room) => {
                            const otherId = room.participants.find(p => p !== currentUser?.uid);
                            const u = otherId ? roomUsers[otherId] : null;

                            return (
                                <button
                                    key={room.id}
                                    onClick={() => setActiveRoom(room)}
                                    className={cn(
                                        "w-full flex items-center gap-4 p-5 rounded-[1.8rem] transition-all group",
                                        activeRoom?.id === room.id
                                            ? "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm"
                                            : "hover:bg-white/60 dark:hover:bg-zinc-900/40"
                                    )}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                            <img src={u?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u?.displayName || room.id}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full" />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="text-[11px] font-black uppercase text-zinc-900 dark:text-white truncate tracking-tight">{u?.displayName || "Loading Node..."}</h4>
                                            {room.lastTimestamp && (
                                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                                                    {formatDistanceToNow(room.lastTimestamp.toDate())}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-zinc-500 font-medium truncate uppercase tracking-tighter">
                                            {room.lastMessage || "Establish connection..."}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="py-20 text-center space-y-4 opacity-50">
                            <Sparkles className="w-8 h-8 mx-auto text-zinc-300" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Zero Active Transmissions</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-white dark:bg-[#09090b]",
                !activeRoom && "hidden md:flex items-center justify-center"
            )}>
                {activeRoom ? (
                    <>
                        <div className="p-6 md:px-10 border-b border-zinc-50 dark:border-zinc-800/50 flex items-center justify-between z-30 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveRoom(null)}
                                    className="md:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                                        <img src={otherUserData?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserData?.displayName || activeRoom.id}`} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-white">{otherUserData?.displayName || "System Node"}</h3>
                                        <div className="flex items-center gap-1.5 font-black text-green-500 text-[8px] uppercase tracking-[0.2em]">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            Active Transmitting
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2.5 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/5 rounded-2xl transition-all">
                                    <Phone className="w-4 h-4" />
                                </button>
                                <button className="p-2.5 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/5 rounded-2xl transition-all">
                                    <Video className="w-4 h-4" />
                                </button>
                                <button className="p-2.5 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/5 rounded-2xl transition-all">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar bg-gradient-to-b from-zinc-50/30 to-white dark:from-zinc-900/10 dark:to-[#09090b]">
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === currentUser?.uid;
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex items-end gap-3",
                                            isMe ? "flex-row-reverse" : "flex-row"
                                        )}
                                    >
                                        <div className={cn(
                                            "max-w-[75%] p-5 rounded-[2rem]",
                                            isMe
                                                ? "bg-zinc-900 text-white dark:bg-white dark:text-black rounded-br-[0.5rem] shadow-lg shadow-black/5"
                                                : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 border border-zinc-100 dark:border-zinc-800 rounded-bl-[0.5rem] shadow-sm"
                                        )}>
                                            <p className="text-[13px] font-medium leading-relaxed tracking-tight">{msg.text}</p>
                                        </div>
                                        <div className="text-[7px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                                            {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---"}
                                        </div>
                                    </motion.div>
                                );
                            })}
                            <div ref={scrollRef} className="h-4" />
                        </div>

                        <div className="p-6 md:px-10 border-t border-zinc-50 dark:border-zinc-800 bg-white dark:bg-[#09090b] z-30">
                            <form onSubmit={handleSend} className="relative group flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-[0.03] blur-xl transition duration-500" />
                                    <input
                                        type="text"
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder="Transmit message..."
                                        className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    disabled={!messageText.trim()}
                                    className="h-[52px] w-[52px] rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl hover:bg-black dark:hover:bg-zinc-100 transition-all disabled:opacity-30 disabled:scale-100"
                                >
                                    <Send className="w-5 h-5" />
                                </motion.button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-6 text-center max-w-xs px-6">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 shadow-xl">
                            <MessageSquare className="w-8 h-8 text-zinc-200 dark:text-zinc-800" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black tracking-tighter uppercase">Secure Hub</h3>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 leading-relaxed italic opacity-60">
                                Select a verified connection to establish an encrypted transmission channel.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
