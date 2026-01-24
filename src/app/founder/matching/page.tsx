"use client";

import { useEffect, useState } from "react";
import {
    Users, Search, MapPin, TrendingUp, Mail, ExternalLink,
    UserPlus, Check, X, MessageSquare, Briefcase, Code, Compass,
    Loader2, Sparkles, Clock
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserData, getActiveStartup, Startup } from "@/lib/startup-service";
import { sendConnectionRequest, getConnectedUsers, getSentRequests } from "@/lib/connection-service";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";

interface UserWithStartup extends UserData {
    activeStartup?: Startup | null;
}

export default function MatchingPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserWithStartup[]>([]);
    const [connections, setConnections] = useState<string[]>([]);
    const [sentRequests, setSentRequests] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserWithStartup | null>(null);
    const router = useRouter();

    // 1. Real-time User Discovery
    useEffect(() => {
        if (!currentUser) return;

        const q = query(collection(db, "users"), where("uid", "!=", currentUser.uid));
        const unsubUsers = onSnapshot(q, async (snap) => {
            const rawUsers = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserData[];

            // Enrich with startups (One-time enrichment per change)
            const enriched = await Promise.all(rawUsers.map(async (u) => {
                const activeStartup = await getActiveStartup(u.uid);
                return { ...u, activeStartup };
            }));

            setUsers(enriched);
            setLoading(false);
        });

        // 2. Real-time Connection Tracking
        const unsubSent = getSentRequests(currentUser.uid, (ids) => setSentRequests(ids));

        const fetchConnections = async () => {
            const myConns = await getConnectedUsers(currentUser.uid);
            setConnections(myConns);
        };
        fetchConnections();

        return () => {
            unsubUsers();
            unsubSent();
        };
    }, [currentUser]);

    const handleConnect = async (targetId: string) => {
        if (!currentUser) return;
        try {
            await sendConnectionRequest(currentUser.uid, targetId);
        } catch (error) {
            console.error("Connection failed:", error);
        }
    };

    const filteredUsers = users.filter(user =>
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getStatus = (uid: string) => {
        if (connections.includes(uid)) return "connected";
        if (sentRequests.includes(uid)) return "pending";
        return "none";
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 p-6 md:p-12 animate-in fade-in duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-zinc-100 dark:border-zinc-800 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">
                        <Compass className="w-3.5 h-3.5" />
                        Ecosystem Discovery
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
                        Agentic <span className="text-zinc-400 dark:text-zinc-600">Matching</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-lg max-w-xl leading-relaxed">
                        Connect with real founders, investors, and talent in the ecosystem.
                    </p>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-1 bg-indigo-500/10 rounded-2xl blur-lg group-hover:bg-indigo-500/20 transition duration-500" />
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Filter by name, skill, or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all w-full md:w-[350px] font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Users Grid - Overhauled Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <AnimatePresence>
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-80 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                        ))
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => {
                            const status = getStatus(u.uid);
                            return (
                                <motion.div
                                    key={u.uid}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group relative bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-2xl transition-all duration-700 flex flex-col overflow-hidden"
                                >
                                    {/* Gradient Header */}
                                    <div className="h-24 w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />

                                    {/* Circular Avatar Body */}
                                    <div className="px-6 pb-8 -mt-12 flex flex-col items-center text-center flex-1">
                                        <div className="relative group/avatar mb-4">
                                            <div className="absolute -inset-1.5 bg-white dark:bg-zinc-950 rounded-full" />
                                            <div className="relative w-24 h-24 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-lg">
                                                <img
                                                    src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.displayName || u.uid}`}
                                                    alt={u.displayName || "User"}
                                                    className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700"
                                                />
                                            </div>
                                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-zinc-950 rounded-full shadow-sm" />
                                        </div>

                                        <h3 className="font-black text-xl text-zinc-900 dark:text-zinc-50 tracking-tight leading-none mb-1 group-hover:text-indigo-500 transition-colors">
                                            {u.displayName || "Anonymous User"}
                                        </h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 h-4">
                                            {u.role || "Ecosystem Member"}
                                        </p>

                                        {/* Industry / Skills */}
                                        <div className="space-y-4 w-full mb-8 pt-2">
                                            <div className="flex flex-wrap justify-center gap-1.5 min-h-[24px]">
                                                {u.activeStartup && (
                                                    <span className="px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                                                        {u.activeStartup.industry}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-zinc-500 font-medium line-clamp-2 px-2 italic">
                                                {u.about || "Building the next generation of intelligence protocols in stealth mode."}
                                            </p>
                                        </div>

                                        <div className="mt-auto grid grid-cols-2 gap-3 w-full">
                                            {status === "connected" ? (
                                                <button
                                                    onClick={() => router.push("/founder/chat")}
                                                    className="flex items-center justify-center gap-2 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.03] transition-all"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" /> Message
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleConnect(u.uid)}
                                                    disabled={status !== "none"}
                                                    className={cn(
                                                        "flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95",
                                                        status === "pending" && "bg-amber-500/10 text-amber-500 border border-amber-500/20",
                                                        status === "none" && "bg-black dark:bg-white text-white dark:text-black hover:scale-[1.03] shadow-lg shadow-black/5"
                                                    )}
                                                >
                                                    {status === "pending" ? (
                                                        <><Clock className="w-3.5 h-3.5" /> Pending</>
                                                    ) : (
                                                        <><UserPlus className="w-3.5 h-3.5" /> Connect</>
                                                    )}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setSelectedUser(u)}
                                                className="flex items-center justify-center gap-2 py-3.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                                            >
                                                Profile
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-20 text-center space-y-4">
                            <Users className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mx-auto" />
                            <p className="text-zinc-400 font-medium">No matches found in your ecosystem.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Detailed Profile Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 p-12"
                        >
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="w-32 h-32 rounded-full bg-zinc-50 dark:bg-zinc-900 p-1 border border-zinc-100 dark:border-zinc-800 shadow-xl">
                                    <img
                                        src={selectedUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.displayName || selectedUser.uid}`}
                                        className="w-full h-full rounded-full"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
                                        {selectedUser.displayName}
                                    </h2>
                                    <div className="flex items-center justify-center gap-4">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 px-3 py-1 bg-indigo-500/5 rounded-full">
                                            {selectedUser.role}
                                        </span>
                                        {selectedUser.location && (
                                            <span className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                                                <MapPin className="w-3 h-3" />
                                                {selectedUser.location}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 text-left pt-8 border-t border-zinc-50 dark:border-zinc-900">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 flex items-center gap-2">
                                            <Code className="w-3.5 h-3.5" />
                                            Core Skills
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {(selectedUser.skills || ["Innovation", "Strategy", "Execution"]).map(s => (
                                                <span key={s} className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 flex items-center gap-2">
                                            <Briefcase className="w-3.5 h-3.5" />
                                            Active Venture
                                        </h4>
                                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{selectedUser.activeStartup?.industry || "Uncategorized"}</p>
                                            <p className="text-sm font-semibold mb-2">{selectedUser.activeStartup?.name || "Independent Node"}</p>
                                            <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                                                "{selectedUser.activeStartup?.idea || "Synthesizing market opportunities..."}"
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 w-full flex gap-4">
                                    <button
                                        onClick={() => handleConnect(selectedUser.uid)}
                                        disabled={getStatus(selectedUser.uid) !== "none"}
                                        className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50"
                                    >
                                        {getStatus(selectedUser.uid) === "none" ? "Request Connection" : "Already Traversed"}
                                    </button>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="px-10 py-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-zinc-800"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AI Optimizer Section */}
            <div className="p-12 rounded-[3.5rem] bg-zinc-900 text-white overflow-hidden relative group border border-white/5">
                <div className="absolute top-0 right-0 p-16 opacity-[0.05] group-hover:scale-110 transition-transform duration-1000">
                    <TrendingUp className="w-64 h-64" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <TrendingUp className="w-5 h-5" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em]">Engine Optimizer</h4>
                        </div>
                        <h3 className="text-4xl font-black tracking-tighter">Boost Profile Visibility</h3>
                        <p className="text-zinc-500 font-medium max-w-md leading-relaxed">
                            Let the Matching Agent highlight your project to the top relevant investors based on your latest roadmap activity.
                        </p>
                    </div>
                    <button className="px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10 shrink-0">
                        Enable Growth Vector
                    </button>
                </div>
            </div>
        </div>
    );
}
